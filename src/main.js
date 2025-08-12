import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 方便檢查是否有正確載入與執行
console.log('[App] Booting. BASE_URL =', import.meta.env.BASE_URL)

const app = createApp(App)

// 全域錯誤攔截（若元件拋錯會出現在 Console）
app.config.errorHandler = (err, instance, info) => {
  console.error('[App error]', err, info)
}

app.use(router)

// 等路由就緒再掛載，避免白屏時抓不到原因
router.isReady().then(() => {
  console.log('[Router] ready')
  app.mount('#app')
})
