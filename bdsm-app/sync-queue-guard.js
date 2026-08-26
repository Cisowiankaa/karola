(()=>{
  if(window.__bdsmSyncQueueGuardInstalled)return;
  window.__bdsmSyncQueueGuardInstalled=true;
  const API='https://hook.eu1.make.com/gw8nr0beqtbymtd2xgiga3wn7qfjhp25';
  const originalFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input&&input.url)||'';
    if(url!==API)return originalFetch(input,init);
    const res=await originalFetch(input,init);
    if(res.status===400){
      try{localStorage.setItem('bdsm-app-sync-paused-v1',JSON.stringify({reason:'make_queue_full',at:new Date().toISOString()}));}catch(_){ }
      const txt=document.querySelector('#syncText');
      const dot=document.querySelector('#syncDot');
      if(txt)txt.textContent='Tryb lokalny — kolejka synchronizacji Make jest pełna';
      if(dot)dot.className='sync-dot';
      document.dispatchEvent(new CustomEvent('bdsm-sync-queue-full'));
    }
    return res;
  };
  document.addEventListener('bdsm-sync-queue-full',()=>{
    const btn=document.querySelector('#syncNow');
    if(btn){
      btn.disabled=true;
      btn.title='Synchronizacja zostanie ponownie włączona po opróżnieniu kolejki Make.';
      setTimeout(()=>{btn.disabled=false},60000);
    }
  });
})();
