<template>
  <div class="page">
    <!-- 標題 + 右側資料來源 -->
    <div class="header">
      <h1>收容所清單</h1>
      <a
        class="source-link"
        href="https://data.gov.tw/dataset/134284"
        target="_blank"
        rel="noopener"
      >
        資料來源：政府開放資料平台－公立收容所資料
      </a>
    </div>

    <div class="toolbar">
      <input
        v-model="kw"
        type="search"
        placeholder="搜尋：縣市 / 名稱 / 地址 / 電話"
      />
      <select v-model="cityFilter">
        <option value="">全部縣市</option>
        <option v-for="c in cityOptions" :key="c.code" :value="c.code">
          {{ c.label }}（{{ c.code }}）
        </option>
      </select>
      <button @click="load" :disabled="loading">重新整理</button>
    </div>

    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th @click="sortBy('cityCode')">行政區</th>
            <th @click="sortBy('name')">名稱</th>
            <th @click="sortBy('phone')">電話</th>
            <th @click="sortBy('openTime')">開放時間</th>
            <th @click="sortBy('address')">地址</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in filteredSorted" :key="s.id">
            <td>{{ cityName(s.cityCode) }}</td>
            <td>{{ s.name }}</td>

            <!-- 電話可點擊；若無號碼顯示 '-' -->
            <td>
              <template v-if="s.phone">
                <a :href="phoneHref(s.phone)">{{ s.phone }}</a>
              </template>
              <template v-else>-</template>
            </td>

            <!-- 官方 OpenTime 可能含 <br/>；另外將 \n 轉 <br/> -->
            <td v-html="nl2br(s.openTime)"></td>

            <!-- 有座標用座標開地圖；沒座標但有地址就用地址開地圖 -->
            <td>
              <span>{{ s.address }}</span>
              <a
                v-if="mapHref(s)"
                class="map"
                :href="mapHref(s)"
                target="_blank"
                rel="noopener"
              >
                地圖
              </a>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-if="!loading && filteredSorted.length === 0" class="empty">
        查無符合資料。
      </p>
      <p v-if="loading" class="loading">載入中…</p>
      <p v-if="error" class="error">載入失敗：{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getShelters } from '@/services/petService'

const raw = ref([])
const loading = ref(false)
const error = ref('')

const kw = ref('')
const cityFilter = ref('')
const sortKey = ref('seq')
const sortAsc = ref(true)

// 常見城市代碼（可按需增修）
const cityOptions = [
  { code: '63000', label: '台北市' },
  { code: '65000', label: '新北市' },
  { code: '68000', label: '桃園市' },
  { code: '66000', label: '台中市' },
  { code: '67000', label: '台南市' },
  { code: '64000', label: '高雄市' },
  { code: '10017', label: '基隆市' },
  { code: '10018', label: '新竹市' },
  { code: '10004', label: '新竹縣' },
  { code: '10005', label: '苗栗縣' },
  { code: '10007', label: '彰化縣' },
  { code: '10008', label: '南投縣' },
  { code: '10009', label: '雲林縣' },
  { code: '10010', label: '嘉義縣' },
  { code: '10020', label: '嘉義市' },
  { code: '10013', label: '屏東縣' },
  { code: '10014', label: '台東縣' },
  { code: '10015', label: '花蓮縣' },
  { code: '10002', label: '宜蘭縣' },
  { code: '10016', label: '澎湖縣' },
  { code: '09020', label: '金門縣' },
  { code: '09007', label: '連江縣' }
]

function cityName(code) {
  return cityOptions.find(x => x.code === String(code))?.label || code || ''
}
function nl2br(s = '') {
  return String(s).replace(/\n/g, '<br/>')
}

// 電話 href：去掉空白
function phoneHref(p) {
  return `tel:${String(p).replace(/\s+/g, '')}`
}

// 地圖 href：優先 lat/lon；否則用地址
function mapHref(s) {
  if (s.lat && s.lon) return `https://www.google.com/maps?q=${s.lat},${s.lon}`
  if (s.address) return `https://www.google.com/maps?q=${encodeURIComponent(s.address)}`
  return ''
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await getShelters(cityFilter.value || undefined)
    raw.value = Array.isArray(data) ? data : []
  } catch (e) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
}

const filteredSorted = computed(() => {
  const q = kw.value.trim().toLowerCase()
  let arr = raw.value

  if (cityFilter.value) {
    arr = arr.filter(s => String(s.cityCode) === String(cityFilter.value))
  }

  if (q) {
    arr = arr.filter(s => {
      const blob = [cityName(s.cityCode), s.name, s.address, s.phone]
        .join(' ')
        .toLowerCase()
      return blob.includes(q)
    })
  }

  // 排序
  const k = sortKey.value
  const asc = sortAsc.value ? 1 : -1
  arr = [...arr].sort((a, b) => {
    const va = (a?.[k] ?? '').toString()
    const vb = (b?.[k] ?? '').toString()
    return va.localeCompare(vb, 'zh-Hant') * asc
  })
  return arr
})

function sortBy(k) {
  if (sortKey.value === k) {
    sortAsc.value = !sortAsc.value
  } else {
    sortKey.value = k
    sortAsc.value = true
  }
}

onMounted(load)
</script>

<style scoped>
.page {
  padding: 24px;
  background: #fff8f4;
  min-height: 100vh;
}

/* 標題列：左標題、右資料來源 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
h1 {
  margin: 0;
  font-size: 22px;
}
.source-link {
  font-size: 13px;
  color: #1a73e8;
  text-decoration: none;
  white-space: nowrap;
}
.source-link:hover {
  text-decoration: underline;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.toolbar input[type="search"] {
  flex: 1 1 260px;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
}
.toolbar select,
.toolbar button {
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
}

.table-wrap {
  overflow: auto;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
}
.table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  padding: 12px 14px;
  border-bottom: 1px solid #eee;
  vertical-align: top;
}
th {
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  background: #fafafa;
  font-weight: 600;
}
td .map {
  margin-left: 8px;
  font-size: 12px;
  text-decoration: underline;
}

.loading { padding: 16px; color: #666; }
.error   { padding: 16px; color: #b00020; }
.empty   { padding: 16px; color: #999; }
</style>
