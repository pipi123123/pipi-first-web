<script setup>
/* 圖片（都從 src/assets 讀取） */
import logoPi from '@/assets/logo-pi.png'
import catHero from '@/assets/cat-hero.jpg'
</script>

<template>
  <div class="page">
    <!-- ✅ 導覽列已改放 App.vue 的 <NavBar />，這裡不要再放 -->

    <!-- HERO -->
    <section class="hero">
      <div class="bg-blobs">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
      </div>

      <div class="container hero-grid">
        <div class="copy">
          <span class="chip">官方資料串接 · 即時更新</span>

          <h1 class="h1">讓每隻毛孩，都能找到回家的路</h1>
          <h2 class="h2">一站式協尋 · 認養 · 收容 · 統計</h2>

          <p class="lead">
            我們以公開資料與專業工具，打造透明可信的動保平台。
          </p>
          <p class="lead">
            從浪浪專區、即時認養、收容所查詢到趨勢報表，幫你用數據與行動守護毛孩。
          </p>

          <div class="cta-row">
            <router-link class="btn primary" :to="{name:'publish'}">立即刊登</router-link>
            <router-link class="btn ghost" :to="{name:'adopt'}">探索認養名單</router-link>
          </div>

          <ul class="stats">
            <li><span class="n">417+</span><span class="k">收容所資料</span></li>
            <li><span class="n">9,999+</span><span class="k">遺失啟事</span></li>
            <li><span class="n">即時</span><span class="k">官方來源同步</span></li>
          </ul>
        </div>

        <figure class="shot">
          <div class="photo-card">
            <img :src="catHero" alt="可愛貓咪" loading="eager" />
            <div class="halo"></div>
          </div>
        </figure>
      </div>

      <div class="wave"></div>
    </section>

    <!-- 功能卡片（深色版型，SVG 圖示） -->
    <section class="features">
      <div class="container cards">
        <router-link :to="{ name: 'publish' }" class="card c1">
          <div class="ic" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M7 3h6l4 4v14H7z" fill="none" stroke="currentColor" stroke-width="2" />
              <path d="M13 3v5h5" fill="none" stroke="currentColor" stroke-width="2" />
              <path d="M9 13h6M9 17h6" fill="none" stroke="currentColor" stroke-width="2" />
            </svg>
          </div>
          <h3>浪浪專區</h3>
          <p>集中浪浪資訊：認養、協尋、分享都在這裡。</p>
          <span class="more">開始探索 →</span>
        </router-link>

        <router-link :to="{ name: 'adopt' }" class="card c2">
          <div class="ic" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M3 11l9-7 9 7" fill="none" stroke="currentColor" stroke-width="2" />
              <path d="M5 10v10h14V10" fill="none" stroke="currentColor" stroke-width="2" />
            </svg>
          </div>
          <h3>即時認養</h3>
          <p>縣市、種類與條件過濾，快速找到適合的家。</p>
          <span class="more">瀏覽名單 →</span>
        </router-link>

        <router-link :to="{ name: 'shelters' }" class="card c3">
          <div class="ic" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" fill="none" stroke="currentColor" stroke-width="2" />
              <circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" stroke-width="2" />
            </svg>
          </div>
          <h3>收容所清單</h3>
          <p>地址、電話、開放時間與地圖定位。</p>
          <span class="more">查看清單 →</span>
        </router-link>

        <router-link :to="{ name: 'lost' }" class="card c4">
          <div class="ic" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" stroke-width="2" />
              <path d="M20 20l-4.2-4.2" fill="none" stroke="currentColor" stroke-width="2" />
            </svg>
          </div>
          <h3>寵物遺失</h3>
          <p>全台遺失啟事整合，支援關鍵字與條件搜尋。</p>
          <span class="more">前往查詢 →</span>
        </router-link>

        <router-link :to="{ name: 'stats' }" class="card c5">
          <div class="ic" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M5 20V10M12 20V6M19 20V14" fill="none" stroke="currentColor" stroke-width="2" />
            </svg>
          </div>
          <h3>收容處理統計</h3>
          <p>收容、認領養、人道處理與所內死亡。</p>
          <span class="more">檢視報表 →</span>
        </router-link>
      </div>
    </section>

    <!-- ❌ 首頁不再自帶 Footer；統一使用 App.vue 的全域 FooterSection -->
  </div>
</template>

<style scoped>
/* —— 全站一致 —— */
.page{
  color:var(--ink);
  background:var(--bg);
  font-family:'Noto Sans TC', system-ui, -apple-system, 'Microsoft JhengHei', sans-serif;
}
.container{ width:min(1180px,92vw); margin:0 auto; }

/* ---------------- HERO ---------------- */
.hero{
  position:relative; overflow:hidden;
  background: linear-gradient(180deg,#eef3ff 0%, #e3eaf7 36%, #f9fbff 70%);
}
.hero::after{
  content:""; position:absolute; inset:-20px; pointer-events:none;
  background:
    radial-gradient(1200px 520px at 8% 10%, rgba(30,64,175,.10), transparent 60%),
    radial-gradient(1000px 520px at 98% 8%, rgba(14,165,233,.08), transparent 60%),
    radial-gradient(1200px 520px at 50% 120%, rgba(2,6,23,.06), transparent 65%);
  mix-blend-mode:multiply;
}

/* 背景柔色塊 */
.bg-blobs .blob{ position:absolute; filter:blur(50px); opacity:.7; pointer-events:none; }
.blob.b1{ width:660px; height:660px; background:radial-gradient(circle at 50% 50%, #c7d8ff 0%, transparent 70%); top:-180px; left:-160px; }
.blob.b2{ width:600px; height:600px; background:radial-gradient(circle at 50% 50%, #bfeaff 0%, transparent 70%); top:-200px; right:-140px; }

.hero-grid{ display:grid; grid-template-columns: 1.15fr .95fr; gap:48px; align-items:center; padding:44px 0 12px; }
@media (max-width: 980px){ .hero-grid{ grid-template-columns: 1fr; gap:28px; padding:26px 0 0; } }

.copy{ animation: fadeUp .5s ease-out both .05s; }

/* 標籤 */
.chip{
  display:inline-flex; align-items:center; gap:8px;
  background:#0b1220; color:#fff; border-radius:999px;
  padding:6px 12px; font-size:12px; font-weight:700;
  box-shadow:0 8px 22px rgba(15,23,42,.10);
}
.chip::before{ content:''; width:8px; height:8px; border-radius:999px;
  background:conic-gradient(from 0deg,#9ca3af,#2563eb,#0d9488,#9ca3af); }

/* 主/副標 */
.h1{ margin:16px 0 8px; font-size: clamp(34px, 4.2vw, 44px); line-height: 1.16; font-weight: 900; letter-spacing: .2px; color:#111827; }
.h2{ margin:0 0 12px; font-size: clamp(18px, 2.2vw, 22px); font-weight: 800; color:#1f2937; opacity:.95; }
.lead{ margin:0 0 16px; font-size: 15px; line-height: 1.85; color: var(--body); }

/* CTA */
.cta-row{ display:flex; flex-wrap:wrap; gap:12px; margin: 10px 0 14px; }
.btn{ text-decoration:none; border-radius:12px; padding:12px 18px; font-weight:800; border:1px solid transparent; transition:.2s ease; }
.btn.primary{ background:#4b5563; color:#fff; box-shadow:0 10px 24px rgba(0,0,0,.10); }
.btn.primary:hover{ background:#374151; transform:translateY(-2px); }
.btn.ghost{ background:#fff; border-color:var(--line); color:var(--ink); }
.btn.ghost:hover{ border-color:#9ca3af; transform:translateY(-2px); }

/* KPI */
.stats{ list-style:none; padding:0; margin:12px 0 0; display:flex; gap:16px; flex-wrap:wrap; }
.stats li{ background:#fff; border:1px solid var(--line); border-radius:12px; padding:8px 12px; min-width:128px; display:flex; gap:10px; align-items:baseline; box-shadow:0 8px 22px rgba(17,24,39,.06); }
.stats .n{ font-weight:900; font-size:18px; color:#111827; }
.stats .k{ font-size:12px; color:#6b7280; }

/* 右圖卡片 */
.shot{ display:flex; justify-content:center; }
.photo-card{ position:relative; animation: floatIn .6s ease-out both .1s; }
.photo-card img{ width:min(500px,90vw); aspect-ratio:3/4; object-fit:cover; border-radius:26px; border:1px solid #fff; box-shadow:0 18px 50px rgba(0,0,0,.16); background:#f4f6fb; }
.photo-card .halo{
  position:absolute; inset:-18px; border-radius:32px; z-index:-1;
  background:
    radial-gradient(700px 380px at 80% 40%, rgba(37,99,235,.20), transparent 60%),
    radial-gradient(620px 360px at 20% 80%, rgba(15,23,42,.10), transparent 60%);
  filter: blur(28px);
}

/* 分隔波浪 */
.wave{
  height:26px; opacity:.95;
  background: linear-gradient(180deg,#ffffff 0%, #eaf1ff 100%);
  mask: radial-gradient(60px 20px at 10% 20px, black 99%, transparent 101%) repeat-x;
  -webkit-mask: radial-gradient(60px 20px at 10% 20px, black 99%, transparent 101%) repeat-x;
  mask-size:120px 26px; -webkit-mask-size:120px 26px;
}

/* ===== 功能卡片（深色對比） ===== */
.features{
  padding:40px 0 60px; color:#e5e7eb;
  background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
  border-top:1px solid rgba(255,255,255,.06);
  box-shadow: inset 0 20px 40px rgba(0,0,0,.25);
}
.cards{ display:grid; gap:18px; grid-template-columns: repeat(5,1fr); }
@media (max-width:1120px){ .cards{ grid-template-columns:repeat(3,1fr);} }
@media (max-width:760px){ .cards{ grid-template-columns:repeat(2,1fr);} }
@media (max-width:520px){ .cards{ grid-template-columns:1fr;} }

.card{
  text-decoration:none; color:inherit; border-radius:16px; padding:16px; display:grid; gap:8px;
  background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.08));
  border:1px solid rgba(255,255,255,.14);
  box-shadow:0 10px 28px rgba(0,0,0,.35);
  backdrop-filter: blur(6px);
  transition: transform .12s, box-shadow .18s, border-color .18s, background .18s;
}
.card:hover{ transform: translateY(-4px) scale(1.01); box-shadow:0 18px 54px rgba(0,0,0,.45); border-color: rgba(255,255,255,.25); }
.ic{ width:42px; height:42px; border-radius:12px; display:grid; place-items:center; color:#fff; }
.ic svg{ width:22px; height:22px; }
.c1 .ic{ background:linear-gradient(135deg,#9ca3af,#6b7280); }
.c2 .ic{ background:linear-gradient(135deg,#2563eb,#3b82f6); }
.c3 .ic{ background:linear-gradient(135deg,#0d9488,#14b8a6); }
.c4 .ic{ background:linear-gradient(135deg,#7b8cff,#5f78ff); }
.c5 .ic{ background:linear-gradient(135deg,#6b7280,#4b5563); }
.card h3{ margin:4px 0 0; font-size:16px; font-weight:900; letter-spacing:.2px; color:#fff; }
.card p{ margin:0; color:#cbd5e1; font-size:13.5px; line-height:1.6; }
.card .more{ margin-top:2px; font-size:12px; font-weight:800; color:#93c5fd; }

/* 動畫 */
@keyframes fadeUp{ from{opacity:0; transform:translateY(10px);} to{opacity:1; transform:translateY(0);} }
@keyframes floatIn{ from{opacity:0; transform:translateY(8px) scale(.98);} to{opacity:1; transform:translateY(0) scale(1);} }
</style>
