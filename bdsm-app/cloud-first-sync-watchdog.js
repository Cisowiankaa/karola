(()=>{
  if(window.__bdsmCloudFirstSyncWatchdogV3Installed)return;
  window.__bdsmCloudFirstSyncWatchdogV3Installed=true;
  const META='bdsm-app-last-cloud-sync';
  const CONFIG='bdsm-app-cloud-config';
  const VERIFIED='bdsm-app-first-cloud-sync-verified-v1';
  const STATE='bdsm-app-first-cloud-sync-state-v1';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const meta=()=>read(META,{});
  const verified=()=>{const v=read(VERIFIED,{});return v?.provider==='supabase'&&!!v.at&&v.roundTrip===true};
  const fresh=()=>{const m=meta(),t=Date.parse(m.at||0)||0;return m.provider==='supabase'&&t>0&&(Date.now()-t)<10*60*1000};
  let running=false;
  function state(status,reason,error=null){write(STATE,{status,reason,error,at:new Date().toISOString()});document.dispatchEvent(new CustomEvent('bdsm-cloud-watchdog-check',{detail:{status,reason,error}}));}
  function markVerified(reason){const m=meta();write(VERIFIED,{provider:'supabase',at:m.at||new Date().toISOString(),requestId:m.requestId||null,roundTrip:true,reason});state('verified',reason);document.dispatchEvent(new CustomEvent('bdsm-cloud-first-sync-ready'));}
  async function ensure(reason='watchdog',force=false){
    if(running||!navigator.onLine)return false;
    if(!force&&verified()&&fresh())return true;
    const api=window.bdsmCloudSync;if(!api?.push||!api?.pull){state('waiting-api',reason);return false;}
    running=true;state('checking',reason);
    try{
      const pushed=await api.push('verify-'+reason);
      if(!pushed){state('push-failed',reason);return false;}
      const pulled=await api.pull(true);
      if(!pulled){state('pull-failed',reason);return false;}
      markVerified(reason);return true;
    }catch(e){state('error',reason,String(e?.message||e));return false;}finally{running=false;}
  }
  function start(){
    const c=read(CONFIG,{});
    if(!c.accountId||!c.syncSecret||!verified())setTimeout(()=>ensure('first-init',true),1400);
    [4000,12000,30000,60000,120000,240000].forEach((ms,i)=>setTimeout(()=>ensure('retry-'+(i+1),!verified()),ms));
    window.addEventListener('online',()=>setTimeout(()=>ensure('reconnect',!verified()),1000));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(()=>ensure('visible',!verified()),700)});
    document.addEventListener('bdsm-sync-complete',()=>{if(!verified())setTimeout(()=>ensure('after-sync',true),500)});
    setInterval(()=>ensure('health',!verified()),10*60*1000);
    window.bdsmFirstCloudSync={force:()=>ensure('manual-force',true),isVerified:verified,getState:()=>read(STATE,{status:'unknown'})};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
