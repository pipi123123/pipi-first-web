import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

const isRender = process.env.RENDER === '1' || process.env.RENDER === 'true'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  // GitHub Pages 用子路徑；Render 用根路徑
  base: isRender ? '/' : '/pipi-first-web/'
})
