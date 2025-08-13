import express from 'express'
import cors from 'cors'
import axios from 'axios'

const app = express()

// 允許的前端（依你的實際域名調整）
const allowed = [
  'http://localhost:5173',
  'https://pipi-first-web.onrender.com',   // 你的前端（Render 靜態站）
  'https://pipi123123.github.io'           // 如果你還有 GitHub Pages
]
app.use(cors({ origin: allowed }))
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// 直接走 r.jina.ai 公開代理（把 http:// 放在後面是它的規則）
const JINA_URL =
  'https://r.jina.ai/http://data.coa.gov.tw/Service/OpenData/AnimalOpenData.aspx?$top=50&$skip=0'

app.get('/api/adopt', async (_req, res) => {
  try {
    // r.jina.ai 回來通常是「純文字」，所以先當作 text 拿，再手動 JSON.parse
    const r = await axios.get(JINA_URL, {
      timeout: 20000,
      responseType: 'text',
      headers: {
        'User-Agent': 'furfriends/1.0',
        'Accept': 'application/json, text/plain, */*'
      },
      // 關閉自動轉換，以免 axios 嘗試幫你 parse 失敗
      transformResponse: [d => d]
    })

    let data
    try {
      data = JSON.parse(r.data)
    } catch {
      // 有些時候會包著 BOM 或非標準內容，這裡再寬鬆一點處理
      const cleaned = String(r.data || '')
        .replace(/^\uFEFF/, '') // 去掉 BOM
        .trim()
      data = JSON.parse(cleaned)
    }

    if (!Array.isArray(data)) data = []
    return res.json(data)
  } catch (e) {
    console.error('JINA proxy failed:', e?.code || '', e?.message || e)
    return res.status(502).json({
      message: 'Fetch failed',
      detail: 'JINA proxy failed'
    })
  }
})

app.get('/', (_req, res) => {
  res.send('Furfriends API is running. Try /api/health or /api/adopt')
})

const port = process.env.PORT || 3000
app.listen(port, () => console.log('API listening on', port))
