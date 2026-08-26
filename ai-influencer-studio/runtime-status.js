(() => {
  const API = 'https://ai-influencer-studio-api.vercel.app';
  const statusEl = () => document.getElementById('systemStatus');
  const copilotStateEl = () => document.querySelector('.copilot-card span');

  function persistMode(mode){
    try{localStorage.setItem('aii-mode',mode)}catch{}
    try{if(typeof runtime!=='undefined'&&runtime)runtime.mode=mode}catch{}
  }

  function setStatus(mode, title) {
    const el = statusEl();
    persistMode(mode);
    if (!el) return;
    el.dataset.detectedMode = mode;
    el.title = title || '';
    if (mode === 'online-ai') {
      el.textContent = '● ONLINE + AI';
      el.classList.add('online');
      el.classList.remove('offline');
    } else if (mode === 'online-local') {
      el.textContent = '● ONLINE bez AI';
      el.classList.add('online');
      el.classList.remove('offline');
    } else {
      el.textContent = '● OFFLINE';
      el.classList.remove('online');
      el.classList.add('offline');
    }
    document.dispatchEvent(new CustomEvent('aii:runtime-detected',{detail:{mode}}));
  }

  function setSafeInitialStatus(){
    if(!navigator.onLine){setStatus('offline','Brak połączenia z internetem. Dane lokalne pozostają dostępne.');return;}
    setStatus('online-local','Internet dostępny · AI jeszcze niepotwierdzone · używam bezpiecznego trybu lokalnego');
    const c=copilotStateEl();
    if(c)c.textContent='Tryb lokalny — sprawdzanie AI';
  }

  function loadCalendarHandoff(){
    if(window.AIIContentCalendarHandoff||document.querySelector('script[data-aii-calendar-handoff]'))return;
    const s=document.createElement('script');
    s.src='content-calendar-handoff.js?v=20260827-2';
    s.dataset.aiiCalendarHandoff='1';
    s.defer=true;
    document.head.appendChild(s);
  }

  async function ping(path) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    try {
      const r = await fetch(`${API}${path}?_=${Date.now()}`, { cache: 'no-store', signal: ctrl.signal });
      const data = await r.json().catch(() => ({}));
      return { ok: r.ok && data?.ok !== false, status: r.status, data };
    } catch (error) {
      return { ok: false, status: 0, data: {}, error };
    } finally {
      clearTimeout(timer);
    }
  }

  async function detectRuntime() {
    if (!navigator.onLine) {
      setStatus('offline', 'Brak połączenia z internetem. Dane lokalne pozostają dostępne.');
      const c = copilotStateEl();
      if (c) c.textContent = 'Tryb lokalny';
      window.AII_RUNTIME_HEALTH={checkedAt:new Date().toISOString(),online:false,social:{ok:false},ai:{ok:false}};
      return;
    }

    const [social, ai] = await Promise.all([
      ping('/api/social-metrics'),
      ping('/api/generate-image')
    ]);

    if (ai.ok) {
      setStatus('online-ai', `Internet: OK · Instagram: ${social.ok ? 'OK' : 'błąd'} · AI: aktywne`);
      const c = copilotStateEl();
      if (c) c.textContent = 'AI aktywne';
    } else {
      setStatus('online-local', `Internet: OK · Instagram: ${social.ok ? 'OK' : 'błąd'} · AI: niedostępne (${ai.status || 'brak połączenia'})`);
      const c = copilotStateEl();
      if (c) c.textContent = 'Tryb lokalny — AI niedostępne';
    }

    window.AII_RUNTIME_HEALTH = {
      checkedAt: new Date().toISOString(),
      online: true,
      social,
      ai
    };
  }

  window.AII_detectRuntime = detectRuntime;
  window.addEventListener('online', detectRuntime);
  window.addEventListener('offline', detectRuntime);
  document.addEventListener('DOMContentLoaded', () => {
    setSafeInitialStatus();
    loadCalendarHandoff();
    if (typeof window.AII_refreshDashboard === 'function') window.AII_refreshDashboard();
    detectRuntime();
    setInterval(detectRuntime, 60000);
  });
})();
