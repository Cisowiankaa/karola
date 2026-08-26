(() => {
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const toast=t=>window.showToast?window.showToast(t):alert(t);
  const state={minScore:0,demand:'all',competition:'all'};

  const style=document.createElement('style');
  style.textContent=`
    .ncf-panel{margin:10px 0 14px;padding:14px;border:1px solid #34425e;border-radius:14px;background:#0e1727;color:#eef3fb;display:none;gap:10px;grid-template-columns:repeat(4,minmax(130px,1fr));align-items:end}
    .ncf-panel.open{display:grid}.ncf-panel label{display:grid;gap:5px;font-size:8px;font-weight:900;color:#aeb9cc}.ncf-panel select,.ncf-panel input{width:100%;box-sizing:border-box;border:1px solid #39475f;border-radius:9px;padding:8px;background:#101a2b;color:#eef3fb}.ncf-actions{display:flex;gap:7px}.ncf-actions button{border:1px solid #3b4961;border-radius:9px;padding:8px 10px;background:#162238;color:#fff;font-size:8px;font-weight:900;cursor:pointer}.ncf-actions .apply{border:0;background:linear-gradient(90deg,#43dff0,#7e72ff,#e85caf)}.ncf-summary{grid-column:1/-1;font-size:8px;color:#91a0b7}@media(max-width:900px){.ncf-panel{grid-template-columns:1fr 1fr}}`;
  document.head.appendChild(style);

  function scoreOf(card){const t=card.querySelector('.nc-score-badge')?.textContent||'';return Number((t.match(/\d+/)||['0'])[0]);}
  function textOf(card){return (card.textContent||'').toLowerCase();}
  function apply(){
    const cards=qa('#ncRecommendations .nc-rec');
    let shown=0;
    cards.forEach(card=>{
      const text=textOf(card),score=scoreOf(card);
      const okScore=score>=state.minScore;
      const okDemand=state.demand==='all'||text.includes(state.demand);
      const okCompetition=state.competition==='all'||text.includes(state.competition);
      const ok=okScore&&okDemand&&okCompetition;
      card.style.display=ok?'grid':'none';
      if(ok)shown++;
    });
    const s=q('#ncfSummary');if(s)s.textContent=`Widoczne nisze: ${shown} z ${cards.length}`;
    toast(shown?`Filtr zastosowany — ${shown} wyników`:'Brak nisz spełniających filtr');
  }
  function reset(){
    state.minScore=0;state.demand='all';state.competition='all';
    const a=q('#ncfScore'),b=q('#ncfDemand'),c=q('#ncfCompetition');
    if(a)a.value='0';if(b)b.value='all';if(c)c.value='all';
    qa('#ncRecommendations .nc-rec').forEach(x=>x.style.display='grid');
    const s=q('#ncfSummary');if(s)s.textContent=`Widoczne nisze: ${qa('#ncRecommendations .nc-rec').length}`;
    toast('Filtry wyczyszczone');
  }
  function ensurePanel(){
    const host=q('#ncRecommendations');if(!host)return null;
    let panel=q('#ncfPanel');
    if(panel)return panel;
    panel=document.createElement('div');panel.id='ncfPanel';panel.className='ncf-panel';
    panel.innerHTML=`<label>Minimalna ocena<select id="ncfScore"><option value="0">Dowolna</option><option value="80">80+</option><option value="85">85+</option><option value="90">90+</option><option value="95">95+</option></select></label><label>Popyt<select id="ncfDemand"><option value="all">Dowolny</option><option value="popyt wysoki">Wysoki</option><option value="popyt średni">Średni</option></select></label><label>Konkurencja<select id="ncfCompetition"><option value="all">Dowolna</option><option value="konkurencja niska">Niska</option><option value="konkurencja średnia">Średnia</option></select></label><div class="ncf-actions"><button class="apply" id="ncfApply">Zastosuj</button><button id="ncfReset">Wyczyść</button></div><div class="ncf-summary" id="ncfSummary">Widoczne nisze: ${qa('#ncRecommendations .nc-rec').length}</div>`;
    host.parentElement.insertBefore(panel,host);
    q('#ncfApply').onclick=()=>{state.minScore=Number(q('#ncfScore').value);state.demand=q('#ncfDemand').value;state.competition=q('#ncfCompetition').value;apply();};
    q('#ncfReset').onclick=reset;
    return panel;
  }
  function filterButton(){
    return qa('button').find(b=>/^(filtry|filtr)$/i.test((b.textContent||'').trim())||b.id==='ncFilters'||b.id==='ncFilter');
  }
  function bind(){
    const host=q('#ncRecommendations');if(!host)return;
    const btn=filterButton();
    if(btn&&!btn.dataset.ncfBound){
      btn.dataset.ncfBound='1';
      btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const p=ensurePanel();p?.classList.toggle('open');},true);
    }
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('button');if(!b)return;
    if(/wygeneruj|ponownie|odśwież/.test((b.textContent||'').toLowerCase()))setTimeout(()=>{bind();apply();},30);
  });
  document.addEventListener('DOMContentLoaded',()=>{bind();const root=q('#content');if(root)new MutationObserver(()=>setTimeout(bind,0)).observe(root,{childList:true,subtree:true});});
})();