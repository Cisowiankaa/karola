(() => {
  const SERIES_KEY='aii-photo-campaign-series';
  const SOCIAL_KEY='aii-social-queue';
  const STATUSES=['Do zrobienia','Gotowe','Opublikowane'];
  const PLATFORMS=['Instagram','TikTok','Facebook','YouTube'];
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const toast=t=>window.showToast?window.showToast(t):alert(t);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  const SERIES=[
    {name:'Hero produktu',prompt:'Premium cosmetic product hero shot with the campaign product as the clear focal point',details:'studio lighting, elegant reflections, clean composition, premium advertising aesthetic',format:'1:1'},
    {name:'UGC z produktem',prompt:'Authentic creator holding and presenting the campaign product naturally',details:'realistic home setting, natural hands, candid social media UGC, believable expression',format:'4:5'},
    {name:'Lifestyle',prompt:'Lifestyle creator using the campaign product during an everyday routine',details:'natural daylight, candid moment, coherent brand styling, realistic environment',format:'4:5'},
    {name:'Reels 9:16',prompt:'Vertical creator shot for a beauty Reels campaign featuring the product',details:'dynamic framing, strong opening-frame composition, room for captions, social-first aesthetic',format:'9:16'},
    {name:'Flat lay',prompt:'Premium flat lay of the campaign product and matching beauty accessories',details:'clean surface, soft shadows, balanced editorial composition, brand-consistent props',format:'1:1'}
  ];

  function ready(){return !!document.getElementById('gPhotoGenerate');}
  function currentBase(){
    return {
      product:document.getElementById('gCampaignProduct')?.value.trim()||'',
      style:document.getElementById('gPhotoStyle')?.value||'Beauty premium',
      extra:document.getElementById('gCampaignExtra')?.value.trim()||''
    };
  }
  function build(){
    const base=currentBase();
    if(!base.product){toast('Wpisz nazwę produktu lub kampanii');return;}
    const items=SERIES.map((x,i)=>({
      id:`shot-${Date.now()}-${i}`,
      name:x.name,
      prompt:`${x.prompt}. Product or campaign: ${base.product}. Style: ${base.style}.`,
      details:`${x.details}${base.extra?`. Additional campaign direction: ${base.extra}`:''}`,
      format:x.format,
      status:'Do zrobienia',
      platform:i===3?'TikTok':'Instagram',
      date:'',
      time:'18:00',
      calendarId:null
    }));
    save(SERIES_KEY,{createdAt:new Date().toISOString(),product:base.product,style:base.style,extra:base.extra,items});
    renderShots(items);renderProgress(items);toast('Seria 5 ujęć kampanii gotowa');
  }
  function useShot(item){
    const p=document.getElementById('gPhotoPrompt'),d=document.getElementById('gPhotoDetails'),f=document.getElementById('gPhotoFormat');
    if(p)p.value=item.prompt;if(d)d.value=item.details;if(f)f.value=item.format;
    p?.scrollIntoView({behavior:'smooth',block:'center'});toast(`Załadowano: ${item.name}`);
  }
  function persistField(index,field,value){
    const saved=read(SERIES_KEY,null);if(!saved?.items?.[index])return;
    saved.items[index][field]=value;saved.items[index].updatedAt=new Date().toISOString();save(SERIES_KEY,saved);renderShots(saved.items);renderProgress(saved.items);
  }
  function updateStatus(index,status){if(STATUSES.includes(status))persistField(index,'status',status)}
  function nextStatus(index){const saved=read(SERIES_KEY,null),item=saved?.items?.[index];if(!item)return;const current=STATUSES.indexOf(item.status||'Do zrobienia');updateStatus(index,STATUSES[(current+1)%STATUSES.length])}
  function calendarStatus(item){return item.status==='Opublikowane'?'Opublikowany':item.status==='Gotowe'?'Gotowy':'Zaplanowany'}
  function addToCalendar(index){
    const saved=read(SERIES_KEY,null),item=saved?.items?.[index];if(!item)return;
    if(!item.date){toast('Najpierw wybierz termin publikacji');return;}
    const arr=read(SOCIAL_KEY,[]);
    const id=item.calendarId||Date.now();
    const entry={id,title:`${saved.product||'Kampania'} — ${item.name}`,platform:item.platform||'Instagram',type:item.name.includes('Reels')?'Reels':'Post',date:item.date,time:item.time||'18:00',status:calendarStatus(item),notes:`Dodano z serii kampanii. ${item.details||''}`,createdAt:Date.now()};
    const pos=arr.findIndex(x=>String(x.id)===String(id));if(pos>=0)arr[pos]=entry;else arr.push(entry);
    save(SOCIAL_KEY,arr);item.calendarId=id;item.updatedAt=new Date().toISOString();save(SERIES_KEY,saved);
    document.dispatchEvent(new CustomEvent('aii:social-changed',{detail:{count:arr.length}}));renderShots(saved.items);toast('Ujęcie dodane do Kalendarza publikacji');
  }
  function renderProgress(items=[]){
    const el=document.getElementById('gCampaignProgress');if(!el)return;
    const total=items.length||0,readyCount=items.filter(x=>x.status==='Gotowe').length,published=items.filter(x=>x.status==='Opublikowane').length,complete=items.filter(x=>x.status!=='Do zrobienia').length,pct=total?Math.round((complete/total)*100):0,scheduled=items.filter(x=>x.date).length;
    el.innerHTML=`<div style="display:flex;justify-content:space-between;gap:8px;font-size:8px;color:#6b7280"><span>Postęp produkcji: <b>${pct}%</b></span><span>Zaplanowane: ${scheduled}/${total} • Gotowe: ${readyCount} • Opublikowane: ${published}</span></div><div style="height:6px;background:#eef0f5;border-radius:999px;overflow:hidden"><div style="height:100%;width:${pct}%;background:#111827"></div></div>`;
  }
  function renderShots(items){
    const box=document.getElementById('gCampaignSeriesShots');if(!box)return;
    box.innerHTML=items?.length?items.map((x,i)=>`<article style="border:1px solid #eceef4;border-radius:11px;padding:10px;display:grid;gap:7px"><div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:9px">${i+1}. ${esc(x.name)}</b><span style="font-size:8px;color:#7b8290">${esc(x.format)}</span></div><div style="font-size:8px;line-height:1.45;color:#5f6675">${esc(x.prompt)}</div><select data-status="${i}" style="border:1px solid #dfe3ee;border-radius:8px;padding:6px 8px;font-size:8px;font-weight:800;background:#fff">${STATUSES.map(s=>`<option value="${esc(s)}" ${(x.status||'Do zrobienia')===s?'selected':''}>${esc(s)}</option>`).join('')}</select><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px"><label style="font-size:8px;color:#6b7280">Termin<input type="date" data-date="${i}" value="${esc(x.date||'')}" style="width:100%;box-sizing:border-box;border:1px solid #dfe3ee;border-radius:8px;padding:6px;font-size:8px"></label><label style="font-size:8px;color:#6b7280">Godzina<input type="time" data-time="${i}" value="${esc(x.time||'18:00')}" style="width:100%;box-sizing:border-box;border:1px solid #dfe3ee;border-radius:8px;padding:6px;font-size:8px"></label></div><label style="font-size:8px;color:#6b7280">Platforma<select data-platform="${i}" style="width:100%;border:1px solid #dfe3ee;border-radius:8px;padding:6px 8px;font-size:8px;background:#fff">${PLATFORMS.map(p=>`<option value="${p}" ${(x.platform||'Instagram')===p?'selected':''}>${p}</option>`).join('')}</select></label><div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" data-shot="${i}">Użyj ujęcia</button><button type="button" data-next="${i}">Następny status</button><button type="button" data-calendar="${i}">${x.calendarId?'Aktualizuj kalendarz':'Dodaj do kalendarza'}</button></div></article>`).join(''):'<div style="font-size:9px;color:#8a90a0">Wpisz produkt i utwórz serię kampanii.</div>';
    box.querySelectorAll('button').forEach(b=>b.style.cssText='border:1px solid #dfe3ee;background:#fff;border-radius:8px;padding:7px 9px;font-size:8px;font-weight:800;cursor:pointer');
    box.querySelectorAll('[data-shot]').forEach(b=>b.onclick=()=>useShot(items[Number(b.dataset.shot)]));
    box.querySelectorAll('[data-next]').forEach(b=>b.onclick=()=>nextStatus(Number(b.dataset.next)));
    box.querySelectorAll('[data-calendar]').forEach(b=>b.onclick=()=>addToCalendar(Number(b.dataset.calendar)));
    box.querySelectorAll('[data-status]').forEach(s=>s.onchange=()=>updateStatus(Number(s.dataset.status),s.value));
    box.querySelectorAll('[data-date]').forEach(s=>s.onchange=()=>persistField(Number(s.dataset.date),'date',s.value));
    box.querySelectorAll('[data-time]').forEach(s=>s.onchange=()=>persistField(Number(s.dataset.time),'time',s.value));
    box.querySelectorAll('[data-platform]').forEach(s=>s.onchange=()=>persistField(Number(s.dataset.platform),'platform',s.value));
  }
  function normalizeSaved(saved){
    if(!saved?.items)return saved;let changed=false;
    saved.items.forEach((x,i)=>{if(!x.status){x.status='Do zrobienia';changed=true}if(!x.platform){x.platform=i===3?'TikTok':'Instagram';changed=true}if(x.date===undefined){x.date='';changed=true}if(!x.time){x.time='18:00';changed=true}if(x.calendarId===undefined){x.calendarId=null;changed=true}});
    if(changed)save(SERIES_KEY,saved);return saved;
  }
  function render(){
    if(!ready())return;const anchor=document.getElementById('gPhotoGenerate')?.parentElement;if(!anchor)return;
    let panel=document.getElementById('gCampaignSeries');if(!panel){panel=document.createElement('section');panel.id='gCampaignSeries';panel.style.cssText='margin-top:18px;border:1px solid #e4e7ef;border-radius:14px;background:#fff;padding:14px;display:grid;gap:12px';anchor.appendChild(panel)}
    const saved=normalizeSaved(read(SERIES_KEY,null));
    panel.innerHTML=`<div><div style="font-size:11px;font-weight:900">Seria kampanii — 5 ujęć</div><div style="font-size:9px;color:#7b8290;margin-top:3px">Przygotuj zestaw, ustaw terminy i przenieś gotowe materiały do Kalendarza publikacji.</div></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px"><input id="gCampaignProduct" placeholder="Produkt / nazwa kampanii" value="${esc(saved?.product||'')}" style="border:1px solid #dfe3ee;border-radius:9px;padding:9px 10px;font-size:9px"><input id="gCampaignExtra" placeholder="Opcjonalnie: kolor, klimat, CTA, rekwizyty" value="${esc(saved?.extra||'')}" style="border:1px solid #dfe3ee;border-radius:9px;padding:9px 10px;font-size:9px"></div><button type="button" id="gCampaignBuild" style="border:0;background:#111827;color:#fff;border-radius:9px;padding:9px 12px;font-size:9px;font-weight:900;cursor:pointer;width:max-content">Utwórz serię 5 ujęć</button><div id="gCampaignProgress" style="display:grid;gap:5px"></div><div id="gCampaignSeriesShots" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:8px"></div>`;
    panel.querySelector('#gCampaignBuild')?.addEventListener('click',build);renderShots(saved?.items||[]);renderProgress(saved?.items||[]);
  }
  const obs=new MutationObserver(()=>setTimeout(render,0));
  document.addEventListener('DOMContentLoaded',()=>{const root=document.getElementById('content');if(root)obs.observe(root,{childList:true,subtree:true});render()});
  window.AIICampaignSeries={render,build,useShot,updateStatus,addToCalendar};
})();