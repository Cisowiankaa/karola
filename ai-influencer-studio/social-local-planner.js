(() => {
  const QUEUE='aii-social-queue';
  const RECS='aii-social-local-recommendations';
  const PLAN='aii-social-local-month-plan';
  const q=(s,r=document)=>r.querySelector(s);
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[c]));
  const toast=t=>window.showToast?window.showToast(t):null;
  const isoDay=(offset=0)=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+offset);return d.toISOString().slice(0,10)};

  const style=document.createElement('style');
  style.textContent=`
    .local-month-planner{margin-top:12px;padding:12px;border:1px solid #e7e1fa;border-radius:12px;background:#fcfbff}.local-month-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.local-month-head b{font-size:9.5px}.local-month-head span{display:block;font-size:7px;color:#777f8d;margin-top:3px}.local-month-actions{display:flex;gap:7px;flex-wrap:wrap}.local-month-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:9px;max-height:560px;overflow:auto;padding-right:2px}.local-day{padding:9px;border:1px solid #ece8f7;border-radius:9px;background:#fff;min-height:122px}.local-day em{display:block;font-style:normal;font-size:6.5px;color:#777f8d;text-transform:uppercase;font-weight:900}.local-day strong{display:block;font-size:8.5px;line-height:1.35;margin-top:4px}.local-day small{display:block;font-size:6.8px;color:#777f8d;line-height:1.4;margin-top:4px}.local-day .local-type{display:inline-flex;margin-top:6px;padding:3px 5px;border-radius:999px;background:#f1edff;color:#644fd1;font-size:6.2px;font-weight:900}.local-copy{margin-top:6px;padding-top:6px;border-top:1px dashed #ece8f7}.local-copy b{display:block;font-size:6.8px}.local-copy span{display:block;font-size:6.5px;color:#656b78;line-height:1.35;margin-top:2px}.local-month-note{font-size:7px;color:#777f8d;line-height:1.45;margin-top:8px}
    .free-slot-finder{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:9px;padding:9px 10px;border:1px solid #ded8f6;border-radius:10px;background:#fbfaff}.free-slot-finder button{white-space:nowrap}.free-slot-result{font-size:7.5px;color:#656b78;line-height:1.45}.free-slot-result b{color:#43378b}.free-slot-badge{display:inline-flex;padding:4px 7px;border-radius:999px;background:#edf8f1;color:#287a4b;font-size:6.8px;font-weight:900}
    @media(max-width:1100px){.local-month-grid{grid-template-columns:repeat(4,1fr)}}@media(max-width:800px){.local-month-grid{grid-template-columns:1fr 1fr}}@media(max-width:440px){.local-month-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function getRecs(){
    if(window.AIISocialPerformance?.recommendations){try{return window.AIISocialPerformance.recommendations()}catch{}}
    return read(RECS,{});
  }
  function hourFrom(title){const m=String(title||'').match(/(\d{1,2}):00/);return m?`${String(Number(m[1])).padStart(2,'0')}:00`:'18:00'}
  function topicFrom(title){return String(title||'').replace(/^Rozwijaj temat:\s*/i,'').trim()||'główny temat profilu'}
  function formatFrom(title){return String(title||'').replace(/^Powtórz:\s*/i,'').trim()||'Post'}

  const HOOKS=[
    topic=>`Jeśli interesuje Cię ${topic}, zacznij od tego jednego kroku.`,
    topic=>`Najczęstszy błąd przy ${topic}? Właśnie ten.`,
    topic=>`3 rzeczy o ${topic}, które warto wiedzieć przed kolejną decyzją.`,
    topic=>`To może całkowicie zmienić Twoje podejście do ${topic}.`,
    topic=>`Zapisz to, jeśli ${topic} jest dla Ciebie ważne.`,
    topic=>`Mały test: czy robisz to dobrze w temacie ${topic}?`,
    topic=>`Nie potrzebujesz więcej chaosu. Potrzebujesz prostszego podejścia do ${topic}.`,
    topic=>`Co działa lepiej w ${topic}? Sprawdźmy na konkretnym przykładzie.`
  ];
  const CTAS=[
    'Napisz w komentarzu, którą opcję wybierasz.',
    'Zapisz ten post, żeby wrócić do niego później.',
    'Wyślij to osobie, której może się przydać.',
    'Daj znać, czy chcesz część 2.',
    'Napisz swoje doświadczenie — porównamy wyniki.',
    'Który punkt wdrożysz jako pierwszy?',
    'Jeśli to było pomocne, zostaw krótkie „tak”.',
    'Zadaj mi jedno pytanie do tego tematu w komentarzu.'
  ];
  const THEMES=[
    ['Hook + problem',topic=>`Pokaż konkretny problem odbiorcy związany z: ${topic}, a następnie jedną prostą obietnicę rozwiązania.`],
    ['Porada praktyczna',topic=>`Podaj 3 krótkie wskazówki dotyczące: ${topic}. Każda ma być możliwa do zastosowania od razu.`],
    ['Dowód / przykład',topic=>`Pokaż realny przykład, rezultat, porównanie albo „przed i po” związane z: ${topic}.`],
    ['Pytanie do społeczności',topic=>`Zadaj jedno proste pytanie wokół: ${topic}. Bez rozbudowanego wstępu.`],
    ['Mini tutorial',topic=>`Pokaż jeden rezultat krok po kroku związany z: ${topic}.`],
    ['Mit kontra fakt',topic=>`Obal jeden popularny mit dotyczący: ${topic}, a następnie podaj prosty fakt.`],
    ['Lista kontrolna',topic=>`Stwórz checklistę 4–5 punktów dotyczącą: ${topic}.`],
    ['Porównanie',topic=>`Porównaj dwie popularne opcje w temacie: ${topic} i wskaż, dla kogo jest każda z nich.`],
    ['Kulisy',topic=>`Pokaż proces, przygotowanie lub kulisy związane z: ${topic}.`],
    ['FAQ',topic=>`Odpowiedz na jedno często zadawane pytanie dotyczące: ${topic}.`]
  ];

  const metric=x=>(Number(x?.likes)||0)+((Number(x?.comments)||0)*4);
  const hourNumber=t=>{const h=Number(String(t||'').slice(0,2));return Number.isFinite(h)&&h>=0&&h<=23?h:null};
  const dayOfWeek=date=>{const d=new Date(`${date}T12:00:00`);return Number.isNaN(d.getTime())?null:d.getDay()};
  const avg=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
  function performanceRows(){
    return read(QUEUE,[]).filter(x=>String(x.status||'').toLowerCase()==='opublikowany'&&x.date&&hourNumber(x.time)!=null&&(x.likes!=null||x.comments!=null)).map(x=>({...x,_score:metric(x),_hour:hourNumber(x.time),_dow:dayOfWeek(x.date)}));
  }
  function occupied(date,time){
    const target=new Date(`${date}T${time||'00:00'}:00`);if(Number.isNaN(target.getTime()))return true;
    return read(QUEUE,[]).some(x=>{
      if(!x?.date||!x?.time||String(x.status||'').toLowerCase()==='opublikowany')return false;
      const t=new Date(`${x.date}T${x.time}:00`);if(Number.isNaN(t.getTime()))return false;
      return Math.abs(t-target)<90*60*1000;
    });
  }
  function slotScore(date,hour){
    const rows=performanceRows(),r=getRecs(),recommended=Number(hourFrom(r?.hour?.title).slice(0,2));
    if(!rows.length)return {score:hour===recommended?2:1,reason:`mało danych • preferowana godzina ${String(recommended).padStart(2,'0')}:00`,sample:0};
    const targetDow=dayOfWeek(date),dayRows=rows.filter(x=>x._dow===targetDow),hourRows=rows.filter(x=>x._hour===hour),exact=rows.filter(x=>x._dow===targetDow&&x._hour===hour);
    const global=avg(rows.map(x=>x._score))||1;
    let estimate=global,sample=0,reason='średnia historyczna';
    if(exact.length){estimate=avg(exact.map(x=>x._score));sample=exact.length;reason='dokładny dzień i godzina';}
    else if(dayRows.length&&hourRows.length){estimate=(avg(dayRows.map(x=>x._score))*0.4)+(avg(hourRows.map(x=>x._score))*0.6);sample=dayRows.length+hourRows.length;reason='podobne dni i godziny';}
    else if(hourRows.length){estimate=avg(hourRows.map(x=>x._score));sample=hourRows.length;reason='ta sama godzina';}
    else if(dayRows.length){estimate=avg(dayRows.map(x=>x._score));sample=dayRows.length;reason='ten sam dzień tygodnia';}
    const recBoost=hour===recommended?global*0.08:0;
    return {score:estimate+recBoost,reason,sample};
  }
  function candidateHours(){
    const rows=performanceRows(),r=getRecs(),rec=Number(hourFrom(r?.hour?.title).slice(0,2));
    return [...new Set([rec,...rows.map(x=>x._hour),9,12,15,18,19,20,21])].filter(h=>Number.isFinite(h)&&h>=7&&h<=22);
  }
  function findBestFreeSlot(days=21){
    const now=new Date();now.setSeconds(0,0);const candidates=[],hours=candidateHours();
    for(let offset=0;offset<days;offset++){
      const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+offset);const date=d.toISOString().slice(0,10);
      for(const hour of hours){
        const time=`${String(hour).padStart(2,'0')}:00`,when=new Date(`${date}T${time}:00`);if(when<=now||occupied(date,time))continue;
        const perf=slotScore(date,hour);candidates.push({date,time,hour,score:perf.score-(offset*0.002),reason:perf.reason,sample:perf.sample});
      }
    }
    return candidates.sort((a,b)=>b.score-a.score||a.date.localeCompare(b.date)||a.time.localeCompare(b.time))[0]||null;
  }

  function pickType(i,best){
    const cycle=[best,'Reels','Post','Carousel','Reels','Post'];
    return cycle[i%cycle.length]||'Post';
  }
  function build(){
    const r=getRecs(),topic=topicFrom(r?.topic?.title),bestFormat=formatFrom(r?.format?.title),time=hourFrom(r?.hour?.title);
    const plan=Array.from({length:30},(_,i)=>{
      const theme=THEMES[i%THEMES.length];
      const hook=HOOKS[i%HOOKS.length](topic);
      const cta=CTAS[(i*3)%CTAS.length];
      const type=pickType(i,bestFormat);
      return {
        id:`local-month-${isoDay(i)}-${i}`,
        date:isoDay(i),time,
        title:theme[0],
        notes:theme[1](topic),
        hook,cta,type,
        platform:'Instagram',status:'Planowany',source:'Local Planner',local:true
      };
    });
    save(PLAN,plan);return plan;
  }
  function getPlan(){const p=read(PLAN,[]);return Array.isArray(p)&&p.length===30?p:build()}
  function schedule(){
    const queue=read(QUEUE,[]),plan=getPlan();let added=0;
    for(const item of plan){
      const exists=queue.some(x=>x.id===item.id||(x.date===item.date&&x.title===item.title&&x.source==='Local Planner'));
      if(!exists){queue.push(item);added++;}
    }
    save(QUEUE,queue);
    document.dispatchEvent(new CustomEvent('aii:social-changed',{detail:{source:'Local Planner',added}}));
    toast?.(added?`Dodano ${added} pozycji do kalendarza`:'Plan 30 dni jest już w kalendarzu');
    return added;
  }
  function dayCard(x){
    return `<div class="local-day"><em>${esc(new Date(`${x.date}T12:00:00`).toLocaleDateString('pl-PL',{weekday:'short',day:'2-digit',month:'2-digit'}))} • ${esc(x.time)}</em><strong>${esc(x.title)}</strong><small>${esc(x.notes)}</small><span class="local-type">${esc(x.type)}</span><div class="local-copy"><b>Hook</b><span>${esc(x.hook)}</span><b style="margin-top:4px">CTA</b><span>${esc(x.cta)}</span></div></div>`
  }
  function html(){const plan=getPlan();return `<div class="local-month-planner" id="localMonthPlanner"><div class="local-month-head"><div><b>Plan 30 dni — bez AI</b><span>Lokalny kalendarz treści + hooki + CTA, bez OpenAI i bez dodatkowych tokenów</span></div><div class="local-month-actions"><button class="ghost" type="button" id="localMonthRebuild">↻ Przelicz</button><button class="primary" type="button" id="localMonthSchedule">＋ Dodaj 30 dni do kalendarza</button></div></div><div class="local-month-grid">${plan.map(dayCard).join('')}</div><div class="local-month-note">Plan wykorzystuje lokalne rekomendacje formatu, tematu i godziny. Hooki oraz CTA powstają z wbudowanych szablonów — 0 tokenów. Duplikaty nie są ponownie dodawane do kolejki.</div></div>`}
  function render(){
    if(localStorage.getItem('aii-last-view')!=='social')return;
    const anchor=q('#socialPerformanceRadar');if(!anchor)return;
    q('#localWeekPlanner')?.remove();q('#localMonthPlanner')?.remove();anchor.insertAdjacentHTML('beforeend',html());
    q('#localMonthRebuild')?.addEventListener('click',()=>{build();render();toast?.('Plan 30 dni przeliczony')});
    q('#localMonthSchedule')?.addEventListener('click',schedule);
  }
  function injectCalendarFinder(){
    if(localStorage.getItem('aii-last-view')!=='calendar')return;
    const editor=q('.cal-editor');if(!editor||q('#freeSlotFinder'))return;
    const wrap=document.createElement('div');wrap.id='freeSlotFinder';wrap.className='free-slot-finder';
    wrap.innerHTML='<button class="primary" type="button" id="findBestFreeSlot">✦ Znajdź najlepszy wolny termin</button><span class="free-slot-result" id="freeSlotResult">Przeszukam najbliższe 21 dni i ominę zajęte sloty.</span>';
    editor.insertAdjacentElement('afterend',wrap);
    q('#findBestFreeSlot')?.addEventListener('click',()=>{
      const slot=findBestFreeSlot(21),out=q('#freeSlotResult');
      if(!slot){if(out)out.textContent='Nie znaleziono wolnego slotu w najbliższych 21 dniach.';toast?.('Brak wolnego terminu');return;}
      const date=q('#calNewDate'),time=q('#calNewTime');
      if(date){date.value=slot.date;date.dispatchEvent(new Event('change',{bubbles:true}));}
      if(time){time.value=slot.time;time.dispatchEvent(new Event('change',{bubbles:true}));}
      const label=new Date(`${slot.date}T12:00:00`).toLocaleDateString('pl-PL',{weekday:'long',day:'2-digit',month:'2-digit'});
      if(out)out.innerHTML=`<span class="free-slot-badge">NAJLEPSZY WOLNY</span> <b>${esc(label)} • ${esc(slot.time)}</b> — ${esc(slot.reason)}${slot.sample?` • ${slot.sample} pomiarów`:''}.`;
      toast?.(`Najlepszy wolny termin: ${label}, ${slot.time}`);
    });
  }
  function refresh(){render();injectCalendarFinder();}
  document.addEventListener('DOMContentLoaded',()=>{
    const root=q('#content');if(root)new MutationObserver(()=>setTimeout(refresh,60)).observe(root,{childList:true,subtree:true});
    document.addEventListener('aii:social-changed',()=>setTimeout(()=>{build();refresh()},80));
    document.querySelectorAll('.nav-item[data-view="calendar"]').forEach(a=>a.addEventListener('click',()=>setTimeout(injectCalendarFinder,120)));
    setTimeout(refresh,450);
  });
  window.AIILocalMonthPlanner={build,getPlan,schedule,refresh,findBestFreeSlot};
  window.AIILocalWeekPlanner={build:()=>getPlan().slice(0,7),getPlan:()=>getPlan().slice(0,7),schedule,refresh,findBestFreeSlot};
})();