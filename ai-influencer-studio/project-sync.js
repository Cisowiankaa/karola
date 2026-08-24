(() => {
  const KEY='aii-projects';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}};
  const fmtDate=v=>{if(!v)return 'Brak daty';const d=new Date(v+'T12:00:00');return Number.isNaN(d.getTime())?v:d.toLocaleDateString('pl-PL',{day:'2-digit',month:'short'})};
  const statusClass=s=>s==='Zrealizowany'?'done':s==='Zaplanowany'?'plan':'';

  const style=document.createElement('style');
  style.textContent=`
    .live-projects{margin-top:12px}.live-project-list{display:grid;gap:8px}.live-project-row{display:grid;grid-template-columns:1.5fr .7fr .7fr auto;gap:10px;align-items:center;padding:10px 11px;border:1px solid #eceef4;border-radius:11px;background:#fff}.live-project-row b{font-size:9px}.live-project-row small{display:block;font-size:7px;color:#8a8f9d;margin-top:2px}.live-project-date{font-size:8px;color:#68707e}.live-project-empty{padding:18px;text-align:center;color:#858b98;font-size:9px}.calendar-live-list{display:grid;gap:8px}.calendar-live-row{display:grid;grid-template-columns:100px 1fr .7fr .7fr;gap:10px;align-items:center;padding:11px;border:1px solid #e9ebf2;border-radius:11px;background:#fff}.calendar-live-row .date{font-weight:900;font-size:9px;color:#674bd9}.calendar-live-row b{font-size:9px}.calendar-live-row span{font-size:8px;color:#6f7582}.calendar-live-row.overdue{border-color:#f0c9c9;background:#fffafa}.calendar-live-row.today{border-color:#cfc4fb;background:#faf8ff}@media(max-width:850px){.live-project-row,.calendar-live-row{grid-template-columns:1fr 1fr}.live-project-row>:first-child,.calendar-live-row>:nth-child(2){grid-column:1/-1}}
  `;
  document.head.appendChild(style);

  function sortedProjects(){
    return read().map(p=>({...p,status:p.status||'Plan'})).sort((a,b)=>{
      if(!a.date&&!b.date)return Number(b.id||0)-Number(a.id||0);
      if(!a.date)return 1;if(!b.date)return -1;return String(a.date).localeCompare(String(b.date));
    });
  }

  function injectDashboard(){
    const content=document.getElementById('content');
    if(!content||!document.querySelector('[data-view="dashboard"]')?.classList.contains('active'))return;
    document.getElementById('liveProjectsDashboard')?.remove();
    const projects=sortedProjects();
    const upcoming=projects.filter(p=>p.status!=='Zrealizowany').slice(0,5);
    const section=document.createElement('section');
    section.id='liveProjectsDashboard';section.className='card panel-card live-projects';
    const rows=upcoming.length?upcoming.map(p=>`<div class="live-project-row"><div><b>${esc(p.name||'Projekt')}</b><small>${esc(p.type||'Projekt')} · ${esc(p.platform||'—')}</small></div><span class="status-pro ${statusClass(p.status)}">${esc(p.status)}</span><span class="live-project-date">${esc(fmtDate(p.date))}</span><button class="ghost" data-open-projects>Otwórz</button></div>`).join(''):'<div class="live-project-empty">Brak aktywnych projektów. Utwórz pierwszy przez „Nowy projekt”.</div>';
    section.innerHTML=`<div class="section-head"><div><h2>Aktywne projekty</h2><p class="page-subtitle" style="margin-top:3px">Dane synchronizowane z modułem „Moje projekty”.</p></div><span class="tag">${upcoming.length} aktywnych</span></div><div class="live-project-list">${rows}</div>`;
    const grids=content.querySelectorAll('.dashboard-grid');
    (grids[0]||content.lastElementChild)?.insertAdjacentElement('afterend',section);
    section.querySelectorAll('[data-open-projects]').forEach(b=>b.onclick=()=>document.querySelector('[data-view="projects"]')?.click());
  }

  function renderCalendar(){
    const content=document.getElementById('content');if(!content)return;
    const projects=sortedProjects();
    const today=new Date();today.setHours(0,0,0,0);
    const rows=projects.length?projects.map(p=>{
      const d=p.date?new Date(p.date+'T00:00:00'):null;
      const isToday=d&&d.getTime()===today.getTime();
      const overdue=d&&d<today&&p.status!=='Zrealizowany';
      return `<div class="calendar-live-row ${isToday?'today':''} ${overdue?'overdue':''}"><div class="date">${esc(fmtDate(p.date))}</div><div><b>${esc(p.name||'Projekt')}</b><span style="display:block;margin-top:2px">${esc(p.type||'Projekt')}</span></div><span>${esc(p.platform||'—')}</span><span class="status-pro ${statusClass(p.status)}">${esc(p.status)}</span></div>`;
    }).join(''):'<div class="live-project-empty">Kalendarz jest pusty. Dodaj datę publikacji do projektu.</div>';
    content.innerHTML=`<section class="creator-tool-hero"><div><div class="eyebrow">PUBLISHING CONTROL</div><h2>Kalendarz publikacji</h2><p>Terminy są pobierane bezpośrednio z zapisanych projektów.</p></div><button class="primary" id="calendarNewProject">＋ Nowy projekt</button></section><section class="card panel-card"><div class="section-head"><h2>Plan publikacji</h2><span class="tag">${projects.length} pozycji</span></div><div class="calendar-live-list">${rows}</div></section>`;
    document.getElementById('calendarNewProject')?.addEventListener('click',()=>document.getElementById('newProjectBtn')?.click());
  }

  function bind(){
    document.querySelector('[data-view="dashboard"]')?.addEventListener('click',()=>setTimeout(injectDashboard,0));
    document.querySelector('[data-view="calendar"]')?.addEventListener('click',()=>setTimeout(renderCalendar,0));
    document.getElementById('saveProject')?.addEventListener('click',()=>setTimeout(()=>{
      if(document.querySelector('[data-view="dashboard"]')?.classList.contains('active'))injectDashboard();
    },30));
    document.addEventListener('click',e=>{
      if(e.target.closest('[data-edit],[data-delete],#saveEditProject'))setTimeout(()=>{
        if(document.querySelector('[data-view="calendar"]')?.classList.contains('active'))renderCalendar();
      },30);
    });
    setTimeout(()=>{
      if(document.querySelector('[data-view="dashboard"]')?.classList.contains('active'))injectDashboard();
      if(document.querySelector('[data-view="calendar"]')?.classList.contains('active'))renderCalendar();
    },50);
  }
  document.addEventListener('DOMContentLoaded',bind);
})();
