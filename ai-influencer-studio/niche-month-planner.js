(() => {
  const PLAN_KEY='aii-niche-content-plan';
  const SOCIAL_KEY='aii-social-queue';
  const MONTH_KEY='aii-niche-month-plan';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const toast=t=>window.showToast?window.showToast(t):alert(t);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
  const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  const STYLE_ID='niche-month-planner-style';
  if(!document.getElementById(STYLE_ID)){
    const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`
      .nmp-btn{border:0!important;background:linear-gradient(90deg,#35d9ed,#776dff,#e45aac)!important;color:#fff!important}
      .nmp-preview{margin-top:12px;border:1px solid #2d3a54;border-radius:13px;background:#0c1524;padding:12px;display:grid;gap:8px}
      .nmp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:7px}
      .nmp-day{border:1px solid #27354c;border-radius:9px;padding:8px;background:#111b2c;font-size:8px;line-height:1.45;color:#aeb9cc}
      .nmp-day b{display:block;color:#fff;margin-bottom:3px}.nmp-day em{font-style:normal;color:#75e7ef;font-weight:800}
    `;document.head.appendChild(style);
  }

  function buildMonthlyIdeas(plan){
    const source=(plan?.ideas||[]).length?plan.ideas:[[plan?.niche||'Wybrana nisza','Praktyczny materiał edukacyjny']];
    const pillars=plan?.pillars||['Edukacja','Testy i opinie','Lifestyle','Checklisty'];
    const variants=['wersja praktyczna','najczęstszy błąd','szybki poradnik','porównanie','checklista','mini-case study'];
    return Array.from({length:30},(_,i)=>{
      const base=source[i%source.length];
      return {title:i<source.length?base[0]:`${base[0]} — ${variants[Math.floor(i/source.length)%variants.length]}`,brief:`${base[1]||''} • Filar: ${pillars[i%pillars.length]}`,pillar:pillars[i%pillars.length]};
    });
  }

  function scheduleMonth(plan){
    if(!plan?.niche){toast('Najpierw wybierz niszę');return;}
    const queue=read(SOCIAL_KEY,[]);
    const start=new Date();start.setHours(0,0,0,0);
    const platforms=['Instagram','Instagram','TikTok','Instagram','Facebook','Instagram','TikTok'];
    const types=['Reels','Post','Reels','Karuzela','Post','Reels','Post'];
    const times=['18:00','19:00','18:30','19:00','12:00','11:00','19:30'];
    const ideas=buildMonthlyIdeas(plan);
    const items=ideas.map((idea,i)=>{
      const d=new Date(start);d.setDate(start.getDate()+i);
      const id=`niche-month-${(plan.createdAt||'plan').replace(/[^a-z0-9]/gi,'')}-${i}`;
      const item={id,title:idea.title,platform:platforms[i%7],type:types[i%7],date:iso(d),time:times[i%7],status:'Zaplanowany',notes:`Nisza: ${plan.niche}\n${idea.brief}`,source:'niche-month-plan',niche:plan.niche,pillar:idea.pillar,createdAt:Date.now()+i};
      const pos=queue.findIndex(x=>String(x.id)===id);if(pos>=0)queue[pos]=item;else queue.push(item);return item;
    });
    save(SOCIAL_KEY,queue);save(MONTH_KEY,{niche:plan.niche,createdAt:new Date().toISOString(),items});
    document.dispatchEvent(new CustomEvent('aii:social-changed',{detail:{count:queue.length}}));
    renderPreview();toast('Zaplanowano 30 dni contentu w kalendarzu');
  }

  function renderPreview(){
    const panel=document.getElementById('ncpPanel');if(!panel)return;
    let host=document.getElementById('nmpPreview');
    const month=read(MONTH_KEY,null);
    if(!month?.items?.length){host?.remove();return;}
    if(!host){host=document.createElement('div');host.id='nmpPreview';host.className='nmp-preview';panel.appendChild(host);}
    const sample=month.items.slice(0,10);
    host.innerHTML=`<div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><div><b style="font-size:10px">Plan miesiąca</b><div style="font-size:8px;color:#91a0b7">30 publikacji • ${esc(month.niche)}</div></div><button id="nmpOpenCalendar" class="ncp-btn">Otwórz kalendarz</button></div><div class="nmp-grid">${sample.map(x=>`<div class="nmp-day"><b>${esc(x.date)} • ${esc(x.time)}</b>${esc(x.title)}<br><em>${esc(x.platform)} • ${esc(x.type)}</em></div>`).join('')}</div><div style="font-size:8px;color:#91a0b7">Podgląd pokazuje pierwsze 10 z 30 zaplanowanych publikacji.</div>`;
    document.getElementById('nmpOpenCalendar')?.addEventListener('click',()=>document.querySelector('.nav-item[data-view="calendar"]')?.click());
  }

  function inject(){
    const panel=document.getElementById('ncpPanel');if(!panel)return;
    const actions=panel.querySelector('.ncp-actions');if(actions&&!document.getElementById('nmpScheduleMonth')){
      const btn=document.createElement('button');btn.id='nmpScheduleMonth';btn.className='nmp-btn';btn.textContent='Zaplanuj cały miesiąc';btn.onclick=()=>scheduleMonth(read(PLAN_KEY,null));actions.prepend(btn);
    }
    renderPreview();
  }

  document.addEventListener('DOMContentLoaded',()=>{const root=document.getElementById('content');if(root)new MutationObserver(()=>setTimeout(inject,0)).observe(root,{childList:true,subtree:true});inject();});
  window.AIINicheMonthPlanner={scheduleMonth,inject};
})();