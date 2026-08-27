(()=>{
  if(window.__bdsmGlobalSearchInstalled)return;
  window.__bdsmGlobalSearchInstalled=true;
  const STORES={
    event:'bdsm-app-events-v3',
    offence:'bdsm-app-offences-v1',
    task:'bdsm-app-education-tasks-v1',
    note:'bdsm-app-written-notes-v1',
    hour:'bdsm-app-hourly-reports-v1'
  };
  const read=(k,d=[])=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const when=x=>x.occurred_at||x.issued_at||x.due_at||x.start||x.date||x.created_at||x.updated_at||'';
  const id=x=>x.event_id||x.id||x.offence_id||x.przewinienie_id||x.task_id||x.note_id||x.report_id||'';
  const title=x=>x.title||x.type||x.text||'Bez tytułu';
  const meta=x=>[x.status,x.category,x.severity,x.type,x.description,x.body,x.note].filter(Boolean).join(' • ');
  function all(){
    const out=[];
    Object.entries(STORES).forEach(([kind,key])=>read(key,[]).forEach(x=>out.push({kind,raw:x,id:id(x),title:title(x),meta:meta(x),when:when(x)})));
    return out.sort((a,b)=>new Date(b.when||0)-new Date(a.when||0));
  }
  const labels={event:'Wydarzenie',offence:'Przewinienie',task:'Zadanie',note:'Uwaga / upomnienie',hour:'Dziennik godzinowy'};
  const icons={event:'⚖',offence:'⚠',task:'📚',note:'📝',hour:'🕐'};
  function openItem(kind,id){
    if(kind==='offence'){window.bdsmRelationshipTimeline?.openCase?.(id)||window.bdsmOffences?.open?.();return}
    if(kind==='task'){window.bdsmEducationTasks?.open?.();return}
    if(kind==='note'){window.bdsmWrittenNotes?.open?.();return}
    if(kind==='hour'){window.bdsmHourlyReports?.open?.();return}
    if(kind==='event'){document.querySelector('#deadlinesNav')?.click();return}
  }
  function render(){
    const q=norm(document.querySelector('#globalSearchInput')?.value||''),type=document.querySelector('#globalSearchType')?.value||'all',box=document.querySelector('#globalSearchResults');if(!box)return;
    let rows=all();if(type!=='all')rows=rows.filter(x=>x.kind===type);if(q)rows=rows.filter(x=>norm(`${x.id} ${x.title} ${x.meta}`).includes(q));
    document.querySelector('#globalSearchCount').textContent=`${rows.length} wyników`;
    box.innerHTML=rows.length?rows.slice(0,200).map(x=>`<button class="gs-row" type="button" data-gs-kind="${esc(x.kind)}" data-gs-id="${esc(x.id)}"><span class="gs-icon">${icons[x.kind]}</span><span><strong>${esc(x.title)}</strong><small>${esc(labels[x.kind])}${x.id?' • '+esc(x.id):''}${x.meta?' • '+esc(x.meta):''}</small></span><time>${x.when?esc(new Date(x.when).toLocaleString('pl-PL')):'—'}</time></button>`).join(''):'<div class="empty">Brak wyników.</div>';
  }
  function ensure(){
    const nav=document.querySelector('#nav'),content=document.querySelector('.content');if(!nav||!content)return;
    if(!document.querySelector('#globalSearchNav')){const b=document.createElement('button');b.id='globalSearchNav';b.type='button';b.dataset.view='global-search';b.innerHTML='🔎 Wyszukiwanie';nav.appendChild(b);b.onclick=e=>{e.preventDefault();open()}}
    if(!document.querySelector('#globalSearchStyles')){const st=document.createElement('style');st.id='globalSearchStyles';st.textContent='.gs-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.gs-toolbar input,.gs-toolbar select{background:#0a101a;color:#eef1f6;border:1px solid #283141;border-radius:8px;padding:10px}.gs-toolbar input{flex:1;min-width:260px}.gs-row{width:100%;display:grid;grid-template-columns:36px 1fr auto;gap:10px;align-items:center;text-align:left;padding:11px;border:0;border-bottom:1px solid #222a39;background:transparent;color:inherit;cursor:pointer}.gs-row:hover{background:#111827}.gs-row small{display:block;color:#98a2b3;margin-top:3px}.gs-row time{font-size:11px;color:#98a2b3}.gs-icon{font-size:20px}@media(max-width:700px){.gs-row{grid-template-columns:32px 1fr}.gs-row time{grid-column:2}}';document.head.appendChild(st)}
    if(!document.querySelector('#view-global-search')){const s=document.createElement('section');s.id='view-global-search';s.className='hidden';s.innerHTML='<div class="panel"><h3>🔎 Wyszukiwanie</h3><p style="color:#98a2b3;font-size:12px;margin-top:-6px">Przeszukuje lokalne dane aplikacji. Wyniki są tylko informacyjne i nie zmieniają żadnych wpisów.</p><div class="gs-toolbar"><input id="globalSearchInput" type="search" placeholder="Szukaj po tytule, opisie, statusie lub ID"><select id="globalSearchType"><option value="all">Wszystko</option><option value="offence">Przewinienia</option><option value="task">Zadania</option><option value="note">Uwagi / upomnienia</option><option value="event">Wydarzenia</option><option value="hour">Dziennik godzinowy</option></select><span id="globalSearchCount" class="mc-pill">0 wyników</span></div><div id="globalSearchResults"></div></div>';content.appendChild(s);s.querySelector('#globalSearchInput').oninput=render;s.querySelector('#globalSearchType').onchange=render;s.onclick=e=>{const r=e.target.closest('[data-gs-kind]');if(r)openItem(r.dataset.gsKind,r.dataset.gsId)}}
  }
  function open(){ensure();document.querySelectorAll('.content > section').forEach(s=>s.classList.add('hidden'));document.querySelector('#view-global-search')?.classList.remove('hidden');document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));document.querySelector('#globalSearchNav')?.classList.add('active');render();setTimeout(()=>document.querySelector('#globalSearchInput')?.focus(),0)}
  function install(){ensure();window.bdsmGlobalSearch={open,render};['bdsm-offences-updated','bdsm-education-tasks-updated','bdsm-written-notes-updated','bdsm-hourly-reports-updated','bdsm-sync-complete'].forEach(e=>document.addEventListener(e,render));window.addEventListener('storage',render)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
