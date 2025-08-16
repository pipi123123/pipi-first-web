<template>
  <div class="page">
    <!-- 標題與資料來源 -->
    <div class="header">
      <h1>浪浪認養平台</h1>
      <div class="source">
        資料來源：
        <a
          href="https://data.gov.tw/dataset/85903"
          target="_blank"
          rel="noopener"
        >
          政府資料開放平台－動物認領養
        </a>
      </div>
    </div>

    <!-- 篩選列 -->
    <div class="filters">
      <input
        v-model="kw"
        class="search"
        type="search"
        placeholder="搜尋：品種 / 收容所 / 毛色"
        @input="toFirstPage"
      />

      <!-- 種類 -->
      <select v-model="kind" class="select" @change="toFirstPage">
        <option value="ALL">不限種類</option>
        <option value="狗">狗</option>
        <option value="貓">貓</option>
      </select>

      <!-- 性別 -->
      <select v-model="sex" class="select" @change="toFirstPage">
        <option value="ALL">不限性別</option>
        <option value="M">公</option>
        <option value="F">母</option>
      </select>

      <!-- 收容所 -->
      <select v-model="shelter" class="select" @change="toFirstPage">
        <option value="">所有收容所</option>
        <option v-for="s in shelterOptions" :key="s" :value="s">{{ s }}</option>
      </select>

      <!-- 只顯示有照片 -->
      <label class="chk">
        <input type="checkbox" v-model="onlyWithImage" @change="toFirstPage" />
        只顯示有照片
      </label>

      <div class="actions">
        <button class="secondary" @click="reload" :disabled="loading">
          重新整理
        </button>
        <button class="warning" @click="clearFilters">
          清除篩選
        </button>
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
        <PetCard
          v-for="p in visiblePets"
          :key="p.id"
          :pet="p"
        />
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
import { ref, computed, onMounted, watch } from 'vue'
import PetCard from '@/components/PetCard.vue'
import { getAdoptList } from '@/services/petService'

const loading = ref(true)
const error = ref('')
const raw = ref([])         // 可能是 MOA 原始陣列，或是正規化後的陣列（含 raw）
const page = ref(1)
const pageSize = 24

// 篩選條件
const kw = ref('')
const kind = ref('ALL')     // 'ALL' | '狗' | '貓'
const sex  = ref('ALL')     // 'ALL' | 'M'  | 'F'
const shelter = ref('')     // shelter_name
const onlyWithImage = ref(false)

// 安全取欄位：優先取 x[key]，否則取 x.raw?.[key]
const pick = (x, key, d = '') => (x?.[key] ?? x?.raw?.[key] ?? d)

async function reload () {
  loading.value = true
  error.value = ''
  try {
    const data = await getAdoptList()
    const list = Array.isArray(data) ? data : (data?.items ?? [])
    raw.value = list
    page.value = 1
  } catch (e) {
    error.value = String(e?.message || e)
  } finally {
    loading.value = false
  }
}

// 下拉選單：唯一的收容所名稱
const shelterOptions = computed(() => {
  const set = new Set(
    raw.value.map(x => (pick(x, 'shelter_name', '') || '').trim()).filter(Boolean)
  )
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-Hant'))
})

const filtered = computed(() => {
  const q = kw.value.trim().toLowerCase()
  let arr = raw.value

  // 有照片
  if (onlyWithImage.value) {
    arr = arr.filter(x => !!pick(x, 'album_file', ''))
  }

  // 種類 / 性別 / 收容所
  if (kind.value !== 'ALL') {
    arr = arr.filter(x => pick(x, 'animal_kind', '') === kind.value)
  }
  if (sex.value !== 'ALL') {
    arr = arr.filter(x => pick(x, 'animal_sex', '') === sex.value)
  }
  if (shelter.value) {
    arr = arr.filter(x => pick(x, 'shelter_name', '') === shelter.value)
  }

  // 關鍵字（品種 / 收容所 / 毛色 / 地點）
  if (q) {
    arr = arr.filter(x => {
      const blob = [
        pick(x, 'animal_variety', pick(x, 'animal_Variety', '')),
        pick(x, 'shelter_name', ''),
        pick(x, 'animal_colour', ''),
        pick(x, 'animal_place', pick(x, 'animal_foundplace', '')),
      ].filter(Boolean).join(' ').toLowerCase()
      return blob.includes(q)
    })
  }

  // 依更新時間新到舊（取不到就當 0）
  arr = [...arr].sort((a, b) => {
    const ta = Date.parse(pick(a, 'animal_update', '')) || 0
    const tb = Date.parse(pick(b, 'animal_update', '')) || 0
    return tb - ta
  })

  return arr
})

const filteredCount = computed(() => filtered.value.length)

// 分頁 + 卡片映射
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const startIndex = computed(() => (page.value - 1) * pageSize)
const endIndex   = computed(() => Math.min(filtered.value.length, startIndex.value + pageSize))

const visiblePets = computed(() => {
  const pageSlice = filtered.value.slice(startIndex.value, endIndex.value)
  return pageSlice.map(mapToPetCard)
})

// 轉成 PetCard 欄位
function mapToPetCard (x) {
  const id   = pick(x, 'animal_id', '') || pick(x, 'animal_subid', '') ||
               `${pick(x, 'animal_kind', '動物')}-${pick(x, 'shelter_name', '')}-${Math.random().toString(16).slice(2)}`
  const kind = pick(x, 'animal_kind', '')
  const sex  = pick(x, 'animal_sex', '')

  // 來源可能是 MOA 原始欄位（album_file 等），或我正規化後的 raw 內欄位
  const image = pick(x, 'album_file', '') || 'https://placehold.co/800x600?text=No+Image'

  // 結紮 / 疫苗：同時支援 MOA（animal_sterilization/animal_bacterin）與正規化（spay/vaccine）
  const neuterYN  = normalizeYN(pick(x, 'animal_sterilization', pick(x, 'spay', '')))
  const vaccineYN = normalizeYN(pick(x, 'animal_bacterin',     pick(x, 'vaccine', '')))

  return {
    id,
    image,
    name: `${kind || '動物'}${sex ? `（${sex}）` : ''}`,

    kind,
    sex,

    variety: pick(x, 'animal_Variety', pick(x, 'animal_variety', '')),
    code: pick(x, 'animal_subid', pick(x, 'animal_id', '')),
    age: pick(x, 'animal_age', ''),
    color: pick(x, 'animal_colour', ''),
    neuter: neuterYN,    // 'Y' | 'N' | 'U'
    vaccine: vaccineYN,  // 'Y' | 'N' | 'U'
    update: pick(x, 'animal_update', ''),

    shelterName: pick(x, 'shelter_name', ''),
    phone: pick(x, 'shelter_tel', ''),
    address: pick(x, 'shelter_address', ''),
    lat: pick(x, 'animal_lat', ''),
    lon: pick(x, 'animal_lng', ''),
  }
}

/**
 * 將多種格式轉為 'Y' / 'N' / 'U'
 * 可處理：'Y'/'N'、'T'/'F'、1/0、true/false、'已結紮'/'未結紮'、'已施打'/'未施打'
 */
function normalizeYN (v) {
  const s = String(v ?? '').trim().toUpperCase()
  if (s === 'Y' || s === 'T' || s === '1' || s === 'TRUE' || s === '已結紮' || s === '已施打') return 'Y'
  if (s === 'N' || s === 'F' || s === '0' || s === 'FALSE' || s === '未結紮' || s === '未施打') return 'N'
  return 'U'
}

// 分頁控制
function toFirstPage () { page.value = 1 }
function prevPage () { if (page.value > 1) page.value-- }
function nextPage () { if (page.value < totalPages.value) page.value++ }

function clearFilters () {
  kw.value = ''
  kind.value = 'ALL'
  sex.value = 'ALL'
  shelter.value = ''
  onlyWithImage.value = false
  page.value = 1
}

onMounted(reload)

watch([filtered], () => {
  if (page.value > totalPages.value) page.value = totalPages.value
})
</script>

<style scoped>
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
  grid-template-columns: 1fr 150px 150px 240px auto auto;
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

/* 分頁器 */
.pager{
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
  margin-top: 16px;
}
.pager button{
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}
</style>
