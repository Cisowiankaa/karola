(() => {
  const ENDPOINT_KEY='aii-social-sync-endpoint';
  const DEFAULT_ENDPOINT='https://ai-influencer-studio-api.vercel.app/api/social-sync';
  const AUTH_START='https://ai-influencer-studio-api.vercel.app/api/meta-auth-start';
  const AUTH_STATUS='https://ai-influencer-studio-api.vercel.app/api/meta-auth-status';
  const q=(s,r=document)=>r.querySelector(s);
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const toast=t=>window.showToast?window.showToast(t):alert(t);
  let authStatus=null;

  async function loadAuthStatus(){
    try{
      const r=await fetch(AUTH_STATUS,{headers:{Accept:'application/json'},credentials:'include',cache:'no-store'});
      const data=await r.json().catch(()=>({}));
      authStatus=r.ok?data:{ready:false};
      return authStatus;
    }catch{
      authStatus={ready:false};
      return authStatus;
    }
  }

  function acceptCallback(){
    const u=new URL(location.href);
    if(u.searchParams.get('meta_connected')!=='1')return;
    localStorage.removeItem('aii-meta-access-token');
    localStorage.removeItem('aii-meta-ig-user-id');
    localStorage.setItem(ENDPOINT_KEY,DEFAULT_ENDPOINT);
    save('aii-social-sync-meta',{status:'idle',lastSync:null,message:'Meta połączone ponownie — sprawdzanie danych LIVE'});
    u.searchParams.delete('meta_connected');
    history.replaceState(null,'',u.pathname+(u.searchParams.toString()?`?${u.searchParams}`:'')+u.hash);
    setTimeout(()=>{
      toast('Meta połączone ponownie');
      document.querySelector('.nav-item[data-view="social"]')?.click();
      setTimeout(syncSession,300);
    },120);
  }

  function missingText(status){
    const ig=(status?.instagram?.missing||[]).join(', ');
    const fb=(status?.facebook?.missing||[]).join(', ');
    if(ig&&fb)return `Instagram: ${ig}. Facebook: ${fb}.`;
    return ig||fb||'Brak wymaganej konfiguracji OAuth Meta.';
  }

  async function connect(mode){
    const status=authStatus||await loadAuthStatus();
    const cfg=mode==='facebook'?status.facebook:status.instagram;
    if(!cfg?.ready){
      toast(`OAuth ${mode==='facebook'?'Facebook':'Instagram'} nie jest gotowy — ${missingText(status)}`);
      return false;
    }
    location.href=`${AUTH_START}?mode=${encodeURIComponent(mode)}`;
    return true;
  }

  async function injectButtons(){
    const panel=q('.social-sync-panel');
    if(!panel||q('#metaReauthWrap'))return;

    const wrap=document.createElement('div');
    wrap.id='metaReauthWrap';
    wrap.style.display='flex';
    wrap.style.gap='8px';
    wrap.style.flexWrap='wrap';
    wrap.innerHTML='<button id="metaInstagramBtn" class="primary" type="button" disabled>Sprawdzam Meta…</button>';
    panel.appendChild(wrap);

    const status=await loadAuthStatus();
    const ig=q('#metaInstagramBtn');
    if(status?.instagram?.ready){
      ig.disabled=false;
      ig.textContent='Połącz Instagram';
      ig.title='Instagram API with Instagram Login';
      ig.onclick=()=>connect('instagram');
    }else if(status?.facebook?.ready){
      ig.disabled=false;
      ig.textContent='Połącz Facebook + Instagram';
      ig.title='Instagram API with Facebook Login';
      ig.onclick=()=>connect('facebook');
    }else{
      ig.disabled=false;
      ig.textContent='Meta: dokończ konfigurację';
      ig.title=missingText(status);
      ig.onclick=()=>toast(`Brak konfiguracji OAuth. ${missingText(status)}`);
    }

    if(status?.instagram?.ready && status?.facebook?.ready){
      const fb=document.createElement('button');
      fb.className='ghost';
      fb.type='button';
      fb.textContent='Połącz przez Facebook';
      fb.title='Facebook Login for Business';
      fb.onclick=()=>connect('facebook');
      wrap.appendChild(fb);
    }
  }

  function endpointWithContext(){
    const endpoint=localStorage.getItem(ENDPOINT_KEY)||DEFAULT_ENDPOINT;
    const profiles=read('aii-social-profiles',[]);
    const ig=profiles.find(p=>String(p.platform||'').toLowerCase()==='instagram'&&p.handle);
    try{
      const u=new URL(endpoint,location.href);
      const username=String(ig?.handle||'').replace(/^@/,'').trim();
      if(username)u.searchParams.set('instagram',username);
      return u.toString();
    }catch{return endpoint;}
  }

  async function syncSession(){
    try{
      const r=await fetch(endpointWithContext(),{headers:{Accept:'application/json'},credentials:'include'});
      const data=await r.json().catch(()=>({}));
      if(!r.ok||data?.ok===false)throw new Error(data.message||data.error||`HTTP ${r.status}`);
      if(data.degraded){
        save('aii-social-sync-meta',{status:'degraded',lastSync:null,lastAttempt:Date.now(),message:data.message||'Meta nadal wymaga autoryzacji — używane są dane lokalne.',errorCode:data.code||'SOCIAL_DEGRADED',fallback:data.fallback||'local-cache'});
        toast('Meta nie zwróciło jeszcze danych LIVE — aplikacja działa lokalnie');
        document.querySelector('.nav-item[data-view="social"]')?.click();
        return false;
      }
      if(Array.isArray(data.items)&&data.items.length){
        const existing=read('aii-social-queue',[]),map=new Map(existing.map(x=>[String(x.externalId||x.id),x]));
        data.items.forEach(x=>map.set(String(x.externalId||x.id),{...map.get(String(x.externalId||x.id)),...x}));
        save('aii-social-queue',[...map.values()]);
      }
      if(Array.isArray(data.profiles)&&data.profiles.length)save('aii-social-profiles',data.profiles);
      save('aii-social-sync-meta',{status:'ok',lastSync:Date.now(),message:`Meta LIVE • ${Array.isArray(data.items)?data.items.length:0} rekordów`});
      toast('Social Media zsynchronizowane');
      document.querySelector('.nav-item[data-view="social"]')?.click();
      return true;
    }catch(e){
      save('aii-social-sync-meta',{status:'degraded',lastSync:null,lastAttempt:Date.now(),message:`Meta niedostępne — zachowano dane lokalne. ${e.message||e}`,fallback:'local-cache'});
      toast('Meta nadal wymaga ponownej autoryzacji');
      return false;
    }
  }

  document.addEventListener('DOMContentLoaded',()=>{
    acceptCallback();
    const root=q('#content');
    if(root)new MutationObserver(()=>setTimeout(injectButtons,0)).observe(root,{childList:true,subtree:true});
    setTimeout(injectButtons,200);
  });

  window.AIIMetaReauth={sync:syncSession,connect,check:loadAuthStatus};
})();