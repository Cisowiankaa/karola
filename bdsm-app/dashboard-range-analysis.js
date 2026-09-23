(()=>{
  if(window.__bdsmDashboardRangeAnalysisV2Installed)return;
  window.__bdsmDashboardRangeAnalysisV2Installed=true;
  const K={events:'bdsm-app-events-v3',offences:'bdsm-app-offences-v1',tasks:'bdsm-app-education-tasks-v1',notes:'bdsm-app-written-notes-v1',agenda:'bdsm-app-day-agenda-meta-v1'};
  const PREF='bdsm-app-dashboard-range-v1';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const norm=s=>String(s||'').toLowerCase();
  const done=s=>['wykonane','zakończone','zamknięte','done','completed'].includes(norm(s));
  const dt=v=>{if(!v)return null;const d=new Date(v);return isNaN(d)?null:d};
  const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  function bounds(days,block=0){const end=new Date();end.setHours(0,0,0,0);end.setDate(end.getDate()+1-(block*days));const start=new Date(end);start.setDate(start.getDate()-days);return{start,end}}
  const inside=(v,days,block=0)=>{const d=dt(v),b=bounds(days,block);return d&&d>=b.start&&d<b.end};
  function stats(days,block=0){
    const events=read(K.events,[]),offences=read(K.offences,[]),tasks=read(K.tasks,[]),notes=read(K.notes,[]),agenda=read(K.agenda,{}),b=bounds(days,block);
    let checked=0,total=0;
    for(let i=0;i<days;i++){const d=new Date(b.end);d.setDate(b.end.getDate()-1-i);const m=agenda?.[key(d)]||{};const list=Array.isArray(m.checklist)?m.checklist:[];total+=list.length;checked+=list.filter(x=>x.done).length}
    return {tasks:tasks.filter(x=>done(x.status)&&inside(x.updated_at||x.completed_at||x.due_at||x.created_at,days,block)).length,offences:offences.filter(x=>inside(x.occurred_at||x.created_at||x.updated_at,days,block)).length,notes:notes.filter(x=>inside(x.issued_at||x.date||x.created_at||x.updated_at,days,block)).length,points:events.filter(x=>inside(x.start||x.created_at||x.updated_at,days,block)).reduce((s,x)=>s+(Number(x.points_delta??x.points??0)||0),0),checklist:total?Math.round(checked/total*100):0,checked,total};
  }
  const trend=(cur,prev,mode='more')=>{if(cur===prev)return{icon:'→',cls:'same',diff:0};const up=cur>prev,good=mode==='less'?!up:up;return{icon:up?'↑':'↓',cls:good?'good':'bad',diff:cur-prev}};
  const diffText=(d,suffix='')=>d===0?'bez zmian':`${d>0?'+':''}${d}${suffix}`;
  function render(){
    const dash=document.querySelector('#view-dashboard');if(!dash)return;let days=Number(localStorage.getItem(PREF)||30);if(![7,30,90].includes(days))days=30;
    let box=document.querySelector('#dashboardRangeAnalysis');if(!box){box=document.createElement('div');box.id='dashboardRangeAnalysis';box.className='panel';const ref=document.querySelector('#dashboardFourWeekTrend')||document.querySelector('#dashboardWeekSummary');if(ref&&ref.nextSibling)dash.insertBefore(box,ref.nextSibling);else dash.appendChild(box);box.addEventListener('click',e=>{const b=e.target.closest('[data-range-days]');if(!b)return;localStorage.setItem(PREF,b.dataset.rangeDays);render()})}
    if(!document.querySelector('#dashboardRangeAnalysisStylesV2')){document.querySelector('#dashboardRangeAnalysisStyles')?.remove();const s=document.createElement('style');s.id='dashboardRangeAnalysisStylesV2';s.textContent='.dra-head{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}.dra-filters{display:flex;gap:6px}.dra-filters .btn.active{outline:2px solid currentColor}.dra-grid{display:grid;grid-template-columns:repeat(5,minmax(120px,1fr));gap:10px;margin-top:12px}.dra-kpi{padding:12px;border:1px solid #252d3c;border-radius:12px;background:#111722}.dra-kpi span{font-size:11px;color:#98a2b3}.dra-kpi b{display:block;font-size:22px;margin-top:4px}.dra-trend{margin-top:7px;font-size:11px;font-weight:700}.dra-trend.good{color:#86efac}.dra-trend.bad{color:#fca5a5}.dra-trend.same{color:#cbd5e1}.dra-prev{margin-top:5px;font-size:10px;color:#7f8a9b}@media(max-width:900px){.dra-grid{grid-template-columns:repeat(2,1fr)}}';document.head.appendChild(s)}
    const x=stats(days,0),p=stats(days,1),tTask=trend(x.tasks,p.tasks,'more'),tOff=trend(x.offences,p.offences,'less'),tNote=trend(x.notes,p.notes,'less'),tPoints=trend(x.points,p.points,'more'),tCheck=trend(x.checklist,p.checklist,'more');
    const card=(label,val,prev,t,suffix='')=>`<div class="dra-kpi"><span>${label}</span><b>${val}${suffix}</b><div class="dra-trend ${t.cls}">${t.icon} ${diffText(t.diff,suffix)}</div><div class="dra-prev">Poprzednie ${days} dni: ${prev}${suffix}</div></div>`;
    box.innerHTML=`<div class="dra-head"><div><h3 style="margin:0">🧭 Zakres analizy</h3><div class="dtp-count">Ostatnie ${days} dni vs wcześniejsze ${days} dni</div></div><div class="dra-filters">${[7,30,90].map(n=>`<button class="btn ${n===days?'active':''}" data-range-days="${n}">${n} dni</button>`).join('')}</div></div><div class="dra-grid">${card('Wykonane zadania',x.tasks,p.tasks,tTask)}${card('Przewinienia',x.offences,p.offences,tOff)}${card('Uwagi / upomnienia',x.notes,p.notes,tNote)}${card('Punkty netto',`${x.points>0?'+':''}${x.points}`,`${p.points>0?'+':''}${p.points}`,tPoints)}${card('Checklisty',x.checklist,p.checklist,tCheck,'%')}</div><div class="dws-foot">Checklisty w bieżącym okresie: ${x.checked}/${x.total}. Trendy są wyłącznie informacyjne i nie uruchamiają automatycznych konsekwencji.</div>`;
  }
  const install=()=>{render();['bdsm-day-agenda-updated','bdsm-education-tasks-updated','bdsm-case-linked','bdsm-sync-complete'].forEach(e=>document.addEventListener(e,render));window.addEventListener('storage',render);setInterval(render,60000)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();