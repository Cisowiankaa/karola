(()=>{
  if(window.__bdsmCloudFirstSyncWatchdogInstalled)return;
  window.__bdsmCloudFirstSyncWatchdogInstalled=true;
  const META='bdsm-app-last-cloud-sync';
  const CONFIG='bdsm-app-cloud-config';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const fresh=()=>{const m=read(META,{});const t=Date.parse(m.at||0)||0;return !!t&&(Date.now()-t)<10*60*1000};
  let running=false;
  async function ensure(reason='watchdog'){
    if(running||!navigator.onLine||fresh())return;
    const api=window.bdsmCloudSync;if(!api?.push)return;
    running=true;
    try{
      await api.push(reason);
      document.dispatchEvent(new CustomEvent('bdsm-cloud-watchdog-check'));
    }catch(_){
      // Try again on the next scheduled checkpoint. Local data remains available.
    }finally{running=false}
  }
  function start(){
    const c=read(CONFIG,{});
    if(!c.accountId||!c.syncSecret)setTimeout(()=>ensure('first-init'),1200);
    [3500,12000,30000,60000].forEach((ms,i)=>setTimeout(()=>ensure('first-'+(i+1)),ms));
    window.addEventListener('online',()=>setTimeout(()=>ensure('reconnect'),1000));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(()=>ensure('visible'),500)});
    document.addEventListener('bdsm-sync-complete',()=>document.dispatchEvent(new CustomEvent('bdsm-cloud-first-sync-ready')));
    setInterval(()=>ensure('health'),10*60*1000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
