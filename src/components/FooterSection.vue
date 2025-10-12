<template>
  <footer class="footer">
    <div class="container foot">
      <!-- 品牌抬頭 -->
      <div class="brand-big">
        <img :src="logoPi" class="mark" alt="站點標誌" />
        <strong class="site-name">皮皮的動物資訊網</strong>
        <img :src="logoPi" class="mark" alt="" aria-hidden="true" />
      </div>

      <!-- 資料來源說明 -->
      <p class="note">
        本站整合政府資料開放平台與農業部公開資訊，提供透明、即時的動保資訊服務；資料僅供公益展示與查詢使用。
      </p>

      <!-- 個人簽名徽章 -->
      <div class="signature" aria-label="製作者資訊">
        <img :src="logoPi" class="sig-logo" alt="皮皮同學 Logo" />
        <span class="sig-text">設計與製作 <strong>皮皮同學</strong></span>
      </div>
    </div>

    <!-- 法務資訊列 -->
    <div class="legal-bar">
      <div class="container">
        版權所有 © {{ year }} 皮皮同學　｜　Designed & Built by 皮皮同學
      </div>
    </div>
  </footer>
</template>

<script setup>
import logoPi from '@/assets/logo-pi.png'
const year = new Date().getFullYear()
</script>

<style scoped>
/* 這裡複製你首頁 Footer 的 CSS */
.footer{
  background: linear-gradient(180deg, #0f172a 0%, #0b1624 100%);
  color:#e5e7eb;
  border-top:1px solid rgba(255,255,255,.08);
  box-shadow: inset 0 6px 12px rgba(0,0,0,.35);
}
.foot{ padding:28px 0 24px; display:flex; flex-direction:column; align-items:center; gap:16px; }
.brand-big{ display:flex; align-items:center; gap:14px; }
.mark{ width:28px; height:28px; border-radius:8px; background:#fff; }
.site-name{ font-weight:900; font-size:22px; color:#fff; }
.note{ font-size:13.5px; color:#a7b0bc; max-width:720px; text-align:center; }
.signature{ display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:12px;
  background: rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.12); }
.sig-logo{ width:24px; height:24px; background:#fff; border-radius:6px; }
.sig-text{ font-size:14px; color:#dbe4ef; }
.sig-text strong{ color:#fff; font-weight:900; }
.legal-bar{ background:#293848; font-size:13px; color:#e2e8f0; text-align:center; padding:12px 0; }
</style>
