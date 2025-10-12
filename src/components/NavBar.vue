<script setup>
import { RouterLink } from 'vue-router'
import logoPi from '@/assets/logo-pi.png'
</script>

<template>
  <!-- NAV（深色漸層＋專業膠囊按鈕） -->
  <header class="nav">
    <div class="container nav-inner">
      <RouterLink class="brand" :to="{ name: 'home' }" aria-label="回首頁">
        <img :src="logoPi" alt="皮皮 Logo" class="logo-img" />
        <strong class="name">皮皮的動物資訊網</strong>
      </RouterLink>

      <nav class="links" aria-label="主選單">
        <RouterLink :to="{name:'adopt'}"    class="link pill">浪浪認養</RouterLink>
        <RouterLink :to="{name:'shelters'}" class="link pill">公立收容所</RouterLink>
        <RouterLink :to="{name:'lost'}"     class="link pill">寵物遺失</RouterLink>
        <RouterLink :to="{name:'stats'}"    class="link pill">收容所處理統計</RouterLink>

        <RouterLink class="cta" :to="{name:'publish'}">
          <span>浪浪專區</span>
          <svg class="cta-ic" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h12m0 0-4-4m4 4-4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </RouterLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
/* 共用容器寬度（與首頁一致） */
.container{ width:min(1180px,92vw); margin:0 auto; }

/* ===== 導覽列（深色漸層＋高對比） ===== */
.nav{
  position: sticky; top: 0; z-index: 50;
  background: linear-gradient(180deg, #0b1220 0%, #0f172a 100%);
  backdrop-filter: saturate(120%) blur(6px);
  -webkit-backdrop-filter: saturate(120%) blur(6px);
  border-bottom: 1px solid rgba(255,255,255,.08);
  box-shadow: 0 10px 24px rgba(2,6,23,.35);
}
.nav-inner{ display:flex; align-items:center; justify-content:space-between; padding:14px 0; }
.brand{ display:flex; align-items:center; gap:14px; text-decoration:none; color:inherit; }
.logo-img{
  width:56px; height:56px; object-fit:contain; border-radius:14px;
  background: #ffffff; border: 1px solid rgba(255,255,255,.55);
  box-shadow: 0 6px 16px rgba(0,0,0,.18);
}
.name{
  color:#f8fafc; font-weight:1000; letter-spacing:.8px;
  font-size: clamp(22px, 2.2vw, 30px); line-height:1.05;
  text-shadow: 0 1px 0 rgba(0,0,0,.25);
}

/* ---- 導覽列按鈕 ---- */
.links{ display:flex; gap:18px; align-items:center; }
.link{
  position:relative; text-decoration:none; color:#e5e7eb;
  font-weight:800; letter-spacing:.25px; font-size: clamp(15px, 1.1vw, 17px);
  padding:10px 14px; border-radius:999px;
  background: rgba(255,255,255,.06);
  border:1px solid rgba(255,255,255,.14);
  transition: color .15s, background-color .15s, transform .12s, border-color .15s;
}
.link:hover{ background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.22); transform: translateY(-1px); }
.link::after{
  content:""; position:absolute; left:14px; right:14px; bottom:6px; height:2px; border-radius:2px; background:#60a5fa;
  transform:scaleX(0); transform-origin:left; transition:transform .18s;
}
/* 高亮目前頁籤 */
:global(.router-link-active.link){ color:#bfdbfe; background: rgba(96,165,250,.18); border-color: rgba(147,197,253,.35); }
:global(.router-link-active.link)::after{ transform:scaleX(1); }

/* 主要 CTA */
.cta{
  --from:#3b82f6; --to:#6366f1;
  position:relative; display:inline-flex; align-items:center; gap:8px;
  text-decoration:none; color:#ffffff; font-weight:900;
  padding:12px 20px; border-radius:999px;
  background: linear-gradient(135deg,var(--from),var(--to));
  border:1px solid rgba(255,255,255,.22);
  box-shadow: 0 10px 28px rgba(59,130,246,.28);
  transition: transform .12s, filter .12s, box-shadow .12s; overflow:hidden;
}
.cta-ic{ width:18px; height:18px; opacity:.95; }
.cta::before{
  content:""; position:absolute; inset:-40%;
  background: linear-gradient(60deg, transparent 45%, rgba(255,255,255,.35) 50%, transparent 55%);
  transform: translateX(-80%) rotate(8deg); transition: transform .6s ease;
}
.cta:hover{ transform: translateY(-1px); filter: brightness(1.06); box-shadow: 0 14px 32px rgba(59,130,246,.34); }
.cta:hover::before{ transform: translateX(10%) rotate(8deg); }
</style>
