// src/services/petService.js
// 前端只打自己的後端；開發走 Vite proxy，正式用 VITE_API_URL / VITE_API_BASE

/* ===================== 基本設定 ===================== */
// 若設定了 VITE_API_BASE / VITE_API_URL，使用該絕對位址；
// 否則使用「相對路徑」(空字串) 讓 Vite 開發伺服器把 /api 代理到後端。
const pick = (v) => (typeof v === 'string' ? v.trim() : '');
const envBase =
  pick(import.meta.env.VITE_API_BASE) ||
  pick(import.meta.env.VITE_API_URL) ||
  '';
const API_BASE = envBase ? envBase.replace(/\/+$/, '') : ''; // '' 代表相對路徑，會走 proxy

/* ===================== 共用 fetch（15 秒逾時） ===================== */
async function fetchJson(path, options = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json', ...(options.headers || {}) },
      signal: ctrl.signal,
      cache: 'no-store',
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/* ===================== 健康檢查 ===================== */
export const getHealth = () => fetchJson('/api/health');

/* ===================== 認養清單 ===================== */
// 不預設分頁：只有呼叫端傳 top/skip 才會帶 query；
// 沒帶就請後端回完整清單（由後端決定是否裁切/快取）
export const getAdoptList = async ({ top, skip } = {}) => {
  const params = new URLSearchParams();
  if (top !== undefined && top !== null) params.set('top', String(top));
  if (skip !== undefined && skip !== null) params.set('skip', String(skip || 0));
  const qs = params.toString() ? `?${params.toString()}` : '';
  return await fetchJson(`/api/adopt${qs}`);
};

/* ===================== 收容所清單 ===================== */
export async function getShelters(cityCode) {
  const raw = await fetchJson('/api/shelters');
  const list = normalizeShelters(raw);
  return cityCode ? list.filter((s) => String(s.cityCode) === String(cityCode)) : list;
}

function normalizeShelters(data) {
  const arr = Array.isArray(data) ? data : [];
  return arr.map((x) => {
    const id = x.ID ?? x.id ?? x.Seq ?? 'id_' + Math.random().toString(36).slice(2, 10);
    const seq = numOrZero(x.Seq);
    const name = strOrEmpty(x.ShelterName ?? x.name);
    const cityCode = String(x.CityName ?? x.cityCode ?? '').trim();
    const phone = strOrEmpty(x.Phone ?? x.phone);
    const openTime = strOrEmpty(x.OpenTime ?? x.openTime);
    const address = strOrEmpty(x.Address ?? x.address);
    const lon = strOrEmpty(x.Lon ?? x.lon);
    const lat = strOrEmpty(x.Lat ?? x.lat);
    return { id, seq, name, cityCode, phone, openTime, address, lon, lat };
  });
}

/* ===================== 遺失啟事 ===================== */
export async function getLostList() {
  const raw = await fetchJson('/api/lost');
  return Array.isArray(raw) ? raw : [];
}

export async function getLostListNormalized() {
  const list = await getLostList();
  return normalizeLost(list);
}

export function normalizeLost(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr.map((x) => {
    const id =
      g(x, '晶片號碼', '晶片編號', '編號') ||
      g(x, 'PICTURE') ||
      'lost_' + Math.random().toString(36).slice(2, 10);

    return {
      id,
      chipNo: g(x, '晶片號碼', '晶片編號', '編號'),
      name: g(x, '寵物名', '動物名'),
      kind: g(x, '寵物別', '寵物種類', '動物別'),
      sex: g(x, '性別'),
      variety: g(x, '品種'),
      color: g(x, '毛色'),
      appearance: g(x, '外觀'),
      feature: g(x, '特徵'),
      lostDate: g(x, '遺失時間', '遺失日期'),
      lostPlace: g(x, '遺失地點'),
      keeper: g(x, '飼主姓名', '聯絡人', '聯絡姓名', '連絡人'),
      phone: g(x, '聯絡電話', '連絡電話', '電話'),
      email: g(x, 'Email', 'EMail', 'EMAIL'),
      picture: g(x, 'PICTURE'),
      raw: x,
    };
  });
}

/* ===================== 收容所統計 ===================== */
export async function getShelterStatistics() {
  const raw = await fetchJson('/api/shelters/stats');
  return normalizeStats(raw);
}

function normalizeStats(data) {
  const arr = Array.isArray(data) ? data : [];

  return arr.map((x) => {
    // 年 / 月 / 縣市（寬鬆抓取）
    const rpt_year  = pickYearLoose(x);
    const rpt_month = pickMonthLoose(x);
    let   rpt_country = pickCityLoose(x);

    // 若像 City000xxx，嘗試從其他中文值猜一個縣市名稱
    if (!rpt_country || /^city0*\d+/i.test(rpt_country)) {
      const guess = Object.values(x).find(v => {
        const sv = String(v ?? '').trim();
        return /[\u4e00-\u9fff]/.test(sv) && /[市縣]/.test(sv) && !/^\d+$/.test(sv);
      });
      if (guess) rpt_country = String(guess).trim();
    }

    // 數字欄位（關鍵字包含比對）
    const accept_num = toNum(
      pickByKeyIncludes(x, [
        'accept_num','accept','收容','收容數','收容(隻)','入所','入所數','進所','進所數'
      ]) ?? x.accept_num ?? x.AcceptNum
    );

    const adopt_num_raw = pickByKeyIncludes(x, [
      'adopt_num','adopt','認領養','認養','領養','認領養數','認養數','領養數','認領養(隻)'
    ]) ?? x.adopt_num ?? x.AdoptNum;
    let adopt_num = toNum(adopt_num_raw);

    const end_num = toNum(
      pickByKeyIncludes(x, [
        'end_num','end','euthanasia','人道處理','人道處理數','安樂','安樂死','撲殺'
      ]) ?? x.end_num ?? x.EndNum ?? x.euthanasia_num
    );

    const dead_num = toNum(
      pickByKeyIncludes(x, [
        'dead_num','dead','inside_dead','所內死','所內死亡','所內死亡數','死亡','死亡數'
      ]) ?? x.dead_num ?? x.DeadNum ?? x.inside_dead_num
    );

    // 認領養率：接受「xx%」或「0~1」與純數字
    let adopt_rate = (() => {
      const v = pickByKeyIncludes(x, ['adopt_rate','認領養率','領養率'])
             ?? x.adopt_rate ?? x.AdoptRate ?? x.認領養率;
      if (v == null || v === '') return 0;
      const s = toHalfWidth(String(v));
      if (s.includes('%')) {
        const n = parseFloat(s.replace('%',''));
        return Number.isFinite(n) ? n : 0;
      }
      const n = Number(s);
      if (!Number.isFinite(n)) return 0;
      return n <= 1 ? n * 100 : n;
    })();

    // 互相推導（避免來源缺欄位）
    if (adopt_rate && !adopt_num && accept_num) {
      adopt_num = Math.round(accept_num * (adopt_rate / 100));
    } else if (adopt_rate && adopt_num && !accept_num) {
      const r = adopt_rate / 100;
      if (r > 0) {
        const a = Math.round(adopt_num / r);
        if (Number.isFinite(a)) {
          // 合理時才回填（不強迫覆蓋）
          // accept_num = accept_num || a; // 若你想自動補齊可開啟
        }
      }
    } else if (!adopt_rate && accept_num > 0) {
      adopt_rate = (adopt_num / accept_num) * 100;
    }

    return {
      rpt_year,
      rpt_country,
      rpt_month,
      accept_num,
      adopt_num,
      adopt_rate, // 0~100
      end_num,
      dead_num,
      raw: x,
    };
  });
}

/* ===================== 小工具 ===================== */
// 寬鬆鍵名：優先回不為空的值；也支援 "key(key)" 這種奇形欄位名
function pickLoose(obj, ...keys) {
  for (const k of keys) {
    if (obj && obj[k] != null && String(obj[k]).trim() !== '') return obj[k];
    const withParen = `${k}(${k})`;
    if (obj && obj[withParen] != null && String(obj[withParen]).trim() !== '') return obj[withParen];
  }
  return '';
}
// 以「關鍵字包含」挑值（鍵名先做全形轉半形、轉小寫）
function pickByKeyIncludes(obj, keywords = []) {
  const list = Object.entries(obj || {}).map(([k, v]) => [toHalfWidth(String(k)).toLowerCase(), v]);
  for (const [k, v] of list) {
    if (keywords.some(kw => k.includes(kw))) {
      const vs = String(v ?? '').trim();
      if (vs !== '') return v;
    }
  }
  return undefined;
}

// 年 / 月 / 縣市（寬鬆抓）
function pickYearLoose(o) {
  return toNum(pickByKeyIncludes(o, ['rpt_year', 'year', '年度']) ?? o.rpt_year ?? o.Year ?? o.年度) || '';
}
function pickMonthLoose(o) {
  const m = toNum(pickByKeyIncludes(o, ['rpt_month', 'month', '月份']) ?? o.rpt_month ?? o.Month ?? o.月份);
  return m >= 1 && m <= 12 ? m : 0;
}
function pickCityLoose(o) {
  const v = pickByKeyIncludes(o, ['rpt_country', 'cityname', 'country', '縣市', '行政區'])
         ?? o.rpt_country ?? o.CityName ?? o.country ?? o.縣市 ?? o.行政區;
  return String(v ?? '').trim();
}

export const toArray = (data) => (Array.isArray(data) ? data : []);

// 其餘通用
function g(obj, ...keys) { return String(pickLoose(obj, ...keys) ?? '').trim(); }
function strOrEmpty(v) { return (v ?? '').toString().trim(); }
function numOrZero(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

function toHalfWidth(str = '') {
  return String(str)
    .replace(/[\uFF10-\uFF19]/g, d => String.fromCharCode(d.charCodeAt(0) - 0xFF10 + 0x30))
    .replace(/\uFF0C/g, ',').replace(/\uFF05/g, '%').replace(/\uFF0E/g, '.').replace(/\u3000/g, ' ');
}
function toNum(v) {
  const s = toHalfWidth(String(v ?? '')).replace(/[% ,]/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}
