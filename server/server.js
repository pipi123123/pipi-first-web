import express from 'express'
import cors from 'cors'

const app = express()

// 允許的前端來源（依你的實際網域調整）
const allowed = [
  'http://localhost:5173',
  'https://pipi-first-web.onrender.com',  // Render 靜態站
  'https://pipi123123.github.io'          // 若你還用 GH Pages
]
app.use(cors({ origin: allowed }))
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// 兩個備援代理（避免 COA 直接擋）
const COA = 'https://data.coa.gov.tw/Service/OpenData/AnimalOpenData.aspx?$top=50&$skip=0'
const P1  = `https://r.jina.ai/http://data.coa.gov.tw/Service/OpenData/AnimalOpenData.aspx?$top=50&$skip=0`
const P2  = `https://cors.isomorphic-git.org/${COA}`

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

app.get('/api/adopt', async (_req, res) => {
  // 依序嘗試：COA → r.jina.ai → isomorphic-git CORS
  for (const [name, url, isText] of [
    ['COA', COA, false],
    ['JINA', P1, true],
    ['ISO', P2, false],
  ]) {
    try {
      const data = isText
        ? safeParseJSON(await fetchText(url))
        : await (await fetch(url, { headers: { 'User-Agent':'furfriends/1.0', 'Accept':'application/json' }, cache:'no-store' })).json()

      if (Array.isArray(data)) return res.json(data)
      // 有些代理會回字串，試圖解析
      const arr = Array.isArray(data) ? data : safeParseJSON(data)
      if (Array.isArray(arr)) return res.json(arr)

      console.error(`[${name}] 非陣列回應`)
    } catch (e) {
      console.error(`[${name}] 失敗:`, e?.name || '', e?.message || e)
    }
  }
  return res.status(502).json({ message: 'Fetch failed', detail: 'JINA/ISO/COA all failed' })
})

app.get('/', (_req, res) => {
  res.send('Furfriends API is running. Try /api/health or /api/adopt')
})

const port = process.env.PORT || 3000
app.listen(port, () => console.log('API listening on', port))
