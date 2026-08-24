(() => {
  const PROJECTS_KEY='aii-projects';
  const TASKS_KEY='aii-project-tasks';
  const PREV_STATUS_KEY='aii-project-prev-status';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const readProjects=()=>{try{return JSON.parse(localStorage.getItem(PROJECTS_KEY)||'[]')}catch{return[]}};
  const writeProjects=v=>localStorage.setItem(PROJECTS_KEY,JSON.stringify(v));
  const readTasks=()=>{try{return JSON.parse(localStorage.getItem(TASKS_KEY)||'{}')}catch{return{}}};
  const writeTasks=v=>localStorage.setItem(TASKS_KEY,JSON.stringify(v));
  const readPrev=()=>{try{return JSON.parse(localStorage.getItem(PREV_STATUS_KEY)||'{}')}catch{return{}}};
  const writePrev=v=>localStorage.setItem(PREV_STATUS_KEY,JSON.stringify(v));
  const dayStart=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
  const diffDays=date=>Math.round((dayStart(new Date(date+'T12:00:00'))-dayStart(new Date()))/86400000);

  function generatedTasks(){
    return readProjects().filter(p=>p.date).map(p=>{
      const d=diffDays(p.date);
      let label='Przygotuj projekt';
      let urgency='later';
      if(d<0){label='Zaległy termin — dokończ projekt';urgency='overdue'}
      else if(d===0){label='Publikacja projektu dzisiaj';urgency='today'}
      else if(d===1){label='Przygotuj publikację na jutro';urgency='tomorrow'}
      else if(d<=3){label='Dopracuj projekt przed terminem';urgency='soon'}
      return {id:String(p.id),projectId:p.id,name:p.name||'Projekt',platform:p.platform||'—',date:p.date,label,urgency,diff:d,status:p.status||'Plan'};
    }).filter(t=>t.diff<=3).sort((a,b)=>a.diff-b.diff);
  }

  function syncProjectStatus(id,isDone){
    const projects=readProjects();
    const prev=readPrev();
    const next=projects.map(p=>{
      if(String(p.id)!==String(id))return p;
      if(isDone){
        if((p.status||'Plan')!=='Zrealizowany')prev[id]=p.status||'Plan';
        return {...p,status:'Zrealizowany'};
      }
      const restored=prev[id]||'W realizacji';
      delete prev[id];
      return {...p,status:restored};
    });
    writePrev(prev);
    writeProjects(next);
    window.dispatchEvent(new CustomEvent('aii-projects-changed'));
  }

  function toggleTask(id){
    const state=readTasks();
    const next=!state[id];
    state[id]=next;
    writeTasks(state);
    syncProjectStatus(id,next);
    renderTaskPanel();
    window.dispatchEvent(new CustomEvent('aii-tasks-changed'));
  }

  function renderTaskPanel(){
    const content=document.getElementById('content');if(!content)return;
    const tasks=generatedTasks();
    const done=readTasks();
    let panel=document.getElementById('autoProjectTasks');
    if(!panel){
      panel=document.createElement('section');panel.id='autoProjectTasks';panel.className='card panel-card';
      const dashboardGrid=content.querySelector('.dashboard-grid');
      if(dashboardGrid)dashboardGrid.insertAdjacentElement('afterend',panel);else content.prepend(panel);
    }
    const completed=tasks.filter(t=>done[t.id]).length;
    const overdue=tasks.filter(t=>!done[t.id]&&t.diff<0).length;
    const active=tasks.length-completed;
    panel.innerHTML=`<div class="section-head"><div><h2>Zadania z projektów</h2><p class="page-subtitle">Generowane automatycznie z terminów publikacji.</p></div><div class="task-summary-pro"><span class="tag">${active} do zrobienia</span><span class="tag">${completed} ukończone</span>${overdue?`<span class="tag task-overdue-tag">${overdue} zaległe</span>`:''}</div></div><div class="auto-task-list">${tasks.length?tasks.map(t=>`<button class="auto-task ${done[t.id]?'is-done':''} ${t.urgency}" data-task-id="${esc(t.id)}"><span class="auto-task-check">${done[t.id]?'✓':''}</span><span class="auto-task-main"><b>${esc(t.label)}</b><small>${esc(t.name)} · ${esc(t.platform)} · ${esc(done[t.id]?'Zrealizowany':t.status)}</small></span><span class="auto-task-date">${esc(t.date)}</span></button>`).join(''):'<div class="empty-projects-pro">Brak pilnych zadań z projektów.</div>'}</div>`;
    panel.querySelectorAll('[data-task-id]').forEach(btn=>btn.addEventListener('click',()=>toggleTask(btn.dataset.taskId)));
  }

  const style=document.createElement('style');
  style.textContent=`.auto-task-list{display:grid;gap:8px}.auto-task{width:100%;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;text-align:left;border:1px solid #e7e9f1;background:#fff;border-radius:12px;padding:10px 12px;cursor:pointer}.auto-task:hover{border-color:#d3cafd;background:#fbfaff}.auto-task-check{width:22px;height:22px;border:1px solid #d5d8e3;border-radius:7px;display:grid;place-items:center;font-weight:800}.auto-task-main{display:grid;gap:2px}.auto-task-main b{font-size:9px}.auto-task-main small,.auto-task-date{font-size:8px;color:#858b98}.auto-task.today,.auto-task.overdue{border-left:3px solid currentColor}.auto-task.is-done{opacity:.55}.auto-task.is-done .auto-task-main{text-decoration:line-through}.task-summary-pro{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.task-overdue-tag{background:#fff0f0!important;color:#b42318!important}`;
  document.head.appendChild(style);

  const observer=new MutationObserver(()=>{
    if(localStorage.getItem('aii-last-view')==='dashboard'||document.querySelector('.metrics-grid'))renderTaskPanel();
  });

  window.addEventListener('aii-projects-changed',()=>{if(document.querySelector('.metrics-grid'))renderTaskPanel()});
  document.addEventListener('DOMContentLoaded',()=>{
    observer.observe(document.getElementById('content'),{childList:true,subtree:false});
    setTimeout(()=>{if(document.querySelector('.metrics-grid'))renderTaskPanel()},30);
  });
})();