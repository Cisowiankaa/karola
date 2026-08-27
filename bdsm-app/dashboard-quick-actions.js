(()=>{
  if(window.__bdsmDashboardQuickActionsInstalled)return;
  window.__bdsmDashboardQuickActionsInstalled=true;
  const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  function openAction(a){
    if(a==='offences')return window.bdsmOffences?.open?.();
    if(a==='tasks')return window.bdsmEducationTasks?.open?.();
    if(a==='notes')return window.bdsmWrittenNotes?.open?.();
    if(a==='hours')return window.bdsmHourlyReports?.open?.();
    if(a==='agenda')return window.bdsmDayAgenda?.open?.(today());
    if(a==='deadlines')return document.querySelector('#deadlinesNav')?.click();
    if(a==='search')return window.bdsmGlobalSearch?.open?.();
    if(a==='activity')return window.bdsmActivityCenter?.open?.();
    if(a==='sync')return window.bdsmCloudSync?.push?.('dashboard-quick-action');
    if(a==='backup')return document.querySelector('#dashboardDataBackup')?.scrollIntoView({behavior:'smooth',block:'center'});
  }
  function render(){
    const dash=document.querySelector('#view-dashboard');if(!dash)return;
    let box=document.querySelector('#dashboardQuickActions');
    if(!box){box=document.createElement('div');box.id='dashboardQuickActions';box.className='panel';dash.insertBefore(box,dash.firstElementChild||null);box.addEventListener('click',async e=>{const b=e.target.closest('[data-dqa]');if(!b)return;b.disabled=true;try{const r=openAction(b.dataset.dqa);if(r&&typeof r.then==='function')await r}finally{setTimeout(()=>b.disabled=false,500)}})}
    if(!document.querySelector('#dashboardQuickActionsStyles')){const s=document.createElement('style');s.id='dashboardQuickActionsStyles';s.textContent='.dqa-grid{display:grid;grid-template-columns:repeat(5,minmax(120px,1fr));gap:8px}.dqa-grid .btn{min-height:44px;text-align:left}.dqa-note{font-size:11px;color:#98a2b3;margin-top:8px}@media(max-width:1000px){.dqa-grid{grid-template-columns:repeat(2,1fr)}}';document.head.appendChild(s)}
    box.innerHTML='<div class="dtp-head"><h3>⚡ Szybkie akcje</h3><span class="dtp-count">ręczne skróty</span></div><div class="dqa-grid"><button class="btn" data-dqa="agenda">☑ Agenda dnia</button><button class="btn" data-dqa="offences">⚠ Przewinienia</button><button class="btn" data-dqa="tasks">📚 Zadania</button><button class="btn" data-dqa="notes">📝 Uwagi / upomnienia</button><button class="btn" data-dqa="hours">🕐 Dziennik</button><button class="btn" data-dqa="deadlines">📅 Terminy</button><button class="btn" data-dqa="search">🔎 Wyszukiwanie</button><button class="btn" data-dqa="activity">🕘 Aktywność</button><button class="btn" data-dqa="sync">☁ Zapisz w chmurze</button><button class="btn" data-dqa="backup">💾 Kopia danych</button></div><div class="dqa-note">Skróty tylko otwierają moduły lub uruchamiają ręczny zapis. Nie tworzą automatycznych konsekwencji ani nie zmieniają terminów.</div>';
  }
  const boot=()=>{render();new MutationObserver(render).observe(document.body,{childList:true,subtree:true})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
