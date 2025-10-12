// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 載入全域樣式（深色主題 / reset 等）
import './style.css'

// 啟動訊息（可確認 BASE_URL 是否正確）
console.log('[App] Booting. BASE_URL =', import.meta.env.BASE_URL)

const app = createApp(App)

// 全域錯誤攔截（元件執行期錯誤）
app.config.errorHandler = (err, instance, info) => {
  console.error('[App error]', err, info)
}

// 未攔截的 Promise 錯誤（例如 fetch/await）
window.addEventListener('unhandledrejection', (e) => {
  console.error('[Unhandled promise]', e.reason ?? e)
})

app.use(router)

// 等路由就緒再掛載，避免白屏或標題/導航尚未就緒
router.isReady()
  .then(() => {
    console.log('[Router] ready')
    app.mount('#app')
  })
  .catch((e) => {
    console.error('[Router] failed to become ready', e)
    // 仍嘗試掛載，避免卡住
    app.mount('#app')
  })
