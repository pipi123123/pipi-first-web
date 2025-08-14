// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

// 懶載入頁面，打包更小、首屏更快
const HomePage   = () => import('@/views/HomePage.vue')
const PublishPage = () => import('@/views/PublishPage.vue')
const AdoptPage   = () => import('@/views/AdoptPage.vue')
const NotFound    = () => import('@/views/NotFound.vue') // 沒此檔時可先建立一個簡單頁面

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL || '/'),
  routes: [
    { path: '/', name: 'home', component: HomePage, meta: { title: '首頁' } },
    { path: '/publish', name: 'publish', component: PublishPage, meta: { title: '刊登協尋' } },
    // 將查詢參數當成 props 傳入（例如 ?city=65000&kind=dog）
    { path: '/adopt', name: 'adopt', component: AdoptPage, props: route => ({ ...route.query }), meta: { title: '官方認養資訊' } },

    // 404（需放在最後）
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound, meta: { title: '找不到頁面' } },
  ],
  // 回到頂部，或若有錨點則滾到錨點
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

// 動態設定頁標題（可自行微調）
router.afterEach((to) => {
  const base = '毛孩之家'
  document.title = to.meta?.title ? `${to.meta.title}｜${base}` : base
})

export default router
