(()=>{
  if(window.__bdsmSyncQueueGuardInstalled)return;
  window.__bdsmSyncQueueGuardInstalled=true;

  const OLD_API='https://hook.eu1.make.com/gw8nr0beqtbymtd2xgiga3wn7qfjhp25';
  const NEW_API='https://hook.eu1.make.com/b5wib2471u7oqypl5qrqvmrj33hqwhkc';
  const originalFetch=window.fetch.bind(window);

  try{
    const key='bdsm-app-cloud-config';
    const cloud=JSON.parse(localStorage.getItem(key)||'{}');
    cloud.apiBase=NEW_API;
    cloud.enabled=true;
    localStorage.setItem(key,JSON.stringify(cloud));
    localStorage.removeItem('bdsm-app-sync-paused-v1');
  }catch(_){ }

  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input&&input.url)||'';
    if(url!==OLD_API && url!==NEW_API)return originalFetch(input,init);

    const target=url===OLD_API?NEW_API:url;
    const nextInput=typeof input==='string'?target:new Request(target,input);
    const res=await originalFetch(nextInput,init);

    const txt=document.querySelector('#syncText');
    const dot=document.querySelector('#syncDot');
    if(res.ok){
      if(txt)txt.textContent='Online — synchronizacja v2 działa';
      if(dot)dot.className='sync-dot ok';
    }else if(res.status===400){
      try{localStorage.setItem('bdsm-app-sync-paused-v1',JSON.stringify({reason:'make_queue_full_v2',at:new Date().toISOString()}));}catch(_){ }
      if(txt)txt.textContent='Tryb lokalny — synchronizacja chwilowo niedostępna';
      if(dot)dot.className='sync-dot';
      document.dispatchEvent(new CustomEvent('bdsm-sync-queue-full'));
    }
    return res;
  };

  document.addEventListener('bdsm-sync-queue-full',()=>{
    const btn=document.querySelector('#syncNow');
    if(btn){
      btn.disabled=true;
      btn.title='Synchronizacja spróbuje ponownie później.';
      setTimeout(()=>{btn.disabled=false},60000);
    }
  });
})();
