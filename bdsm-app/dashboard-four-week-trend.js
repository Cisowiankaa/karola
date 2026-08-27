(()=>{
  if(window.__bdsmDashboardFourWeekTrendInstalled)return;
  window.__bdsmDashboardFourWeekTrendInstalled=true;
  const K={events:'bdsm-app-events-v3',offences:'bdsm-app-offences-v1',tasks:'bdsm-app-education-tasks-v1',notes:'bdsm-app-written-notes-v1',agenda:'bdsm-app-day-agenda-meta-v1'};
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const norm=s=>String(s||'').toLowerCase();
  const done=s=>['wykonane','zakończone','zamknięte','done','completed'].includes(norm(s));
  const dt=v=>{if(!v)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d};
  const dayKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  function weekStart(offset=0){const n=new Date(),d=n.getDay()||7;n.setHours(0,0,0,0);n.setDate(n.getDate()-d+1+(offset*7));return n}
  function weekEnd(offset=0){const d=weekStart(offset);d.setDate(d.getDate()+7);return d}
  const inside=(v,offset)=>{const d=dt(v);return d&&d>=weekStart(offset)&&d<weekEnd(offset)};
  function stats(offset){
    const events=read(K.events,[]),offences=read(K.offences,[]),tasks=read(K.tasks,[]),notes=read(K.notes,[]),agenda=read(K.agenda,{});
    let checked=0,total=0;const start=weekStart(offset);
    for(let i=0;i<7;i++){const d=new Date(start);d.setDate(start.getDate()+i);const m=agenda?.[dayKey(d)]||{};const list=Array.isArray(m.checklist)?m.checklist:[];total+=list.length;checked+=list.filter(x=>x.done).length}
    return {
      tasks:tasks.filter(x=>done(x.status)&&inside(x.updated_at||x.completed_at||x.due_at||x.created_at,offset)).length,
      offences:offences.filter(x=>inside(x.occurred_at||x.created_at||x.updated_at,offset)).length,
      notes:notes.filter(x=>inside(x.issued_at||x.date||x.created_at||x.updated_at,offset)).length,
      points:events.filter(x=>inside(x.start||x.created_at||x.updated_at,offset)).reduce((s,x)=>s+(Number(x.points_delta??x.points??0)||0),0),
      checklist:total?Math.round(checked/total*100):0
    };
  }
  function bars(values){const max=Math.max(...values.map(v=>Math.abs(v)),1);return values.map((v,i)=>`<div class="dfw-bar-wrap"><div class="dfw-val">${v}</div><div class="dfw-bar" style="height:${Math.max(8,Math.round(Math.abs(v)/max*58))}px"></div><div class="dfw-lab">${i===3?'Teraz':`-${3-i} t.`}</div></div>`).join('')}
  function render(){
    const dash=document.querySelector('#view-dashboard');if(!dash)return;
    let box=document.querySelector('#dashboardFourWeekTrend');
    if(!box){box=document.createElement('div');box.id='dashboardFourWeekTrend';box.className='panel';const ref=document.querySelector('#dashboardWeekSummary');if(ref&&ref.nextSibling)dash.insertBefore(box,ref.nextSibling);else dash.appendChild(box)}
    if(!document.querySelector('#dashboardFourWeekTrendStyles')){const s=document.createElement('style');s.id='dashboardFourWeekTrendStyles';s.textContent='.dfw-grid{display:grid;grid-template-columns:repeat(5,minmax(140px,1fr));gap:10px}.dfw-card{border:1px solid #252d3c;border-radius:12px;padding:12px;background:#111722}.dfw-title{font-size:11px;color:#98a2b3;margin-bottom:8px}.dfw-bars{height:92px;display:flex;align-items:flex-end;gap:8px}.dfw-bar-wrap{flex:1;text-align:center}.dfw-bar{width:100%;max-width:24px;margin:0 auto;border-radius:6px 6px 2px 2px;background:currentColor;opacity:.55}.dfw-val,.dfw-lab{font-size:10px;color:#98a2b3}.dfw-foot{font-size:11px;color:#98a2b3;margin-top:10px}@media(max-width:1000px){.dfw-grid{grid-template-columns:repeat(2,1fr)}}';document.head.appendChild(s)}
    const w=[-3,-2,-1,0].map(stats);
    const metric=(label,key,suffix='')=>`<div class="dfw-card"><div class="dfw-title">${label}</div><div class="dfw-bars">${bars(w.map(x=>`${x[key]}${suffix}`.replace('%','')))}</div></div>`;
    box.innerHTML=`<div class="dtp-head"><h3>📈 Trend 4 tygodni</h3><span class="dtp-count">ostatnie 4 tygodnie</span></div><div class="dfw-grid">${metric('Wykonane zadania','tasks')}${metric('Przewinienia','offences')}${metric('Uwagi / upomnienia','notes')}${metric('Punkty netto','points')}${metric('Checklisty %','checklist')}</div><div class="dfw-foot">Trend ma charakter informacyjny. Nie uruchamia żadnych automatycznych konsekwencji ani zmian terminów.</div>`;
  }
  const install=()=>{render();['bdsm-day-agenda-updated','bdsm-education-tasks-updated','bdsm-case-linked','bdsm-sync-complete'].forEach(e=>document.addEventListener(e,render));window.addEventListener('storage',render);setInterval(render,60000)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();