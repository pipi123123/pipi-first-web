<!-- src/views/SheltersPage.vue -->
<template>
  <div class="page page-skin page-grid view-shelters">
    <div class="bg-blobs"><div class="blob b1"></div><div class="blob b2"></div></div>

    <div class="header">
      <h1>收容所清單</h1>
      <a v-if="showSource" class="source-link" href="https://data.gov.tw/dataset/134284" target="_blank" rel="noopener">
        資料來源：政府開放資料平台－公立收容所資料
      </a>
    </div>

    <div class="toolbar">
      <input v-model="kw" type="search" placeholder="搜尋：縣市 / 名稱 / 地址 / 電話" />
      <select v-model="cityFilter">
        <option value="">全部縣市</option>
        <option v-for="c in cityOptions" :key="c.code" :value="c.code">{{ c.label }}（{{ c.code }}）</option>
      </select>
      <button @click="load" :disabled="loading">重新整理</button>
      <div class="spacer"></div>
      <label class="toggle">
        <input type="checkbox" v-model="showMap" />
        顯示地圖
      </label>
    </div>

    <div class="status-row">
      <span v-if="loading">載入中…</span>
      <template v-else>
        <span>共 {{ raw.length.toLocaleString() }} 筆（已篩選 {{ filteredSorted.length.toLocaleString() }} 筆）</span>
        <span v-if="showMap" class="muted">地圖已標註 {{ plottedCount.toLocaleString() }} 筆</span>
      </template>
      <span class="muted" v-if="showSource && sourceNote">來源：{{ sourceNote }}</span>
    </div>

    <!-- 一定要 v-if，不要 v-show；並用 :key 強制重建 DOM，避免 HMR 殘留 -->
    <div v-if="showMap" class="map-wrap">
      <div :key="mapKey" ref="mapEl" class="map"></div>
      <div v-if="plottedCount === 0 && !loading" class="map-empty">目前篩選結果沒有帶經緯度的資料，無法顯示地圖標記。</div>
    </div>

    <div class="table-wrap">
      <table class="table" v-if="!loading && !error">
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
          <tr v-for="s in filteredSorted" :key="s.id" @click="focusOnMap(s)" class="row-hover">
            <td>{{ cityName(s.cityCode) }}</td>
            <td>{{ s.name }}</td>
            <td>
              <template v-if="s.phone">
                <a :href="phoneHref(s.phone)" @click.stop>{{ s.phone }}</a>
              </template>
              <template v-else>-</template>
            </td>
            <td v-html="nl2br(s.openTime)"></td>
            <td>
              <span>{{ s.address }}</span>
              <a v-if="mapHref(s)" class="map" :href="mapHref(s)" target="_blank" rel="noopener" @click.stop>地圖</a>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!loading && !error && filteredSorted.length === 0" class="empty">查無符合資料。</p>
      <p v-if="error" class="error">載入失敗：{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { getShelters } from '@/services/petService'

/* Leaflet */
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import icon2xUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
const DefaultIcon = L.icon({ iconUrl, iconRetinaUrl: icon2xUrl, shadowUrl })
L.Marker.prototype.options.icon = DefaultIcon

/* 狀態 */
const showSource = (import.meta.env.VITE_SHOW_SOURCES ?? 'false').toString().toLowerCase() === 'true'
const raw = ref([]); const loading = ref(false); const error = ref(''); const sourceNote = ref('')
const kw = ref(''); const cityFilter = ref(''); const sortKey = ref('seq'); const sortAsc = ref(true)
const showMap = ref(true)

/* 地圖 */
const mapEl = ref(null)
let map = null
let layerGroup = null
const plottedCount = ref(0)
/* 用來強制重建 map DOM（解 HMR/殘留） */
const mapKey = ref(0)

const TAIWAN_BOUNDS = L.latLngBounds([20.5, 118.0], [26.7, 123.0])
const TAIWAN_CENTER = [23.7, 121]
const MIN_ZOOM = 6
const DEFAULT_ZOOM = 7

/* 城市 */
const cityOptions = [
  { code: '63000', label: '台北市' }, { code: '65000', label: '新北市' },
  { code: '68000', label: '桃園市' }, { code: '66000', label: '台中市' },
  { code: '67000', label: '台南市' }, { code: '64000', label: '高雄市' },
  { code: '10017', label: '基隆市' }, { code: '10018', label: '新竹市' },
  { code: '10004', label: '新竹縣' }, { code: '10005', label: '苗栗縣' },
  { code: '10007', label: '彰化縣' }, { code: '10008', label: '南投縣' },
  { code: '10009', label: '雲林縣' }, { code: '10010', label: '嘉義縣' },
  { code: '10020', label: '嘉義市' }, { code: '10013', label: '屏東縣' },
  { code: '10014', label: '台東縣' }, { code: '10015', label: '花蓮縣' },
  { code: '10002', label: '宜蘭縣' }, { code: '10016', label: '澎湖縣' },
  { code: '09020', label: '金門縣' }, { code: '09007', label: '連江縣' }
]

/* 工具 */
function cityName (code) { return cityOptions.find(x => x.code === String(code))?.label || code || '' }
function nl2br (s=''){ return String(s).replace(/\n/g,'<br/>') }
function phoneHref (p){ const first=String(p).split(/[、,，;；/／]|或/)[0]||''; return `tel:${first.replace(/\s|　/g,'')}` }
function mapHref (s){ if(s.lat&&s.lon) return `https://www.google.com/maps?q=${s.lat},${s.lon}`; if(s.address) return `https://www.google.com/maps?q=${encodeURIComponent(s.address)}`; return '' }

/* 資料 */
async function load(){
  loading.value=true; error.value=''; sourceNote.value=''
  try{
    const data=await getShelters()
    raw.value=Array.isArray(data)?data:[]
    sourceNote.value=(import.meta.env.VITE_SHELTER_URL?.trim()) ? '政府 OpenData（VITE_SHELTER_URL）' : '自動來源（petService 內建候選）'
  }catch(e){ error.value=e?.message||String(e) }finally{ loading.value=false }
}

/* 篩選/排序 */
const filteredSorted = computed(()=>{
  const q=kw.value.trim().toLowerCase()
  let arr=raw.value
  if(cityFilter.value) arr=arr.filter(s=>String(s.cityCode)===String(cityFilter.value))
  if(q){
    arr=arr.filter(s=>{
      const blob=[cityName(s.cityCode), s.name, s.address, s.phone].filter(Boolean).join(' ').toLowerCase()
      return blob.includes(q)
    })
  }
  const k=sortKey.value; const asc=sortAsc.value?1:-1
  arr=[...arr].sort((a,b)=>{
    const va=a?.[k], vb=b?.[k]; const na=Number(va), nb=Number(vb)
    if(Number.isFinite(na)&&Number.isFinite(nb)) return (na-nb)*asc
    const sa=(va??'').toString(), sb=(vb??'').toString()
    return sa.localeCompare(sb,'zh-Hant')*asc
  })
  return arr
})
function sortBy(k){ if(sortKey.value===k) sortAsc.value=!sortAsc.value; else { sortKey.value=k; sortAsc.value=true } }

/* 地圖初始化（硬重置防殘留） */
async function ensureMapReady(){
  await nextTick()
  const el = mapEl.value
  if(!el) return

  // === 硬重置：處理 HMR/殘留 ===
  if (el._leaflet_id) {
    // 移除 Leaflet 加的 class / 內容 / 狀態
    el.className = el.className.replace(/\bleaflet-\S+\b/g,'').trim()
    el.innerHTML = ''
    try { delete el._leaflet_id } catch {}
  }

  if (map) return

  map = L.map(el, {
    zoomControl:true, scrollWheelZoom:true,
    minZoom: MIN_ZOOM,
    maxBounds: TAIWAN_BOUNDS.pad(0.02),
    maxBoundsViscosity: 1.0
  })

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap & CARTO',
    noWrap: true
  }).addTo(map)

  layerGroup = L.layerGroup().addTo(map)
  map.setView(TAIWAN_CENTER, DEFAULT_ZOOM)

  // 初次與切回顯示時校正尺寸
  setTimeout(()=> map && map.invalidateSize(), 30)
}

function refreshMarkers(){
  if(!map || !layerGroup) return
  layerGroup.clearLayers()
  const pts=[]
  for(const s of filteredSorted.value){
    const lat=Number(s.lat), lon=Number(s.lon)
    if(!Number.isFinite(lat)||!Number.isFinite(lon)) continue
    const popupHtml=`
      <div class="popup">
        <div class="t1">${s.name||''}</div>
        <div class="t2">${cityName(s.cityCode)||''}</div>
        <div class="t3">${s.address||''}</div>
        <div class="t3">${s.phone?`<a href="${phoneHref(s.phone)}">${s.phone}</a>`:''}</div>
        <div class="links"><a href="${mapHref(s)}" target="_blank" rel="noopener">Google 地圖</a></div>
      </div>`
    L.marker([lat,lon]).bindPopup(popupHtml,{maxWidth:260}).addTo(layerGroup)
    pts.push([lat,lon])
  }
  plottedCount.value=pts.length
  if(pts.length>0){ const b=L.latLngBounds(pts); map.fitBounds(b.pad(0.2)) }
  else { map.setView(TAIWAN_CENTER, DEFAULT_ZOOM) }
}

function focusOnMap(s){
  if(!showMap.value) return
  const lat=Number(s.lat), lon=Number(s.lon)
  if(!map || !Number.isFinite(lat)||!Number.isFinite(lon)) return
  map.setView([lat,lon], Math.max(map.getZoom(),14))
  L.popup({maxWidth:260}).setLatLng([lat,lon]).setContent(`
    <div class="popup">
      <div class="t1">${s.name||''}</div>
      <div class="t2">${cityName(s.cityCode)||''}</div>
      <div class="t3">${s.address||''}</div>
      <div class="t3">${s.phone?`<a href="${phoneHref(s.phone)}">${s.phone}</a>`:''}</div>
      <div class="links"><a href="${mapHref(s)}" target="_blank" rel="noopener">Google 地圖</a></div>
    </div>`).openOn(map)
}

/* 生命週期 */
onMounted(async ()=>{
  await load()
  if(showMap.value){
    // 切一次 key，確保是全新的 DOM（解 HMR）
    mapKey.value++
    await ensureMapReady()
    refreshMarkers()
  }
})

watch(filteredSorted, async ()=>{
  if(!showMap.value) return
  await ensureMapReady()
  refreshMarkers()
})

watch(showMap, async (v)=>{
  if(v){
    // 顯示時強制換一個全新的 DOM，避免之前被 Leaflet 初始化過
    mapKey.value++
    map = null; layerGroup = null
    await nextTick()
    await ensureMapReady()
    refreshMarkers()
  }else{
    // 隱藏時把 map 真的卸載乾淨
    if(map){ map.remove(); map=null; layerGroup=null }
  }
})

onBeforeUnmount(()=>{
  if(map){ map.remove(); map=null; layerGroup=null }
})

/* HMR：頁面熱更新時也把舊地圖清掉，避免殘留 */
if (import.meta.hot) {
  import.meta.hot.dispose(()=>{
    if(map){ map.remove(); map=null; layerGroup=null }
  })
}
</script>

<style scoped>
.page { padding: 24px; }
.header{ display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:12px; }
h1{ margin:0; font-size:22px; color:var(--ink); }
.source-link{ font-size:13px; color:var(--accent); text-decoration:none; white-space:nowrap; }
.source-link:hover{ text-decoration:underline; }

.toolbar{ display:flex; gap:12px; margin-bottom:8px; flex-wrap:wrap; align-items:center; }
.toolbar input[type="search"]{ flex:1 1 260px; }
.toolbar .spacer{ flex:1; }
.toggle{ font-size:14px; color:var(--ink); display:flex; align-items:center; gap:6px; }

.status-row{ display:flex; gap:12px; align-items:center; margin-bottom:12px; color:var(--body); }
.status-row .muted{ color:var(--muted); }

.map-wrap{ position:relative; border-radius:12px; overflow:hidden; border:1px solid var(--line); box-shadow: var(--shadow); margin-bottom:12px; }
.map{ width:100%; height:420px; background:#e5eef7; }
.map-empty{ position:absolute; inset:auto 12px 12px auto; background:rgba(255,255,255,.9); border:1px solid var(--line); padding:6px 10px; border-radius:8px; font-size:13px; color:var(--muted); }

.table-wrap{ overflow:auto; border-radius:12px; background:var(--surface); box-shadow: var(--shadow); border:1px solid var(--line); }
.table{ width:100%; border-collapse:collapse; color:var(--ink); }
th, td{ padding:12px 14px; border-bottom:1px solid var(--line); vertical-align:top; }
th{ white-space:nowrap; cursor:pointer; user-select:none; background:#f8fafc; font-weight:700; }
td .map{ margin-left:8px; font-size:12px; text-decoration:underline; color:var(--accent); }
.row-hover{ cursor:pointer; }
.row-hover:hover{ background:#f9fbff; }

:deep(.leaflet-popup-content){ margin:10px 12px; }
.popup .t1{ font-weight:800; color:var(--ink); margin-bottom:4px; }
.popup .t2{ color:var(--body); font-size:13px; margin-bottom:2px; }
.popup .t3{ color:var(--body); font-size:13px; }
.popup .links{ margin-top:6px; font-size:12px; }
.popup .links a{ color:var(--accent); text-decoration:underline; }
</style>
