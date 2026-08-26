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

  function instagramUsername(){
    const profiles=read(PROFILES_KEY,[]);
    const ig=profiles.find(p=>String(p.platform||'').toLowerCase()==='instagram' && p.handle);
    return String(ig?.handle||'').trim().replace(/^@/,'');
  }

  function endpointWithContext(){
    const endpoint=ensureEndpoint();
    try{
      const u=new URL(endpoint,location.href);
      const username=instagramUsername();
      if(username)u.searchParams.set('instagram',username);
      return u.toString();
    }catch{return endpoint;}
  }

  function friendlyMetaMessage(meta={}){
    const raw=String(meta.message||'');
    if(meta.status==='degraded')return raw||'Tryb lokalny — źródła LIVE są chwilowo niedostępne.';
    if(meta.errorCode==='META_REAUTH_REQUIRED' || /HTTP\s*401|API access blocked|OAuthException/i.test(raw)){
      return 'Meta API podłączone, ale dostęp został zablokowany — wymagane ponowne połączenie/autoryzacja Meta.';
    }
    if(meta.errorCode==='META_NOT_CONFIGURED' || /Brak podłączonego API/i.test(raw)){
      return 'Meta API endpoint jest skonfigurowany. Sprawdzanie autoryzacji…';
    }
    if(/Błąd synchronizacji:\s*HTTP\s*502/i.test(raw)){
      return 'Meta API jest podłączone, ale synchronizacja została odrzucona przez Meta.';
    }
    if(/Połączono\s*•\s*0 rekordów/i.test(raw) && meta.errorCode==='META_REAUTH_REQUIRED'){
      return 'Tryb lokalny — Meta wymaga ponownej autoryzacji.';
    }
    return raw;
  }

  function setMeta(patch){
    const prev=read(META_KEY,{status:'idle',lastSync:null,message:'Meta API skonfigurowane'});
    const next={...prev,...patch,configured:true,endpoint:ensureEndpoint()};
    next.message=friendlyMetaMessage(next);
    save(META_KEY,next);
    renderMeta(next);
    return next;
  }

  function renderMeta(meta=read(META_KEY,{})){
    const dot=document.getElementById('socialSyncDot');
    const msg=document.getElementById('socialSyncMessage');
    const last=document.getElementById('socialLastSync');
    const display=friendlyMetaMessage(meta);
    if(dot)dot.className='social-sync-dot '+(meta.status==='ok'?'ok':meta.status==='syncing'||meta.status==='degraded'?'wait':meta.status==='error'?'err':'');
    if(msg)msg.textContent=display||'Meta API skonfigurowane';
    if(last){
      const text=meta.lastSync?new Date(meta.lastSync).toLocaleString('pl-PL'):'brak poprawnej synchronizacji';
      last.textContent='Ostatnia poprawna aktualizacja: '+text;
    }
  }

  function mergeData(data){
    if(Array.isArray(data.items) && data.items.length){
      const existing=read(QUEUE_KEY,[]);
      const map=new Map(existing.map(x=>[String(x.externalId||x.id),x]));
      data.items.forEach(x=>map.set(String(x.externalId||x.id),{...map.get(String(x.externalId||x.id)),...x}));
      save(QUEUE_KEY,[...map.values()]);
    }
    if(Array.isArray(data.profiles) && data.profiles.length){
      const existing=read(PROFILES_KEY,[]);
      const key=p=>String(p.externalId||`${p.platform||''}|${p.handle||''}`).toLowerCase();
      const map=new Map(existing.map(p=>[key(p),p]));
      data.profiles.forEach(p=>map.set(key(p),{...map.get(key(p)),...p}));
      save(PROFILES_KEY,[...map.values()]);
    }
  }

  function sourceSummary(data){
    const ig=data?.sources?.instagram||[];
    const fb=data?.sources?.facebook||[];
    const igLive=ig.find(x=>x.ok);
    const fbLive=fb.find(x=>x.ok);
    if(data?.fallback==='local-cache')return data.message||'Tryb lokalny — zachowano ostatnie dane.';
    if(data?.fallback==='apify')return `Instagram LIVE przez Apify${fbLive?' • Facebook LIVE przez Meta':' • Facebook w trybie lokalnym'}`;
    if(igLive&&fbLive)return 'Instagram + Facebook LIVE przez Meta';
    if(igLive)return 'Instagram LIVE • Facebook w trybie lokalnym';
    if(fbLive)return 'Facebook LIVE • Instagram w trybie lokalnym';
    return data?.message||'Tryb lokalny — brak źródeł LIVE';
  }

  async function sync({silent=false}={}){
    if(busy)return false;
    busy=true;
    setMeta({status:'syncing',message:'Łączenie: Meta → Apify → dane lokalne…'});
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),25000);
      const r=await fetch(endpointWithContext(),{headers:{Accept:'application/json'},signal:controller.signal});
      clearTimeout(timer);
      const data=await r.json().catch(()=>({}));
      if(!r.ok || data?.ok===false){
        const message=data?.message||data?.error||`Błąd synchronizacji (HTTP ${r.status})`;
        setMeta({status:'error',message,lastAttempt:Date.now(),lastErrorAt:Date.now(),errorCode:data?.code||`HTTP_${r.status}`});
        if(!silent)toast?.(message);
        return false;
      }

      mergeData(data);
      if(data.degraded){
        const hasLiveProfiles=Array.isArray(data.profiles)&&data.profiles.length>0;
        setMeta({
          status:'degraded',
          message:sourceSummary(data),
          lastSync:hasLiveProfiles?Date.now():read(META_KEY,{}).lastSync||null,
          lastAttempt:Date.now(),
          errorCode:data.code||'SOCIAL_DEGRADED',
          sources:data.sources||null,
          fallback:data.fallback||'local-cache'
        });
        document.dispatchEvent(new CustomEvent('aii:social-changed'));
        if(!silent)toast?.(hasLiveProfiles?'Synchronizacja częściowa — użyto fallbacku':'Źródła LIVE niedostępne — zachowano ostatnie dane lokalne');
        return true;
      }

      setMeta({status:'ok',lastSync:Date.now(),lastAttempt:Date.now(),message:sourceSummary(data),errorCode:null,sources:data.sources||null,fallback:null});
      document.dispatchEvent(new CustomEvent('aii:social-changed'));
      if(!silent)toast?.('Social Media zsynchronizowane');
      return true;
    }catch(err){
      const message=err?.name==='AbortError'?'Synchronizacja LIVE przekroczyła 25 sekund — zachowano dane lokalne.':`Błąd połączenia ze źródłami LIVE: ${err?.message||err}`;
      setMeta({status:'degraded',message,lastAttempt:Date.now(),errorCode:err?.name||'NETWORK_ERROR',fallback:'local-cache'});
      if(!silent)toast?.('Tryb lokalny — dane w aplikacji pozostają dostępne');
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
    const raw=String(meta.message||'');
    const legacy=/Brak podłączonego API|Błąd synchronizacji:\s*HTTP\s*(401|502)|API access blocked|OAuthException|Połączono\s*•\s*0 rekordów/i.test(raw);
    if(legacy){
      const reauth=/401|access blocked|OAuthException/i.test(raw) || meta.errorCode==='META_REAUTH_REQUIRED';
      const next={...meta,
        status:'degraded',
        message:reauth?'Meta wymaga ponownej autoryzacji — aplikacja działa na ostatnich danych lokalnych.':'Sprawdzanie źródeł LIVE — dane lokalne pozostają dostępne.',
        errorCode:reauth?'META_REAUTH_REQUIRED':meta.errorCode||'SOCIAL_DEGRADED',
        fallback:'local-cache',
        configured:true,
        endpoint:ensureEndpoint()
      };
      save(META_KEY,next);
      renderMeta(next);
    }else renderMeta(meta);
  }

  function init(){ensureEndpoint();bindButton();repairLegacyMessage();}

  document.addEventListener('DOMContentLoaded',()=>{
    init();
    const root=document.getElementById('content');
    if(root)new MutationObserver(()=>setTimeout(()=>{bindButton();repairLegacyMessage();},30)).observe(root,{childList:true,subtree:true});
    setTimeout(()=>sync({silent:true}),800);
    setInterval(()=>repairLegacyMessage(),1200);
    setInterval(()=>{if(navigator.onLine!==false)sync({silent:true});},60000);
  });

  window.AIISocialSync={sync,ensureEndpoint,repairLegacyMessage,endpointWithContext};
})();