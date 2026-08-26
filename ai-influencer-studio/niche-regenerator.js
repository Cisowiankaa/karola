(() => {
  const KEY='aii-niche-regeneration-counter';
  const q=(s,r=document)=>r.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const toast=t=>window.showToast?window.showToast(t):alert(t);
  const clamp=n=>Math.max(70,Math.min(98,n));

  const banks={
    beauty:[
      ['Kosmetyki do 40 zł, które wyglądają premium','Osoby 20–40 lat szukające dobrych efektów bez wysokich cen','Afiliacja + rankingi + UGC'],
      ['Pielęgnacja skóry dla zabieganych: rutyna w 5 minut','Kobiety 25–45 lat z małą ilością czasu','E-book + afiliacja + współprace beauty'],
      ['Porównania drogeryjne: tańszy czy droższy kosmetyk?','Kupujący porównujący cenę, skład i efekt','Afiliacja + sponsorowane testy + karuzele'],
      ['Kosmetyczka minimalistki: mniej produktów, lepsza rutyna','Osoby ograniczające zakupy i liczbę produktów','Checklisty + afiliacja + planner'],
      ['Testy nowości bez filtra: pierwszy tydzień używania','Odbiorcy lubiący prawdziwe testy i efekty dzień po dniu','UGC + współprace + serie Reels'],
      ['Beauty dla początkujących: co kupić najpierw','Osoby zaczynające pielęgnację lub makijaż','Starter PDF + afiliacja + lista zakupowa'],
      ['Pielęgnacja sezonowa: co zmieniać co 3 miesiące','Odbiorcy reagujący na zmiany pogody i sezonu','Planer sezonowy + afiliacja + newsletter'],
      ['Domowe SPA za mniej niż 50 zł','Osoby szukające taniego self-care','Afiliacja + mini e-book + sponsorowane zestawy']
    ],
    food:[
      ['Meal prep 90 minut na cały tydzień','Zapracowani pracownicy i freelancerzy','E-book + planner + lista zakupów'],
      ['Lunche do pracy bez popołudniowego zjazdu','Osoby pracujące przy komputerze','Baza przepisów + newsletter + mini-kurs'],
      ['Tanie wysokobiałkowe posiłki na 5 dni','Osoby aktywne i budżetowe','Kalkulator + e-book + afiliacja'],
      ['Kolacje z 5 składników dla zmęczonych','Osoby, które nie chcą długo gotować','PDF + seria Reels + lista zakupowa'],
      ['Gotowanie raz, jedzenie trzy razy','Single i małe gospodarstwa domowe','Planner + e-book + szablony'],
      ['Śniadania do przygotowania wieczorem','Pracujący rano i rodzice','E-book + afiliacja akcesoriów kuchennych'],
      ['Kuchnia bez marnowania: tydzień z jednej listy','Osoby oszczędne i ograniczające food waste','Planner + lista zakupów + współprace'],
      ['Awaryjne posiłki w 10 minut','Osoby przebodźcowane i bardzo zajęte','Checklisty + mini e-book + afiliacja']
    ],
    business:[
      ['UGC dla małych marek bez dużego budżetu','Mikrofirmy i lokalne marki','Pakiet UGC + abonament + szablony'],
      ['30 dni contentu dla jednoosobowej firmy','Solo-przedsiębiorcy i freelancerzy','Planner + szablony + mini-kurs'],
      ['Automatyzacja social media bez skomplikowanych narzędzi','Małe firmy chcące oszczędzać czas','Kurs + afiliacja SaaS + konsultacje'],
      ['Personal branding dla ekspertów, którzy nie chcą tańczyć na Reels','Eksperci i specjaliści usługowi','E-book + konsultacje + szablony'],
      ['Sprzedaż z Instagrama bez agresywnego CTA','Twórcy i małe biznesy','Kurs + skrypty + audyty'],
      ['Content recycling: 1 pomysł = 10 publikacji','Twórcy z małą ilością czasu','Pakiet szablonów + planner + konsultacje'],
      ['Portfolio UGC od zera w 14 dni','Początkujący twórcy UGC','Starter pack + kurs + afiliacja'],
      ['Proste lejki sprzedażowe dla creatorów','Twórcy produktów cyfrowych','Szablony + kurs + konsultacje']
    ],
    books:[
      ['Bookstagram bez spoilerów: krótkie recenzje, które sprzedają emocje','Czytelnicy 18–45 lat i wydawnictwa','Współprace + afiliacja + patronaty'],
      ['Książki na konkretny nastrój: co czytać kiedy...','Czytelnicy wybierający książki emocjonalnie','Afiliacja + newsletter + listy tematyczne'],
      ['Premiery miesiąca bez chaosu','Aktywni czytelnicy śledzący nowości','Afiliacja + współprace wydawnicze'],
      ['Czy warto kupić? Recenzje w 60 sekund','Czytelnicy przed decyzją zakupową','Reels + afiliacja + sponsorowane recenzje'],
      ['Tanie czytanie: promocje, biblioteki i e-booki','Czytelnicy budżetowi','Afiliacja + newsletter + partnerstwa'],
      ['Książkowe serie dla początkujących czytelników','Osoby wracające do regularnego czytania','Listy PDF + afiliacja + klub czytelniczy'],
      ['Adaptacja kontra książka','Fani filmów, seriali i książek','Reels + współprace + afiliacja'],
      ['Książki na weekend: krótkie i wciągające','Zapracowani czytelnicy','Rankingi + afiliacja + newsletter']
    ]
  };

  function domain(text){
    text=String(text||'').toLowerCase();
    if(/książ|book|czyt|wydawn/.test(text))return 'books';
    if(/kuch|meal|jedzen|gotow|przepis|żywien/.test(text))return 'food';
    if(/beauty|kosmet|makija|pielęgn|włos|skór/.test(text))return 'beauty';
    if(/biznes|marketing|social|instagram|ugc|sprzeda|firma|creator/.test(text))return 'business';
    return 'business';
  }

  function makeCards(base,setNo){
    const bank=banks[domain(base)];
    const shift=(setNo*3)%bank.length;
    const selected=Array.from({length:4},(_,i)=>bank[(shift+i)%bank.length]);
    return selected.map((x,i)=>({
      title:x[0],
      score:clamp(96-i*5-((setNo+i)%3)),
      demand:i<2?'popyt wysoki':'popyt średni',
      competition:(i+setNo)%3===0?'konkurencja niska':'konkurencja średnia',
      audience:x[1],money:x[2]
    }));
  }

  function render(base,setNo){
    const host=q('#ncRecommendations');if(!host)return false;
    const cards=makeCards(base,setNo);
    host.innerHTML=cards.map((x,i)=>`<article class="nc-rec" data-regen-set="${setNo}"><div class="nc-score-badge">${x.score}/100</div><h3>${esc(x.title)}</h3><div class="nc-bar"><i style="width:${x.score}%"></i></div><p>${esc(i===0?'Najmocniejszy nowy kierunek w tym zestawie — wyraźny problem, konkretna grupa odbiorców i dobry potencjał do serii treści.':'Alternatywny kierunek z innym kątem komunikacji, dzięki czemu możesz testować różne potrzeby odbiorców.')}</p><div class="nc-pills"><span class="nc-pill">↗ ${esc(x.demand)}</span><span class="nc-pill ${x.competition.includes('niska')?'low':'mid'}">✦ ${esc(x.competition)}</span></div><div class="nc-meta"><b>Odbiorcy:</b><span>${esc(x.audience)}</span><b>Monetyzacja:</b><span>${esc(x.money)}</span></div><button class="nc-use" type="button">Użyj tej niszy</button></article>`).join('');
    const hint=q('#ncRecommendations')?.previousElementSibling?.querySelector?.('.nc-muted');
    if(hint)hint.textContent=`Zestaw ${setNo+1} • 4 nowe warianty dopasowane do kierunku profilu`;
    return true;
  }

  function currentBase(){return q('#ncNiche')?.value?.trim()||read('aii-creator-profile',{}).niche||'tworzenie treści';}

  document.addEventListener('click',e=>{
    const b=e.target.closest?.('button');if(!b)return;
    const text=(b.textContent||'').toLowerCase();
    const isRefresh=b.id==='ncRegenerate'||b.id==='ncRefresh'||(b.classList.contains('secondary')&&/wygeneruj|ponownie|odśwież/.test(text));
    if(!isRefresh)return;
    e.preventDefault();e.stopImmediatePropagation();
    const next=(Number(localStorage.getItem(KEY)||0)+1)%1000;localStorage.setItem(KEY,String(next));
    if(render(currentBase(),next))toast('Wygenerowano nowy zestaw nisz');
  },true);

  document.addEventListener('DOMContentLoaded',()=>{
    const root=q('#content');if(!root)return;
    new MutationObserver(()=>{
      const host=q('#ncRecommendations');if(!host||host.dataset.regenObserved)return;
      host.dataset.regenObserved='1';
    }).observe(root,{childList:true,subtree:true});
  });

  window.AIINicheRegenerator={render,next:()=>{const n=(Number(localStorage.getItem(KEY)||0)+1);localStorage.setItem(KEY,String(n));return render(currentBase(),n)}};
})();