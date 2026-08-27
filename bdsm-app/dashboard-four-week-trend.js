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
  const fmt=d=>d.toLocaleDateString('pl-PL',{day:'2-digit',month:'2-digit'});
  function stats(offset){
    const events=read(K.events,[]),offences=read(K.offences,[]),tasks=read(K.tasks,[]),notes=read(K.notes,[]),agenda=read(K.agenda,{});
    let checked=0,total=0;const start=weekStart(offset);
    for(let i=0;i<7;i++){const d=new Date(start);d.setDate(start.getDate()+i);const m=agenda?.[dayKey(d)]||{};const list=Array.isArray(m.checklist)?m.checklist:[];total+=list.length;checked+=list.filter(x=>x.done).length}
    return {
      offset,start,end:new Date(weekEnd(offset).getTime()-1),
      tasks:tasks.filter(x=>done(x.status)&&inside(x.updated_at||x.completed_at||x.due_at||x.created_at,offset)).length,
      offences:offences.filter(x=>inside(x.occurred_at||x.created_at||x.updated_at,offset)).length,
      notes:notes.filter(x=>inside(x.issued_at||x.date||x.created_at||x.updated_at,offset)).length,
      points:events.filter(x=>inside(x.start||x.created_at||x.updated_at,offset)).reduce((s,x)=>s+(Number(x.points_delta??x.points??0)||0),0),
      checklist:total?Math.round(checked/total*100):0,
      checked,total
    };
  }
  function bars(values,key){const max=Math.max(...values.map(v=>Math.abs(Number(v[key])||0)),1);return values.map((v,i)=>`<button class="dfw-bar-wrap" data-dfw-week="${v.offset}" type="button" title="Pokaż tydzień ${fmt(v.start)}–${fmt(v.end)}"><div class="dfw-val">${v[key]}</div><div class="dfw-bar" style="height:${Math.max(8,Math.round(Math.abs(Number(v[key])||0)/max*58))}px"></div><div class="dfw-lab">${i===3?'Teraz':`-${3-i} t.`}</div></button>`).join('')}
  function detail(w){return `<div class="dfw-detail"><div class="dfw-detail-head"><strong>Tydzień ${fmt(w.start)}–${fmt(w.end)}</strong><span>${w.offset===0?'bieżący tydzień':`${Math.abs(w.offset)} tyg. temu`}</span></div><div class="dfw-detail-grid"><div><span>Wykonane zadania</span><b>${w.tasks}</b></div><div><span>Przewinienia</span><b>${w.offences}</b></div><div><span>Uwagi / upomnienia</span><b>${w.notes}</b></div><div><span>Punkty netto</span><b>${w.points>0?'+':''}${w.points}</b></div><div><span>Checklisty</span><b>${w.checklist}%</b><small>${w.checked}/${w.total}</small></div></div></div>`}
  function render(){
    const dash=document.querySelector('#view-dashboard');if(!dash)return;
    let box=document.querySelector('#dashboardFourWeekTrend');
    if(!box){box=document.createElement('div');box.id='dashboardFourWeekTrend';box.className='panel';const ref=document.querySelector('#dashboardWeekSummary');if(ref&&ref.nextSibling)dash.insertBefore(box,ref.nextSibling);else dash.appendChild(box)}
    if(!document.querySelector('#dashboardFourWeekTrendStyles')){const s=document.createElement('style');s.id='dashboardFourWeekTrendStyles';s.textContent='.dfw-grid{display:grid;grid-template-columns:repeat(5,minmax(140px,1fr));gap:10px}.dfw-card{border:1px solid #252d3c;border-radius:12px;padding:12px;background:#111722}.dfw-title{font-size:11px;color:#98a2b3;margin-bottom:8px}.dfw-bars{height:92px;display:flex;align-items:flex-end;gap:8px}.dfw-bar-wrap{flex:1;text-align:center;background:transparent;border:0;color:inherit;padding:0;cursor:pointer}.dfw-bar-wrap:hover .dfw-bar{opacity:.9}.dfw-bar{width:100%;max-width:24px;margin:0 auto;border-radius:6px 6px 2px 2px;background:currentColor;opacity:.55}.dfw-val,.dfw-lab{font-size:10px;color:#98a2b3}.dfw-foot{font-size:11px;color:#98a2b3;margin-top:10px}.dfw-detail{margin-top:12px;padding:12px;border:1px solid #252d3c;border-radius:12px;background:#0d131d}.dfw-detail-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px}.dfw-detail-head span{font-size:11px;color:#98a2b3}.dfw-detail-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.dfw-detail-grid div{padding:9px;border:1px solid #252d3c;border-radius:10px;background:#111722}.dfw-detail-grid span,.dfw-detail-grid small{display:block;font-size:10px;color:#98a2b3}.dfw-detail-grid b{display:block;font-size:18px;margin-top:3px}@media(max-width:1000px){.dfw-grid{grid-template-columns:repeat(2,1fr)}.dfw-detail-grid{grid-template-columns:repeat(2,1fr)}}';document.head.appendChild(s)}
    const w=[-3,-2,-1,0].map(stats);let selected=Number(box.dataset.selectedWeek??0);if(![-3,-2,-1,0].includes(selected))selected=0;box.dataset.selectedWeek=String(selected);
    const metric=(label,key)=>`<div class="dfw-card"><div class="dfw-title">${label}</div><div class="dfw-bars">${bars(w,key)}</div></div>`;
    box.innerHTML=`<div class="dtp-head"><h3>📈 Trend 4 tygodni</h3><span class="dtp-count">kliknij słupek, aby zobaczyć tydzień</span></div><div class="dfw-grid">${metric('Wykonane zadania','tasks')}${metric('Przewinienia','offences')}${metric('Uwagi / upomnienia','notes')}${metric('Punkty netto','points')}${metric('Checklisty %','checklist')}</div>${detail(w.find(x=>x.offset===selected)||w[3])}<div class="dfw-foot">Trend ma charakter informacyjny. Nie uruchamia żadnych automatycznych konsekwencji ani zmian terminów.</div>`;
    box.onclick=e=>{const b=e.target.closest('[data-dfw-week]');if(!b)return;box.dataset.selectedWeek=b.dataset.dfwWeek;render()};
  }
  const install=()=>{render();['bdsm-day-agenda-updated','bdsm-education-tasks-updated','bdsm-case-linked','bdsm-sync-complete'].forEach(e=>document.addEventListener(e,render));window.addEventListener('storage',render);setInterval(render,60000)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();