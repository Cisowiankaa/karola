(() => {
  const QUEUE='aii-social-queue';
  const RECS='aii-social-local-recommendations';
  const PLAN='aii-social-local-week-plan';
  const q=(s,r=document)=>r.querySelector(s);
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const toast=t=>window.showToast?window.showToast(t):null;
  const isoDay=(offset=0)=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+offset);return d.toISOString().slice(0,10)};

  const style=document.createElement('style');
  style.textContent=`
    .local-week-planner{margin-top:12px;padding:12px;border:1px solid #e7e1fa;border-radius:12px;background:#fcfbff}.local-week-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.local-week-head b{font-size:9.5px}.local-week-head span{display:block;font-size:7px;color:#777f8d;margin-top:3px}.local-week-actions{display:flex;gap:7px;flex-wrap:wrap}.local-week-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-top:9px}.local-day{padding:9px;border:1px solid #ece8f7;border-radius:9px;background:#fff;min-height:105px}.local-day em{display:block;font-style:normal;font-size:6.5px;color:#777f8d;text-transform:uppercase;font-weight:900}.local-day strong{display:block;font-size:8.5px;line-height:1.35;margin-top:4px}.local-day small{display:block;font-size:6.8px;color:#777f8d;line-height:1.4;margin-top:4px}.local-day .local-type{display:inline-flex;margin-top:6px;padding:3px 5px;border-radius:999px;background:#f1edff;color:#644fd1;font-size:6.2px;font-weight:900}.local-week-note{font-size:7px;color:#777f8d;line-height:1.45;margin-top:8px}@media(max-width:1050px){.local-week-grid{grid-template-columns:repeat(4,1fr)}}@media(max-width:700px){.local-week-grid{grid-template-columns:1fr 1fr}}@media(max-width:440px){.local-week-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function getRecs(){
    if(window.AIISocialPerformance?.recommendations){try{return window.AIISocialPerformance.recommendations()}catch{}}
    return read(RECS,{});
  }
  function hourFrom(title){const m=String(title||'').match(/(\d{1,2}):00/);return m?`${String(Number(m[1])).padStart(2,'0')}:00`:'18:00'}
  function topicFrom(title){return String(title||'').replace(/^Rozwijaj temat:\s*/i,'').trim()||'główny temat profilu'}
  function formatFrom(title){return String(title||'').replace(/^Powtórz:\s*/i,'').trim()||'Post'}
  function build(){
    const r=getRecs(),topic=topicFrom(r?.topic?.title),format=formatFrom(r?.format?.title),time=hourFrom(r?.hour?.title);
    const templates=[
      ['Hook + problem',`Mocne otwarcie dotyczące: ${topic}. Pokaż konkretny problem odbiorcy i obietnicę rozwiązania.`,format],
      ['Porada praktyczna',`3 krótkie wskazówki związane z: ${topic}. Każda wskazówka ma być możliwa do zastosowania od razu.`,format],
      ['Dowód / przykład',`Pokaż realny przykład, rezultat albo krótkie „przed i po” związane z: ${topic}.`,'Carousel'],
      ['Post angażujący',`Jedno proste pytanie do społeczności na temat: ${topic}. Zakończ jasnym CTA do komentarza.`,'Post'],
      ['Mini tutorial',`Krótki tutorial krok po kroku dotyczący: ${topic}. Skup się na jednym rezultacie.`,'Reels'],
      ['Mit kontra fakt',`Obal jeden popularny mit związany z: ${topic}, a potem podaj prosty fakt lub rozwiązanie.`,'Reels'],
      ['Podsumowanie tygodnia',`Zbierz 3 najważniejsze wnioski tygodnia wokół: ${topic}. Dodaj pytanie, czego odbiorcy chcą więcej.`,'Post']
    ];
    const plan=templates.map((x,i)=>({id:`local-week-${isoDay(i)}-${i}`,date:isoDay(i),time,title:x[0],notes:x[1],type:x[2],platform:'Instagram',status:'Planowany',source:'Local Planner',local:true}));
    save(PLAN,plan);return plan;
  }
  function getPlan(){const p=read(PLAN,[]);return Array.isArray(p)&&p.length===7?p:build()}
  function schedule(){
    const queue=read(QUEUE,[]),plan=getPlan();let added=0;
    for(const item of plan){
      const exists=queue.some(x=>x.id===item.id||(x.date===item.date&&x.title===item.title&&x.source==='Local Planner'));
      if(!exists){queue.push(item);added++;}
    }
    save(QUEUE,queue);
    document.dispatchEvent(new CustomEvent('aii:social-changed',{detail:{source:'Local Planner',added}}));
    toast?.(added?`Dodano ${added} pozycji do kalendarza`:'Plan tygodnia jest już w kalendarzu');
    return added;
  }
  function dayCard(x){return `<div class="local-day"><em>${esc(new Date(`${x.date}T12:00:00`).toLocaleDateString('pl-PL',{weekday:'short',day:'2-digit',month:'2-digit'}))} • ${esc(x.time)}</em><strong>${esc(x.title)}</strong><small>${esc(x.notes)}</small><span class="local-type">${esc(x.type)}</span></div>`}
  function html(){const plan=getPlan();return `<div class="local-week-planner" id="localWeekPlanner"><div class="local-week-head"><div><b>Plan 7 dni — bez AI</b><span>Tworzony lokalnie na podstawie wyników Twoich publikacji</span></div><div class="local-week-actions"><button class="ghost" type="button" id="localWeekRebuild">↻ Przelicz</button><button class="primary" type="button" id="localWeekSchedule">＋ Dodaj do kalendarza</button></div></div><div class="local-week-grid">${plan.map(dayCard).join('')}</div><div class="local-week-note">Plan działa bez OpenAI i bez dodatkowych tokenów. Wykorzystuje lokalne rekomendacje formatu, tematu i godziny publikacji. Możesz go przeliczać po każdej synchronizacji nowych wyników.</div></div>`}
  function render(){
    if(localStorage.getItem('aii-last-view')!=='social')return;
    const anchor=q('#socialPerformanceRadar');if(!anchor)return;
    q('#localWeekPlanner')?.remove();anchor.insertAdjacentHTML('beforeend',html());
    q('#localWeekRebuild')?.addEventListener('click',()=>{save(PLAN,build());render();toast?.('Plan lokalny przeliczony')});
    q('#localWeekSchedule')?.addEventListener('click',schedule);
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const root=q('#content');if(root)new MutationObserver(()=>setTimeout(render,60)).observe(root,{childList:true,subtree:true});
    document.addEventListener('aii:social-changed',()=>setTimeout(()=>{save(PLAN,build());render()},80));
    setTimeout(render,450);
  });
  window.AIILocalWeekPlanner={build,getPlan,schedule,refresh:render};
})();