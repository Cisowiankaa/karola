(()=>{
  if(window.__bdsmMonthCalendarStatusV2Installed)return;
  window.__bdsmMonthCalendarStatusV2Installed=true;
  const OFF='bdsm-app-offences-v1',TASKS='bdsm-app-education-tasks-v1',NOTES='bdsm-app-written-notes-v1',EVENTS='bdsm-app-events-v3',META='bdsm-app-day-agenda-meta-v1';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const pad=n=>String(n).padStart(2,'0');
  const key=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?'':`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
  const points=e=>Number(e.points_delta??e.points??0)||0;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  function aggregate(){
    const m={}; const get=k=>m[k]||(m[k]={off:0,tasks:0,notes:0,points:0,agendaDone:false,total:0});
    read(OFF,[]).forEach(x=>{const k=key(x.occurred_at||x.created_at);if(k){get(k).off++;get(k).total++}});
    read(TASKS,[]).forEach(x=>{const k=key(x.due_at||x.created_at);if(k){get(k).tasks++;get(k).total++}});
    read(NOTES,[]).forEach(x=>{const k=key(x.issued_at||x.created_at);if(k){get(k).notes++;get(k).total++}});
    read(EVENTS,[]).forEach(x=>{const k=key(x.start||x.created_at||x.updated_at);if(k){get(k).points+=points(x);get(k).total++}});
    const meta=read(META,{});Object.entries(meta||{}).forEach(([k,v])=>{if(v&&typeof v==='object')get(k).agendaDone=!!v.done});
    return m;
  }
  function status(a){if(a.agendaDone)return['✓','Zakończony'];if(a.off>0)return['⚠','Wymaga uwagi'];if(a.tasks>0)return['•','Aktywny'];return['',''];}
  function decorate(){
    const grid=document.querySelector('#mcGrid');if(!grid)return;
    const data=aggregate();
    grid.querySelectorAll('[data-mc-date]').forEach(day=>{
      day.querySelector('.mc-day-kpi')?.remove();
      const k=day.dataset.mcDate,a=data[k]||{off:0,tasks:0,notes:0,points:0,agendaDone:false,total:0},[icon,label]=status(a);
      const box=document.createElement('div');box.className='mc-day-kpi';box.style.cssText='margin-top:6px;display:flex;gap:4px;flex-wrap:wrap;font-size:9px;color:#b8c1d1';
      box.innerHTML=`${icon?`<span title="${esc(label)}">${icon}</span>`:''}${a.off?`<span>⚠${a.off}</span>`:''}${a.tasks?`<span>📚${a.tasks}</span>`:''}${a.notes?`<span>📝${a.notes}</span>`:''}${a.points?`<span>${a.points>0?'+':''}${a.points} pkt</span>`:''}`;
      day.appendChild(box);
      day.title=[label,a.off&&`Przewinienia: ${a.off}`,a.tasks&&`Zadania: ${a.tasks}`,a.notes&&`Uwagi: ${a.notes}`,a.points&&`Punkty: ${a.points}`].filter(Boolean).join('\n');
    });
  }
  function enrichDetail(){
    const box=document.querySelector('#mcDetail');if(!box)return;const selected=document.querySelector('#mcGrid .mc-day.selected')?.dataset.mcDate;if(!selected)return;
    if(box.querySelector('.mc-detail-kpi'))return;
    const a=aggregate()[selected]||{off:0,tasks:0,notes:0,points:0,agendaDone:false};
    const row=document.createElement('div');row.className='mc-detail-kpi mc-summary';row.innerHTML=`<span class="mc-pill">⚠ ${a.off}</span><span class="mc-pill">📚 ${a.tasks}</span><span class="mc-pill">📝 ${a.notes}</span><span class="mc-pill">${a.points>0?'+':''}${a.points} pkt</span><span class="mc-pill">${a.agendaDone?'✓ Dzień zakończony':'Dzień otwarty'}</span>`;
    const h=box.querySelector('h3');if(h)h.insertAdjacentElement('afterend',row);else box.prepend(row);
  }
  function refresh(){requestAnimationFrame(()=>{decorate();enrichDetail()})}
  const mo=new MutationObserver(refresh);
  function install(){const view=document.querySelector('#view-month-calendar');if(view)mo.observe(view,{childList:true,subtree:true});refresh();['bdsm-offences-updated','bdsm-education-tasks-updated','bdsm-written-notes-updated','bdsm-day-agenda-updated','bdsm-sync-complete'].forEach(e=>document.addEventListener(e,refresh));window.addEventListener('storage',refresh)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
