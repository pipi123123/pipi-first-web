<template>
  <div class="card">
    <!-- 毛孩圖片 -->
    <img :src="pet.image" alt="pet" loading="lazy" />


    <!-- 名稱與描述 -->
    <h3>{{ pet.name }}</h3>
    <p>{{ pet.description }}</p>

    <!-- 操作按鈕（編輯 / 刪除） -->
    <div class="actions">
      <button class="secondary" @click="$emit('edit', pet.id)">編輯</button>
      <button class="danger" @click="$emit('remove', pet.id)">刪除</button>
    </div>
  </div>
</template>

<script setup>
/* 接收父層傳入的毛孩資料 */
defineProps({ pet: { type: Object, required: true } })

/* 定義可觸發的事件 */
defineEmits(['edit','remove'])
</script>

<style scoped>
.card { border: 1px solid #eee; border-radius: 12px; padding: 12px; text-align: center; background: #fff; }
.card img { width: 260px; border-radius: 12px; }
.actions { display: flex; gap: 8px; justify-content: center; margin-top: 10px; }
.secondary { padding: 6px 12px; border: none; background: #6c757d; color: #fff; border-radius: 8px; cursor: pointer; }
.secondary:hover { background: #5a6268; }
.danger { padding: 6px 12px; border: none; background: #e54d42; color: #fff; border-radius: 8px; cursor: pointer; }
.danger:hover { background: #cc3f36; }
</style>
