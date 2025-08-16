// src/services/petService.js

// 後端網址：優先用 VITE_API_URL；否則使用目前網域
const rawBase =
  (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()) ||
  `${window.location.protocol}//${window.location.host}`;

// 去掉最後的斜線，避免 //api/xxx
const API_BASE = rawBase.replace(/\/+$/, '');

// 共用：用 fetch 發送請求（含 15 秒逾時）
// options 仍可傳 method / body / headers
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

// 小工具：嘗試多個路徑，成功一個就回傳
async function getFirstOk(paths) {
  let lastErr;
  for (const p of paths) {
    try {
      return await fetchJson(p);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('All endpoints failed');
}

// 健康檢查
export const getHealth = () => fetchJson('/api/health');

/**
 * 取得官方認養清單（/api/adopt）
 * 可帶 { top, skip }，預設 50/0
 * 後端會再去打 MOA OpenData。
 */
export const getAdoptList = async ({ top = 50, skip = 0 } = {}) => {
  const qs = new URLSearchParams({ top: String(top), skip: String(skip) }).toString();
  const raw = await fetchJson(`/api/adopt?${qs}`);
  return normalizeAdopts(raw);
};

// adopt 資料正規化：政府原始欄位 → 前端需要的欄位
function normalizeAdopts(data) {
  const arr = Array.isArray(data) ? data : [];

  return arr.map((x) => {
    const id = strOrEmpty(x.animal_id ?? x.id);
    const name = strOrEmpty(x.animal_kind ?? x.name ?? '動物');
    const sex = x.animal_sex === 'M' ? '公' : x.animal_sex === 'F' ? '母' : '未知';
    const color = strOrEmpty(x.animal_colour);
    const age = strOrEmpty(x.animal_age);
    const remark = strOrEmpty(x.animal_remark);

    // 關鍵：結紮/疫苗轉中文
    const spay =
      x.animal_sterilization === 'T'
        ? '已結紮'
        : x.animal_sterilization === 'F'
        ? '未結紮'
        : '未知';

    const vaccine =
      x.animal_bacterin === 'T'
        ? '已施打'
        : x.animal_bacterin === 'F'
        ? '未施打'
        : '未知';

    return {
      id,
      name,
      sex,
      color,
      age,
      remark,
      spay,
      vaccine,
      raw: x, // 保留原始資料給需要的地方
    };
  });
}

/**
 * 取得全台收容所清單（/api/shelters 等別名）
 * 後端回傳的是政府欄位：
 * ID / ShelterName / CityName / Address / Phone / OpenTime / Lon / Lat / Seq
 * 這裡統一映射成前端表格需要的欄位：
 * id / seq / name / cityCode / phone / openTime / address / lon / lat
 *
 * @param {string=} cityCode 可選，若傳入則在前端做一次過濾
 */
export async function getShelters(cityCode) {
  // 你後端同時提供了這三個別名，挑一個成功就用
  const raw = await getFirstOk([
    '/api/shelters',
    '/api/prime-shelters',
    '/api/shelter-list',
  ]);

  const list = normalizeShelters(raw);

  // 若有帶城市代碼就先過濾一次（和頁面上 select 的值一致）
  return cityCode
    ? list.filter((s) => String(s.cityCode) === String(cityCode))
    : list;
}

// —— 工具：把政府資料欄位轉成前端欄位 —— //
function normalizeShelters(data) {
  const arr = Array.isArray(data) ? data : [];

  return arr.map((x) => {
    const id =
      x.ID ??
      x.id ??
      x.Seq ??
      ('id_' + Math.random().toString(36).slice(2, 10));

    // 盡量保留原數值；如果是空字串就轉為空
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

function strOrEmpty(v) {
  return (v ?? '').toString().trim();
}
function numOrZero(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// 小工具：安全轉陣列（保留給其他地方用）
export const toArray = (data) => (Array.isArray(data) ? data : []);
