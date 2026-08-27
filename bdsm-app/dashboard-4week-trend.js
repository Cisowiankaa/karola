(()=>{
  if(window.__bdsmDashboard4WeekTrendInstalled)return;
  window.__bdsmDashboard4WeekTrendInstalled=true;
  const K={events:'bdsm-app-events-v3',tasks:'bdsm-app-education-tasks-v1',agenda:'bdsm-app-day-agenda-meta-v1'};
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const norm=s=>String(s||'').toLowerCase();
  const done=s=>['wykonane','zakończone','zamknięte','done','completed'].includes(norm(s));
  const dt=v=>{if(!v)return null;const d=new Date(v);return isNaN(d)?null:d};
  const dayKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  function weekStart(offset=0){const n=new Date(),w=n.getDay()||7;n.setHours(0,0,0,0);n.setDate(n.getDate()-w+1+offset*7);return n}
  function weekEnd(offset=0){const d=weekStart(offset);d.setDate(d.getDate()+7);return d}
  const inside=(v,o)=>{const d=dt(v);return d&&d>=weekStart(o)&&d<weekEnd(o)};
  function stats(o){
    const events=read(K.events,[]),tasks=read(K.tasks,[]),agenda=read(K.agenda,{});
    const points=events.filter(x=>inside(x.start||x.created_at||x.updated_at,o)).reduce((s,x)=>s+(Number(x.points_delta??x.points??0)||0),0);
    const tasksDone=tasks.filter(x=>done(x.status)&&inside(x.updated_at||x.completed_at||x.due_at||x.created_at,o)).length;
    let checked=0,total=0;const start=weekStart(o);
    for(let i=0;i<7;i++){const d=new Date(start);d.setDate(start.getDate()+i);const m=agenda?.[dayKey(d)]||{};const list=Array.isArray(m.checklist)?m.checklist:[];total+=list.length;checked+=list.filter(x=>x.done).length}
    return{points,tasksDone,checklist:total?Math.round(checked/total*100):0};
  }
  const label=o=>{const a=weekStart(o),b=new Date(a);b.setDate(a.getDate()+6);return `${a.toLocaleDateString('pl-PL',{day:'2-digit',month:'2-digit'})}–${b.toLocaleDateString('pl-PL',{day:'2-digit',month:'2-digit'})}`};
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  function bars(rows,key,maxAbs){return rows.map(r=>{const v=r[key],pct=maxAbs?Math.max(4,Math.round(Math.abs(v)/maxAbs*100)):4;return `<div class="d4-row"><span>${esc(r.label)}</span><div class="d4-track"><i style="width:${pct}%"></i></div><b>${key==='checklist'?v+'%':v}</b></div>`}).join('')}
  function render(){
    const dash=document.querySelector('#view-dashboard');if(!dash)return;
    let box=document.querySelector('#dashboard4WeekTrend');
    if(!box){box=document.createElement('div');box.id='dashboard4WeekTrend';box.className='panel';const ref=document.querySelector('#dashboardWeekSummary');if(ref&&ref.nextSibling)dash.insertBefore(box,ref.nextSibling);else dash.appendChild(box)}
    if(!document.querySelector('#dashboard4WeekTrendStyles')){const s=document.createElement('style');s.id='dashboard4WeekTrendStyles';s.textContent='.d4-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.d4-card{padding:12px;border:1px solid #252d3c;border-radius:12px;background:#0d131d}.d4-card h4{margin:0 0 10px}.d4-row{display:grid;grid-template-columns:82px 1fr 48px;gap:8px;align-items:center;margin:9px 0;font-size:11px}.d4-track{height:8px;border-radius:999px;background:#222a39;overflow:hidden}.d4-track i{display:block;height:100%;background:currentColor;opacity:.75}.d4-note{font-size:11px;color:#98a2b3;margin-top:10px}@media(max-width:900px){.d4-grid{grid-template-columns:1fr}}';document.head.appendChild(s)}
    const rows=[-3,-2,-1,0].map(o=>({label:label(o),...stats(o)}));
    const maxP=Math.max(1,...rows.map(x=>Math.abs(x.points))),maxT=Math.max(1,...rows.map(x=>x.tasksDone)),maxC=100;
    box.innerHTML=`<div class="dtp-head"><h3>📈 Trend 4 tygodni</h3><span class="dtp-count">ostatnie 4 tygodnie</span></div><div class="d4-grid"><div class="d4-card"><h4>Punkty</h4>${bars(rows,'points',maxP)}</div><div class="d4-card"><h4>Wykonane zadania</h4>${bars(rows,'tasksDone',maxT)}</div><div class="d4-card"><h4>Checklisty</h4>${bars(rows,'checklist',maxC)}</div></div><div class="d4-note">Wykres ma charakter informacyjny i nie uruchamia żadnych automatycznych konsekwencji ani zmian planu.</div>`;
  }
  const install=()=>{render();['bdsm-day-agenda-updated','bdsm-education-tasks-updated','bdsm-sync-complete'].forEach(e=>document.addEventListener(e,render));window.addEventListener('storage',render);setInterval(render,60000)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();