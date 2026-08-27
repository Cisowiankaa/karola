(()=>{
  if(window.__bdsmSupabaseSyncBridgeInstalled)return;
  window.__bdsmSupabaseSyncBridgeInstalled=true;

  const MAKE_APIS=[
    'https://hook.eu1.make.com/gw8nr0beqtbymtd2xgiga3wn7qfjhp25',
    'https://hook.eu1.make.com/b5wib2471u7oqypl5qrqvmrj33hqwhkc'
  ];
  const API='https://ygesxujnjruplqoqgvpy.supabase.co/functions/v1/bdsm-sync';
  const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnZXN4dWpuanJ1cGxxb3FndnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4Mjg2ODEsImV4cCI6MjEwMzQwNDY4MX0.nonuToHgBTX9nAZHUrOBzIolGxkWpkz66Zf_wkbZIsE';
  const PUB='sb_publishable_mAAREnT3ube6bTSDnv5l0Q_15fvGh7X';
  const originalFetch=window.fetch.bind(window);
  const KEYS=[
    'bdsm-app-events-v3','bdsm-app-rules-v3','bdsm-app-access','bdsm-app-offences-v1',
    'bdsm-app-education-tasks-v1','bdsm-app-written-notes-v1','bdsm-app-hourly-reports-v1',
    'bdsm-app-event-offence-links-v1','bdsm-app-today-priorities-v1','bdsm-app-today-checked-v1',
    'bdsm-app-weekly-days-done-v1','bdsm-app-weekly-notes-v1','bdsm-app-weekly-summary-v1',
    'bdsm-app-day-agenda-meta-v1','bdsm-app-daily-reports-v1'
  ];
  let syncing=false,dirtyTimer=null;

  function read(key,fallback=null){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch(_){return fallback}}
  function randomSecret(){const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')}
  function setStatus(text,ok){const t=document.querySelector('#syncText'),d=document.querySelector('#syncDot');if(t)t.textContent=text;if(d)d.className=ok?'sync-dot ok':'sync-dot'}
  function cloud(){
    const key='bdsm-app-cloud-config';let c=read(key,{});
    if(!c.accountId)c.accountId='ACC-'+crypto.randomUUID();
    if(!c.syncSecret||String(c.syncSecret).length<24)c.syncSecret=randomSecret();
    c.apiBase=API;c.provider='supabase';c.enabled=true;localStorage.setItem(key,JSON.stringify(c));return c;
  }
  function snapshot(){const data={schemaVersion:2,savedAt:new Date().toISOString()};KEYS.forEach(k=>{data[k]=read(k,null)});return data}
  function headers(extra={}){return {'Authorization':'Bearer '+ANON,'apikey':PUB,'Content-Type':'application/json','Accept':'application/json',...extra}}
  async function api(payload){
    const r=await originalFetch(API,{method:'POST',mode:'cors',cache:'no-store',credentials:'omit',headers:headers(),body:JSON.stringify(payload)});
    let out=null;try{out=await r.json()}catch(_){out=null}if(!r.ok)throw new Error((out&&out.error)||('HTTP '+r.status));return out||{ok:true};
  }
  function authPayload(base){const c=cloud();return {...base,accountId:base.accountId||c.accountId,syncSecret:c.syncSecret}}
  async function pushSnapshot(reason='auto'){
    if(syncing||!navigator.onLine)return false;syncing=true;
    try{const requestId='SUPA-'+reason.toUpperCase()+'-'+Date.now();await api(authPayload({action:'sync',requestId,payload:snapshot(),clientTime:new Date().toISOString()}));localStorage.setItem('bdsm-app-last-cloud-sync',JSON.stringify({at:new Date().toISOString(),requestId,provider:'supabase'}));setStatus('Online — Supabase zsynchronizowany',true);document.dispatchEvent(new CustomEvent('bdsm-sync-complete'));return true}
    catch(e){setStatus('Tryb lokalny — synchronizacja chwilowo niedostępna',false);return false}finally{syncing=false}
  }
  async function pullSnapshot(force=false){
    if(!navigator.onLine)return false;
    try{const out=await api(authPayload({action:'pull',requestId:'PULL-'+Date.now(),clientTime:new Date().toISOString()}));const p=out&&out.payload;if(!out?.found||!p||typeof p!=='object')return false;
      const remote=Date.parse(p.savedAt||0)||0;const localMeta=read('bdsm-app-last-cloud-sync',{});const local=Date.parse(localMeta.at||0)||0;const hasLocal=KEYS.some(k=>localStorage.getItem(k));if(!force&&hasLocal&&remote<=local)return false;
      KEYS.forEach(k=>{if(Object.prototype.hasOwnProperty.call(p,k)&&p[k]!==null)localStorage.setItem(k,JSON.stringify(p[k]))});localStorage.setItem('bdsm-app-last-cloud-sync',JSON.stringify({at:p.savedAt||out.updatedAt||new Date().toISOString(),provider:'supabase',pulled:true}));document.dispatchEvent(new CustomEvent('bdsm-cloud-restored'));setStatus('Online — dane pobrane z Supabase',true);return true
    }catch(_){return false}
  }

  function toB64Url(text){return btoa(unescape(encodeURIComponent(text))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
  function fromB64Url(text){let s=text.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return decodeURIComponent(escape(atob(s)))}
  function pairingCode(){const c=cloud();return 'BDSM2.'+toB64Url(JSON.stringify({v:2,a:c.accountId,s:c.syncSecret}))}
  async function applyPairingCode(code){
    const raw=String(code||'').trim();if(!raw.startsWith('BDSM2.'))throw new Error('Nieprawidłowy kod');
    const data=JSON.parse(fromB64Url(raw.slice(6)));if(!data.a||!data.s||String(data.s).length<24)throw new Error('Nieprawidłowy kod');
    const c=cloud();c.accountId=String(data.a);c.syncSecret=String(data.s);localStorage.setItem('bdsm-app-cloud-config',JSON.stringify(c));localStorage.removeItem('bdsm-app-last-cloud-sync');
    const ok=await pullSnapshot(true);if(!ok)await pushSnapshot('pair');return true;
  }
  window.bdsmCloudSync={push:pushSnapshot,pull:pullSnapshot,getPairingCode:pairingCode,applyPairingCode};

  function installPairingUI(){
    const settings=document.querySelector('#view-settings .panel')||document.querySelector('#view-settings');if(!settings||document.querySelector('#bdsmCloudPairing'))return;
    const box=document.createElement('div');box.id='bdsmCloudPairing';box.style.cssText='margin-top:16px;padding:14px;border:1px solid #283141;border-radius:12px;background:#0c121c';
    box.innerHTML='<h3 style="margin:0 0 10px">Synchronizacja między komputerami</h3><p style="color:#98a2b3;font-size:12px">Kod parowania daje dostęp do prywatnego snapshotu. Traktuj go jak hasło.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="bdsmPairCode" type="password" placeholder="Kod parowania" style="flex:1;min-width:220px;background:#080d15;color:#fff;border:1px solid #2c3547;border-radius:8px;padding:10px"><button class="btn" id="bdsmPairShow">Pokaż mój kod</button><button class="btn primary" id="bdsmPairApply">Połącz urządzenie</button></div><div id="bdsmPairMsg" style="margin-top:8px;color:#98a2b3;font-size:12px"></div>';
    settings.appendChild(box);
    const inp=box.querySelector('#bdsmPairCode'),msg=box.querySelector('#bdsmPairMsg');
    box.querySelector('#bdsmPairShow').onclick=()=>{inp.type='text';inp.value=pairingCode();msg.textContent='Kod gotowy do skopiowania. Nie udostępniaj go publicznie.'};
    box.querySelector('#bdsmPairApply').onclick=async()=>{try{msg.textContent='Łączenie…';await applyPairingCode(inp.value);msg.textContent='Urządzenie połączone z chmurą.';setTimeout(()=>location.reload(),500)}catch(e){msg.textContent=String(e.message||e)}};
  }

  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input&&input.url)||'';if(!MAKE_APIS.includes(url)&&url!==API)return originalFetch(input,init);
    let body={};try{body=JSON.parse((init&&init.body)||'{}')}catch(_){ }const c=cloud();const merged={...body,accountId:body.accountId||c.accountId,syncSecret:c.syncSecret};if(merged.action==='sync')merged.payload=snapshot();const result=await api(merged);return new Response(JSON.stringify(result),{status:200,headers:{'Content-Type':'application/json'}})
  };

  const nativeSet=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){nativeSet.call(this,key,value);if(this===localStorage&&KEYS.includes(String(key))){clearTimeout(dirtyTimer);dirtyTimer=setTimeout(()=>pushSnapshot('change'),1800)}};

  function start(){cloud();installPairingUI();setTimeout(async()=>{const pulled=await pullSnapshot();if(!pulled)await pushSnapshot('startup')},1200);setInterval(()=>pushSnapshot('interval'),180000);window.addEventListener('online',()=>setTimeout(()=>pushSnapshot('online'),800));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')pushSnapshot('hidden')});document.addEventListener('click',()=>setTimeout(installPairingUI,100))}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
