<template>
  <article class="card" v-if="pet">
    <div class="img-wrap">
      <!-- 霧化背景：cover，填滿框架 -->
      <img
        v-if="imgSrc"
        :src="imgSrc"
        alt=""
        aria-hidden="true"
        class="bg"
        @error="onImgErrBg"
      />
      <!-- 前景主圖：等比例 contain，完整顯示個體 -->
      <img
        :src="imgSrc || fallback"
        :alt="pet.name || '浪浪'"
        loading="lazy"
        class="fg"
        @error="onImgErr"
      />

      <!-- 徽章 -->
      <div class="badges">
        <span class="badge kind">{{ pet.kind || '動物' }}</span>
        <span class="badge sex" :data-sex="pet.sex || ''">{{ sexText(pet.sex) }}</span>
      </div>
    </div>

    <h3 class="title">{{ pet.variety || pet.name || '未命名' }}</h3>

    <ul class="attrs">
      <li v-if="pet.code"><i>#</i> 編號：{{ pet.code }}</li>
      <li v-if="pet.age"><i>🎂</i> 年齡：{{ pet.age }}</li>
      <li v-if="pet.color"><i>🎨</i> 毛色：{{ pet.color }}</li>
      <li v-if="pet.neuter != null"><i>⚕️</i> 結紮：{{ yn(pet.neuter) }}</li>
      <li v-if="pet.vaccine != null"><i>💉</i> 疫苗：{{ yn(pet.vaccine) }}</li>
      <li v-if="pet.update"><i>🕒</i> 更新：{{ pet.update }}</li>
    </ul>

    <div class="shelter">
      <div class="name" v-if="pet.shelterName"><i>🏢</i> {{ pet.shelterName }}</div>

      <div class="phone" v-if="safePhone">
        <i>☎️</i>
        <a :href="`tel:${safePhone}`">{{ displayPhone }}</a>
      </div>

      <div class="addr" v-if="displayAddress">
        <i>📍</i>
        <span class="addr-text">{{ displayAddress }}</span>
        <a
          v-if="mapHref"
          class="map-btn"
          :href="mapHref"
          target="_blank"
          rel="noopener"
          title="在 Google 地圖開啟"
          @click.stop
        >
          <svg viewBox="0 0 24 24" class="pin" aria-hidden="true">
            <path
              d="M12 2C8.7 2 6 4.7 6 8c0 4.2 5.1 10.3 5.3 10.6.2.3.6.3.8 0C12.9 18.3 18 12.2 18 8c0-3.3-2.7-6-6-6zm0 8.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 5.5 12 5.5s2.5 1.1 2.5 2.5S13.4 10.5 12 10.5z"
            />
          </svg>
          <span class="sr-only">地圖</span>
        </a>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ pet: { type: Object, required: true } })
const fallback = 'https://placehold.co/800x600?text=No+Image'

/* ================ 影像來源修正（等比例 + 混合內容圖片自動轉 HTTPS） ================ */
function toHttpsProxy(url = '') {
  const s = String(url || '').trim()
  if (!s) return ''
  // 已是 data: 或 https: 就直接用
  if (/^(data:|https:\/\/)/i.test(s)) return s
  // http:// 走 weserv 代理，避免被瀏覽器擋下 (mixed content)
  if (/^http:\/\//i.test(s)) {
    const withoutProto = s.replace(/^https?:\/\//i, '')
    return `https://images.weserv.nl/?url=${encodeURIComponent(withoutProto)}`
  }
  // 其他相對路徑等，仍嘗試直接用
  return s
}
const rawImage = computed(() => props.pet?.image || '')
const imgSrc = computed(() => toHttpsProxy(rawImage.value))

/* ================ 小工具 ================ */
function onImgErr(e) { e.target.src = fallback }
function onImgErrBg(e){ e.target.style.display = 'none' } // 背景壞掉時直接隱藏
function sexText(s) { if (s === 'M') return '公'; if (s === 'F') return '母'; return '不限' }
function yn(v) { if (v === true || v === 'Y') return '是'; if (v === false || v === 'N') return '否'; return '未知' }

/* ---- 清除網址/多餘說明詞 ---- */
function stripUrlsLoose(text = '') {
  let s = String(text)
  const spacedHttpRe = /h\s*t\s*t\s*p\s*s?\s*[:：]\s*[/／]\s*[/／]\s*\S+/gi
  s = s.replace(spacedHttpRe, '')
  const domains = [
    /(?:^|\s)(?:goo\.gl|maps\.google\.com|maps\.app\.goo\.gl|g\.page)\S*/gi
  ]
  for (const re of domains) s = s.replace(re, '')
  s = s.replace(/https?:\/\/\S+/gi, '')
  s = s.replace(/地圖[:：]?/gi, '').replace(/map[:：]?/gi, '')
  return s.replace(/\s{2,}/g, ' ').trim()
}

/* ---- 電話 ---- */
const rawPhone = computed(() => String(props.pet?.phone ?? '').trim())
const displayPhone = computed(() => stripUrlsLoose(rawPhone.value))
const safePhone = computed(() => {
  const cleaned = displayPhone.value
  if (!cleaned) return ''
  const looksLikePhone = /^[+()0-9\-\s]{6,}$/.test(cleaned)
  return looksLikePhone ? cleaned.replace(/\s+/g, '') : ''
})

/* ---- 地址 ---- */
const displayAddress = computed(() => {
  let addr = stripUrlsLoose(String(props.pet?.address ?? ''))
  if (!addr) return ''
  let s = addr.split(/[\r\n]+/).map(t => t.trim()).find(Boolean) || ''
  s = s.replace(/^(?:地址|地點|位置)[:：]\s*/i, '')
  s = s.replace(/\s*(?:（?附帶)?(?:地圖|地點|地)\)?\s*$/gi, '')
  s = s.replace(/[，,、)\]]+\s*$/g, '').replace(/^[\[(]+\s*/g, '')
  return stripUrlsLoose(s).trim()
})

/* ---- 地圖連結 ---- */
const mapHref = computed(() => {
  const lat = props.pet?.lat
  const lon = props.pet?.lon
  if (lat && lon) return `https://www.google.com/maps?q=${lat},${lon}`
  if (displayAddress.value) return `https://www.google.com/maps?q=${encodeURIComponent(displayAddress.value)}`
  return ''
})
</script>

<style scoped>
/* ========= 卡片 + hover 觸碰特效 ========= */
.card{
  display:flex; flex-direction:column; gap:10px;
  background:#fff;
  border:1px solid rgba(120,140,180,.18);
  border-radius:14px;
  box-shadow:0 8px 24px rgba(40,70,120,.08);
  overflow:hidden;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}
.card:hover{
  transform: translateY(-4px);
  box-shadow:0 12px 28px rgba(40,70,120,.12);
  border-color: rgba(120,140,180,.28);
}

/* ========= 統一比例的圖片框（4:3 橫幅） =========
   - 背景：霧化 cover 填滿
   - 前景：contain 等比例顯示，不裁切個體
*/
.img-wrap{
  position:relative;
  aspect-ratio: 4 / 3;         /* 這裡決定所有卡片影像比例 */
  min-height: 210px;
  background:#f2f4f8;
}
@media (min-width: 1024px){ .img-wrap{ min-height: 240px; } }
@media (min-width: 1440px){ .img-wrap{ min-height: 260px; } }

.img-wrap img{ width:100%; height:100%; display:block; }

/* 霧化背景（提升視覺效果、避免灰邊） */
.img-wrap .bg{
  position:absolute; inset:0;
  object-fit: cover;
  filter: blur(12px) brightness(.95);
  transform: scale(1.08);
}

/* 主圖：等比例完整顯示個體 */
.img-wrap .fg{
  position:relative; z-index:1;
  object-fit: contain;
  object-position: center;
  background: transparent;
}

/* 徽章 */
.badges{ position:absolute; top:10px; left:10px; display:flex; gap:6px; z-index:2; }
.badge{ font-size:12px; padding:4px 8px; border-radius:999px; color:#fff; backdrop-filter:blur(6px); }
.badge.kind{ background:#1118; }
.badge.sex[data-sex="M"]{ background:#3579f6cc; }
.badge.sex[data-sex="F"]{ background:#e24a8bcc; }
.badge.sex:not([data-sex]){ background:#6668; }

/* 文字區 */
.title{ margin:8px 12px 0; font-size:18px; font-weight:700; line-height:1.3; }
.attrs{ list-style:none; padding:0 12px; margin:0; display:grid; gap:4px; }
.attrs li{ color:#444; font-size:14px; display:flex; align-items:flex-start; gap:6px; }
.attrs i{ width:18px; text-align:center; opacity:.8; font-style:normal; }

/* 分隔線（漸層） */
.shelter{
  padding:10px 12px 12px;
  display:grid; gap:8px;
  position:relative;
}
.shelter::before{
  content:"";
  position:absolute;
  left:12px; right:12px; top:0;
  height:2px;
  background: linear-gradient(90deg,#e9eefb 0%, #7aa6ff 50%, #e9eefb 100%);
  border-radius: 2px;
  opacity:.9;
}

.shelter .name,.shelter .phone,.shelter .addr{
  font-size:14px; color:#333; display:flex; gap:6px; align-items:flex-start;
}
.addr-text{ word-break:break-word; }

.map-btn{
  display:inline-flex; align-items:center; justify-content:center;
  width:26px; height:26px; min-width:26px; min-height:26px;
  margin-left:6px; border-radius:50%;
  background:#fff5f5; border:1px solid #f5c2c2; transition:all .2s ease;
}
.map-btn .pin{ width:14px; height:14px; flex:0 0 14px; fill:#e02424; }
.map-btn:hover{ transform:translateY(-1px); box-shadow:0 2px 6px rgba(224,36,36,.25); background:#ffe6e6; }

/* 無障礙隱藏文字 */
.sr-only{
  position:absolute!important; height:1px; width:1px; overflow:hidden;
  clip:rect(1px,1px,1px,1px); white-space:nowrap;
}
</style>
