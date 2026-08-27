(()=>{
  if(window.__bdsmActivityCenterInstalled)return;
  window.__bdsmActivityCenterInstalled=true;
  const KEYS={events:'bdsm-app-events-v3',offences:'bdsm-app-offences-v1',tasks:'bdsm-app-education-tasks-v1',notes:'bdsm-app-written-notes-v1',hours:'bdsm-app-hourly-reports-v1'};
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(_){return d}};
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const dt=v=>{if(!v)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d};
  const fmt=v=>{const d=dt(v);return d?d.toLocaleString('pl-PL'):'—'};
  const pickTime=x=>x.updated_at||x.done_at||x.closed_at||x.issued_at||x.occurred_at||x.due_at||x.start||x.created_at||x.date||null;
  function collect(){
    const out=[];
    read(KEYS.events,[]).forEach(x=>out.push({kind:'event',icon:'⚖',label:x.type||'Wydarzenie',title:x.title||'Wydarzenie',status:x.status||'',id:x.event_id||x.id||'',at:pickTime(x)}));
    read(KEYS.offences,[]).forEach(x=>out.push({kind:'offence',icon:'⚠',label:'Przewinienie',title:x.title||'Przewinienie',status:x.status||'',id:x.przewinienie_id||x.offence_id||'',at:pickTime(x)}));
    read(KEYS.tasks,[]).forEach(x=>out.push({kind:'task',icon:'📚',label:'Zadanie edukacyjne',title:x.title||'Zadanie',status:x.status||'',id:x.task_id||'',at:pickTime(x)}));
    read(KEYS.notes,[]).forEach(x=>out.push({kind:'note',icon:'📝',label:x.type||'Uwaga / upomnienie',title:x.title||x.type||'Uwaga',status:x.status||'',id:x.note_id||'',at:pickTime(x)}));
    read(KEYS.hours,[]).forEach(x=>out.push({kind:'hour',icon:'🕐',label:'Dziennik godzinowy',title:x.title||'Wpis godzinowy',status:x.status||'',id:x.report_id||'',at:pickTime(x)}));
    return out.filter(x=>dt(x.at)).sort((a,b)=>dt(b.at)-dt(a.at));
  }
  function openItem(kind,id){
    if(kind==='offence'){window.bdsmRelationshipTimeline?.openCase?.(id)||window.bdsmOffences?.open?.();return}
    if(kind==='task'){window.bdsmEducationTasks?.open?.();return}
    if(kind==='note'){window.bdsmWrittenNotes?.open?.();return}
    if(kind==='hour'){window.bdsmHourlyReports?.open?.();return}
    if(kind==='event'){document.querySelector('#deadlinesNav')?.click();return}
  }
  function ensureUI(){
    const nav=document.querySelector('#nav'),content=document.querySelector('.content');if(!nav||!content)return;
    if(!document.querySelector('#activityCenterNav')){const b=document.createElement('button');b.id='activityCenterNav';b.type='button';b.dataset.view='activity-center';b.innerHTML='🕘 Centrum aktywności';nav.appendChild(b);b.onclick=e=>{e.preventDefault();open()}}
    if(!document.querySelector('#activityCenterStyles')){const s=document.createElement('style');s.id='activityCenterStyles';s.textContent='.ac-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 14px}.ac-toolbar input,.ac-toolbar select{background:#0a101a;color:#eef1f6;border:1px solid #283141;border-radius:8px;padding:9px}.ac-toolbar input{min-width:240px;flex:1}.ac-row{display:grid;grid-template-columns:42px 150px 1fr 150px auto;gap:10px;align-items:center;padding:11px 0;border-bottom:1px solid #222a39}.ac-icon{font-size:20px}.ac-meta{font-size:11px;color:#98a2b3}.ac-status{font-size:11px}.ac-empty{color:#667085;padding:18px 0}@media(max-width:800px){.ac-row{grid-template-columns:36px 1fr auto}.ac-row .ac-type,.ac-row .ac-status{display:none}.ac-row .ac-open{grid-column:2/4}}';document.head.appendChild(s)}
    if(!document.querySelector('#view-activity-center')){const sec=document.createElement('section');sec.id='view-activity-center';sec.className='hidden';sec.innerHTML='<div class="panel"><h3>🕘 Centrum aktywności</h3><p style="color:#98a2b3;font-size:12px;margin-top:-6px">Ostatnie zmiany z całej aplikacji. Widok informacyjny — niczego nie zmienia automatycznie.</p><div class="ac-toolbar"><input id="acSearch" type="search" placeholder="Szukaj po tytule, statusie lub ID"><select id="acType"><option value="all">Wszystkie typy</option><option value="event">Wydarzenia</option><option value="offence">Przewinienia</option><option value="task">Zadania</option><option value="note">Uwagi / upomnienia</option><option value="hour">Dziennik godzinowy</option></select><select id="acLimit"><option value="20">20 ostatnich</option><option value="50" selected>50 ostatnich</option><option value="100">100 ostatnich</option></select></div><div id="acList"></div></div>';content.appendChild(sec);sec.querySelector('#acSearch').oninput=render;sec.querySelector('#acType').onchange=render;sec.querySelector('#acLimit').onchange=render;sec.onclick=e=>{const b=e.target.closest('[data-ac-open]');if(b)openItem(b.dataset.acOpen,b.dataset.acId)}}
  }
  function render(){ensureUI();const q=(document.querySelector('#acSearch')?.value||'').trim().toLowerCase(),type=document.querySelector('#acType')?.value||'all',limit=Number(document.querySelector('#acLimit')?.value||50);let rows=collect().filter(x=>(type==='all'||x.kind===type)&&(!q||`${x.title} ${x.status} ${x.id} ${x.label}`.toLowerCase().includes(q))).slice(0,limit);const box=document.querySelector('#acList');if(!box)return;box.innerHTML=rows.length?rows.map(x=>`<div class="ac-row"><div class="ac-icon">${x.icon}</div><div class="ac-type"><strong>${esc(x.label)}</strong><div class="ac-meta">${esc(fmt(x.at))}</div></div><div><strong>${esc(x.title)}</strong><div class="ac-meta">${esc(x.id||'')}</div></div><div class="ac-status">${esc(x.status||'—')}</div><button class="btn ac-open" data-ac-open="${esc(x.kind)}" data-ac-id="${esc(x.id)}">Otwórz</button></div>`).join(''):'<div class="ac-empty">Brak aktywności spełniającej filtry.</div>'}
  function open(){ensureUI();document.querySelectorAll('.content > section').forEach(s=>s.classList.add('hidden'));document.querySelector('#view-activity-center')?.classList.remove('hidden');document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));document.querySelector('#activityCenterNav')?.classList.add('active');render()}
  function install(){ensureUI();['bdsm-offences-updated','bdsm-written-notes-updated','bdsm-education-tasks-updated','bdsm-case-linked','bdsm-sync-complete','bdsm-hourly-reports-updated'].forEach(ev=>document.addEventListener(ev,()=>{if(!document.querySelector('#view-activity-center')?.classList.contains('hidden'))render()}));window.addEventListener('storage',()=>{if(!document.querySelector('#view-activity-center')?.classList.contains('hidden'))render()});window.bdsmActivityCenter={open,refresh:render,items:collect};}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
