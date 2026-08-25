(() => {
  const MONEY_KEY = 'aii-monetization-lab';
  const PROJECTS_KEY = 'aii-projects';
  const PROFILE_KEY = 'aii-creator-profile';
  const q = (s, root=document) => root.querySelector(s);
  const qa = (s, root=document) => [...root.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const read = (k,d) => { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); } catch { return d; } };
  const save = (k,v) => localStorage.setItem(k, JSON.stringify(v));
  const toast = t => window.showToast ? window.showToast(t) : alert(t);

  const style = document.createElement('style');
  style.textContent = `
    .ml-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 12px}.ml-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    .ml-item{border:1px solid #e7e9f1;border-radius:14px;padding:14px;background:#fff}.ml-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px}.ml-head b{font-size:11px}.ml-badge{font-size:7px;font-weight:900;padding:5px 7px;border-radius:999px;background:#eef2ff;color:#5668a8;white-space:nowrap}
    .ml-desc{font-size:8px;color:#727a89;line-height:1.55;min-height:38px}.ml-controls{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.ml-controls label{display:grid;gap:4px;font-size:7px;font-weight:800;color:#7a8190}.ml-controls select,.ml-controls input{width:100%;box-sizing:border-box;border:1px solid #dfe2eb;border-radius:9px;padding:8px;background:#fafbfe;color:#252936;font:inherit}.ml-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.ml-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0}.ml-kpi{padding:10px;border:1px solid #eceef4;border-radius:12px;background:#fafbfe}.ml-kpi b{display:block;font-size:16px}.ml-kpi span{font-size:7px;color:#7b8290}.ml-note{font-size:8px;color:#7a8190;line-height:1.5;margin-top:8px}
    @media(max-width:800px){.ml-grid,.ml-controls,.ml-summary{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function profile(){
    const p = read(PROFILE_KEY, {});
    return {niche:p.niche || 'beauty / lifestyle / UGC', audience:p.audience || 'Twojej społeczności'};
  }

  function defaults(){
    const p = profile();
    return [
      {id:'ugc',name:'Pakiety UGC',type:'Usługa',priority:'Wysoki',status:'Pomysł',desc:`Pakiety 1 video, 3 video oraz video + zdjęcia dopasowane do niszy ${p.niche}.`,note:''},
      {id:'digital',name:'Produkt cyfrowy',type:'Produkt',priority:'Wysoki',status:'Pomysł',desc:'Mini e-book, checklista, planner, szablon lub przewodnik oparty na najczęstszych pytaniach odbiorców.',note:''},
      {id:'affiliate',name:'Afiliacja',type:'Prowizja',priority:'Średni',status:'Pomysł',desc:'Rekomendacje produktów i usług naturalnie wynikających z treści oraz potrzeb społeczności.',note:''},
      {id:'brand',name:'Współprace markowe',type:'Kampania',priority:'Wysoki',status:'Pomysł',desc:'Długoterminowe pakiety ambasadorskie i kampanie oparte na filarach treści, nie na pojedynczym poście.',note:''},
      {id:'newsletter',name:'Płatny newsletter',type:'Subskrypcja',priority:'Średni',status:'Pomysł',desc:'Treści premium: analizy, checklisty, kulisy, gotowe materiały i rekomendacje dla najbardziej zaangażowanych odbiorców.',note:''},
      {id:'b2b',name:'Szkolenia / webinary B2B',type:'B2B',priority:'Średni',status:'Pomysł',desc:'Warsztaty, szkolenia online lub materiały eksperckie dla firm związanych z Twoją niszą.',note:''}
    ];
  }

  function ideas(){
    const saved = read(MONEY_KEY, []);
    if (!Array.isArray(saved) || !saved.length) return defaults();
    const base = defaults();
    return base.map(x => ({...x, ...(saved.find(s => s.id === x.id) || {})}));
  }

  function persistFromDom(){
    const data = ideas().map(item => {
      const root = q(`[data-ml-id="${item.id}"]`);
      if (!root) return item;
      return {...item,
        priority:q('[data-ml-priority]',root)?.value || item.priority,
        status:q('[data-ml-status]',root)?.value || item.status,
        note:q('[data-ml-note]',root)?.value || ''
      };
    });
    save(MONEY_KEY, data);
    updateSummary(data);
    return data;
  }

  function updateSummary(data=ideas()){
    const active = data.filter(x => x.status === 'Aktywne').length;
    const prep = data.filter(x => x.status === 'Do przygotowania').length;
    const high = data.filter(x => x.priority === 'Wysoki').length;
    const a=q('#mlActive'), b=q('#mlPrep'), c=q('#mlHigh');
    if(a)a.textContent=active; if(b)b.textContent=prep; if(c)c.textContent=high;
  }

  function offerText(item){
    const p = profile();
    return `${item.name}\n\nModel: ${item.type}\nNisza: ${p.niche}\nOdbiorcy: ${p.audience}\n\n${item.desc}${item.note ? `\n\nNotatki: ${item.note}` : ''}`;
  }

  function copy(text){
    if(navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(()=>toast('Oferta skopiowana')).catch(()=>fallback(text));
    else fallback(text);
  }
  function fallback(text){
    const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('Oferta skopiowana');
  }

  function projectFrom(item){
    const projects = read(PROJECTS_KEY, []);
    const d = new Date(); d.setDate(d.getDate()+7);
    projects.push({
      id:Date.now(),
      name:`Monetyzacja — ${item.name}`,
      type:item.type === 'Kampania' ? 'Kampania' : 'Projekt',
      platform:'Multi-platform',
      date:d.toISOString().slice(0,10),
      notes:offerText(item)
    });
    save(PROJECTS_KEY, projects);
    window.dispatchEvent(new StorageEvent('storage',{key:PROJECTS_KEY}));
    toast(`Utworzono projekt: ${item.name}`);
  }

  function render(){
    const section = qa('#content .bp-card').find(card => q('h3',card)?.textContent.trim() === 'Pomysły na monetyzację');
    if(!section || section.dataset.monetizationLab === '1') return;
    section.dataset.monetizationLab='1';
    const data=ideas();
    section.innerHTML=`
      <div class="bp-section-title"><div><h3>Pomysły na monetyzację</h3><div class="bp-mini">Monetization Lab — zamieniaj strategię w konkretne źródła przychodu.</div></div><div class="ml-toolbar"><button class="ghost" id="mlReset">Odśwież pomysły</button><button class="primary" id="mlSave">Zapisz plan</button></div></div>
      <div class="ml-summary"><div class="ml-kpi"><b id="mlActive">0</b><span>aktywne źródła</span></div><div class="ml-kpi"><b id="mlPrep">0</b><span>do przygotowania</span></div><div class="ml-kpi"><b id="mlHigh">0</b><span>wysoki priorytet</span></div></div>
      <div class="ml-grid">${data.map(item=>`<article class="ml-item" data-ml-id="${esc(item.id)}"><div class="ml-head"><b>${esc(item.name)}</b><span class="ml-badge">${esc(item.type)}</span></div><div class="ml-desc">${esc(item.desc)}</div><div class="ml-controls"><label>Priorytet<select data-ml-priority><option${item.priority==='Wysoki'?' selected':''}>Wysoki</option><option${item.priority==='Średni'?' selected':''}>Średni</option><option${item.priority==='Niski'?' selected':''}>Niski</option></select></label><label>Status<select data-ml-status><option${item.status==='Pomysł'?' selected':''}>Pomysł</option><option${item.status==='Do przygotowania'?' selected':''}>Do przygotowania</option><option${item.status==='Aktywne'?' selected':''}>Aktywne</option></select></label></div><div class="ml-controls" style="grid-template-columns:1fr"><label>Notatki / oferta<input data-ml-note value="${esc(item.note||'')}" placeholder="Np. cena, zakres pakietu, marka docelowa"></label></div><div class="ml-actions"><button class="ghost" data-ml-copy="${esc(item.id)}">Kopiuj ofertę</button><button class="primary" data-ml-project="${esc(item.id)}">Utwórz projekt</button></div></article>`).join('')}</div>
      <div class="ml-note">Plan działa lokalnie także bez AI. Dane zapisują się w przeglądarce i nie blokują pozostałych modułów.</div>`;

    updateSummary(data);
    qa('[data-ml-status], [data-ml-priority], [data-ml-note]',section).forEach(el=>el.addEventListener('change',persistFromDom));
    q('#mlSave',section).onclick=()=>{persistFromDom();toast('Plan monetyzacji zapisany')};
    q('#mlReset',section).onclick=()=>{save(MONEY_KEY,defaults());section.dataset.monetizationLab='0';render();toast('Pomysły odświeżone')};
    qa('[data-ml-copy]',section).forEach(btn=>btn.onclick=()=>{const item=persistFromDom().find(x=>x.id===btn.dataset.mlCopy);if(item)copy(offerText(item));});
    qa('[data-ml-project]',section).forEach(btn=>btn.onclick=()=>{const item=persistFromDom().find(x=>x.id===btn.dataset.mlProject);if(item)projectFrom(item);});
  }

  const observer = new MutationObserver(()=>render());
  document.addEventListener('DOMContentLoaded',()=>{
    const root=q('#content');
    if(root)observer.observe(root,{childList:true,subtree:true});
    render();
  });
  setTimeout(render,0);
  window.AII_MonetizationLab={render};
})();