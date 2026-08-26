(()=>{
  if(window.__bdsmAgendaCloudSyncInstalled)return;
  window.__bdsmAgendaCloudSyncInstalled=true;

  // Agenda cloud actions are intentionally disabled until the existing Make
  // backend has dedicated routes for agenda_day_save / agenda_check_save /
  // agenda_snapshot_save / agenda_snapshot_pull. Sending those actions to the
  // current sync webhook causes HTTP 400 responses.
  const META='bdsm-app-day-agenda-meta-v1';
  const CLOUD='bdsm-app-cloud-config';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(_){return d}};

  function accountId(){
    const c=read(CLOUD,null);
    return c?.accountId||'';
  }

  async function disabled(){
    window.dispatchEvent(new CustomEvent('bdsm-agenda-cloud-status',{detail:{ok:true,mode:'local_only',message:'Agenda działa lokalnie; synchronizacja chmurowa Agendy oczekuje na trasę backendu.'}}));
    return false;
  }

  function install(){
    window.bdsmAgendaCloud={
      pull:disabled,
      pushDate:disabled,
      pushAll:disabled,
      pushSnapshot:disabled,
      accountId,
      localData:()=>read(META,{})
    };
    disabled();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
