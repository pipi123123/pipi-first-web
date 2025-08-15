<template>
  <div class="container">
    <h1>毛孩之家</h1>
    <p>這裡是流浪動物的中途驛站，歡迎刊登與認養毛孩！</p>
    <img src="https://images.unsplash.com/photo-1558788353-f76d92427f16" alt="可愛狗狗" />
    <br />
    <router-link to="/publish" class="btn">前往刊登平台</router-link>
    &nbsp;
    <router-link to="/adopt" class="btn">官方認養資訊</router-link>
    &nbsp;
    <router-link to="/shelters" class="btn">查看收容所</router-link>

    <!-- 驗證後端 API -->
    <div class="api-box">
      <button class="btn" @click="ping" :disabled="loading">
        {{ loading ? '檢查中...' : '健康檢查' }}
      </button>
      <button class="btn outline" @click="peekAdopt" :disabled="loadingAdopt">
        {{ loadingAdopt ? '讀取中...' : '試抓認養資料' }}
      </button>
      <pre class="result" v-if="result">{{ result }}</pre>
      <p class="hint" v-if="adoptCount !== null">認養資料筆數：{{ adoptCount }}</p>
      <p class="err" v-if="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { api } from '@/services/api'

const result = ref('')
const error = ref('')
const adoptCount = ref(null)
const loading = ref(false)
const loadingAdopt = ref(false)

async function ping() {
  result.value = ''
  error.value = ''
  adoptCount.value = null
  loading.value = true
  try {
    const r = await api.health()
    result.value = JSON.stringify(r, null, 2)
  } catch (e) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
}

async function peekAdopt() {
  result.value = ''
  error.value = ''
  adoptCount.value = null
  loadingAdopt.value = true
  try {
    const data = await api.adopt()
    adoptCount.value = Array.isArray(data) ? data.length : 0
    result.value = Array.isArray(data)
      ? JSON.stringify(data.slice(0, 3), null, 2) // 只預覽前 3 筆
      : JSON.stringify(data, null, 2)
  } catch (e) {
    error.value = e?.message || String(e)
  } finally {
    loadingAdopt.value = false
  }
}
</script>

<style scoped>
.container {
  text-align: center;
  padding: 2rem;
  font-family: "微軟正黑體", sans-serif;
  background-color: #fff8f2;
  min-height: 100vh;
}
h1 { color: #ff6f61; font-size: 40px; margin: 0 0 0.5rem; }
p { font-size: 20px; color: #333; margin: 0.5rem 0; }
img { width: 300px; border-radius: 20px; margin-top: 20px; }
.btn {
  display: inline-block;
  margin-top: 30px;
  padding: 10px 20px;
  background-color: #ff6f61;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-size: 18px;
  transition: background-color 0.3s;
  border: none;
  cursor: pointer;
}
.btn:hover { background-color: #e8554f; }
.btn.outline {
  background-color: white;
  color: #ff6f61;
  border: 2px solid #ff6f61;
  margin-left: 10px;
}
.btn.outline:hover { background-color: #ffe8e6; }

.api-box {
  max-width: 820px;
  margin: 20px auto 0;
}
.result {
  text-align: left;
  background: #1e1e1e;
  color: #eaeaea;
  padding: 12px 14px;
  border-radius: 10px;
  margin-top: 14px;
  overflow: auto;
  max-height: 320px;
  font-size: 14px;
}
.hint { color: #0a7f2e; margin-top: 8px; }
.err  { color: #b00020; margin-top: 8px; }
</style>
