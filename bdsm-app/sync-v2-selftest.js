(()=>{
  if(window.__bdsmSyncV2SelfTestInstalled)return;
  window.__bdsmSyncV2SelfTestInstalled=true;
  const API='https://hook.eu1.make.com/b5wib2471u7oqypl5qrqvmrj33hqwhkc';
  const KEY='bdsm-app-sync-v2-selftest-ok';
  const run=async()=>{
    try{
      if(localStorage.getItem(KEY)==='1')return;
      let cloud={};
      try{cloud=JSON.parse(localStorage.getItem('bdsm-app-cloud-config')||'{}')}catch(_){ }
      if(!cloud.accountId)cloud.accountId='ACC-'+Math.random().toString(36).slice(2,10);
      cloud.apiBase=API;cloud.enabled=true;
      try{localStorage.setItem('bdsm-app-cloud-config',JSON.stringify(cloud))}catch(_){ }
      const payload={action:'sync',requestId:'SELFTEST-'+Date.now(),accountId:cloud.accountId,events:[],rules:{},accessList:[],clientTime:new Date().toISOString()};
      const res=await fetch(API,{method:'POST',mode:'cors',cache:'no-store',credentials:'omit',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)});
      const txt=document.querySelector('#syncText'),dot=document.querySelector('#syncDot');
      if(res.ok){
        localStorage.setItem(KEY,'1');
        if(txt)txt.textContent='Online — synchronizacja v2 działa automatycznie';
        if(dot)dot.className='sync-dot ok';
        document.dispatchEvent(new CustomEvent('bdsm-sync-complete'));
      }else{
        if(txt)txt.textContent='Tryb lokalny — test synchronizacji HTTP '+res.status;
      }
    }catch(e){
      const txt=document.querySelector('#syncText');
      if(txt)txt.textContent='Tryb lokalny — test synchronizacji niedostępny';
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,1200),{once:true});else setTimeout(run,1200);
})();
