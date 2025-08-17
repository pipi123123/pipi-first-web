<!-- src/views/LostPage.vue -->
<template>
  <div class="page">
    <!-- 標題 + 資料來源 -->
    <div class="header">
      <h1>寵物遺失啟事</h1>
      <div class="source">
        資料來源：
        <a
          href="https://data.gov.tw/dataset/77682"
          target="_blank"
          rel="noopener"
        >
          政府資料開放平台－寵物遺失啟事
        </a>
      </div>
    </div>

    <!-- 篩選列 -->
    <div class="filters">
      <input
        v-model="kw"
        class="search"
        type="search"
        placeholder="搜尋：寵物名 / 品種 / 晶片 / 遺失地點"
        @input="toFirstPage"
      />

      <select v-model="kind" class="select" @change="toFirstPage">
        <option value="ALL">不限種類</option>
        <option value="狗">狗</option>
        <option value="貓">貓</option>
      </select>

      <select v-model="sex" class="select" @change="toFirstPage">
        <option value="ALL">不限性別</option>
        <option value="公">公</option>
        <option value="母">母</option>
      </select>

      <label class="chk">
        <input type="checkbox" v-model="onlyPhoto" @change="toFirstPage" />
        只顯示有照片
      </label>

      <div class="actions">
        <button class="secondary" @click="reload" :disabled="loading">重新整理</button>
        <button class="warning" @click="clearFilters">清除篩選</button>
      </div>
    </div>

    <!-- 狀態列 -->
    <div v-if="loading" class="status">載入中…</div>
    <div v-else-if="error" class="status error">載入失敗：{{ error }}</div>
    <div v-else class="status">
      共 {{ filteredCount.toLocaleString() }} 筆，
      顯示第 {{ startIndex + 1 }}–{{ endIndex }} 筆（第 {{ page }} / {{ totalPages }} 頁）
    </div>

    <!-- 清單 -->
    <div v-if="!loading && !error">
      <div v-if="visibleItems.length" class="grid">
        <article v-for="it in visibleItems" :key="it.id" class="card">
          <div class="img-wrap">
            <img :src="imgSrc(it.picture)" :alt="it.name || it.kind" loading="lazy" @error="onImgErr" />
            <div class="badges">
              <span class="badge kind">{{ it.kind || '寵物' }}</span>
              <span class="badge sex" :data-sex="sexTag(it.sex)">{{ it.sex || '未知' }}</span>
            </div>
          </div>

          <h3 class="title">
            {{ it.name || '（未填名稱）' }}
            <small v-if="it.variety" class="variety">｜{{ it.variety }}</small>
          </h3>

          <ul class="attrs">
            <li v-if="it.chipNo"><i>#</i> 晶片：{{ it.chipNo }}</li>
            <li v-if="it.lostDate"><i>🕒</i> 遺失時間：{{ it.lostDate }}</li>
            <li v-if="it.lostPlace"><i>📍</i> 遺失地點：{{ it.lostPlace }}</li>
            <li v-if="it.color"><i>🎨</i> 毛色：{{ it.color }}</li>
            <li v-if="it.appearance"><i>📝</i> 外觀：{{ it.appearance }}</li>
            <li v-if="it.feature"><i>🔎</i> 特徵：{{ it.feature }}</li>
            <li v-if="it.keeper"><i>👤</i> 飼主：{{ it.keeper }}</li>
            <li v-if="it.phone"><i>☎️</i> 電話：<a :href="`tel:${cleanPhone(it.phone)}`">{{ it.phone }}</a></li>
            <li v-if="it.email"><i>✉️</i> Email：<a :href="`mailto:${it.email}`">{{ it.email }}</a></li>
          </ul>
        </article>
      </div>

      <div v-else class="status">沒有符合條件的資料</div>

      <div v-if="totalPages > 1" class="pager">
        <button :disabled="page<=1" @click="prevPage">上一頁</button>
        <div>{{ page }} / {{ totalPages }}</div>
        <button :disabled="page>=totalPages" @click="nextPage">下一頁</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
// ✅ 改成直接取「統一欄位」的清單
import { getLostListNormalized } from '@/services/petService'

// 狀態
const loading = ref(true)
const error = ref('')
const list = ref([])          // 已正規化的清單
const page = ref(1)
const pageSize = 24

// 篩選
const kw = ref('')
const kind = ref('ALL')  // ALL | 狗 | 貓
const sex  = ref('ALL')  // ALL | 公 | 母
const onlyPhoto = ref(false)

// 取資料
async function reload () {
  loading.value = true
  error.value = ''
  try {
    list.value = await getLostListNormalized()  // ⬅️ 直接吃統一欄位
    page.value = 1
  } catch (e) {
    error.value = String(e?.message || e)
  } finally {
    loading.value = false
  }
}

// 是否有有效照片
function hasPhoto(p) {
  const s = String(p || '').trim()
  return !!s && s.toLowerCase() !== 'null' && s.toLowerCase() !== 'undefined'
}

// 篩選 + 搜尋
const filtered = computed(() => {
  let arr = list.value

  if (onlyPhoto.value) arr = arr.filter(x => hasPhoto(x.picture))

  if (kind.value !== 'ALL') arr = arr.filter(x => (x.kind || '').trim() === kind.value)
  if (sex.value !== 'ALL')  arr = arr.filter(x => (x.sex || '').trim() === sex.value)

  const q = kw.value.trim().toLowerCase()
  if (q) {
    arr = arr.filter(x => {
      const blob = [
        x.name, x.variety, x.chipNo, x.lostPlace,
        x.color, x.appearance, x.feature, x.keeper
      ].filter(Boolean).join(' ').toLowerCase()
      return blob.includes(q)
    })
  }

  // 按遺失時間（字串）做簡單排序，新的在前
  return [...arr].sort((a, b) => {
    const ta = Date.parse(a.lostDate || '') || 0
    const tb = Date.parse(b.lostDate || '') || 0
    return tb - ta
  })
})

const filteredCount  = computed(() => filtered.value.length)
const totalPages     = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const startIndex     = computed(() => (page.value - 1) * pageSize)
const endIndex       = computed(() => Math.min(filtered.value.length, startIndex.value + pageSize))
const visibleItems   = computed(() => filtered.value.slice(startIndex.value, endIndex.value))

// 互動
function toFirstPage () { page.value = 1 }
function prevPage ()    { if (page.value > 1) page.value-- }
function nextPage ()    { if (page.value < totalPages.value) page.value++ }
function clearFilters () {
  kw.value = ''
  kind.value = 'ALL'
  sex.value = 'ALL'
  onlyPhoto.value = false
  page.value = 1
}

// 小工具
function imgSrc (src) {
  if (!hasPhoto(src)) return 'https://placehold.co/800x600?text=No+Image'
  return src
}
function onImgErr (e) {
  e.target.src = 'https://placehold.co/800x600?text=No+Image'
}
function cleanPhone (p) {
  return String(p || '').replace(/\s+/g, '')
}
function sexTag (s) {
  return s === '公' ? 'M' : s === '母' ? 'F' : ''
}

onMounted(reload)
watch([filtered], () => {
  if (page.value > totalPages.value) page.value = totalPages.value
})
</script>

<style scoped>
/* 保持你的樣式不變 */
.page { padding: 24px; }

.header {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 12px;
  margin-bottom: 12px;
}
h1 { margin: 0; font-size: 22px; }
.source { font-size: 13px; color: #666; }
.source a { color: inherit; text-decoration: underline; }

/* 篩選列 */
.filters{
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr 150px 150px auto auto;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 12px;
  background: #fafafa;
}
.search{
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
}
.select{
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
}
.chk{ display: flex; align-items: center; gap: 6px; color:#444; }
.actions{ display: flex; gap: 8px; justify-self: end; }
.actions button{
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}
.actions .secondary{ background:#e9f2ff; border-color:#8bbcff; }
.actions .warning{ background:#fff4e5; border-color:#ffbf66; }

/* 狀態區 */
.status{ padding: 8px 0; color:#555; }
.status.error{ color:#d33; }

/* 卡片區 */
.grid{
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}
.card{
  display:flex; flex-direction:column; gap:10px;
  background:#fff; border:1px solid #eee; border-radius:14px;
  box-shadow:0 2px 10px rgba(0,0,0,.06); overflow:hidden;
}
.img-wrap{ position:relative; aspect-ratio:4/3; background:#f6f6f6; }
.img-wrap img{ width:100%; height:100%; object-fit:cover; display:block; }
.badges{
  position:absolute; top:10px; left:10px; display:flex; gap:6px;
}
.badge{ font-size:12px; padding:4px 8px; border-radius:999px; color:#fff; backdrop-filter:blur(6px); }
.badge.kind{ background:#1118; }
.badge.sex[data-sex="M"]{ background:#3579f6cc; }
.badge.sex[data-sex="F"]{ background:#e24a8bcc; }
.badge.sex:not([data-sex]){ background:#6668; }

.title{ margin:8px 12px 0; font-size:18px; font-weight:700; line-height:1.3; }
.title .variety{ font-weight:400; color:#666; }

.attrs{
  list-style:none; padding:0 12px; margin:0; display:grid; gap:4px;
}
.attrs li{ color:#444; font-size:14px; display:flex; align-items:flex-start; gap:6px; }
.attrs i{ width:18px; text-align:center; opacity:.8; font-style:normal; }

/* 分頁器 */
.pager{
  display:flex; gap:12px; justify-content:center; align-items:center; margin-top:16px;
}
.pager button{
  padding:6px 12px; border:1px solid #ccc; border-radius:8px; background:#fff; cursor:pointer;
}
</style>
