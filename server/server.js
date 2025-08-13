// server/server.js
import express from 'express'
import cors from 'cors'

const app = express()

// 允許的前端來源（請保留你的正式網域）
const allowed = [
  'http://localhost:5173',
  'https://pipi-first-web.onrender.com'
]
app.use(cors({ origin: allowed }))
app.use(express.json())

// 健康檢查
app.get('/api/health', (_req, res) => res.json({ ok: true }))

// 目標（COA）
const COA_PATH = 'data.coa.gov.tw/Service/OpenData/AnimalOpenData.aspx?$top=50&$skip=0'

// 代理 1：r.jina.ai（用 https 前綴）
const JINA_URL = `https://r.jina.ai/https://${COA_PATH}`
// 代理 2：isomorphic-git（有時更穩）
const ISO_URL  = `https://cors.isomorphic-git.org/https://${COA_PATH}`

// 小工具：安全 JSON 解析（去掉 BOM／多餘空白）
function safeParseJSON(text) {
  const cleaned = String(text ?? '').replace(/^\uFEFF/, '').trim()
  return JSON.parse(cleaned)
}

// 除錯用：看代理現在回什麼
app.get('/api/ping', async (_req, res) => {
  try {
    const r = await fetch(JINA_URL, {
      headers: {
        'user-agent': 'furfriends/1.0',
        'accept': 'application/json, text/plain, */*'
      },
      cache: 'no-store'
    })
    const txt = await r.text()
    return res.json({ ok: true, url: JINA_URL, status: r.status, length: txt.length })
  } catch (e) {
    return res.status(502).json({ ok: false, url: JINA_URL, error: String(e?.message || e) })
  }
})

// 正式資料 API（會自動備援）
app.get('/api/adopt', async (_req, res) => {
  // 依序嘗試的來源
  const SOURCES = [
    { name: 'JINA', url: JINA_URL },
    { name: 'ISO',  url: ISO_URL  },
  ]

  for (const s of SOURCES) {
    try {
      const r = await fetch(s.url, {
        headers: {
          'user-agent': 'furfriends/1.0',
          'accept': 'application/json, text/plain, */*'
        },
        cache: 'no-store'
      })
      // 即使 200 以外，有些代理仍回正文，先取 text 再試著解析
      const txt = await r.text()
      const data = safeParseJSON(txt)
      if (Array.isArray(data)) {
        return res.json(data)
      }
      // 不是陣列就當失敗，進下一個來源
      console.warn(`[${s.name}] unexpected payload`, typeof data)
    } catch (e) {
      console.warn(`[${s.name}] failed:`, e?.message || e)
    }
  }

  // 全部失敗
  return res.status(502).json({
    message: 'Fetch failed',
    detail: 'All sources failed (JINA/ISO)'
  })
})

// 方便看服務活著
app.get('/', (_req, res) => {
  res.send('Furfriends API is running. Try /api/health, /api/ping or /api/adopt')
})

const port = process.env.PORT || 3000
app.listen(port, () => console.log('API listening on', port))
