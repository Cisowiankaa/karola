(() => {
  const DEFAULT_API_URL='https://ai-influencer-studio-api.vercel.app/api/generate-image';
  const PROVIDER_KEY='aii-image-provider';
  const ENDPOINT_KEY='aii-image-provider-endpoint';

  function normalize(){
    const endpoint=localStorage.getItem(ENDPOINT_KEY)||DEFAULT_API_URL;
    const provider=(localStorage.getItem(PROVIDER_KEY)||'').toLowerCase();
    const usesDefault=endpoint===DEFAULT_API_URL;
    if(usesDefault && (!provider || provider==='higgsfield')){
      localStorage.setItem(PROVIDER_KEY,'openai');
    }
  }

  normalize();
  document.addEventListener('DOMContentLoaded',normalize);
  window.addEventListener('storage',e=>{
    if(e.key===ENDPOINT_KEY || e.key===PROVIDER_KEY) normalize();
  });

  window.AIIImageBackend={
    get(){
      return {
        provider:localStorage.getItem(PROVIDER_KEY)||'openai',
        endpoint:localStorage.getItem(ENDPOINT_KEY)||DEFAULT_API_URL
      };
    },
    useDefault(){
      localStorage.setItem(PROVIDER_KEY,'openai');
      localStorage.setItem(ENDPOINT_KEY,DEFAULT_API_URL);
      return this.get();
    }
  };
})();