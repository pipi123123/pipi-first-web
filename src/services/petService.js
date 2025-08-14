// src/services/petService.js

// 後端網址：優先用 VITE_API_URL；否則使用目前網域
const rawBase =
  (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()) ||
  `${window.location.protocol}//${window.location.host}`;

// 去掉最後的斜線，避免 //api/xxx
const API_BASE = rawBase.replace(/\/+$/, "");

// 共用：用 fetch 發送請求（含 15 秒逾時）
// options 仍可傳 method / body / headers
async function fetchJson(path, options = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);

  try {
    const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
    const res = await fetch(url, {
      // GET 不一定要帶 content-type，這裡僅 Accept JSON
      headers: { Accept: "application/json", ...(options.headers || {}) },
      signal: ctrl.signal,
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
  throw lastErr || new Error("All endpoints failed");
}

// 健康檢查
export const getHealth = () => fetchJson("/api/health");

// 取得認養清單（可選 top/skip，預設 50/0）
export const getAdoptList = ({ top = 50, skip = 0 } = {}) => {
  const qs = new URLSearchParams({ top: String(top), skip: String(skip) }).toString();
  return fetchJson(`/api/adopt?${qs}`);
};

// 取得全台收容所清單（自動嘗試多個常見路徑，擇一成功）
export const getShelters = () =>
  getFirstOk([
    "/api/shelters",        // 建議你的 Worker 走這個
    "/api/prime-shelters",  // 你若用到「農業部多元格式參考資料」可對應這個
    "/api/shelter-list",    // 備用別名
  ]);

// 小工具：安全轉陣列
export const toArray = (data) => (Array.isArray(data) ? data : []);
