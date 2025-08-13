import express from 'express'
import cors from 'cors'

const app = express()

const allowed = [
  'http://localhost:5173',
  'https://pipi-first-web.onrender.com',
  'https://pipi123123.github.io'
]
app.use(cors({ origin: allowed }))
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))

const QS = '?%24top=50&%24skip=0'
const COA = `https://data.coa.gov.tw/Service/OpenData/AnimalOpenData.aspx${QS}`
const P1  = `https://r.jina.ai/http://data.coa.gov.tw/Service/OpenData/AnimalOpenData.aspx${QS}`
const P2  = `https://cors.isomorphic-git.org/https://data.coa.gov.tw/Service/OpenData/AnimalOpenData.aspx${QS}`

async function fetchText(url, ms = 20000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'furfriends/1.0',
        'Accept': 'application/json, text/plain, */*'
      },
      cache: 'no-store'
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return await r.text()
  } finally {
    clearTimeout(t)
  }
}

function safeParseJSON(txt) {
  try { return JSON.parse(txt) } catch {}
  try {
    const cleaned = String(txt || '').replace(/^\uFEFF/, '').trim()
    return JSON.parse(cleaned)
  } catch { return null }
}

async function fetchAsJson(url, ms) {
  const txt = await fetchText(url, ms)
  return safeParseJSON(txt)
}

app.get('/api/adopt', async (_req, res) => {
  const urls = [
    ['COA', COA],
    ['JINA', P1],
    ['ISO', P2],
  ]

  for (const [name, url] of urls) {
    try {
      const data = await fetchAsJson(`${url}&_ts=${Date.now()}`)
      if (Array.isArray(data)) {
        console.log(`[${name}] 成功，筆數:`, data.length)
        return res.json(data)
      }
      console.error(`[${name}] 非陣列回應`)
    } catch (e) {
      console.error(`[${name}] 失敗:`, e?.message || e)
    }
  }

  res.status(502).json({ message: 'Fetch failed', detail: 'JINA/ISO/COA all failed' })
})

app.get('/', (_req, res) => {
  res.send('Furfriends API is running. Try /api/health or /api/adopt')
})

const port = process.env.PORT || 3000
app.listen(port, () => console.log('API listening on', port))
