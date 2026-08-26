(() => {
  const QUEUE='aii-social-queue';
  const RECS='aii-social-local-recommendations';
  const PLAN='aii-social-local-month-plan';
  const q=(s,r=document)=>r.querySelector(s);
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const toast=t=>window.showToast?window.showToast(t):null;
  const isoDay=(offset=0)=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+offset);return d.toISOString().slice(0,10)};

  const style=document.createElement('style');
  style.textContent=`
    .local-month-planner{margin-top:12px;padding:12px;border:1px solid #e7e1fa;border-radius:12px;background:#fcfbff}.local-month-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.local-month-head b{font-size:9.5px}.local-month-head span{display:block;font-size:7px;color:#777f8d;margin-top:3px}.local-month-actions{display:flex;gap:7px;flex-wrap:wrap}.local-month-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:9px;max-height:560px;overflow:auto;padding-right:2px}.local-day{padding:9px;border:1px solid #ece8f7;border-radius:9px;background:#fff;min-height:122px}.local-day em{display:block;font-style:normal;font-size:6.5px;color:#777f8d;text-transform:uppercase;font-weight:900}.local-day strong{display:block;font-size:8.5px;line-height:1.35;margin-top:4px}.local-day small{display:block;font-size:6.8px;color:#777f8d;line-height:1.4;margin-top:4px}.local-day .local-type{display:inline-flex;margin-top:6px;padding:3px 5px;border-radius:999px;background:#f1edff;color:#644fd1;font-size:6.2px;font-weight:900}.local-copy{margin-top:6px;padding-top:6px;border-top:1px dashed #ece8f7}.local-copy b{display:block;font-size:6.8px}.local-copy span{display:block;font-size:6.5px;color:#656b78;line-height:1.35;margin-top:2px}.local-month-note{font-size:7px;color:#777f8d;line-height:1.45;margin-top:8px}@media(max-width:1100px){.local-month-grid{grid-template-columns:repeat(4,1fr)}}@media(max-width:800px){.local-month-grid{grid-template-columns:1fr 1fr}}@media(max-width:440px){.local-month-grid{grid-template-columns:1fr}}
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
  document.addEventListener('DOMContentLoaded',()=>{
    const root=q('#content');if(root)new MutationObserver(()=>setTimeout(render,60)).observe(root,{childList:true,subtree:true});
    document.addEventListener('aii:social-changed',()=>setTimeout(()=>{build();render()},80));
    setTimeout(render,450);
  });
  window.AIILocalMonthPlanner={build,getPlan,schedule,refresh:render};
  window.AIILocalWeekPlanner={build:()=>getPlan().slice(0,7),getPlan:()=>getPlan().slice(0,7),schedule,refresh:render};
})();