(() => {
  const API = 'https://hook.eu1.make.com/gw8nr0beqtbymtd2xgiga3wn7qfjhp25';
  const $ = (s) => document.querySelector(s);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  async function postSync(payload, attempt = 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(API, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-store',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      let data = null;
      try { data = await response.json(); } catch (_) {}
      return { ok: true, data };
    } catch (error) {
      if (attempt < 2) {
        await sleep(700);
        return postSync(payload, attempt + 1);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  function getCloud() {
    const key = 'bdsm-app-cloud-config';
    let cloud;
    try { cloud = JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) {}
    if (!cloud) cloud = { accountId: 'ACC-' + Math.random().toString(36).slice(2,10) };
    cloud.apiBase = API;
    cloud.enabled = true;
    localStorage.setItem(key, JSON.stringify(cloud));
    return cloud;
  }

  function install() {
    const btn = $('#syncNow');
    if (!btn || btn.dataset.syncFixInstalled === '1') return;
    btn.dataset.syncFixInstalled = '1';
    const replacement = btn.cloneNode(true);
    btn.replaceWith(replacement);

    replacement.addEventListener('click', async () => {
      const dot = $('#syncDot');
      const txt = $('#syncText');
      const cloud = getCloud();
      const events = (() => { try { return JSON.parse(localStorage.getItem('bdsm-app-events-v3') || '[]'); } catch (_) { return []; } })();
      const rules = (() => { try { return JSON.parse(localStorage.getItem('bdsm-app-rules-v3') || '{}'); } catch (_) { return {}; } })();
      const accessList = (() => { try { return JSON.parse(localStorage.getItem('bdsm-app-access') || '[]'); } catch (_) { return []; } })();
      const requestId = 'SYNC-' + Date.now() + '-' + Math.random().toString(36).slice(2,7);
      const payload = { action: 'sync', requestId, accountId: cloud.accountId, events, rules, accessList, clientTime: new Date().toISOString() };

      replacement.disabled = true;
      if (txt) txt.textContent = 'Synchronizacja… ' + requestId;
      if (dot) dot.className = 'sync-dot';

      try {
        const result = await postSync(payload);
        localStorage.setItem('bdsm-app-last-sync', JSON.stringify({ requestId, at: new Date().toISOString(), result: result.data || null }));
        if (txt) txt.textContent = 'Online — zapis potwierdzony • ' + new Date().toLocaleTimeString('pl-PL');
        if (dot) dot.className = 'sync-dot ok';
      } catch (error) {
        console.error('BDSM sync failed', error);
        if (txt) txt.textContent = 'Błąd synchronizacji: ' + (error.name === 'AbortError' ? 'timeout' : error.message);
        if (dot) dot.className = 'sync-dot';
      } finally {
        replacement.disabled = false;
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
