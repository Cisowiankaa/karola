(()=>{
  if(window.__bdsmSupabaseSyncBridgeInstalled)return;
  window.__bdsmSupabaseSyncBridgeInstalled=true;

  const MAKE_APIS=[
    'https://hook.eu1.make.com/gw8nr0beqtbymtd2xgiga3wn7qfjhp25',
    'https://hook.eu1.make.com/b5wib2471u7oqypl5qrqvmrj33hqwhkc'
  ];
  const SUPABASE_API='https://ygesxujnjruplqoqgvpy.supabase.co/functions/v1/bdsm-sync';
  const SUPABASE_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnZXN4dWpuanJ1cGxxb3FndnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4Mjg2ODEsImV4cCI6MjEwMzQwNDY4MX0.nonuToHgBTX9nAZHUrOBzIolGxkWpkz66Zf_wkbZIsE';
  const SUPABASE_PUBLISHABLE='sb_publishable_mAAREnT3ube6bTSDnv5l0Q_15fvGh7X';
  const SELFTEST_KEY='bdsm-app-supabase-sync-selftest-ok-v1';
  const originalFetch=window.fetch.bind(window);

  function setStatus(text,ok){
    const txt=document.querySelector('#syncText');
    const dot=document.querySelector('#syncDot');
    if(txt)txt.textContent=text;
    if(dot)dot.className=ok?'sync-dot ok':'sync-dot';
  }

  try{
    const key='bdsm-app-cloud-config';
    const cloud=JSON.parse(localStorage.getItem(key)||'{}');
    cloud.apiBase=SUPABASE_API;
    cloud.provider='supabase';
    cloud.enabled=true;
    localStorage.setItem(key,JSON.stringify(cloud));
    localStorage.removeItem('bdsm-app-sync-paused-v1');
  }catch(_){ }

  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input&&input.url)||'';
    const shouldRoute=MAKE_APIS.includes(url)||url===SUPABASE_API;
    if(!shouldRoute)return originalFetch(input,init);

    let req;
    try{
      req=typeof input==='string'
        ? new Request(SUPABASE_API,init||{})
        : new Request(SUPABASE_API,input);
      if(init)req=new Request(req,init);
      const headers=new Headers(req.headers);
      headers.set('Authorization','Bearer '+SUPABASE_ANON);
      headers.set('apikey',SUPABASE_PUBLISHABLE);
      headers.set('Accept','application/json');
      req=new Request(req,{headers});
    }catch(_){
      const headers=new Headers((init&&init.headers)||{});
      headers.set('Authorization','Bearer '+SUPABASE_ANON);
      headers.set('apikey',SUPABASE_PUBLISHABLE);
      headers.set('Accept','application/json');
      req=new Request(SUPABASE_API,{...(init||{}),headers});
    }

    try{
      const res=await originalFetch(req);
      if(res.ok){
        setStatus('Online — Supabase zsynchronizowany',true);
        localStorage.removeItem('bdsm-app-sync-paused-v1');
      }else{
        setStatus('Tryb lokalny — synchronizacja HTTP '+res.status,false);
      }
      return res;
    }catch(error){
      setStatus('Tryb lokalny — synchronizacja chwilowo niedostępna',false);
      throw error;
    }
  };

  async function selfTest(){
    try{
      if(localStorage.getItem(SELFTEST_KEY)==='1')return;
      let cloud={};
      try{cloud=JSON.parse(localStorage.getItem('bdsm-app-cloud-config')||'{}')}catch(_){ }
      if(!cloud.accountId)cloud.accountId='ACC-'+Math.random().toString(36).slice(2,10);
      cloud.apiBase=SUPABASE_API;cloud.provider='supabase';cloud.enabled=true;
      try{localStorage.setItem('bdsm-app-cloud-config',JSON.stringify(cloud))}catch(_){ }
      const payload={action:'sync',requestId:'SUPABASE-SELFTEST-'+Date.now(),accountId:cloud.accountId,events:[],rules:{},accessList:[],clientTime:new Date().toISOString()};
      const res=await window.fetch(SUPABASE_API,{method:'POST',mode:'cors',cache:'no-store',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if(res.ok){
        localStorage.setItem(SELFTEST_KEY,'1');
        setStatus('Online — Supabase działa automatycznie',true);
        document.dispatchEvent(new CustomEvent('bdsm-sync-complete'));
      }
    }catch(_){
      setStatus('Tryb lokalny — Supabase chwilowo niedostępny',false);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(selfTest,900),{once:true});else setTimeout(selfTest,900);
})();
