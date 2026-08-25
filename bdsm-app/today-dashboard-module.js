(()=>{
  if(window.__bdsmTodayDashboardInstalled)return;
  window.__bdsmTodayDashboardInstalled=true;
  const EVENTS='bdsm-app-events-v3',TASKS='bdsm-app-education-tasks-v1';
  const PRIORITIES='bdsm-app-today-priorities-v1',CHECKED='bdsm-app-today-checked-v1';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(_){return d}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const dayKey=()=>{const d=new Date(),z=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`};
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
  const defaultPriority=item=>item.overdue?'urgent':item.today?'important':'normal';
  const priority=item=>priorityMap()[item.key]||defaultPriority(item);
  const setPriority=(key,value)=>{const p=priorityMap();p[key]=value;write(PRIORITIES,p)};
  const priorityLabel=p=>({urgent:'Pilne',important:'Ważne',normal:'Zwykłe'}[p]||'Zwykłe');
  const priorityRank=p=>({urgent:0,important:1,normal:2}[p]??2);

  function data(){
    const events=read(EVENTS,[]),tasks=read(TASKS,[]),groups=window.bdsmRelationshipTimeline?.groups?.()||[];
    const openCases=groups.filter(g=>statusOfCase(g).key!=='closed');
    const waitingCases=groups.filter(g=>statusOfCase(g).key==='waiting');
    const activeTasks=tasks.filter(t=>!['wykonane','anulowane'].includes(String(t.status||'').toLowerCase()));
    const activeEnds=events.filter(e=>['kara','szlaban'].includes(String(e.type||'').toLowerCase())&&!['wykonane','anulowane'].includes(String(e.status||'').toLowerCase())&&e.end);
    const overdueTasks=activeTasks.filter(t=>overdue(t.due_at));
    const todayTasks=activeTasks.filter(t=>isToday(t.due_at));
    const todayEnds=activeEnds.filter(e=>isToday(e.end));
    const overdueEnds=activeEnds.filter(e=>overdue(e.end));
    const items=[];
    todayTasks.forEach(x=>items.push({key:itemKey('task',taskId(x)),kind:'task',title:x.title||'Zadanie',meta:'Termin dzisiaj',today:true,overdue:false,open:'tasks'}));
    overdueTasks.forEach(x=>items.push({key:itemKey('task',taskId(x)),kind:'task',title:x.title||'Zadanie',meta:'Po terminie',today:false,overdue:true,open:'tasks'}));
    todayEnds.forEach(x=>items.push({key:itemKey('event',eventId(x)),kind:String(x.type).toLowerCase(),title:x.title||x.type,meta:'Kończy się dzisiaj',today:true,overdue:false,open:'deadlines'}));
    overdueEnds.forEach(x=>items.push({key:itemKey('event',eventId(x)),kind:String(x.type).toLowerCase(),title:x.title||x.type,meta:'Termin minął',today:false,overdue:true,open:'deadlines'}));
    items.forEach(x=>{x.priority=priority(x);x.checked=isChecked(x.key)});
    items.sort((a,b)=>Number(a.checked)-Number(b.checked)||priorityRank(a.priority)-priorityRank(b.priority)||a.title.localeCompare(b.title,'pl'));
    return{openCases,waitingCases,overdueTasks,todayTasks,todayEnds,overdueEnds,items};
  }

  function ensureUI(){
    const dash=document.querySelector('#view-dashboard');if(!dash)return;
    if(!document.querySelector('#todayDashStyles')){const st=document.createElement('style');st.id='todayDashStyles';st.textContent='.today-panel{margin-top:12px}.today-alerts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.today-alert{background:#0c121c;border:1px solid #252d3c;border-radius:12px;padding:12px;cursor:pointer}.today-alert b{display:block;font-size:22px}.today-alert span{font-size:11px;color:#98a2b3}.today-list{margin-top:12px;display:grid;gap:7px}.today-row{display:grid;grid-template-columns:1fr auto auto auto;gap:10px;align-items:center;padding:10px 12px;border:1px solid #252d3c;border-radius:10px;background:#0c121c}.today-row.checked{opacity:.58}.today-row.checked strong{text-decoration:line-through}.today-row small{color:#98a2b3}.today-priority{border:1px solid #313b4f;background:#151c2b;color:#fff;border-radius:8px;padding:7px 9px;font-size:11px}.today-priority.urgent{border-color:#7f2832;color:#ff929c}.today-priority.important{border-color:#705319;color:#ffd36f}.today-priority.normal{color:#c6cedb}.today-check{white-space:nowrap}.today-empty{color:#7f8a9d;padding:16px;text-align:center}@media(max-width:900px){.today-alerts{grid-template-columns:repeat(2,1fr)}.today-row{grid-template-columns:1fr auto}.today-row .today-priority{grid-column:1}.today-row .today-check{grid-column:2;grid-row:1}}';document.head.appendChild(st)}
    if(!document.querySelector('#todayDashboardPanel')){const p=document.createElement('div');p.id='todayDashboardPanel';p.className='panel today-panel';p.innerHTML='<h3>📌 Do zrobienia dzisiaj</h3><div id="todayAlerts" class="today-alerts"></div><div id="todayList" class="today-list"></div>';dash.appendChild(p);p.addEventListener('click',e=>{const a=e.target.closest('[data-today-open]');if(a){const v=a.dataset.todayOpen;if(v==='timeline')window.bdsmRelationshipTimeline?.open?.();if(v==='deadlines')document.querySelector('#deadlinesNav')?.click();if(v==='tasks')window.bdsmEducationTasks?.open?.();return}const c=e.target.closest('[data-today-check]');if(c){setChecked(c.dataset.todayCheck,c.dataset.checked!=='1');render()}});p.addEventListener('change',e=>{const s=e.target.closest('[data-today-priority]');if(s){setPriority(s.dataset.todayPriority,s.value);render()}})}
  }
  function icon(kind){return kind==='task'?'📚':kind==='szlaban'?'⊘':'⚖'};
  function render(){ensureUI();const d=data(),alerts=document.querySelector('#todayAlerts'),list=document.querySelector('#todayList');if(!alerts||!list)return;
    const unchecked=d.items.filter(x=>!x.checked).length,urgent=d.items.filter(x=>!x.checked&&x.priority==='urgent').length;
    alerts.innerHTML=`<div class="today-alert" data-today-open="timeline"><b>${d.openCases.length}</b><span>spraw wymaga uwagi</span></div><div class="today-alert" data-today-open="tasks"><b>${d.overdueTasks.length}</b><span>zadań po terminie</span></div><div class="today-alert" data-today-open="deadlines"><b>${d.todayEnds.length}</b><span>kar/szlabanów kończy się dziś</span></div><div class="today-alert"><b>${unchecked}</b><span>pozycji do sprawdzenia • pilne: ${urgent}</span></div>`;
    list.innerHTML=d.items.length?d.items.map(x=>`<div class="today-row ${x.checked?'checked':''}"><div><strong>${icon(x.kind)} ${esc(x.title)}</strong><br><small>${esc(x.meta)}${x.checked?' • sprawdzone dzisiaj':''}</small></div><select class="today-priority ${x.priority}" data-today-priority="${esc(x.key)}" aria-label="Priorytet"><option value="urgent" ${x.priority==='urgent'?'selected':''}>🔴 Pilne</option><option value="important" ${x.priority==='important'?'selected':''}>🟡 Ważne</option><option value="normal" ${x.priority==='normal'?'selected':''}>⚪ Zwykłe</option></select><button class="btn" data-today-open="${x.open}">Otwórz</button><button class="btn today-check" data-today-check="${esc(x.key)}" data-checked="${x.checked?'1':'0'}">${x.checked?'↺ Cofnij':'✓ Sprawdzone dzisiaj'}</button></div>`).join(''):'<div class="today-empty">Brak pozycji na dzisiaj i zaległości.</div>';
  }
  function install(){render();['bdsm-offences-updated','bdsm-education-tasks-updated','bdsm-case-linked','bdsm-sync-complete'].forEach(ev=>document.addEventListener(ev,render));window.addEventListener('storage',render);setInterval(render,60000);window.bdsmTodayDashboard={refresh:render,data,setChecked,setPriority};}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();