(() => {
  const PLAN_KEY='aii-niche-content-plan';
  const PROFILE_KEY='aii-creator-profile';
  const SOCIAL_KEY='aii-social-queue';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const toast=t=>window.showToast?window.showToast(t):alert(t);

  const style=document.createElement('style');
  style.textContent=`.ncp-panel{margin-top:16px;border:1px solid #2f3d58;border-radius:18px;background:linear-gradient(145deg,#0d1524,#101a2d);padding:18px;color:#eef3fb;display:grid;gap:14px}.ncp-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}.ncp-head h3{margin:0 0 5px;font-size:16px}.ncp-sub{font-size:9px;color:#9eabc0;line-height:1.5}.ncp-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:12px}.ncp-box{border:1px solid #303d56;border-radius:13px;background:#0a1322;padding:13px}.ncp-box h4{margin:0 0 10px;font-size:10px}.ncp-ideas{display:grid;gap:7px}.ncp-idea{display:grid;grid-template-columns:22px 1fr auto;gap:8px;align-items:start;border:1px solid #27354c;border-radius:10px;padding:9px;background:#111b2c}.ncp-num{width:22px;height:22px;border-radius:7px;display:grid;place-items:center;background:linear-gradient(135deg,#33dce8,#805fff);font-size:8px;font-weight:900}.ncp-idea b{font-size:9px;display:block;margin-bottom:3px}.ncp-idea small{font-size:8px;color:#9aa8bc;line-height:1.35}.ncp-btn{border:0;border-radius:8px;padding:7px 9px;background:linear-gradient(90deg,#43dff0,#7e72ff,#e85caf);color:#fff;font-size:8px;font-weight:900;cursor:pointer}.ncp-pill{display:inline-flex;margin:3px 4px 3px 0;padding:6px 8px;border-radius:999px;background:#182844;border:1px solid #315079;font-size:8px;font-weight:800}.ncp-money{display:grid;gap:7px}.ncp-money div{border:1px solid #27354c;border-radius:9px;padding:9px;font-size:8px;line-height:1.45;color:#b7c2d4}.ncp-actions{display:flex;gap:8px;flex-wrap:wrap}.ncp-actions button{border:1px solid #35445f;background:#111d32;color:#eaf0fa;border-radius:9px;padding:8px 10px;font-size:8px;font-weight:900;cursor:pointer}.ncp-actions .ncp-primary{border:0;background:linear-gradient(90deg,#43dff0,#7e72ff,#e85caf);color:#fff}.ncp-week{display:grid;gap:7px}.ncp-week-row{display:grid;grid-template-columns:78px 1fr auto;gap:8px;align-items:center;border:1px solid #27354c;border-radius:9px;padding:9px;background:#0f192a;font-size:8px}.ncp-week-row b{color:#fff}.ncp-week-row span{color:#9eabc0}@media(max-width:900px){.ncp-grid{grid-template-columns:1fr}.ncp-idea{grid-template-columns:22px 1fr}.ncp-week-row{grid-template-columns:1fr}}`;
  document.head.appendChild(style);

  function kind(niche){
    const t=niche.toLowerCase();
    if(/beauty|kosmet|pielęgn|makija|skór|włos/.test(t)) return 'beauty';
    if(/meal|kuch|jedze|gotow|żywien|lunch|białk|glikem/.test(t)) return 'food';
    if(/książ|book|czyta|literatur/.test(t)) return 'books';
    if(/finans|księg|podat|ksef|rachunk|biznes/.test(t)) return 'business';
    return 'general';
  }

  function ideasFor(niche){
    const k=kind(niche);
    const sets={
      beauty:[
        [`3 błędy w ${niche}, które psują efekt`,'Reels 25–35 s • mocny hook • pokaż błąd i prostą poprawkę'],
        [`Test budżetowy: ${niche} do 50 zł`,'Post / Reels • cena, efekt, plusy i minusy'],
        [`Czy ${niche} naprawdę działa?`,'UGC test • pokaż realny efekt bez przesadnych obietnic'],
        [`Moja 5-minutowa rutyna: ${niche}`,'Reels lifestyle • szybka sekwencja krok po kroku'],
        [`Drogi produkt vs tańszy zamiennik — ${niche}`,'Karuzela porównawcza • dla kogo który wariant'],
        [`7 dni z ${niche}: co się zmieniło?`,'Seria / podsumowanie • doświadczenie dzień po dniu'],
        [`Mit czy fakt: ${niche}`,'Reels edukacyjny • jeden popularny mit i krótka odpowiedź'],
        [`3 produkty, które pasują do ${niche}`,'Post afiliacyjny • konkretne zastosowania i ceny'],
        [`Jak użyć ${niche} w 60 sekund`,'Tutorial Reels • szybkie demo produktu lub techniki'],
        [`Checklista zakupowa: ${niche}`,'Karuzela do zapisania • na co patrzeć przed zakupem']
      ],
      food:[
        [`Meal prep: ${niche} w 90 minut na cały tydzień`,'Reels / karuzela • plan, czas, lista kroków'],
        [`5 tanich produktów do ${niche}`,'Post budżetowy • konkretna lista zakupowa'],
        [`Test: czy ${niche} pomaga uniknąć popołudniowego zjazdu?`,'Reels edukacyjny • praktyczna obserwacja i wnioski'],
        [`3 błędy podczas przygotowania ${niche}`,'Reels • błąd → poprawka → efekt'],
        [`Plan zakupów na 7 dni: ${niche}`,'Karuzela • prosta lista do zapisania'],
        [`15-minutowy lunch w stylu ${niche}`,'Reels tutorial • szybki przepis krok po kroku'],
        [`Wersja budżetowa vs premium: ${niche}`,'Post porównawczy • koszt porcji i czas'],
        [`Jak przechowywać ${niche}, żeby nie marnować jedzenia`,'Post edukacyjny • organizacja kuchni'],
        [`3 warianty ${niche} na dni bez czasu`,'Reels / seria • szybkie awaryjne opcje'],
        [`Checklista meal prep dla ${niche}`,'Karuzela do zapisania • przygotowanie od A do Z']
      ],
      books:[
        [`3 książki dla osób zainteresowanych: ${niche}`,'Karuzela • krótko: dla kogo i dlaczego'],
        [`Czy ta książka jest warta hype’u? — ${niche}`,'Reels / recenzja bez spoilerów'],
        [`5 cytatów / myśli, które zostały ze mną po ${niche}`,'Post refleksyjny • bez zdradzania fabuły'],
        [`BookTok vs rzeczywistość: ${niche}`,'Reels porównawczy • oczekiwania kontra lektura'],
        [`Najmocniejszy bohater / motyw w ${niche}`,'Post dyskusyjny • pytanie do odbiorców'],
        [`7 dni czytania w klimacie ${niche}`,'Seria stories / Reels • czytelniczy dziennik'],
        [`Dla kogo NIE jest ${niche}`,'Post opiniotwórczy • wyważone minusy'],
        [`3 podobne tytuły do ${niche}`,'Karuzela polecajek'],
        [`Recenzja w 30 sekund: ${niche}`,'Reels • hook, klimat, ocena, CTA'],
        [`Czy przeczytałabym ponownie ${niche}?`,'Post podsumowujący • emocje i ocena']
      ],
      business:[
        [`3 błędy, które kosztują czas w ${niche}`,'Reels edukacyjny • problem i szybkie rozwiązanie'],
        [`Jak zacząć ${niche} bez dużego budżetu`,'Karuzela • konkretne pierwsze kroki'],
        [`Checklist: ${niche} krok po kroku`,'Post do zapisania • proces od startu do efektu'],
        [`5 narzędzi do ${niche}`,'Post / afiliacja • zastosowanie i koszt'],
        [`Co zrobiłabym inaczej, zaczynając ${niche}`,'Storytelling • błędy i wnioski'],
        [`Plan na 7 dni: ${niche}`,'Karuzela • mini wdrożenie dzień po dniu'],
        [`Automatyzacja, która upraszcza ${niche}`,'Reels tutorial • przed i po'],
        [`Najczęstszy mit o ${niche}`,'Post edukacyjny • fakt kontra przekonanie'],
        [`Ile naprawdę kosztuje ${niche}`,'Post liczbowy • koszty, czas, zwrot'],
        [`Szablon / checklista do ${niche}`,'Lead magnet • CTA do pobrania']
      ],
      general:[
        [`3 błędy, które blokują efekty w ${niche}`,'Reels 25–35 s • szybki hook • pokaż problem i poprawkę'],
        [`Najtańszy sposób, żeby zacząć ${niche}`,'Karuzela / post • wersja budżetowa'],
        [`Test: czy ${niche} naprawdę działa?`,'Reels / UGC • konkretne kryteria i werdykt'],
        [`5 rzeczy, które zrobiłabym inaczej w ${niche}`,'Storytelling • doświadczenia i wnioski'],
        [`Porównanie dwóch sposobów na ${niche}`,'Post porównawczy • cena, czas, efekt'],
        [`Plan na 7 dni: ${niche}`,'Karuzela • prosty mini-plan wdrożenia'],
        [`Mit czy fakt: ${niche}`,'Reels edukacyjny • popularny mit i wyjaśnienie'],
        [`Moje 3 ulubione narzędzia do ${niche}`,'Post / afiliacja • praktyczne zastosowania'],
        [`Zrób ${niche} w 15 minut`,'Reels tutorial • szybki rezultat'],
        [`Checklista przed startem: ${niche}`,'Karuzela • lista kontrolna z CTA do zapisania']
      ]
    };
    return sets[k];
  }

  function pillarsFor(niche){
    const k=kind(niche);
    if(k==='beauty') return ['Testy i recenzje kosmetyków','Budżetowe zamienniki','Rutyny i tutoriale','UGC i współprace beauty'];
    if(k==='food') return ['Szybkie przepisy i meal prep','Zakupy i budżet','Energia i organizacja posiłków','Kuchenne checklisty i planery'];
    if(k==='books') return ['Recenzje bez spoilerów','Polecajki i rankingi','BookTok / Bookstagram','Czytelnicze dyskusje i serie'];
    if(k==='business') return ['Edukacja i checklisty','Narzędzia i automatyzacje','Kulisy i case studies','Monetyzacja i produkty cyfrowe'];
    return ['Edukacja i szybkie rozwiązania','Testy / porównania / opinie','Lifestyle i kulisy','Checklisty i mini-plany'];
  }

  function monetizationFor(niche){
    const k=kind(niche);
    if(k==='beauty') return ['Afiliacja kosmetyków','Płatne UGC dla marek','Sponsorowane testy i współprace','Beauty checklist / e-book','Pakiety contentowe dla marek'];
    if(k==='food') return ['E-book z przepisami','Planner meal prep / lista zakupów','Afiliacja sprzętu kuchennego','Mini-kurs organizacji posiłków','Newsletter premium'];
    if(k==='books') return ['Afiliacja księgarni','Współprace z wydawnictwami','Patronaty medialne','Planner czytelniczy PDF','Płatny klub / newsletter książkowy'];
    if(k==='business') return ['Szablony i checklisty','E-book / mini-kurs','Afiliacja narzędzi','Konsultacje / usługi','Pakiet premium / subskrypcja'];
    return ['Afiliacja produktów i narzędzi','Płatne UGC / współprace z markami','E-book lub planner PDF','Pakiet szablonów / checklist','Mini-kurs lub materiał premium'];
  }

  function buildPlan(niche){
    const clean=String(niche||'').trim()||'Wybrana nisza';
    const profile=read(PROFILE_KEY,{});
    const plan={niche:clean,createdAt:new Date().toISOString(),pillars:pillarsFor(clean),monetization:monetizationFor(clean),ideas:ideasFor(clean),profile};
    save(PLAN_KEY,plan);
    return plan;
  }

  function pushTo(view,idea,niche){save('aii-content-seed',{niche,title:idea[0],brief:idea[1],createdAt:Date.now()});const nav=document.querySelector(`.nav-item[data-view="${view}"]`);if(nav){nav.click();toast(view==='reels'?'Pomysł przekazany do Generatora Reels':'Pomysł przekazany do Generatora postów');}else toast('Pomysł zapisany do wykorzystania');}
  function iso(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function scheduleWeek(plan){const queue=read(SOCIAL_KEY,[]),today=new Date();today.setHours(0,0,0,0);const platforms=['Instagram','TikTok','Instagram','Facebook','Instagram','TikTok','Instagram'],times=['18:00','19:00','18:30','12:00','18:00','11:00','19:00'],kinds=['Reels','Post','Reels','Post','Post','Reels','Post'],scheduled=[];plan.ideas.slice(0,7).forEach((idea,i)=>{const d=new Date(today);d.setDate(today.getDate()+i);const id=`niche-week-${plan.createdAt}-${i}`,item={id,title:idea[0],platform:platforms[i],type:kinds[i],date:iso(d),time:times[i],status:'Zaplanowany',notes:`Nisza: ${plan.niche}\n${idea[1]}`,source:'niche-content-plan',niche:plan.niche,createdAt:Date.now()+i};const existing=queue.findIndex(x=>String(x.id)===id);if(existing>=0)queue[existing]=item;else queue.push(item);scheduled.push(item)});save(SOCIAL_KEY,queue);save('aii-niche-week-plan',{niche:plan.niche,createdAt:new Date().toISOString(),items:scheduled});document.dispatchEvent(new CustomEvent('aii:social-changed',{detail:{count:queue.length}}));toast('Zaplanowano 7 dni contentu w kalendarzu');render(plan)}
  function renderWeek(plan){const week=read('aii-niche-week-plan',null);if(!week?.items?.length||week.niche!==plan.niche)return '';return `<div class="ncp-box"><h4>Zaplanowany tydzień</h4><div class="ncp-week">${week.items.map(x=>`<div class="ncp-week-row"><b>${esc(x.date)}<br>${esc(x.time)}</b><span>${esc(x.title)}</span><span>${esc(x.platform)} • ${esc(x.type)}</span></div>`).join('')}</div></div>`}

  function render(plan){
    const host=document.querySelector('#ncRecommendations')?.parentElement || document.querySelector('.nc-shell');if(!host)return;
    let panel=document.getElementById('ncpPanel');if(!panel){panel=document.createElement('section');panel.id='ncpPanel';panel.className='ncp-panel';host.appendChild(panel)}
    panel.dataset.niche=plan.niche;
    panel.innerHTML=`<div class="ncp-head"><div><h3>Plan contentu dla wybranej niszy</h3><div class="ncp-sub"><b>${esc(plan.niche)}</b> • 10 pomysłów + filary treści + monetyzacja. Działa lokalnie, bez płatnego AI.</div></div><div class="ncp-actions"><button class="ncp-primary" id="ncpScheduleWeek">Zaplanuj cały tydzień</button><button id="ncpCopy">Kopiuj plan</button><button id="ncpRegenerate">Nowe 10 pomysłów</button></div></div><div class="ncp-grid"><div class="ncp-box"><h4>10 pomysłów na posty i Reels</h4><div class="ncp-ideas">${plan.ideas.map((x,i)=>`<div class="ncp-idea"><span class="ncp-num">${i+1}</span><div><b>${esc(x[0])}</b><small>${esc(x[1])}</small></div><div style="display:grid;gap:4px"><button class="ncp-btn" data-post="${i}">Post</button><button class="ncp-btn" data-reel="${i}">Reels</button></div></div>`).join('')}</div></div><div style="display:grid;gap:12px"><div class="ncp-box"><h4>Filary treści</h4>${plan.pillars.map(x=>`<span class="ncp-pill">${esc(x)}</span>`).join('')}</div><div class="ncp-box"><h4>Plan monetyzacji</h4><div class="ncp-money">${plan.monetization.map((x,i)=>`<div><b>${i+1}. ${esc(x)}</b></div>`).join('')}</div></div></div></div>${renderWeek(plan)}`;
    panel.querySelectorAll('[data-post]').forEach(b=>b.onclick=()=>pushTo('posts',plan.ideas[Number(b.dataset.post)],plan.niche));
    panel.querySelectorAll('[data-reel]').forEach(b=>b.onclick=()=>pushTo('reels',plan.ideas[Number(b.dataset.reel)],plan.niche));
    document.getElementById('ncpScheduleWeek').onclick=()=>scheduleWeek(plan);
    document.getElementById('ncpRegenerate').onclick=()=>{const p=buildPlan(plan.niche);p.ideas=p.ideas.map((x,i)=>[`${x[0]} — wariant ${i+1}`,x[1]]);save(PLAN_KEY,p);render(p);toast('Przygotowano nowy zestaw pomysłów')};
    document.getElementById('ncpCopy').onclick=async()=>{const text=`NISZA: ${plan.niche}\n\nFILARY:\n${plan.pillars.map(x=>'• '+x).join('\n')}\n\nPOMYSŁY:\n${plan.ideas.map((x,i)=>`${i+1}. ${x[0]} — ${x[1]}`).join('\n')}\n\nMONETYZACJA:\n${plan.monetization.map(x=>'• '+x).join('\n')}`;try{await navigator.clipboard.writeText(text);toast('Plan skopiowany')}catch{toast('Nie udało się skopiować planu')}};
    panel.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function selectFromButton(btn){
    const card=btn.closest('.nc-rec');
    const niche=(card?.querySelector('h3')?.textContent||'').trim();
    if(!niche)return;
    const profile=read(PROFILE_KEY,{});profile.niche=niche;save(PROFILE_KEY,profile);
    const plan=buildPlan(niche);render(plan);
    document.dispatchEvent(new CustomEvent('aii:niche-selected',{detail:{niche}}));
    toast(`Plan contentu zmieniony: ${niche}`);
  }

  document.addEventListener('click',e=>{const btn=e.target.closest?.('.nc-use');if(!btn)return;selectFromButton(btn)},true);
  document.addEventListener('aii:niche-selected',e=>{const niche=e.detail?.niche;if(niche){const plan=buildPlan(niche);render(plan)}});
  document.addEventListener('DOMContentLoaded',()=>{const obs=new MutationObserver(()=>{const saved=read(PLAN_KEY,null);if(saved&&document.querySelector('.nc-shell')&&!document.getElementById('ncpPanel'))render(saved)});const root=document.getElementById('content');if(root)obs.observe(root,{childList:true,subtree:true})});
  window.AIINicheContentPlan={build:buildPlan,render,scheduleWeek,select:selectFromButton};
})();