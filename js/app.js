/* ================= WeNew威牛 Official — app.js ================= */
(() => {
  'use strict';

  /* ---------- i18n ---------- */
  const LANGS = ['zh', 'en', 'ja', 'ko'];
  const UI = {
    zh: { menu:'菜单', nav_about:'关于我们', nav_news:'新闻', nav_goods:'周边', nav_live:'演出',
          explore:'进入', empty:'暂无内容，敬请期待', buy:'购票', soldout:'售罄', coming:'即将开售',
          more:'查看详情', shop:'前往购买', htmlLang:'zh-CN', short:'中' },
    en: { menu:'MENU', nav_about:'About', nav_news:'News', nav_goods:'Goods', nav_live:'Live',
          explore:'ENTER', empty:'No content yet — stay tuned.', buy:'TICKETS', soldout:'SOLD OUT', coming:'COMING SOON',
          more:'Read more', shop:'Shop now', htmlLang:'en', short:'EN' },
    ja: { menu:'メニュー', nav_about:'私たちについて', nav_news:'ニュース', nav_goods:'グッズ', nav_live:'ライブ',
          explore:'入る', empty:'コンテンツはまだありません。お楽しみに。', buy:'チケット', soldout:'完売', coming:'近日発売',
          more:'詳細を見る', shop:'購入する', htmlLang:'ja', short:'日' },
    ko: { menu:'메뉴', nav_about:'소개', nav_news:'뉴스', nav_goods:'굿즈', nav_live:'공연',
          explore:'입장', empty:'아직 콘텐츠가 없습니다. 기대해 주세요.', buy:'티켓', soldout:'매진', coming:'오픈 예정',
          more:'자세히 보기', shop:'구매하기', htmlLang:'ko', short:'한' },
  };

  // 默认中文；访客手动切换后记住其选择
  let lang = localStorage.getItem('wenew_lang');
  if (!LANGS.includes(lang)) lang = 'zh';

  const t = (key) => (UI[lang] && UI[lang][key]) || UI.zh[key] || key;
  /** pick localized field from content object: f(item,'title') -> item.title_zh etc. with fallback */
  const pick = (item, field) => {
    if (!item) return '';
    const order = [lang, 'zh', 'en', 'ja', 'ko'];
    for (const l of order) { const v = item[`${field}_${l}`]; if (v) return v; }
    return item[field] || '';
  };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  /* ---------- content ---------- */
  const content = { about:null, news:null, goods:null, shows:null };
  const load = async (name, file) => {
    try {
      const r = await fetch(`content/${file}?v=${Date.now() >> 16}`);
      if (r.ok) content[name] = await r.json();
    } catch (_) { /* keep null -> empty state */ }
  };

  /* ---------- language apply ---------- */
  function applyLang() {
    localStorage.setItem('wenew_lang', lang);
    document.documentElement.lang = UI[lang].htmlLang;
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.getElementById('langCurrent').textContent = UI[lang].short;
    document.querySelectorAll('[data-lang]').forEach((b) => b.classList.toggle('active', b.dataset.lang === lang));
    renderAll();
  }

  /* ---------- renderers ---------- */
  const emptyHTML = () => `
    <div class="empty">
      <span class="empty-en">COMING SOON</span>
      <span class="empty-local">${esc(t('empty'))}</span>
    </div>`;

  const fmtDate = (d) => {
    if (!d) return '';
    const [y, m, day] = String(d).split('-');
    return y && m && day ? `${y}.${m}.${day}` : String(d);
  };

  function renderNews() {
    const box = document.getElementById('newsBody');
    const items = (content.news && content.news.items) || [];
    if (!items.length) { box.innerHTML = emptyHTML(); return; }
    const sorted = [...items].sort((a, b) => String(b.date).localeCompare(String(a.date)));
    box.innerHTML = sorted.map((n, i) => {
      const body = pick(n, 'body');
      const link = n.link ? `\n<a href="${esc(n.link)}" target="_blank" rel="noopener">${esc(t('more'))} ↗</a>` : '';
      const hasDetail = body || n.link;
      return `
      <div class="news-item" data-i="${i}">
        <button class="news-row" ${hasDetail ? '' : 'disabled'}>
          <span class="news-date">${esc(fmtDate(n.date))}</span>
          <span class="news-cat">${esc(n.category || 'INFO')}</span>
          <span class="news-title">${esc(pick(n, 'title'))}</span>
          <span class="news-arrow">${hasDetail ? '+' : ''}</span>
        </button>
        ${hasDetail ? `<div class="news-detail"><div class="news-detail-inner">${esc(body)}${link}</div></div>` : ''}
      </div>`;
    }).join('');
    box.querySelectorAll('.news-item').forEach((item) => {
      const row = item.querySelector('.news-row');
      const detail = item.querySelector('.news-detail');
      if (!detail) return;
      row.addEventListener('click', () => {
        const open = item.classList.toggle('open');
        detail.style.maxHeight = open ? detail.scrollHeight + 'px' : '0';
      });
    });
  }

  function renderLive() {
    const box = document.getElementById('liveBody');
    const items = (content.shows && content.shows.items) || [];
    if (!items.length) { box.innerHTML = emptyHTML(); return; }
    const sorted = [...items].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    box.innerHTML = sorted.map((s) => {
      const status = s.status || 'onsale';
      const cta = status === 'soldout'
        ? `<span class="live-cta soldout">${esc(t('soldout'))}</span>`
        : status === 'coming'
          ? `<span class="live-cta coming">${esc(t('coming'))}</span>`
          : (s.ticket_url
              ? `<a class="live-cta" href="${esc(s.ticket_url)}" target="_blank" rel="noopener">${esc(t('buy'))}</a>`
              : `<span class="live-cta coming">${esc(t('buy'))}</span>`);
      return `
      <div class="live-item">
        <div class="live-date">${esc(fmtDate(s.date))}${s.time ? `<small>${esc(s.time)}</small>` : ''}</div>
        <div class="live-info">
          <h3>${esc(pick(s, 'title'))}</h3>
          <p>${esc([pick(s, 'city'), pick(s, 'venue')].filter(Boolean).join(' — '))}</p>
        </div>
        ${cta}
      </div>`;
    }).join('');
  }

  function renderGoods() {
    const box = document.getElementById('goodsBody');
    const items = (content.goods && content.goods.items) || [];
    if (!items.length) { box.innerHTML = emptyHTML(); return; }
    box.innerHTML = `<div class="goods-grid">` + items.map((g) => {
      const img = g.image
        ? `<img src="${esc(g.image)}" alt="${esc(pick(g, 'name'))}" loading="lazy">`
        : `<img class="goods-noimg" src="assets/logo-white-small.png" alt="">`;
      const inner = `
        <div class="goods-thumb">${img}</div>
        <p class="goods-name">${esc(pick(g, 'name'))}</p>
        ${g.price ? `<p class="goods-price">${esc(g.price)}</p>` : ''}
        ${g.url ? `<p class="goods-status">${esc(t('shop'))} ↗</p>` : ''}`;
      return g.url
        ? `<a class="goods-card" href="${esc(g.url)}" target="_blank" rel="noopener">${inner}</a>`
        : `<div class="goods-card">${inner}</div>`;
    }).join('') + `</div>`;
  }

  function renderAbout() {
    const box = document.getElementById('aboutBody');
    const a = content.about;
    if (!a || (!pick(a, 'lead') && !pick(a, 'body'))) { box.innerHTML = emptyHTML(); return; }
    const members = (a.members || []).map((m) => `
      <div class="member-card">
        <p class="member-role">${esc(pick(m, 'role'))}</p>
        <p class="member-name">${esc(pick(m, 'name'))}${m.name_en && lang !== 'en' ? `<small>${esc(m.name_en)}</small>` : ''}</p>
      </div>`).join('');
    box.innerHTML = `
      <div class="about-grid">
        <div class="about-photo"><img src="${esc(a.photo || 'assets/band-wide.jpg')}" alt="WeNew威牛"></div>
        ${pick(a, 'lead') ? `<p class="about-lead">${esc(pick(a, 'lead'))}</p>` : ''}
        ${pick(a, 'body') ? `<div class="about-body">${esc(pick(a, 'body'))}</div>` : ''}
        ${members ? `<div class="about-members">${members}</div>` : ''}
      </div>`;
  }

  function renderAll() { renderAbout(); renderNews(); renderGoods(); renderLive(); }

  /* ---------- router ---------- */
  const VIEWS = ['about', 'news', 'goods', 'live'];
  function route() {
    const hash = location.hash.replace(/^#\/?/, '').split('?')[0];
    const view = VIEWS.includes(hash) ? hash : 'home';
    document.body.dataset.view = view;
    document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
    if (view !== 'home') {
      document.getElementById(`view-${view}`).classList.add('active');
      window.scrollTo(0, 0);
    }
    closeMenu(); closeLang();
  }

  /* ---------- menu / lang ---------- */
  const menuBtn = document.getElementById('menuBtn');
  const langBtn = document.getElementById('langBtn');
  const langPanel = document.getElementById('langPanel');

  const closeMenu = () => document.body.classList.remove('menu-open');
  const closeLang = () => langPanel.classList.remove('open');

  menuBtn.addEventListener('click', () => { closeLang(); document.body.classList.toggle('menu-open'); });
  langBtn.addEventListener('click', (e) => { e.stopPropagation(); langPanel.classList.toggle('open'); });
  document.addEventListener('click', (e) => { if (!langPanel.contains(e.target) && e.target !== langBtn) closeLang(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeMenu(); closeLang(); } });

  document.querySelectorAll('[data-lang]').forEach((b) =>
    b.addEventListener('click', () => { lang = b.dataset.lang; applyLang(); closeLang(); }));

  document.getElementById('heroScroll').addEventListener('click', () => { location.hash = '#/about'; });
  document.getElementById('footYear').textContent = new Date().getFullYear();

  window.addEventListener('scroll', () => document.body.classList.toggle('scrolled', scrollY > 40));
  window.addEventListener('hashchange', route);

  /* ---------- init ---------- */
  Promise.all([
    load('about', 'about.json'),
    load('news', 'news.json'),
    load('goods', 'goods.json'),
    load('shows', 'shows.json'),
  ]).then(() => { applyLang(); route(); });
})();
