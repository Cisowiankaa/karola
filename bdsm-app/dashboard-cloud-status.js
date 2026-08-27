(()=>{
  if(window.__bdsmDashboardCloudStatusInstalled)return;
  window.__bdsmDashboardCloudStatusInstalled=true;
  const DATA_KEYS=['bdsm-app-events-v3','bdsm-app-rules-v3','bdsm-app-access','bdsm-app-offences-v1','bdsm-app-education-tasks-v1','bdsm-app-written-notes-v1','bdsm-app-hourly-reports-v1','bdsm-app-event-offence-links-v1','bdsm-app-today-priorities-v1','bdsm-app-today-checked-v1','bdsm-app-weekly-days-done-v1','bdsm-app-weekly-notes-v1','bdsm-app-weekly-summary-v1','bdsm-app-day-agenda-meta-v1','bdsm-app-daily-reports-v1'];
  const parse=(k,f={})=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>{if(!v)return'brak';const d=new Date(v);return Number.isNaN(d.getTime())?'brak':d.toLocaleString('pl-PL')};
  function render(){
    const dash=document.querySelector('#view-dashboard');if(!dash)return;
    let box=document.querySelector('#dashboardCloudStatus');
    if(!box){box=document.createElement('div');box.id='dashboardCloudStatus';box.className='panel';const ref=document.querySelector('#dashboardActivityToday');if(ref&&ref.nextSibling)dash.insertBefore(box,ref.nextSibling);else dash.appendChild(box)}
    if(!document.querySelector('#dashboardCloudStatusStyles')){const s=document.createElement('style');s.id='dashboardCloudStatusStyles';s.textContent='.dcs-grid{display:grid;grid-template-columns:repeat(4,minmax(100px,1fr));gap:10px}.dcs-kpi{padding:11px;border:1px solid #252d3c;border-radius:12px;background:#0d131d}.dcs-kpi span{display:block;font-size:10px;color:#98a2b3}.dcs-kpi b{display:block;margin-top:4px;font-size:13px}.dcs-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.dcs-msg{font-size:11px;color:#98a2b3;margin-top:8px}@media(max-width:900px){.dcs-grid{grid-template-columns:repeat(2,1fr)}}';document.head.appendChild(s)}
    const cloud=parse('bdsm-app-cloud-config',{}),last=parse('bdsm-app-last-cloud-sync',{}),mods=DATA_KEYS.filter(k=>localStorage.getItem(k)!==null).length;
    box.innerHTML=`<div class="dtp-head"><h3>☁ Stan synchronizacji</h3><span class="dtp-count">${navigator.onLine?'Online':'Offline'}</span></div><div class="dcs-grid"><div class="dcs-kpi"><span>Połączenie</span><b>${navigator.onLine?'Online':'Offline'}</b></div><div class="dcs-kpi"><span>Dostawca</span><b>${esc(cloud.provider||'lokalny')}</b></div><div class="dcs-kpi"><span>Ostatnia synchronizacja</span><b>${esc(fmt(last.at))}</b></div><div class="dcs-kpi"><span>Moduły lokalne</span><b>${mods}/${DATA_KEYS.length}</b></div></div><div class="dcs-msg">Konto: ${esc(cloud.accountId||'jeszcze nie utworzone')}</div><div class="dcs-actions"><button class="btn" id="dcsPush">Zapisz teraz</button><button class="btn" id="dcsPull">Pobierz z chmury</button><button class="btn" id="dcsSettings">Ustawienia synchronizacji</button></div><div id="dcsMsg" class="dcs-msg"></div>`;
    const msg=box.querySelector('#dcsMsg');
    box.querySelector('#dcsPush').onclick=async()=>{msg.textContent='Zapisywanie…';try{const ok=await window.bdsmCloudSync?.push?.('dashboard-manual');msg.textContent=ok?'Zapisano w chmurze.':'Nie udało się zapisać.'}catch{msg.textContent='Błąd zapisu.'}setTimeout(render,500)};
    box.querySelector('#dcsPull').onclick=async()=>{msg.textContent='Pobieranie…';try{const ok=await window.bdsmCloudSync?.pull?.(true);msg.textContent=ok?'Dane pobrane.':'Brak nowszych danych.';if(ok)setTimeout(()=>location.reload(),500)}catch{msg.textContent='Błąd pobierania.'}};
    box.querySelector('#dcsSettings').onclick=()=>document.querySelector('[data-view="settings"],#settingsNav,[href="#settings"]')?.click();
  }
  const boot=()=>{render();['online','offline','storage'].forEach(e=>window.addEventListener(e,render));['bdsm-sync-complete','bdsm-cloud-restored'].forEach(e=>document.addEventListener(e,render));setInterval(render,15000)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();