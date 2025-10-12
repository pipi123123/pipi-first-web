<!-- src/views/StatisticsPage.vue -->
<template>
  <div class="page page-skin page-grid view-stats">
    <div class="bg-blobs">
      <div class="blob b1"></div>
      <div class="blob b2"></div>
    </div>

    <div class="header">
      <h1>全國收容所收容處理統計</h1>
      <div class="src">
        資料來源：
        <a href="https://data.gov.tw/dataset/41236" target="_blank" rel="noopener">政府資料開放資料平台</a>
      </div>
    </div>

    <!-- 篩選列 -->
    <div class="toolbar" v-if="!loading && !error">
      <select v-model="year">
        <option :value="''">全部年度</option>
        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
      </select>

      <select v-model="city">
        <option :value="''">全部縣市</option>
        <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
      </select>

      <select v-model.number="month">
        <option :value="0">全部月份</option>
        <option v-for="m in 12" :key="m" :value="m">{{ m }} 月</option>
      </select>

      <button @click="reset">清除篩選</button>
    </div>

    <!-- 狀態 -->
    <div v-if="loading" class="status">載入中…</div>
    <div v-else-if="error" class="status error">載入失敗：{{ error }}</div>

    <!-- KPI -->
    <div v-else class="summary">
      <div class="sum-item">
        <div class="k">收容數</div>
        <div class="v">{{ total.accept.toLocaleString() }}</div>
      </div>
      <div class="sum-item">
        <div class="k">認領養數</div>
        <div class="v">{{ total.adopt.toLocaleString() }}</div>
      </div>
      <div class="sum-item">
        <div class="k">認領養率</div>
        <div class="v">{{ overallAdoptRate }}%</div>
      </div>
      <div class="sum-item">
        <div class="k">人道處理</div>
        <div class="v">{{ total.end.toLocaleString() }}</div>
      </div>
      <div class="sum-item">
        <div class="k">所內死亡</div>
        <div class="v">{{ total.dead.toLocaleString() }}</div>
      </div>
    </div>

    <!-- 表格 -->
    <div v-if="!loading && !error" class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>年度</th>
            <th>縣市</th>
            <th>月份</th>
            <th>收容數</th>
            <th>認領養數</th>
            <th>認領養率</th>
            <th>人道處理數</th>
            <th>所內死亡數</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rowsShown" :key="`${r.rpt_year}-${r.rpt_country}-${r.rpt_month}`">
            <td>{{ r.rpt_year }}</td>
            <td>{{ r.rpt_country }}</td>
            <td>{{ r.rpt_month || '—' }}</td>
            <td>{{ n(r.accept_num) }}</td>
            <td>{{ n(r.adopt_num) }}</td>
            <td>{{ rateText(r.adopt_rate) }}</td>
            <td>{{ n(r.end_num) }}</td>
            <td>{{ n(r.dead_num) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="pager" v-if="pages > 1">
        <button :disabled="page<=1" @click="page--">上一頁</button>
        <div>{{ page }} / {{ pages }}</div>
        <button :disabled="page>=pages" @click="page++">下一頁</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getShelterStatistics } from '@/services/petService'

const loading = ref(true)
const error   = ref('')
const allRows = ref([])

// 篩選
const year  = ref('')
const city  = ref('')
const month = ref(0)

// 分頁
const page     = ref(1)
const pageSize = 30

/* ----- 直接使用 service 已正規化好的資料（只做型別保險） ----- */
onMounted(async () => {
  try {
    const data = await getShelterStatistics()
    const arr  = Array.isArray(data) ? data : []

    allRows.value = arr.map((r, i) => ({
      _id         : r._id || `${r.rpt_year}-${r.rpt_country}-${r.rpt_month}-${i}`,
      rpt_year    : Number(r.rpt_year)  || '',
      rpt_month   : Number(r.rpt_month) || 0,
      rpt_country : String(r.rpt_country || '').trim(),
      accept_num  : Number(r.accept_num) || 0,
      adopt_num   : Number(r.adopt_num)  || 0,
      end_num     : Number(r.end_num)    || 0,
      dead_num    : Number(r.dead_num)   || 0,
      adopt_rate  : (() => {
        if (typeof r.adopt_rate === 'number') return r.adopt_rate
        const n = Number(String(r.adopt_rate ?? '').replace('%',''))
        return Number.isFinite(n) ? n : 0
      })(),
    }))

    // 預設選最新年度
    const ys = [...new Set(allRows.value.map(r => r.rpt_year))].filter(Boolean).sort((a,b)=>b-a)
    year.value = ys[0] ?? ''
  } catch (e) {
    error.value = String(e?.message || e)
  } finally {
    loading.value = false
  }
})

/* ----- 小工具（僅供顯示用） ----- */
function toHalfWidth(str = '') {
  return String(str)
    .replace(/[\uFF10-\uFF19]/g, d => String.fromCharCode(d.charCodeAt(0) - 0xFF10 + 0x30))
    .replace(/\uFF0C/g, ',').replace(/\uFF05/g, '%')
    .replace(/\uFF0E/g, '.').replace(/\u3000/g, ' ');
}
function toNum(v) {
  let s = toHalfWidth(String(v ?? ''))
  s = s.replace(/[% ,]/g, '')
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}
function n(v) { return toNum(v).toLocaleString() }
function rateText(v) {
  const num = Number(String(toHalfWidth(String(v ?? ''))).replace(/%/g, ''))
  return Number.isFinite(num) ? `${num.toFixed(2)}%` : '0.00%'
}

/* ----- UI 動作 / 篩選 / 聚合 ----- */
function reset () {
  year.value = ''
  city.value = ''
  month.value = 0
  page.value = 1
}

const years = computed(() => {
  return [...new Set(allRows.value.map(r => r.rpt_year))].filter(Boolean).sort((a,b)=>b-a)
})

const cities = computed(() => {
  const pool = allRows.value.filter(r => !year.value || r.rpt_year === year.value)
  return [...new Set(pool.map(r => r.rpt_country))].filter(Boolean).sort()
})

const filtered = computed(() => {
  let arr = allRows.value
  if (year.value)  arr = arr.filter(r => r.rpt_year === year.value)
  if (city.value)  arr = arr.filter(r => r.rpt_country === city.value)
  if (month.value) arr = arr.filter(r => Number(r.rpt_month) === Number(month.value))
  return arr
})

const total = computed(() => {
  return filtered.value.reduce((acc, r) => {
    acc.accept += Number(r.accept_num) || 0
    acc.adopt  += Number(r.adopt_num ) || 0
    acc.end    += Number(r.end_num   ) || 0
    acc.dead   += Number(r.dead_num  ) || 0
    return acc
  }, { accept:0, adopt:0, end:0, dead:0 })
})

const overallAdoptRate = computed(() => {
  const a = total.value.accept
  const b = total.value.adopt
  if (!a) return '0.00'
  return ((b / a) * 100).toFixed(2)
})

const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const rowsShown = computed(() => {
  const start = (page.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})

watch([filtered], () => {
  if (page.value > pages.value) page.value = pages.value
})
</script>

<style scoped>
.page { padding: 24px; }

/* 標題列 */
.header{
  display:flex; justify-content:space-between; align-items:end;
  gap:12px; margin-bottom:12px;
}
h1{ margin:0; font-size:22px; color:var(--ink); }
.src{ font-size:13px; color:var(--muted); }
.src a{ color:var(--accent); text-decoration:underline; }

/* 工具列 */
.toolbar{
  display:flex; flex-wrap:wrap; gap:12px; margin-bottom:12px;
}
.toolbar select, .toolbar button{ padding:8px 10px; }
.toolbar button{ cursor:pointer; }

/* 狀態 */
.status{ padding:8px 0; color:var(--muted); }
.status.error{ color:#d33; }

/* KPI */
.summary{
  display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap:12px; margin:12px 0 16px;
}
.sum-item{
  border:1px solid var(--line); border-radius:12px; padding:10px 12px;
  background:var(--surface); box-shadow: var(--shadow);
}
.sum-item .k{ font-size:12px; color:var(--muted); }
.sum-item .v{ font-size:20px; font-weight:800; color:var(--ink); }

/* 表格外框與卡片感 */
.table-wrap{
  overflow:auto;
  border-radius:12px;
  background:var(--surface);
  box-shadow: var(--shadow);
  border:1px solid var(--line);
}

/* 表格 */
.table{ width:100%; border-collapse:collapse; color:var(--ink); font-size:14px; }
th, td{
  border-bottom:1px solid var(--line);
  padding:10px 12px; text-align:center;
}
thead{ background:#f8fafc; }

/* 分頁器 */
.pager{
  display:flex; gap:12px; justify-content:center; align-items:center; margin-top:12px;
}
.pager button{
  padding:6px 12px; border:1px solid var(--line); border-radius:8px;
  background:var(--surface); cursor:pointer;
}
</style>
