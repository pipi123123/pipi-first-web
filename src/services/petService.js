// src/services/petService.js

// -----------------------------
// 基本設定：後端 base URL
// -----------------------------
const rawBase =
  (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()) ||
  `${window.location.protocol}//${window.location.host}`;

// 去掉最後的斜線，避免 //api/xxx
const API_BASE = rawBase.replace(/\/+$/, "");

// 政府 OpenData（備援）— 寵物遺失啟事 Dataset
const MOA_LOST_URL =
  "https://data.moa.gov.tw/Service/OpenData/TransService.aspx?UnitId=IFJomqVzyB0i&IsTransData=1";

// 政府 OpenData（備援）— 全國公立動物收容所收容處理統計表
const MOA_STATS_URL =
  "https://data.moa.gov.tw/Service/OpenData/TransService.aspx?UnitId=DyplMIk3U1hf&IsTransData=1";

// -----------------------------
// 共用：fetch JSON（含 15 秒逾時）
// -----------------------------
async function fetchJson(path, options = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);

  try {
    const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", ...(options.headers || {}) },
      signal: ctrl.signal,
      cache: "no-store",
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// -----------------------------
// 通用：直接抓政府 OpenData（完整 URL）
// -----------------------------
export async function getGovData(endpoint, params = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);

  try {
    const qs = new URLSearchParams(params).toString();
    const url = qs ? `${endpoint}${endpoint.includes("?") ? "&" : "?"}${qs}` : endpoint;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// -----------------------------
// 工具：嘗試多個路徑，成功一個就回傳
// -----------------------------
async function getFirstOk(paths) {
  let lastErr;
  for (const p of paths) {
    try {
      return await fetchJson(p);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("All endpoints failed");
}

// -----------------------------
// 健康檢查
// -----------------------------
export const getHealth = () => fetchJson("/api/health");

// -----------------------------
// 認養清單（採原始欄位，不做正規化）
//   - 後端路徑：/api/adopt?top=&skip=
// -----------------------------
export const getAdoptList = async ({ top = 50, skip = 0 } = {}) => {
  const qs = new URLSearchParams({ top: String(top), skip: String(skip) }).toString();
  return await fetchJson(`/api/adopt?${qs}`);
};

// -----------------------------
// 收容所清單（同前，嘗試多個別名）
//   - 回傳欄位：{ id, seq, name, cityCode, phone, openTime, address, lon, lat }
// -----------------------------
export async function getShelters(cityCode) {
  const raw = await getFirstOk(["/api/shelters", "/api/prime-shelters", "/api/shelter-list"]);
  const list = normalizeShelters(raw);
  return cityCode ? list.filter((s) => String(s.cityCode) === String(cityCode)) : list;
}

function normalizeShelters(data) {
  const arr = Array.isArray(data) ? data : [];
  return arr.map((x) => {
    const id =
      x.ID ?? x.id ?? x.Seq ?? "id_" + Math.random().toString(36).slice(2, 10);
    const seq = numOrZero(x.Seq);
    const name = strOrEmpty(x.ShelterName ?? x.name);
    const cityCode = String(x.CityName ?? x.cityCode ?? "").trim();
    const phone = strOrEmpty(x.Phone ?? x.phone);
    const openTime = strOrEmpty(x.OpenTime ?? x.openTime);
    const address = strOrEmpty(x.Address ?? x.address);
    const lon = strOrEmpty(x.Lon ?? x.lon);
    const lat = strOrEmpty(x.Lat ?? x.lat);
    return { id, seq, name, cityCode, phone, openTime, address, lon, lat };
  });
}

// -----------------------------
// 寵物遺失啟事
//   - 先打你的後端 /api/lost，失敗再抓政府 OpenData
//   - getLostList()：回傳原始陣列（保持相容）
//   - getLostListNormalized()：回傳「統一欄位」陣列（建議頁面使用）
// -----------------------------
export async function getLostList() {
  try {
    const raw = await fetchJson("/api/lost");
    return Array.isArray(raw) ? raw : [];
  } catch {
    const gov = await getGovData(MOA_LOST_URL);
    return Array.isArray(gov) ? gov : [];
  }
}

// 建議 LostPage 改用這個
export async function getLostListNormalized() {
  const list = await getLostList();
  return normalizeLost(list);
}

// -----------------------------
// 把政府遺失啟事轉成統一欄位（更耐 key 名稱差異）
// -----------------------------
export function normalizeLost(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr.map((x) => {
    const id =
      g(x, "晶片號碼", "晶片編號", "編號") ||
      g(x, "PICTURE") ||
      "lost_" + Math.random().toString(36).slice(2, 10);

    return {
      id,
      chipNo: g(x, "晶片號碼", "晶片編號", "編號"),
      name: g(x, "寵物名", "動物名"),
      // 種別
      kind: g(x, "寵物別", "寵物種類", "動物別"),
      // 性別
      sex: g(x, "性別"),
      // 品種 / 毛色 / 外觀 / 特徵
      variety: g(x, "品種"),
      color: g(x, "毛色"),
      appearance: g(x, "外觀"),
      feature: g(x, "特徵"),
      // 遺失資訊
      lostDate: g(x, "遺失時間", "遺失日期"),
      lostPlace: g(x, "遺失地點"),
      // 聯絡資訊（政府資料常見不同寫法）
      keeper: g(x, "飼主姓名", "聯絡人", "聯絡姓名", "連絡人"),
      phone: g(x, "聯絡電話", "連絡電話", "電話"),
      email: g(x, "Email", "EMail", "EMAIL"),
      // 圖片
      picture: g(x, "PICTURE"),
      // 保留原始
      raw: x,
    };
  });
}

// -----------------------------
// 收容所「收容處理統計」
//   - 先打你的後端 /api/shelters/stats（若有）
//   - 失敗則回退政府 OpenData（MOA_STATS_URL）
//   - 回傳官方原始欄位：rpt_year / rpt_country / rpt_month / accept_num / adopt_num / adopt_rate / end_num / dead_num
// -----------------------------
export async function getShelterStatistics() {
  try {
    // 若你的後端提供代理或快取這份資料，優先使用自己的 API
    return await fetchJson("/api/shelters/stats");
  } catch {
    // 後端沒有或失敗 → 直接抓政府開放資料
    return await getGovData(MOA_STATS_URL);
  }
}

// -----------------------------
// 小工具
// -----------------------------
function g(obj, ...keys) {
  for (const k of keys) {
    // 1) 直接 key
    if (obj[k] != null && String(obj[k]).trim() !== "") return String(obj[k]).trim();
    // 2) 帶括號版本（部分來源會出現）
    const withParen = `${k}(${k})`;
    if (obj[withParen] != null && String(obj[withParen]).trim() !== "") {
      return String(obj[withParen]).trim();
    }
  }
  return "";
}

function strOrEmpty(v) {
  return (v ?? "").toString().trim();
}

function numOrZero(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export const toArray = (data) => (Array.isArray(data) ? data : []);
