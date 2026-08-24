(() => {
  if (window.__bdsmInviteHistoryInstalled) return;
  window.__bdsmInviteHistoryInstalled = true;

  const API='https://hook.eu1.make.com/gw8nr0beqtbymtd2xgiga3wn7qfjhp25';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(_){return d}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const logKey='bdsm-app-invite-log-v1';
  const cloud=()=>read('bdsm-app-cloud-config',{});
  let refreshing=false;

  function setOnlineState(ok=true){
    const txt=document.querySelector('#syncText');
    const dot=document.querySelector('#syncDot');
    if(ok){if(txt)txt.textContent='Online — połączono';if(dot)dot.className='sync-dot ok';}
    else{if(txt)txt.textContent='Tryb lokalny — brak połączenia';if(dot)dot.className='sync-dot';}
  }

  function normalizePayload(data){
    let x=data;
    for(let i=0;i<4;i++){
      if(typeof x==='string'){try{x=JSON.parse(x);}catch(_){break;}}
      else if(x&&typeof x==='object'&&typeof x.body==='string'){try{x=JSON.parse(x.body);}catch(_){break;}}
      else break;
    }
    return x;
  }

  async function refreshCentral(){
    if(refreshing)return;
    const accountId=cloud().accountId;
    if(!accountId)return;
    refreshing=true;
    try{
      const r=await fetch(API,{method:'POST',mode:'cors',cache:'no-store',credentials:'omit',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({action:'invite_history',accountId,clientTime:new Date().toISOString(),requestId:'HIST-'+Date.now()})});
      if(!r.ok)throw new Error('HTTP '+r.status);
      let raw; try{raw=await r.json();}catch(_){raw=await r.text();}
      const data=normalizePayload(raw);
      const values=Array.isArray(data?.values)?data.values:(Array.isArray(data)?data:[]);
      const log=read(logKey,{});
      let changed=false;
      for(const row of values){
        if(!Array.isArray(row)||row.length<4)continue;
        const key=String(row[0]||'');
        const rowAccount=String(row[3]||'');
        if(!key.startsWith('invite_sent:')||rowAccount!==String(accountId))continue;
        const person=key.slice('invite_sent:'.length).trim();
        if(!person)continue;
        const messageId=String(row[1]||'').trim();
        const sentAt=String(row[2]||'').trim();
        const prev=log[person]||{};
        const next={...prev,status:'sent',messageId:messageId||'—',sentAt:sentAt||null,source:'central',error:null};
        if(JSON.stringify(prev)!==JSON.stringify(next)){log[person]=next;changed=true;}
      }
      if(changed){
        write(logKey,log);
        document.dispatchEvent(new CustomEvent('bdsm-invite-status-updated'));
      }
      setOnlineState(true);
    }catch(e){
      console.warn('invite_history',e);
      setOnlineState(false);
    }finally{refreshing=false;}
  }

  function panelOpen(){const s=document.querySelector('#view-email-invites');return !!s&&!s.classList.contains('hidden')&&s.style.display!=='none';}
  function install(){
    document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#emailInvitesNav'))setTimeout(refreshCentral,80);},true);
    document.addEventListener('bdsm-sync-complete',()=>setTimeout(refreshCentral,300));
    window.addEventListener('focus',()=>{if(panelOpen())refreshCentral();});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&panelOpen())refreshCentral();});
    setInterval(()=>{if(panelOpen())refreshCentral();},30000);
    setTimeout(refreshCentral,1200);
    window.bdsmRefreshInviteHistory=refreshCentral;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
