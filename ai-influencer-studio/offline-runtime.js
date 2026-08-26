(() => {
  const toast=t=>window.showToast?.(t);
  const KEY='aii-offline-runtime';
  const CLOUD='aii-cloud-sync-status';
  const PENDING='aii-cloud-sync-pending';
  const BACKUP='aii-cloud-sync-last-backup';
  const CLOUD_API='/api/cloud-sync';
  const BLOCK=/(token|secret|password|api[-_]?key|access[-_]?token|endpoint|webhook|authorization)/i;
  const SKIP=new Set([KEY,CLOUD,PENDING,BACKUP,'aii-mode','aii-runtime-status']);
  let baseline='';
  let pushTimer=null;

  const readJson=(k,d={})=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const saveJson=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
  const allowedKey=k=>String(k||'').startsWith('aii-')&&!BLOCK.test(k)&&!SKIP.has(k);
  const cloudState=()=>readJson(CLOUD,{});
  const setCloud=extra=>{const next={...cloudState(),...extra,checkedAt:new Date().toISOString()};saveJson(CLOUD,next);renderCloudCard();return next};

  function writeState(extra={}){const state={online:navigator.onLine,updatedAt:new Date().toISOString(),...extra};saveJson(KEY,state);return state}

  function safeData(){
    const data={};
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);if(!allowedKey(k))continue;
      const v=localStorage.getItem(k);if(v!==null)data[k]=v;
    }
    return data;
  }
  function fingerprint(data=safeData()){
    const s=JSON.stringify(data);let h=2166136261;
    for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
    return (h>>>0).toString(16);
  }
  function snapshot(){return {version:1,updatedAt:new Date().toISOString(),deviceId:deviceId(),data:safeData()}}
  function deviceId(){let id=localStorage.getItem('aii-device-id');if(!id){id=(crypto?.randomUUID?.()||`device-${Date.now()}-${Math.random().toString(36).slice(2)}`);localStorage.setItem('aii-device-id',id)}return id}
  function localDataCount(){return Object.keys(safeData()).length}
  function pending(){return readJson(PENDING,null)}
  function queueSnapshot(s=snapshot()){saveJson(PENDING,s);setCloud({pending:true,pendingAt:s.updatedAt});return s}

  async function postCloud(body){
    const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),10000);
    try{
      const r=await fetch(CLOUD_API,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(body),cache:'no-store',credentials:'same-origin',signal:ctrl.signal});
      const data=await r.json().catch(()=>({}));
      if(!r.ok||data?.ok===false){const e=new Error(data?.message||`Cloud Sync HTTP ${r.status}`);e.code=data?.code||`HTTP_${r.status}`;throw e}
      return data;
    }finally{clearTimeout(timer)}
  }

  async function cloudStatus(){
    if(!navigator.onLine){setCloud({configured:false,available:false,mode:'offline'});return cloudState()}
    try{
      const data=await postCloud({action:'status'});
      const st=setCloud({configured:Boolean(data.configured),available:true,provider:data.provider||'local-only',mode:data.configured?'cloud':'local-only'});
      if(st.configured){if(pending())await push({silent:true});else if(localDataCount()===0)await pull({auto:true,silent:true})}
      return st;
    }catch(error){setCloud({configured:false,available:false,mode:'local-only',lastError:String(error?.code||error?.message||error)});return cloudState()}
  }

  async function push({silent=false}={}){
    const s=pending()||queueSnapshot();
    if(!navigator.onLine){setCloud({pending:true,mode:'offline'});if(!silent)toast?.('Brak internetu — Cloud Sync czeka w kolejce');return false}
    try{
      await postCloud({action:'push',syncKey:'primary',payload:s});
      localStorage.removeItem(PENDING);baseline=fingerprint();
      setCloud({configured:true,available:true,mode:'cloud',pending:false,lastPush:new Date().toISOString(),lastError:null,lastFingerprint:baseline});
      if(!silent)toast?.('Cloud Sync: dane wysłane');
      return true;
    }catch(error){
      setCloud({pending:true,mode:'local-only',lastError:String(error?.code||error?.message||error)});
      if(!silent)toast?.(error?.code==='CLOUD_SYNC_NOT_CONFIGURED'?'Cloud Sync czeka na konfigurację backendu':'Cloud Sync niedostępny — dane zostały lokalnie');
      return false;
    }
  }

  function normalizeRemote(value){
    let p=value;
    for(let i=0;i<4;i++){
      if(typeof p==='string'){try{p=JSON.parse(p)}catch{return null}}
      if(p?.payload!==undefined&&(!p.version||!p.data)){p=p.payload;continue}
      break;
    }
    return p&&Number(p.version)>=1&&p.data&&typeof p.data==='object'?p:null;
  }
  function applyRemote(remote){
    const current=snapshot();saveJson(BACKUP,current);
    Object.entries(remote.data).forEach(([k,v])=>{if(allowedKey(k)&&typeof v==='string')localStorage.setItem(k,v)});
    baseline=fingerprint();
    setCloud({configured:true,available:true,mode:'cloud',pending:false,lastPull:new Date().toISOString(),lastAppliedAt:remote.updatedAt||new Date().toISOString(),lastError:null,lastFingerprint:baseline});
    document.dispatchEvent(new CustomEvent('aii:cloud-sync-applied',{detail:{updatedAt:remote.updatedAt||null}}));
    if(typeof window.AII_refreshDashboard==='function')window.AII_refreshDashboard();
  }
  async function pull({auto=false,silent=false,force=false}={}){
    if(!navigator.onLine){if(!silent)toast?.('Brak internetu — używam danych lokalnych');return false}
    if(auto&&pending())return false;
    try{
      const data=await postCloud({action:'pull',syncKey:'primary'});const remote=normalizeRemote(data.payload);
      if(!remote)throw Object.assign(new Error('Brak poprawnego snapshotu w chmurze'),{code:'INVALID_REMOTE_SNAPSHOT'});
      const st=cloudState();
      if(!force&&st.lastAppliedAt&&remote.updatedAt&&Date.parse(remote.updatedAt)<=Date.parse(st.lastAppliedAt)){if(!silent)toast?.('Cloud Sync: lokalne dane są aktualne');return true}
      applyRemote(remote);if(!silent)toast?.('Cloud Sync: dane pobrane');return true;
    }catch(error){setCloud({lastError:String(error?.code||error?.message||error)});if(!silent)toast?.('Nie udało się pobrać Cloud Sync — dane lokalne bez zmian');return false}
  }

  function markDirty(){
    const now=fingerprint();if(!baseline){baseline=now;return}if(now===baseline)return;
    baseline=now;queueSnapshot();
    if(cloudState().configured&&navigator.onLine){clearTimeout(pushTimer);pushTimer=setTimeout(()=>push({silent:true}),4000)}
  }

  async function register(){
    if(!('serviceWorker' in navigator))return writeState({supported:false});
    try{
      const reg=await navigator.serviceWorker.register('./sw.js',{scope:'./'});
      writeState({supported:true,registered:true,scope:reg.scope});
      if(reg.waiting)reg.waiting.postMessage('SKIP_WAITING');
      reg.addEventListener('updatefound',()=>{const w=reg.installing;if(!w)return;w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller){w.postMessage('SKIP_WAITING')}})});
      navigator.serviceWorker.addEventListener('controllerchange',()=>writeState({supported:true,registered:true,controller:true}));
      return reg;
    }catch(error){writeState({supported:true,registered:false,error:String(error?.message||error)});return null}
  }
  async function syncBack(){
    writeState({reconnected:true});try{localStorage.setItem('aii-mode','online-local')}catch{}
    if(typeof window.AII_detectRuntime==='function')window.AII_detectRuntime();if(typeof window.AII_refreshDashboard==='function')window.AII_refreshDashboard();
    document.dispatchEvent(new CustomEvent('aii:connection-restored'));toast?.('Połączenie wróciło — synchronizacja wznowiona');
    await cloudStatus();if(pending()&&cloudState().configured)await push({silent:true});
  }
  function goOffline(){writeState({reconnected:false});try{localStorage.setItem('aii-mode','offline')}catch{};setCloud({mode:'offline',available:false});document.dispatchEvent(new CustomEvent('aii:offline-active'));toast?.('Tryb OFFLINE — pracujesz na danych lokalnych')}

  function statusLabel(){const s=cloudState();if(!navigator.onLine)return ['OFFLINE','Dane pozostają na tym urządzeniu; oczekujące zmiany zostaną wysłane po powrocie internetu.'];if(s.configured&&s.available)return [s.pending?'OCZEKUJE NA SYNC':'CHMURA GOTOWA',s.pending?'Zmiany są bezpiecznie zapisane lokalnie i czekają na wysłanie.':'Synchronizacja między urządzeniami jest dostępna.'];if(s.lastError==='CLOUD_SYNC_NOT_CONFIGURED')return ['BACKEND GOTOWY','Brakuje tylko bezpiecznej zmiennej MAKE_CLOUD_SYNC_URL w Vercel. Aplikacja działa lokalnie.'];return ['TRYB LOKALNY','Cloud Sync nie jest obecnie aktywny; aplikacja działa bez niego.']}
  function renderCloudCard(){
    const active=document.querySelector('.nav-item.active[data-view="settings"]');const root=document.getElementById('content');if(!active||!root)return;
    let card=document.getElementById('aiiCloudSyncCard');if(!card){card=document.createElement('section');card.id='aiiCloudSyncCard';card.className='card panel-card';card.style.marginTop='12px';root.appendChild(card)}
    const [label,detail]=statusLabel(),s=cloudState();
    card.innerHTML=`<div class="section-head"><div><h2>Cloud Sync między komputerami</h2><p class="page-subtitle">Bezpieczny snapshot danych aplikacji. Tokeny, sekrety, hasła i endpointy są wykluczone z synchronizacji.</p></div><span class="tag">${label}</span></div><div class="kpi-line"><span>Ostatnie wysłanie</span><b>${s.lastPush?new Date(s.lastPush).toLocaleString('pl-PL'):'—'}</b></div><div class="kpi-line"><span>Ostatnie pobranie</span><b>${s.lastPull?new Date(s.lastPull).toLocaleString('pl-PL'):'—'}</b></div><p class="page-subtitle" style="margin-top:8px">${detail}</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="primary" id="aiiCloudPush" type="button">↑ Wyślij do chmury</button><button class="ghost" id="aiiCloudPull" type="button">↓ Pobierz z chmury</button><button class="ghost" id="aiiCloudCheck" type="button">Sprawdź status</button></div>`;
    document.getElementById('aiiCloudPush')?.addEventListener('click',()=>push());document.getElementById('aiiCloudPull')?.addEventListener('click',()=>pull({force:true}));document.getElementById('aiiCloudCheck')?.addEventListener('click',()=>cloudStatus());
  }

  window.addEventListener('online',syncBack);window.addEventListener('offline',goOffline);
  document.addEventListener('DOMContentLoaded',()=>{
    register();writeState();baseline=fingerprint();cloudStatus();
    const root=document.getElementById('content');if(root)new MutationObserver(()=>setTimeout(renderCloudCard,20)).observe(root,{childList:true,subtree:true});
    document.querySelectorAll('.nav-item[data-view="settings"]').forEach(a=>a.addEventListener('click',()=>setTimeout(renderCloudCard,60)));
    setInterval(markDirty,45000);setTimeout(renderCloudCard,500);
  });
  window.AIIOfflineRuntime={register,state:()=>readJson(KEY,{}),cloud:{status:cloudStatus,push,pull,snapshot,pending:()=>pending(),state:cloudState}};
})();
