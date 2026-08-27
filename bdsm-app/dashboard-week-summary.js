(()=>{
  if(window.__bdsmDashboardWeekSummaryInstalled)return;
  window.__bdsmDashboardWeekSummaryInstalled=true;
  const K={events:'bdsm-app-events-v3',offences:'bdsm-app-offences-v1',tasks:'bdsm-app-education-tasks-v1',notes:'bdsm-app-written-notes-v1',agenda:'bdsm-app-day-agenda-meta-v1'};
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const norm=s=>String(s||'').toLowerCase();
  const dt=v=>{if(!v)return null;const d=new Date(v);return isNaN(d)?null:d};
  const done=s=>['wykonane','zakończone','zamknięte','done','completed'].includes(norm(s));
  const dayKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  function weekStart(offset=0){const n=new Date(),d=n.getDay()||7;n.setHours(0,0,0,0);n.setDate(n.getDate()-d+1+(offset*7));return n}
  function weekEnd(offset=0){const d=weekStart(offset);d.setDate(d.getDate()+7);return d}
  const inside=(v,offset=0)=>{const d=dt(v);return d&&d>=weekStart(offset)&&d<weekEnd(offset)};
  function stats(offset=0){
    const events=read(K.events,[]),offences=read(K.offences,[]),tasks=read(K.tasks,[]),notes=read(K.notes,[]),agenda=read(K.agenda,{});
    const tasksDone=tasks.filter(x=>done(x.status)&&inside(x.updated_at||x.completed_at||x.due_at||x.created_at,offset)).length;
    const offencesCount=offences.filter(x=>inside(x.occurred_at||x.created_at||x.updated_at,offset)).length;
    const notesCount=notes.filter(x=>inside(x.issued_at||x.date||x.created_at||x.updated_at,offset)).length;
    const points=events.filter(x=>inside(x.start||x.created_at||x.updated_at,offset)).reduce((s,x)=>s+(Number(x.points_delta??x.points??0)||0),0);
    let checked=0,total=0;const start=weekStart(offset);
    for(let i=0;i<7;i++){const d=new Date(start);d.setDate(start.getDate()+i);const m=agenda?.[dayKey(d)]||{};const list=Array.isArray(m.checklist)?m.checklist:[];total+=list.length;checked+=list.filter(x=>x.done).length}
    return {tasksDone,offencesCount,notesCount,points,checklist:total?Math.round(checked/total*100):0,checked,total};
  }
  const trend=(cur,prev,mode='more')=>{if(cur===prev)return{icon:'→',cls:'same',diff:0};const up=cur>prev;const good=mode==='less'? !up : up;return{icon:up?'↑':'↓',cls:good?'good':'bad',diff:cur-prev}};
  const diffText=(d,suffix='')=>d===0?'bez zmian':`${d>0?'+':''}${d}${suffix}`;
  function render(){
    const dash=document.querySelector('#view-dashboard');if(!dash)return;
    let box=document.querySelector('#dashboardWeekSummary');
    if(!box){box=document.createElement('div');box.id='dashboardWeekSummary';box.className='panel';const ref=document.querySelector('#dashboardUpcomingWeekPanel')||document.querySelector('#dashboardTomorrowPanel');if(ref&&ref.nextSibling)dash.insertBefore(box,ref.nextSibling);else dash.appendChild(box)}
    if(!document.querySelector('#dashboardWeekSummaryStyles')){const s=document.createElement('style');s.id='dashboardWeekSummaryStyles';s.textContent='.dws-grid{display:grid;grid-template-columns:repeat(5,minmax(110px,1fr));gap:10px}.dws-kpi{padding:12px;border:1px solid #252d3c;border-radius:12px;background:#111722}.dws-kpi b{display:block;font-size:22px;margin-top:4px}.dws-kpi span{font-size:11px;color:#98a2b3}.dws-trend{margin-top:7px;font-size:11px;font-weight:700}.dws-trend.good{color:#86efac}.dws-trend.bad{color:#fca5a5}.dws-trend.same{color:#cbd5e1}.dws-foot{margin-top:10px;font-size:11px;color:#98a2b3}.dws-prev{margin-top:6px;font-size:10px;color:#7f8a9b}@media(max-width:900px){.dws-grid{grid-template-columns:repeat(2,1fr)}}';document.head.appendChild(s)}
    const x=stats(0),p=stats(-1);
    const tTask=trend(x.tasksDone,p.tasksDone,'more'),tOff=trend(x.offencesCount,p.offencesCount,'less'),tNote=trend(x.notesCount,p.notesCount,'less'),tPoints=trend(x.points,p.points,'more'),tCheck=trend(x.checklist,p.checklist,'more');
    const card=(label,val,prev,t,suffix='')=>`<div class="dws-kpi"><span>${label}</span><b>${val}${suffix}</b><div class="dws-trend ${t.cls}">${t.icon} ${diffText(t.diff,suffix)}</div><div class="dws-prev">Poprzedni tydzień: ${prev}${suffix}</div></div>`;
    box.innerHTML=`<div class="dtp-head"><h3>📊 Podsumowanie tygodnia</h3><span class="dtp-count">vs poprzedni tydzień</span></div><div class="dws-grid">${card('Wykonane zadania',x.tasksDone,p.tasksDone,tTask)}${card('Przewinienia',x.offencesCount,p.offencesCount,tOff)}${card('Uwagi / upomnienia',x.notesCount,p.notesCount,tNote)}${card('Punkty netto',`${x.points>0?'+':''}${x.points}`,`${p.points>0?'+':''}${p.points}`,tPoints)}${card('Checklisty',x.checklist,p.checklist,tCheck,'%')}</div><div class="dws-foot">Checklisty w tym tygodniu: ${x.checked}/${x.total} wykonanych pozycji. Strzałki pokazują wyłącznie zmianę względem poprzedniego tygodnia i nie uruchamiają automatycznych konsekwencji.</div>`;
  }
  const install=()=>{render();['bdsm-day-agenda-updated','bdsm-education-tasks-updated','bdsm-case-linked','bdsm-sync-complete'].forEach(e=>document.addEventListener(e,render));window.addEventListener('storage',render);setInterval(render,60000)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();