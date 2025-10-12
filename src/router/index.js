// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

// 懶載入頁面
const HomePage       = () => import('@/views/HomePage.vue')
const PublishPage    = () => import('@/views/PublishPage.vue')
const AdoptPage      = () => import('@/views/AdoptPage.vue')
const SheltersPage   = () => import('@/views/SheltersPage.vue')
const LostPage       = () => import('@/views/LostPage.vue')
const StatisticsPage = () => import('@/views/StatisticsPage.vue')
const NotFound       = () => import('@/views/NotFound.vue')

const router = createRouter({
  // 用 Vite 內建的 BASE_URL；不要自行覆蓋，避免部署子路徑時出錯
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    { path: '/',        name: 'home',     component: HomePage,       meta: { title: '首頁' } },
    { path: '/publish', name: 'publish',  component: PublishPage,    meta: { title: '刊登協尋' } },

    // 官方認養資訊：把 query 當 props 傳進去，並附上基於 fullPath 的 rvKey 以確保重渲染
    {
      path: '/adopt',
      alias: ['/adopt/'], // 斜線結尾也導向同頁
      name: 'adopt',
      component: AdoptPage,
      props: route => ({ ...route.query, rvKey: route.fullPath }),
      meta: { title: '浪浪認養' },
    },

    { path: '/shelters', name: 'shelters', component: SheltersPage,   meta: { title: '收容所清單' } },
    { path: '/lost',     name: 'lost',     component: LostPage,       meta: { title: '寵物遺失啟事' } },
    { path: '/stats',    name: 'stats',    component: StatisticsPage, meta: { title: '收容所統計' } },

    // 404（需放最後）
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound, meta: { title: '找不到頁面' } },
  ],

  // 捲動行為：定位到錨點或回頂，預設用 smooth
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0, behavior: 'smooth' }
  },
})

// -------- 動態設定頁面標題 --------
router.afterEach((to) => {
  const BASE_TITLE = '皮皮的動物資訊網'
  const t = to.meta?.title

  // 首頁只顯示站名；其他頁「頁面標題 – 站名」
  if (!t || to.name === 'home') {
    document.title = BASE_TITLE
  } else {
    document.title = `${t} – ${BASE_TITLE}`
  }

  if (import.meta.env.DEV) {
    console.info(`[router] navigated to: ${to.fullPath}  (title="${document.title}")`)
  }
})

export default router
