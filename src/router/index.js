// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

// 懶載入頁面
const HomePage        = () => import('@/views/HomePage.vue')
const PublishPage     = () => import('@/views/PublishPage.vue')
const AdoptPage       = () => import('@/views/AdoptPage.vue')
const SheltersPage    = () => import('@/views/SheltersPage.vue')
const LostPage        = () => import('@/views/LostPage.vue')
const StatisticsPage  = () => import('@/views/StatisticsPage.vue') // ⬅️ 新增統計頁
const NotFound        = () => import('@/views/NotFound.vue')

// 若你的專案會部署到子路徑（例如 GitHub Pages），請確認 Vite 的 base 已正確設定，這裡用環境變數即可
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL || '/'),
  routes: [
    { path: '/',         name: 'home',      component: HomePage,        meta: { title: '首頁' } },
    { path: '/publish',  name: 'publish',   component: PublishPage,     meta: { title: '刊登協尋' } },

    // 官方認養資訊（將查詢參數當成 props 傳入，例如 ?city=65000&kind=dog）
    { 
      path: '/adopt',    
      name: 'adopt',     
      component: AdoptPage,    
      props: route => ({ ...route.query }), 
      meta: { title: '官方認養資訊' } 
    },

    // 收容所清單
    { path: '/shelters', name: 'shelters',  component: SheltersPage,    meta: { title: '收容所清單' } },

    // 遺失啟事
    { path: '/lost',     name: 'lost',      component: LostPage,        meta: { title: '寵物遺失啟事' } },

    // ⬅️ 新增：收容所統計頁
    { path: '/stats',    name: 'stats',     component: StatisticsPage,  meta: { title: '收容所統計' } },

    // 404（需放最後）
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound, meta: { title: '找不到頁面' } },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

// 動態設定頁面標題
router.afterEach((to) => {
  const base = '毛孩之家'
  document.title = to.meta?.title ? `${to.meta.title}｜${base}` : base
})

export default router
