(()=>{
  if(window.__bdsmDashboardCloudStatusInstalled)return;
  window.__bdsmDashboardCloudStatusInstalled=true;
  const DATA_KEYS=['bdsm-app-events-v3','bdsm-app-rules-v3','bdsm-app-access','bdsm-app-offences-v1','bdsm-app-education-tasks-v1','bdsm-app-written-notes-v1','bdsm-app-hourly-reports-v1','bdsm-app-event-offence-links-v1','bdsm-app-today-priorities-v1','bdsm-app-today-checked-v1','bdsm-app-weekly-days-done-v1','bdsm-app-weekly-notes-v1','bdsm-app-weekly-summary-v1','bdsm-app-day-agenda-meta-v1','bdsm-app-daily-reports-v1'];
  const parse=(k,f={})=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>{if(!v)return'brak';const d=new Date(v);return Number.isNaN(d.getTime())?'brak':d.toLocaleString('pl-PL')};
  const labelState=()=>{
    const last=parse('bdsm-app-last-cloud-sync',{}),verified=parse('bdsm-app-first-cloud-sync-verified-v1',{}),watch=parse('bdsm-app-first-cloud-sync-state-v1',{});
    const pushed=!!last?.at;
    const pulled=!!last?.pulled||verified?.roundTrip===true;
    const round=verified?.provider==='supabase'&&verified?.roundTrip===true;
    return {pushed,pulled,round,watch};
  };
  const badge=(ok,waitLabel,okLabel)=>({label:ok?okLabel:waitLabel,cls:ok?'ok':'wait'});
  function render(){
    const dash=document.querySelector('#view-dashboard');if(!dash)return;
    let box=document.querySelector('#dashboardCloudStatus');
    if(!box){box=document.createElement('div');box.id='dashboardCloudStatus';box.className='panel';const ref=document.querySelector('#dashboardActivityToday');if(ref&&ref.nextSibling)dash.insertBefore(box,ref.nextSibling);else dash.appendChild(box)}
    if(!document.querySelector('#dashboardCloudStatusStyles')){const s=document.createElement('style');s.id='dashboardCloudStatusStyles';s.textContent='.dcs-grid{display:grid;grid-template-columns:repeat(6,minmax(100px,1fr));gap:10px}.dcs-kpi{padding:11px;border:1px solid #252d3c;border-radius:12px;background:#0d131d}.dcs-kpi span{display:block;font-size:10px;color:#98a2b3}.dcs-kpi b{display:block;margin-top:4px;font-size:13px}.dcs-kpi b.ok{color:#86efac}.dcs-kpi b.wait{color:#facc15}.dcs-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.dcs-msg{font-size:11px;color:#98a2b3;margin-top:8px}.dcs-verified{margin-top:10px;padding:9px 10px;border:1px solid #252d3c;border-radius:10px;background:#0a1018;font-size:11px;color:#cbd5e1}@media(max-width:1000px){.dcs-grid{grid-template-columns:repeat(2,1fr)}}';document.head.appendChild(s)}
    const cloud=parse('bdsm-app-cloud-config',{}),last=parse('bdsm-app-last-cloud-sync',{}),mods=DATA_KEYS.filter(k=>localStorage.getItem(k)!==null).length,st=labelState();
    const p=badge(st.pushed,navigator.onLine?'Oczekuje':'Brak internetu','Wysłany');
    const r=badge(st.pulled,navigator.onLine?'Niepotwierdzony':'Brak internetu','Potwierdzony');
    const rt=badge(st.round,navigator.onLine?'Weryfikacja w toku':'Brak internetu','ZWERYFIKOWANY');
    box.innerHTML=`<div class="dtp-head"><h3>☁ Stan synchronizacji</h3><span class="dtp-count">${navigator.onLine?'Online':'Offline'}</span></div><div class="dcs-grid"><div class="dcs-kpi"><span>Połączenie</span><b>${navigator.onLine?'Online':'Offline'}</b></div><div class="dcs-kpi"><span>Dostawca</span><b>${esc(cloud.provider||'lokalny')}</b></div><div class="dcs-kpi"><span>Push do chmury</span><b class="${p.cls}">${p.label}</b></div><div class="dcs-kpi"><span>Pull z chmury</span><b class="${r.cls}">${r.label}</b></div><div class="dcs-kpi"><span>Round-trip</span><b class="${rt.cls}">${rt.label}</b></div><div class="dcs-kpi"><span>Moduły lokalne</span><b>${mods}/${DATA_KEYS.length}</b></div></div><div class="dcs-verified">Ostatnia synchronizacja: <strong>${esc(fmt(last.at))}</strong> · Konto: ${esc(cloud.accountId||'jeszcze nie utworzone')} · Watchdog: ${esc(st.watch?.status||'oczekuje')}</div><div class="dcs-actions"><button class="btn" id="dcsVerify">Zweryfikuj chmurę</button><button class="btn" id="dcsPush">Zapisz teraz</button><button class="btn" id="dcsPull">Pobierz z chmury</button><button class="btn" id="dcsSettings">Ustawienia synchronizacji</button></div><div id="dcsMsg" class="dcs-msg"></div>`;
    const msg=box.querySelector('#dcsMsg');
    box.querySelector('#dcsVerify').onclick=async()=>{msg.textContent='Sprawdzam push → pull…';try{const ok=await window.bdsmFirstCloudSync?.force?.();msg.textContent=ok?'Pełna synchronizacja z Supabase została zweryfikowana.':'Weryfikacja jeszcze się nie powiodła.'}catch{msg.textContent='Błąd weryfikacji chmury.'}setTimeout(render,500)};
    box.querySelector('#dcsPush').onclick=async()=>{msg.textContent='Zapisywanie…';try{const ok=await window.bdsmCloudSync?.push?.('dashboard-manual');msg.textContent=ok?'Snapshot wysłany do chmury.':'Nie udało się wysłać snapshotu.'}catch{msg.textContent='Błąd zapisu.'}setTimeout(render,500)};
    box.querySelector('#dcsPull').onclick=async()=>{msg.textContent='Pobieranie…';try{const ok=await window.bdsmCloudSync?.pull?.(true);msg.textContent=ok?'Snapshot odczytany z chmury.':'Nie udało się potwierdzić odczytu.';if(ok)setTimeout(render,500)}catch{msg.textContent='Błąd pobierania.'}};
    box.querySelector('#dcsSettings').onclick=()=>document.querySelector('[data-view="settings"],#settingsNav,[href="#settings"]')?.click();
  }
  const boot=()=>{render();['online','offline','storage'].forEach(e=>window.addEventListener(e,render));['bdsm-sync-complete','bdsm-cloud-restored','bdsm-cloud-watchdog-check','bdsm-cloud-first-sync-ready'].forEach(e=>document.addEventListener(e,render));setInterval(render,15000)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();