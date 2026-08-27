(()=>{
  if(window.__bdsmDashboardWeekSummaryInstalled)return;
  window.__bdsmDashboardWeekSummaryInstalled=true;
  const K={events:'bdsm-app-events-v3',offences:'bdsm-app-offences-v1',tasks:'bdsm-app-education-tasks-v1',notes:'bdsm-app-written-notes-v1',agenda:'bdsm-app-day-agenda-meta-v1'};
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const norm=s=>String(s||'').toLowerCase();
  const dt=v=>{if(!v)return null;const d=new Date(v);return isNaN(d)?null:d};
  const startWeek=()=>{const n=new Date(),d=n.getDay()||7;n.setHours(0,0,0,0);n.setDate(n.getDate()-d+1);return n};
  const endWeek=()=>{const d=startWeek();d.setDate(d.getDate()+7);return d};
  const inside=v=>{const d=dt(v);return d&&d>=startWeek()&&d<endWeek()};
  const done=s=>['wykonane','zakończone','zamknięte','done','completed'].includes(norm(s));
  const dayKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  function stats(){
    const events=read(K.events,[]),offences=read(K.offences,[]),tasks=read(K.tasks,[]),notes=read(K.notes,[]),agenda=read(K.agenda,{});
    const tasksDone=tasks.filter(x=>done(x.status)&&inside(x.updated_at||x.completed_at||x.due_at||x.created_at)).length;
    const offencesCount=offences.filter(x=>inside(x.occurred_at||x.created_at||x.updated_at)).length;
    const notesCount=notes.filter(x=>inside(x.issued_at||x.date||x.created_at||x.updated_at)).length;
    const points=events.filter(x=>inside(x.start||x.created_at||x.updated_at)).reduce((s,x)=>s+(Number(x.points_delta??x.points??0)||0),0);
    let checked=0,total=0;
    const start=startWeek();
    for(let i=0;i<7;i++){
      const d=new Date(start);d.setDate(start.getDate()+i);const m=agenda?.[dayKey(d)]||{};
      const list=Array.isArray(m.checklist)?m.checklist:[];total+=list.length;checked+=list.filter(x=>x.done).length;
    }
    const checklist=total?Math.round(checked/total*100):0;
    return {tasksDone,offencesCount,notesCount,points,checklist,checked,total};
  }
  function render(){
    const dash=document.querySelector('#view-dashboard');if(!dash)return;
    let box=document.querySelector('#dashboardWeekSummary');
    if(!box){box=document.createElement('div');box.id='dashboardWeekSummary';box.className='panel';const ref=document.querySelector('#dashboardUpcomingWeekPanel')||document.querySelector('#dashboardTomorrowPanel');if(ref&&ref.nextSibling)dash.insertBefore(box,ref.nextSibling);else dash.appendChild(box)}
    if(!document.querySelector('#dashboardWeekSummaryStyles')){const s=document.createElement('style');s.id='dashboardWeekSummaryStyles';s.textContent='.dws-grid{display:grid;grid-template-columns:repeat(5,minmax(110px,1fr));gap:10px}.dws-kpi{padding:12px;border:1px solid #252d3c;border-radius:12px;background:#111722}.dws-kpi b{display:block;font-size:22px;margin-top:4px}.dws-kpi span{font-size:11px;color:#98a2b3}.dws-foot{margin-top:10px;font-size:11px;color:#98a2b3}@media(max-width:900px){.dws-grid{grid-template-columns:repeat(2,1fr)}}';document.head.appendChild(s)}
    const x=stats();
    box.innerHTML=`<div class="dtp-head"><h3>📊 Podsumowanie tygodnia</h3><span class="dtp-count">poniedziałek–niedziela</span></div><div class="dws-grid"><div class="dws-kpi"><span>Wykonane zadania</span><b>${x.tasksDone}</b></div><div class="dws-kpi"><span>Przewinienia</span><b>${x.offencesCount}</b></div><div class="dws-kpi"><span>Uwagi / upomnienia</span><b>${x.notesCount}</b></div><div class="dws-kpi"><span>Punkty netto</span><b>${x.points>0?'+':''}${x.points}</b></div><div class="dws-kpi"><span>Checklisty</span><b>${x.checklist}%</b></div></div><div class="dws-foot">Checklisty: ${x.checked}/${x.total} wykonanych pozycji. Dane są wyłącznie podsumowaniem i nie uruchamiają automatycznych konsekwencji.</div>`;
  }
  const install=()=>{render();['bdsm-day-agenda-updated','bdsm-education-tasks-updated','bdsm-case-linked','bdsm-sync-complete'].forEach(e=>document.addEventListener(e,render));window.addEventListener('storage',render);setInterval(render,60000)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();