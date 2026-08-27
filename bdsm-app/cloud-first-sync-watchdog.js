(()=>{
  if(window.__bdsmCloudFirstSyncWatchdogV2Installed)return;
  window.__bdsmCloudFirstSyncWatchdogV2Installed=true;
  const META='bdsm-app-last-cloud-sync';
  const CONFIG='bdsm-app-cloud-config';
  const VERIFIED='bdsm-app-first-cloud-sync-verified-v1';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const meta=()=>read(META,{});
  const verified=()=>{const v=read(VERIFIED,{});return v&&v.provider==='supabase'&&!!v.at};
  const freshSupabase=()=>{const m=meta();const t=Date.parse(m.at||0)||0;return m.provider==='supabase'&&!!t&&(Date.now()-t)<10*60*1000};
  let running=false;
  function markVerified(){const m=meta();if(m.provider==='supabase'&&m.at)localStorage.setItem(VERIFIED,JSON.stringify({provider:'supabase',at:m.at,requestId:m.requestId||null}))}
  async function ensure(reason='watchdog',force=false){
    if(running||!navigator.onLine)return false;
    if(!force&&verified()&&freshSupabase())return true;
    const api=window.bdsmCloudSync;if(!api?.push)return false;
    running=true;
    try{const ok=await api.push(reason);if(ok){markVerified();document.dispatchEvent(new CustomEvent('bdsm-cloud-watchdog-check',{detail:{ok:true,reason}}));return true}return false}
    catch(_){return false}finally{running=false}
  }
  function start(){
    const c=read(CONFIG,{});
    if(!c.accountId||!c.syncSecret||!verified())setTimeout(()=>ensure('first-init',true),1200);
    [3500,12000,30000,60000,120000].forEach((ms,i)=>setTimeout(()=>ensure('first-'+(i+1),!verified()),ms));
    window.addEventListener('online',()=>setTimeout(()=>ensure('reconnect',!verified()),1000));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(()=>ensure('visible',!verified()),500)});
    document.addEventListener('bdsm-sync-complete',()=>{markVerified();document.dispatchEvent(new CustomEvent('bdsm-cloud-first-sync-ready'))});
    setInterval(()=>ensure('health',!verified()),10*60*1000);
    window.bdsmFirstCloudSync={force:()=>ensure('manual-force',true),isVerified:verified};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
