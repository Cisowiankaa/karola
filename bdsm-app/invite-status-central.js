(() => {
  const API='https://hook.eu1.make.com/gw8nr0beqtbymtd2xgiga3wn7qfjhp25';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(_){return d}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const logKey='bdsm-app-invite-log-v1';
  const cloud=()=>read('bdsm-app-cloud-config',{});
  async function pullOne(person){
    const accountId=cloud().accountId;if(!accountId||!person)return null;
    const r=await fetch(API,{method:'POST',mode:'cors',cache:'no-store',credentials:'omit',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({action:'invite_status',person,accountId,clientTime:new Date().toISOString()})});
    if(!r.ok)throw new Error('HTTP '+r.status);
    const data=await r.json();
    if(data&&data.status==='sent'&&data.messageId){
      const log=read(logKey,{});
      log[person]={...(log[person]||{}),status:'sent',messageId:data.messageId,sentAt:data.sentAt||new Date().toISOString(),source:'central'};
      write(logKey,log);
      return data;
    }
    return null;
  }
  async function refreshCentral(){
    const list=read('bdsm-app-access',[]).filter(x=>x&&x.person&&!x.revoked);
    if(!list.length)return;
    await Promise.allSettled(list.map(x=>pullOne(x.person)));
    const nav=document.querySelector('#emailInvitesNav');
    if(nav&&nav.classList.contains('active')) nav.click();
  }
  function install(){
    const nav=document.querySelector('#emailInvitesNav');
    if(nav&&!nav.dataset.centralInviteInstalled){
      nav.dataset.centralInviteInstalled='1';
      nav.addEventListener('click',()=>setTimeout(refreshCentral,50));
    }
    setTimeout(refreshCentral,800);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
