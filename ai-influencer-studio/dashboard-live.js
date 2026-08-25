(() => {
  const API = '/api/social-sync';
  const REFRESH_MS = 60000;
  let cache = null;
  let loading = false;

  const fmt = n => (n === null || n === undefined || n === '') ? '—' : new Intl.NumberFormat('pl-PL').format(Number(n));
  const pct = n => Number.isFinite(Number(n)) ? `${Number(n).toFixed(2).replace('.', ',')}%` : '—';

  function metricCards() {
    return [...document.querySelectorAll('#content .metrics-grid .metric-card')];
  }

  function setMetric(card, label, value, note) {
    if (!card) return;
    const l = card.querySelector('.metric-label');
    const v = card.querySelector('.metric-value');
    const c = card.querySelector('.metric-change');
    if (l) l.textContent = label;
    if (v) v.textContent = value;
    if (c) c.textContent = note;
  }

  function setDiagnostic(state, detail = '') {
    let el = document.getElementById('dashboardLiveDiagnostic');
    if (!el) {
      el = document.createElement('div');
      el.id = 'dashboardLiveDiagnostic';
      Object.assign(el.style, {
        position: 'fixed', right: '18px', bottom: '18px', zIndex: '9999',
        padding: '8px 11px', borderRadius: '10px', fontSize: '10px', fontWeight: '700',
        boxShadow: '0 8px 24px rgba(0,0,0,.22)', backdropFilter: 'blur(8px)'
      });
      document.body.appendChild(el);
    }
    const map = {
      loading: ['LIVE CHECK…', 'rgba(33,35,48,.92)', '#f4f4f6'],
      ready: ['LIVE READY', 'rgba(18,104,72,.94)', '#fff'],
      error: ['LIVE ERROR', 'rgba(150,43,43,.94)', '#fff']
    };
    const cfg = map[state] || map.loading;
    el.textContent = detail ? `${cfg[0]} · ${detail}` : cfg[0];
    el.style.background = cfg[1];
    el.style.color = cfg[2];
    el.title = detail || '';
    el.style.display = document.querySelector('.nav-item.active')?.dataset.view === 'dashboard' ? 'block' : 'none';
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }

  function renderCalendar() {
    const heading = [...document.querySelectorAll('#content .panel-card h2')].find(x => x.textContent.trim() === 'Kalendarz publikacji');
    const calendar = heading?.closest('.panel-card')?.querySelector('.calendar');
    if (!calendar) return;
    let projects = [];
    try {
      const parsed = JSON.parse(localStorage.getItem('aii-projects') || '[]');
      projects = Array.isArray(parsed) ? parsed : [];
    } catch (_) {}
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const upcoming = projects
      .filter(p => p?.date)
      .map(p => ({...p, stamp: new Date(`${p.date}T00:00:00`).getTime()}))
      .filter(p => Number.isFinite(p.stamp) && p.stamp >= today)
      .sort((a,b) => a.stamp - b.stamp)
      .slice(0, 5);
    if (!upcoming.length) {
      calendar.innerHTML = '<div class="calendar-row"><b>—</b><span>Brak rzeczywiście zaplanowanych publikacji</span><span>LIVE</span></div>';
      return;
    }
    calendar.innerHTML = upcoming.map(p => {
      const date = new Date(`${p.date}T00:00:00`).toLocaleDateString('pl-PL', {day:'2-digit', month:'2-digit'});
      return `<div class="calendar-row"><b>${date}</b><span class="chip">${esc(p.platform || 'Platforma')} · ${esc(p.name || p.type || 'Publikacja')}</span><span>${esc(p.type || 'Publikacja')}</span></div>`;
    }).join('');
  }

  function apply() {
    if (!cache?.ok || !document.querySelector('#content .metrics-grid')) return false;
    const profile = cache.profiles?.find(p => p.platform === 'Instagram') || cache.profiles?.[0] || {};
    const items = Array.isArray(cache.items) ? cache.items : [];
    const likes = items.reduce((s, x) => s + Number(x.likes || 0), 0);
    const comments = items.reduce((s, x) => s + Number(x.comments || 0), 0);
    const interactions = likes + comments;
    const engagement = Number(profile.followers) > 0 && items.length > 0
      ? (interactions / (Number(profile.followers) * items.length)) * 100
      : null;
    const reels = items.filter(x => x.type === 'Reels').length;
    const cards = metricCards();
    setMetric(cards[0], 'Obserwujący', fmt(profile.followers), profile.handle ? `Instagram ${profile.handle}` : 'Dane LIVE');
    setMetric(cards[1], 'Publikacje', fmt(profile.mediaCount), profile.mediaCount == null ? 'Brak zweryfikowanej wartości' : 'Łącznie na Instagramie');
    setMetric(cards[2], 'Śr. zaangażowanie', engagement == null ? '—' : pct(engagement), items.length ? `Na podstawie ${items.length} ostatnich publikacji` : 'Za mało danych');
    setMetric(cards[3], 'Polubienia', items.length ? fmt(likes) : '—', items.length ? `${fmt(comments)} komentarzy` : 'Brak pobranych publikacji');
    setMetric(cards[4], 'Reels', items.length ? fmt(reels) : '—', items.length ? `W ostatnich ${items.length} publikacjach` : 'Brak pobranych publikacji');
    const pulse = document.querySelector('#content .panel-card .tag');
    if (pulse) pulse.textContent = 'LIVE · INSTAGRAM';
    const subtitle = document.getElementById('pageSubtitle');
    if (subtitle && document.querySelector('.nav-item.active')?.dataset.view === 'dashboard') {
      const synced = cache.syncedAt ? new Date(cache.syncedAt).toLocaleTimeString('pl-PL', {hour:'2-digit', minute:'2-digit'}) : 'teraz';
      subtitle.textContent = `Dane na żywo z ${profile.handle || 'Instagrama'} · synchronizacja ${synced}`;
    }
    renderCalendar();
    document.documentElement.dataset.dashboardLive = 'ready';
    setDiagnostic('ready', `${fmt(profile.followers)} followers`);
    return true;
  }

  function applyError(e) {
    if (!document.querySelector('#content .metrics-grid')) return;
    const cards = metricCards();
    ['Instagram','Publikacje','Zaangażowanie','Polubienia','Reels'].forEach((label, i) => setMetric(cards[i], label, '—', 'Brak zweryfikowanych danych LIVE'));
    const pulse = document.querySelector('#content .panel-card .tag');
    if (pulse) pulse.textContent = 'OFFLINE · INSTAGRAM';
    const subtitle = document.getElementById('pageSubtitle');
    if (subtitle && document.querySelector('.nav-item.active')?.dataset.view === 'dashboard') {
      subtitle.textContent = 'Instagram chwilowo niedostępny · wartości demo zostały ukryte';
    }
    renderCalendar();
    document.documentElement.dataset.dashboardLive = 'error';
    setDiagnostic('error', e?.message || 'sync failed');
    console.warn('Dashboard live sync:', e);
  }

  async function load(force = false) {
    if (document.querySelector('.nav-item.active')?.dataset.view !== 'dashboard') {
      setDiagnostic('loading');
      const el = document.getElementById('dashboardLiveDiagnostic');
      if (el) el.style.display = 'none';
      return;
    }
    if (loading) return;
    if (!force && cache?.ok) {
      apply();
      return;
    }
    loading = true;
    setDiagnostic('loading');
    try {
      const r = await fetch(API, {headers:{'Accept':'application/json'}});
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      if (!data?.ok) throw new Error(data?.error || 'Brak poprawnych danych LIVE');
      cache = data;
      apply();
    } catch (e) {
      cache = null;
      applyError(e);
    } finally {
      loading = false;
    }
  }

  function loadDashboardSoon(force = true) {
    setTimeout(() => {
      if (document.querySelector('.nav-item.active')?.dataset.view === 'dashboard') load(force);
    }, 75);
  }

  const originalRender = window.render;
  if (typeof originalRender === 'function' && !originalRender.__aiiLiveWrapped) {
    const wrappedRender = function(...args) {
      const result = originalRender.apply(this, args);
      setTimeout(() => {
        const isDashboard = document.querySelector('.nav-item.active')?.dataset.view === 'dashboard';
        const el = document.getElementById('dashboardLiveDiagnostic');
        if (el) el.style.display = isDashboard ? 'block' : 'none';
      }, 0);
      loadDashboardSoon(false);
      return result;
    };
    wrappedRender.__aiiLiveWrapped = true;
    window.render = wrappedRender;
  }

  window.AII_refreshDashboard = () => load(true);
  document.querySelectorAll('.nav-item[data-view="dashboard"]').forEach(el => el.addEventListener('click', () => loadDashboardSoon(true)));
  window.addEventListener('focus', () => loadDashboardSoon(false));
  window.addEventListener('storage', renderCalendar);
  setInterval(() => {
    if (document.querySelector('.nav-item.active')?.dataset.view === 'dashboard') load(true);
  }, REFRESH_MS);

  setDiagnostic('loading');
  [50, 250, 1000].forEach((delay, index) => setTimeout(() => {
    if (document.querySelector('.nav-item.active')?.dataset.view === 'dashboard') load(index === 0);
  }, delay));
})();
