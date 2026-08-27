(()=>{
  if(window.__bdsmTodayDashboardInstalled)return;
  window.__bdsmTodayDashboardInstalled=true;
  const EVENTS='bdsm-app-events-v3',TASKS='bdsm-app-education-tasks-v1',DAYMETA='bdsm-app-day-agenda-meta-v1',OFF='bdsm-app-offences-v1',NOTES='bdsm-app-written-notes-v1',HOURS='bdsm-app-hourly-reports-v1';
  const PRIORITIES='bdsm-app-today-priorities-v1',CHECKED='bdsm-app-today-checked-v1';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(_){return d}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const z=n=>String(n).padStart(2,'0');
  const dayKey=()=>{const d=new Date();return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`};
  const monthKey=()=>{const d=new Date();return `${d.getFullYear()}-${z(d.getMonth()+1)}`};
  const dayOf=v=>{if(!v)return'';const d=new Date(v);return Number.isNaN(d.getTime())?'':`${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`};
  const monthOf=v=>dayOf(v).slice(0,7);
  const startOfToday=()=>{const d=new Date();d.setHours(0,0,0,0);return d};
  const endOfToday=()=>{const d=new Date();d.setHours(23,59,59,999);return d};
  const isToday=v=>{if(!v)return false;const d=new Date(v);return !Number.isNaN(d.getTime())&&d>=startOfToday()&&d<=endOfToday()};
  const overdue=v=>{if(!v)return false;const d=new Date(v);return !Number.isNaN(d.getTime())&&d<new Date()&&!isToday(v)};
  const statusOfCase=g=>window.bdsmRelationshipTimeline?.caseStatus?.(g)||{key:'open',label:'Otwarta'};
  const taskId=t=>String(t.task_id||t.id||('TASK-'+(t.title||'')+'-'+(t.due_at||'')));
  const eventId=e=>String(e.event_id||e.id||('EVT-'+(e.title||'')+'-'+(e.end||'')));
  const itemKey=(kind,id)=>`${kind}:${id}`;
  const checkedMap=()=>read(CHECKED,{});
  const priorityMap=()=>read(PRIORITIES,{});
  const isChecked=key=>!!checkedMap()[dayKey()]?.[key];
  const setChecked=(key,value)=>{const all=checkedMap(),d=dayKey();all[d]=all[d]||{};if(value)all[d][key]=new Date().toISOString();else delete all[d][key];write(CHECKED,all)};
  const defaultPriority=item=>item.sourcePriority||item.overdue?'urgent':item.today?'important':'normal';
  const priority=item=>item.sourcePriority||priorityMap()[item.key]||defaultPriority(item);
  const setPriority=(key,value)=>{const p=priorityMap();p[key]=value;write(PRIORITIES,p)};
  const priorityRank=p=>({urgent:0,important:1,normal:2}[p]??2);
  const checklistToday=()=>{const m=read(DAYMETA,{}),a=m?.[dayKey()]?.checklist;return Array.isArray(a)?a:[]};
  const pointsOf=e=>Number(e.points_delta!=null?e.points_delta:(e.points!=null?e.points:0))||0;
  const arr=k=>{const x=read(k,[]);return Array.isArray(x)?x:[]};

  function metrics(){
    const events=arr(EVENTS),tasks=arr(TASKS),offences=arr(OFF),notes=arr(NOTES),hours=arr(HOURS),m=monthKey(),d=dayKey();
    const todayEvents=events.filter(x=>dayOf(x.start||x.created_at)===d),monthEvents=events.filter(x=>monthOf(x.start||x.created_at)===m);
    const todayOff=offences.filter(x=>dayOf(x.occurred_at||x.created_at)===d),monthOff=offences.filter(x=>monthOf(x.occurred_at||x.created_at)===m);
    const todayTasks=tasks.filter(x=>dayOf(x.due_at||x.created_at)===d),monthTasks=tasks.filter(x=>monthOf(x.due_at||x.created_at)===m);
    const todayNotes=notes.filter(x=>dayOf(x.issued_at||x.date||x.created_at)===d),monthNotes=notes.filter(x=>monthOf(x.issued_at||x.date||x.created_at)===m);
    const todayHours=hours.filter(x=>String(x.date||'')===d),monthHours=hours.filter(x=>String(x.date||'').slice(0,7)===m);
    const checklist=checklistToday(),checkDone=checklist.filter(x=>x.done).length;
    return {
      today:{events:todayEvents.length,offences:todayOff.length,tasks:todayTasks.length,notes:todayNotes.length,hours:todayHours.length,points:todayEvents.reduce((s,e)=>s+pointsOf(e),0),check:checklist.length?Math.round(checkDone/checklist.length*100):0},
      month:{events:monthEvents.length,offences:monthOff.length,tasks:monthTasks.length,notes:monthNotes.length,hours:monthHours.length,points:monthEvents.reduce((s,e)=>s+pointsOf(e),0)}
    };
  }

  function data(){
    const events=arr(EVENTS),tasks=arr(TASKS),groups=window.bdsmRelationshipTimeline?.groups?.()||[];
    const openCases=groups.filter(g=>statusOfCase(g).key!=='closed');
    const waitingCases=groups.filter(g=>statusOfCase(g).key==='waiting');
    const activeTasks=tasks.filter(t=>!['wykonane','anulowane'].includes(String(t.status||'').toLowerCase()));
    const activeEnds=events.filter(e=>['kara','szlaban'].includes(String(e.type||'').toLowerCase())&&!['wykonane','anulowane'].includes(String(e.status||'').toLowerCase())&&e.end);
    const overdueTasks=activeTasks.filter(t=>overdue(t.due_at));
    const todayTasks=activeTasks.filter(t=>isToday(t.due_at));
    const todayEnds=activeEnds.filter(e=>isToday(e.end));
    const overdueEnds=activeEnds.filter(e=>overdue(e.end));
    const agendaChecklist=checklistToday(),agendaOpen=agendaChecklist.filter(x=>!x.done),items=[];
    todayTasks.forEach(x=>items.push({key:itemKey('task',taskId(x)),kind:'task',title:x.title||'Zadanie',meta:'Termin dzisiaj',today:true,overdue:false,open:'tasks'}));
    overdueTasks.forEach(x=>items.push({key:itemKey('task',taskId(x)),kind:'task',title:x.title||'Zadanie',meta:'Po terminie',today:false,overdue:true,open:'tasks'}));
    todayEnds.forEach(x=>items.push({key:itemKey('event',eventId(x)),kind:String(x.type).toLowerCase(),title:x.title||x.type,meta:'Kończy się dzisiaj',today:true,overdue:false,open:'deadlines'}));
    overdueEnds.forEach(x=>items.push({key:itemKey('event',eventId(x)),kind:String(x.type).toLowerCase(),title:x.title||x.type,meta:'Termin minął — wymaga ręcznego przeglądu',today:false,overdue:true,open:'deadlines'}));
    agendaOpen.forEach(x=>items.push({key:itemKey('checklist',x.id||x.text),kind:'checklist',title:x.text||'Punkt checklisty',meta:[x.time?`Godzina ${x.time}`:'Bez godziny','Checklista dnia'].join(' • '),today:true,overdue:false,open:'agenda',sourcePriority:x.priority||'normal'}));
    items.forEach(x=>{x.priority=priority(x);x.checked=isChecked(x.key)});
    items.sort((a,b)=>Number(a.checked)-Number(b.checked)||priorityRank(a.priority)-priorityRank(b.priority)||Number(b.overdue)-Number(a.overdue)||String(a.meta).localeCompare(String(b.meta),'pl')||a.title.localeCompare(b.title,'pl'));
    return{openCases,waitingCases,overdueTasks,todayTasks,todayEnds,overdueEnds,agendaChecklist,agendaOpen,items,metrics:metrics()};
  }

  function ensureUI(){
    const dash=document.querySelector('#view-dashboard');if(!dash)return;
    if(!document.querySelector('#todayDashStyles')){const st=document.createElement('style');st.id='todayDashStyles';st.textContent='.dash-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin-top:12px}.dash-kpi{background:#0c121c;border:1px solid #252d3c;border-radius:12px;padding:12px}.dash-kpi small{color:#98a2b3;display:block}.dash-kpi strong{font-size:22px;display:block;margin-top:4px}.dash-split{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.today-panel{margin-top:12px}.today-alerts{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.today-alert{background:#0c121c;border:1px solid #252d3c;border-radius:12px;padding:12px;cursor:pointer}.today-alert b{display:block;font-size:22px}.today-alert span{font-size:11px;color:#98a2b3}.today-list{margin-top:12px;display:grid;gap:7px}.today-row{display:grid;grid-template-columns:1fr auto auto auto;gap:10px;align-items:center;padding:10px 12px;border:1px solid #252d3c;border-radius:10px;background:#0c121c}.today-row.checked{opacity:.58}.today-row.checked strong{text-decoration:line-through}.today-row small{color:#98a2b3}.today-priority{border:1px solid #313b4f;background:#151c2b;color:#fff;border-radius:8px;padding:7px 9px;font-size:11px}.today-priority.urgent{border-color:#7f2832;color:#ff929c}.today-priority.important{border-color:#705319;color:#ffd36f}.today-priority.normal{color:#c6cedb}.today-check{white-space:nowrap}.today-empty{color:#7f8a9d;padding:16px;text-align:center}.focus-list{display:grid;gap:8px;margin-top:8px}.focus-row{border:1px solid #3a2731;background:#120e15;border-radius:10px;padding:10px}.focus-row b{display:block}.focus-row small{color:#b2a2aa}@media(max-width:1100px){.dash-kpis{grid-template-columns:repeat(3,1fr)}.today-alerts{grid-template-columns:repeat(2,1fr)}.dash-split{grid-template-columns:1fr}}@media(max-width:650px){.dash-kpis{grid-template-columns:repeat(2,1fr)}}@media(max-width:900px){.today-row{grid-template-columns:1fr auto}.today-row .today-priority{grid-column:1}.today-row .today-check{grid-column:2;grid-row:1}}';document.head.appendChild(st)}
    if(!document.querySelector('#dashboardSummaryPanel')){const s=document.createElement('div');s.id='dashboardSummaryPanel';s.className='panel today-panel';s.innerHTML='<h3>📊 Dzisiaj i bieżący miesiąc</h3><div id="dashTodayKpis" class="dash-kpis"></div><div class="dash-split"><div><h4>Ten miesiąc</h4><div id="dashMonthKpis" class="dash-kpis"></div></div><div><h4>Najważniejsze zaległości</h4><div id="dashFocus" class="focus-list"></div></div></div>';dash.appendChild(s)}
    if(!document.querySelector('#todayDashboardPanel')){const p=document.createElement('div');p.id='todayDashboardPanel';p.className='panel today-panel';p.innerHTML='<h3>📌 Do zrobienia dzisiaj</h3><div id="todayAlerts" class="today-alerts"></div><div id="todayList" class="today-list"></div>';dash.appendChild(p);p.addEventListener('click',e=>{const a=e.target.closest('[data-today-open]');if(a){const v=a.dataset.todayOpen;if(v==='timeline')window.bdsmRelationshipTimeline?.open?.();if(v==='deadlines')document.querySelector('#deadlinesNav')?.click();if(v==='tasks')window.bdsmEducationTasks?.open?.();if(v==='agenda')window.bdsmDayAgenda?.open?.(dayKey());return}const c=e.target.closest('[data-today-check]');if(c){setChecked(c.dataset.todayCheck,c.dataset.checked!=='1');render()}});p.addEventListener('change',e=>{const s=e.target.closest('[data-today-priority]');if(s){setPriority(s.dataset.todayPriority,s.value);render()}})}
  }
  function icon(kind){return kind==='task'?'📚':kind==='szlaban'?'⊘':kind==='checklist'?'☑':'⚖'};
  function kpisHtml(m){return `<div class="dash-kpi"><small>Wpisy</small><strong>${m.events}</strong></div><div class="dash-kpi"><small>Przewinienia</small><strong>${m.offences}</strong></div><div class="dash-kpi"><small>Zadania</small><strong>${m.tasks}</strong></div><div class="dash-kpi"><small>Uwagi</small><strong>${m.notes}</strong></div><div class="dash-kpi"><small>Dziennik</small><strong>${m.hours}</strong></div><div class="dash-kpi"><small>Punkty</small><strong>${m.points}</strong></div>`}
  function render(){
    ensureUI();const d=data(),alerts=document.querySelector('#todayAlerts'),list=document.querySelector('#todayList'),tk=document.querySelector('#dashTodayKpis'),mk=document.querySelector('#dashMonthKpis'),focus=document.querySelector('#dashFocus');if(!alerts||!list)return;
    if(tk)tk.innerHTML=kpisHtml(d.metrics.today)+`<div class="dash-kpi"><small>Checklista</small><strong>${d.metrics.today.check}%</strong></div>`;
    if(mk)mk.innerHTML=kpisHtml(d.metrics.month);
    const focusItems=d.items.filter(x=>!x.checked&&(x.overdue||x.priority==='urgent')).slice(0,6);
    if(focus)focus.innerHTML=focusItems.length?focusItems.map(x=>`<div class="focus-row"><b>${icon(x.kind)} ${esc(x.title)}</b><small>${esc(x.meta)} • ${x.priority==='urgent'?'pilne':'wymaga uwagi'}</small></div>`).join(''):'<div class="today-empty">Brak pilnych zaległości.</div>';
    const unchecked=d.items.filter(x=>!x.checked).length,urgent=d.items.filter(x=>!x.checked&&x.priority==='urgent').length;
    alerts.innerHTML=`<div class="today-alert" data-today-open="timeline"><b>${d.openCases.length}</b><span>spraw wymaga uwagi</span></div><div class="today-alert" data-today-open="tasks"><b>${d.overdueTasks.length}</b><span>zadań po terminie</span></div><div class="today-alert" data-today-open="deadlines"><b>${d.todayEnds.length}</b><span>kar/szlab. kończy się dziś</span></div><div class="today-alert" data-today-open="agenda"><b>${d.agendaOpen.length}</b><span>punktów checklisty do zrobienia</span></div><div class="today-alert"><b>${unchecked}</b><span>pozycji do sprawdzenia • pilne: ${urgent}</span></div>`;
    list.innerHTML=d.items.length?d.items.map(x=>`<div class="today-row ${x.checked?'checked':''}"><div><strong>${icon(x.kind)} ${esc(x.title)}</strong><br><small>${esc(x.meta)}${x.checked?' • sprawdzone dzisiaj':''}</small></div><select class="today-priority ${x.priority}" data-today-priority="${esc(x.key)}" aria-label="Priorytet"><option value="urgent" ${x.priority==='urgent'?'selected':''}>🔴 Pilne</option><option value="important" ${x.priority==='important'?'selected':''}>🟡 Ważne</option><option value="normal" ${x.priority==='normal'?'selected':''}>⚪ Zwykłe</option></select><button class="btn" data-today-open="${x.open}">Otwórz</button><button class="btn today-check" data-today-check="${esc(x.key)}" data-checked="${x.checked?'1':'0'}">${x.checked?'↺ Cofnij':'✓ Sprawdzone dzisiaj'}</button></div>`).join(''):'<div class="today-empty">Brak pozycji na dzisiaj i zaległości.</div>';
  }
  function install(){render();['bdsm-offences-updated','bdsm-education-tasks-updated','bdsm-case-linked','bdsm-sync-complete','bdsm-day-agenda-updated','bdsm-cloud-restored'].forEach(ev=>document.addEventListener(ev,render));window.addEventListener('storage',render);setInterval(render,60000);window.bdsmTodayDashboard={refresh:render,data,setChecked,setPriority};}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();