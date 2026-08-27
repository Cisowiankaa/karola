(()=>{
  if(window.__bdsmDashboardRangeAnalysisInstalled)return;
  window.__bdsmDashboardRangeAnalysisInstalled=true;
  const K={events:'bdsm-app-events-v3',offences:'bdsm-app-offences-v1',tasks:'bdsm-app-education-tasks-v1',notes:'bdsm-app-written-notes-v1',agenda:'bdsm-app-day-agenda-meta-v1'};
  const PREF='bdsm-app-dashboard-range-v1';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const norm=s=>String(s||'').toLowerCase();
  const done=s=>['wykonane','zakończone','zamknięte','done','completed'].includes(norm(s));
  const dt=v=>{if(!v)return null;const d=new Date(v);return isNaN(d)?null:d};
  const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const start=days=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-days+1);return d};
  const inside=(v,days)=>{const d=dt(v);return d&&d>=start(days)};
  function stats(days){
    const events=read(K.events,[]),offences=read(K.offences,[]),tasks=read(K.tasks,[]),notes=read(K.notes,[]),agenda=read(K.agenda,{});
    let checked=0,total=0;for(let i=0;i<days;i++){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);const m=agenda?.[key(d)]||{};const list=Array.isArray(m.checklist)?m.checklist:[];total+=list.length;checked+=list.filter(x=>x.done).length}
    return {
      tasks:tasks.filter(x=>done(x.status)&&inside(x.updated_at||x.completed_at||x.due_at||x.created_at,days)).length,
      offences:offences.filter(x=>inside(x.occurred_at||x.created_at||x.updated_at,days)).length,
      notes:notes.filter(x=>inside(x.issued_at||x.date||x.created_at||x.updated_at,days)).length,
      points:events.filter(x=>inside(x.start||x.created_at||x.updated_at,days)).reduce((s,x)=>s+(Number(x.points_delta??x.points??0)||0),0),
      checklist:total?Math.round(checked/total*100):0,checked,total
    };
  }
  function render(){
    const dash=document.querySelector('#view-dashboard');if(!dash)return;let days=Number(localStorage.getItem(PREF)||30);if(![7,30,90].includes(days))days=30;
    let box=document.querySelector('#dashboardRangeAnalysis');if(!box){box=document.createElement('div');box.id='dashboardRangeAnalysis';box.className='panel';const ref=document.querySelector('#dashboardFourWeekTrend')||document.querySelector('#dashboardWeekSummary');if(ref&&ref.nextSibling)dash.insertBefore(box,ref.nextSibling);else dash.appendChild(box);box.addEventListener('click',e=>{const b=e.target.closest('[data-range-days]');if(!b)return;localStorage.setItem(PREF,b.dataset.rangeDays);render()})}
    if(!document.querySelector('#dashboardRangeAnalysisStyles')){const s=document.createElement('style');s.id='dashboardRangeAnalysisStyles';s.textContent='.dra-head{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}.dra-filters{display:flex;gap:6px}.dra-filters .btn.active{outline:2px solid currentColor}.dra-grid{display:grid;grid-template-columns:repeat(5,minmax(120px,1fr));gap:10px;margin-top:12px}.dra-kpi{padding:12px;border:1px solid #252d3c;border-radius:12px;background:#111722}.dra-kpi span{font-size:11px;color:#98a2b3}.dra-kpi b{display:block;font-size:22px;margin-top:4px}@media(max-width:900px){.dra-grid{grid-template-columns:repeat(2,1fr)}}';document.head.appendChild(s)}
    const x=stats(days);box.innerHTML=`<div class="dra-head"><div><h3 style="margin:0">🧭 Zakres analizy</h3><div class="dtp-count">Podsumowanie wybranego okresu</div></div><div class="dra-filters">${[7,30,90].map(n=>`<button class="btn ${n===days?'active':''}" data-range-days="${n}">${n} dni</button>`).join('')}</div></div><div class="dra-grid"><div class="dra-kpi"><span>Wykonane zadania</span><b>${x.tasks}</b></div><div class="dra-kpi"><span>Przewinienia</span><b>${x.offences}</b></div><div class="dra-kpi"><span>Uwagi / upomnienia</span><b>${x.notes}</b></div><div class="dra-kpi"><span>Punkty netto</span><b>${x.points>0?'+':''}${x.points}</b></div><div class="dra-kpi"><span>Checklisty</span><b>${x.checklist}%</b></div></div><div class="dws-foot">Checklisty: ${x.checked}/${x.total}. Panel służy wyłącznie do analizy i nie uruchamia automatycznych konsekwencji.</div>`;
  }
  const install=()=>{render();['bdsm-day-agenda-updated','bdsm-education-tasks-updated','bdsm-case-linked','bdsm-sync-complete'].forEach(e=>document.addEventListener(e,render));window.addEventListener('storage',render);setInterval(render,60000)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();