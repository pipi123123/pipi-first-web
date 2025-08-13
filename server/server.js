import express from 'express'
import cors from 'cors'
import axios from 'axios'
import https from 'https'
import dns from 'dns'

const app = express()

// 允許的前端來源
const allowed = ['http://localhost:5173', 'https://pipi-first-web.onrender.com']
app.use(cors({ origin: allowed }))
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ ok: true }))

// 強制 IPv4 的 lookup（很多雲端→公部門網站的連線問題都是 IPv6 造成）
const forceIPv4 = (hostname, options, cb) =>
  dns.lookup(hostname, { ...options, family: 4, all: false }, cb)

// 共用 https agent
const httpsAgent = new https.Agent({ keepAlive: true })

// 主要來源（COA）
const COA_URL = 'https://data.coa.gov.tw/Service/OpenData/AnimalOpenData.aspx?$top=50&$skip=0'
// 備援1：公開 CORS 代理（只在伺服器端用）
const PROXY1 = 'https://cors.isomorphic-git.org/' + COA_URL
// 備援2：r.jina.ai（回傳 text，需要 JSON.parse）
const PROXY2 = 'https://r.jina.ai/http://data.coa.gov.tw/Service/OpenData/AnimalOpenData.aspx?$top=50&$skip=0'

const COMMON_HEADERS = {
  'User-Agent': 'furfriends/1.0 (+https://pipi-first-web.onrender.com)',
  'Accept': 'application/json'
}

function toArray(data) {
  if (Array.isArray(data)) return data
  if (typeof data === 'string') {
    try { const j = JSON.parse(data); return Array.isArray(j) ? j : [] } catch { return [] }
  }
  return []
}

async function fetchOnce(name, url) {
  // r.jina.ai 只能回 text；其他走 json
  const isJina = url.startsWith('https://r.jina.ai/')
  const resp = await axios.get(url, {
    timeout: 15000,
    maxRedirects: 5,
    httpsAgent,
    lookup: forceIPv4,        // ★ 強制 IPv4
    headers: COMMON_HEADERS,
    responseType: isJina ? 'text' : 'json',
    validateStatus: (s) => s >= 200 && s < 300
  })
  const arr = toArray(resp.data)
  console.log(`[adopt] OK via ${name} status=${resp.status} count=${arr.length}`)
  return arr
}

app.get('/api/adopt', async (req, res) => {
  const tries = [
    { name: 'COA', url: COA_URL },
    { name: 'PROXY1', url: PROXY1 },
    { name: 'PROXY2', url: PROXY2 }
  ]

  for (const t of tries) {
    try {
      const data = await fetchOnce(t.name, t.url)
      res.set('Cache-Control', 'public, max-age=300')
      return res.json(data)
    } catch (e) {
      const status = e.response?.status
      const body = (() => {
        try { return JSON.stringify(e.response?.data)?.slice(0, 200) } catch { return '' }
      })()
      console.error(
        `[adopt] FAIL via ${t.name}`,
        `status=${status ?? ''}`,
        `code=${e.code ?? ''}`,
        `msg=${e.message}`,
        body ? `body=${body}` : ''
      )
      // 改試下一個備援
    }
  }

  return res.status(502).json({
    message: 'Fetch failed',
    detail: 'All sources failed (COA/PROXY1/PROXY2)'
  })
})

app.get('/', (req, res) => {
  res.send('Furfriends API is running. Try /api/health or /api/adopt')
})

const port = process.env.PORT || 3000
app.listen(port, () => console.log('API listening on', port))
