(() => {
  const SEED_KEY='aii-content-seed';
  const CONSUMED_KEY='aii-content-seed-consumed';
  const IMAGE_SEED_KEY='aii-image-content-seed';
  const IMAGE_CONSUMED_KEY='aii-image-content-seed-consumed';
  const PLAN_KEY='aii-niche-content-plan';
  const MONTH_KEY='aii-niche-month-plan';
  const RECOMMENDATIONS_KEY='aii-social-local-recommendations';
  const SOCIAL_QUEUE_KEY='aii-social-queue';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const toast=t=>window.showToast?window.showToast(t):alert(t);

  function hashtags(niche,title){
    const words=(niche+' '+title).toLowerCase().replace(/[^a-ząćęłńóśźż0-9 ]/gi,' ').split(/\s+/).filter(x=>x.length>3);
    const norm=s=>s.replace(/[ąćęłńóśźż]/g,c=>({'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z'}[c]||c));
    return [...new Set(words.map(norm).map(x=>'#'+x)), '#reels', '#inspiracja', '#porady'].slice(0,5).join(' ');
  }

  function makePackage(seed,type){
    const niche=seed.niche||'wybrana nisza';
    const title=seed.title||'Nowy pomysł na treść';
    const brief=seed.brief||'';
    const hook=type==='reels'
      ? `Jeśli interesuje Cię ${niche}, tego błędu lepiej nie popełniać.`
      : `${title} — konkretnie, bez lania wody.`;
    const cta=type==='reels'
      ? 'Zapisz ten materiał i napisz w komentarzu, czy chcesz część 2.'
      : 'Zapisz post na później i daj znać, który punkt mam rozwinąć.';
    return {hook,cta,hashtags:hashtags(niche,title),details:`Nisza: ${niche}. Pomysł: ${title}. Brief: ${brief}. Hook: ${hook}. CTA: ${cta}. Hashtagi: ${hashtags(niche,title)}`};
  }

  function seedId(seed){return String(seed.createdAt||'')+'|'+String(seed.title||'')+'|'+String(seed.niche||'')}

  function fillPost(seed){
    const topic=document.getElementById('ppTopic');
    if(!topic)return false;
    const pack=makePackage(seed,'post');
    topic.value=`${seed.title} — ${seed.niche}`;
    const details=document.getElementById('ppDetails');
    if(details)details.value=pack.details;
    const type=document.getElementById('ppType');
    if(type){
      const preferred=[...type.options].find(o=>/informacyjny|edukacyjny/i.test(o.text));
      if(preferred){type.value=preferred.value;type.dispatchEvent(new Event('change',{bubbles:true}));}
    }
    const tone=document.getElementById('ppTone');if(tone&&[...tone.options].some(o=>o.value==='Ekspercki'))tone.value='Ekspercki';
    const goal=document.getElementById('ppGoal');if(goal&&[...goal.options].some(o=>o.value==='Informacyjny'))goal.value='Informacyjny';
    document.getElementById('ppGenerate')?.click();
    toast(seed.source==='performance-radar'?'Rekomendacja Performance Radar została wypełniona w poście':'Pomysł z Generatora nisz został wypełniony w poście');
    return true;
  }

  function fillReels(seed){
    const topic=document.getElementById('rpTopic');
    if(!topic)return false;
    const pack=makePackage(seed,'reels');
    topic.value=`${seed.title} — ${seed.niche}`;
    const claims=document.getElementById('rpClaims');if(claims)claims.value=pack.details;
    const len=document.getElementById('rpLen');if(len&&[...len.options].some(o=>o.value==='30 s'))len.value='30 s';
    const goal=document.getElementById('rpGoal');if(goal&&[...goal.options].some(o=>o.value==='Zaangażowanie'))goal.value='Zaangażowanie';
    const style=document.getElementById('rpStyle');if(style&&[...style.options].some(o=>o.value==='UGC natural'))style.value='UGC natural';
    document.getElementById('rpBuild')?.click();
    toast(seed.source==='performance-radar'?'Rekomendacja Performance Radar została wypełniona w Reels':'Pomysł z Generatora nisz został wypełniony w Reels');
    return true;
  }

  function imageDetails(seed){
    const niche=seed.niche||'wybrana nisza';
    const title=seed.title||'materiał social media';
    const brief=seed.brief||seed.notes||'';
    const pillar=seed.pillar?` Filar treści: ${seed.pillar}.`:'';
    return `Stwórz profesjonalny, fotorealistyczny kadr do treści social media. Temat: ${title}. Nisza: ${niche}.${pillar} ${brief} Zachowaj spójność z Avatar DNA, naturalną anatomię i dłonie, realistyczne światło, naturalną teksturę skóry, bez napisów i bez znaku wodnego.`;
  }

  function fillImage(seed){
    const prompt=document.getElementById('gPhotoPrompt');
    if(!prompt)return false;
    const title=seed.title||'Profesjonalna treść social media';
    const niche=seed.niche||'wybrana nisza';
    const brief=seed.brief||seed.notes||'';
    prompt.value=`${title}. Wizualna interpretacja dla niszy: ${niche}.`;
    const details=document.getElementById('gPhotoDetails');
    if(details)details.value=imageDetails(seed);
    const format=document.getElementById('gPhotoFormat');
    const vertical=/reels|shorts|story|9:16|vertical/i.test(`${seed.type||''} ${title} ${brief}`);
    if(format){
      const wanted=vertical?'9:16':'4:5';
      const option=[...format.options].find(o=>o.value===wanted||o.text.includes(wanted));
      if(option)format.value=option.value;
    }
    prompt.dispatchEvent(new Event('input',{bubbles:true}));
    details?.dispatchEvent(new Event('input',{bubbles:true}));
    toast('Prompt zdjęcia przygotowany z planu niszy');
    return true;
  }

  function openImage(seed){
    const payload={...seed,createdAt:seed.createdAt||Date.now()};
    save(IMAGE_SEED_KEY,payload);
    const nav=document.querySelector('.nav-item[data-view="images"]')||document.querySelector('.nav-item[data-view="image-generator"]');
    if(nav)nav.click();
    [30,120,350,700].forEach(ms=>setTimeout(tryConsumeImage,ms));
  }

  function tryConsumeImage(){
    const seed=read(IMAGE_SEED_KEY,null);if(!seed)return;
    const id=seedId(seed);if(read(IMAGE_CONSUMED_KEY,'')===id)return;
    if(fillImage(seed))save(IMAGE_CONSUMED_KEY,id);
  }

  function enhanceImageButtons(){
    const plan=read(PLAN_KEY,null);
    document.querySelectorAll('.ncp-idea').forEach((card,i)=>{
      if(card.querySelector('[data-ncp-image]'))return;
      const idea=plan?.ideas?.[i];if(!idea)return;
      const btn=document.createElement('button');
      btn.type='button';btn.className='ncp-btn';btn.dataset.ncpImage=String(i);btn.textContent='Zdjęcie AI';
      btn.style.cssText='margin-left:6px;white-space:nowrap;background:linear-gradient(90deg,#2ccedc,#765fff,#d95aaf);color:#fff;border:0;border-radius:8px;padding:7px 9px;font-size:8px;font-weight:900;cursor:pointer';
      btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openImage({niche:plan.niche,title:idea[0],brief:idea[1],createdAt:Date.now()});});
      card.appendChild(btn);
    });

    const month=read(MONTH_KEY,null);
    document.querySelectorAll('.nmp-day').forEach((card,i)=>{
      if(card.querySelector('[data-nmp-image]'))return;
      const item=month?.items?.[i];if(!item)return;
      const btn=document.createElement('button');
      btn.type='button';btn.dataset.nmpImage=String(i);btn.textContent='Zdjęcie AI';
      btn.style.cssText='display:block;margin-top:7px;background:#182844;color:#dffcff;border:1px solid #315079;border-radius:7px;padding:6px 8px;font-size:8px;font-weight:900;cursor:pointer';
      btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openImage({niche:item.niche,title:item.title,brief:item.notes,type:item.type,pillar:item.pillar,createdAt:Date.now()});});
      card.appendChild(btn);
    });
  }

  function formatDate(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function nextDate(){const d=new Date();d.setDate(d.getDate()+1);return formatDate(d);}
  const DAY_NAMES=['niedziela','poniedziałek','wtorek','środa','czwartek','piątek','sobota'];

  function publishedPerformance(format){
    const all=read(SOCIAL_QUEUE_KEY,[]).filter(x=>String(x.status||'').toLowerCase()==='opublikowany'&&x.date&&(x.likes!=null||x.comments!=null));
    const same=all.filter(x=>String(x.type||'').toLowerCase()===String(format||'').toLowerCase());
    return same.length>=2?same:all;
  }

  function bestPublishingSlot(format='Post',fallbackHour='18:00'){
    const items=publishedPerformance(format);
    const dayGroups={},hourGroups={};
    items.forEach(x=>{
      const d=new Date(`${x.date}T12:00:00`);if(Number.isNaN(d.getTime()))return;
      const score=(Number(x.likes)||0)+4*(Number(x.comments)||0);
      const wd=d.getDay();
      const dg=dayGroups[wd]||(dayGroups[wd]={day:wd,total:0,count:0});dg.total+=score;dg.count++;
      const h=Number(String(x.time||'').slice(0,2));
      if(Number.isFinite(h)&&h>=0&&h<=23){const hg=hourGroups[h]||(hourGroups[h]={hour:h,total:0,count:0});hg.total+=score;hg.count++;}
    });
    const bestDay=Object.values(dayGroups).map(x=>({...x,avg:x.total/x.count})).sort((a,b)=>b.avg-a.avg||b.count-a.count)[0]||null;
    const bestHour=Object.values(hourGroups).map(x=>({...x,avg:x.total/x.count})).sort((a,b)=>b.avg-a.avg||b.count-a.count)[0]||null;
    const recHour=String(fallbackHour||'18:00').match(/^([01]\d|2[0-3]):[0-5]\d$/)?fallbackHour:'18:00';
    const time=bestHour?`${String(bestHour.hour).padStart(2,'0')}:00`:recHour;
    const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+1);
    if(bestDay){let delta=(bestDay.day-d.getDay()+7)%7;if(delta===0)delta=0;d.setDate(d.getDate()+delta);}
    return {date:formatDate(d),time,weekday:DAY_NAMES[d.getDay()],sampleSize:items.length,dayEvidence:bestDay?.count||0,hourEvidence:bestHour?.count||0,source:(bestDay||bestHour)?'performance':'fallback'};
  }

  function recommendationParts(r){
    const formatText=String(r?.format?.title||'Post');
    const isReels=/reels|shorts|story/i.test(formatText);
    const format=isReels?'Reels':(/carousel/i.test(formatText)?'Carousel':'Post');
    const topicText=String(r?.topic?.title||'').replace(/^Rozwijaj temat:\s*/i,'').trim();
    const topic=/^(brak|zbierz)/i.test(topicText)||!topicText?'sprawdzony temat':topicText;
    const hourMatch=String(r?.hour?.title||'').match(/([01]?\d|2[0-3]):00/);
    const hour=hourMatch?`${String(hourMatch[1]).padStart(2,'0')}:00`:'18:00';
    const cta=String(r?.cta?.title||'').trim();
    return {format,isReels,topic,hour,cta};
  }

  function addRecommendationToCalendar(seed,parts,r){
    const arr=read(SOCIAL_QUEUE_KEY,[]);
    const createdAt=Date.now();
    const slot=bestPublishingSlot(parts.format,parts.hour);
    arr.unshift({
      id:createdAt,
      sourceId:`performance-radar-${createdAt}`,
      title:`Test Performance Radar — ${parts.topic}`,
      platform:'Instagram',
      type:parts.format,
      date:slot.date,
      time:slot.time,
      status:'Zaplanowany',
      notes:`Rekomendacja lokalna. Termin: ${slot.weekday} ${slot.date}, ${slot.time}. ${r?.summary||''}${parts.cta?` CTA: ${parts.cta}.`:''}`,
      source:'Performance Radar',
      createdAt,
      updatedAt:createdAt
    });
    save(SOCIAL_QUEUE_KEY,arr);
    document.dispatchEvent(new CustomEvent('aii:social-changed',{detail:{count:arr.length,source:'performance-radar'}}));
    return slot;
  }

  function createFromRecommendation(){
    const r=read(RECOMMENDATIONS_KEY,null);
    if(!r){toast('Najpierw odśwież Performance Radar, aby utworzyć rekomendację');return false;}
    const parts=recommendationParts(r);
    const slot=bestPublishingSlot(parts.format,parts.hour);
    const seed={
      source:'performance-radar',
      niche:'na podstawie danych Performance Radar',
      title:parts.topic,
      brief:`Format: ${parts.format}. Najlepszy termin: ${slot.weekday} ${slot.date}, ${slot.time}. ${r.summary||''}${parts.cta?` CTA: ${parts.cta}.`:''}`,
      type:parts.format,
      recommendedHour:slot.time,
      recommendedDate:slot.date,
      createdAt:Date.now()
    };
    save(SEED_KEY,seed);
    localStorage.removeItem(CONSUMED_KEY);
    addRecommendationToCalendar(seed,parts,r);
    const nav=document.querySelector(`.nav-item[data-view="${parts.isReels?'reels':'posts'}"]`)||document.querySelector(`.nav-item[data-view="${parts.isReels?'reels-generator':'posts'}"]`);
    if(nav)nav.click();
    [40,140,350,700].forEach(ms=>setTimeout(tryConsume,ms));
    toast(`Zaplanowano ${parts.format}: ${slot.weekday} ${slot.date} o ${slot.time}`);
    return true;
  }

  function addGeneratedAtBestSlot(kind){
    const isReels=kind==='Reels';
    const title=(isReels?document.getElementById('rpTopic'):document.getElementById('ppTopic'))?.value?.trim()||kind;
    const text=(isReels?document.getElementById('rpCaption'):document.getElementById('ppOut'))?.textContent?.trim()||'';
    const r=read(RECOMMENDATIONS_KEY,null),parts=recommendationParts(r||{});
    const slot=bestPublishingSlot(kind,parts.hour||'18:00');
    const arr=read(SOCIAL_QUEUE_KEY,[]),now=Date.now();
    arr.unshift({id:now,sourceId:`best-slot-${kind.toLowerCase()}-${now}`,title,platform:'Instagram',type:kind,date:slot.date,time:slot.time,status:'Zaplanowany',notes:`Automatycznie wybrany najlepszy termin: ${slot.weekday} ${slot.date}, ${slot.time}. ${text}`,source:'Best Publishing Slot',createdAt:now,updatedAt:now});
    save(SOCIAL_QUEUE_KEY,arr);
    document.dispatchEvent(new CustomEvent('aii:social-changed',{detail:{count:arr.length,source:'best-slot'}}));
    toast(`Dodano do kalendarza: ${slot.weekday} ${slot.date} o ${slot.time}`);
    return slot;
  }

  function enhanceRecommendationButton(){
    const summary=document.querySelector('.social-local-summary');
    if(!summary||document.getElementById('performanceCreateContent'))return;
    const actions=document.createElement('div');
    actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:9px';
    actions.innerHTML='<button type="button" class="primary" id="performanceCreateContent">＋ Utwórz treść z tej rekomendacji</button>';
    summary.insertAdjacentElement('afterend',actions);
    document.getElementById('performanceCreateContent')?.addEventListener('click',createFromRecommendation);
  }

  function enhanceBestSlotButtons(){
    const postActions=document.querySelector('.post-pro-actions');
    if(postActions&&!document.getElementById('postBestSlotBtn')){
      const b=document.createElement('button');b.type='button';b.className='ghost';b.id='postBestSlotBtn';b.textContent='◷ Zaplanuj najlepszy termin';b.addEventListener('click',()=>addGeneratedAtBestSlot('Post'));postActions.appendChild(b);
    }
    const reelsActions=[...document.querySelectorAll('.rp-actions')].pop();
    if(reelsActions&&!document.getElementById('reelsBestSlotBtn')){
      const b=document.createElement('button');b.type='button';b.className='ghost';b.id='reelsBestSlotBtn';b.textContent='◷ Zaplanuj najlepszy termin';b.addEventListener('click',()=>addGeneratedAtBestSlot('Reels'));reelsActions.appendChild(b);
    }
  }

  function tryConsume(){
    const seed=read(SEED_KEY,null);if(!seed)return;
    const id=seedId(seed);if(read(CONSUMED_KEY,'')===id)return;
    const lastView=localStorage.getItem('aii-last-view');
    let ok=false;
    if(lastView==='posts' || document.getElementById('ppTopic')) ok=fillPost(seed);
    else if(lastView==='reels' || lastView==='reels-generator' || document.getElementById('rpTopic')) ok=fillReels(seed);
    if(ok)save(CONSUMED_KEY,id);
  }

  function refresh(){
    tryConsume();
    tryConsumeImage();
    enhanceImageButtons();
    enhanceRecommendationButton();
    enhanceBestSlotButtons();
  }

  document.addEventListener('DOMContentLoaded',()=>{
    refresh();
    const root=document.getElementById('content');
    if(root)new MutationObserver(()=>setTimeout(refresh,20)).observe(root,{childList:true,subtree:true});
  });
  document.addEventListener('click',()=>setTimeout(refresh,40));
  document.addEventListener('aii:social-changed',()=>setTimeout(refresh,50));
  window.AIIContentSeedHandoff={tryConsume,tryConsumeImage,makePackage,openImage,fillImage,createFromRecommendation,bestPublishingSlot,addGeneratedAtBestSlot};
})();
