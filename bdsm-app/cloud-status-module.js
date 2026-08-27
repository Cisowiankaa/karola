(()=>{
  if(window.__bdsmCloudStatusInstalled)return;
  window.__bdsmCloudStatusInstalled=true;

  const DATA_KEYS=[
    'bdsm-app-events-v3','bdsm-app-rules-v3','bdsm-app-access','bdsm-app-offences-v1',
    'bdsm-app-education-tasks-v1','bdsm-app-written-notes-v1','bdsm-app-hourly-reports-v1',
    'bdsm-app-event-offence-links-v1','bdsm-app-today-priorities-v1','bdsm-app-today-checked-v1',
    'bdsm-app-weekly-days-done-v1','bdsm-app-weekly-notes-v1','bdsm-app-weekly-summary-v1',
    'bdsm-app-day-agenda-meta-v1','bdsm-app-daily-reports-v1'
  ];
  const parse=(k,f={})=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(_){return f}};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function countModules(){return DATA_KEYS.filter(k=>localStorage.getItem(k)!==null).length}
  function fmt(v){if(!v)return 'brak';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleString('pl-PL')}

  function render(){
    const host=document.querySelector('#view-settings .panel')||document.querySelector('#view-settings');
    if(!host)return;
    let box=document.querySelector('#bdsmCloudStatus');
    if(!box){
      box=document.createElement('div');box.id='bdsmCloudStatus';
      box.style.cssText='margin-top:16px;padding:14px;border:1px solid #283141;border-radius:12px;background:#0c121c';
      host.appendChild(box);
    }
    const cloud=parse('bdsm-app-cloud-config',{}), last=parse('bdsm-app-last-cloud-sync',{}), online=navigator.onLine;
    const pairing=window.bdsmCloudSync&&window.bdsmCloudSync.getPairingCode?window.bdsmCloudSync.getPairingCode():'';
    box.innerHTML=`<h3 style="margin:0 0 12px">Stan chmury</h3>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;font-size:12px">
        <div><span style="color:#98a2b3">Połączenie</span><br><strong>${online?'Online':'Offline'}</strong></div>
        <div><span style="color:#98a2b3">Dostawca</span><br><strong>${esc(cloud.provider||'lokalny')}</strong></div>
        <div><span style="color:#98a2b3">Ostatnia synchronizacja</span><br><strong>${esc(fmt(last.at))}</strong></div>
        <div><span style="color:#98a2b3">Moduły lokalne</span><br><strong>${countModules()} / ${DATA_KEYS.length}</strong></div>
      </div>
      <div style="margin-top:10px;color:#98a2b3;font-size:11px;word-break:break-all">Konto: ${esc(cloud.accountId||'jeszcze nie utworzone')}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
        <button class="btn" id="cloudSaveNow">Zapisz teraz</button>
        <button class="btn" id="cloudPullNow">Pobierz z chmury</button>
        <button class="btn" id="cloudPairCopy">Kopiuj kod parowania</button>
      </div>
      <div id="cloudStatusMsg" style="margin-top:8px;color:#98a2b3;font-size:12px"></div>`;
    const msg=box.querySelector('#cloudStatusMsg');
    box.querySelector('#cloudSaveNow').onclick=async()=>{msg.textContent='Zapisywanie…';try{const ok=await window.bdsmCloudSync?.push?.('manual-status');msg.textContent=ok?'Zapisano w chmurze.':'Nie udało się zapisać.'}catch(e){msg.textContent='Błąd zapisu.'}setTimeout(render,300)};
    box.querySelector('#cloudPullNow').onclick=async()=>{msg.textContent='Pobieranie…';try{const ok=await window.bdsmCloudSync?.pull?.(true);msg.textContent=ok?'Dane pobrane. Odświeżam widok…':'Brak nowszych danych.';if(ok)setTimeout(()=>location.reload(),500)}catch(e){msg.textContent='Błąd pobierania.'}setTimeout(render,300)};
    box.querySelector('#cloudPairCopy').onclick=async()=>{if(!pairing){msg.textContent='Kod parowania nie jest jeszcze dostępny.';return}try{await navigator.clipboard.writeText(pairing);msg.textContent='Kod parowania skopiowany.'}catch(_){msg.textContent='Nie udało się skopiować automatycznie.'}};
  }

  const boot=()=>{render();setInterval(render,15000);document.addEventListener('bdsm-sync-complete',render);document.addEventListener('bdsm-cloud-restored',render);document.addEventListener('click',()=>setTimeout(render,120))};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
