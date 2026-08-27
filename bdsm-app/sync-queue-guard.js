(()=>{
  if(window.__bdsmSupabaseSyncBridgeV2Installed)return;
  window.__bdsmSupabaseSyncBridgeV2Installed=true;

  const MAKE_APIS=[
    'https://hook.eu1.make.com/gw8nr0beqtbymtd2xgiga3wn7qfjhp25',
    'https://hook.eu1.make.com/b5wib2471u7oqypl5qrqvmrj33hqwhkc'
  ];
  const SUPABASE_API='https://ygesxujnjruplqoqgvpy.supabase.co/functions/v1/bdsm-sync';
  const SUPABASE_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnZXN4dWpuanJ1cGxxb3FndnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4Mjg2ODEsImV4cCI6MjEwMzQwNDY4MX0.nonuToHgBTX9nAZHUrOBzIolGxkWpkz66Zf_wkbZIsE';
  const SUPABASE_PUBLISHABLE='sb_publishable_mAAREnT3ube6bTSDnv5l0Q_15fvGh7X';
  const SELFTEST_KEY='bdsm-app-supabase-sync-selftest-ok-v2';
  const LAST_CLOUD_KEY='bdsm-app-last-cloud-sync-v2';
  const originalFetch=window.fetch.bind(window);

  const STORE_KEYS=[
    'bdsm-app-events-v3',
    'bdsm-app-rules-v3',
    'bdsm-app-access',
    'bdsm-app-offences-v1',
    'bdsm-app-education-tasks-v1',
    'bdsm-app-written-notes-v1',
    'bdsm-app-hourly-reports-v1',
    'bdsm-app-event-offence-links-v1',
    'bdsm-app-today-priorities-v1',
    'bdsm-app-today-checked-v1',
    'bdsm-app-weekly-days-done-v1',
    'bdsm-app-weekly-notes-v1',
    'bdsm-app-weekly-summary-v1',
    'bdsm-app-day-agenda-meta-v1',
    'bdsm-app-daily-reports-v1'
  ];

  function readJSON(key,fallback=null){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch(_){return fallback}}
  function setStatus(text,ok){
    const txt=document.querySelector('#syncText');
    const dot=document.querySelector('#syncDot');
    if(txt)txt.textContent=text;
    if(dot)dot.className=ok?'sync-dot ok':'sync-dot';
  }
  function getCloud(){
    let cloud=readJSON('bdsm-app-cloud-config',{})||{};
    if(!cloud.accountId)cloud.accountId='ACC-'+Math.random().toString(36).slice(2,10);
    cloud.apiBase=SUPABASE_API;
    cloud.provider='supabase';
    cloud.enabled=true;
    try{localStorage.setItem('bdsm-app-cloud-config',JSON.stringify(cloud))}catch(_){ }
    return cloud;
  }
  function buildSnapshot(){
    const stores={};
    STORE_KEYS.forEach(key=>{const raw=localStorage.getItem(key);if(raw!==null){try{stores[key]=JSON.parse(raw)}catch(_){stores[key]=raw}}});
    return {schemaVersion:2,stores,capturedAt:new Date().toISOString()};
  }
  function snapshotHasData(snapshot){
    if(!snapshot||!snapshot.stores)return false;
    return Object.values(snapshot.stores).some(v=>Array.isArray(v)?v.length>0:(v&&typeof v==='object'?Object.keys(v).length>0:Boolean(v)));
  }
  function localHasData(){
    return STORE_KEYS.some(key=>{const v=readJSON(key,null);return Array.isArray(v)?v.length>0:(v&&typeof v==='object'?Object.keys(v).length>0:Boolean(v))});
  }
  function applySnapshot(snapshot){
    if(!snapshot||!snapshot.stores)return false;
    let changed=false;
    STORE_KEYS.forEach(key=>{
      if(Object.prototype.hasOwnProperty.call(snapshot.stores,key)){
        try{localStorage.setItem(key,JSON.stringify(snapshot.stores[key]));changed=true}catch(_){ }
      }
    });
    return changed;
  }
  function authHeaders(base){
    const headers=new Headers(base||{});
    headers.set('Authorization','Bearer '+SUPABASE_ANON);
    headers.set('apikey',SUPABASE_PUBLISHABLE);
    headers.set('Accept','application/json');
    headers.set('Content-Type','application/json');
    return headers;
  }

  getCloud();
  try{localStorage.removeItem('bdsm-app-sync-paused-v1')}catch(_){ }

  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input&&input.url)||'';
    const shouldRoute=MAKE_APIS.includes(url)||url===SUPABASE_API;
    if(!shouldRoute)return originalFetch(input,init);

    let payload=null;
    try{
      if(init&&typeof init.body==='string')payload=JSON.parse(init.body);
      else if(input instanceof Request)payload=await input.clone().json();
    }catch(_){ }
    if(payload&&payload.action==='sync')payload={...payload,snapshot:buildSnapshot()};

    let method=(init&&init.method)||(input instanceof Request?input.method:'POST')||'POST';
    const reqInit={...(init||{}),method,headers:authHeaders((init&&init.headers)||(input instanceof Request?input.headers:undefined))};
    if(payload)reqInit.body=JSON.stringify(payload);

    try{
      const res=await originalFetch(SUPABASE_API,reqInit);
      if(res.ok){
        setStatus('Online — Supabase zsynchronizowany',true);
        if(payload&&payload.action==='sync')localStorage.setItem(LAST_CLOUD_KEY,new Date().toISOString());
      }else setStatus('Tryb lokalny — synchronizacja HTTP '+res.status,false);
      return res;
    }catch(error){
      setStatus('Tryb lokalny — synchronizacja chwilowo niedostępna',false);
      throw error;
    }
  };

  async function pullRemote(){
    try{
      const cloud=getCloud();
      const res=await window.fetch(SUPABASE_API,{method:'POST',mode:'cors',cache:'no-store',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'pull',accountId:cloud.accountId,requestId:'PULL-'+Date.now(),clientTime:new Date().toISOString()})});
      if(!res.ok)return;
      const data=await res.json();
      const remotePayload=data&&data.payload;
      const snapshot=remotePayload&&remotePayload.snapshot;
      if(!snapshotHasData(snapshot))return;
      const remoteTime=Date.parse(data.updatedAt||0)||0;
      const localSyncTime=Date.parse(localStorage.getItem(LAST_CLOUD_KEY)||0)||0;
      const canRestore=!localHasData() || (localSyncTime>0 && remoteTime>localSyncTime+1000);
      if(canRestore&&applySnapshot(snapshot)){
        localStorage.setItem(LAST_CLOUD_KEY,data.updatedAt||new Date().toISOString());
        setStatus('Online — pobrano nowsze dane z Supabase',true);
        document.dispatchEvent(new CustomEvent('bdsm-cloud-restored'));
        document.dispatchEvent(new CustomEvent('bdsm-sync-complete'));
      }
    }catch(_){ }
  }

  async function selfTest(){
    try{
      const cloud=getCloud();
      if(localStorage.getItem(SELFTEST_KEY)!=='1'){
        const payload={action:'sync',requestId:'SUPABASE-SELFTEST-'+Date.now(),accountId:cloud.accountId,events:readJSON('bdsm-app-events-v3',[]),rules:readJSON('bdsm-app-rules-v3',{}),accessList:readJSON('bdsm-app-access',[]),clientTime:new Date().toISOString(),snapshot:buildSnapshot()};
        const res=await window.fetch(SUPABASE_API,{method:'POST',mode:'cors',cache:'no-store',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        if(res.ok){localStorage.setItem(SELFTEST_KEY,'1');setStatus('Online — Supabase działa automatycznie',true)}
      }
      await pullRemote();
    }catch(_){setStatus('Tryb lokalny — Supabase chwilowo niedostępny',false)}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(selfTest,900),{once:true});else setTimeout(selfTest,900);
})();
