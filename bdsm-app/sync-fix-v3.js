(() => {
  const API = 'https://hook.eu1.make.com/gw8nr0beqtbymtd2xgiga3wn7qfjhp25';
  const $ = (s) => document.querySelector(s);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const INVITE_LOG_KEY = 'bdsm-app-invite-log-v1';
  const readJSON = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch (_) { return fallback; } };
  const writeJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const accessList = () => readJSON('bdsm-app-access', []);
  const readInviteLog = () => readJSON(INVITE_LOG_KEY, {});

  function updateInviteStatus(person, patch) {
    if (!person) return;
    const log = readInviteLog();
    log[person] = { ...(log[person] || {}), ...patch };
    writeJSON(INVITE_LOG_KEY, log);
    renderEmailPanel();
  }

  async function postSync(payload, attempt = 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(API, {method:'POST',mode:'cors',cache:'no-store',credentials:'omit',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      let data = null; try { data = await response.json(); } catch (_) {}
      return {ok:true,data};
    } catch (error) {
      if (attempt < 2) { await sleep(700); return postSync(payload, attempt + 1); }
      throw error;
    } finally { clearTimeout(timer); }
  }

  function getCloud() {
    const key='bdsm-app-cloud-config';
    let cloud=readJSON(key,null);
    if(!cloud) cloud={accountId:'ACC-'+Math.random().toString(36).slice(2,10)};
    cloud.apiBase=API; cloud.enabled=true; writeJSON(key,cloud); return cloud;
  }

  const fmtDate = value => value ? new Date(value).toLocaleString('pl-PL') : '—';
  function statusBadge(status) {
    const map={sent:['Wysłano','#12351f','#7ee2a8'],sending:['Wysyłanie…','#33270f','#ffd36f'],error:['Błąd','#3a171d','#ff929c'],pending:['Oczekuje','#202735','#c6cedb']};
    const [label,bg,fg]=map[status]||map.pending;
    return `<span style="display:inline-block;padding:5px 8px;border-radius:8px;background:${bg};color:${fg};font-size:11px;font-weight:700">${label}</span>`;
  }

  async function resendInvite(person) {
    const item=accessList().find(x=>x.person===person&&!x.revoked);
    if(!item) return;
    const cloud=getCloud();
    const requestId='INVITE-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
    updateInviteStatus(person,{status:'sending',lastAttemptAt:new Date().toISOString(),requestId,error:null});
    try {
      await postSync({action:'sync',requestId,accountId:cloud.accountId,events:[],rules:{},accessList:[item],clientTime:new Date().toISOString()});
      updateInviteStatus(person,{status:'sent',sentAt:new Date().toISOString(),requestId,error:null});
    } catch(error) {
      updateInviteStatus(person,{status:'error',lastAttemptAt:new Date().toISOString(),requestId,error:error.message||String(error)});
    }
  }

  function installEmailPanel() {
    const nav=$('#nav'),content=$('.content');
    if(!nav||!content||$('#emailInvitesNav')) return;
    const accessBtn=[...nav.querySelectorAll('button')].find(b=>b.dataset.view==='access');
    const btn=document.createElement('button');
    btn.id='emailInvitesNav'; btn.type='button'; btn.innerHTML='✉ E-maile / Zaproszenia';
    if(accessBtn&&accessBtn.nextSibling) nav.insertBefore(btn,accessBtn.nextSibling); else nav.appendChild(btn);
    const section=document.createElement('section');
    section.id='view-email-invites'; section.className='hidden';
    section.innerHTML='<div class="panel"><h3>E-maile / Zaproszenia</h3><p style="color:#98a2b3;font-size:12px;margin-top:-4px">Statusy zaproszeń. Zwykła synchronizacja nie wysyła ponownie już wysłanych zaproszeń.</p><div id="emailInviteStats" style="margin:12px 0"></div><div id="emailInviteTable"></div></div>';
    content.appendChild(section);
    btn.addEventListener('click',()=>{document.querySelectorAll('.content > section').forEach(s=>s.classList.add('hidden'));section.classList.remove('hidden');nav.querySelectorAll('button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderEmailPanel();});
    section.addEventListener('click',e=>{const resend=e.target.closest('[data-resend-invite]');if(resend)resendInvite(decodeURIComponent(resend.dataset.resendInvite));});
    renderEmailPanel();
  }

  function renderEmailPanel() {
    const table=$('#emailInviteTable'),stats=$('#emailInviteStats'); if(!table) return;
    const list=accessList(),log=readInviteLog();
    const rows=list.map(item=>{const st=log[item.person]||{status:'pending'};const when=st.sentAt||st.lastAttemptAt||null;return `<tr><td>${item.person||'—'}</td><td>${item.role||'user'}</td><td>${statusBadge(st.status)}</td><td>${fmtDate(when)}</td><td>${st.error?`<span style="color:#ff929c">${st.error}</span>`:'—'}</td><td><button class="btn" data-resend-invite="${encodeURIComponent(item.person||'')}" ${item.revoked?'disabled':''}>Wyślij ponownie</button></td></tr>`;}).join('');
    const sent=list.filter(i=>(log[i.person]||{}).status==='sent').length;
    const errors=list.filter(i=>(log[i.person]||{}).status==='error').length;
    const pending=list.filter(i=>!i.revoked&&(log[i.person]||{}).status!=='sent').length;
    if(stats) stats.innerHTML=`<span style="margin-right:14px">Wysłano: <strong>${sent}</strong></span><span style="margin-right:14px">Oczekuje: <strong>${pending}</strong></span><span style="margin-right:14px">Błędy: <strong>${errors}</strong></span><span>Łącznie: <strong>${list.length}</strong></span>`;
    table.innerHTML=rows?`<div style="overflow:auto"><table class="table"><thead><tr><th>Adres</th><th>Rola</th><th>Status</th><th>Ostatnia próba</th><th>Błąd</th><th>Akcja</th></tr></thead><tbody>${rows}</tbody></table></div>`:'<div class="empty">Brak zaproszeń.</div>';
  }

  function install() {
    installEmailPanel();
    const btn=$('#syncNow'); if(!btn) return;
    const replacement=btn.cloneNode(true); btn.replaceWith(replacement);
    replacement.addEventListener('click',async()=>{
      const dot=$('#syncDot'),txt=$('#syncText'),cloud=getCloud();
      const events=readJSON('bdsm-app-events-v3',[]),rules=readJSON('bdsm-app-rules-v3',{}),list=accessList(),log=readInviteLog();
      const pendingInvites=list.filter(x=>!x.revoked&&(log[x.person]||{}).status!=='sent');
      const requestId='SYNC-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
      const payload={action:'sync',requestId,accountId:cloud.accountId,events,rules,accessList:pendingInvites,clientTime:new Date().toISOString()};
      replacement.disabled=true;
      pendingInvites.forEach(x=>updateInviteStatus(x.person,{status:'sending',lastAttemptAt:new Date().toISOString(),requestId,error:null}));
      if(txt) txt.textContent=pendingInvites.length?`Synchronizacja… ${requestId}`:'Synchronizacja danych — brak nowych zaproszeń';
      if(dot) dot.className='sync-dot';
      try {
        const result=await postSync(payload);
        writeJSON('bdsm-app-last-sync',{requestId,at:new Date().toISOString(),result:result.data||null});
        const sentAt=new Date().toISOString();
        pendingInvites.forEach(x=>updateInviteStatus(x.person,{status:'sent',sentAt,requestId,error:null}));
        if(txt) txt.textContent='Online — zapis potwierdzony • '+new Date().toLocaleTimeString('pl-PL');
        if(dot) dot.className='sync-dot ok';
      } catch(error) {
        pendingInvites.forEach(x=>updateInviteStatus(x.person,{status:'error',lastAttemptAt:new Date().toISOString(),requestId,error:error.message||String(error)}));
        if(txt) txt.textContent='Błąd synchronizacji: '+(error.name==='AbortError'?'timeout':error.message);
        if(dot) dot.className='sync-dot';
      } finally { replacement.disabled=false; }
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
})();
