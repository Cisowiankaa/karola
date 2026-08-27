(()=>{
  if(window.__bdsmDashboardMonthCompareInstalled)return;
  window.__bdsmDashboardMonthCompareInstalled=true;
  const K={events:'bdsm-app-events-v3',offences:'bdsm-app-offences-v1',tasks:'bdsm-app-education-tasks-v1',notes:'bdsm-app-written-notes-v1',agenda:'bdsm-app-day-agenda-meta-v1'};
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const norm=s=>String(s||'').toLowerCase();
  const done=s=>['wykonane','zakończone','zamknięte','done','completed'].includes(norm(s));
  const dt=v=>{if(!v)return null;const d=new Date(v);return isNaN(d)?null:d};
  const startMonth=(offset=0)=>{const n=new Date();return new Date(n.getFullYear(),n.getMonth()+offset,1)};
  const endMonth=(offset=0)=>{const n=new Date();return new Date(n.getFullYear(),n.getMonth()+offset+1,1)};
  const inside=(v,offset)=>{const d=dt(v);return d&&d>=startMonth(offset)&&d<endMonth(offset)};
  const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const monthLabel=o=>startMonth(o).toLocaleDateString('pl-PL',{month:'long',year:'numeric'});
  function stats(offset){
    const events=read(K.events,[]),offences=read(K.offences,[]),tasks=read(K.tasks,[]),notes=read(K.notes,[]),agenda=read(K.agenda,{});
    const tasksDone=tasks.filter(x=>done(x.status)&&inside(x.updated_at||x.completed_at||x.due_at||x.created_at,offset)).length;
    const offencesCount=offences.filter(x=>inside(x.occurred_at||x.created_at||x.updated_at,offset)).length;
    const notesCount=notes.filter(x=>inside(x.issued_at||x.date||x.created_at||x.updated_at,offset)).length;
    const points=events.filter(x=>inside(x.start||x.created_at||x.updated_at,offset)).reduce((s,x)=>s+(Number(x.points_delta??x.points??0)||0),0);
    let checked=0,total=0; const a=startMonth(offset),b=endMonth(offset);
    for(let d=new Date(a);d<b;d.setDate(d.getDate()+1)){const m=agenda?.[key(d)]||{};const list=Array.isArray(m.checklist)?m.checklist:[];total+=list.length;checked+=list.filter(x=>x.done).length}
    return {tasksDone,offencesCount,notesCount,points,checklist:total?Math.round(checked/total*100):0};
  }
  const trend=(a,b,inverse=false)=>{if(a===b)return{arrow:'→',cls:'same',delta:0};const up=a>b;const good=inverse?!up:up;return{arrow:up?'↑':'↓',cls:good?'good':'bad',delta:a-b}};
  function openMonthly(){
    const btn=document.querySelector('#monthlyReportsNav,#reportsMonthlyNav,[data-view="monthly-reports"],[data-target="monthly-reports"]');
    if(btn){btn.click();return}
    document.querySelector('#reportsNav')?.click();
    setTimeout(()=>document.querySelector('#monthlyReportsNav,#reportsMonthlyNav,[data-view="monthly-reports"],[data-target="monthly-reports"]')?.click(),120);
  }
  function render(){
    const dash=document.querySelector('#view-dashboard');if(!dash)return;
    let box=document.querySelector('#dashboardMonthCompare');if(!box){box=document.createElement('div');box.id='dashboardMonthCompare';box.className='panel';const ref=document.querySelector('#dashboardWeekSummary')||document.querySelector('#dashboardUpcomingWeekPanel');if(ref&&ref.nextSibling)dash.insertBefore(box,ref.nextSibling);else dash.appendChild(box);box.addEventListener('click',e=>{if(e.target.closest('[data-open-monthly-report]'))openMonthly()})}
    if(!document.querySelector('#dashboardMonthCompareStyles')){const s=document.createElement('style');s.id='dashboardMonthCompareStyles';s.textContent='.dmc-grid{display:grid;grid-template-columns:repeat(5,minmax(120px,1fr));gap:10px}.dmc-card{padding:12px;border:1px solid #252d3c;border-radius:12px;background:#111722;cursor:pointer}.dmc-card:hover{border-color:#465168}.dmc-card b{display:block;font-size:20px;margin-top:4px}.dmc-sub{font-size:11px;color:#98a2b3}.dmc-trend{font-size:12px;margin-top:6px}.dmc-trend.good{color:#8bdc9b}.dmc-trend.bad{color:#ff9b9b}.dmc-trend.same{color:#cbd5e1}.dmc-actions{display:flex;justify-content:flex-end;margin-top:10px}@media(max-width:900px){.dmc-grid{grid-template-columns:repeat(2,1fr)}}';document.head.appendChild(s)}
    const cur=stats(0),prev=stats(-1),items=[['Wykonane zadania','tasksDone',false],['Przewinienia','offencesCount',true],['Uwagi / upomnienia','notesCount',true],['Punkty netto','points',false],['Checklisty','checklist',false]];
    box.innerHTML=`<div class="dtp-head"><h3>📅 Miesiąc vs poprzedni miesiąc</h3><span class="dtp-count">${monthLabel(0)} vs ${monthLabel(-1)}</span></div><div class="dmc-grid">${items.map(([label,k,inv])=>{const t=trend(cur[k],prev[k],inv),suffix=k==='checklist'?'%':'';return `<div class="dmc-card" data-open-monthly-report><span class="dmc-sub">${label}</span><b>${cur[k]}${suffix}</b><div class="dmc-trend ${t.cls}">${t.arrow} poprzednio: ${prev[k]}${suffix}${t.delta?` · zmiana ${t.delta>0?'+':''}${t.delta}${suffix}`:''}</div></div>`}).join('')}</div><div class="dmc-actions"><button class="btn" data-open-monthly-report>Otwórz raport miesięczny</button></div><div class="dws-foot">Trend służy wyłącznie do analizy i nie uruchamia automatycznych konsekwencji ani zmian terminów.</div>`;
  }
  const install=()=>{render();['bdsm-day-agenda-updated','bdsm-education-tasks-updated','bdsm-case-linked','bdsm-sync-complete'].forEach(e=>document.addEventListener(e,render));window.addEventListener('storage',render);setInterval(render,60000)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();