<!-- src/components/FooterLegal.vue -->
<template>
  <div class="legal-bar">
    <div class="container">
      版權所有 © {{ year }} 皮皮同學 ｜ Designed & Built by 皮皮同學
    </div>
  </div>
</template>

<script setup>
const year = new Date().getFullYear()
</script>

<style scoped>
.legal-bar {
  background:#293848;
  border-top:1px solid rgba(255,255,255,.06);
  color:#e2e8f0;
  font-size:13px;
}
.legal-bar .container {
  padding:12px 0;
  text-align:center;
}
</style>
