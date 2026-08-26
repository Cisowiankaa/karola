(() => {
  function safeMode(){
    try{
      const saved=localStorage.getItem('aii-mode');
      if(!navigator.onLine)return 'offline';
      if(saved==='offline'||saved==='online-local')return saved;
      const aiOk=window.AII_RUNTIME_HEALTH?.ai?.ok===true;
      return aiOk?'online-ai':'online-local';
    }catch{return navigator.onLine?'online-local':'offline';}
  }
  function apply(){
    const next=safeMode();
    try{localStorage.setItem('aii-mode',next)}catch{}
    try{if(typeof runtime!=='undefined'&&runtime)runtime.mode=next}catch{}
    const el=document.getElementById('systemStatus');
    if(el&&!el.dataset.detectedMode){
      el.textContent=next==='offline'?'● OFFLINE':next==='online-ai'?'● ONLINE + AI':'● ONLINE bez AI';
      el.dataset.detectedMode=next;
    }
    try{if(typeof updateStatus==='function'&&!window.AII_RUNTIME_HEALTH)updateStatus()}catch{}
  }
  apply();
  document.addEventListener('DOMContentLoaded',apply);
  window.addEventListener('offline',apply);
  window.addEventListener('online',()=>setTimeout(apply,50));
  document.addEventListener('aii:runtime-detected',apply);
  window.AIISafeRuntimeDefault={apply,safeMode};
})();