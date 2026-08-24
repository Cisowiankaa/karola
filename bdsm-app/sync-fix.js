(() => {
  const API = 'https://hook.eu1.make.com/gw8nr0beqtbymtd2xgiga3wn7qfjhp25';
  const $ = (s) => document.querySelector(s);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const INVITE_LOG_KEY = 'bdsm-app-invite-log-v1';

  const readJSON = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch (_) { return fallback; }
  };

  const writeJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  function readInviteLog() { return readJSON(INVITE_LOG_KEY, {}); }
  function writeInviteLog(log) { writeJSON(INVITE_LOG_KEY, log); }

  function updateInviteStatus(person, patch) {
    if (!person) return;
    const log = readInviteLog();
    log[person] = { ...(log[person] || {}), ...patch };
    writeInviteLog(log);
    renderEmailPanel();
  }

  async function postSync(payload, attempt = 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(API, {
        method: 'POST', mode: 'cors', cache: 'no-store', credentials: 'omit',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload), signal: controller.signal
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      let data = null;
      try { data = await response.json(); } catch (_) {}
      return { ok: true, data };
    } catch (error) {
      if (attempt < 2) { await sleep(700); return postSync(payload, attempt + 1); }
      throw error;
    } finally { clearTimeout(timer); }
  }

  function getCloud() {
    const key = 'bdsm-app-cloud-config';
    let cloud = readJSON(key, null);
    if (!cloud) cloud = { accountId: 'ACC-' + Math.random().toString(36).slice(2,10) };
    cloud.apiBase = API;
    cloud.enabled = true;
    writeJSON(key, cloud);
    return cloud;
  }

  function accessList() { return readJSON('bdsm-app-access', []); }

  function fmtDate(value) {
    if (!value) return '—';
    try { return new Date(value).toLocaleString('pl-PL'); } catch (_) { return value; }
  }

  function statusBadge(status) {
    const labels = { sent: 'Wysłano', sending: 'Wysyłanie…', error: 'Błąd', pending: 'Oczekuje' };
    const bg = status === 'sent' ? '#12351f' : status === 'error' ? '#3a171d' : status === 'sending' ? '#33270f' : '#202735';
    const fg = status === 'sent' ? '#7ee2a8' : status === 'error' ? '#ff929c' : status === 'sending' ? '#ffd36f' : '#c6cedb';
    return `<span style="display:inline-block;padding:5px 8px;border-radius:8px;background:${bg};color:${fg};font-size:11px;font-weight:700">${labels[status] || labels.pending}</span>`;
  }

  async function resendInvite(person) {
    const item = accessList().find(x => x.person === person && !x.revoked);
    if (!item) return;
    const cloud = getCloud();
    const requestId = 'INVITE-' + Date.now() + '-' + Math.random().toString(36).slice(2,7);
    updateInviteStatus(person, { status: 'sending', lastAttemptAt: new Date().toISOString(), requestId, error: null });
    try {
      await postSync({ action: 'sync', requestId, accountId: cloud.accountId, events: [], rules: {}, accessList: [item], clientTime: new Date().toISOString() });
      updateInviteStatus(person, { status: 'sent', sentAt: new Date().toISOString(), requestId, error: null });
    } catch (error) {
      updateInviteStatus(person, { status: 'error', lastAttemptAt: new Date().toISOString(), requestId, error: error.message || String(error) });
    }
  }

  function installEmailPanel() {
    const nav = $('#nav');
    const content = $('.content');
    if (!nav || !content || $('#emailInvitesNav')) return;

    const accessBtn = [...nav.querySelectorAll('button')].find(b => b.dataset.view === 'access');
    const btn = document.createElement('button');
    btn.id = 'emailInvitesNav';
    btn.type = 'button';
    btn.innerHTML = '✉ E-maile / Zaproszenia';
    if (accessBtn && accessBtn.nextSibling) nav.insertBefore(btn, accessBtn.nextSibling); else nav.appendChild(btn);

    const section = document.createElement('section');
    section.id = 'view-email-invites';
    section.className = 'hidden';
    section.innerHTML = '<div class="panel"><h3>E-maile / Zaproszenia</h3><p style="color:#98a2b3;font-size:12px;margin-top:-4px">Podgląd wysyłek zaproszeń z tej przeglądarki.</p><div id="emailInviteStats" style="margin:12px 0"></div><div id="emailInviteTable"></div></div>';
    content.appendChild(section);

    btn.addEventListener('click', () => {
      document.querySelectorAll('.content > section').forEach(s => s.classList.add('hidden'));
      section.classList.remove('hidden');
      nav.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderEmailPanel();
    });

    section.addEventListener('click', (e) => {
      const resend = e.target.closest('[data-resend-invite]');
      if (resend) resendInvite(decodeURIComponent(resend.dataset.resendInvite));
    });

    renderEmailPanel();
  }

  function renderEmailPanel() {
    const table = $('#emailInviteTable');
    const stats = $('#emailInviteStats');
    if (!table) return;
    const list = accessList();
    const log = readInviteLog();
    const rows = list.map(item => {
      const st = log[item.person] || { status: 'pending' };
      const when = st.sentAt || st.lastAttemptAt || null;
      return `<tr><td>${item.person || '—'}</td><td>${item.role || 'user'}</td><td>${statusBadge(st.status)}</td><td>${fmtDate(when)}</td><td>${st.error ? `<span title="${String(st.error).replace(/"/g,'&quot;')}" style="color:#ff929c">${st.error}</span>` : '—'}</td><td><button class="btn" data-resend-invite="${encodeURIComponent(item.person || '')}" ${item.revoked ? 'disabled' : ''}>Wyślij ponownie</button></td></tr>`;
    }).join('');
    const sent = list.filter(i => (log[i.person] || {}).status === 'sent').length;
    const errors = list.filter(i => (log[i.person] || {}).status === 'error').length;
    if (stats) stats.innerHTML = `<span style="margin-right:14px">Wysłano: <strong>${sent}</strong></span><span style="margin-right:14px">Błędy: <strong>${errors}</strong></span><span>Łącznie: <strong>${list.length}</strong></span>`;
    table.innerHTML = rows ? `<div style="overflow:auto"><table class="table"><thead><tr><th>Adres</th><th>Rola</th><th>Status</th><th>Ostatnia próba</th><th>Błąd</th><th>Akcja</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="empty">Brak zaproszeń.</div>';
  }

  function install() {
    installEmailPanel();
    const btn = $('#syncNow');
    if (!btn || btn.dataset.syncFixInstalled === '1') return;
    btn.dataset.syncFixInstalled = '1';
    const replacement = btn.cloneNode(true);
    btn.replaceWith(replacement);

    replacement.addEventListener('click', async () => {
      const dot = $('#syncDot');
      const txt = $('#syncText');
      const cloud = getCloud();
      const events = readJSON('bdsm-app-events-v3', []);
      const rules = readJSON('bdsm-app-rules-v3', {});
      const list = accessList();
      const requestId = 'SYNC-' + Date.now() + '-' + Math.random().toString(36).slice(2,7);
      const payload = { action: 'sync', requestId, accountId: cloud.accountId, events, rules, accessList: list, clientTime: new Date().toISOString() };

      replacement.disabled = true;
      list.filter(x => !x.revoked).forEach(x => updateInviteStatus(x.person, { status: 'sending', lastAttemptAt: new Date().toISOString(), requestId, error: null }));
      if (txt) txt.textContent = 'Synchronizacja… ' + requestId;
      if (dot) dot.className = 'sync-dot';

      try {
        const result = await postSync(payload);
        writeJSON('bdsm-app-last-sync', { requestId, at: new Date().toISOString(), result: result.data || null });
        const sentAt = new Date().toISOString();
        list.filter(x => !x.revoked).forEach(x => updateInviteStatus(x.person, { status: 'sent', sentAt, requestId, error: null }));
        if (txt) txt.textContent = 'Online — zapis potwierdzony • ' + new Date().toLocaleTimeString('pl-PL');
        if (dot) dot.className = 'sync-dot ok';
      } catch (error) {
        list.filter(x => !x.revoked).forEach(x => updateInviteStatus(x.person, { status: 'error', lastAttemptAt: new Date().toISOString(), requestId, error: error.message || String(error) }));
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
