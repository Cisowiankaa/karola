const CACHE='aii-shell-v20260827-4';
const FALLBACK=['./','./index.html','./styles.css','./app.js','./runtime-status.js','./offline-runtime.js','./pwa-runtime.js','./manifest.webmanifest','./avatar-preview.svg'];

function localAsset(url){
  try{const u=new URL(url,self.location.href);return u.origin===self.location.origin&&!u.pathname.includes('/api/')?u.href:null}catch{return null}
}

async function discoverAssets(){
  const assets=new Set(FALLBACK.map(x=>new URL(x,self.location.href).href));
  try{
    const res=await fetch(new Request('./index.html',{cache:'no-store'}));
    if(res.ok){
      const html=await res.clone().text();
      const re=/<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+)["'][^>]*>/gi;
      for(const m of html.matchAll(re)){const u=localAsset(m[1]);if(u)assets.add(u)}
      const cache=await caches.open(CACHE);await cache.put(new URL('./index.html',self.location.href).href,res.clone());
    }
  }catch{}
  return [...assets];
}

self.addEventListener('install',e=>{
  e.waitUntil((async()=>{
    const cache=await caches.open(CACHE);const assets=await discoverAssets();
    await Promise.allSettled(assets.map(async url=>{try{const r=await fetch(new Request(url,{cache:'reload'}));if(r.ok)await cache.put(url,r)}catch{}}));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k.startsWith('aii-shell-')).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==self.location.origin)return;
  if(u.pathname.includes('/api/')){
    e.respondWith(fetch(r).catch(()=>new Response(JSON.stringify({ok:false,offline:true,code:'OFFLINE'}),{status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})));return;
  }
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(res=>{if(res?.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(new URL('./index.html',self.location.href).href,copy))}return res}).catch(async()=>await caches.match(new URL('./index.html',self.location.href).href)||await caches.match(new URL('./',self.location.href).href)));return;
  }
  e.respondWith(caches.match(r).then(cached=>cached||fetch(r).then(res=>{if(res?.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy))}return res}).catch(()=>cached)));
});

self.addEventListener('message',e=>{if(e.data==='SKIP_WAITING')self.skipWaiting()});
