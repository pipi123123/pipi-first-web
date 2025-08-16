<template>
  <article class="card" v-if="pet">
    <div class="img-wrap">
      <img :src="pet.image || fallback" :alt="pet.name || '浪浪'" loading="lazy" @error="onImgErr" />
      <div class="badges">
        <span class="badge kind">{{ pet.kind || '動物' }}</span>
        <span class="badge sex" :data-sex="pet.sex || ''">
          {{ sexText(pet.sex) }}
        </span>
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
      <div class="phone" v-if="pet.phone">
        <i>☎️</i>
        <a :href="`tel:${cleanPhone(pet.phone)}`">{{ pet.phone }}</a>
      </div>
      <div class="addr" v-if="pet.address">
        <i>📍</i>
        <span>{{ pet.address }}</span>
        <a v-if="mapHref" class="map" :href="mapHref" target="_blank" rel="noopener">地圖</a>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'   // 👈 必須匯入，否則整頁不會渲染

const props = defineProps({
  pet: {
    type: Object,
    required: true,
  },
})

const fallback = 'https://placehold.co/800x600?text=No+Image'

function onImgErr(e) {
  e.target.src = fallback
}
function sexText(s) {
  if (s === 'M') return '公'
  if (s === 'F') return '母'
  return '不限'
}
function yn(v) {
  if (v === true || v === 'Y') return '是'
  if (v === false || v === 'N') return '否'
  return '未知'
}
function cleanPhone(p) {
  return String(p || '').replace(/\s+/g, '')
}

const mapHref = computed(() => {
  const lat = props.pet?.lat
  const lon = props.pet?.lon
  if (lat && lon) return `https://www.google.com/maps?q=${lat},${lon}`
  if (props.pet?.address) return `https://www.google.com/maps?q=${encodeURIComponent(props.pet.address)}`
  return ''
})
</script>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, .06);
  overflow: hidden;
}
.img-wrap {
  position: relative;
  aspect-ratio: 4/3;
  background: #f6f6f6;
}
.img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.badges {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  gap: 6px;
}
.badge {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 999px;
  color: #fff;
  backdrop-filter: blur(6px);
}
.badge.kind { background: #1118; }
.badge.sex[data-sex="M"] { background: #3579f6cc; }
.badge.sex[data-sex="F"] { background: #e24a8bcc; }
.badge.sex:not([data-sex]) { background: #6668; }

.title {
  margin: 8px 12px 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
}
.attrs {
  list-style: none;
  padding: 0 12px;
  margin: 0;
  display: grid;
  gap: 4px;
}
.attrs li {
  color: #444;
  font-size: 14px;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.attrs i {
  width: 18px;
  text-align: center;
  opacity: .8;
  font-style: normal;
}
.shelter {
  padding: 4px 12px 12px;
  display: grid;
  gap: 6px;
  border-top: 1px dashed #eee;
}
.shelter .name,
.shelter .phone,
.shelter .addr {
  font-size: 14px;
  color: #333;
  display: flex;
  gap: 6px;
  align-items: flex-start;
}
.shelter i {
  width: 18px;
  text-align: center;
  opacity: .9;
  font-style: normal;
}
.shelter .map {
  margin-left: 8px;
  font-size: 12px;
  text-decoration: underline;
  color: #3566d6;
}
</style>
