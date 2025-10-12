// backend/server.js
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose, { isValidObjectId } from 'mongoose'

// Node 18+ 內建 fetch（若 Node <18 才需安裝 node-fetch 並 import）
// import fetch from 'node-fetch';

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
// 移除已棄用參數（useNewUrlParser/useUnifiedTopology）；指定 dbName 即可
mongoose
  .connect(MONGODB_URI, { dbName: 'furfriends' })
  .then(() => console.log('[DB] MongoDB Atlas 已連線'))
  .catch((err) => {
    console.error('[DB] 連線失敗:', err.message)
    process.exit(1)
  })

// 連線狀態輔助路由
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
  { timestamps: true } // 自動 createdAt / updatedAt
)

const Pet = mongoose.model('Pet', petSchema)

/* ============ 全域中介層：請求日誌 + 回應標頭 ============ */
app.use((req, res, next) => {
  const t = new Date().toISOString()
  console.log(`[REQ] ${req.method} ${req.url} @ ${t}`)
  res.set('x-from-backend', 'furfriends-api')
  next()
})

/* ================== 健康檢查 / Echo ================== */
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'backend', time: new Date().toISOString() })
})

app.get('/api/echo', (req, res) => {
  res.json({ ok: true, path: req.path, query: req.query, time: new Date().toISOString() })
})

/* ================== Pets：MongoDB 版 CRUD ================== */
// 取得清單（新到舊）
app.get('/api/pets', async (_req, res) => {
  try {
    const pets = await Pet.find().sort({ createdAt: -1 })
    console.log(`[HIT] /api/pets → 回傳 ${pets.length} 筆（MongoDB）`)
    res.json(pets)
  } catch (err) {
    res.status(500).json({ ok: false, message: String(err?.message || err) })
  }
})

// 新增
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

// 更新
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
    console.log(`[HIT] PUT /api/pets/${id} → 已更新`)
    res.json(pet)
  } catch (err) {
    res.status(500).json({ ok: false, message: String(err?.message || err) })
  }
})

// 刪除
app.delete('/api/pets/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) return res.status(400).json({ ok: false, message: 'id 格式錯誤' })
    const pet = await Pet.findByIdAndDelete(id)
    if (!pet) return res.status(404).json({ ok: false, message: 'not found' })
    console.log(`[HIT] DELETE /api/pets/${id} → 刪除成功`)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ ok: false, message: String(err?.message || err) })
  }
})

/* ================== 政府資料代理 + 快取 ================== */
const cache = Object.create(null)
const DEFAULT_TTL = 10 * 60 * 1000 // 10 分鐘

async function fetchWithCache(key, url, { ttl = DEFAULT_TTL } = {}) {
  const now = Date.now()
  if (cache[key] && now - cache[key].ts < ttl) {
    return { ok: true, data: cache[key].data, fromCache: true }
  }
  const r = await fetch(url, { headers: { Accept: 'application/json' } })
  const txt = await r.text()
  try {
    const json = JSON.parse(txt)
    cache[key] = { ts: now, data: json }
    return { ok: true, data: json, fromCache: false }
  } catch {
    if (cache[key]) return { ok: true, data: cache[key].data, fromCache: true }
    return { ok: false, status: r.status, sample: txt.slice(0, 200) }
  }
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
      status: result.status,
      sample: result.sample,
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

/* ================== 啟動服務（含優雅關閉） ================== */
const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})

// 優雅關閉
const shutdown = () => {
  console.log('\n[SYS] Shutting down...')
  server.close(() => {
    mongoose.connection.close(false).then(() => {
      console.log('[DB] closed'); process.exit(0)
    })
  })
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
