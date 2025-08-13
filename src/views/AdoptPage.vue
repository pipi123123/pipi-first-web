<template>
  <div class="container">
    <h1>🐾 官方認養資訊（COA OpenData）</h1>

    <div class="sub" style="margin:8px 0 16px">
      每日更新的收容動物清單（資料來源：農委會 OpenData）
    </div>

    <div v-if="loading">載入中…</div>
    <div v-else-if="error" style="color:#d33">載入失敗：{{ error }}</div>

    <div v-else>
      <div v-if="pets.length" class="grid">
        <PetCard
          v-for="p in pets"
          :key="p.id"
          :pet="p"
          @edit="noop"
          @remove="noop"
        />
      </div>
      <div v-else class="sub">目前沒有可顯示的資料</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PetCard from '@/components/PetCard.vue'
import { getAdoptList } from '@/services/petService'   // ✅ 改成呼叫自己的 API

const loading = ref(true)
const error = ref('')
const pets = ref([])

// 把 API 回傳欄位轉成 PetCard 需要的結構
function mapToPetCard(item) {
  const name = `${item.animal_kind || '動物'}${item.animal_sex ? `（${item.animal_sex}）` : ''}`
  const descParts = [
    item.shelter_name,
    item.animal_place || item.animal_foundplace,
    item.animal_colour
  ].filter(Boolean)
  return {
    id: item.animal_id || `${item.animal_kind}-${item.shelter_name}-${Math.random().toString(16).slice(2)}`,
    name,
    image: item.album_file || 'https://placehold.co/600x400?text=No+Image',
    description: descParts.join('｜')
  }
}

function noop() {
  // 官方資料僅展示，不提供編輯/刪除
}

onMounted(async () => {
  try {
    const data = await getAdoptList()               // ✅ 用 services 取資料
    pets.value = (Array.isArray(data) ? data : []).map(mapToPetCard)
    // 想限制顯示筆數可加： .slice(0, 60)
  } catch (e) {
    error.value = String(e?.message || e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* 使用現有 .container / .grid 全域樣式即可 */
</style>
