(() => {
  const TOKEN_KEY='aii-meta-access-token';
  const USER_KEY='aii-meta-ig-user-id';
  const ENDPOINT_KEY='aii-social-sync-endpoint';
  const DEFAULT_ENDPOINT='https://ai-influencer-studio-api.vercel.app/api/social-sync';
  const AUTH_START='https://ai-influencer-studio-api.vercel.app/api/meta-auth-start';
  const q=(s,r=document)=>r.querySelector(s);
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const toast=t=>window.showToast?window.showToast(t):alert(t);

  function acceptCallback(){
    const h=new URLSearchParams(location.hash.replace(/^#/,''));
    const token=h.get('meta_token'),userId=h.get('meta_user_id');
    if(!token)return;
    localStorage.setItem(TOKEN_KEY,token);
    if(userId)localStorage.setItem(USER_KEY,userId);
    localStorage.setItem(ENDPOINT_KEY,DEFAULT_ENDPOINT);
    history.replaceState(null,'',location.pathname+location.search);
    localStorage.setItem('aii-social-sync-meta',JSON.stringify({status:'idle',lastSync:null,message:'Meta połączone ponownie — gotowe do synchronizacji'}));
    setTimeout(()=>{toast('Meta połączone ponownie');document.querySelector('.nav-item[data-view="social"]')?.click();setTimeout(syncAuthorized,350);},150);
  }

  function injectButton(){
    const panel=q('.social-sync-panel'); if(!panel||q('#metaReauthBtn'))return;
    const b=document.createElement('button');
    b.id='metaReauthBtn'; b.className='primary'; b.type='button'; b.textContent='Połącz ponownie Meta';
    b.onclick=()=>{location.href=AUTH_START};
    panel.appendChild(b);
  }

  async function syncAuthorized(){
    const token=localStorage.getItem(TOKEN_KEY)||'';
    if(!token)return false;
    const endpoint=localStorage.getItem(ENDPOINT_KEY)||DEFAULT_ENDPOINT;
    const headers={Accept:'application/json',Authorization:`Bearer ${token}`};
    const userId=localStorage.getItem(USER_KEY)||'';
    if(userId)headers['X-Meta-Ig-User-Id']=userId;
    try{
      const r=await fetch(endpoint,{headers});
      const data=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(data.message||data.error||`HTTP ${r.status}`);
      if(Array.isArray(data.items)){
        const existing=read('aii-social-queue',[]),map=new Map(existing.map(x=>[String(x.externalId||x.id),x]));
        data.items.forEach(x=>map.set(String(x.externalId||x.id),{...map.get(String(x.externalId||x.id)),...x}));
        save('aii-social-queue',[...map.values()]);
      }
      if(Array.isArray(data.profiles))save('aii-social-profiles',data.profiles);
      save('aii-social-sync-meta',{status:'ok',lastSync:Date.now(),message:`Połączono Meta • ${Array.isArray(data.items)?data.items.length:0} rekordów`});
      toast('Social Media zsynchronizowane');
      document.querySelector('.nav-item[data-view="social"]')?.click();
      return true;
    }catch(e){
      save('aii-social-sync-meta',{status:'error',lastSync:null,message:`Błąd Meta: ${e.message||e}`});
      toast('Ponowna autoryzacja Meta jest nadal wymagana');
      return false;
    }
  }

  document.addEventListener('click',e=>{
    const b=e.target.closest?.('#socialSyncNow');
    if(!b||!localStorage.getItem(TOKEN_KEY))return;
    e.preventDefault();e.stopImmediatePropagation();syncAuthorized();
  },true);

  document.addEventListener('DOMContentLoaded',()=>{
    acceptCallback();
    const root=q('#content');if(root)new MutationObserver(()=>setTimeout(injectButton,0)).observe(root,{childList:true,subtree:true});
    setTimeout(injectButton,200);
  });
  window.AIIMetaReauth={sync:syncAuthorized,connect:()=>{location.href=AUTH_START}};
})();