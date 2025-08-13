import express from 'express'
import cors from 'cors'

const app = express()

// 允許的前端來源
const allowed = [
  'http://localhost:5173',
  'https://pipi-first-web.onrender.com',
  'https://pipi123123.github.io'
]
app.use(cors({ origin: allowed }))
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// 統一把 $ 轉成 %24，代理會比較穩
const QS = '?%24top=50&%24skip=0'
const COA_HTTPS = `https://data.coa.gov.tw/Service/OpenData/AnimalOpenData.aspx${QS}`
const COA_HTTP  = `http://data.coa.gov.tw/Service/OpenData/AnimalOpenData.aspx${QS}`

// 既有 3 條
const PROXY_JINA = `https://r.jina.ai/${COA_HTTP.replace('http://', 'http://')}` // http for jina
const PROXY_ISO  = `https://cors.isomorphic-git.org/${COA_HTTPS}`

// 新增 2 條公共代理（回 raw text）
const PROXY_AO   = `https://api.allorigins.win/raw?url=${encodeURIComponent(COA_HTTP)}`
const PROXY_CT   = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(COA_HTTPS)}`

// 文字抓取（含逾時）
async function fetchText(url, ms = 20000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url + (url.includes('?') ? '&' : '?') + `_ts=${Date.now()}`, {
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

// 安全 JSON 解析
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
  // 試的順序：JINA → ISO → COA → AllOrigins → CodeTabs
  const sources = [
    ['JINA', PROXY_JINA],
    ['ISO',  PROXY_ISO],
    ['COA',  COA_HTTPS],
    ['AO',   PROXY_AO],
    ['CT',   PROXY_CT],
  ]

  for (const [name, url] of sources) {
    try {
      const data = await fetchAsJson(url, 20000)
      if (Array.isArray(data)) {
        console.log(`[${name}] OK, count=${data.length}`)
        // 可選：快取 5 分鐘，提高穩定度
        res.set('Cache-Control', 'public, max-age=300')
        return res.json(data)
      }
      console.warn(`[${name}] 非陣列/解析失敗`)
    } catch (e) {
      console.warn(`[${name}] 失敗:`, e?.message || e)
    }
  }

  return res.status(502).json({ message: 'Fetch failed', detail: 'All sources failed (JINA/ISO/COA/AO/CT)' })
})

app.get('/', (_req, res) => {
  res.send('Furfriends API is running. Try /api/health or /api/adopt')
})

const port = process.env.PORT || 3000
app.listen(port, () => console.log('API listening on', port))
