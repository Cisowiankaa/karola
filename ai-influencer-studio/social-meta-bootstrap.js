(() => {
  const ENDPOINT_KEY='aii-social-sync-endpoint';
  const DEFAULT_ENDPOINT='https://ai-influencer-studio-api.vercel.app/api/social-sync';
  const META_KEY='aii-social-sync-meta';

  function disableDuplicateAutoEndpoint(){
    const current=localStorage.getItem(ENDPOINT_KEY)||'';
    if(current===DEFAULT_ENDPOINT){
      localStorage.removeItem(ENDPOINT_KEY);
    }
    const meta={
      status:'idle',
      lastSync:null,
      message:'Synchronizacja dashboardu jest zarządzana centralnie',
      configured:true,
      missing:[]
    };
    localStorage.setItem(META_KEY,JSON.stringify(meta));
    document.dispatchEvent(new CustomEvent('aii:social-meta-probe',{detail:meta}));
  }

  document.addEventListener('DOMContentLoaded',disableDuplicateAutoEndpoint);
})();
