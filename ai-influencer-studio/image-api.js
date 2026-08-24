(() => {
  const HISTORY_KEY='aii-photo-history';
  const API_URL='https://ai-influencer-studio-api.vercel.app/api/generate-image';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const toast=t=>window.showToast?window.showToast(t):alert(t);

  function avatarDNA(){
    return read('aii-avatar-dna',{});
  }

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
      dna
    };
  }

  function addDnaIndicator(){
    const btn=document.getElementById('gPhotoGenerate');
    if(!btn||document.getElementById('gPhotoDnaStatus'))return;
    const dna=avatarDNA();
    const box=document.createElement('div');
    box.id='gPhotoDnaStatus';
    box.style.cssText='margin:10px 0;padding:10px 12px;border:1px solid #e5e7ef;border-radius:11px;background:#fafafe;font-size:9px;font-weight:800;color:#5f6675';
    box.innerHTML=Object.keys(dna||{}).length
      ? `✓ AVATAR DNA AKTYWNE${dna.name?` — ${String(dna.name).replace(/[<>&]/g,'')}`:''}<div style="font-weight:500;margin-top:4px;color:#7b8290">Generator będzie utrzymywał tę samą tożsamość twarzy.</div>`
      : 'AVATAR DNA NIEUSTAWIONE<div style="font-weight:500;margin-top:4px;color:#7b8290">Najpierw zapisz AI Avatar, aby zachować spójną twarz między zdjęciami.</div>';
    btn.parentElement?.insertBefore(box,btn);
  }

  function bind(){
    const btn=document.getElementById('gPhotoGenerate');
    if(!btn||btn.dataset.apiBound==='1')return;
    btn.dataset.apiBound='1';
    const localFallback=btn.onclick;
    btn.textContent='Generuj zdjęcie AI';
    addDnaIndicator();
    btn.onclick=async()=>{
      const {prompt,format,dna}=currentPrompt();
      const preview=document.getElementById('gPhotoPreview');
      const result=document.getElementById('gPhotoResult');
      const old=btn.textContent;
      btn.disabled=true;btn.textContent='Generuję…';
      if(preview)preview.innerHTML='<span>Generowanie obrazu AI z Avatar DNA…</span>';
      if(result)result.innerHTML=`<pre>${Object.keys(dna||{}).length?'Avatar DNA aktywne. ':''}Łączenie z bezpiecznym backendem OpenAI…</pre>`;
      try{
        const response=await fetch(API_URL,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({prompt,format})
        });
        const data=await response.json().catch(()=>({}));
        if(!response.ok||!data.image)throw new Error(data.error||`Błąd API ${response.status}`);
        if(preview)preview.innerHTML=`<img alt="Wygenerowane zdjęcie AI" src="${data.image}">`;
        if(result)result.innerHTML=`<pre>${prompt}</pre><div class="gen-note">${Object.keys(dna||{}).length?'Avatar DNA • ':''}Wygenerowano przez ${data.model||'OpenAI'} • ${data.size||''}</div>`;
        const h=read(HISTORY_KEY,[]);h.unshift({prompt,format,ts:Date.now(),ai:true,avatar:dna?.name||null});save(HISTORY_KEY,h.slice(0,20));
        toast(Object.keys(dna||{}).length?'Zdjęcie AI wygenerowane z Avatar DNA':'Zdjęcie AI wygenerowane');
      }catch(err){
        if(typeof localFallback==='function')localFallback();
        toast('Backend AI niedostępny — użyto podglądu lokalnego');
        if(result)result.insertAdjacentHTML('beforeend',`<div class="gen-note">${String(err.message||err)}</div>`);
      }finally{btn.disabled=false;btn.textContent=old==='Generuj podgląd'?'Generuj zdjęcie AI':old;}
    };
  }

  const observer=new MutationObserver(bind);
  document.addEventListener('DOMContentLoaded',()=>{
    const root=document.getElementById('content');
    if(root)observer.observe(root,{childList:true,subtree:true});
    document.addEventListener('aii:avatar-dna-changed',()=>setTimeout(addDnaIndicator,0));
    bind();
  });
})();