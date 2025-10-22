// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

// 說明：
// - 開發環境（npm run dev）：前端呼叫 /api/* 會被 Vite 代理到你的後端 (http://localhost:3000)
// - 正式/預覽（npm run build → 部署）：請在環境變數提供 VITE_API_URL，前端會直打該位址
// - GitHub Pages 需要子路徑 base；Render/一般伺服器用根路徑

export default defineConfig(({ mode }) => {
  const isRender =
    process.env.RENDER === '1' || process.env.RENDER === 'true'

  // 正式環境要打的後端 Origin（例如 https://your-api.example.com）
  const VITE_API_URL = process.env.VITE_API_URL || ''

  // 開發時，Vite 代理要轉到哪個後端（你的 Express）
  const PROXY_TARGET = process.env.VITE_PROXY_TARGET || 'http://localhost:3000'

  console.log('[Render Build] VITE_API_URL =', VITE_API_URL)


  return {
    plugins: [vue()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    // GitHub Pages 用子路徑；Render/一般主機用根路徑
    base: isRender ? '/' : '/pipi-first-web/',

    server: {
      host: true,     // 可用同網段其它裝置連線（選用）
      port: 5173,
      cors: true,
      // 只有 dev server 會啟用；build 後不會走這段
      proxy: {
        '/api': {
          target: PROXY_TARGET,
          changeOrigin: true,
          secure: false,
          // 若你的後端不是以 /api 開頭，可開啟 rewrite：
          // rewrite: p => p.replace(/^\/api/, '')
        },
      },
    },

    // 把 VITE_API_URL 注入前端程式（前端用 import.meta.env.VITE_API_URL 讀）
    define: {
      'import.meta.env': {
        VITE_API_URL: JSON.stringify('https://furfriends-backend.onrender.com')
      }
    }


  }
})
