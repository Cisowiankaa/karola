(() => {
  const ENDPOINT_KEY='aii-social-sync-endpoint';
  const META_KEY='aii-social-sync-meta';
  const DEFAULT_ENDPOINT='https://ai-influencer-studio-api.vercel.app/api/social-sync';
  const QUEUE_KEY='aii-social-queue';
  const PROFILES_KEY='aii-social-profiles';
  let busy=false;

  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const toast=t=>window.showToast?window.showToast(t):null;

  function ensureEndpoint(){
    const current=(localStorage.getItem(ENDPOINT_KEY)||'').trim();
    if(!current)localStorage.setItem(ENDPOINT_KEY,DEFAULT_ENDPOINT);
    return localStorage.getItem(ENDPOINT_KEY)||DEFAULT_ENDPOINT;
  }

  function setMeta(patch){
    const prev=read(META_KEY,{status:'idle',lastSync:null,message:'Meta API skonfigurowane'});
    const next={...prev,...patch,configured:true,endpoint:ensureEndpoint()};
    save(META_KEY,next);
    renderMeta(next);
    return next;
  }

  function renderMeta(meta=read(META_KEY,{})){
    const dot=document.getElementById('socialSyncDot');
    const msg=document.getElementById('socialSyncMessage');
    const last=document.getElementById('socialLastSync');
    if(dot)dot.className='social-sync-dot '+(meta.status==='ok'?'ok':meta.status==='syncing'?'wait':meta.status==='error'?'err':'');
    if(msg)msg.textContent=meta.message||'';
    if(last){
      const text=meta.lastSync?new Date(meta.lastSync).toLocaleString('pl-PL'):'brak poprawnej synchronizacji';
      last.textContent='Ostatnia poprawna aktualizacja: '+text;
    }
  }

  function mergeData(data){
    if(Array.isArray(data.items)){
      const existing=read(QUEUE_KEY,[]);
      const map=new Map(existing.map(x=>[String(x.externalId||x.id),x]));
      data.items.forEach(x=>map.set(String(x.externalId||x.id),{...map.get(String(x.externalId||x.id)),...x}));
      save(QUEUE_KEY,[...map.values()]);
    }
    if(Array.isArray(data.profiles)&&data.profiles.length)save(PROFILES_KEY,data.profiles);
  }

  function friendlyError(data,status){
    if(data?.code==='META_REAUTH_REQUIRED' || data?.metaType==='OAuthException' || /access blocked/i.test(String(data?.error||''))){
      return 'Meta API podłączone, ale dostęp został zablokowany — wymagane ponowne połączenie Meta.';
    }
    if(data?.code==='META_NOT_CONFIGURED')return 'Meta API nie jest jeszcze skonfigurowane na serwerze.';
    return data?.message || data?.error || `Błąd synchronizacji Meta (HTTP ${status})`;
  }

  async function sync({silent=false}={}){
    if(busy)return false;
    busy=true;
    const endpoint=ensureEndpoint();
    setMeta({status:'syncing',message:'Łączenie z Meta API…'});
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),20000);
      const r=await fetch(endpoint,{headers:{Accept:'application/json'},signal:controller.signal});
      clearTimeout(timer);
      const data=await r.json().catch(()=>({}));
      if(!r.ok || data?.ok===false){
        const message=friendlyError(data,r.status);
        setMeta({status:'error',message,lastErrorAt:Date.now(),errorCode:data?.code||`HTTP_${r.status}`});
        if(!silent)toast?.(message);
        return false;
      }
      mergeData(data);
      setMeta({status:'ok',lastSync:Date.now(),message:`Meta LIVE • ${Array.isArray(data.items)?data.items.length:0} rekordów`,errorCode:null});
      document.dispatchEvent(new CustomEvent('aii:social-changed'));
      if(!silent)toast?.('Social Media zsynchronizowane');
      return true;
    }catch(err){
      const message=err?.name==='AbortError'?'Meta API nie odpowiedziało w ciągu 20 sekund.':`Błąd połączenia z Meta API: ${err?.message||err}`;
      setMeta({status:'error',message,lastErrorAt:Date.now(),errorCode:err?.name||'NETWORK_ERROR'});
      if(!silent)toast?.(message);
      return false;
    }finally{busy=false;}
  }

  function bindButton(){
    const btn=document.getElementById('socialSyncNow');
    if(!btn||btn.dataset.resilientSync==='1')return;
    btn.dataset.resilientSync='1';
    btn.addEventListener('click',e=>{
      e.preventDefault();
      e.stopImmediatePropagation();
      sync({silent:false});
    },true);
    renderMeta();
  }

  function repairLegacyMessage(){
    const meta=read(META_KEY,{});
    const legacy=/Brak podłączonego API|Błąd synchronizacji:\s*HTTP\s*(401|502)/i.test(String(meta.message||''));
    if(legacy){
      setMeta({status:'error',message:'Meta API jest podłączone. Trwa sprawdzanie autoryzacji…'});
      sync({silent:true});
    }else renderMeta(meta);
  }

  function init(){
    ensureEndpoint();
    bindButton();
    repairLegacyMessage();
  }

  document.addEventListener('DOMContentLoaded',()=>{
    init();
    const root=document.getElementById('content');
    if(root)new MutationObserver(()=>setTimeout(()=>{bindButton();renderMeta();},30)).observe(root,{childList:true,subtree:true});
    setTimeout(()=>sync({silent:true}),800);
    setInterval(()=>{if(navigator.onLine!==false)sync({silent:true});},60000);
  });

  window.AIISocialSync={sync,ensureEndpoint};
})();