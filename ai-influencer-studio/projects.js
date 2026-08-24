(() => {
  const KEY='aii-projects';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}};
  const write=items=>localStorage.setItem(KEY,JSON.stringify(items));
  const style=document.createElement('style');
  style.textContent=`
    .projects-toolbar{display:flex;gap:8px;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap}
    .projects-toolbar .filters{display:flex;gap:7px;flex-wrap:wrap}.projects-toolbar input,.projects-toolbar select{border:1px solid #e3e5ed;border-radius:9px;background:#fff;padding:8px 10px;font-size:9px}
    .project-list-pro{display:grid;gap:9px}.project-row-pro{display:grid;grid-template-columns:1.5fr .7fr .7fr .8fr auto;gap:10px;align-items:center;padding:12px 13px;border:1px solid #e9ebf2;border-radius:12px;background:#fff}.project-row-pro:hover{border-color:#dcd5fb;box-shadow:0 8px 22px rgba(40,43,64,.055)}
    .project-name-pro b{display:block;font-size:10px}.project-name-pro small{font-size:8px;color:#888e9b}.project-cell-pro{font-size:8px;color:#59606d}.project-actions-pro{display:flex;gap:5px}.project-actions-pro button{border:1px solid #e4e6ee;background:white;border-radius:8px;padding:6px 8px;cursor:pointer;font-size:8px}.project-actions-pro button:hover{background:#f8f6ff;border-color:#cec4fb;color:#6246d8}
    .status-pro{display:inline-flex;padding:4px 7px;border-radius:999px;font-size:7px;font-weight:800;background:#f1edff;color:#694edb}.status-pro.done{background:#eaf7f0;color:#18865b}.status-pro.plan{background:#edf5ff;color:#3974b8}.empty-projects-pro{text-align:center;padding:42px 20px;color:#858b98}.empty-projects-pro b{display:block;color:#2a2d37;font-size:12px;margin-bottom:5px}
    .project-edit-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.project-edit-grid label{font-size:8px;color:#777;display:grid;gap:4px}.project-edit-grid input,.project-edit-grid select,.project-edit-grid textarea{border:1px solid #e3e5ed;border-radius:9px;padding:9px;background:#fbfbfd}.project-edit-grid textarea{grid-column:1/-1;min-height:80px}
    @media(max-width:950px){.project-row-pro{grid-template-columns:1fr 1fr}.project-actions-pro{grid-column:1/-1}.project-edit-grid{grid-template-columns:1fr}.project-edit-grid textarea{grid-column:auto}}
  `;
  document.head.appendChild(style);

  function normalize(p){return {...p,status:p.status||'Plan',date:p.date||'',platform:p.platform||'—',type:p.type||'Projekt'}}
  function renderProjects(filter='all',query=''){
    const content=document.getElementById('content'); if(!content)return;
    const items=read().map(normalize).filter(p=>filter==='all'||p.status===filter).filter(p=>(p.name||'').toLowerCase().includes(query.toLowerCase()));
    const rows=items.length?items.map(p=>`<div class="project-row-pro" data-pid="${p.id}">
      <div class="project-name-pro"><b>${esc(p.name)}</b><small>${esc(p.type)} · ${esc(p.platform)}</small></div>
      <div class="project-cell-pro"><span class="status-pro ${p.status==='Zrealizowany'?'done':p.status==='Zaplanowany'?'plan':''}">${esc(p.status)}</span></div>
      <div class="project-cell-pro">${esc(p.date||'Brak daty')}</div>
      <div class="project-cell-pro">${esc((p.notes||'').slice(0,70)||'Brak notatek')}</div>
      <div class="project-actions-pro"><button data-edit="${p.id}">Edytuj</button><button data-delete="${p.id}">Usuń</button></div>
    </div>`).join(''):`<div class="card empty-projects-pro"><b>Brak projektów</b><span>Utwórz pierwszy projekt przyciskiem „Nowy projekt”.</span></div>`;
    content.innerHTML=`<section class="creator-tool-hero"><div><div class="eyebrow">PROJECT CONTROL</div><h2>Moje projekty</h2><p>Wszystkie zapisane materiały, kampanie i publikacje w jednym miejscu.</p></div><button class="primary" id="projectsNewBtn">＋ Nowy projekt</button></section>
      <section class="card panel-card"><div class="projects-toolbar"><div class="filters"><input id="projectSearchPro" placeholder="Szukaj projektu..." value="${esc(query)}"><select id="projectFilterPro"><option value="all">Wszystkie statusy</option><option>Plan</option><option>Zaplanowany</option><option>W realizacji</option><option>Zrealizowany</option></select></div><span class="tag">${items.length} projektów</span></div><div class="project-list-pro">${rows}</div></section>`;
    const f=document.getElementById('projectFilterPro'); if(f)f.value=filter;
    document.getElementById('projectSearchPro')?.addEventListener('input',e=>renderProjects(f?.value||'all',e.target.value));
    f?.addEventListener('change',e=>renderProjects(e.target.value,document.getElementById('projectSearchPro')?.value||''));
    document.getElementById('projectsNewBtn')?.addEventListener('click',()=>document.getElementById('newProjectBtn')?.click());
    content.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{const id=Number(b.dataset.delete);if(confirm('Usunąć ten projekt?')){write(read().filter(p=>Number(p.id)!==id));renderProjects(filter,query)}});
    content.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editProject(Number(b.dataset.edit),filter,query));
  }

  function editProject(id,filter,query){
    const items=read(); const p=items.find(x=>Number(x.id)===id); if(!p)return;
    const content=document.getElementById('content');
    content.innerHTML=`<section class="card panel-card"><div class="section-head"><h2>Edytuj projekt</h2><button class="ghost" id="backProjects">← Wróć</button></div><div class="project-edit-grid">
      <label>Nazwa<input id="epName" value="${esc(p.name)}"></label><label>Status<select id="epStatus"><option>Plan</option><option>Zaplanowany</option><option>W realizacji</option><option>Zrealizowany</option></select></label>
      <label>Typ<input id="epType" value="${esc(p.type||'')}"></label><label>Platforma<input id="epPlatform" value="${esc(p.platform||'')}"></label><label>Data<input id="epDate" type="date" value="${esc(p.date||'')}"></label><textarea id="epNotes">${esc(p.notes||'')}</textarea></div><div class="modal-actions"><button class="primary" id="saveEditProject">Zapisz zmiany</button></div></section>`;
    document.getElementById('epStatus').value=p.status||'Plan';
    document.getElementById('backProjects').onclick=()=>renderProjects(filter,query);
    document.getElementById('saveEditProject').onclick=()=>{const next=items.map(x=>Number(x.id)===id?{...x,name:document.getElementById('epName').value.trim()||'Projekt',status:document.getElementById('epStatus').value,type:document.getElementById('epType').value,platform:document.getElementById('epPlatform').value,date:document.getElementById('epDate').value,notes:document.getElementById('epNotes').value}:x);write(next);window.showToast?.('Projekt zaktualizowany');renderProjects(filter,query)};
  }

  document.addEventListener('DOMContentLoaded',()=>{
    const nav=document.querySelector('.nav');
    if(nav&&!document.querySelector('[data-view="projects"]')){
      const title=[...nav.querySelectorAll('.nav-title')].find(x=>x.textContent.includes('ZARZĄDZANIE'));
      const a=document.createElement('a');a.className='nav-item';a.dataset.view='projects';a.innerHTML='▦ <span>Moje projekty</span>';
      title?.insertAdjacentElement('afterend',a);
      a.addEventListener('click',()=>{document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));a.classList.add('active');document.getElementById('pageTitle').textContent='Moje projekty';document.getElementById('pageSubtitle').textContent='Zarządzaj projektami, statusami i terminami publikacji.';localStorage.setItem('aii-last-view','projects');renderProjects()});
    }
    if(localStorage.getItem('aii-last-view')==='projects')setTimeout(()=>document.querySelector('[data-view="projects"]')?.click(),10);
  });
})();