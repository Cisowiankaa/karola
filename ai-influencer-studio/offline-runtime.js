(() => {
  const toast=t=>window.showToast?.(t);
  const KEY='aii-offline-runtime', CLOUD='aii-cloud-sync-status', PENDING='aii-cloud-sync-pending', BACKUP='aii-cloud-sync-last-backup';
  const CLOUD_API='/api/cloud-sync', SESSION_KEY='aii-cloud-sync-key';
  const BLOCK=/(token|secret|password|api[-_]?key|access[-_]?token|endpoint|webhook|authorization)/i;
  const SKIP=new Set([KEY,CLOUD,PENDING,BACKUP,'aii-mode','aii-runtime-status','aii-device-id']);
  let baseline='', pushTimer=null;

  const readJson=(k,d={})=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const saveJson=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
  const allowedKey=k=>String(k||'').startsWith('aii-')&&!BLOCK.test(k)&&!SKIP.has(k);
  const cloudState=()=>readJson(CLOUD,{});
  const hasKey=()=>Boolean(sessionStorage.getItem(SESSION_KEY));
  const setKey=v=>{const x=String(v||'').trim();if(x)sessionStorage.setItem(SESSION_KEY,x);else sessionStorage.removeItem(SESSION_KEY);renderCloudCard();return Boolean(x)};
  const setCloud=extra=>{const next={...cloudState(),...extra,checkedAt:new Date().toISOString()};saveJson(CLOUD,next);renderCloudCard();return next};
  const writeState=extra=>{const s={online:navigator.onLine,updatedAt:new Date().toISOString(),...(extra||{})};saveJson(KEY,s);return s};

  function safeData(){const data={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(allowedKey(k)){const v=localStorage.getItem(k);if(v!==null)data[k]=v}}return data}
  function fingerprint(data=safeData()){const s=JSON.stringify(data);let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)}
  function deviceId(){let id=localStorage.getItem('aii-device-id');if(!id){id=globalThis.crypto?.randomUUID?.()||`device-${Date.now()}-${Math.random().toString(36).slice(2)}`;localStorage.setItem('aii-device-id',id)}return id}
  function snapshot(){return{version:1,updatedAt:new Date().toISOString(),deviceId:deviceId(),data:safeData()}}
  const pending=()=>readJson(PENDING,null);
  function queueSnapshot(s=snapshot()){saveJson(PENDING,s);setCloud({pending:true,pendingAt:s.updatedAt});return s}

  async function api(body){
    const action=String(body?.action||'');
    const headers={'Content-Type':'application/json','Accept':'application/json'};
    if(action==='push'||action==='pull'){
      const key=sessionStorage.getItem(SESSION_KEY)||'';
      if(!key){const e=new Error('Wpisz klucz Cloud Sync na tym urządzeniu.');e.code='CLOUD_SYNC_KEY_REQUIRED';throw e}
      headers['X-Cloud-Sync-Key']=key;
    }
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),10000);
    try{
      const r=await fetch(CLOUD_API,{method:'POST',headers,body:JSON.stringify(body),cache:'no-store',credentials:'same-origin',signal:ctrl.signal});
      const data=await r.json().catch(()=>({}));
      if(!r.ok||data?.ok===false){const e=new Error(data?.message||`Cloud Sync HTTP ${r.status}`);e.code=data?.code||`HTTP_${r.status}`;throw e}
      return data;
    }finally{clearTimeout(timer)}
  }

  async function status(){
    if(!navigator.onLine){setCloud({available:false,mode:'offline'});return cloudState()}
    try{
      const d=await api({action:'status'});
      const s=setCloud({configured:Boolean(d.configured),available:true,provider:d.provider||'local-only',missing:d.missing||[],mode:d.configured?'cloud':'local-only',lastError:d.configured?null:'CLOUD_SYNC_NOT_CONFIGURED'});
      if(s.configured&&hasKey()){if(pending())await push({silent:true});else if(Object.keys(safeData()).length===0)await pull({auto:true,silent:true})}
      return s;
    }catch(e){setCloud({configured:false,available:false,mode:'local-only',lastError:String(e?.code||e?.message||e)});return cloudState()}
  }

  async function push({silent=false}={}){
    const s=pending()||queueSnapshot();
    if(!navigator.onLine){setCloud({pending:true,mode:'offline'});if(!silent)toast?.('Brak internetu — synchronizacja czeka');return false}
    try{
      await api({action:'push',syncKey:'primary',payload:s});localStorage.removeItem(PENDING);baseline=fingerprint();
      setCloud({configured:true,available:true,mode:'cloud',pending:false,lastPush:new Date().toISOString(),lastError:null,lastFingerprint:baseline});if(!silent)toast?.('Cloud Sync: dane wysłane');return true;
    }catch(e){
      const noCfg=e?.code==='CLOUD_SYNC_NOT_CONFIGURED',noKey=e?.code==='CLOUD_SYNC_KEY_REQUIRED'||e?.code==='CLOUD_SYNC_UNAUTHORIZED';
      setCloud({configured:noCfg?false:cloudState().configured,pending:true,mode:'local-only',lastError:String(e?.code||e?.message||e)});
      if(!silent)toast?.(noKey?'Cloud Sync: ustaw poprawny klucz w Ustawieniach':noCfg?'Cloud Sync czeka na konfigurację Vercel':'Cloud Sync niedostępny — dane zostały lokalnie');return false;
    }
  }

  function normalizeRemote(v){let p=v;for(let i=0;i<4;i++){if(typeof p==='string'){try{p=JSON.parse(p)}catch{return null}}if(p?.payload!==undefined&&(!p.version||!p.data)){p=p.payload;continue}break}return p&&Number(p.version)>=1&&p.data&&typeof p.data==='object'?p:null}
  function applyRemote(remote){
    saveJson(BACKUP,snapshot());const keys=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(allowedKey(k))keys.push(k)}
    keys.forEach(k=>{if(!Object.prototype.hasOwnProperty.call(remote.data,k))localStorage.removeItem(k)});
    Object.entries(remote.data).forEach(([k,v])=>{if(allowedKey(k)&&typeof v==='string')localStorage.setItem(k,v)});
    localStorage.removeItem(PENDING);baseline=fingerprint();setCloud({configured:true,available:true,mode:'cloud',pending:false,lastPull:new Date().toISOString(),lastAppliedAt:remote.updatedAt||new Date().toISOString(),lastError:null,lastFingerprint:baseline});
    document.dispatchEvent(new CustomEvent('aii:cloud-sync-applied',{detail:{updatedAt:remote.updatedAt||null}}));window.AII_refreshDashboard?.();
  }
  async function pull({auto=false,silent=false,force=false}={}){
    if(!navigator.onLine){if(!silent)toast?.('Brak internetu — używam danych lokalnych');return false}if(auto&&pending())return false;
    try{
      const d=await api({action:'pull',syncKey:'primary'}),remote=normalizeRemote(d.payload);if(!remote){const e=new Error('Brak poprawnego snapshotu w chmurze');e.code='INVALID_REMOTE_SNAPSHOT';throw e}
      const s=cloudState();if(!force&&s.lastAppliedAt&&remote.updatedAt&&Date.parse(remote.updatedAt)<=Date.parse(s.lastAppliedAt)){if(!silent)toast?.('Cloud Sync: dane są aktualne');return true}
      applyRemote(remote);if(!silent)toast?.('Cloud Sync: dane pobrane');return true;
    }catch(e){setCloud({lastError:String(e?.code||e?.message||e)});if(!silent)toast?.(e?.code==='CLOUD_SYNC_KEY_REQUIRED'||e?.code==='CLOUD_SYNC_UNAUTHORIZED'?'Cloud Sync: ustaw poprawny klucz':'Nie udało się pobrać chmury — dane lokalne bez zmian');return false}
  }

  function markDirty(){const now=fingerprint();if(!baseline){baseline=now;return}if(now===baseline)return;baseline=now;queueSnapshot();if(cloudState().configured&&hasKey()&&navigator.onLine){clearTimeout(pushTimer);pushTimer=setTimeout(()=>push({silent:true}),4000)}}
  async function register(){if(!('serviceWorker'in navigator))return writeState({supported:false});try{const reg=await navigator.serviceWorker.register('./sw.js',{scope:'./'});writeState({supported:true,registered:true,scope:reg.scope});if(reg.waiting)reg.waiting.postMessage('SKIP_WAITING');reg.addEventListener('updatefound',()=>{const w=reg.installing;if(w)w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)w.postMessage('SKIP_WAITING')})});navigator.serviceWorker.addEventListener('controllerchange',()=>writeState({supported:true,registered:true,controller:true}));return reg}catch(e){writeState({supported:true,registered:false,error:String(e?.message||e)});return null}}
  async function online(){writeState({reconnected:true});try{localStorage.setItem('aii-mode','online-local')}catch{};window.AII_detectRuntime?.();window.AII_refreshDashboard?.();document.dispatchEvent(new CustomEvent('aii:connection-restored'));toast?.('Połączenie wróciło — synchronizacja wznowiona');await status();if(pending()&&cloudState().configured&&hasKey())await push({silent:true})}
  function offline(){writeState({reconnected:false});try{localStorage.setItem('aii-mode','offline')}catch{};setCloud({mode:'offline',available:false});document.dispatchEvent(new CustomEvent('aii:offline-active'));toast?.('Tryb OFFLINE — pracujesz na danych lokalnych')}

  function label(){const s=cloudState();if(!navigator.onLine)return['OFFLINE','Zmiany zostają na urządzeniu i czekają na internet.'];if(s.configured&&!hasKey())return['WYMAGA KLUCZA','Backend chmurowy jest gotowy. Wpisz klucz synchronizacji dla tego urządzenia.'];if(s.configured&&s.available)return[s.pending?'OCZEKUJE NA SYNC':'CHMURA GOTOWA',s.pending?'Zmiany są zapisane lokalnie i czekają na wysłanie.':'Synchronizacja między urządzeniami jest dostępna.'];if(s.lastError==='CLOUD_SYNC_NOT_CONFIGURED')return['BACKEND GOTOWY','W Vercel trzeba ustawić MAKE_CLOUD_SYNC_URL oraz CLOUD_SYNC_KEY. Do tego czasu aplikacja działa lokalnie.'];return['TRYB LOKALNY','Cloud Sync nie jest aktywny; aplikacja działa bez niego.']}
  function renderCloudCard(){
    const root=document.getElementById('content');if(!root||!document.querySelector('.nav-item.active[data-view="settings"]'))return;
    let card=document.getElementById('aiiCloudSyncCard');if(!card){card=document.createElement('section');card.id='aiiCloudSyncCard';card.className='card panel-card';card.style.marginTop='12px';root.appendChild(card)}
    const [tag,detail]=label(),s=cloudState();
    card.innerHTML=`<div class="section-head"><div><h2>Cloud Sync między komputerami</h2><p class="page-subtitle">Snapshot danych aplikacji. Tokeny, hasła, sekrety i endpointy są wykluczone.</p></div><span class="tag">${tag}</span></div><div class="kpi-line"><span>Ostatnie wysłanie</span><b>${s.lastPush?new Date(s.lastPush).toLocaleString('pl-PL'):'—'}</b></div><div class="kpi-line"><span>Ostatnie pobranie</span><b>${s.lastPull?new Date(s.lastPull).toLocaleString('pl-PL'):'—'}</b></div><p class="page-subtitle" style="margin-top:8px">${detail}</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><input id="aiiCloudKey" type="password" autocomplete="off" placeholder="Klucz Cloud Sync" style="min-width:210px;padding:8px;border:1px solid #dfe2eb;border-radius:9px"><button class="ghost" id="aiiCloudKeySave" type="button">${hasKey()?'Zmień klucz':'Ustaw klucz'}</button><button class="primary" id="aiiCloudPush" type="button">↑ Wyślij</button><button class="ghost" id="aiiCloudPull" type="button">↓ Pobierz</button><button class="ghost" id="aiiCloudCheck" type="button">Sprawdź status</button></div><p class="page-subtitle" style="margin-top:7px">Klucz jest przechowywany tylko w bieżącej sesji przeglądarki i nie trafia do backupu ani Cloud Sync.</p>`;
    document.getElementById('aiiCloudKeySave')?.addEventListener('click',()=>{const v=document.getElementById('aiiCloudKey')?.value||'';if(setKey(v)){toast?.('Klucz Cloud Sync ustawiony dla tej sesji');status()}else toast?.('Wpisz klucz Cloud Sync')});
    document.getElementById('aiiCloudPush')?.addEventListener('click',()=>push());document.getElementById('aiiCloudPull')?.addEventListener('click',()=>pull({force:true}));document.getElementById('aiiCloudCheck')?.addEventListener('click',()=>status());
  }

  window.addEventListener('online',online);window.addEventListener('offline',offline);
  document.addEventListener('DOMContentLoaded',()=>{register();writeState();baseline=fingerprint();status();const root=document.getElementById('content');if(root)new MutationObserver(()=>setTimeout(renderCloudCard,20)).observe(root,{childList:true});document.querySelectorAll('.nav-item[data-view="settings"]').forEach(a=>a.addEventListener('click',()=>setTimeout(renderCloudCard,60)));setInterval(markDirty,45000);setTimeout(renderCloudCard,500)});
  window.AIIOfflineRuntime={register,state:()=>readJson(KEY,{}),cloud:{status,push,pull,snapshot,pending,state:cloudState,setKey,hasKey}};
})();
