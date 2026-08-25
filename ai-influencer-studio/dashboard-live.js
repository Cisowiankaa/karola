(() => {
  const API = 'https://ai-influencer-studio-api.vercel.app/api/social-sync';
  const REFRESH_MS = 60000;
  let cache = null;
  let loading = false;
  let lastLoadAt = 0;
  let observerBusy = false;

  const fmt = n => (n === null || n === undefined || n === '') ? '—' : new Intl.NumberFormat('pl-PL').format(Number(n));
  const pct = n => Number.isFinite(Number(n)) ? `${Number(n).toFixed(2).replace('.', ',')}%` : '—';

  async function load(force = false) {
    const now = Date.now();
    if (loading) return;
    if (!force && lastLoadAt && now - lastLoadAt < REFRESH_MS) {
      if (cache?.ok) apply();
      return;
    }

    loading = true;
    lastLoadAt = now;
    try {
      const r = await fetch(API);
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

  function replaceUnverifiedAnalytics() {
    [...document.querySelectorAll('#content .analytics-grid .panel-card')].forEach(card => {
      const title = card.querySelector('h2')?.textContent?.trim();
      if (title === 'Wzrost społeczności') {
        card.innerHTML = '<div class="section-head"><h2>Wzrost społeczności</h2><span class="tag">BRAK DANYCH HISTORYCZNYCH</span></div><p class="page-subtitle">Wykres pojawi się dopiero po pobraniu rzeczywistych danych historycznych.</p>';
      }
      if (title === 'Odbiorcy') {
        card.innerHTML = '<div class="section-head"><h2>Odbiorcy</h2><span class="tag">META</span></div><p class="page-subtitle">Nie pokazuję danych przykładowych. Szczegółowa demografia wymaga danych Insights.</p>';
      }
      if (title === 'Przychody') {
        card.innerHTML = '<div class="section-head"><h2>Przychody</h2><span class="tag">BRAK INTEGRACJI</span></div><p class="page-subtitle">Nie pokazuję danych przykładowych. Podłącz źródło finansowe, aby wyświetlać rzeczywiste przychody.</p>';
      }
    });
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
    if (!cache?.ok || !document.querySelector('#content .metrics-grid')) return;
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

    replaceUnverifiedAnalytics();
    renderCalendar();
  }

  function applyError(e) {
    if (!document.querySelector('#content .metrics-grid')) return;
    const cards = metricCards();
    const labels = ['Instagram', 'Publikacje', 'Zaangażowanie', 'Polubienia', 'Reels'];
    cards.forEach((card, i) => setMetric(card, labels[i] || 'Dane', '—', 'Brak zweryfikowanych danych LIVE'));

    const pulse = document.querySelector('#content .panel-card .tag');
    if (pulse) pulse.textContent = 'OFFLINE · INSTAGRAM';

    const subtitle = document.getElementById('pageSubtitle');
    if (subtitle && document.querySelector('.nav-item.active')?.dataset.view === 'dashboard') {
      subtitle.textContent = 'Instagram chwilowo niedostępny · wartości demo zostały ukryte';
    }

    replaceUnverifiedAnalytics();
    renderCalendar();
    console.warn('Dashboard live sync:', e);
  }

  const observer = new MutationObserver(() => {
    if (observerBusy) return;
    if (!document.querySelector('#content .metrics-grid')) return;

    observerBusy = true;
    queueMicrotask(() => {
      try {
        renderCalendar();
        if (cache?.ok) apply();
        else if (Date.now() - lastLoadAt >= REFRESH_MS) load();
      } finally {
        observerBusy = false;
      }
    });
  });

  const content = document.getElementById('content');
  if (content) observer.observe(content, { childList: true, subtree: true });

  window.addEventListener('focus', () => load());
  window.addEventListener('storage', renderCalendar);
  setInterval(() => load(), REFRESH_MS);
  load(true);
})();
