// server/server.js
import express from 'express'
import cors from 'cors'

const app = express()

/* =========================
   ✅ CORS 設定（支援多來源）
   ========================= */
const allowedOrigins = [
  'http://localhost:5173',                  // 本地開發
  'https://pipi-first-web.onrender.com',    // Render 正式版
  'https://pipi123123.github.io'            // GitHub Pages 版本
]

// ✅ 允許多個來源的 CORS 驗證
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      console.warn('[CORS BLOCKED] Origin:', origin)
      callback(new Error('Not allowed by CORS'))
    }
  }
}))

app.use(express.json())

/* =========================
   健康檢查 API
   ========================= */
app.get('/api/health', (_req, res) => res.json({ ok: true }))

/* =========================
   MOA 官方資料來源（直連）
   ========================= */
// 認養清單（動物認領養資料）
const MOA_ADOPT_HTTPS =
  'https://data.moa.gov.tw/Service/OpenData/TransService.aspx?UnitId=QcbUEzN6E6DL&IsTransData=1'

// 公立收容所清單
const MOA_SHELTER_HTTPS =
  'https://data.moa.gov.tw/Service/OpenData/TransService.aspx?UnitId=2thVboChxuKs&IsTransData=1'

/* =========================
   小工具：抓文字、解析 JSON
   ========================= */
async function fetchRaw(url, timeoutMs = 20000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent': 'furfriends/1.0',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    })
    const ok = r.ok
    const status = r.status
    const raw = await r.text()
    return { ok, status, raw }
  } finally {
    clearTimeout(t)
  }
}

function safeParseArrayJSON(raw) {
  try {
    const cleaned = String(raw || '').replace(/^\uFEFF/, '').trim()
    const data = JSON.parse(cleaned)
    return Array.isArray(data) ? data : null
  } catch {
    return null
  }
}

/* =========================
   認養資料 API
   GET /api/adopt
   ========================= */
app.get('/api/adopt', async (_req, res) => {
  try {
    const { ok, status, raw } = await fetchRaw(MOA_ADOPT_HTTPS)
    if (!ok) {
      console.warn(`[adopt:MOA] HTTP ${status}`)
      return res.status(status).send(raw || `HTTP ${status}`)
    }
    const data = safeParseArrayJSON(raw)
    if (!data) {
      console.warn('[adopt:MOA] 非陣列或解析失敗')
      return res.status(502).json({ message: 'Upstream is not array', preview: raw.slice(0, 300) })
    }
    console.log(`[adopt:MOA] OK, count=${data.length}`)
    res.set('Cache-Control', 'public, max-age=300')
    res.type('application/json; charset=utf-8')
    return res.send(JSON.stringify(data))
  } catch (e) {
    console.error('[adopt] fetch error:', e?.message || e)
    return res.status(502).json({ message: 'Fetch failed', error: String(e?.message || e) })
  }
})

/* =========================
   收容所清單 API
   GET /api/shelters
   ========================= */
app.get('/api/shelters', async (_req, res) => {
  try {
    const { ok, status, raw } = await fetchRaw(MOA_SHELTER_HTTPS)
    if (!ok) {
      console.warn(`[shelters:MOA] HTTP ${status}`)
      return res.status(status).send(raw || `HTTP ${status}`)
    }
    const data = safeParseArrayJSON(raw)
    if (!data) {
      console.warn('[shelters:MOA] 非陣列或解析失敗')
      return res.status(502).json({ message: 'Upstream is not array', preview: raw.slice(0, 300) })
    }
    console.log(`[shelters:MOA] OK, count=${data.length}`)
    res.set('Cache-Control', 'public, max-age=300')
    res.type('application/json; charset=utf-8')
    return res.send(JSON.stringify(data))
  } catch (e) {
    console.error('[shelters] fetch error:', e?.message || e)
    return res.status(502).json({ message: 'Fetch failed', error: String(e?.message || e) })
  }
})

/* =========================
   除錯端點（檢視原始字串）
   ========================= */
app.get('/api/_debug/moa/adopt', async (_req, res) => {
  const { ok, status, raw } = await fetchRaw(MOA_ADOPT_HTTPS)
  res.type('text/plain; charset=utf-8')
  res.send(`ok=${ok} status=${status}\nlen=${raw?.length ?? 0}\n--- first 1000 ---\n${(raw || '').slice(0, 1000)}`)
})

app.get('/api/_debug/moa/shelters', async (_req, res) => {
  const { ok, status, raw } = await fetchRaw(MOA_SHELTER_HTTPS)
  res.type('text/plain; charset=utf-8')
  res.send(`ok=${ok} status=${status}\nlen=${raw?.length ?? 0}\n--- first 1000 ---\n${(raw || '').slice(0, 1000)}`)
})

/* =========================
   根路由
   ========================= */
app.get('/', (_req, res) => {
  res.send('Furfriends API is running. Try /api/health, /api/adopt, /api/shelters')
})

/* =========================
   啟動
   ========================= */
const port = process.env.PORT || 3000
app.listen(port, () => console.log('✅ Furfriends API listening on', port))
