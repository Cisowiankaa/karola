(() => {
  const PROFILE_KEY='aii-creator-profile';
  const RESULT_KEY='aii-niche-classification';
  const q=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const clamp=n=>Math.max(0,Math.min(100,Math.round(n)));
  const toast=t=>window.showToast?window.showToast(t):alert(t);

  const style=document.createElement('style');
  style.textContent=`
    .nc-shell{display:grid;gap:14px}.nc-hero{background:linear-gradient(135deg,#151827,#202534);color:#fff;border:1px solid #303749;border-radius:18px;padding:20px}.nc-hero h2{margin:4px 0 8px}.nc-hero p{margin:0;color:#cad1df;line-height:1.55}
    .nc-card{background:#171b26;color:#eef2f8;border:1px solid #303645;border-radius:16px;padding:18px}.nc-form{display:grid;grid-template-columns:1.2fr .8fr .7fr;gap:10px}.nc-form label{display:grid;gap:5px;font-size:9px;font-weight:800;color:#aeb6c5}.nc-form input,.nc-form select{border:1px solid #394052;background:#11151f;color:#eef2f8;border-radius:10px;padding:10px 12px;font:inherit}.nc-btn{border:0;border-radius:10px;padding:10px 14px;font-weight:800;background:linear-gradient(90deg,#93f3e7,#edb6f8);color:#252936;cursor:pointer}
    .nc-tags,.nc-keywords{display:flex;gap:7px;flex-wrap:wrap;margin:12px 0}.nc-tag{padding:6px 9px;border-radius:999px;background:#242a38;border:1px solid #394151;font-size:8px;font-weight:800}.nc-tier{background:#315d60;color:#aef7ec}.nc-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.nc-score{margin:10px 0}.nc-score-head{display:flex;justify-content:space-between;gap:8px;font-size:9px;font-weight:800}.nc-bar{height:8px;border-radius:999px;background:#29303d;overflow:hidden;margin-top:6px}.nc-bar>i{display:block;height:100%;background:linear-gradient(90deg,#79eadc,#a6f5ea);border-radius:999px}.nc-note{font-size:9px;line-height:1.6;color:#c4ccda}.nc-box{border:1px solid #333a49;border-radius:13px;padding:14px;background:#151923}.nc-box h4{margin:0 0 8px;font-size:10px}.nc-platform{display:grid;gap:9px}.nc-platform-row{display:grid;grid-template-columns:90px 1fr 48px;align-items:center;gap:8px;font-size:9px}.nc-warning{border:1px solid #93444c;background:#351e25;color:#ffd7db;border-radius:13px;padding:13px;font-size:9px;line-height:1.55}.nc-summary{border-top:1px solid #333a49;margin-top:14px;padding-top:14px;line-height:1.6;font-size:9px}.nc-muted{color:#8993a5;font-size:8px}.nc-two{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media(max-width:900px){.nc-form,.nc-grid,.nc-two{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const groups={
    health:['zdrow','diet','odchudz','cukr','insulin','fitness','psych','sen','suplement','medycz','nawyk'],
    beauty:['beauty','kosmet','makija','pielęgn','włos','skóra','urod'],
    finance:['finans','inwest','pienią','kredyt','księg','podat','rachunk'],
    business:['biznes','marketing','social','instagram','ugc','sprzeda','firma','creator'],
    food:['przepis','kuch','meal','jedzen','gotow','żywien'],
    tech:['ai','sztuczn','tech','aplik','program','software','automatyz']
  };
  const has=(text,list)=>list.some(x=>text.includes(x));
  const hash=text=>{let h=2166136261;for(const c of text)h=(h^c.charCodeAt(0))*16777619>>>0;return h};

  function analyze(niche,market,persona){
    const t=(niche+' '+persona).toLowerCase();
    const h=hash(t+'|'+market);
    const flags=Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,has(t,v)]));
    let demand=64+(h%18)+(flags.health?8:0)+(flags.beauty?7:0)+(flags.business?5:0)+(flags.food?5:0);
    let competition=58+((h>>4)%22)+(flags.health?12:0)+(flags.beauty?10:0)+(flags.finance?10:0);
    let monetization=60+((h>>7)%18)+(flags.business?10:0)+(flags.beauty?8:0)+(flags.finance?9:0)+(flags.health?7:0);
    let scale=65+((h>>11)%18)+(flags.tech?8:0)+(flags.business?7:0)+(flags.food?4:0);
    let personaFit=66+((h>>15)%16)+(flags.beauty||flags.business?7:0);
    demand=clamp(demand);competition=clamp(competition);monetization=clamp(monetization);scale=clamp(scale);personaFit=clamp(personaFit);
    const ymyl=flags.health||flags.finance||/(prawo|prawnic|leczen|diagnoz|terapi|kredyt|inwest)/.test(t);
    const maturity=demand>=82?'dojrzały':demand>=68?'rozwijający się':'wczesny';
    const avg=(demand+monetization+scale+personaFit+(100-competition))/5;
    const tier=avg>=75?'Tier A':avg>=62?'Tier B':'Tier C';
    const platform={
      Instagram:clamp(74+(flags.beauty?17:0)+(flags.food?12:0)+(flags.business?6:0)),
      TikTok:clamp(70+(flags.beauty?12:0)+(flags.food?12:0)+(flags.health?8:0)+(flags.tech?8:0)),
      Pinterest:clamp(61+(flags.beauty?15:0)+(flags.food?17:0)+(flags.health?7:0)),
      YouTube:clamp(64+(flags.health?11:0)+(flags.tech?13:0)+(flags.finance?10:0)+(flags.business?8:0))
    };
    const adjacent=flags.health?['Meal prep i organizacja','Higiena snu','Ruch i mobilność','Nawyki i produktywność']:
      flags.beauty?['Budżetowe kosmetyki','Pielęgnacja włosów','UGC beauty','Minimalistyczna rutyna']:
      flags.business?['UGC dla marek','Automatyzacja treści','Personal branding','Monetyzacja social media']:
      ['Lifestyle praktyczny','Poradniki i checklisty','Recenzje produktów','Organizacja i nawyki'];
    const words=niche.toLowerCase().split(/[^a-ząćęłńóśźż0-9]+/i).filter(x=>x.length>3).slice(0,5);
    const keywords=[...new Set([...words,'porady','inspiracje','praktycznie'])].slice(0,8).map(x=>'#'+x.replace(/[^a-ząćęłńóśźż0-9]/gi,''));
    const season=flags.health?'Wzrost zainteresowania zwykle na początku roku i przed sezonem letnim.':flags.beauty?'Silne okresy: premiery, sezon świąteczny i zmiany pór roku.':'Zależność sezonowa umiarkowana; warto planować kampanie wokół wydarzeń i trendów.';
    const intent=flags.health?'Odbiorcy szukają prostych, wiarygodnych wyjaśnień i możliwych do wdrożenia nawyków.':flags.beauty?'Odbiorcy szukają porównań, testów, efektów i konkretnych rekomendacji zakupowych.':'Odbiorcy szukają szybkich, praktycznych odpowiedzi, porównań i inspiracji.';
    return {niche,market,tier,maturity,demand,competition,monetization,scale,personaFit,platform,ymyl,adjacent,keywords,season,intent,flags};
  }

  function score(label,value){return `<div class="nc-score"><div class="nc-score-head"><span>${esc(label)}</span><b>${value}/100</b></div><div class="nc-bar"><i style="width:${value}%"></i></div></div>`}

  function renderResult(r){
    const host=q('#ncResult'); if(!host)return;
    const platformRows=Object.entries(r.platform).map(([name,v])=>`<div class="nc-platform-row"><b>${name}</b><div class="nc-bar"><i style="width:${v}%"></i></div><b>${v}/100</b></div>`).join('');
    host.innerHTML=`
      <div class="nc-tags"><span class="nc-tag nc-tier">${esc(r.tier)}</span><span class="nc-tag">${esc(r.niche)}</span><span class="nc-tag">rynek: ${esc(r.maturity)}</span><span class="nc-tag">${esc(r.market)}</span></div>
      <p class="nc-note">Ocena heurystyczna dla niszy <b>${esc(r.niche)}</b>. Wyniki służą do planowania treści i nie są zewnętrznym pomiarem wielkości rynku.</p>
      <div class="nc-grid"><div>${score('Popyt',r.demand)}${score('Monetyzacja',r.monetization)}${score('Dopasowanie do persony AI',r.personaFit)}</div><div>${score('Konkurencja',r.competition)}${score('Skalowalność treści',r.scale)}</div></div>
      <div class="nc-two" style="margin-top:14px"><div class="nc-box"><h4>Intencja odbiorcy</h4><div class="nc-note">${esc(r.intent)}</div><h4 style="margin-top:14px">Sezonowość</h4><div class="nc-note">${esc(r.season)}</div></div><div class="nc-box"><h4>Dopasowanie platform</h4><div class="nc-platform">${platformRows}</div></div></div>
      ${r.ymyl?`<div class="nc-warning" style="margin-top:14px"><b>⚠ Temat wrażliwy (YMYL)</b><br>Treści powinny wyraźnie oddzielać edukację i opinię od indywidualnych porad medycznych, finansowych lub prawnych. Przy twierdzeniach faktograficznych używaj wiarygodnych źródeł.</div>`:''}
      <div class="nc-two" style="margin-top:14px"><div class="nc-box"><h4>Nisze sąsiednie</h4><div class="nc-keywords">${r.adjacent.map(x=>`<span class="nc-tag">${esc(x)}</span>`).join('')}</div></div><div class="nc-box"><h4>Słowa kluczowe</h4><div class="nc-keywords">${r.keywords.map(x=>`<span class="nc-tag">${esc(x)}</span>`).join('')}</div></div></div>
      <div class="nc-summary"><b>Wniosek:</b> ${r.demand>=75?'Nisza ma dobry potencjał treściowy. ':'Nisza wymaga mocniejszego wyróżnika. '}${r.competition>=80?'Konkurencja jest wysoka, więc warto zawęzić pozycjonowanie i oprzeć profil na wyraźnej personie. ':'Konkurencja pozostawia przestrzeń na rozpoznawalny format. '}${r.monetization>=75?'Potencjał monetyzacji jest wysoki poprzez produkty cyfrowe, afiliację, UGC lub współprace.':'Monetyzację warto budować etapami, zaczynając od prostych ofert i afiliacji.'}</div>`;
  }

  function open(){
    const content=q('#content'); if(!content)return;
    const p=read(PROFILE_KEY,{});
    const initial=p.niche||'Beauty / lifestyle / UGC';
    q('#pageTitle').textContent='Klasyfikacja niszy';
    q('#pageSubtitle').textContent='Ocena rynku, konkurencji, monetyzacji i dopasowania platform.';
    document.querySelectorAll('.nav-item').forEach(a=>a.classList.toggle('active',a.dataset.view==='niche-classifier'));
    content.innerHTML=`<section class="nc-shell"><section class="nc-hero"><div class="eyebrow">NICHE INTELLIGENCE</div><h2>Klasyfikacja niszy</h2><p>Sprawdź potencjał tematu, poziom konkurencji, skalowalność oraz dopasowanie platform. Tryb lokalny działa bez AI i bez płatnych tokenów.</p></section><section class="nc-card"><div class="nc-form"><label>Nisza<input id="ncNiche" value="${esc(initial)}"></label><label>Rynek<select id="ncMarket"><option>Polska</option><option>Europa</option><option>Globalny</option><option>Niemcy</option><option>UK / USA</option></select></label><label>&nbsp;<button class="nc-btn" id="ncRun">Sklasyfikuj niszę</button></label></div><div id="ncResult"></div></section></section>`;
    const saved=read(RESULT_KEY,null);
    const run=()=>{const r=analyze(q('#ncNiche').value.trim()||initial,q('#ncMarket').value,JSON.stringify(p));save(RESULT_KEY,r);renderResult(r);toast('Nisza sklasyfikowana')};
    q('#ncRun').onclick=run;
    if(saved&&saved.niche){q('#ncMarket').value=saved.market||'Polska';renderResult(saved)}else run();
  }

  function bind(){const link=q('.nav-item[data-view="niche-classifier"]');if(link)link.onclick=e=>{e?.preventDefault?.();open()}}
  document.addEventListener('DOMContentLoaded',bind);setTimeout(bind,0);
  window.AII_NicheClassifier={open,analyze};
})();