<template>
  <div class="card">
    <!-- 卡片內容 -->
    <div class="img-wrap" v-if="pet.image" @click="openStory">
      <img :src="pet.image" :alt="pet.name" />
    </div>
    <h3 class="name" @click="openStory">{{ pet.name }}</h3>
    <p class="desc">{{ pet.description }}</p>

    <div class="actions">
      <button class="btn" @click="$emit('edit', pet.id)">編輯</button>
      <button class="btn danger" @click="$emit('remove', pet.id)">刪除</button>
      <button class="btn ghost" @click="openStory">看故事</button>
    </div>

    <!-- 故事 Modal -->
    <div v-if="show" class="backdrop" @click.self="closeStory">
      <div class="modal" role="dialog" aria-modal="true" :aria-label="pet.name + ' 的小故事'">
        <button class="btn-x" @click="closeStory" aria-label="關閉">✕</button>

        <h2 class="modal-title">{{ pet.name }}</h2>

        <!-- ★ 可捲動內容：圖片 + 文字 -->
        <div class="modal-scroll">
          <div v-if="pet.image" class="modal-img">
            <img :src="pet.image" :alt="pet.name" />
          </div>

          <div class="modal-body">
            <p class="story">{{ pet.description }}</p>
          </div>
        </div>

        <!-- 底部操作列 -->
        <div class="modal-actions">
          <button class="btn primary" @click="closeStory">關閉</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  pet: { type: Object, required: true }
})
defineEmits(['edit','remove'])

const show = ref(false)
function openStory(){ show.value = true }
function closeStory(){ show.value = false }
</script>

<style scoped>
/* 卡片 */
.card{
  background:#fff;
  border:1px solid #e5e7eb;
  border-radius:14px;
  box-shadow:0 8px 20px rgba(0,0,0,.06);
  padding:12px;
  display:flex; flex-direction:column; gap:8px;
}
.img-wrap{
  aspect-ratio: 4 / 3;
  overflow:hidden;
  border-radius:12px;
  background:#f3f4f6;
  cursor:pointer;
}
.img-wrap img{ width:100%; height:100%; object-fit:cover; display:block; }
.name{ margin:6px 0 0; font-size:18px; cursor:pointer; }
.desc{ margin:0; color:#555; min-height:2lh; }
.actions{ display:flex; gap:8px; margin-top:8px; flex-wrap:wrap; }
.btn{
  flex:1; padding:.5rem .8rem;
  border:1px solid #cbd5e1; border-radius:10px;
  background:#f8fafc; cursor:pointer; font-weight:600;
}
.btn:hover{ background:#eef2f7; }
.btn.danger{ color:#b91c1c; border-color:#fecaca; background:#fff1f2; }
.btn.danger:hover{ background:#ffe4e6; }
.btn.ghost{ background:#fff; color:#3b82f6; border:1px solid #bfdbfe; }

/* Modal 背景 */
.backdrop{
  position:fixed; inset:0; z-index:9999;
  background:rgba(0,0,0,.55);
  display:flex; align-items:center; justify-content:center;
  padding:16px;
  overflow:auto;
}

/* Modal 主體 */
.modal{
  box-sizing:border-box;
  width: min(720px, 92vw);
  max-height: 92vh;
  background:#fff;
  border-radius:14px;
  box-shadow:0 12px 36px rgba(0,0,0,.35);
  display:flex;
  flex-direction:column;
  overflow:hidden;
  position:relative;
}

/* 關閉按鈕 */
.btn-x{
  position:absolute; top:10px; right:10px;
  background:#fff; border:1px solid #e5e7eb; border-radius:999px;
  width:32px; height:32px; line-height:30px; text-align:center; cursor:pointer;
  box-shadow:0 2px 8px rgba(0,0,0,.12);
}
.btn-x:hover{ background:#f3f4f6; }

/* Modal 標題 */
.modal-title{
  margin:14px 16px 8px; font-size:20px; font-weight:900; color:#111827;
}

/* ★ 可捲動內容 */
.modal-scroll{
  flex: 1 1 auto;
  overflow:auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 16px 12px;
}
.modal-img{ margin-bottom:12px; }
.modal-img img{
  display:block;
  width:100%;
  height:auto;
  max-height:none;
  object-fit: contain;
  border-radius:12px;
}
.modal-body{ padding-bottom: 6px; }
.story{ font-size:15px; line-height:1.75; color:#374151; white-space:pre-line; }

/* 底部操作列 */
.modal-actions{
  padding:12px 16px 16px;
  display:flex; justify-content:flex-end;
  background: linear-gradient(180deg, transparent, rgba(0,0,0,.03));
  border-top: 1px solid #eef2f7;
}
.btn.primary{
  background:#3b82f6; color:#fff; border:0; border-radius:10px; padding:.55rem 1rem;
  box-shadow:0 6px 16px rgba(59,130,246,.25); font-weight:800;
}
.btn.primary:hover{ background:#2563eb; }

@media (max-width: 480px){
  .modal{ width: 94vw; }
}
</style>
