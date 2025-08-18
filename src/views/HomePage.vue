<template>
  <!-- 強制此頁使用 light 變數 -->
  <div class="page" data-theme="light">
    <!-- 玻璃導覽 -->
    <header class="nav">
      <div class="container nav-inner">
        <div class="brand">
          <span class="logo">🐾</span>
          <strong class="name">皮皮的動物資訊網</strong>
          <span class="logo">🐾</span>
        </div>
        <nav class="links">
          <router-link :to="{name:'adopt'}">認養</router-link>
          <router-link :to="{name:'shelters'}">收容所</router-link>
          <router-link :to="{name:'lost'}">遺失</router-link>
          <router-link :to="{name:'stats'}">統計</router-link>
          <router-link class="cta" :to="{name:'publish'}">浪浪專區</router-link>
        </nav>
      </div>
    </header>

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
            從刊登協尋、即時認養、收容所查詢到趨勢報表，幫你用數據與行動守護毛孩。
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

        <!-- 換成貓咪圖：把 src 改成你的檔案，例如 /images/cat-hero.jpg -->
        <figure class="shot">
          <div class="photo-card">
            <img
              src="https://images.unsplash.com/photo-1558788353-f76d92427f16?q=80&w=1200&auto=format&fit=crop"
              alt="Hero 圖片" loading="eager"
            />
            <div class="halo"></div>
          </div>
        </figure>
      </div>

      <div class="wave"></div>
    </section>

    <!-- 功能卡片（深色主題） -->
    <section class="features">
      <div class="container cards">
        <router-link :to="{ name: 'publish' }" class="card c1">
          <div class="ic">📝</div>
          <h3>浪浪專區</h3>
          <p>集中浪浪資訊：認養、協尋、分享都在這裡。</p>
          <span class="more">開始探索 →</span>
        </router-link>

        <router-link :to="{ name: 'adopt' }" class="card c2">
          <div class="ic">🏠</div>
          <h3>即時認養</h3>
          <p>縣市、種類與條件過濾，快速找到適合的家。</p>
          <span class="more">瀏覽名單 →</span>
        </router-link>

        <router-link :to="{ name: 'shelters' }" class="card c3">
          <div class="ic">📍</div>
          <h3>收容所清單</h3>
          <p>地址、電話、開放時間與地圖定位。</p>
          <span class="more">查看清單 →</span>
        </router-link>

        <router-link :to="{ name: 'lost' }" class="card c4">
          <div class="ic">🔎</div>
          <h3>寵物遺失</h3>
          <p>全台遺失啟事整合，支援關鍵字與條件搜尋。</p>
          <span class="more">前往查詢 →</span>
        </router-link>

        <router-link :to="{ name: 'stats' }" class="card c5">
          <div class="ic">📊</div>
          <h3>收容處理統計</h3>
          <p>收容、認領養、人道處理與所內死亡。</p>
          <span class="more">檢視報表 →</span>
        </router-link>
      </div>
    </section>

    <footer class="footer">
      <div class="container foot">
        <div class="foot-meta">
          <div class="brand">
            <span class="logo">🐾</span>
            <strong>皮皮的動物資訊網</strong>
            <span class="logo">🐾</span>
          </div>
          <div class="links">
            <router-link :to="{name:'adopt'}">認養</router-link>
            <router-link :to="{name:'shelters'}">收容所</router-link>
            <router-link :to="{name:'lost'}">遺失</router-link>
            <router-link :to="{name:'stats'}">統計</router-link>
          </div>
        </div>
        <p class="note">資料來源：政府資料開放平台／農業部 · 本站僅作公益資訊整合與展示</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ——把變數「就地」綁在 .page，避免被全域深色覆蓋—— */
.page{
  /* 強制本頁為 light 調色盤 */
  color-scheme: light;

  /* 本頁專用的變數（覆蓋任何全域 :root / 深色變數） */
  --ink:#0b1220;        /* 主文字 */
  --ink-2:#1c2436;      /* 副標題 */
  --ink-3:#2e3750;      /* 內文 */
  --line:#dfe5f0;
  --bg:#f5f7fb;
  --surface:#ffffff;
  --brand:#ff6c4f;
  --brand-600:#ff5132;
  --accent:#2563eb;
  --teal:#16b6b6;

  --shadow:0 18px 50px rgba(15,23,42,.12);

  color:var(--ink-3);
  background:var(--bg);
  font-family:'Noto Sans TC', system-ui, -apple-system, 'Microsoft JhengHei', sans-serif;
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
}

/* 其餘樣式與你上一版相同（我只把顏色都指向上面的變數）
   ……若你需要我再貼一次完整 CSS，我可以再丟整檔。 */

/* — 導覽 — */
.container{ width:min(1180px,92vw); margin:0 auto; }
.nav{ position:sticky; top:0; z-index:30; backdrop-filter:blur(10px);
  background:rgba(255,255,255,.86); border-bottom:1px solid rgba(223,229,240,.95);}
.nav-inner{ display:flex; align-items:center; justify-content:space-between; padding:10px 0;}
.brand{ display:flex; gap:10px; align-items:center; color:var(--ink);}
.logo{ font-size:18px;}
.name{ letter-spacing:.3px; font-weight:900;}
.links{ display:flex; gap:18px; align-items:center;}
.links a{ text-decoration:none; color:var(--ink); font-weight:900; opacity:.95;}
.links a:hover{ opacity:1;}
.links .cta{ padding:8px 12px; border-radius:10px; background:var(--accent); color:#fff;
  box-shadow:0 8px 20px rgba(37,99,235,.22); }

/* — HERO — */
.hero{
  position:relative; overflow:hidden;
  background:
    radial-gradient(1000px 600px at -10% 0%, #ffe1d6 0%, #fff0ea 35%, transparent 60%),
    radial-gradient(900px 580px at 120% 10%, #dbf6f5 0%, #eefcfc 35%, transparent 65%),
    linear-gradient(180deg,#ffffff 0%,#f2f6ff 100%);
}
.bg-blobs .blob{ position:absolute; filter:blur(28px); opacity:.5; pointer-events:none; }
.blob.b1{ width:520px; height:520px; background:radial-gradient(ellipse at center,#ffd0c1 0%, transparent 68%); top:-140px; left:-120px;}
.blob.b2{ width:520px; height:520px; background:radial-gradient(ellipse at center,#c8efff 0%, transparent 68%); top:-160px; right:-120px;}
.hero-grid{ display:grid; grid-template-columns: 1.15fr .95fr; gap:52px; align-items:center; padding:44px 0 12px;}
@media (max-width:980px){ .hero-grid{ grid-template-columns:1fr; gap:28px; padding:26px 0 0; } }

.copy{ animation: fadeUp .5s ease-out both .05s; }
.chip{ display:inline-flex; gap:8px; align-items:center; background:var(--ink); color:#fff; border-radius:999px;
  padding:6px 12px; font-size:12px; font-weight:900; box-shadow:0 8px 22px rgba(15,23,42,.18);}
.chip::before{ content:''; width:8px; height:8px; border-radius:999px;
  background:conic-gradient(from 0deg,var(--brand),var(--accent),var(--teal),var(--brand));}

.h1{ margin:16px 0 10px; font-size:clamp(32px,4.2vw,42px); line-height:1.18; font-weight:900; letter-spacing:.2px; color:var(--ink);}
.h2{ margin:0 0 14px; font-size:clamp(18px,2.2vw,20px); font-weight:900; color:var(--ink-2);}
.lead{ margin:0 0 16px; font-size:15.5px; line-height:1.85; color:var(--ink-3);}

.cta-row{ display:flex; flex-wrap:wrap; gap:12px; margin:12px 0 16px;}
.btn{ text-decoration:none; border-radius:12px; padding:12px 18px; font-weight:900; border:1px solid transparent; transition:.2s ease;}
.btn.primary{ background:var(--brand); color:#fff; box-shadow:0 14px 30px rgba(255,108,79,.28);}
.btn.primary:hover{ background:var(--brand-600); transform:translateY(-2px);}
.btn.ghost{ background:#fff; border-color:var(--line); color:var(--ink);}
.btn.ghost:hover{ border-color:#cfd6e4; transform:translateY(-2px);}

.stats{ list-style:none; padding:0; margin:12px 0 0; display:flex; gap:16px; flex-wrap:wrap;}
.stats li{ background:#fff; border:1px solid var(--line); border-radius:12px; padding:8px 12px; min-width:128px; display:flex; gap:10px; align-items:baseline; box-shadow:0 8px 22px rgba(17,24,39,.06);}
.stats .n{ font-weight:900; font-size:18px; color:var(--ink);}
.stats .k{ font-size:12px; color:var(--ink-3);}

.shot{ display:flex; justify-content:center;}
.photo-card{ position:relative; animation: floatIn .6s ease-out both .1s;}
.photo-card img{ width:min(500px,90vw); aspect-ratio:3/4; object-fit:cover; border-radius:26px; border:1px solid #fff; box-shadow:var(--shadow); background:#f4f6fb;}
.photo-card .halo{ position:absolute; inset:-18px; border-radius:32px; z-index:-1;
  background: radial-gradient(700px 380px at 80% 40%, rgba(37,99,235,.22), transparent 60%),
              radial-gradient(600px 360px at 20% 80%, rgba(255,108,79,.22), transparent 60%);
  filter: blur(28px); }

.wave{ height:26px; opacity:.9; background:linear-gradient(180deg,#ffffff 0%, #eaf1ff 100%);
  mask: radial-gradient(60px 20px at 10% 20px, black 99%, transparent 101%) repeat-x;
  -webkit-mask: radial-gradient(60px 20px at 10% 20px, black 99%, transparent 101%) repeat-x;
  mask-size:120px 26px; -webkit-mask-size:120px 26px;}

/* — 功能卡片（暗底） — */
.features{ padding:40px 0 60px; color:#f1f5f9;
  background:linear-gradient(180deg,#0f172a 0%, #111827 100%);
  border-top:1px solid rgba(255,255,255,.06); box-shadow:inset 0 20px 40px rgba(0,0,0,.25);}
.cards{ display:grid; gap:18px; grid-template-columns: repeat(5,1fr);}
@media (max-width:1120px){ .cards{ grid-template-columns:repeat(3,1fr);} }
@media (max-width:760px){ .cards{ grid-template-columns:repeat(2,1fr);} }
@media (max-width:520px){ .cards{ grid-template-columns:1fr;} }

.card{ text-decoration:none; color:#e5e7eb; border-radius:16px; padding:16px; display:grid; gap:8px;
  background:linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.08));
  border:1px solid rgba(255,255,255,.14); box-shadow:0 10px 28px rgba(0,0,0,.35); backdrop-filter: blur(6px);
  transition: transform .12s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease; }
.card:hover{ transform: translateY(-4px) scale(1.01); box-shadow:0 18px 54px rgba(0,0,0,.45); border-color: rgba(255,255,255,.25); }

.ic{ width:42px; height:42px; border-radius:12px; display:grid; place-items:center; color:#fff; font-size:20px; font-weight:800;}
.c1 .ic{ background:linear-gradient(135deg,#ff8a4c,#ff6a44);}
.c2 .ic{ background:linear-gradient(135deg,#2d6df6,#5a8bff);}
.c3 .ic{ background:linear-gradient(135deg,#2fc2c2,#58e0d2);}
.c4 .ic{ background:linear-gradient(135deg,#7b8cff,#5f78ff);}
.c5 .ic{ background:linear-gradient(135deg,#ffa94d,#ff7a33);}
.card h3{ margin:4px 0 0; font-size:16px; font-weight:900; letter-spacing:.2px; color:#fff;}
.card p{ margin:0; color:#dbe3ee; font-size:13.5px; line-height:1.6;}
.card .more{ margin-top:2px; font-size:12px; font-weight:900; color:#93c5fd;}

.footer{ border-top:1px solid var(--line); color:var(--ink-3); background:linear-gradient(180deg,#f4f6fb 0%, #eef2f6 100%);}
.foot{ padding:22px 0 48px;}
.foot-meta{ display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:8px; color:var(--ink);}
.foot .links{ display:flex; gap:14px;}
.foot .links a{ color:var(--ink); text-decoration:none; font-weight:900;}
.foot .links a:hover{ color:var(--ink-2);}
.note{ font-size:12px; margin:0; color:var(--ink-3);}

@keyframes fadeUp{ from{opacity:0; transform:translateY(10px);} to{opacity:1; transform:translateY(0);} }
@keyframes floatIn{ from{opacity:0; transform:translateY(8px) scale(.98);} to{opacity:1; transform:translateY(0) scale(1);} }
</style>
