(() => {
  const ENDPOINT_KEY='aii-social-sync-endpoint';
  const DEFAULT_ENDPOINT='https://ai-influencer-studio-api.vercel.app/api/social-sync';
  const META_KEY='aii-social-sync-meta';

  function ensureEndpoint(){
    if(!localStorage.getItem(ENDPOINT_KEY)) localStorage.setItem(ENDPOINT_KEY,DEFAULT_ENDPOINT);
  }

  async function probe(){
    ensureEndpoint();
    const endpoint=localStorage.getItem(ENDPOINT_KEY)||DEFAULT_ENDPOINT;
    try{
      const r=await fetch(endpoint,{headers:{Accept:'application/json'}});
      const data=await r.json().catch(()=>({}));
      const meta={
        status:r.ok?'ok':'error',
        lastSync:r.ok?Date.now():null,
        message:r.ok?'Meta API połączone':(data.message||data.error||`Meta API HTTP ${r.status}`),
        configured:data.configured!==false,
        missing:data.missing||[]
      };
      localStorage.setItem(META_KEY,JSON.stringify(meta));
      document.dispatchEvent(new CustomEvent('aii:social-meta-probe',{detail:meta}));
    }catch(e){
      const meta={status:'error',lastSync:null,message:`Backend Meta niedostępny: ${e.message||e}`,configured:false,missing:[]};
      localStorage.setItem(META_KEY,JSON.stringify(meta));
      document.dispatchEvent(new CustomEvent('aii:social-meta-probe',{detail:meta}));
    }
  }

  document.addEventListener('DOMContentLoaded',()=>{
    ensureEndpoint();
    setTimeout(probe,700);
  });
})();