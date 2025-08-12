import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/views/HomePage.vue'
import PublishPage from '@/views/PublishPage.vue'
import AdoptPage from '@/views/AdoptPage.vue'   // ⬅️ 新增

const routes = [
  { path: '/', component: HomePage },
  { path: '/publish', component: PublishPage },
  { path: '/adopt', component: AdoptPage }      // ⬅️ 新增
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
