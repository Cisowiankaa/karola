(() => {
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const toast=t=>window.showToast?window.showToast(t):alert(t);
  const FAVORITES_KEY='aii-niche-favorites';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const state={minScore:0,demand:'all',competition:'all',category:'all',platform:'all',money:'all',favorites:false};

  const style=document.createElement('style');
  style.textContent=`
    .ncf-panel{margin:10px 0 14px;padding:14px;border:1px solid #34425e;border-radius:14px;background:#0e1727;color:#eef3fb;display:none;gap:10px;grid-template-columns:repeat(4,minmax(130px,1fr));align-items:end}
    .ncf-panel.open{display:grid}.ncf-panel label{display:grid;gap:5px;font-size:8px;font-weight:900;color:#aeb9cc}.ncf-panel select,.ncf-panel input{width:100%;box-sizing:border-box;border:1px solid #39475f;border-radius:9px;padding:8px;background:#101a2b;color:#eef3fb}.ncf-check{display:flex!important;grid-auto-flow:column;justify-content:start;align-items:center;gap:8px!important}.ncf-check input{width:auto}.ncf-actions{display:flex;gap:7px}.ncf-actions button{border:1px solid #3b4961;border-radius:9px;padding:8px 10px;background:#162238;color:#fff;font-size:8px;font-weight:900;cursor:pointer}.ncf-actions .apply{border:0;background:linear-gradient(90deg,#43dff0,#7e72ff,#e85caf)}.ncf-summary{grid-column:1/-1;font-size:8px;color:#91a0b7}@media(max-width:1050px){.ncf-panel{grid-template-columns:1fr 1fr}}@media(max-width:650px){.ncf-panel{grid-template-columns:1fr}}`;
  document.head.appendChild(style);

  function scoreOf(card){const t=card.querySelector('.nc-score-badge')?.textContent||'';return Number((t.match(/\d+/)||['0'])[0]);}
  function titleOf(card){return (card.querySelector('h3')?.textContent||'').trim();}
  function textOf(card){return (card.textContent||'').toLowerCase();}
  function categoryOf(card){const t=textOf(card);if(/beauty|kosmet|makija|pielęgn|włos|skór/.test(t))return 'beauty';if(/meal|kuch|jedzen|gotow|przepis|żywien|lunch|posił/.test(t))return 'food';if(/książ|book|czyt|wydawn|recenzj/.test(t))return 'books';if(/biznes|marketing|social|instagram|ugc|sprzeda|firma|creator|content/.test(t))return 'business';return 'other';}
  function platformsOf(card){const c=categoryOf(card);if(c==='beauty')return ['instagram','tiktok'];if(c==='food')return ['instagram','tiktok','pinterest'];if(c==='books')return ['instagram','tiktok','youtube'];if(c==='business')return ['instagram','tiktok','youtube','facebook'];return ['instagram'];}
  function moneyMatches(card,kind){if(kind==='all')return true;const t=textOf(card);if(kind==='affiliate')return /afiliac/.test(t);if(kind==='ugc')return /ugc|współprac|sponsor/.test(t);if(kind==='digital')return /e-book|ebook|pdf|planner|szablon|checklist/.test(t);if(kind==='course')return /kurs|mini-kurs|konsultac|abonament/.test(t);return true;}
  function isFavorite(card){const title=titleOf(card);return read(FAVORITES_KEY,[]).some(x=>(x?.title||'').trim()===title);}

  function apply(silent=false){
    const cards=qa('#ncRecommendations .nc-rec');let shown=0;
    cards.forEach(card=>{
      const text=textOf(card),score=scoreOf(card);
      const ok=score>=state.minScore &&
        (state.demand==='all'||text.includes(state.demand)) &&
        (state.competition==='all'||text.includes(state.competition)) &&
        (state.category==='all'||categoryOf(card)===state.category) &&
        (state.platform==='all'||platformsOf(card).includes(state.platform)) &&
        moneyMatches(card,state.money) &&
        (!state.favorites||isFavorite(card));
      card.style.display=ok?'grid':'none';if(ok)shown++;
    });
    const s=q('#ncfSummary');if(s)s.textContent=`Widoczne nisze: ${shown} z ${cards.length}`;
    if(!silent)toast(shown?`Filtr zastosowany — ${shown} wyników`:'Brak nisz spełniających filtr');
  }
  function reset(){
    Object.assign(state,{minScore:0,demand:'all',competition:'all',category:'all',platform:'all',money:'all',favorites:false});
    [['#ncfScore','0'],['#ncfDemand','all'],['#ncfCompetition','all'],['#ncfCategory','all'],['#ncfPlatform','all'],['#ncfMoney','all']].forEach(([id,v])=>{const el=q(id);if(el)el.value=v});
    const fav=q('#ncfFavorites');if(fav)fav.checked=false;
    qa('#ncRecommendations .nc-rec').forEach(x=>x.style.display='grid');
    const s=q('#ncfSummary');if(s)s.textContent=`Widoczne nisze: ${qa('#ncRecommendations .nc-rec').length}`;toast('Filtry wyczyszczone');
  }
  function ensurePanel(){
    const host=q('#ncRecommendations');if(!host)return null;let panel=q('#ncfPanel');if(panel)return panel;
    panel=document.createElement('div');panel.id='ncfPanel';panel.className='ncf-panel';
    panel.innerHTML=`
      <label>Minimalna ocena<select id="ncfScore"><option value="0">Dowolna</option><option value="80">80+</option><option value="85">85+</option><option value="90">90+</option><option value="95">95+</option></select></label>
      <label>Popyt<select id="ncfDemand"><option value="all">Dowolny</option><option value="popyt wysoki">Wysoki</option><option value="popyt średni">Średni</option></select></label>
      <label>Konkurencja<select id="ncfCompetition"><option value="all">Dowolna</option><option value="konkurencja niska">Niska</option><option value="konkurencja średnia">Średnia</option></select></label>
      <label>Kategoria<select id="ncfCategory"><option value="all">Wszystkie</option><option value="beauty">Beauty</option><option value="food">Jedzenie / meal prep</option><option value="business">Biznes / UGC</option><option value="books">Książki</option></select></label>
      <label>Platforma<select id="ncfPlatform"><option value="all">Wszystkie</option><option value="instagram">Instagram</option><option value="tiktok">TikTok</option><option value="youtube">YouTube</option><option value="facebook">Facebook</option><option value="pinterest">Pinterest</option></select></label>
      <label>Monetyzacja<select id="ncfMoney"><option value="all">Dowolna</option><option value="affiliate">Afiliacja</option><option value="ugc">UGC / współprace</option><option value="digital">Produkty cyfrowe</option><option value="course">Kurs / konsultacje</option></select></label>
      <label class="ncf-check"><input id="ncfFavorites" type="checkbox"> Tylko ulubione</label>
      <div class="ncf-actions"><button class="apply" id="ncfApply">Zastosuj</button><button id="ncfReset">Wyczyść</button></div>
      <div class="ncf-summary" id="ncfSummary">Widoczne nisze: ${qa('#ncRecommendations .nc-rec').length}</div>`;
    host.parentElement.insertBefore(panel,host);
    q('#ncfApply').onclick=()=>{state.minScore=Number(q('#ncfScore').value);state.demand=q('#ncfDemand').value;state.competition=q('#ncfCompetition').value;state.category=q('#ncfCategory').value;state.platform=q('#ncfPlatform').value;state.money=q('#ncfMoney').value;state.favorites=q('#ncfFavorites').checked;apply();};
    q('#ncfReset').onclick=reset;
    return panel;
  }
  function filterButton(){return qa('button').find(b=>/^(filtry|filtr)$/i.test((b.textContent||'').trim())||b.id==='ncFilters'||b.id==='ncFilter');}
  function bind(){const host=q('#ncRecommendations');if(!host)return;const btn=filterButton();if(btn&&!btn.dataset.ncfBound){btn.dataset.ncfBound='1';btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const p=ensurePanel();p?.classList.toggle('open');},true);}}
  document.addEventListener('click',e=>{const b=e.target.closest?.('button');if(!b)return;if(/wygeneruj|ponownie|odśwież/.test((b.textContent||'').toLowerCase()))setTimeout(()=>{bind();apply(true);},40);if(b.matches?.('[data-nh-fav],[data-nh-add],[data-nh-remove]'))setTimeout(()=>apply(true),30);});
  document.addEventListener('DOMContentLoaded',()=>{bind();const root=q('#content');if(root)new MutationObserver(()=>setTimeout(()=>{bind();if(q('#ncfPanel'))apply(true)},0)).observe(root,{childList:true,subtree:true});});
})();