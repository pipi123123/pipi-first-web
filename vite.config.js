// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

/*
說明：
- 開發環境（npm run dev）：
    /api/* 會被 Vite 自動代理到你的本機後端 (http://localhost:3000)
- Render / 正式部署：
    若設定了環境變數 VITE_API_URL，前端會使用該 URL；
    若沒設定，則前端將直接連到政府開放資料（前端直連模式）
- GitHub Pages 需要子路徑 base；Render/一般伺服器用根路徑
*/

export default defineConfig(({ mode }) => {
  const isRender =
    process.env.RENDER === '1' || process.env.RENDER === 'true'

  // Render 正式環境的 API 來源（可在 Render Environment 設定）
  const VITE_API_URL = process.env.VITE_API_URL?.trim() || ''

  // 開發時代理的目標（本機 Express）
  const PROXY_TARGET = process.env.VITE_PROXY_TARGET || 'http://localhost:3000'

  console.log('============================')
  console.log('[環境偵測]')
  console.log('mode          =', mode)
  console.log('isRender      =', isRender)
  console.log('VITE_API_URL  =', VITE_API_URL || '(未設定，將使用前端直連模式)')
  console.log('============================')

  return {
    plugins: [vue()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    // Render 用根路徑；GitHub Pages 用子路徑
    base: isRender ? '/' : '/pipi-first-web/',

    server: {
      host: true, // 可在局域網測試
      port: 5173,
      cors: true,
      // 只在開發時啟用
      proxy: {
        '/api': {
          target: PROXY_TARGET,
          changeOrigin: true,
          secure: false,
        },
      },
    },

    // 不再強制覆蓋 import.meta.env，改由系統環境注入
    define: {
      'process.env': {}, // 避免部分套件使用 process.env 出錯
    },
  }
})
