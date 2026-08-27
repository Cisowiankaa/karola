(()=>{
  if(window.__bdsmDashboardTodayPanelInstalled)return;
  window.__bdsmDashboardTodayPanelInstalled=true;
  const K={events:'bdsm-app-events-v3',tasks:'bdsm-app-education-tasks-v1',agenda:'bdsm-app-day-agenda-meta-v1'};
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const pad=n=>String(n).padStart(2,'0');
  const dayKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const today=()=>dayKey(new Date());
  const norm=s=>String(s||'').toLowerCase();
  const active=s=>!['wykonane','zakończone','zamknięte','anulowane','done','cancelled','canceled'].includes(norm(s));
  const sameDay=v=>{if(!v)return false;const d=new Date(v);return !isNaN(d)&&dayKey(d)===today()};
  const fmt=v=>{if(!v)return'—';const d=new Date(v);return isNaN(d)?'—':d.toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'})};
  function data(){
    const rows=[];
    read(K.tasks,[]).forEach(x=>{if(active(x.status)&&sameDay(x.due_at))rows.push({type:'task',icon:'📚',time:fmt(x.due_at),title:x.title||'Zadanie',meta:x.status||'aktywne'})});
    read(K.events,[]).forEach(x=>{if(!['kara','szlaban'].includes(norm(x.type))||!active(x.status))return;if(sameDay(x.end))rows.push({type:'deadline',icon:norm(x.type)==='szlaban'?'⊘':'⚖',time:fmt(x.end),title:x.title||x.type,meta:'termin zakończenia'});else if(sameDay(x.start))rows.push({type:'deadline',icon:norm(x.type)==='szlaban'?'⊘':'⚖',time:fmt(x.start),title:x.title||x.type,meta:'początek'})});
    const a=read(K.agenda,{}),m=a&&typeof a==='object'?a[today()]||{}:{};
    (Array.isArray(m.checklist)?m.checklist:[]).filter(x=>!x.done).forEach(x=>rows.push({type:'agenda',icon:'☑',time:x.time||'—',title:x.text||'Punkt checklisty',meta:x.priority==='urgent'?'Pilne':x.priority==='important'?'Ważne':'Zwykłe'}));
    const rank={agenda:0,task:1,deadline:2};
    return rows.sort((a,b)=>String(a.time).localeCompare(String(b.time))||(rank[a.type]-rank[b.type]));
  }
  function openRow(t){if(t==='agenda')window.bdsmDayAgenda?.open?.(today());else if(t==='task')window.bdsmEducationTasks?.open?.();else document.querySelector('#deadlinesNav')?.click()}
  function render(){
    const dash=document.querySelector('#view-dashboard');if(!dash)return;
    let box=document.querySelector('#dashboardTodayPanel');
    if(!box){box=document.createElement('div');box.id='dashboardTodayPanel';box.className='panel';const first=dash.querySelector('.panel');if(first&&first.nextSibling)dash.insertBefore(box,first.nextSibling);else dash.appendChild(box);box.addEventListener('click',e=>{const b=e.target.closest('[data-today-open]');if(b)openRow(b.dataset.todayOpen)})}
    if(!document.querySelector('#dashboardTodayPanelStyles')){const s=document.createElement('style');s.id='dashboardTodayPanelStyles';s.textContent='.dtp-head{display:flex;justify-content:space-between;gap:10px;align-items:center}.dtp-count{font-size:11px;color:#98a2b3}.dtp-row{display:grid;grid-template-columns:56px 28px 1fr auto;gap:8px;align-items:center;padding:9px 0;border-top:1px solid #222a39}.dtp-row:first-of-type{border-top:0}.dtp-meta{font-size:11px;color:#98a2b3}@media(max-width:800px){.dtp-row{grid-template-columns:48px 24px 1fr}.dtp-row .btn{grid-column:1/-1}}';document.head.appendChild(s)}
    const rows=data();box.innerHTML=`<div class="dtp-head"><h3>📌 Na dziś</h3><span class="dtp-count">${rows.length} aktywnych pozycji</span></div>${rows.length?rows.slice(0,10).map(x=>`<div class="dtp-row"><b>${esc(x.time)}</b><span>${x.icon}</span><div><strong>${esc(x.title)}</strong><div class="dtp-meta">${esc(x.meta)}</div></div><button class="btn" data-today-open="${x.type}">Otwórz</button></div>`).join(''):'<div class="empty">Brak aktywnych pozycji na dziś.</div>'}`;
  }
  const install=()=>{render();['bdsm-day-agenda-updated','bdsm-education-tasks-updated','bdsm-sync-complete'].forEach(ev=>document.addEventListener(ev,render));window.addEventListener('storage',render);setInterval(render,60000)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();