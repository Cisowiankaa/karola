(() => {
  const PROJECTS_KEY='aii-projects';
  const REMINDERS_KEY='aii-reminder-log';

  const readProjects=()=>{try{return JSON.parse(localStorage.getItem(PROJECTS_KEY)||'[]')}catch{return[]}};
  const readLog=()=>{try{return JSON.parse(localStorage.getItem(REMINDERS_KEY)||'{}')}catch{return{}}};
  const writeLog=log=>localStorage.setItem(REMINDERS_KEY,JSON.stringify(log));
  const dateOnly=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());

  function diffDays(dateString){
    if(!dateString)return null;
    const target=new Date(dateString+'T00:00:00');
    if(Number.isNaN(target.getTime()))return null;
    return Math.round((dateOnly(target)-dateOnly(new Date()))/86400000);
  }

  function buildReminders(){
    return readProjects()
      .filter(p=>p && p.status!=='Zrealizowany' && p.date)
      .map(p=>({...p,days:diffDays(p.date)}))
      .filter(p=>p.days!==null && p.days<=3)
      .sort((a,b)=>a.days-b.days);
  }

  function labelFor(days){
    if(days<0)return `Termin minął ${Math.abs(days)} dni temu`;
    if(days===0)return 'Termin dzisiaj';
    if(days===1)return 'Termin jutro';
    return `Termin za ${days} dni`;
  }

  function urgency(days){return days<0?'overdue':days===0?'today':days===1?'tomorrow':'soon'};

  function injectStyles(){
    if(document.getElementById('aii-reminder-styles'))return;
    const style=document.createElement('style');style.id='aii-reminder-styles';
    style.textContent=`
      .reminder-panel{margin-top:12px}.reminder-list{display:grid;gap:8px}.reminder-row{display:grid;grid-template-columns:10px 1fr auto;gap:9px;align-items:center;padding:10px 11px;border:1px solid #ebeef4;border-radius:11px;background:#fff}.reminder-dot{width:8px;height:8px;border-radius:50%;background:#8d73ff}.reminder-row.overdue .reminder-dot{background:#cf4a4a}.reminder-row.today .reminder-dot{background:#d9961e}.reminder-row.tomorrow .reminder-dot{background:#3f82c8}.reminder-row b{display:block;font-size:9px}.reminder-row small{display:block;font-size:8px;color:#858b98;margin-top:2px}.reminder-meta{font-size:8px;font-weight:800;color:#6650d6}.reminder-empty{padding:14px;border:1px dashed #e0e3eb;border-radius:10px;color:#858b98;font-size:8px;text-align:center}
    `;
    document.head.appendChild(style);
  }

  function renderDashboardReminders(){
    if(!document.getElementById('content'))return;
    if((localStorage.getItem('aii-last-view')||'dashboard')!=='dashboard')return;
    const content=document.getElementById('content');
    if(content.querySelector('.reminder-panel'))return;
    const reminders=buildReminders();
    const rows=reminders.length?reminders.slice(0,6).map(p=>`<div class="reminder-row ${urgency(p.days)}"><span class="reminder-dot"></span><div><b>${escapeHtml(p.name||'Projekt')}</b><small>${escapeHtml(p.platform||'')} · ${escapeHtml(p.date)}</small></div><span class="reminder-meta">${labelFor(p.days)}</span></div>`).join(''):'<div class="reminder-empty">Brak pilnych terminów na najbliższe 3 dni.</div>';
    const section=document.createElement('section');section.className='card panel-card reminder-panel';section.innerHTML=`<div class="section-head"><h2>Automatyczne przypomnienia</h2><span class="tag">${reminders.length} aktywnych</span></div><div class="reminder-list">${rows}</div>`;
    content.appendChild(section);
  }

  function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}

  function notifyDueOnce(){
    const log=readLog();
    const today=new Date().toISOString().slice(0,10);
    buildReminders().filter(p=>p.days<=1).forEach(p=>{
      const key=`${p.id}:${today}:${p.days}`;
      if(log[key])return;
      const text=`${p.name||'Projekt'} — ${labelFor(p.days)}`;
      if(typeof window.showToast==='function')window.showToast(text);
      if(typeof window.notifyMake==='function')window.notifyMake({event:'deadline_reminder',source:'AI Influencer Studio',projectId:p.id,projectName:p.name,date:p.date,days:p.days,createdAt:new Date().toISOString()});
      log[key]=Date.now();
    });
    writeLog(log);
  }

  function refresh(){setTimeout(renderDashboardReminders,40)}

  document.addEventListener('DOMContentLoaded',()=>{
    injectStyles();
    notifyDueOnce();
    refresh();
    document.querySelectorAll('.nav-item[data-view="dashboard"]').forEach(a=>a.addEventListener('click',refresh));
    window.addEventListener('storage',e=>{if(e.key===PROJECTS_KEY){refresh();notifyDueOnce()}});
  });
})();
