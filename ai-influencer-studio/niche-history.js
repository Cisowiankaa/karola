(() => {
  const HISTORY_KEY='aii-niche-history';
  const FAVORITES_KEY='aii-niche-favorites';
  const PROFILE_KEY='aii-creator-profile';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const toast=t=>window.showToast?window.showToast(t):alert(t);

  const style=document.createElement('style');
  style.textContent=`
    .nh-panel{margin-top:16px;border:1px solid #2f3d58;border-radius:18px;background:linear-gradient(145deg,#0d1524,#101a2d);padding:18px;color:#eef3fb;display:grid;gap:14px}.nh-head{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}.nh-head h3{margin:0;font-size:15px}.nh-tabs{display:flex;gap:7px;flex-wrap:wrap}.nh-tabs button{border:1px solid #35445f;background:#111d32;color:#dfe7f5;border-radius:9px;padding:7px 9px;font-size:8px;font-weight:900;cursor:pointer}.nh-tabs button.active{background:linear-gradient(90deg,#43dff0,#7e72ff,#e85caf);border:0;color:#fff}.nh-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.nh-card{border:1px solid #2f3c55;border-radius:13px;background:#0b1423;padding:12px;display:grid;gap:8px}.nh-card h4{margin:0;font-size:10px;line-height:1.4}.nh-meta{font-size:8px;color:#93a0b5}.nh-actions{display:flex;gap:6px;flex-wrap:wrap}.nh-actions button{border:1px solid #394760;background:#131f33;color:#eef3fb;border-radius:8px;padding:6px 8px;font-size:8px;font-weight:900;cursor:pointer}.nh-actions .fav{background:#3a1f4d;border-color:#7c3f98}.nh-empty{font-size:9px;color:#93a0b5;padding:8px 0}`;
  document.head.appendChild(style);

  function normalizeTitle(s){return String(s||'').trim();}
  function record(title,score=''){
    title=normalizeTitle(title); if(!title)return;
    const arr=read(HISTORY_KEY,[]).filter(x=>x.title!==title);
    arr.unshift({title,score,ts:Date.now()});
    save(HISTORY_KEY,arr.slice(0,40));
    render();
  }
  function toggleFavorite(title,score=''){
    title=normalizeTitle(title); if(!title)return;
    let arr=read(FAVORITES_KEY,[]);
    const idx=arr.findIndex(x=>x.title===title);
    if(idx>=0){arr.splice(idx,1);toast('Usunięto z ulubionych');}
    else{arr.unshift({title,score,ts:Date.now()});toast('Dodano do ulubionych');}
    save(FAVORITES_KEY,arr.slice(0,20));render();
  }
  function use(title){
    const p=read(PROFILE_KEY,{});p.niche=title;save(PROFILE_KEY,p);
    const input=document.getElementById('ncNiche');if(input)input.value=title;
    if(window.AIINicheContentPlan?.build){const plan=window.AIINicheContentPlan.build(title);window.AIINicheContentPlan.render?.(plan);}
    toast('Wybrano niszę z historii');
  }
  function addFavoriteButtons(){
    document.querySelectorAll('.nc-rec').forEach(card=>{
      if(card.querySelector('[data-nh-fav]'))return;
      const title=card.querySelector('h3')?.textContent?.trim();if(!title)return;
      const score=card.querySelector('.nc-score-badge')?.textContent?.trim()||'';
      const btn=document.createElement('button');btn.type='button';btn.dataset.nhFav='1';btn.textContent='☆ Dodaj do ulubionych';btn.style.cssText='border:1px solid #47556f;background:#141f33;color:#eef3fb;border-radius:9px;padding:8px 10px;font-size:8px;font-weight:900;cursor:pointer;width:100%';
      btn.onclick=e=>{e.stopPropagation();toggleFavorite(title,score)};
      card.appendChild(btn);
    });
  }
  function captureVisible(){
    document.querySelectorAll('.nc-rec').forEach(card=>{
      const title=card.querySelector('h3')?.textContent?.trim();
      const score=card.querySelector('.nc-score-badge')?.textContent?.trim()||'';
      if(title)record(title,score);
    });
  }
  let tab='favorites';
  function render(){
    const shell=document.querySelector('.nc-shell');if(!shell)return;
    let panel=document.getElementById('nhPanel');if(!panel){panel=document.createElement('section');panel.id='nhPanel';panel.className='nh-panel';shell.appendChild(panel);}
    const favorites=read(FAVORITES_KEY,[]), history=read(HISTORY_KEY,[]);
    const data=tab==='favorites'?favorites:history;
    panel.innerHTML=`<div class="nh-head"><h3>Historia i ulubione nisze</h3><div class="nh-tabs"><button data-nh-tab="favorites" class="${tab==='favorites'?'active':''}">Ulubione (${favorites.length})</button><button data-nh-tab="history" class="${tab==='history'?'active':''}">Historia (${history.length})</button></div></div>${data.length?`<div class="nh-grid">${data.map(x=>`<article class="nh-card"><h4>${esc(x.title)}</h4><div class="nh-meta">${esc(x.score||'bez oceny')} • ${new Date(x.ts).toLocaleDateString('pl-PL')}</div><div class="nh-actions"><button data-nh-use="${esc(x.title)}">Użyj niszy</button>${tab==='favorites'?`<button class="fav" data-nh-remove="${esc(x.title)}">Usuń</button>`:`<button data-nh-add="${esc(x.title)}">☆ Ulubiona</button>`}</div></article>`).join('')}</div>`:'<div class="nh-empty">Brak zapisanych nisz w tej sekcji.</div>'}`;
    panel.querySelectorAll('[data-nh-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.nhTab;render()});
    panel.querySelectorAll('[data-nh-use]').forEach(b=>b.onclick=()=>use(b.dataset.nhUse));
    panel.querySelectorAll('[data-nh-remove]').forEach(b=>b.onclick=()=>toggleFavorite(b.dataset.nhRemove));
    panel.querySelectorAll('[data-nh-add]').forEach(b=>b.onclick=()=>toggleFavorite(b.dataset.nhAdd));
  }

  document.addEventListener('click',e=>{
    const useBtn=e.target.closest?.('.nc-use');
    if(useBtn){const card=useBtn.closest('.nc-rec');const title=card?.querySelector('h3')?.textContent?.trim();const score=card?.querySelector('.nc-score-badge')?.textContent?.trim()||'';if(title)record(title,score);}
  });
  document.addEventListener('DOMContentLoaded',()=>{
    const root=document.getElementById('content');
    if(root)new MutationObserver(()=>setTimeout(()=>{if(document.querySelector('.nc-shell')){addFavoriteButtons();captureVisible();render();}},20)).observe(root,{childList:true,subtree:true});
    setTimeout(()=>{addFavoriteButtons();captureVisible();render();},100);
  });
  window.AIINicheHistory={record,toggleFavorite,render,use};
})();