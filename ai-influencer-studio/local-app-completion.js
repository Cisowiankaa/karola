(() => {
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const num=v=>Number.isFinite(Number(v))?Number(v):0;
  const fmt=n=>new Intl.NumberFormat('pl-PL',{maximumFractionDigits:1}).format(Number(n)||0);
  const QUEUE='aii-social-queue',PROFILES='aii-social-profiles',HISTORY='aii-social-growth-history';

  const style=document.createElement('style');
  style.textContent=`
  .local-suite{display:grid;gap:12px}.local-suite-card{padding:14px;border:1px solid #e7e9f1;border-radius:15px;background:#fff}.local-suite-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.local-suite-kpi{padding:10px;border:1px solid #eceef5;border-radius:11px;background:#fafafe}.local-suite-kpi span{display:block;font-size:7px;color:#777f8d}.local-suite-kpi strong{display:block;font-size:17px;margin-top:4px}.local-suite-list{display:grid;gap:7px;margin-top:9px}.local-suite-row{padding:9px;border:1px solid #eceef5;border-radius:10px;background:#fafafe;font-size:8px;line-height:1.45}.content-auto-fix{display:flex;gap:7px;align-items:center;margin-top:8px;flex-wrap:wrap}.content-auto-fix button{font-size:7px}.local-suite-badge{display:inline-flex;padding:4px 7px;border-radius:999px;background:#edf8f1;color:#287a4b;font-size:6.8px;font-weight:900}.local-suite-table{width:100%;border-collapse:collapse;margin-top:9px;font-size:7.5px}.local-suite-table th,.local-suite-table td{padding:7px;border-bottom:1px solid #eceef5;text-align:left}.local-suite-empty{padding:12px;color:#777f8d;font-size:8px}.local-suite-bars{display:grid;gap:8px;margin-top:10px}.local-suite-bar{display:grid;grid-template-columns:100px 1fr auto;gap:8px;align-items:center;font-size:7px}.local-suite-meter{height:7px;background:#eceef5;border-radius:999px;overflow:hidden}.local-suite-meter i{display:block;height:100%;background:linear-gradient(90deg,#55d9e9,#8067ee)}@media(max-width:760px){.local-suite-grid{grid-template-columns:1fr 1fr}.local-suite-bar{grid-template-columns:75px 1fr auto}}@media(max-width:440px){.local-suite-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function published(){return (read(QUEUE,[])||[]).filter(x=>String(x.status||'').toLowerCase()==='opublikowany');}
  function planned(){return (read(QUEUE,[])||[]).filter(x=>String(x.status||'').toLowerCase()!=='opublikowany');}
  function score(x){return num(x.likes)+num(x.comments)*4;}
  function typeOf(x){const t=String(x.type||x.media_type||'Post');return /reel|video/i.test(t)?'Reels':/carousel/i.test(t)?'Carousel':'Post';}
  function period(days,offset=0){const end=new Date();end.setHours(12,0,0,0);end.setDate(end.getDate()-offset);const start=new Date(end);start.setDate(start.getDate()-days+1);const a=start.toISOString().slice(0,10),b=end.toISOString().slice(0,10);return published().filter(x=>String(x.date||'')>=a&&String(x.date||'')<=b);}
  function summarize(items){return {posts:items.length,likes:items.reduce((s,x)=>s+num(x.likes),0),comments:items.reduce((s,x)=>s+num(x.comments),0),score:items.reduce((s,x)=>s+score(x),0)};}
  function pct(a,b){return b?((a-b)/b*100):(a?100:0)}

  function improveText(root){
    const hookEl=q('[data-hook],#postHook,#reelHook,.post-hook,.reel-hook',root);
    const ctaEl=q('[data-cta],#postCta,#reelCta,.post-cta,.reel-cta',root);
    const bodyEl=q('textarea:not([data-hook]):not([data-cta]),[contenteditable="true"],.generated-copy,.post-copy,.reel-script',root);
    const get=el=>String(el?.value??el?.textContent??'').trim();
    const set=(el,v)=>{if(!el)return;if('value'in el)el.value=v;else el.textContent=v;el.dispatchEvent(new Event('input',{bubbles:true}))};
    let hook=get(hookEl),cta=get(ctaEl),body=get(bodyEl);
    if(hook.length<35)hook=`3 rzeczy, które warto wiedzieć zanim podejmiesz decyzję — ${hook||'sprawdź ten prosty sposób'}.`;
    if(!/[?!:]/.test(hook))hook+=' Sprawdź 👇';
    if(cta.length<10||!/komentarz|napisz|zapisz|wyślij|daj znać|obserwuj/i.test(cta))cta='Zapisz ten materiał i napisz w komentarzu, który punkt wdrożysz jako pierwszy.';
    const words=body.split(/\s+/).filter(Boolean).length;
    if(words<40)body=(body?body+'\n\n':'')+'Najważniejsze: wybierz jeden konkretny krok, zastosuj go dziś i porównaj efekt po kilku dniach. Prosty plan jest skuteczniejszy niż odkładanie działania na później.';
    set(hookEl,hook);set(ctaEl,cta);set(bodyEl,body);
    setTimeout(()=>window.AIIContentScore?.scan?.(),40);
  }
  function addAutoFix(){
    qa('[data-content-score-card]').forEach(card=>{
      if(q('.content-auto-fix',card))return;
      const wrap=document.createElement('div');wrap.className='content-auto-fix';
      wrap.innerHTML='<button class="primary" type="button">⚡ Popraw lokalnie do 80+</button><span>0 tokenów</span>';
      q('button',wrap).onclick=()=>improveText(card.parentElement);
      card.appendChild(wrap);
    });
  }

  function reportView(){
    const cur=summarize(period(30)),prev=summarize(period(30,30));
    const formats={};period(30).forEach(x=>{const k=typeOf(x),g=formats[k]||(formats[k]={count:0,score:0});g.count++;g.score+=score(x)});
    const best=Object.entries(formats).sort((a,b)=>(b[1].score/Math.max(1,b[1].count))-(a[1].score/Math.max(1,a[1].count)))[0];
    const change=pct(cur.score,prev.score),verdict=change>5?'WZROST':change<-5?'SPADEK':'STABILNIE';
    return `<section class="local-suite"><div class="local-suite-card"><div class="section-head"><div><h2>Raport 30 dni</h2><p class="page-subtitle">Lokalny raport wyników — bez AI i bez tokenów.</p></div><span class="local-suite-badge">${verdict}</span></div><div class="local-suite-grid"><div class="local-suite-kpi"><span>Publikacje</span><strong>${cur.posts}</strong></div><div class="local-suite-kpi"><span>Polubienia</span><strong>${fmt(cur.likes)}</strong></div><div class="local-suite-kpi"><span>Komentarze</span><strong>${fmt(cur.comments)}</strong></div><div class="local-suite-kpi"><span>Zmiana wyniku</span><strong>${change>0?'+':''}${change.toFixed(1)}%</strong></div></div></div><div class="local-suite-card"><h3>Najważniejszy wniosek</h3><div class="local-suite-row">${best?`Najlepszym formatem w ostatnich 30 dniach jest <b>${esc(best[0])}</b>. Średni lokalny wynik: <b>${(best[1].score/Math.max(1,best[1].count)).toFixed(1)}</b>.`:'Zbieram dane z opublikowanych treści. Po dodaniu wyników raport uzupełni się automatycznie.'}</div><div class="local-suite-row">Plan: ${change<0?'zmniejsz liczbę eksperymentów i powtórz najlepszy format z mocniejszym hookiem.':'utrzymaj najlepszy format i przetestuj 1 nowy wariant hooka tygodniowo.'}</div></div></section>`;
  }

  function audienceView(){
    const p=(read(PROFILES,[])||[]).find(x=>String(x.platform||'').toLowerCase()==='instagram');
    const items=period(60),formats={};items.forEach(x=>{const k=typeOf(x),g=formats[k]||(formats[k]={n:0,s:0});g.n++;g.s+=score(x)});
    const list=Object.entries(formats).map(([k,v])=>({k,avg:v.s/Math.max(1,v.n)})).sort((a,b)=>b.avg-a.avg);const max=Math.max(1,...list.map(x=>x.avg));
    return `<section class="local-suite"><div class="local-suite-card"><h2>Odbiorcy — model lokalny</h2><p class="page-subtitle">Bez płatnych tokenów. Pokazuję to, co można wiarygodnie wywnioskować z wyników treści; demografii nie zgaduję.</p><div class="local-suite-grid"><div class="local-suite-kpi"><span>Profil</span><strong style="font-size:12px">${esc(p?.handle||'Instagram')}</strong></div><div class="local-suite-kpi"><span>Obserwujący</span><strong>${fmt(p?.followers||0)}</strong></div><div class="local-suite-kpi"><span>Treści analizowane</span><strong>${items.length}</strong></div><div class="local-suite-kpi"><span>Najlepszy format</span><strong style="font-size:12px">${esc(list[0]?.k||'—')}</strong></div></div></div><div class="local-suite-card"><h3>Preferencje odbiorców według reakcji</h3><div class="local-suite-bars">${list.length?list.map(x=>`<div class="local-suite-bar"><b>${esc(x.k)}</b><div class="local-suite-meter"><i style="width:${Math.max(5,x.avg/max*100)}%"></i></div><span>${x.avg.toFixed(1)}</span></div>`).join(''):'<div class="local-suite-empty">Za mało danych do analizy preferencji.</div>'}</div></div><div class="local-suite-card"><h3>Ochrona jakości danych</h3><div class="local-suite-row">Wiek, płeć i lokalizacja nie są generowane „na oko”. Te pola pojawią się dopiero, gdy aplikacja otrzyma prawdziwe dane Insights.</div></div></section>`;
  }

  function financeView(page){
    const key=page==='revenue'?'aii-revenue-items':page==='expenses'?'aii-expense-items':'aii-invoices';const rows=read(key,[])||[];const total=rows.reduce((s,x)=>s+num(x.amount||x.value),0);
    return `<section class="local-suite"><div class="local-suite-card"><div class="section-head"><div><h2>${page==='revenue'?'Przychody':page==='expenses'?'Wydatki':'Faktury'}</h2><p class="page-subtitle">Moduł lokalny — dane pozostają dostępne bez AI.</p></div><span class="local-suite-badge">OFFLINE READY</span></div><div class="local-suite-grid"><div class="local-suite-kpi"><span>Liczba pozycji</span><strong>${rows.length}</strong></div><div class="local-suite-kpi"><span>Łączna wartość</span><strong>${fmt(total)} zł</strong></div></div>${rows.length?`<table class="local-suite-table"><thead><tr><th>Data</th><th>Opis</th><th>Kwota</th></tr></thead><tbody>${rows.slice(0,20).map(x=>`<tr><td>${esc(x.date||'')}</td><td>${esc(x.title||x.name||x.description||'Pozycja')}</td><td>${fmt(x.amount||x.value)} zł</td></tr>`).join('')}</tbody></table>`:'<div class="local-suite-empty">Brak zapisanych pozycji. Moduł jest gotowy na lokalny zapis danych.</div>'}</div></section>`;
  }

  function overrideView(page){const root=q('#content');if(!root)return;if(page==='reports')root.innerHTML=reportView();else if(page==='audience')root.innerHTML=audienceView();else if(['revenue','expenses','invoices'].includes(page))root.innerHTML=financeView(page);}
  function bindNav(){qa('.nav-item').forEach(a=>a.addEventListener('click',()=>{const page=a.dataset.view;if(['reports','audience','revenue','expenses','invoices'].includes(page))setTimeout(()=>overrideView(page),30)}));}
  function scan(){addAutoFix();}
  document.addEventListener('DOMContentLoaded',()=>{bindNav();const root=q('#content');if(root)new MutationObserver(()=>setTimeout(scan,50)).observe(root,{childList:true,subtree:true});setTimeout(scan,400)});
  window.AIILocalAppCompletion={improve:improveText,report:reportView,audience:audienceView};
})();