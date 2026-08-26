(() => {
  const ENDPOINT_KEY='aii-social-sync-endpoint';
  const DEFAULT_ENDPOINT='https://ai-influencer-studio-api.vercel.app/api/social-sync';
  const AUTH_START='https://ai-influencer-studio-api.vercel.app/api/meta-auth-start';
  const AUTH_STATUS='https://ai-influencer-studio-api.vercel.app/api/meta-auth-status';
  const CALLBACK='https://ai-influencer-studio-api.vercel.app/api/meta-auth-callback';
  const META_DEVELOPERS='https://developers.facebook.com/apps/';
  const VERCEL_SETTINGS='https://vercel.com/karolciagleinert-9043/ai-influencer-studio-api/settings/environment-variables';
  const q=(s,r=document)=>r.querySelector(s);
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const toast=t=>window.showToast?window.showToast(t):alert(t);
  let authStatus=null;

  const style=document.createElement('style');
  style.textContent=`
    .meta-setup{margin:12px 0 16px;padding:16px;border:1px solid #eadffb;border-radius:14px;background:#fcfaff}
    .meta-setup-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
    .meta-setup-head b{display:block;font-size:11px}.meta-setup-head span{display:block;margin-top:4px;font-size:8px;color:#777f8d}
    .meta-setup-badge{display:inline-flex;padding:5px 8px;border-radius:999px;background:#fff0f0;color:#a83d3d;font-size:7px;font-weight:900;white-space:nowrap}
    .meta-setup-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}
    .meta-setup-card{padding:11px;border:1px solid #ece7f5;border-radius:11px;background:#fff}
    .meta-setup-card b{display:block;font-size:9px;margin-bottom:5px}.meta-setup-card code{display:block;font-size:8px;line-height:1.6;white-space:normal;word-break:break-word;color:#5d6170}
    .meta-callback{margin-top:10px;padding:10px;border:1px dashed #d9c9f3;border-radius:10px;background:#fff;font-size:8px;word-break:break-all}
    .meta-setup-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
    @media(max-width:750px){.meta-setup-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  async function copyText(text,label='Skopiowano'){
    try{await navigator.clipboard.writeText(text);toast(label)}
    catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();toast(label)}
  }

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

  function setupHtml(status){
    const igMissing=status?.instagram?.missing||[];
    const fbMissing=status?.facebook?.missing||[];
    const igReady=Boolean(status?.instagram?.ready);
    const fbReady=Boolean(status?.facebook?.ready);
    if(igReady||fbReady)return '';
    const igVars=igMissing.length?igMissing:['META_INSTAGRAM_APP_ID','META_INSTAGRAM_APP_SECRET'];
    const fbVars=fbMissing.length?fbMissing:['META_FACEBOOK_APP_ID','META_FACEBOOK_APP_SECRET'];
    return `<section class="meta-setup" id="metaSetupPanel">
      <div class="meta-setup-head"><div><b>Konfiguracja Meta OAuth</b><span>Synchronizacja działa w trybie lokalnym, dopóki nie skonfigurujesz jednego z poniższych trybów.</span></div><span class="meta-setup-badge">WYMAGA KONFIGURACJI</span></div>
      <div class="meta-setup-grid">
        <div class="meta-setup-card"><b>Instagram Login — rekomendowane</b><code>${igVars.join('<br>')}</code></div>
        <div class="meta-setup-card"><b>Facebook Login — opcjonalne</b><code>${fbVars.join('<br>')}</code></div>
      </div>
      <div class="meta-callback"><b>OAuth Redirect URI / Callback:</b><br>${CALLBACK}</div>
      <div class="meta-setup-actions">
        <button class="primary" type="button" id="metaCopyCallback">Kopiuj callback</button>
        <button class="ghost" type="button" id="metaCopyVars">Kopiuj nazwy zmiennych</button>
        <button class="ghost" type="button" id="metaCheckAgain">Sprawdź ponownie</button>
        <button class="ghost" type="button" id="metaOpenDevelopers">Meta Developers ↗</button>
        <button class="ghost" type="button" id="metaOpenVercel">Vercel Variables ↗</button>
      </div>
    </section>`;
  }

  async function renderSetupPanel(status){
    const syncPanel=q('.social-sync-panel');
    if(!syncPanel)return;
    q('#metaSetupPanel')?.remove();
    const html=setupHtml(status);
    if(!html)return;
    syncPanel.insertAdjacentHTML('afterend',html);
    q('#metaCopyCallback')?.addEventListener('click',()=>copyText(CALLBACK,'Callback Meta skopiowany'));
    q('#metaCopyVars')?.addEventListener('click',()=>copyText('META_INSTAGRAM_APP_ID\nMETA_INSTAGRAM_APP_SECRET\nMETA_FRONTEND_URL=https://ai-influencer-studio-api.vercel.app/','Nazwy zmiennych skopiowane'));
    q('#metaOpenDevelopers')?.addEventListener('click',()=>window.open(META_DEVELOPERS,'_blank','noopener'));
    q('#metaOpenVercel')?.addEventListener('click',()=>window.open(VERCEL_SETTINGS,'_blank','noopener'));
    q('#metaCheckAgain')?.addEventListener('click',async e=>{
      const b=e.currentTarget;b.disabled=true;b.textContent='Sprawdzam…';authStatus=null;
      const next=await loadAuthStatus();await injectButtons(true);await renderSetupPanel(next);
      toast(next?.ready?'Meta OAuth jest gotowy':'Konfiguracja Meta nadal niekompletna');
    });
  }

  async function injectButtons(force=false){
    const panel=q('.social-sync-panel');
    if(!panel)return;
    if(force)q('#metaReauthWrap')?.remove();
    if(q('#metaReauthWrap'))return;

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
    if(status?.instagram?.ready&&status?.facebook?.ready){
      const fb=document.createElement('button');
      fb.className='ghost';fb.type='button';fb.textContent='Połącz przez Facebook';fb.title='Facebook Login for Business';fb.onclick=()=>connect('facebook');wrap.appendChild(fb);
    }
    await renderSetupPanel(status);
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
    if(root)new MutationObserver(()=>setTimeout(()=>injectButtons(),0)).observe(root,{childList:true,subtree:true});
    setTimeout(()=>injectButtons(),200);
  });

  window.AIIMetaReauth={sync:syncSession,connect,check:loadAuthStatus,callback:CALLBACK};
})();