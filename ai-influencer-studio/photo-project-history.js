(() => {
  const PROJECTS_KEY='aii-photo-projects';
  const HISTORY_KEY='aii-photo-history';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const toast=t=>window.showToast?window.showToast(t):alert(t);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function isGeneratorView(){return !!document.getElementById('gPhotoGenerate');}

  function restore(item,variant=false){
    const p=document.getElementById('gPhotoPrompt');
    const f=document.getElementById('gPhotoFormat');
    const s=document.getElementById('gPhotoStyle');
    const d=document.getElementById('gPhotoDetails');
    if(p)p.value=item.sourcePrompt||item.prompt||'';
    if(f&&item.format)f.value=item.format;
    if(s&&item.style)s.value=item.style;
    if(d)d.value=variant?`${item.details||''}${item.details?' • ':''}Create a fresh variation with a different composition, pose or camera angle while preserving the same identity and campaign style.`:(item.details||'');
    if(item.provider&&window.AIIImageProvider?.set)window.AIIImageProvider.set(item.provider);
    toast(variant?'Załadowano projekt do stworzenia wariantu':'Projekt załadowany do generatora');
    document.getElementById('gPhotoPrompt')?.scrollIntoView({behavior:'smooth',block:'center'});
  }

  function removeProject(id){
    save(PROJECTS_KEY,read(PROJECTS_KEY,[]).filter(x=>String(x.id)!==String(id)));
    render();
    const count=document.getElementById('gPhotoProjectsCount');
    if(count)count.textContent=`Zapisane projekty: ${read(PROJECTS_KEY,[]).length}`;
    toast('Projekt usunięty');
  }

  function clearHistory(){
    save(HISTORY_KEY,[]);
    render();
    toast('Historia generowania wyczyszczona');
  }

  function render(){
    if(!isGeneratorView())return;
    const anchor=document.getElementById('gPhotoGenerate')?.parentElement;
    if(!anchor)return;
    let panel=document.getElementById('gPhotoHistoryPanel');
    if(!panel){
      panel=document.createElement('section');
      panel.id='gPhotoHistoryPanel';
      panel.style.cssText='margin-top:18px;border:1px solid #e4e7ef;border-radius:14px;background:#fff;padding:14px;display:grid;gap:12px';
      anchor.appendChild(panel);
    }
    const projects=read(PROJECTS_KEY,[]).slice(0,8);
    const history=read(HISTORY_KEY,[]).slice(0,8);
    panel.innerHTML=`
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div><div style="font-size:11px;font-weight:900">Historia i zapisane projekty</div><div style="font-size:9px;color:#7b8290;margin-top:3px">Wracaj do promptów i twórz warianty jednym kliknięciem.</div></div><button type="button" id="gPhotoClearHistory" style="border:1px solid #e0e4ec;background:#fff;border-radius:9px;padding:7px 9px;font-size:9px;font-weight:800;cursor:pointer">Wyczyść historię</button></div>
      <div style="font-size:9px;font-weight:900;color:#5f6675">ZAPISANE PROJEKTY (${projects.length})</div>
      <div id="gPhotoProjectsList" style="display:grid;gap:8px">${projects.length?projects.map(x=>`<article style="border:1px solid #eceef4;border-radius:11px;padding:10px"><div style="font-size:9px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(x.sourcePrompt||x.prompt||'Projekt zdjęcia')}</div><div style="font-size:8px;color:#8a90a0;margin:4px 0">${esc(x.format||'')} ${x.style?'• '+esc(x.style):''} ${x.provider?'• '+esc(x.provider):''}</div><div style="display:flex;gap:6px;flex-wrap:wrap"><button data-load="${esc(x.id)}">Otwórz</button><button data-variant="${esc(x.id)}">Wariant</button><button data-delete="${esc(x.id)}">Usuń</button></div></article>`).join(''):'<div style="font-size:9px;color:#8a90a0">Nie masz jeszcze zapisanych projektów.</div>'}</div>
      <div style="font-size:9px;font-weight:900;color:#5f6675">OSTATNIE GENEROWANIA (${history.length})</div>
      <div id="gPhotoHistoryList" style="display:grid;gap:8px">${history.length?history.map(x=>`<article style="border:1px solid #eceef4;border-radius:11px;padding:10px"><div style="font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(x.prompt||'')}</div><div style="font-size:8px;color:#8a90a0;margin-top:4px">${esc(x.format||'')} ${x.provider?'• '+esc(x.provider):''} ${x.ts?'• '+new Date(x.ts).toLocaleString('pl-PL'):''}</div></article>`).join(''):'<div style="font-size:9px;color:#8a90a0">Brak wygenerowanych zdjęć w historii.</div>'}</div>`;
    panel.querySelectorAll('button[data-load],button[data-variant],button[data-delete]').forEach(b=>b.style.cssText='border:1px solid #dfe3ee;background:#fff;border-radius:8px;padding:6px 8px;font-size:8px;font-weight:800;cursor:pointer');
    panel.querySelectorAll('[data-load]').forEach(b=>b.onclick=()=>{const x=projects.find(p=>String(p.id)===b.dataset.load);if(x)restore(x,false)});
    panel.querySelectorAll('[data-variant]').forEach(b=>b.onclick=()=>{const x=projects.find(p=>String(p.id)===b.dataset.variant);if(x)restore(x,true)});
    panel.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>removeProject(b.dataset.delete));
    document.getElementById('gPhotoClearHistory')?.addEventListener('click',clearHistory);
  }

  function augmentSavedProjects(){
    const projects=read(PROJECTS_KEY,[]);let changed=false;
    projects.forEach(x=>{if(!x.sourcePrompt&&x.prompt){x.sourcePrompt=x.prompt;changed=true;}});
    if(changed)save(PROJECTS_KEY,projects);
  }

  const obs=new MutationObserver(()=>setTimeout(render,0));
  document.addEventListener('DOMContentLoaded',()=>{
    augmentSavedProjects();
    const root=document.getElementById('content');if(root)obs.observe(root,{childList:true,subtree:true});
    window.addEventListener('storage',e=>{if([PROJECTS_KEY,HISTORY_KEY].includes(e.key))render();});
    document.addEventListener('click',e=>{if(e.target?.id==='gPhotoSaveProject')setTimeout(render,50);});
    render();
  });
  window.AIIPhotoHistory={render,restore};
})();