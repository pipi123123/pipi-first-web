// src/services/petService.js
import axios from 'axios'

// 後端網址：優先用環境變數 VITE_API_URL；
// 如果沒設，就用目前網域（方便在 Render 靜態站上自動對同網域後端）。
const API_BASE =
  import.meta.env.VITE_API_URL?.trim() ||
  `${window.location.protocol}//${window.location.host}`

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
})

// 健康檢查
export const getHealth = () => api.get('/api/health')

// 取得認養清單（你的後端已經包好 CORS 與代理，這裡直接打）
export const getAdoptList = () => api.get('/api/adopt')

// 小工具：安全取陣列（可選）
export const toArray = (data) => (Array.isArray(data) ? data : [])
