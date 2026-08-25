(() => {
  const HISTORY_KEY='aii-photo-history';
  const PROJECTS_KEY='aii-photo-projects';
  const DEFAULT_API_URL='https://ai-influencer-studio-api.vercel.app/api/generate-image';
  const PROVIDER_KEY='aii-image-provider';
  const PROVIDER_ENDPOINT_KEY='aii-image-provider-endpoint';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const toast=t=>window.showToast?window.showToast(t):alert(t);

  function providerConfig(){
    const provider=(localStorage.getItem(PROVIDER_KEY)||'higgsfield').toLowerCase();
    const endpoint=localStorage.getItem(PROVIDER_ENDPOINT_KEY)||DEFAULT_API_URL;
    return {provider,endpoint};
  }

  function providerLabel(provider){
    if(provider==='higgsfield')return 'Higgsfield';
    if(provider==='openai')return 'OpenAI';
    return provider||'AI';
  }

  function avatarDNA(){ return read('aii-avatar-dna',{}); }

  function dnaPrompt(dna){
    if(!dna||!Object.keys(dna).length)return '';
    const parts=[];
    if(dna.name)parts.push(`Recurring AI influencer identity: ${dna.name}`);
    if(dna.age)parts.push(`visual age ${dna.age}`);
    if(dna.hair)parts.push(`hair ${dna.hair}`);
    if(dna.eyes)parts.push(`eyes ${dna.eyes}`);
    if(dna.style)parts.push(`personal style ${dna.style}`);
    if(dna.traits)parts.push(`visual personality ${dna.traits}`);
    if(dna.signature)parts.push(`signature visual language ${dna.signature}`);
    if(!parts.length)return '';
    return `${parts.join('. ')}. Keep the SAME facial identity across every generation: same face shape, eyes, nose, mouth, proportions, hair color and overall appearance. Face must be clearly visible unless the scene explicitly requires otherwise. `;
  }

  function currentPrompt(){
    const p=document.getElementById('gPhotoPrompt')?.value.trim()||'';
    const f=document.getElementById('gPhotoFormat')?.value||'4:5';
    const st=document.getElementById('gPhotoStyle')?.value||localStorage.getItem('aii-default-style')||'Beauty premium';
    const d=document.getElementById('gPhotoDetails')?.value.trim()||'';
    const dna=avatarDNA();
    const identity=dnaPrompt(dna);
    return {
      prompt:`${identity}${p||'Profesjonalna sesja influencera AI'}. Styl: ${st}. Format: ${f}. ${d?`Detale: ${d}.`:''} Photorealistic commercial photography, realistic lighting, coherent anatomy, natural skin texture, realistic hands, no watermark, no text.`,
      format:f,
      style:st,
      details:d,
      dna
    };
  }

  function addDnaIndicator(){
    const btn=document.getElementById('gPhotoGenerate');
    if(!btn)return;
    const dna=avatarDNA();
    let box=document.getElementById('gPhotoDnaStatus');
    if(!box){box=document.createElement('div');box.id='gPhotoDnaStatus';box.style.cssText='margin:10px 0;padding:10px 12px;border:1px solid #e5e7ef;border-radius:11px;background:#fafafe;font-size:9px;font-weight:800;color:#5f6675';btn.parentElement?.insertBefore(box,btn);}
    box.innerHTML=Object.keys(dna||{}).length
      ? `✓ AVATAR DNA AKTYWNE${dna.name?` — ${String(dna.name).replace(/[<>&]/g,'')}`:''}<div style="font-weight:500;margin-top:4px;color:#7b8290">Generator będzie utrzymywał tę samą tożsamość twarzy.</div>`
      : 'AVATAR DNA NIEUSTAWIONE<div style="font-weight:500;margin-top:4px;color:#7b8290">Najpierw zapisz AI Avatar, aby zachować spójną twarz między zdjęciami.</div>';
  }

  function addProviderIndicator(){
    const btn=document.getElementById('gPhotoGenerate');
    if(!btn)return;
    const {provider,endpoint}=providerConfig();
    let box=document.getElementById('gPhotoProviderStatus');
    if(!box){box=document.createElement('div');box.id='gPhotoProviderStatus';box.style.cssText='margin:10px 0;padding:10px 12px;border:1px solid #dbe5ff;border-radius:11px;background:#f6f8ff;font-size:9px;font-weight:800;color:#4d5f8a';btn.parentElement?.insertBefore(box,btn);}
    const isCustom=endpoint!==DEFAULT_API_URL;
    box.innerHTML=`MODEL OBRAZU: ${providerLabel(provider).toUpperCase()}<div style="font-weight:500;margin-top:4px;color:#7b8290">${isCustom?'Połączony z własnym endpointem generatora.':'Tryb przygotowany do bezpiecznego backendu; brak płatnego AI nie blokuje aplikacji.'}</div>`;
  }

  function applyPreset(text,details){
    const prompt=document.getElementById('gPhotoPrompt');
    const extra=document.getElementById('gPhotoDetails');
    if(prompt)prompt.value=text;
    if(extra&&details)extra.value=details;
    toast('Preset dodany do generatora');
  }

  async function copyPrompt(){
    const {prompt}=currentPrompt();
    try{await navigator.clipboard.writeText(prompt);toast('Prompt skopiowany');}
    catch{toast('Nie udało się skopiować promptu');}
  }

  function saveProject(){
    const data=currentPrompt();
    const projects=read(PROJECTS_KEY,[]);
    projects.unshift({id:Date.now(),...data,createdAt:new Date().toISOString(),provider:providerConfig().provider});
    save(PROJECTS_KEY,projects.slice(0,50));
    toast('Projekt zdjęcia zapisany lokalnie');
    renderProjectCount();
  }

  function renderProjectCount(){
    const el=document.getElementById('gPhotoProjectsCount');
    if(el)el.textContent=`Zapisane projekty: ${read(PROJECTS_KEY,[]).length}`;
  }

  function addLocalTools(){
    const btn=document.getElementById('gPhotoGenerate');
    if(!btn||document.getElementById('gPhotoLocalTools'))return;
    const wrap=document.createElement('div');
    wrap.id='gPhotoLocalTools';
    wrap.style.cssText='margin:12px 0;display:grid;gap:8px';
    wrap.innerHTML=`
      <div style="font-size:9px;font-weight:900;color:#5f6675">SZYBKIE PRESSETY</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        <button type="button" data-preset="beauty">Beauty UGC</button>
        <button type="button" data-preset="product">Produkt premium</button>
        <button type="button" data-preset="lifestyle">Lifestyle</button>
        <button type="button" data-preset="reel">Kadr do Reels</button>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" id="gPhotoCopyPrompt">Kopiuj prompt</button>
        <button type="button" id="gPhotoSaveProject">Zapisz projekt</button>
        <span id="gPhotoProjectsCount" style="align-self:center;font-size:9px;color:#7b8290"></span>
      </div>`;
    btn.parentElement?.insertBefore(wrap,btn);
    wrap.querySelectorAll('button').forEach(b=>b.style.cssText='border:1px solid #dfe3ee;background:#fff;border-radius:9px;padding:7px 9px;font-size:9px;font-weight:800;cursor:pointer');
    wrap.querySelector('[data-preset="beauty"]')?.addEventListener('click',()=>applyPreset('Natural beauty UGC portrait, skincare routine, soft window light','clean bathroom or vanity, authentic skin texture, subtle smile, premium but natural look'));
    wrap.querySelector('[data-preset="product"]')?.addEventListener('click',()=>applyPreset('Luxury cosmetic product hero shot','elegant studio composition, glossy reflections, soft shadows, premium campaign aesthetic'));
    wrap.querySelector('[data-preset="lifestyle"]')?.addEventListener('click',()=>applyPreset('Lifestyle creator photo at home','candid moment, natural daylight, realistic interior, social media editorial feel'));
    wrap.querySelector('[data-preset="reel"]')?.addEventListener('click',()=>{applyPreset('Vertical social media beauty shot','dynamic framing, creator-style composition, clear subject, room for captions');const f=document.getElementById('gPhotoFormat');if(f)f.value='9:16';});
    document.getElementById('gPhotoCopyPrompt')?.addEventListener('click',copyPrompt);
    document.getElementById('gPhotoSaveProject')?.addEventListener('click',saveProject);
    renderProjectCount();
  }

  function bind(){
    const btn=document.getElementById('gPhotoGenerate');
    if(!btn||btn.dataset.apiBound==='1')return;
    btn.dataset.apiBound='1';
    const localFallback=btn.onclick;
    btn.textContent='Generuj zdjęcie AI';
    addDnaIndicator();addProviderIndicator();addLocalTools();
    btn.onclick=async()=>{
      const {prompt,format,dna}=currentPrompt();
      const {provider,endpoint}=providerConfig();
      const preview=document.getElementById('gPhotoPreview');
      const result=document.getElementById('gPhotoResult');
      const old=btn.textContent;
      btn.disabled=true;btn.textContent='Generuję…';
      if(preview)preview.innerHTML=`<span>Generowanie obrazu AI przez ${providerLabel(provider)}…</span>`;
      if(result)result.innerHTML=`<pre>${Object.keys(dna||{}).length?'Avatar DNA aktywne. ':''}Łączenie z generatorem ${providerLabel(provider)}…</pre>`;
      try{
        const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,format,provider,model:provider==='higgsfield'?'soul_2':undefined})});
        const data=await response.json().catch(()=>({}));
        if(!response.ok||!data.image)throw new Error(data.error||`Błąd API ${response.status}`);
        if(preview)preview.innerHTML=`<img alt="Wygenerowane zdjęcie AI" src="${data.image}">`;
        if(result)result.innerHTML=`<pre>${prompt}</pre><div class="gen-note">${Object.keys(dna||{}).length?'Avatar DNA • ':''}Wygenerowano przez ${data.provider||data.model||providerLabel(provider)}${data.size?` • ${data.size}`:''}</div>`;
        const h=read(HISTORY_KEY,[]);h.unshift({prompt,format,ts:Date.now(),ai:true,provider:data.provider||provider,avatar:dna?.name||null});save(HISTORY_KEY,h.slice(0,20));
        toast(Object.keys(dna||{}).length?'Zdjęcie AI wygenerowane z Avatar DNA':'Zdjęcie AI wygenerowane');
      }catch(err){
        if(typeof localFallback==='function')localFallback();
        toast(`${providerLabel(provider)} niedostępny — aplikacja działa dalej w trybie lokalnym`);
        if(result)result.insertAdjacentHTML('beforeend',`<div class="gen-note">${String(err.message||err)}</div>`);
      }finally{btn.disabled=false;btn.textContent=old==='Generuj podgląd'?'Generuj zdjęcie AI':old;}
    };
  }

  const observer=new MutationObserver(bind);
  document.addEventListener('DOMContentLoaded',()=>{
    const root=document.getElementById('content');
    if(root)observer.observe(root,{childList:true,subtree:true});
    document.addEventListener('aii:avatar-dna-changed',()=>setTimeout(()=>{addDnaIndicator();addProviderIndicator();addLocalTools();},0));
    bind();
  });

  window.AIIImageProvider={set(provider,endpoint){if(provider)localStorage.setItem(PROVIDER_KEY,String(provider).toLowerCase());if(endpoint)localStorage.setItem(PROVIDER_ENDPOINT_KEY,endpoint);addProviderIndicator();},get:providerConfig};
})();