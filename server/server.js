import express from 'express'
import cors from 'cors'

const app = express()
app.use(express.json())

// 允許的前端來源：本機 & 你的 GitHub Pages 網域
const allowed = ['http://localhost:5173', 'https://pipi123123.github.io']
app.use(cors({ origin: allowed }))

// 健康檢查
app.get('/api/health', (req, res) => res.json({ ok: true }))

// 代理 COA（建議用內建 fetch）
app.get('/api/adopt', async (req, res) => {
  const url = 'https://data.coa.gov.tw/Service/OpenData/AnimalOpenData.aspx?$top=50&$skip=0'
  try {
    const r = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'furfriends/1.0 (+https://github.com/pipi123123/pipi-first-web)'
      }
    })
    if (!r.ok) throw new Error(`Upstream ${r.status} ${r.statusText}`)
    const data = await r.json()
    res.json(Array.isArray(data) ? data : [])
  } catch (e) {
    console.error('[adopt] fetch error:', e)
    res.status(502).json({ message: 'Fetch failed', detail: String(e) })
  }
})

// ⚠️ 這裡一定要用 process.env.PORT（Render 會指定）
const port = process.env.PORT || 3000
app.listen(port, () => console.log(`API listening on http://localhost:${port}`))
