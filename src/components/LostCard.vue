<!-- src/components/LostCard.vue -->
<template>
  <article class="card" v-if="pet">
    <!-- 圖片框：與 PetCard 完全一致（霧化背景 + 前景 contain） -->
    <div class="img-wrap">
      <!-- 背景：同張圖片做霧化 halo -->
      <img
        v-if="imgSrc"
        :src="imgSrc"
        alt=""
        aria-hidden="true"
        class="bg"
        @error="onImgErrBg"
      />
      <!-- 前景主圖：contain，完整顯示個體 -->
      <img
        :src="imgSrc || fallback"
        :alt="pet.name || '遺失寵物'"
        loading="lazy"
        class="fg"
        @error="onImgErr"
      />

      <!-- 徽章（保留你的呈現） -->
      <div class="badges">
        <span class="badge kind">{{ pet.kind || '寵物' }}</span>
        <span class="badge sex" :data-sex="sexTag">{{ pet.sex || '—' }}</span>
      </div>
    </div>

    <!-- ↓↓↓ 以下都是你原本的資訊，完全不動 ↓↓↓ -->
    <h3 class="title">
      {{ pet.name || '未命名' }}
      <small v-if="pet.variety" class="variety">｜{{ pet.variety }}</small>
    </h3>

    <ul class="attrs">
      <li v-if="pet.color"><i>🎨</i> 毛色：{{ pet.color }}</li>
      <li v-if="pet.chipNo"><i>#</i> 晶片：{{ pet.chipNo }}</li>
      <li v-if="pet.feature"><i>✨</i> 特徵：{{ pet.feature }}</li>
      <li v-if="pet.appearance"><i>🧥</i> 外觀：{{ pet.appearance }}</li>
      <li v-if="pet.lostDate"><i>🕒</i> 遺失時間：{{ pet.lostDate }}</li>
      <li v-if="pet.lostPlace">
        <i>📍</i>
        <span class="addr">{{ pet.lostPlace }}</span>
        <a
          v-if="mapHref"
          class="map-btn"
          :href="mapHref"
          target="_blank"
          rel="noopener"
          @click.stop
          title="在 Google 地圖開啟"
        >
          <svg viewBox="0 0 24 24" class="pin" aria-hidden="true">
            <path
              d="M12 2C8.7 2 6 4.7 6 8c0 4.2 5.1 10.3 5.3 10.6.2.3.6.3.8 0C12.9 18.3 18 12.2 18 8c0-3.3-2.7-6-6-6zm0 8.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 5.5 12 5.5s2.5 1.1 2.5 2.5S13.4 10.5 12 10.5z"
            />
          </svg>
          <span class="sr-only">地圖</span>
        </a>
      </li>
    </ul>

    <div class="contact">
      <div v-if="pet.keeper"><i>👤</i> 飼主：{{ pet.keeper }}</div>
      <div v-if="pet.phone"><i>☎️</i> 電話：<a :href="`tel:${cleanPhone(pet.phone)}`">{{ pet.phone }}</a></div>
      <div v-if="pet.email"><i>✉️</i> Email：<a :href="`mailto:${pet.email}`">{{ pet.email }}</a></div>
    </div>
    <!-- ↑↑↑ 完全不動 ↑↑↑ -->
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ pet: { type: Object, required: true } })

/* 圖片來源（支援 image/picture；避免 mixed content） */
const fallback = 'https://placehold.co/800x600?text=No+Image'
function toHttpsProxy(url = '') {
  const s = String(url || '').trim()
  if (!s || s === 'null' || s === 'undefined') return ''
  if (/^(data:|https:\/\/)/i.test(s)) return s
  if (/^http:\/\//i.test(s)) {
    const noProto = s.replace(/^https?:\/\//i, '')
    return `https://images.weserv.nl/?url=${encodeURIComponent(noProto)}`
  }
  return s
}
const rawImage = computed(() => props.pet?.image || props.pet?.picture || '')
const imgSrc = computed(() => toHttpsProxy(rawImage.value))

/* 性別徽章 */
const sexTag = computed(() => (props.pet?.sex === '公' ? 'M' : props.pet?.sex === '母' ? 'F' : ''))

/* 地圖連結（保持你的寫法） */
const mapHref = computed(() => {
  const place = String(props.pet?.lostPlace || '').trim()
  return place ? `https://www.google.com/maps?q=${encodeURIComponent(place)}` : ''
})

/* 錯圖處理 & 工具 */
function onImgErr(e){ e.target.src = fallback }
function onImgErrBg(e){ e.target.style.display = 'none' }
function cleanPhone(p){ return String(p || '').replace(/\s+/g, '') }
</script>

<style scoped>
/* 卡片（保持你的風格） */
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

/* ========= 圖片框：與 PetCard 完全一致 =========
   - 背景：霧化 cover 填滿
   - 前景：contain 等比例顯示，不裁切個體
*/
.img-wrap{
  position:relative;
  aspect-ratio: 4 / 3;
  min-height: 210px;
  background:#f2f4f8;
  isolation:isolate;
}
@media (min-width: 1024px){ .img-wrap{ min-height: 240px; } }
@media (min-width: 1440px){ .img-wrap{ min-height: 260px; } }

.img-wrap img{ width:100%; height:100%; display:block; }

/* 背景霧化（與 PetCard 同參數） */
.img-wrap .bg{
  position:absolute; inset:0;
  object-fit: cover;
  filter: blur(12px) brightness(.95);
  transform: scale(1.08);
  z-index:0;
}

/* 主圖：contain（與 PetCard 一致） */
.img-wrap .fg{
  position:relative; z-index:1;
  object-fit: contain;
  object-position: center;
  background: transparent;
}

/* 徽章（保持） */
.badges{ position:absolute; top:10px; left:10px; display:flex; gap:6px; z-index:2; }
.badge{ font-size:12px; padding:4px 8px; border-radius:999px; color:#fff; backdrop-filter:blur(6px); }
.badge.kind{ background:#1118; }
.badge.sex[data-sex="M"]{ background:#3579f6cc; }
.badge.sex[data-sex="F"]{ background:#e24a8bcc; }
.badge.sex:not([data-sex]){ background:#6668; }

/* 文字 / 分隔線 / 地圖按鈕（原樣保留） */
.title{ margin:8px 12px 0; font-size:18px; font-weight:800; line-height:1.3; color:#1d2433; }
.title .variety{ font-weight:400; color:#7a8599; }
.attrs{ list-style:none; padding:0 12px 12px; margin:0; display:grid; gap:4px; }
.attrs li{ color:#2d3648; font-size:14px; display:flex; align-items:flex-start; gap:6px; }
.attrs i{ width:18px; text-align:center; opacity:.85; font-style:normal; }
.addr{ word-break:break-word; }

.contact{
  padding:10px 12px 12px;
  display:grid; gap:6px;
  position:relative;
}
.contact::before{
  content:"";
  position:absolute;
  left:12px; right:12px; top:0;
  height:2px;
  background: linear-gradient(90deg,#e9eefb 0%, #7aa6ff 50%, #e9eefb 100%);
  border-radius: 2px;
  opacity:.9;
}
.contact{ color:#2d3648; font-size:14px; }
.contact i{ width:18px; text-align:center; opacity:.9; font-style:normal; }

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
