(() => {
  const ENDPOINT_KEY='aii-social-sync-endpoint';
  const DEFAULT_ENDPOINT='https://ai-influencer-studio-api.vercel.app/api/social-sync';
  const META_KEY='aii-social-sync-meta';

  function bootstrapSocialEndpoint(){
    const current=(localStorage.getItem(ENDPOINT_KEY)||'').trim();
    if(!current){
      localStorage.setItem(ENDPOINT_KEY,DEFAULT_ENDPOINT);
    }
    const previous=(()=>{try{return JSON.parse(localStorage.getItem(META_KEY)||'{}')}catch{return {}}})();
    const meta={
      ...previous,
      status: previous.status==='ok'?'ok':'idle',
      message: previous.status==='ok'?(previous.message||'Połączono z API social media'):'Endpoint social media skonfigurowany — gotowy do synchronizacji',
      configured:true,
      endpoint:localStorage.getItem(ENDPOINT_KEY)||DEFAULT_ENDPOINT
    };
    localStorage.setItem(META_KEY,JSON.stringify(meta));
    document.dispatchEvent(new CustomEvent('aii:social-meta-probe',{detail:meta}));
  }

  document.addEventListener('DOMContentLoaded',()=>{
    bootstrapSocialEndpoint();
    setTimeout(()=>{
      const syncButton=document.getElementById('socialSyncNow');
      if(syncButton && !localStorage.getItem('aii-social-bootstrap-synced')){
        localStorage.setItem('aii-social-bootstrap-synced','1');
        syncButton.click();
      }
    },700);
  });

  window.AIISocialMetaBootstrap={bootstrap:bootstrapSocialEndpoint,endpoint:DEFAULT_ENDPOINT};
})();
