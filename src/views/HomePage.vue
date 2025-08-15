<template>
  <div class="container">
    <h1>🐾 毛孩之家 🐾</h1>
    <p>這裡是流浪動物的中途驛站，歡迎刊登與認養毛孩！</p>
    <img src="https://images.unsplash.com/photo-1558788353-f76d92427f16" alt="可愛狗狗">
    <br />
    <router-link to="/publish" class="btn">前往刊登平台</router-link>
    &nbsp;
    <router-link to="/adopt" class="btn">官方認養資訊</router-link> <!-- ⬅️ 新增 -->
    &nbsp;
    <router-link to="/shelters" class="btn">查看收容所</router-link> <!-- 新增 -->
  </div>
</template>

<style scoped>
/* 其餘維持你原本的樣式 */
.container {
  text-align: center;
  padding: 2rem;
  font-family: "微軟正黑體", sans-serif;
  background-color: #fff8f2;
  min-height: 100vh;
}
h1 { color: #ff6f61; font-size: 40px; }
p { font-size: 20px; color: #333; }
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
}
.btn:hover { background-color: #e8554f; }
</style>
