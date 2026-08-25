(() => {
  const CUSTOM_KEY='aii-custom-photo-presets';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const toast=t=>window.showToast?window.showToast(t):alert(t);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  const BUILT_INS=[
    {id:'beauty-clean',name:'Beauty clean',category:'Beauty',prompt:'Natural beauty creator portrait with skincare focus',details:'soft daylight, clean vanity, authentic skin texture, premium UGC look',format:'4:5'},
    {id:'beauty-lux',name:'Beauty luxury',category:'Beauty',prompt:'Luxury beauty campaign portrait with elegant makeup styling',details:'editorial lighting, glossy highlights, premium cosmetic campaign, natural proportions',format:'4:5'},
    {id:'product-hero',name:'Produkt hero',category:'Produkt',prompt:'Premium cosmetic product hero shot',details:'studio composition, elegant reflections, clean background, campaign-ready lighting',format:'1:1'},
    {id:'product-ugc',name:'Produkt UGC',category:'Produkt',prompt:'Creator holding and presenting a beauty product naturally',details:'home setting, authentic social media UGC, natural hands, candid framing',format:'4:5'},
    {id:'reels-hook',name:'Reels hook',category:'Reels',prompt:'Vertical social media beauty shot designed as a strong opening frame',details:'dynamic framing, strong subject focus, room for captions, creator aesthetic',format:'9:16'},
    {id:'routine',name:'Morning routine',category:'Lifestyle',prompt:'Lifestyle creator morning routine at home',details:'natural window light, cozy interior, candid movement, realistic everyday moment',format:'9:16'},
    {id:'flatlay',name:'Flat lay',category:'Produkt',prompt:'Minimal premium beauty flat lay composition',details:'clean surface, balanced composition, soft shadows, editorial product styling',format:'1:1'},
    {id:'before-after',name:'Before / after',category:'Beauty',prompt:'Beauty transformation concept with consistent identity',details:'same person, coherent lighting and framing, realistic skin, social campaign look',format:'4:5'}
  ];

  function generatorReady(){return !!document.getElementById('gPhotoGenerate');}
  function apply(item){
    const p=document.getElementById('gPhotoPrompt');
    const d=document.getElementById('gPhotoDetails');
    const f=document.getElementById('gPhotoFormat');
    if(p)p.value=item.prompt||'';
    if(d)d.value=item.details||'';
    if(f&&item.format)f.value=item.format;
    toast(`Załadowano preset: ${item.name}`);
    p?.scrollIntoView({behavior:'smooth',block:'center'});
  }

  function addCustom(){
    const name=document.getElementById('gPromptPresetName')?.value.trim();
    const prompt=document.getElementById('gPhotoPrompt')?.value.trim();
    const details=document.getElementById('gPhotoDetails')?.value.trim()||'';
    const format=document.getElementById('gPhotoFormat')?.value||'4:5';
    if(!name){toast('Podaj nazwę własnego presetu');return;}
    if(!prompt){toast('Najpierw wpisz prompt');return;}
    const items=read(CUSTOM_KEY,[]);
    items.unshift({id:`custom-${Date.now()}`,name,category:'Własne',prompt,details,format});
    save(CUSTOM_KEY,items.slice(0,30));
    const n=document.getElementById('gPromptPresetName');if(n)n.value='';
    render();
    toast('Własny preset zapisany');
  }

  function removeCustom(id){
    save(CUSTOM_KEY,read(CUSTOM_KEY,[]).filter(x=>x.id!==id));
    render();
    toast('Preset usunięty');
  }

  function render(){
    if(!generatorReady())return;
    const anchor=document.getElementById('gPhotoGenerate')?.parentElement;
    if(!anchor)return;
    let panel=document.getElementById('gPromptLibrary');
    if(!panel){
      panel=document.createElement('section');
      panel.id='gPromptLibrary';
      panel.style.cssText='margin-top:18px;border:1px solid #e4e7ef;border-radius:14px;background:#fff;padding:14px;display:grid;gap:12px';
      anchor.appendChild(panel);
    }
    const custom=read(CUSTOM_KEY,[]);
    const all=[...BUILT_INS,...custom];
    const categories=['Wszystkie',...new Set(all.map(x=>x.category))];
    panel.innerHTML=`
      <div><div style="font-size:11px;font-weight:900">Biblioteka promptów</div><div style="font-size:9px;color:#7b8290;margin-top:3px">Gotowe sceny do kampanii + własne presety zapisane lokalnie.</div></div>
      <div id="gPromptFilters" style="display:flex;gap:6px;flex-wrap:wrap">${categories.map((c,i)=>`<button type="button" data-cat="${esc(c)}" ${i===0?'data-active="1"':''}>${esc(c)}</button>`).join('')}</div>
      <div id="gPromptCards" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px"></div>
      <div style="border-top:1px solid #eceef4;padding-top:10px;display:grid;gap:8px">
        <div style="font-size:9px;font-weight:900;color:#5f6675">ZAPISZ WŁASNY PRESET</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><input id="gPromptPresetName" placeholder="Nazwa presetu" style="flex:1;min-width:180px;border:1px solid #dfe3ee;border-radius:9px;padding:8px 10px;font-size:9px"><button type="button" id="gPromptSaveCustom">Zapisz bieżący prompt</button></div>
      </div>`;
    panel.querySelectorAll('button').forEach(b=>b.style.cssText='border:1px solid #dfe3ee;background:#fff;border-radius:9px;padding:7px 9px;font-size:9px;font-weight:800;cursor:pointer');

    const cards=panel.querySelector('#gPromptCards');
    function draw(category='Wszystkie'){
      const list=category==='Wszystkie'?all:all.filter(x=>x.category===category);
      cards.innerHTML=list.map(x=>`<article style="border:1px solid #eceef4;border-radius:11px;padding:10px;display:grid;gap:6px"><div style="font-size:9px;font-weight:900">${esc(x.name)}</div><div style="font-size:8px;color:#7b8290">${esc(x.category)} • ${esc(x.format||'')}</div><div style="font-size:8px;line-height:1.45">${esc(x.prompt)}</div><div style="display:flex;gap:6px"><button type="button" data-use="${esc(x.id)}">Użyj</button>${String(x.id).startsWith('custom-')?`<button type="button" data-remove="${esc(x.id)}">Usuń</button>`:''}</div></article>`).join('');
      cards.querySelectorAll('button').forEach(b=>b.style.cssText='border:1px solid #dfe3ee;background:#fff;border-radius:8px;padding:6px 8px;font-size:8px;font-weight:800;cursor:pointer');
      cards.querySelectorAll('[data-use]').forEach(b=>b.onclick=()=>{const x=all.find(i=>i.id===b.dataset.use);if(x)apply(x)});
      cards.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>removeCustom(b.dataset.remove));
    }
    draw();
    panel.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>draw(b.dataset.cat));
    panel.querySelector('#gPromptSaveCustom')?.addEventListener('click',addCustom);
  }

  const obs=new MutationObserver(()=>setTimeout(render,0));
  document.addEventListener('DOMContentLoaded',()=>{const root=document.getElementById('content');if(root)obs.observe(root,{childList:true,subtree:true});render();});
  window.AIIPromptLibrary={render,apply,builtIns:BUILT_INS};
})();