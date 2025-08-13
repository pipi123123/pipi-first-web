import express from 'express'
import cors from 'cors'
import axios from 'axios'
import https from 'https'

const app = express()

// 允許的前端來源：本機 + 你的 Render 靜態站
const allowed = ['http://localhost:5173', 'https://pipi-first-web.onrender.com']
app.use(cors({ origin: allowed }))
app.use(express.json())

// 健康檢查
app.get('/api/health', (req, res) => res.json({ ok: true }))

// https agent
const httpsAgent = new https.Agent({ keepAlive: true })

// 主要來源（COA）
const COA_URL =
  'https://data.coa.gov.tw/Service/OpenData/AnimalOpenData.aspx?$top=50&$skip=0'

// 備援1：公開 CORS 代理（只在伺服器用）
const PROXY1 = 'https://cors.isomorphic-git.org/' + COA_URL
// 備援2：r.jina.ai（把遠端頁面以文字回傳，內容仍是 JSON 字串）
const PROXY2 =
  'https://r.jina.ai/http://data.coa.gov.tw/Service/OpenData/AnimalOpenData.aspx?$top=50&$skip=0'

// 共同 headers
const COMMON_HEADERS = {
  'User-Agent': 'furfriends/1.0',
  'Accept': 'application/json'
}

// 將回應轉成陣列（jina 會回 string，要 JSON.parse）
function toArray(data) {
  if (Array.isArray(data)) return data
  if (typeof data === 'string') {
    try {
      const j = JSON.parse(data)
      return Array.isArray(j) ? j : []
    } catch {
      return []
    }
  }
  return []
}

// 主 API：依序嘗試 3 條路
app.get('/api/adopt', async (req, res) => {
  const tries = [
    { name: 'COA', url: COA_URL },
    { name: 'PROXY1', url: PROXY1 },
    { name: 'PROXY2', url: PROXY2 }
  ]

  for (const t of tries) {
    try {
      const r = await axios.get(t.url, {
        timeout: 15000,
        httpsAgent,
        headers: COMMON_HEADERS,
        // 保險：讓 axios 對 2xx 以外也丟錯，方便落到備援
        validateStatus: (s) => s >= 200 && s < 300
      })
      const data = toArray(r.data)
      console.log(`[adopt] OK via ${t.name}, count=${data.length}`)
      // 可選：簡單快取 5 分鐘，減少對來源壓力
      res.set('Cache-Control', 'public, max-age=300')
      return res.json(data)
    } catch (e) {
      const status = e.response?.status
      console.error(`[adopt] FAIL via ${t.name}`, status || e.code || e.message)
      // 繼續下一個備援
    }
  }

  // 全部失敗
  return res.status(502).json({
    message: 'Fetch failed',
    detail: 'All sources failed (COA/PROXY1/PROXY2)'
  })
})

// 根路由說明
app.get('/', (req, res) => {
  res.send('Furfriends API is running. Try /api/health or /api/adopt')
})

// 監聽 Render 的 PORT
const port = process.env.PORT || 3000
app.listen(port, () => console.log('API listening on', port))
