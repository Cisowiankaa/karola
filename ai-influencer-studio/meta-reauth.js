(() => {
  const ENDPOINT_KEY='aii-social-sync-endpoint';
  const DEFAULT_ENDPOINT='https://ai-influencer-studio-api.vercel.app/api/social-sync';
  const AUTH_START='https://ai-influencer-studio-api.vercel.app/api/meta-auth-start';
  const q=(s,r=document)=>r.querySelector(s);
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const toast=t=>window.showToast?window.showToast(t):alert(t);

  function acceptCallback(){
    const u=new URL(location.href);
    if(u.searchParams.get('meta_connected')!=='1')return;

    // Remove legacy client-side Meta credentials. OAuth session now lives only in HttpOnly cookies.
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

  function injectButton(){
    const panel=q('.social-sync-panel');
    if(!panel||q('#metaReauthBtn'))return;
    const b=document.createElement('button');
    b.id='metaReauthBtn';
    b.className='primary';
    b.type='button';
    b.textContent='Połącz ponownie Meta';
    b.title='Otwórz bezpieczną autoryzację Instagram/Meta';
    b.onclick=()=>{location.href=AUTH_START};
    panel.appendChild(b);
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
        save('aii-social-sync-meta',{
          status:'degraded',
          lastSync:null,
          lastAttempt:Date.now(),
          message:data.message||'Meta nadal wymaga autoryzacji — używane są dane lokalne.',
          errorCode:data.code||'SOCIAL_DEGRADED',
          fallback:data.fallback||'local-cache'
        });
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
    if(root)new MutationObserver(()=>setTimeout(injectButton,0)).observe(root,{childList:true,subtree:true});
    setTimeout(injectButton,200);
  });

  window.AIIMetaReauth={sync:syncSession,connect:()=>{location.href=AUTH_START}};
})();