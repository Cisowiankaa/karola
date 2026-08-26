(() => {
  const q=s=>document.querySelector(s);
  const content=()=>document.getElementById('content');
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const toast=t=>window.showToast?window.showToast(t):alert(t);
  const setHead=(title,sub)=>{const a=q('#pageTitle'),b=q('#pageSubtitle');if(a)a.textContent=title;if(b)b.textContent=sub};
  const SOCIAL_KEY='aii-social-queue';
  const RECOMMENDATIONS_KEY='aii-social-local-recommendations';
  let cursor=new Date(); cursor.setDate(1); cursor.setHours(0,0,0,0);

  const style=document.createElement('style');
  style.textContent=`
    .cal-pro{display:grid;gap:14px}.cal-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.cal-nav{display:flex;gap:8px;align-items:center}.cal-title{font-size:20px;font-weight:900;color:#242833;min-width:190px;text-align:center}.cal-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.cal-kpi{background:#fff;border:1px solid #e7e9f1;border-radius:14px;padding:13px}.cal-kpi b{display:block;font-size:19px}.cal-kpi span{font-size:8px;color:#7b8290}.cal-card{background:#fff;border:1px solid #e7e9f1;border-radius:16px;padding:14px}.cal-week{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:6px}.cal-week div{font-size:8px;font-weight:900;color:#7b8290;text-align:center;padding:6px}.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}.cal-day{min-height:128px;border:1px solid #eceef5;border-radius:12px;padding:8px;background:#fbfbfd;overflow:hidden;cursor:pointer;transition:.16s}.cal-day:hover{border-color:#8f77ef;background:#faf8ff}.cal-day.out{opacity:.42}.cal-day.today{border-color:#8f77ef;box-shadow:0 0 0 1px #8f77ef inset}.cal-day-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px}.cal-num{font-size:10px;font-weight:900}.cal-count{font-size:7px;color:#7b8290}.cal-plus{font-size:7px;color:#7655e8;font-weight:900}.cal-event{display:block;width:100%;border:0;border-radius:8px;padding:7px;margin:0 0 5px;text-align:left;cursor:pointer;background:#f1edff;color:#4d3a9d;font-size:7px;line-height:1.25}.cal-event b{display:block;font-size:8px;color:#27223b;margin-bottom:2px}.cal-event.published{background:#edf8f1;color:#287a4b}.cal-event.draft{background:#f3f4f7;color:#626977}.cal-event.ready{background:#eef4ff;color:#315fa8}.cal-event.overdue{box-shadow:0 0 0 1px #c55 inset}.cal-list{display:grid;gap:8px;margin-top:12px}.cal-list-row{display:grid;grid-template-columns:.7fr 1.4fr 1fr .8fr auto;gap:8px;align-items:center;padding:10px;border:1px solid #eceef5;border-radius:11px;background:#fafafe;font-size:8px}.cal-list-row small{display:block;color:#7b8290}.cal-empty{padding:24px;text-align:center;color:#7b8290;font-size:9px}.cal-editor{display:grid;grid-template-columns:1.3fr .85fr .8fr .8fr .85fr auto;gap:8px;align-items:end}.cal-editor label{display:grid;gap:5px;font-size:8px;font-weight:800;color:#717887}.cal-editor input,.cal-editor select{width:100%;box-sizing:border-box;border:1px solid #dfe2eb;border-radius:9px;padding:9px;background:#fbfbfd}.cal-hint{font-size:8px;color:#7b8290;margin-top:7px}.cal-slot-live{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:9px;padding:9px 10px;border:1px solid #eceef5;border-radius:10px;background:#fafafe;font-size:8px}.cal-slot-badge{display:inline-flex;padding:4px 7px;border-radius:999px;font-size:7px;font-weight:900;white-space:nowrap}.cal-slot-badge.best{background:#e9f8ef;color:#247447}.cal-slot-badge.good{background:#eef4ff;color:#315fa8}.cal-slot-badge.weak{background:#fff0f0;color:#a13f3f}.cal-slot-badge.learn{background:#f3f4f7;color:#6f7682}.cal-event .cal-slot-badge{margin-top:4px;padding:3px 5px;font-size:6px}.cal-list-row .cal-slot-badge{margin-top:4px}.cal-slot-warning{color:#a13f3f;font-weight:800}@media(max-width:950px){.cal-kpis{grid-template-columns:1fr 1fr}.cal-grid{grid-template-columns:1fr 1fr}.cal-week{display:none}.cal-list-row,.cal-editor{grid-template-columns:1fr}.cal-day{min-height:110px}}`;
  document.head.appendChild(style);

  const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const monthLabel=d=>d.toLocaleDateString('pl-PL',{month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase());
  const statusClass=s=>s==='Opublikowany'?'published':s==='Szkic'?'draft':s==='Gotowy'?'ready':'';
  const saveItem=item=>{const arr=read(SOCIAL_KEY,[]);arr.push(item);save(SOCIAL_KEY,arr);document.dispatchEvent(new CustomEvent('aii:social-changed',{detail:{count:arr.length}}));};
  const metric=x=>(Number(x?.likes)||0)+((Number(x?.comments)||0)*4);
  const hourOf=t=>{const h=Number(String(t||'').slice(0,2));return Number.isFinite(h)&&h>=0&&h<=23?h:null};
  const dowOf=date=>{const d=new Date(`${date}T12:00:00`);return Number.isNaN(d.getTime())?null:d.getDay()};

  function publishedPerformance(){
    return read(SOCIAL_KEY,[]).filter(x=>String(x.status||'').toLowerCase()==='opublikowany'&&x.date&&hourOf(x.time)!=null&&(x.likes!=null||x.comments!=null)).map(x=>({...x,_score:metric(x),_dow:dowOf(x.date),_hour:hourOf(x.time)}));
  }
  function avg(list){return list.length?list.reduce((a,x)=>a+Number(x||0),0)/list.length:null}
  function recommendedHour(){
    const r=read(RECOMMENDATIONS_KEY,null),m=String(r?.hour?.title||'').match(/([01]?\d|2[0-3]):00/);
    return m?Number(m[1]):null;
  }
  function slotQuality(date,time){
    const items=publishedPerformance(),dow=dowOf(date),hour=hourOf(time);
    if(items.length<3||dow==null||hour==null){
      const rh=recommendedHour();
      const hint=rh!=null?`Za mało historii. Lokalna rekomendacja wskazuje około ${String(rh).padStart(2,'0')}:00.`:'Za mało historii, aby wiarygodnie ocenić termin.';
      return {level:'learn',label:'UCZĘ SIĘ',detail:hint,score:null,sample:items.length};
    }
    const global=avg(items.map(x=>x._score))||0;
    const exact=items.filter(x=>x._dow===dow&&x._hour===hour);
    const sameHour=items.filter(x=>x._hour===hour);
    const sameDay=items.filter(x=>x._dow===dow);
    let estimated=null,sample=0,source='';
    if(exact.length){estimated=avg(exact.map(x=>x._score));sample=exact.length;source='dokładny dzień i godzina';}
    else if(sameHour.length&&sameDay.length){estimated=(avg(sameHour.map(x=>x._score))*0.6)+(avg(sameDay.map(x=>x._score))*0.4);sample=Math.min(sameHour.length+sameDay.length,items.length);source='podobne dni i godziny';}
    else if(sameHour.length){estimated=avg(sameHour.map(x=>x._score));sample=sameHour.length;source='ta sama godzina';}
    else if(sameDay.length){estimated=avg(sameDay.map(x=>x._score));sample=sameDay.length;source='ten sam dzień tygodnia';}
    if(estimated==null){return {level:'learn',label:'UCZĘ SIĘ',detail:'Brak podobnych historycznych terminów.',score:null,sample:items.length};}
    const ratio=global>0?estimated/global:1;
    if(ratio>=1.15)return {level:'best',label:'NAJLEPSZY TERMIN',detail:`Historycznie wypada około ${Math.round((ratio-1)*100)}% powyżej średniej • ${source}.`,score:estimated,sample};
    if(ratio>=0.85)return {level:'good',label:'DOBRY TERMIN',detail:`Historycznie wypada blisko średniej • ${source}.`,score:estimated,sample};
    return {level:'weak',label:'SŁABY TERMIN',detail:`Historycznie wypada około ${Math.round((1-ratio)*100)}% poniżej średniej • ${source}.`,score:estimated,sample};
  }
  const slotBadge=s=>`<span class="cal-slot-badge ${s.level}">${esc(s.label)}</span>`;

  function render(){
    setHead('Kalendarz publikacji','Kliknij dzień lub wpisz publikację bezpośrednio w kalendarzu.');
    const items=read(SOCIAL_KEY,[]).filter(x=>x.date);
    const y=cursor.getFullYear(),m=cursor.getMonth();
    const monthItems=items.filter(x=>{const d=new Date(x.date+'T00:00:00');return d.getFullYear()===y&&d.getMonth()===m});
    const now=new Date(); now.setHours(0,0,0,0);
    const scheduled=monthItems.filter(x=>x.status==='Zaplanowany').length;
    const ready=monthItems.filter(x=>x.status==='Gotowy').length;
    const published=monthItems.filter(x=>x.status==='Opublikowany').length;
    const overdue=monthItems.filter(x=>x.status!=='Opublikowany'&&new Date(x.date+'T00:00:00')<now).length;
    const first=new Date(y,m,1);const mondayIndex=(first.getDay()+6)%7;const start=new Date(y,m,1-mondayIndex);const cells=[];
    for(let i=0;i<42;i++){
      const d=new Date(start);d.setDate(start.getDate()+i);const key=iso(d);const dayItems=items.filter(x=>x.date===key).sort((a,b)=>(a.time||'').localeCompare(b.time||''));const out=d.getMonth()!==m,today=key===iso(now);
      cells.push(`<div class="cal-day ${out?'out':''} ${today?'today':''}" data-cal-date="${key}"><div class="cal-day-head"><span class="cal-num">${d.getDate()}</span><span class="cal-plus">+ dodaj</span></div>${dayItems.slice(0,4).map(x=>{const late=x.status!=='Opublikowany'&&new Date(x.date+'T00:00:00')<now;const slot=slotQuality(x.date,x.time);return `<button class="cal-event ${statusClass(x.status)} ${late?'overdue':''}" data-cal-id="${x.id}"><b>${esc(x.time||'')} ${esc(x.title)}</b>${esc(x.platform)} • ${esc(x.type)}<br>${esc(x.status)}<br>${slotBadge(slot)}</button>`}).join('')}${dayItems.length>4?`<div class="cal-count">+ ${dayItems.length-4} więcej</div>`:''}</div>`);
    }
    const upcoming=items.filter(x=>new Date(x.date+'T23:59:59')>=now).sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||''))).slice(0,10);
    content().innerHTML=`<section class="creator-tool-hero"><div><div class="eyebrow">CONTENT CALENDAR</div><h2>Kalendarz publikacji</h2><p>Dodawaj treści tutaj lub w Social Media Studio — oba widoki są zsynchronizowane.</p></div><span class="tag">EDYCJA AKTYWNA</span></section><section class="cal-pro"><div class="cal-card"><h3>Szybkie dodawanie publikacji</h3><div class="cal-editor"><label>Tytuł<input id="calNewTitle" placeholder="Np. Reels – test serum"></label><label>Data<input id="calNewDate" type="date" value="${iso(new Date())}"></label><label>Godzina<input id="calNewTime" type="time" value="18:00"></label><label>Platforma<select id="calNewPlatform"><option>Instagram</option><option>TikTok</option><option>Facebook</option><option>YouTube</option></select></label><label>Status<select id="calNewStatus"><option>Zaplanowany</option><option>Gotowy</option><option>Szkic</option><option>Opublikowany</option></select></label><button class="primary" id="calAdd">+ Dodaj</button></div><div class="cal-slot-live" id="calSlotLive"></div><div class="cal-hint">Ocena terminu jest liczona lokalnie z wyników wcześniejszych publikacji. Słaby termin nie blokuje zapisu.</div></div><div class="cal-toolbar"><div class="cal-nav"><button class="ghost" id="calPrev">←</button><div class="cal-title">${monthLabel(cursor)}</div><button class="ghost" id="calNext">→</button></div><button class="primary" id="calToday">Dzisiaj</button></div><div class="cal-kpis"><div class="cal-kpi"><b>${scheduled}</b><span>zaplanowane</span></div><div class="cal-kpi"><b>${ready}</b><span>gotowe</span></div><div class="cal-kpi"><b>${published}</b><span>opublikowane</span></div><div class="cal-kpi"><b>${overdue}</b><span>po terminie</span></div></div><div class="cal-card"><div class="cal-week"><div>Pon</div><div>Wt</div><div>Śr</div><div>Czw</div><div>Pt</div><div>Sob</div><div>Nd</div></div><div class="cal-grid">${cells.join('')}</div></div><div class="cal-card"><h3>Najbliższe publikacje</h3><div class="cal-list">${upcoming.length?upcoming.map(x=>{const slot=slotQuality(x.date,x.time);return `<div class="cal-list-row"><div><b>${esc(x.date)}</b><small>${esc(x.time||'')}</small>${slotBadge(slot)}</div><div><b>${esc(x.title)}</b><small>${esc(x.type||'Post')}</small></div><div>${esc(x.platform)}</div><div><span class="social-badge">${esc(x.status)}</span></div><button class="ghost" data-cal-open-social="1">Otwórz Social Media</button></div>`}).join(''):'<div class="cal-empty">Brak zaplanowanych publikacji.</div>'}</div></div></section>`;
    const updateSlotLive=()=>{const box=q('#calSlotLive');if(!box)return;const slot=slotQuality(q('#calNewDate')?.value,q('#calNewTime')?.value);box.innerHTML=`${slotBadge(slot)}<span class="${slot.level==='weak'?'cal-slot-warning':''}">${esc(slot.detail)}</span>`;};
    q('#calPrev').onclick=()=>{cursor.setMonth(cursor.getMonth()-1);render()};q('#calNext').onclick=()=>{cursor.setMonth(cursor.getMonth()+1);render()};q('#calToday').onclick=()=>{cursor=new Date();cursor.setDate(1);render()};
    q('#calNewDate')?.addEventListener('change',updateSlotLive);q('#calNewTime')?.addEventListener('change',updateSlotLive);updateSlotLive();
    q('#calAdd').onclick=()=>{const title=q('#calNewTitle').value.trim();const date=q('#calNewDate').value;if(!title){toast('Wpisz tytuł publikacji');q('#calNewTitle').focus();return}if(!date){toast('Wybierz datę');return}const slot=slotQuality(date,q('#calNewTime').value);saveItem({id:Date.now(),title,platform:q('#calNewPlatform').value,type:'Post',date,time:q('#calNewTime').value,status:q('#calNewStatus').value,notes:'Dodano z kalendarza',slotQuality:slot.level,createdAt:Date.now()});toast(slot.level==='weak'?'Zapisano, ale to historycznie słaby termin — rozważ zmianę godziny':'Publikacja dodana do kalendarza');render()};
    document.querySelectorAll('[data-cal-date]').forEach(day=>day.onclick=e=>{if(e.target.closest('[data-cal-id]'))return;q('#calNewDate').value=day.dataset.calDate;q('#calNewDate').dispatchEvent(new Event('change',{bubbles:true}));q('#calNewTitle').focus();day.scrollIntoView({block:'center',behavior:'smooth'});});
    document.querySelectorAll('[data-cal-open-social]').forEach(b=>b.onclick=()=>document.querySelector('.nav-item[data-view="social"]')?.click());document.querySelectorAll('[data-cal-id]').forEach(b=>b.onclick=e=>{e.stopPropagation();document.querySelector('.nav-item[data-view="social"]')?.click()});
  }
  function bind(){document.querySelectorAll('.nav-item[data-view="calendar"]').forEach(a=>{if(a.dataset.calendarProBound)return;a.dataset.calendarProBound='1';a.addEventListener('click',()=>setTimeout(()=>{render();localStorage.setItem('aii-last-view','calendar')},25));});}
  document.addEventListener('aii:social-changed',()=>{if(localStorage.getItem('aii-last-view')==='calendar')render()});window.addEventListener('storage',e=>{if(e.key===SOCIAL_KEY&&localStorage.getItem('aii-last-view')==='calendar')render()});document.addEventListener('DOMContentLoaded',()=>{bind();if(localStorage.getItem('aii-last-view')==='calendar')setTimeout(render,100);const nav=document.querySelector('.nav');if(nav)new MutationObserver(bind).observe(nav,{childList:true,subtree:true});});
  window.AIICalendarPerformance={slotQuality};
})();