(() => {
  const METRICS_API = '/api/social-metrics';
  const FULL_API = '/api/social-sync';
  const REFRESH_MS = 60000;
  let metricsCache = null;
  let fullCache = null;
  let loadingMetrics = false;
  let loadingFull = false;

  const fmt = n => (n === null || n === undefined || n === '') ? '—' : new Intl.NumberFormat('pl-PL').format(Number(n));
  const pct = n => Number.isFinite(Number(n)) ? `${Number(n).toFixed(2).replace('.', ',')}%` : '—';
  const isDashboard = () => document.querySelector('.nav-item.active')?.dataset.view === 'dashboard';
  const metricCards = () => [...document.querySelectorAll('#content .metrics-grid .metric-card')];

  function setMetric(card, label, value, note) {
    if (!card) return;
    const l = card.querySelector('.metric-label');
    const v = card.querySelector('.metric-value');
    const c = card.querySelector('.metric-change');
    if (l) l.textContent = label;
    if (v) v.textContent = value;
    if (c) c.textContent = note;
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

  function markReady(profile, syncedAt) {
    const pulse = document.querySelector('#content .panel-card .tag');
    if (pulse) pulse.textContent = 'LIVE · INSTAGRAM';
    const subtitle = document.getElementById('pageSubtitle');
    if (subtitle && isDashboard()) {
      const synced = syncedAt ? new Date(syncedAt).toLocaleTimeString('pl-PL', {hour:'2-digit', minute:'2-digit'}) : 'teraz';
      subtitle.textContent = `Dane na żywo z ${profile.handle || 'Instagrama'} · synchronizacja ${synced}`;
    }
    document.documentElement.dataset.dashboardLive = 'ready';
  }

  function applyMetrics(data) {
    if (!data?.ok || !data.profile || !document.querySelector('#content .metrics-grid')) return false;
    const profile = data.profile;
    const cards = metricCards();
    setMetric(cards[0], 'Obserwujący', fmt(profile.followers), profile.handle ? `Instagram ${profile.handle}` : 'Dane LIVE');
    setMetric(cards[1], 'Publikacje', fmt(profile.mediaCount), 'Łącznie na Instagramie');
    setMetric(cards[2], 'Śr. zaangażowanie', '—', 'Dociąganie ostatnich publikacji…');
    setMetric(cards[3], 'Polubienia', '—', 'Dociąganie ostatnich publikacji…');
    setMetric(cards[4], 'Reels', '—', 'Dociąganie ostatnich publikacji…');
    renderCalendar();
    markReady(profile, data.syncedAt);
    return true;
  }

  function applyFull(data) {
    if (!data?.ok || !document.querySelector('#content .metrics-grid')) return false;
    const profile = data.profiles?.find(p => p.platform === 'Instagram') || metricsCache?.profile || data.profiles?.[0] || {};
    const items = Array.isArray(data.items) ? data.items.filter(x => String(x.platform || '').startsWith('Instagram')) : [];
    const likes = items.reduce((s, x) => s + Number(x.likes || 0), 0);
    const comments = items.reduce((s, x) => s + Number(x.comments || 0), 0);
    const interactions = likes + comments;
    const engagement = Number(profile.followers) > 0 && items.length > 0
      ? (interactions / (Number(profile.followers) * items.length)) * 100
      : null;
    const reels = items.filter(x => x.type === 'Reels').length;
    const cards = metricCards();
    setMetric(cards[0], 'Obserwujący', fmt(profile.followers), profile.handle ? `Instagram ${profile.handle}` : 'Dane LIVE');
    setMetric(cards[1], 'Publikacje', fmt(profile.mediaCount), 'Łącznie na Instagramie');
    setMetric(cards[2], 'Śr. zaangażowanie', engagement == null ? '—' : pct(engagement), items.length ? `Na podstawie ${items.length} ostatnich publikacji` : 'Za mało danych');
    setMetric(cards[3], 'Polubienia', items.length ? fmt(likes) : '—', items.length ? `${fmt(comments)} komentarzy` : 'Brak pobranych publikacji');
    setMetric(cards[4], 'Reels', items.length ? fmt(reels) : '—', items.length ? `W ostatnich ${items.length} publikacjach` : 'Brak pobranych publikacji');
    renderCalendar();
    markReady(profile, data.syncedAt);
    return true;
  }

  function applyError() {
    if (!document.querySelector('#content .metrics-grid')) return;
    const cards = metricCards();
    ['Instagram','Publikacje','Zaangażowanie','Polubienia','Reels'].forEach((label, i) => setMetric(cards[i], label, '—', 'Brak zweryfikowanych danych LIVE'));
    const pulse = document.querySelector('#content .panel-card .tag');
    if (pulse) pulse.textContent = 'OFFLINE · INSTAGRAM';
    const subtitle = document.getElementById('pageSubtitle');
    if (subtitle && isDashboard()) subtitle.textContent = 'Instagram chwilowo niedostępny · wartości demo zostały ukryte';
    renderCalendar();
    document.documentElement.dataset.dashboardLive = 'error';
  }

  async function loadFull(force = false) {
    if (!isDashboard() || loadingFull) return;
    if (!force && fullCache?.ok) return applyFull(fullCache);
    loadingFull = true;
    try {
      const r = await fetch(FULL_API, {headers:{'Accept':'application/json'}});
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      if (!data?.ok) throw new Error(data?.error || 'Brak pełnych danych LIVE');
      fullCache = data;
      applyFull(fullCache);
    } catch (_) {
      // Basic metrics remain visible even if detailed analytics fail.
    } finally {
      loadingFull = false;
    }
  }

  async function load(force = false) {
    if (!isDashboard() || loadingMetrics) return;
    if (!force && metricsCache?.ok) {
      applyMetrics(metricsCache);
      loadFull(false);
      return;
    }

    loadingMetrics = true;
    document.documentElement.dataset.dashboardLive = 'fetching';
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const r = await fetch(METRICS_API, {headers:{'Accept':'application/json'}, signal: ctrl.signal});
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      if (!data?.ok) throw new Error(data?.error || 'Brak poprawnych danych LIVE');
      metricsCache = data;
      applyMetrics(metricsCache);
      loadFull(force);
    } catch (_) {
      try {
        const r = await fetch(FULL_API, {headers:{'Accept':'application/json'}});
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        if (!data?.ok) throw new Error(data?.error || 'Brak poprawnych danych LIVE');
        fullCache = data;
        const profile = data.profiles?.find(p => p.platform === 'Instagram') || data.profiles?.[0];
        if (profile) metricsCache = {ok:true, syncedAt:data.syncedAt, profile};
        applyFull(data);
      } catch (_) {
        applyError();
      }
    } finally {
      clearTimeout(timer);
      loadingMetrics = false;
    }
  }

  function loadDashboardSoon(force = true) {
    setTimeout(() => { if (isDashboard()) load(force); }, 75);
  }

  const originalRender = window.render;
  if (typeof originalRender === 'function' && !originalRender.__aiiLiveWrapped) {
    const wrappedRender = function(...args) {
      const result = originalRender.apply(this, args);
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
  setInterval(() => { if (isDashboard()) load(true); }, REFRESH_MS);
  [50, 300, 1200].forEach((delay, index) => setTimeout(() => { if (isDashboard()) load(index === 0); }, delay));
})();
