<!-- src/components/LostCard.vue -->
<template>
  <article class="card">
    <div class="img-wrap">
      <img :src="imgSrc" :alt="pet.name || '遺失寵物'" loading="lazy" @error="onImgErr" />
      <div class="badges">
        <span class="badge kind">{{ pet.kind || '寵物' }}</span>
        <span class="badge sex" :data-sex="sexTag">{{ pet.sex || '—' }}</span>
      </div>
    </div>

    <h3 class="title">{{ pet.name || '未命名' }}</h3>

    <ul class="attrs">
      <li v-if="pet.variety"><i>🐾</i> 品種：{{ pet.variety }}</li>
      <li v-if="pet.color"><i>🎨</i> 毛色：{{ pet.color }}</li>
      <li v-if="pet.chipNo"><i>#</i> 晶片：{{ pet.chipNo }}</li>
      <li v-if="pet.feature"><i>✨</i> 特徵：{{ pet.feature }}</li>
      <li v-if="pet.appearance"><i>🧥</i> 外觀：{{ pet.appearance }}</li>
      <li v-if="pet.lostDate"><i>🕒</i> 遺失時間：{{ pet.lostDate }}</li>
      <li v-if="pet.lostPlace">
        <i>📍</i>
        <span>{{ pet.lostPlace }}</span>
        <a class="map" :href="mapHref" target="_blank" rel="noopener">地圖</a>
      </li>
    </ul>

    <div class="contact">
      <div v-if="pet.keeper"><i>👤</i> 飼主：{{ pet.keeper }}</div>
      <div v-if="pet.phone">
        <i>☎️</i> 電話：<a :href="`tel:${cleanPhone(pet.phone)}`">{{ pet.phone }}</a>
      </div>
      <div v-if="pet.email"><i>✉️</i> Email：{{ pet.email }}</div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  pet: { type: Object, required: true },
})

const fallback = 'https://placehold.co/800x600?text=No+Image'
function onImgErr(e) { e.target.src = fallback }
function cleanPhone(p) { return String(p || '').replace(/\s+/g, '') }

// 照片來源（排除空字串/null/undefined）
const imgSrc = computed(() => {
  const s = String(props.pet?.picture || '').trim().toLowerCase()
  return s && s !== 'null' && s !== 'undefined' ? props.pet.picture : fallback
})

// 徽章性別標記：公→M、母→F，其餘空
const sexTag = computed(() => (props.pet?.sex === '公' ? 'M' : props.pet?.sex === '母' ? 'F' : ''))

// Google Maps 連結
const mapHref = computed(() =>
  props.pet?.lostPlace
    ? `https://www.google.com/maps?q=${encodeURIComponent(props.pet.lostPlace)}`
    : ''
)
</script>

<style scoped>
.card{ display:flex; flex-direction:column; gap:10px; background:#fff; border:1px solid #eee; border-radius:14px; box-shadow:0 2px 10px rgba(0,0,0,.06); overflow:hidden; }
.img-wrap{ position:relative; aspect-ratio:4/3; background:#f6f6f6; }
.img-wrap img{ width:100%; height:100%; object-fit:cover; display:block; }
.badges{ position:absolute; top:10px; left:10px; display:flex; gap:6px; }
.badge{ font-size:12px; padding:4px 8px; border-radius:999px; color:#fff; backdrop-filter:blur(6px); }
.badge.kind{ background:#1118; }
.badge.sex[data-sex="M"]{ background:#3579f6cc; }
.badge.sex[data-sex="F"]{ background:#e24a8bcc; }
.badge.sex:not([data-sex]){ background:#6668; }

.title{ margin:8px 12px 0; font-size:18px; font-weight:700; line-height:1.3; }
.attrs{ list-style:none; padding:0 12px; margin:0; display:grid; gap:4px; }
.attrs li{ color:#444; font-size:14px; display:flex; align-items:flex-start; gap:6px; }
.attrs i{ width:18px; text-align:center; opacity:.8; font-style:normal; }

.contact{ padding:6px 12px 12px; display:grid; gap:6px; border-top:1px dashed #eee; color:#333; font-size:14px; }
.contact i{ width:18px; text-align:center; opacity:.9; font-style:normal; }
.map{ margin-left:8px; font-size:12px; text-decoration:underline; color:#3566d6; }
</style>
