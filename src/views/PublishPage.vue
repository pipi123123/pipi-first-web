<template>
  <div class="container">
    <h1>📤 毛孩刊登平台</h1>

    <!-- 新增/編輯表單 -->
    <form @submit.prevent="submitForm">
      <input v-model="form.name" placeholder="名字" required />
      <input type="file" accept="image/*" @change="onFileChange" ref="fileInput" />
      <div v-if="form.image" class="preview"><img :src="form.image" alt="預覽" /></div>
      <textarea v-model="form.description" placeholder="描述" required></textarea>
      <div class="form-actions">
        <button type="submit">{{ isEditing ? '儲存更改' : '刊登' }}</button>
        <button v-if="isEditing" type="button" class="ghost" @click="cancelEdit">取消編輯</button>
      </div>
    </form>

    <hr />

    <!-- 清單 -->
    <div v-if="pets.length">
      <h2>🐶 已刊登的毛孩</h2>
      <div class="grid">
        <PetCard v-for="p in pets" :key="p.id" :pet="p" @edit="editPet" @remove="removePet" />
      </div>
    </div>
    <div v-else>尚未有刊登資料。</div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import PetCard from '@/components/PetCard.vue'

const pets = ref([])                                    // 清單
const form = ref({ name: '', image: '', description: '' }) // 表單
const editingId = ref(null)
const isEditing = computed(() => editingId.value !== null)
const fileInput = ref(null)

// 圖片上傳→轉 base64
function onFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) return alert('請選擇圖片')
  if (file.size > 2 * 1024 * 1024) return alert('圖片需小於 2MB')
  const r = new FileReader()
  r.onload = () => (form.value.image = r.result)
  r.readAsDataURL(file)
}

function genId() { return `${Date.now()}-${Math.random().toString(16).slice(2)}` }

// 新增 / 更新
function submitForm() {
  if (!form.value.image) return alert('請先上傳圖片')
  if (isEditing.value) {
    const i = pets.value.findIndex(p => p.id === editingId.value)
    if (i !== -1) pets.value[i] = { id: editingId.value, ...form.value }
    cancelEdit()
  } else {
    pets.value.push({ id: genId(), ...form.value })
    resetForm()
  }
}

// 編輯 / 取消 / 刪除
function editPet(id) {
  const p = pets.value.find(x => x.id === id); if (!p) return
  form.value = { name: p.name, image: p.image, description: p.description }
  editingId.value = id
  if (fileInput.value) fileInput.value.value = ''
}
function cancelEdit() { editingId.value = null; resetForm() }
function resetForm() { form.value = { name: '', image: '', description: '' }; if (fileInput.value) fileInput.value.value = '' }
function removePet(id) { if (!confirm('確定刪除？')) return; pets.value = pets.value.filter(p => p.id !== id) }

// 永續化
onMounted(() => { const s = localStorage.getItem('pets'); if (s) pets.value = JSON.parse(s) })
watch(pets, v => localStorage.setItem('pets', JSON.stringify(v)), { deep: true })
</script>

<style scoped>
.container { max-width: 760px; margin: auto; text-align: center; padding: 2rem 1rem; }
form input, form textarea { display: block; width: 100%; margin: .75rem 0; padding: .6rem; }
.form-actions { display: flex; gap: 8px; justify-content: center; }
button { padding: .6rem 1.2rem; background-color: #007bff; color: #fff; border: none; border-radius: 8px; cursor: pointer; }
.ghost { background: transparent; color: #007bff; border: 1px solid #007bff; }
.preview { margin: 10px 0; }
.preview img { width: 260px; border-radius: 12px; }
.grid { margin-top: 1rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
</style>
