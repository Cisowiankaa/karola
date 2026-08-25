(() => {
  const API = 'https://ai-influencer-studio-api.vercel.app/api/social-sync';
  let cache = null;
  let loading = false;

  const fmt = n => new Intl.NumberFormat('pl-PL').format(Number(n || 0));
  const pct = n => `${Number(n || 0).toFixed(2).replace('.', ',')}%`;

  async function load() {
    if (loading) return;
    loading = true;
    try {
      const r = await fetch(API, { cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      cache = await r.json();
      apply();
    } catch (e) {
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

  function apply() {
    if (!cache?.ok || !document.querySelector('#content .metrics-grid')) return;
    const profile = cache.profiles?.find(p => p.platform === 'Instagram') || cache.profiles?.[0] || {};
    const items = cache.items || [];
    const likes = items.reduce((s, x) => s + Number(x.likes || 0), 0);
    const comments = items.reduce((s, x) => s + Number(x.comments || 0), 0);
    const interactions = likes + comments;
    const engagement = profile.followers ? (interactions / (profile.followers * Math.max(items.length, 1))) * 100 : 0;
    const reels = items.filter(x => x.type === 'Reels').length;
    const cards = metricCards();

    setMetric(cards[0], 'Obserwujący', fmt(profile.followers), `Instagram ${profile.handle || ''}`.trim());
    setMetric(cards[1], 'Publikacje', fmt(profile.mediaCount), 'Łącznie na Instagramie');
    setMetric(cards[2], 'Śr. zaangażowanie', pct(engagement), `Na podstawie ${items.length} ostatnich publikacji`);
    setMetric(cards[3], 'Polubienia', fmt(likes), `${fmt(comments)} komentarzy`);
    setMetric(cards[4], 'Reels', fmt(reels), `W ostatnich ${items.length} publikacjach`);

    const pulse = document.querySelector('#content .panel-card .tag');
    if (pulse) pulse.textContent = 'LIVE · INSTAGRAM';

    const subtitle = document.getElementById('pageSubtitle');
    if (subtitle && document.querySelector('.nav-item.active')?.dataset.view === 'dashboard') {
      subtitle.textContent = `Dane na żywo z ${profile.handle || 'Instagrama'} · synchronizacja ${new Date(cache.syncedAt).toLocaleTimeString('pl-PL', {hour:'2-digit', minute:'2-digit'})}`;
    }

    // Fake audience/revenue values are hidden until their own integrations are connected.
    [...document.querySelectorAll('#content .analytics-grid .panel-card')].forEach(card => {
      const title = card.querySelector('h2')?.textContent?.trim();
      if (title === 'Odbiorcy') {
        card.innerHTML = '<div class="section-head"><h2>Odbiorcy</h2><span class="tag">META</span></div><p class="page-subtitle">Szczegółowa demografia zostanie pokazana po dodaniu uprawnień Insights.</p><div class="kpi-line"><span>Status</span><b>Profil połączony</b></div>';
      }
      if (title === 'Przychody') {
        card.innerHTML = '<div class="section-head"><h2>Przychody</h2><span class="tag">BRAK INTEGRACJI</span></div><p class="page-subtitle">Nie pokazuję danych przykładowych. Podłącz źródło finansowe, aby wyświetlać rzeczywiste przychody.</p>';
      }
    });
  }

  function applyError(e) {
    if (!document.querySelector('#content .metrics-grid')) return;
    const cards = metricCards();
    cards.forEach((card, i) => {
      if (i === 0) setMetric(card, 'Instagram', '—', 'Synchronizacja chwilowo niedostępna');
    });
    console.warn('Dashboard live sync:', e);
  }

  const observer = new MutationObserver(() => {
    if (document.querySelector('#content .metrics-grid')) {
      if (cache?.ok) apply(); else load();
    }
  });

  observer.observe(document.getElementById('content'), { childList: true, subtree: true });
  window.addEventListener('focus', load);
  setInterval(load, 60000);
  load();
})();
