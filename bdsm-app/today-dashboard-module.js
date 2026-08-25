(()=>{
  if(window.__bdsmTodayDashboardInstalled)return;
  window.__bdsmTodayDashboardInstalled=true;
  const EVENTS='bdsm-app-events-v3',TASKS='bdsm-app-education-tasks-v1',OFF='bdsm-app-offences-v1';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(_){return d}};
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const startOfToday=()=>{const d=new Date();d.setHours(0,0,0,0);return d};
  const endOfToday=()=>{const d=new Date();d.setHours(23,59,59,999);return d};
  const isToday=v=>{if(!v)return false;const d=new Date(v);return !Number.isNaN(d.getTime())&&d>=startOfToday()&&d<=endOfToday()};
  const overdue=v=>{if(!v)return false;const d=new Date(v);return !Number.isNaN(d.getTime())&&d<new Date()};
  const statusOfCase=g=>window.bdsmRelationshipTimeline?.caseStatus?.(g)||{key:'open',label:'Otwarta'};
  function data(){
    const events=read(EVENTS,[]),tasks=read(TASKS,[]),groups=window.bdsmRelationshipTimeline?.groups?.()||[];
    const openCases=groups.filter(g=>statusOfCase(g).key!=='closed');
    const waitingCases=groups.filter(g=>statusOfCase(g).key==='waiting');
    const overdueTasks=tasks.filter(t=>!['wykonane','anulowane'].includes(String(t.status||'').toLowerCase())&&overdue(t.due_at));
    const todayTasks=tasks.filter(t=>!['wykonane','anulowane'].includes(String(t.status||'').toLowerCase())&&isToday(t.due_at));
    const todayEnds=events.filter(e=>['kara','szlaban'].includes(String(e.type||'').toLowerCase())&&!['wykonane','anulowane'].includes(String(e.status||'').toLowerCase())&&isToday(e.end));
    const overdueEnds=events.filter(e=>['kara','szlaban'].includes(String(e.type||'').toLowerCase())&&!['wykonane','anulowane'].includes(String(e.status||'').toLowerCase())&&overdue(e.end));
    return{openCases,waitingCases,overdueTasks,todayTasks,todayEnds,overdueEnds};
  }
  function ensureUI(){
    const dash=document.querySelector('#view-dashboard');if(!dash)return;
    if(!document.querySelector('#todayDashStyles')){const st=document.createElement('style');st.id='todayDashStyles';st.textContent='.today-panel{margin-top:12px}.today-alerts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.today-alert{background:#0c121c;border:1px solid #252d3c;border-radius:12px;padding:12px;cursor:pointer}.today-alert b{display:block;font-size:22px}.today-alert span{font-size:11px;color:#98a2b3}.today-list{margin-top:12px;display:grid;gap:7px}.today-row{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:10px 12px;border:1px solid #252d3c;border-radius:10px;background:#0c121c}.today-row small{color:#98a2b3}.today-empty{color:#7f8a9d;padding:16px;text-align:center}@media(max-width:900px){.today-alerts{grid-template-columns:repeat(2,1fr)}}';document.head.appendChild(st)}
    if(!document.querySelector('#todayDashboardPanel')){const p=document.createElement('div');p.id='todayDashboardPanel';p.className='panel today-panel';p.innerHTML='<h3>📌 Do zrobienia dzisiaj</h3><div id="todayAlerts" class="today-alerts"></div><div id="todayList" class="today-list"></div>';dash.appendChild(p);p.addEventListener('click',e=>{const a=e.target.closest('[data-today-open]');if(!a)return;const v=a.dataset.todayOpen;if(v==='timeline')window.bdsmRelationshipTimeline?.open?.();if(v==='deadlines')document.querySelector('#deadlinesNav')?.click();if(v==='tasks')window.bdsmEducationTasks?.open?.()})}
  }
  function render(){ensureUI();const d=data(),alerts=document.querySelector('#todayAlerts'),list=document.querySelector('#todayList');if(!alerts||!list)return;
    alerts.innerHTML=`<div class="today-alert" data-today-open="timeline"><b>${d.openCases.length}</b><span>spraw wymaga uwagi</span></div><div class="today-alert" data-today-open="tasks"><b>${d.overdueTasks.length}</b><span>zadań po terminie</span></div><div class="today-alert" data-today-open="deadlines"><b>${d.todayEnds.length}</b><span>kar/szlabanów kończy się dziś</span></div><div class="today-alert" data-today-open="timeline"><b>${d.waitingCases.length}</b><span>spraw czeka na wykonanie</span></div>`;
    const rows=[];
    d.todayTasks.forEach(x=>rows.push(`<div class="today-row"><div><strong>📚 ${esc(x.title||'Zadanie')}</strong><br><small>Termin dzisiaj</small></div><button class="btn" data-today-open="tasks">Otwórz</button></div>`));
    d.overdueTasks.forEach(x=>rows.push(`<div class="today-row"><div><strong>⚠ 📚 ${esc(x.title||'Zadanie')}</strong><br><small>Po terminie</small></div><button class="btn" data-today-open="tasks">Otwórz</button></div>`));
    d.todayEnds.forEach(x=>rows.push(`<div class="today-row"><div><strong>${String(x.type).toLowerCase()==='szlaban'?'⊘':'⚖'} ${esc(x.title||x.type)}</strong><br><small>Kończy się dzisiaj</small></div><button class="btn" data-today-open="deadlines">Terminy</button></div>`));
    d.overdueEnds.forEach(x=>rows.push(`<div class="today-row"><div><strong>⏰ ${esc(x.title||x.type)}</strong><br><small>Termin minął</small></div><button class="btn" data-today-open="deadlines">Terminy</button></div>`));
    list.innerHTML=rows.length?rows.join(''):'<div class="today-empty">Brak pilnych pozycji na dzisiaj.</div>';
  }
  function install(){render();['bdsm-offences-updated','bdsm-education-tasks-updated','bdsm-case-linked','bdsm-sync-complete'].forEach(ev=>document.addEventListener(ev,render));window.addEventListener('storage',render);setInterval(render,60000);window.bdsmTodayDashboard={refresh:render,data};}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();