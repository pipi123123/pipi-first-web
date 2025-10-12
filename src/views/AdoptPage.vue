<template>
  <div class="page page-skin view-adopt">
    <!-- 背景柔色塊 -->
    <div class="bg-blobs">
      <div class="blob b1"></div>
      <div class="blob b2"></div>
    </div>

    <!-- Header：標題置中(Q版+腳印)，資料來源靠右 -->
    <div class="header">
      <h1 class="title-cute">
        <svg class="paw" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7.5 9.5a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4Zm4.9-1.4a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Zm4.1 1.4a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4ZM12 14c-3.2 0-6 1.8-6 4.2 0 .9.7 1.8 1.9 1.8 1.1 0 1.9-.5 4.1-.5s3 .5 4.1.5c1.2 0 1.9-.9 1.9-1.8 0-2.4-2.8-4.2-6-4.2Z"/>
        </svg>
        浪浪認養平台
        <svg class="paw" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7.5 9.5a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4Zm4.9-1.4a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Zm4.1 1.4a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4ZM12 14c-3.2 0-6 1.8-6 4.2 0 .9.7 1.8 1.9 1.8 1.1 0 1.9-.5 4.1-.5s3 .5 4.1.5c1.2 0 1.9-.9 1.9-1.8 0-2.4-2.8-4.2-6-4.2Z"/>
        </svg>
      </h1>

      <div class="source">
        資料來源：
        <a href="https://data.gov.tw/dataset/85903" target="_blank" rel="noopener">
          政府資料開放平台－動物認領養
        </a>
      </div>
    </div>

    <!-- 篩選列 -->
    <div class="filters toolbar">
      <input
        v-model="kw"
        class="search"
        type="search"
        placeholder="搜尋：品種 / 收容所 / 毛色"
        @input="toFirstPage"
      />

      <select v-model="kind" class="select" @change="toFirstPage">
        <option value="ALL">不限種類</option>
        <option value="狗">狗</option>
        <option value="貓">貓</option>
      </select>

      <select v-model="sex" class="select" @change="toFirstPage">
        <option value="ALL">不限性別</option>
        <option value="M">公</option>
        <option value="F">母</option>
      </select>

      <select v-model="shelter" class="select" @change="toFirstPage">
        <option value="">所有收容所</option>
        <option v-for="s in shelterOptions" :key="s" :value="s">{{ s }}</option>
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
      <div v-if="visiblePets.length" class="grid">
        <PetCard v-for="p in visiblePets" :key="p.key" :pet="p" />
      </div>
      <div v-else class="status">找不到符合條件的資料</div>

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
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import PetCard from '@/components/PetCard.vue'
import { getAdoptList } from '@/services/petService'

/* ---------- 狀態 ---------- */
const loading = ref(true)
const error   = ref('')
const raw     = ref([])

/* 讀取網址/暫存的初始頁碼（預設 1） */
function readInitialPage () {
  const q = new URLSearchParams(location.search)
  const fromQS = Number(q.get('page') || '')
  const fromSS = Number(sessionStorage.getItem('adoptPage') || '')
  return Number.isFinite(fromQS) && fromQS > 0 ? fromQS
       : Number.isFinite(fromSS) && fromSS > 0 ? fromSS
       : 1
}
const page = ref(readInitialPage())
const pageSize = 25

/* ---------- 篩選 ---------- */
const kw = ref('')
const kind = ref('ALL')
const sex  = ref('ALL')
const shelter = ref('')

/* ---------- 小工具 ---------- */
const pick = (x, key, d = '') => (x?.[key] ?? x?.raw?.[key] ?? d)

/* ---------- 載入 ---------- */
async function reload () {
  loading.value = true
  error.value = ''
  try {
    const data = await getAdoptList()
    const list = Array.isArray(data) ? data : (data?.items ?? [])
    raw.value = list
    await nextTick()
    clampPage()
  } catch (e) {
    error.value = String(e?.message || e)
  } finally {
    loading.value = false
  }
}

/* ---------- 篩選 / 排序 ---------- */
const shelterOptions = computed(() => {
  const set = new Set(
    raw.value.map(x => (pick(x, 'shelter_name', '') || '').trim()).filter(Boolean)
  )
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-Hant'))
})

const filtered = computed(() => {
  const q = kw.value.trim().toLowerCase()
  let arr = raw.value

  if (kind.value !== 'ALL') arr = arr.filter(x => pick(x, 'animal_kind', '') === kind.value)
  if (sex.value  !== 'ALL') arr = arr.filter(x => pick(x, 'animal_sex',  '') === sex.value)
  if (shelter.value)       arr = arr.filter(x => pick(x, 'shelter_name', '') === shelter.value)

  if (q) {
    arr = arr.filter(x => {
      const blob = [
        pick(x, 'animal_variety', pick(x, 'animal_Variety', '')),
        pick(x, 'shelter_name', ''), pick(x, 'animal_colour', ''),
        pick(x, 'animal_place', pick(x, 'animal_foundplace', '')),
      ].filter(Boolean).join(' ').toLowerCase()
      return blob.includes(q)
    })
  }

  // 更新時間 新→舊
  return [...arr].sort((a, b) => {
    const ta = Date.parse(pick(a, 'animal_update', '')) || 0
    const tb = Date.parse(pick(b, 'animal_update', '')) || 0
    return tb - ta
  })
})

/* ---------- 分頁 ---------- */
const filteredCount = computed(() => filtered.value.length)
const totalPages    = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const startIndex    = computed(() => (page.value - 1) * pageSize)
const endIndex      = computed(() => Math.min(filtered.value.length, startIndex.value + pageSize))

const visiblePets = computed(() => {
  const slice = filtered.value.slice(startIndex.value, endIndex.value)
  return slice.map((x, i) => {
    const subid = pick(x, 'animal_subid', '')
    const aid   = pick(x, 'animal_id', '')
    const kind  = pick(x, 'animal_kind', '')
    const sh    = pick(x, 'shelter_name', '')
    const up    = pick(x, 'animal_update', '')
    const stableId = subid || aid || `${kind}|${sh}|${up}`
    const key = `${stableId}|${startIndex.value + i}`
    return { ...mapToPetCard(x, stableId), key }
  })
})

function mapToPetCard (x, stableId = '') {
  const kind = pick(x, 'animal_kind', '')
  const sex  = pick(x, 'animal_sex', '')
  const image = pick(x, 'album_file', '') || 'https://placehold.co/800x600?text=No+Image'
  const neuterYN  = normalizeYN(pick(x, 'animal_sterilization', pick(x, 'spay', '')))
  const vaccineYN = normalizeYN(pick(x, 'animal_bacterin',     pick(x, 'vaccine', '')))
  return {
    id: stableId || pick(x, 'animal_subid', pick(x, 'animal_id', '')),
    image,
    name: `${kind || '動物'}${sex ? `（${sex}）` : ''}`,
    kind, sex,
    variety: pick(x, 'animal_Variety', pick(x, 'animal_variety', '')),
    code: pick(x, 'animal_subid', pick(x, 'animal_id', '')),
    age: pick(x, 'animal_age', ''), color: pick(x, 'animal_colour', ''),
    neuter: neuterYN, vaccine: vaccineYN,
    update: pick(x, 'animal_update', ''),
    shelterName: pick(x, 'shelter_name', ''),
    phone: pick(x, 'shelter_tel', ''), address: pick(x, 'shelter_address', ''),
    lat: pick(x, 'animal_lat', ''),    lon: pick(x, 'animal_lng', ''),
  }
}

function normalizeYN (v) {
  const s = String(v ?? '').trim().toUpperCase()
  if (['Y','T','1','TRUE','已結紮','已施打'].includes(s)) return 'Y'
  if (['N','F','0','FALSE','未結紮','未施打'].includes(s)) return 'N'
  return 'U'
}

/* ---------- 分頁控制 ---------- */
function toFirstPage () { page.value = 1 }
function prevPage ()    { if (page.value > 1) page.value-- }
function nextPage ()    { if (page.value < totalPages.value) page.value++ }

function clampPage () {
  const tp = totalPages.value || 1
  if (page.value < 1) page.value = 1
  if (page.value > tp) page.value = tp
}
function syncPageToUrl () {
  const sp = new URLSearchParams(location.search)
  sp.set('page', String(page.value))
  const newUrl = `${location.pathname}?${sp.toString()}`
  history.replaceState(null, '', newUrl)
  sessionStorage.setItem('adoptPage', String(page.value))
}

/* ---------- 換頁/篩選 → 頂部 & 同步網址 ---------- */
function scrollTopSmooth () { window.scrollTo({ top: 0, behavior: 'smooth' }) }

watch(page, () => { clampPage(); syncPageToUrl(); scrollTopSmooth() })
watch([kw, kind, sex, shelter], () => { page.value = 1 })

/* ---------- 初始化 ---------- */
onMounted(async () => { syncPageToUrl(); await reload() })
watch([filtered], () => { clampPage() })

function clearFilters () {
  kw.value = ''
  kind.value = 'ALL'
  sex.value  = 'ALL'
  shelter.value = ''
  page.value = 1
}
</script>

<style scoped>
.page { padding: 24px; }

/* ===== Header：置中Q版標題 + 右側資料來源 ===== */
.header{
  display:grid;
  grid-template-columns: 1fr auto 1fr;
  align-items:end;
  gap:12px;
  margin-bottom:14px;
}

/* ✨ 標題：發光＋同步脈動（文字與腳印同一支動畫） */
.title-cute{
  --pulse-dur: 2.6s;      /* 週期 */
  --raise: -1px;          /* 上下輕微位移 */
  --scale: 1.02;          /* 輕微放大 */

  grid-column: 2 / 3;
  margin:0;
  font-family: "Baloo 2", system-ui, -apple-system, "Segoe UI", "PingFang TC", "Microsoft JhengHei", sans-serif;
  font-size:32px; font-weight:800; letter-spacing:.03em;
  background: linear-gradient(92deg, #6a82fb 0%, #5f7cfb 45%, #a777e3 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  display: inline-flex; align-items: center; gap: 10px;

  /* 進場 + 同步脈動（更順） */
  animation: titleEnter .9s ease both, glowPulseSync var(--pulse-dur) ease-in-out infinite;

  /* 柔和發光 */
  text-shadow:
    0 1px 0 rgba(0,0,0,.04),
    0 0 8px  rgba(106,130,251,.32),
    0 0 16px rgba(95,124,251,.22),
    0 0 28px rgba(167,119,227,.18);
  will-change: transform, filter;
}
@keyframes titleEnter{
  0% { transform: translateY(6px) scale(.98); opacity:0; }
  60%{ transform: translateY(0)   scale(1.03); opacity:1; }
  100%{transform: translateY(0)   scale(1); }
}
/* 同步脈動（套給標題與腳印一起跑） */
@keyframes glowPulseSync{
  0%,100%{
    transform: translateY(0) scale(1);
    filter: drop-shadow(0 1px 2px rgba(106,130,251,.26));
  }
  50%{
    transform: translateY(var(--raise)) scale(var(--scale));
    filter: drop-shadow(0 4px 12px rgba(106,130,251,.42));
  }
}

/* 腳印：與標題完全同動畫，不再錯位/延遲 */
.title-cute .paw{
  width:26px; height:26px; fill:#7b88ffcc;
  animation: glowPulseSync var(--pulse-dur) ease-in-out infinite;
  will-change: transform, filter;
}

/* 動畫無障礙：使用者偏好減少動效則關閉 */
@media (prefers-reduced-motion: reduce){
  .title-cute, .title-cute .paw{ animation: none !important; }
}

.header .source{
  grid-column: 3 / 4;
  justify-self:end;
  font-size:13px; color: var(--muted);
}
.header .source a{ color:inherit; text-decoration:underline; }
@media (max-width: 720px){
  .header{ grid-template-columns: 1fr; text-align:center; }
  .title-cute{ grid-column: 1 / -1; }
  .header .source{ grid-column: 1 / -1; justify-self:center; }
}

/* ===== 篩選列：霧面卡片 + 互動特效 ===== */
.filters{
  display:grid; gap:12px;
  grid-template-columns: 1fr 150px 150px 240px auto;
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

/* 狀態區 */
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
