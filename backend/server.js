// backend/server.js
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose, { isValidObjectId } from 'mongoose'

dotenv.config()

/* ================== 基本設定 ================== */
const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

const PORT = process.env.PORT || 3000
const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('[ENV] 缺少 MONGODB_URI，請在 backend/.env 設定')
  process.exit(1)
}

/* ================== MongoDB 連線 ================== */
mongoose
  .connect(MONGODB_URI, { dbName: 'furfriends' })
  .then(() => console.log('[DB] MongoDB Atlas 已連線'))
  .catch((err) => {
    console.error('[DB] 連線失敗:', err.message)
    process.exit(1)
  })

app.get('/api/db/ping', async (_req, res) => {
  try {
    await mongoose.connection.db.admin().ping()
    res.json({ ok: true, state: mongoose.connection.readyState })
  } catch (err) {
    res.status(500).json({ ok: false, message: String(err?.message || err) })
  }
})

/* ================== Mongoose Model ================== */
const petSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: { type: String, required: true },
    description: { type: String, required: true },
  },
  { timestamps: true }
)
const Pet = mongoose.model('Pet', petSchema)

/* ================== 全域中介層 ================== */
app.use((req, res, next) => {
  const t = new Date().toISOString()
  console.log(`[REQ] ${req.method} ${req.url} @ ${t}`)
  res.set('x-from-backend', 'furfriends-api')
  next()
})

/* ================== 健康檢查 ================== */
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'backend', time: new Date().toISOString() })
})

app.get('/api/echo', (req, res) => {
  res.json({ ok: true, path: req.path, query: req.query, time: new Date().toISOString() })
})

/* ================== Pets CRUD ================== */
app.get('/api/pets', async (_req, res) => {
  try {
    const pets = await Pet.find().sort({ createdAt: -1 })
    console.log(`[HIT] /api/pets → 回傳 ${pets.length} 筆`)
    res.json(pets)
  } catch (err) {
    res.status(500).json({ ok: false, message: String(err?.message || err) })
  }
})

app.post('/api/pets', async (req, res) => {
  try {
    const { name, image, description } = req.body || {}
    if (!name || !image || !description) {
      return res.status(400).json({ ok: false, message: 'name/image/description 必填' })
    }
    const pet = await Pet.create({ name, image, description })
    console.log(`[HIT] POST /api/pets → 新增 id=${pet._id}`)
    res.status(201).json(pet)
  } catch (err) {
    res.status(500).json({ ok: false, message: String(err?.message || err) })
  }
})

app.put('/api/pets/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) return res.status(400).json({ ok: false, message: 'id 格式錯誤' })
    const { name, image, description } = req.body || {}
    const pet = await Pet.findByIdAndUpdate(
      id,
      { name, image, description },
      { new: true, runValidators: true }
    )
    if (!pet) return res.status(404).json({ ok: false, message: 'not found' })
    res.json(pet)
  } catch (err) {
    res.status(500).json({ ok: false, message: String(err?.message || err) })
  }
})

app.delete('/api/pets/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) return res.status(400).json({ ok: false, message: 'id 格式錯誤' })
    const pet = await Pet.findByIdAndDelete(id)
    if (!pet) return res.status(404).json({ ok: false, message: 'not found' })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ ok: false, message: String(err?.message || err) })
  }
})

/* ================== 政府資料代理 ================== */
const cache = Object.create(null)
const DEFAULT_TTL = 10 * 60 * 1000 // 10 分鐘

async function fetchWithCache(key, url, { ttl = DEFAULT_TTL, retries = 3, timeoutMs = 10000 } = {}) {
  const now = Date.now()
  if (cache[key] && now - cache[key].ts < ttl) {
    return { ok: true, data: cache[key].data, fromCache: true }
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), timeoutMs)

      const r = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal })
      clearTimeout(timeout)

      const txt = await r.text()
      const json = JSON.parse(txt)
      cache[key] = { ts: now, data: json }
      return { ok: true, data: json, fromCache: false }
    } catch (err) {
      console.warn(`[fetchRaw] (${attempt}/${retries}) ${url} failed: ${err.message}`)
      if (attempt === retries) break
      await new Promise((r) => setTimeout(r, 1000 * attempt))
    }
  }

  if (cache[key]) {
    console.log(`[cache] ${key} → return stale data`)
    return { ok: true, data: cache[key].data, fromCache: true }
  }

  return { ok: false, message: 'fetchRaw failed after retries' }
}

async function proxyJsonWithLog(reqPath, res, key, upstream, options) {
  try {
    const result = await fetchWithCache(key, upstream, options)
    if (result.ok) {
      const list = Array.isArray(result.data) ? result.data : []
      console.log(`[HIT] ${reqPath} → 回傳 ${list.length} 筆 ${result.fromCache ? '[快取]' : ''}`)
      res.set('Cache-Control', 'public, max-age=60')
      return res.json(list)
    }
    return res.status(502).json({
      ok: false,
      message: 'Upstream not JSON',
      detail: result.message,
    })
  } catch (err) {
    return res.status(500).json({ ok: false, message: String(err?.message || err) })
  }
}

/* ================== 代理路由 ================== */
const ADOPT_URL =
  'https://data.moa.gov.tw/Service/OpenData/TransService.aspx?UnitId=QcbUEzN6E6DL&IsTransData=1'
app.get('/api/adopt', (req, res) =>
  proxyJsonWithLog('/api/adopt', res, 'adopt', ADOPT_URL, { ttl: DEFAULT_TTL })
)

const LOST_URL =
  'https://data.moa.gov.tw/Service/OpenData/TransService.aspx?UnitId=IFJomqVzyB0i&IsTransData=1'
app.get('/api/lost', (req, res) =>
  proxyJsonWithLog('/api/lost', res, 'lost', LOST_URL, { ttl: DEFAULT_TTL })
)

const STATS_URL =
  'https://data.moa.gov.tw/Service/OpenData/TransService.aspx?UnitId=DyplMIk3U1hf&IsTransData=1'
app.get('/api/shelters/stats', (req, res) =>
  proxyJsonWithLog('/api/shelters/stats', res, 'stats', STATS_URL, { ttl: DEFAULT_TTL })
)

const SHELTERS_URL =
  'https://data.moa.gov.tw/Service/OpenData/TransService.aspx?UnitId=2thVboChxuKs&IsTransData=1'
app.get('/api/shelters', (req, res) =>
  proxyJsonWithLog('/api/shelters', res, 'shelters', SHELTERS_URL, { ttl: DEFAULT_TTL })
)

/* ================== 啟動服務 ================== */
const server = app.listen(PORT, () => {
  console.log(`Furfriends API listening on ${PORT}`)
})

const shutdown = () => {
  console.log('\n[SYS] Shutting down...')
  server.close(() => {
    mongoose.connection.close(false).then(() => {
      console.log('[DB] closed')
      process.exit(0)
    })
  })
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
