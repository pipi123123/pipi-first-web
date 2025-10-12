<script setup>
import { useRoute } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import FooterSection from '@/components/FooterSection.vue'

const route = useRoute()
</script>

<template>
  <!-- 導覽列放在所有頁面的最上方 -->
  <NavBar />

  <!-- 其餘頁面內容 -->
  <router-view />

  <!-- Footer：除了浪浪專區 (publish) 不顯示 -->
  <FooterSection v-if="route.name !== 'publish'" />
</template>

<style>
/* App.vue 一般不用太多樣式，背景間距可在各子頁面自行控制 */
</style>
