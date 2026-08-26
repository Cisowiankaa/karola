(() => {
  const PLAN_KEY='aii-niche-content-plan';
  const PROFILE_KEY='aii-creator-profile';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const toast=t=>window.showToast?window.showToast(t):alert(t);

  const style=document.createElement('style');
  style.textContent=`
    .ncp-panel{margin-top:16px;border:1px solid #2f3d58;border-radius:18px;background:linear-gradient(145deg,#0d1524,#101a2d);padding:18px;color:#eef3fb;display:grid;gap:14px}
    .ncp-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}.ncp-head h3{margin:0 0 5px;font-size:16px}.ncp-sub{font-size:9px;color:#9eabc0;line-height:1.5}.ncp-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:12px}.ncp-box{border:1px solid #303d56;border-radius:13px;background:#0a1322;padding:13px}.ncp-box h4{margin:0 0 10px;font-size:10px}.ncp-ideas{display:grid;gap:7px}.ncp-idea{display:grid;grid-template-columns:22px 1fr auto;gap:8px;align-items:start;border:1px solid #27354c;border-radius:10px;padding:9px;background:#111b2c}.ncp-num{width:22px;height:22px;border-radius:7px;display:grid;place-items:center;background:linear-gradient(135deg,#33dce8,#805fff);font-size:8px;font-weight:900}.ncp-idea b{font-size:9px;display:block;margin-bottom:3px}.ncp-idea small{font-size:8px;color:#9aa8bc;line-height:1.35}.ncp-btn{border:0;border-radius:8px;padding:7px 9px;background:linear-gradient(90deg,#43dff0,#7e72ff,#e85caf);color:#fff;font-size:8px;font-weight:900;cursor:pointer}.ncp-pill{display:inline-flex;margin:3px 4px 3px 0;padding:6px 8px;border-radius:999px;background:#182844;border:1px solid #315079;font-size:8px;font-weight:800}.ncp-money{display:grid;gap:7px}.ncp-money div{border:1px solid #27354c;border-radius:9px;padding:9px;font-size:8px;line-height:1.45;color:#b7c2d4}.ncp-actions{display:flex;gap:8px;flex-wrap:wrap}.ncp-actions button{border:1px solid #35445f;background:#111d32;color:#eaf0fa;border-radius:9px;padding:8px 10px;font-size:8px;font-weight:900;cursor:pointer}@media(max-width:900px){.ncp-grid{grid-template-columns:1fr}.ncp-idea{grid-template-columns:22px 1fr}}
  `;
  document.head.appendChild(style);

  function ideasFor(niche){
    return [
      ['3 błędy, które blokują efekty',`Reels 25–35 s • szybki hook • pokaż problem związany z: ${niche}`],
      ['Najtańszy sposób, żeby zacząć',`Karuzela / post • wersja budżetowa dla początkujących`],
      ['Test: czy to naprawdę działa?',`Reels / UGC • konkretne kryteria i werdykt bez lania wody`],
      ['5 rzeczy, które zrobiłabym inaczej',`Storytelling • doświadczenia, błędy i praktyczne wnioski`],
      ['Porównanie A vs B',`Post porównawczy • cena, czas, efekt, dla kogo`],
      ['Plan na 7 dni',`Karuzela • prosty mini-plan wdrożenia niszy krok po kroku`],
      ['Mit czy fakt?',`Reels edukacyjny • jeden popularny mit + krótkie wyjaśnienie`],
      ['Moje 3 ulubione narzędzia',`Post / afiliacja • narzędzia lub produkty wspierające temat`],
      ['Zrób to w 15 minut',`Reels tutorial • szybkie zadanie z natychmiastowym rezultatem`],
      ['Checklista przed zakupem / startem',`Karuzela • zapisowalna lista kontrolna z CTA do pobrania`]
    ];
  }

  function buildPlan(niche){
    const profile=read(PROFILE_KEY,{});
    const plan={
      niche,
      createdAt:new Date().toISOString(),
      pillars:['Edukacja i szybkie rozwiązania','Testy / porównania / opinie','Lifestyle i kulisy','Checklisty i mini-plany'],
      monetization:['Afiliacja produktów i narzędzi','Płatne UGC / współprace z markami','E-book lub planner PDF','Pakiet szablonów / checklist','Mini-kurs lub materiał premium'],
      ideas:ideasFor(niche),
      profile
    };
    save(PLAN_KEY,plan);
    return plan;
  }

  function pushTo(view,idea,niche){
    save('aii-content-seed',{niche,title:idea[0],brief:idea[1],createdAt:Date.now()});
    const nav=document.querySelector(`.nav-item[data-view="${view}"]`);
    if(nav){nav.click();toast(view==='reels'?'Pomysł przekazany do Generatora Reels':'Pomysł przekazany do Generatora postów');}
    else toast('Pomysł zapisany do wykorzystania');
  }

  function render(plan){
    const host=document.querySelector('#ncRecommendations')?.parentElement || document.querySelector('.nc-shell');
    if(!host)return;
    let panel=document.getElementById('ncpPanel');
    if(!panel){panel=document.createElement('section');panel.id='ncpPanel';panel.className='ncp-panel';host.appendChild(panel);}
    panel.innerHTML=`
      <div class="ncp-head"><div><h3>Plan contentu dla wybranej niszy</h3><div class="ncp-sub">${esc(plan.niche)} • 10 pomysłów + filary treści + monetyzacja. Działa lokalnie, bez płatnego AI.</div></div><div class="ncp-actions"><button id="ncpCopy">Kopiuj plan</button><button id="ncpRegenerate">Nowe 10 pomysłów</button></div></div>
      <div class="ncp-grid"><div class="ncp-box"><h4>10 pomysłów na posty i Reels</h4><div class="ncp-ideas">${plan.ideas.map((x,i)=>`<div class="ncp-idea"><span class="ncp-num">${i+1}</span><div><b>${esc(x[0])}</b><small>${esc(x[1])}</small></div><div style="display:grid;gap:4px"><button class="ncp-btn" data-post="${i}">Post</button><button class="ncp-btn" data-reel="${i}">Reels</button></div></div>`).join('')}</div></div><div style="display:grid;gap:12px"><div class="ncp-box"><h4>Filary treści</h4>${plan.pillars.map(x=>`<span class="ncp-pill">${esc(x)}</span>`).join('')}</div><div class="ncp-box"><h4>Plan monetyzacji</h4><div class="ncp-money">${plan.monetization.map((x,i)=>`<div><b>${i+1}. ${esc(x)}</b></div>`).join('')}</div></div></div></div>`;
    panel.querySelectorAll('[data-post]').forEach(b=>b.onclick=()=>pushTo('posts',plan.ideas[Number(b.dataset.post)],plan.niche));
    panel.querySelectorAll('[data-reel]').forEach(b=>b.onclick=()=>pushTo('reels',plan.ideas[Number(b.dataset.reel)],plan.niche));
    document.getElementById('ncpRegenerate').onclick=()=>{const p=buildPlan(plan.niche);p.ideas=p.ideas.map((x,i)=>[i%2===0?`${x[0]} — wersja praktyczna`:`${x[0]} — wersja 30 s`,x[1]]);save(PLAN_KEY,p);render(p);toast('Przygotowano nowy zestaw pomysłów');};
    document.getElementById('ncpCopy').onclick=async()=>{const text=`NISZA: ${plan.niche}\n\nFILARY:\n${plan.pillars.map(x=>'• '+x).join('\n')}\n\nPOMYSŁY:\n${plan.ideas.map((x,i)=>`${i+1}. ${x[0]} — ${x[1]}`).join('\n')}\n\nMONETYZACJA:\n${plan.monetization.map(x=>'• '+x).join('\n')}`;try{await navigator.clipboard.writeText(text);toast('Plan skopiowany');}catch{toast('Nie udało się skopiować planu');}};
    panel.scrollIntoView({behavior:'smooth',block:'start'});
  }

  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('.nc-use');
    if(!btn)return;
    setTimeout(()=>{
      const card=btn.closest('.nc-rec');
      const niche=card?.querySelector('h3')?.textContent?.trim() || read(PROFILE_KEY,{}).niche || 'Wybrana nisza';
      const plan=buildPlan(niche);
      render(plan);
      toast('Utworzono plan contentu dla wybranej niszy');
    },20);
  });

  document.addEventListener('DOMContentLoaded',()=>{
    const plan=read(PLAN_KEY,null);
    if(plan){const obs=new MutationObserver(()=>{if(document.querySelector('.nc-shell')&&!document.getElementById('ncpPanel'))render(plan)});const root=document.getElementById('content');if(root)obs.observe(root,{childList:true,subtree:true});}
  });
  window.AIINicheContentPlan={build:buildPlan,render};
})();