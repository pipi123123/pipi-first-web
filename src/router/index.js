import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/views/HomePage.vue'
import PublishPage from '@/views/PublishPage.vue'
import AdoptPage from '@/views/AdoptPage.vue'

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: HomePage },
    { path: '/publish', component: PublishPage },
    { path: '/adopt', component: AdoptPage }
  ]
})
