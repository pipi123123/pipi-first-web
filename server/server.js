import express from 'express'
import cors from 'cors'
import axios from 'axios'
import https from 'https'

const app = express()

// 允許的前端來源：本機 + 你的 Render 靜態站
const allowed = ['http://localhost:5173', 'https://pipi-first-web.onrender.com']
app.use(cors({ origin: allowed }))
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ ok: true }))

// 安全的 https agent
const httpsAgent = new https.Agent({ keepAlive: true })

// 主要來源（COA）
const COA_URL =
  'https://data.coa.gov.tw/Service/OpenData/AnimalOpenData.aspx?$top=50&$skip=0'

// 備援：公開 CORS 代理（只在伺服器端用，前端不要用）
const FALLBACK_URL =
  'https://cors.isomorphic-git.org/' + COA_URL

app.get('/api/adopt', async (req, res) => {
  try {
    // 先嘗試直接抓 COA
    const r = await axios.get(COA_URL, {
      timeout: 15000,
      httpsAgent,
      headers: {
        'User-Agent': 'furfriends/1.0',
        Accept: 'application/json'
      },
      // Render 有時需要這個選項避免部分 TLS 限制；先不開
      // validateStatus: () => true
    })
    const data = Array.isArray(r.data) ? r.data : []
    return res.json(data)
  } catch (e) {
    console.error('COA primary failed:', e.code || '', e.message)

    // 改用備援代理再嘗試一次
    try {
      const r2 = await axios.get(FALLBACK_URL, {
        timeout: 15000,
        httpsAgent,
        headers: {
          'User-Agent': 'furfriends/1.0',
          Accept: 'application/json'
        }
      })
      const data2 = Array.isArray(r2.data) ? r2.data : []
      return res.json(data2)
    } catch (e2) {
      console.error('COA fallback failed:', e2.code || '', e2.message)
      return res.status(502).json({
        message: 'Fetch failed',
        code: e2.code || '',
        detail: e2.message
      })
    }
  }
})

app.get('/', (req, res) => {
  res.send('Furfriends API is running. Try /api/health or /api/adopt')
})

const port = process.env.PORT || 3000
app.listen(port, () => console.log('API listening on', port))
