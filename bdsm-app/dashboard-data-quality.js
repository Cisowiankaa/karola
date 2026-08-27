(()=>{
  if(window.__bdsmDashboardDataQualityInstalled)return;
  window.__bdsmDashboardDataQualityInstalled=true;
  const K={events:'bdsm-app-events-v3',offences:'bdsm-app-offences-v1',tasks:'bdsm-app-education-tasks-v1',notes:'bdsm-app-written-notes-v1',hours:'bdsm-app-hourly-reports-v1',links:'bdsm-app-event-offence-links-v1'};
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const idOf=(x,t)=>x.event_id||x.offence_id||x.przewinienie_id||x.task_id||x.note_id||x.report_id||x.id||'';
  const dateOf=(x,t)=>t==='events'?(x.start||x.created_at||x.updated_at):t==='offences'?(x.occurred_at||x.created_at||x.updated_at):t==='tasks'?(x.due_at||x.created_at||x.updated_at):t==='notes'?(x.issued_at||x.date||x.created_at||x.updated_at):(x.date||x.created_at||x.updated_at);
  function audit(){
    const issues=[]; const sets={};
    for(const [type,key] of Object.entries(K)){
      if(type==='links')continue;
      const arr=read(key,[]); sets[type]=new Set(arr.map(x=>String(idOf(x,type))).filter(Boolean));
      arr.forEach((x,i)=>{
        const id=idOf(x,type), label=x.title||x.type||x.text||`${type} #${i+1}`;
        if(!id)issues.push({type,label,kind:'Brak ID'});
        if(!dateOf(x,type))issues.push({type,label,kind:'Brak daty'});
        if(!x.status && type!=='hours')issues.push({type,label,kind:'Brak statusu'});
      });
    }
    const links=read(K.links,[]);
    links.forEach((l,i)=>{
      const eid=String(l.event_id||l.source_event_id||''); const oid=String(l.offence_id||l.przewinienie_id||'');
      if(eid && !sets.events?.has(eid))issues.push({type:'links',label:`Powiązanie #${i+1}`,kind:'Brak wydarzenia źródłowego'});
      if(oid && !sets.offences?.has(oid))issues.push({type:'links',label:`Powiązanie #${i+1}`,kind:'Brak przewinienia źródłowego'});
    });
    return issues;
  }
  function render(){
    const dash=document.querySelector('#view-dashboard'); if(!dash)return;
    let box=document.querySelector('#dashboardDataQuality');
    if(!box){box=document.createElement('div');box.id='dashboardDataQuality';box.className='panel';dash.appendChild(box)}
    const issues=audit(); const groups=issues.reduce((a,x)=>(a[x.kind]=(a[x.kind]||0)+1,a),{});
    box.innerHTML=`<div class="dtp-head"><h3>🧪 Jakość danych</h3><span class="dtp-count">${issues.length?issues.length+' problemów':'bez wykrytych problemów'}</span></div>${issues.length?`<div class="dws-grid">${Object.entries(groups).map(([k,v])=>`<div class="dws-kpi"><span>${esc(k)}</span><b>${v}</b></div>`).join('')}</div><div style="margin-top:12px">${issues.slice(0,10).map(x=>`<div style="padding:8px 0;border-top:1px solid #222a39"><strong>${esc(x.kind)}</strong> · ${esc(x.label)} <span style="color:#98a2b3">(${esc(x.type)})</span></div>`).join('')}</div>`:'<div class="empty">Dane wyglądają spójnie: nie wykryto brakujących ID, dat, statusów ani osieroconych powiązań.</div>'}<div class="dws-foot">Panel tylko wykrywa niespójności. Nie zmienia danych automatycznie.</div>`;
  }
  const install=()=>{render();['bdsm-day-agenda-updated','bdsm-education-tasks-updated','bdsm-case-linked','bdsm-sync-complete'].forEach(e=>document.addEventListener(e,render));window.addEventListener('storage',render);setInterval(render,60000)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();