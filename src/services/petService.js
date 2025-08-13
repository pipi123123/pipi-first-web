// src/services/petService.js
// 後端網址：優先用環境變數 VITE_API_URL；否則就用目前網域
const API_BASE =
  (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()) ||
  `${window.location.protocol}//${window.location.host}`;

// 共用：用 fetch 發送請求（含 15 秒逾時）
async function fetchJson(path, options = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      signal: ctrl.signal,
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

// 健康檢查
export const getHealth = () => fetchJson('/api/health');

// 取得認養清單（你的後端已有代理與 CORS）
export const getAdoptList = () => fetchJson('/api/adopt');

// 小工具：安全取陣列
export const toArray = (data) => (Array.isArray(data) ? data : []);
