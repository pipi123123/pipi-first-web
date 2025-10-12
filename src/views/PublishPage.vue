<!-- src/views/PublishPage.vue -->
<template>
  <div class="page-publish">
    <div class="container">
      <h1 class="title">
        <span class="ic" aria-hidden="true">📤</span>
        毛孩刊登平台
      </h1>

      <!-- 新增/編輯表單 -->
      <form @submit.prevent="submitForm" class="form">
        <input v-model="form.name" placeholder="名字" required />
        <input type="file" accept="image/*" @change="onFileChange" ref="fileInput" />

        <div v-if="form.image" class="preview">
          <img :src="form.image" alt="預覽" />
        </div>

        <textarea v-model="form.description" placeholder="描述（會成為小故事全文）" required></textarea>

        <div class="form-actions">
          <button type="submit">{{ isEditing ? '儲存更改' : '刊登' }}</button>
          <button v-if="isEditing" type="button" class="ghost" @click="cancelEdit">取消編輯</button>
        </div>
      </form>

      <hr class="sep" />

      <!-- 測試 API -->
      <div class="form-actions">
        <button type="button" @click="checkHealth">🔍 測試後端 API</button>
      </div>
      <div v-if="loading">檢查中…</div>
      <pre v-if="health" class="pre">{{ pretty(health) }}</pre>
      <div v-if="err" class="err">錯誤：{{ err }}</div>

      <hr class="sep" />

      <!-- 清單（使用可開小故事的卡片） -->
      <div v-if="pets.length">
        <h2 class="sub">🐶 已刊登的毛孩</h2>
        <div class="grid">
          <PublishStoryCard
            v-for="p in pets"
            :key="p.id"
            :pet="p"
            @edit="editPet"
            @remove="removePet"
          />
        </div>
      </div>
      <div v-else class="empty">尚未有刊登資料。</div>
    </div>

    <!-- 只在本頁顯示的精簡版版權列 -->
    <FooterLegal />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PublishStoryCard from '@/components/PublishStoryCard.vue' // ← 換成會開小故事的卡片
import FooterLegal from '@/components/FooterLegal.vue'
import { api } from '@/services/api'

/* ---------------- state ---------------- */
const pets = ref([])
const form = ref({ name: '', image: '', description: '' })
const editingId = ref(null)
const isEditing = computed(() => editingId.value !== null)
const fileInput = ref(null)

const health = ref(null)
const loading = ref(false)
const err = ref('')
const pretty = (obj) => JSON.stringify(obj, null, 2)

/* ---------------- helpers ---------------- */
function exposeId(doc) {
  if (!doc) return doc
  return { ...doc, id: doc.id || doc._id }
}
function pickId(val) {
  if (!val) return null
  if (typeof val === 'string') return val
  return val.id || val._id || null
}
function resetForm() {
  form.value = { name: '', image: '', description: '' }
  if (fileInput.value) fileInput.value.value = ''
}

/* ---------------- API actions ---------------- */
async function checkHealth () {
  loading.value = true
  err.value = ''
  health.value = null
  try {
    health.value = await api.health()
  } catch (e) {
    err.value = String(e?.message || e)
  } finally {
    loading.value = false
  }
}

async function fetchList () {
  try {
    const list = await api.listPets()
    pets.value = list.map(exposeId)
  } catch (e) {
    console.error(e)
    alert('讀取清單失敗')
  }
}

async function submitForm () {
  if (!form.value.name || !form.value.image || !form.value.description) {
    return alert('請完整填寫「名字、圖片、描述」')
  }
  try {
    if (isEditing.value) {
      await api.updatePet(editingId.value, { ...form.value })
      alert('更新成功')
      cancelEdit()
    } else {
      await api.createPet({ ...form.value })
      alert('新增成功')
      resetForm()
    }
    await fetchList()
  } catch (e) {
    console.error(e)
    alert('送出失敗：' + (e?.message || e))
  }
}

function editPet (payload) {
  const id = pickId(payload)
  const p = pets.value.find(x => x.id === id)
  if (!p) return
  editingId.value = id
  form.value = { name: p.name || '', image: p.image || '', description: p.description || '' }
  if (fileInput.value) fileInput.value.value = ''
}

function cancelEdit () {
  editingId.value = null
  resetForm()
}

async function removePet (payload) {
  const id = pickId(payload)
  if (!id) return
  if (!confirm('確定刪除？')) return
  try {
    await api.removePet(id)
    await fetchList()
  } catch (e) {
    console.error(e)
    alert('刪除失敗：' + (e?.message || e))
  }
}

/* ---------------- file -> base64 ---------------- */
function onFileChange (e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) return alert('請選擇圖片')
  if (file.size > 2 * 1024 * 1024) return alert('圖片需小於 2MB')
  const r = new FileReader()
  r.onload = () => (form.value.image = r.result)
  r.readAsDataURL(file)
}

/* ---------------- init ---------------- */
onMounted(fetchList)
</script>

<style scoped>
.page-publish{
  display:flex; flex-direction:column; min-height:100dvh;
  background: var(--bg, #f3f6fb);
}
.container { max-width: 760px; margin: 0 auto; text-align: center; padding: 24px 16px; flex:1 0 auto; }

/* 標題 */
.title{
  margin: 4px 0 14px;
  font-weight: 900;
  font-size: clamp(22px, 3.2vw, 32px);
  letter-spacing: .3px;
  color:#1f2937;
  display:inline-flex; align-items:center; gap:10px;
}
.title .ic{ font-size: .95em; }

/* 表單 */
.form input,
.form textarea {
  display: block; width: 100%;
  margin: .75rem 0; padding: .6rem .75rem;
  border-radius: 10px; border:1px solid #dfe3eb; background:#fff;
  outline: none;
}
.form input:focus,
.form textarea:focus{ border-color:#7da1ff; box-shadow:0 0 0 3px rgba(125,161,255,.18); }
.form textarea{ min-height: 120px; resize: vertical; }

.form-actions { display: flex; gap: 10px; justify-content: center; margin-top: 4px; }
button {
  padding: .6rem 1.2rem;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #fff; border: none; border-radius: 999px; cursor: pointer;
  font-weight: 900;
  box-shadow: 0 8px 20px rgba(59,130,246,.25);
  transition: transform .12s ease, filter .12s ease;
}
button:hover{ transform: translateY(-1px); filter: brightness(1.05); }
.ghost { background: transparent; color: #3b82f6; border: 1px solid #93c5fd; box-shadow:none; }

.preview { margin: 10px 0; }
.preview img { width: 260px; border-radius: 12px; border:1px solid #e5e7eb; background:#fff; }

.sep{
  margin: 16px auto;
  height: 1px; border: 0;
  background: linear-gradient(90deg, transparent, #dbe3f5, transparent);
}

.sub{ margin: 6px 0 10px; font-weight: 900; color:#1f2937; }
.grid { margin-top: 10px; display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }

.pre { text-align: left; background: #f6f7fb; padding: 10px; border-radius: 8px; border:1px solid #e5e7f2; }
.err { color:#b00020; margin-top: 8px; }
.empty{ color:#6b7280; }

/* 讓底部版權列貼緊頁面底端 */
:deep(.legal-bar){ flex: 0 0 auto; }
</style>
