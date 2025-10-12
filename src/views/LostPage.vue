<template>
  <div class="page page-skin view-lost">
    <!-- 背景柔色塊 -->
    <div class="bg-blobs">
      <div class="blob b1"></div>
      <div class="blob b2"></div>
    </div>

    <!-- Header：與認養頁一致（改成緊急樣式 + 驚嘆號） -->
    <div class="header">
      <h1 class="title-urgent">
        <svg class="bang" viewBox="0 0 24 24" aria-hidden="true">
          <!-- 警示三角形 + 驚嘆號 -->
          <path d="M12 2c.3 0 .6.16.76.44l9.2 15.96c.33.58.12 1.31-.46 1.64-.18.1-.38.16-.58.16H2.08c-.66 0-1.2-.54-1.2-1.2 0-.2.05-.4.16-.58L10.24 2.44A.88.88 0 0 1 12 2Zm0 12.8c.55 0 1-.45 1-1V8.4c0-.55-.45-1-1-1s-1 .45-1 1v5.4c0 .55.45 1 1 1Zm0 4.8a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z"/>
        </svg>
        寵物遺失啟事
        <svg class="bang" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2c.3 0 .6.16.76.44l9.2 15.96c.33.58.12 1.31-.46 1.64-.18.1-.38.16-.58.16H2.08c-.66 0-1.2-.54-1.2-1.2 0-.2.05-.4.16-.58L10.24 2.44A.88.88 0 0 1 12 2Zm0 12.8c.55 0 1-.45 1-1V8.4c0-.55-.45-1-1-1s-1 .45-1 1v5.4c0 .55.45 1 1 1Zm0 4.8a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z"/>
        </svg>
      </h1>

      <div class="source">
        資料來源：
        <a href="https://data.gov.tw/dataset/77682" target="_blank" rel="noopener">
          政府資料開放平台－寵物遺失啟事
        </a>
      </div>
    </div>

    <!-- 篩選列 -->
    <div class="filters toolbar">
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

      <div class="actions">
        <button class="secondary" @click="reload" :disabled="loading">重新整理</button>
        <button class="warning" @click="clearFilters">清除篩選</button>
      </div>
    </div>

    <!-- 狀態列 -->
    <div class="status" v-if="loading">載入中…</div>
    <div class="status error" v-else-if="error">載入失敗：{{ error }}</div>
    <div class="status" v-else aria-live="polite">
      共 {{ filteredCount.toLocaleString() }} 筆，
      顯示第 {{ startIndex + 1 }}–{{ endIndex }} 筆（第 {{ page }} / {{ totalPages }} 頁）
    </div>

    <!-- 清單 -->
    <div v-if="!loading && !error">
      <div v-if="visibleItems.length" class="grid">
        <LostCard v-for="p in visibleItems" :key="p.key" :pet="p" />
      </div>
      <div v-else class="status">沒有符合條件的資料</div>

      <!-- 分頁器 -->
      <div class="pager" v-if="totalPages > 1">
        <button :disabled="page<=1" @click="prevPage">上一頁</button>
        <div>{{ page }} / {{ totalPages }}</div>
        <button :disabled="page>=totalPages" @click="nextPage">下一頁</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import LostCard from '@/components/LostCard.vue'
import { getLostListNormalized } from '@/services/petService'

/* ---------- 狀態 ---------- */
const loading = ref(true)
const error = ref('')
const raw = ref([])
const page = ref(1)
const pageSize = 25

/* ---------- 篩選 ---------- */
const kw = ref('')
const kind = ref('ALL')
const sex  = ref('ALL')

/* ---------- URL 同步 ---------- */
const getQueryPage = () => {
  const p = Number(new URLSearchParams(location.search).get('page'))
  return Number.isFinite(p) && p >= 1 ? p : 1
}
const setQueryPage = (p) => {
  const url = new URL(location.href)
  url.searchParams.set('page', String(p))
  history.replaceState({}, '', url)
}

/* ---------- 載入 ---------- */
async function reload () {
  loading.value = true
  error.value = ''
  try {
    const list = await getLostListNormalized()
    raw.value = Array.isArray(list) ? list : []
    page.value = Math.min(Math.max(1, getQueryPage()), Math.max(1, Math.ceil(raw.value.length / pageSize)))
  } catch (e) {
    error.value = String(e?.message || e)
  } finally {
    loading.value = false
  }
}

/* ---------- 過濾/排序 ---------- */
const filtered = computed(() => {
  let arr = raw.value

  if (kind.value !== 'ALL') arr = arr.filter(x => (x.kind || '').trim() === kind.value)
  if (sex.value  !== 'ALL') arr = arr.filter(x => (x.sex  || '').trim() === sex.value)

  const q = kw.value.trim().toLowerCase()
  if (q) {
    arr = arr.filter(x => {
      const blob = [
        x.name, x.variety, x.chipNo, x.lostPlace,
        x.color, x.appearance, x.feature, x.keeper,
      ].filter(Boolean).join(' ').toLowerCase()
      return blob.includes(q)
    })
  }

  return [...arr].sort((a, b) => {
    const ta = Date.parse(a.lostDate || '') || 0
    const tb = Date.parse(b.lostDate || '') || 0
    return tb - ta
  })
})

/* ---------- 分頁 ---------- */
const filteredCount = computed(() => filtered.value.length)
const totalPages    = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const startIndex    = computed(() => (page.value - 1) * pageSize)
const endIndex      = computed(() => Math.min(filtered.value.length, startIndex.value + pageSize))

const visibleItems = computed(() => {
  const slice = filtered.value.slice(startIndex.value, endIndex.value)
  return slice.map((x, i) => {
    const stableId = x.id || x.chipNo || `${x.kind}|${x.name}|${x.lostDate}`
    const key = `${stableId}|${startIndex.value + i}`
    return { ...x, image: x.picture || '', key }
  })
})

/* ---------- 控制 ---------- */
function toFirstPage () { page.value = 1 }
function prevPage ()    { if (page.value > 1) page.value-- }
function nextPage ()    { if (page.value < totalPages.value) page.value++ }

/* ---------- 互動：頂部捲動 & URL 同步 ---------- */
function scrollTopSmooth () { window.scrollTo({ top: 0, behavior: 'smooth' }) }
watch(page, (p) => { setQueryPage(p); scrollTopSmooth() })
watch([kw, kind, sex], () => { page.value = 1; scrollTopSmooth() })

/* ---------- 初始化 ---------- */
onMounted(async () => {
  await reload()
  if (page.value > totalPages.value) {
    page.value = totalPages.value
    setQueryPage(page.value)
  } else {
    setQueryPage(page.value)
  }
})
</script>

<style scoped>
.page { padding: 24px; }

/* ===== Header：置中緊急標題 + 右側資料來源 ===== */
.header{
  display:grid;
  grid-template-columns: 1fr auto 1fr;
  align-items:end;
  gap:12px;
  margin-bottom:14px;
}

/* ⚠️ 緊急版標題 */
.title-urgent{
  grid-column: 2 / 3;
  margin:0;
  display:inline-flex; align-items:center; gap:10px;
  font-family: "Baloo 2", system-ui, -apple-system, "Segoe UI", "PingFang TC", "Microsoft JhengHei", sans-serif;
  font-size:32px; font-weight:900; letter-spacing:.04em;
  color:#e02424;
  text-shadow: 0 2px 10px rgba(224,36,36,.35);
  filter: drop-shadow(0 2px 6px rgba(224,36,36,.25));
  animation: urgentPulse 1.2s ease-in-out infinite;
}
@keyframes urgentPulse{
  0%  { transform: translateY(0) scale(1);   opacity:1; }
  50% { transform: translateY(-1px) scale(1.02); opacity:.88; }
  100%{ transform: translateY(0) scale(1);   opacity:1; }
}
.title-urgent .bang{
  width:26px; height:26px;
  fill:#ff3b30;
  filter: drop-shadow(0 2px 6px rgba(255,59,48,.35));
  animation: bangBlink 1.1s ease-in-out infinite;
}
.title-urgent .bang:last-child{ animation-delay: .2s; }
@keyframes bangBlink{
  0%,100%{ opacity:1; transform: translateY(0); }
  50%    { opacity:.72; transform: translateY(-1px); }
}

.header .source{
  grid-column: 3 / 4;
  justify-self:end;
  font-size:13px; color: var(--muted);
}
.header .source a{ color:inherit; text-decoration:underline; }
@media (max-width: 720px){
  .header{ grid-template-columns: 1fr; text-align:center; }
  .title-urgent{ grid-column: 1 / -1; }
  .header .source{ grid-column: 1 / -1; justify-self:center; }
}

/* ===== 篩選列（與認養頁相同的霧面玻璃） ===== */
.filters{
  display:grid; gap:12px;
  grid-template-columns: 1fr 150px 150px auto;
  align-items:center;
  margin-bottom:16px; padding:14px 16px;
  border-radius:16px;
  background: linear-gradient(180deg, rgba(255,255,255,.75), rgba(255,255,255,.55));
  border: 1px solid rgba(120,140,180,.25);
  box-shadow: 0 8px 24px rgba(40,70,120,.08);
  backdrop-filter: blur(10px);
}
@media (max-width: 980px){ .filters{ grid-template-columns: 1fr 1fr; } }
@media (max-width: 640px){ .filters{ grid-template-columns: 1fr; } }

.search,.select,.actions button{
  padding:8px 10px;
  border:1px solid var(--line);
  border-radius:10px;
  background: var(--surface);
  color: var(--ink);
  transition: box-shadow .18s ease, transform .12s ease, border-color .18s ease, background-color .18s ease;
  outline: none;
}
.search:hover,.select:hover{ box-shadow: 0 4px 14px rgba(60, 102, 245, .12); }
.search:focus,.select:focus{
  border-color: #7da1ff;
  box-shadow: 0 0 0 3px rgba(125,161,255,.25);
}

.actions{ display:flex; gap:8px; justify-self:end; }
.actions button{ cursor:pointer; }
.actions button:hover{
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0,0,0,.08);
}
.actions button:focus-visible{
  border-color:#7da1ff;
  box-shadow: 0 0 0 3px rgba(125,161,255,.25);
}
.actions button[disabled]{ opacity:.6; cursor:not-allowed; transform:none; box-shadow:none; }
.actions .secondary{ background:#e9f2ff; border-color:#8bbcff; }
.actions .warning{ background:#fff4e5; border-color:#ffbf66; }

/* 狀態 */
.status{ padding:8px 0; color: var(--body); }
.status.error{ color:#d33; }

/* 卡片區 */
.grid{
  display:grid; gap:16px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  grid-auto-flow: row dense;
  align-items: stretch;
}

/* 分頁器 */
.pager{
  display:flex; gap:12px; justify-content:center; align-items:center; margin-top:16px;
}
.pager button{
  padding:6px 12px;
  border:1px solid var(--line);
  border-radius:10px;
  background: var(--surface);
  color: var(--ink);
  cursor:pointer;
  transition: box-shadow .18s ease, transform .12s ease, border-color .18s ease;
}
.pager button:hover{ transform: translateY(-1px); box-shadow: 0 6px 18px rgba(0,0,0,.08); }
.pager button:focus-visible{ border-color:#7da1ff; box-shadow: 0 0 0 3px rgba(125,161,255,.25); }
.pager button[disabled]{
  opacity:.4; background:#f5f7fb; color:#9aa5b1; border-color:#e2e8f0;
  cursor:not-allowed; box-shadow:none; transform:none; pointer-events:none;
}
</style>
