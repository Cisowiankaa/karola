(() => {
  const API='https://ai-influencer-studio-api.vercel.app/api/generate-image';
  const q=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const toast=t=>window.showToast?window.showToast(t):alert(t);
  const readDNA=()=>{try{return JSON.parse(localStorage.getItem('aii-avatar-dna')||'{}')}catch{return {}}};
  const saveDNA=d=>localStorage.setItem('aii-avatar-dna',JSON.stringify(d));

  const style=document.createElement('style');
  style.textContent=`
    .avatar-runtime-status{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:12px;margin:0 0 10px;font-size:9px;font-weight:800;background:#f5f6fa;border:1px solid #e4e7ef;color:#555e70}
    .avatar-runtime-status .dot{width:9px;height:9px;border-radius:50%;background:#8e95a5;box-shadow:0 0 0 4px rgba(142,149,165,.12)}
    .avatar-runtime-status.generating{background:#f4f0ff;border-color:#d9ceff;color:#6546d8}.avatar-runtime-status.generating .dot{background:#7655e8;animation:avatarPulse 1s infinite}
    .avatar-runtime-status.ready{background:#eefaf3;border-color:#cbead7;color:#267247}.avatar-runtime-status.ready .dot{background:#34a56a}
    .avatar-runtime-status.error{background:#fff3f3;border-color:#f1cccc;color:#a63d3d}.avatar-runtime-status.error .dot{background:#d95151}
    .avatar-placeholder{padding:28px;max-width:420px;text-align:center;color:white}.avatar-placeholder strong{display:block;font-size:20px;margin-bottom:8px}.avatar-placeholder span{display:block;font-size:10px;line-height:1.55;opacity:.85}
    .avatar-error-box{padding:22px;max-width:460px;text-align:center;color:#fff}.avatar-error-box strong{display:block;font-size:17px;margin-bottom:8px}.avatar-error-box span{font-size:10px;line-height:1.55;opacity:.88}
    @keyframes avatarPulse{50%{transform:scale(1.35);opacity:.55}}
  `;
  document.head.appendChild(style);

  function collect(){
    return {
      name:q('#avName')?.value.trim()||'Nova',
      age:q('#avAge')?.value.trim()||'28–35',
      hair:q('#avHair')?.value.trim()||'ciemny blond, delikatne fale',
      eyes:q('#avEyes')?.value.trim()||'zielone',
      style:q('#avStyle')?.value||'Premium beauty + natural UGC',
      traits:q('#avTraits')?.value.trim()||'ciepła, pewna siebie, autentyczna',
      signature:q('#avSignature')?.value.trim()||'miękkie światło, jasne neutralne tło'
    };
  }
  function makePrompt(){
    const d=collect();
    const scene=q('#avScene')?.value.trim()||'professional beauty creator portrait, face clearly visible, looking toward camera, bright premium studio';
    return `Create a photorealistic recurring AI influencer named ${d.name}. Visual age: ${d.age}. Hair: ${d.hair}. Eyes: ${d.eyes}. Personal style: ${d.style}. Personality expressed visually: ${d.traits}. Signature visual language: ${d.signature}. Scene: ${scene}. IMPORTANT: show a clearly visible human face, unobstructed, centered or three-quarter portrait, realistic eyes, nose, mouth and skin texture. Keep facial identity, proportions, hair color, eye color and overall appearance consistent across generations. Commercial photography, realistic hands, no watermark, no text.`;
  }
  function setStatus(kind,text){
    let el=q('#avatarRuntimeStatus');
    if(!el){
      const preview=q('#avPreview');
      if(!preview)return;
      el=document.createElement('div');el.id='avatarRuntimeStatus';el.className='avatar-runtime-status';
      preview.parentElement.insertBefore(el,preview);
    }
    el.className='avatar-runtime-status '+kind;
    el.innerHTML=`<span class="dot"></span><span>${esc(text)}</span>`;
  }
  function showInitial(){
    const preview=q('#avPreview'); if(!preview)return;
    if(preview.querySelector('.suite-avatar-mark')){
      preview.innerHTML='<div class="avatar-placeholder"><strong>Avatar jeszcze nie został wygenerowany</strong><span>Kliknij „Generuj test avatara”. Gdy backend AI zadziała, tutaj pojawi się prawdziwy portret z widoczną twarzą.</span></div>';
    }
    setStatus('','OCZEKUJE NA GENEROWANIE');
  }
  function enhance(){
    const btn=q('#avGenerate'); const preview=q('#avPreview');
    if(!btn||!preview||btn.dataset.avatarFixBound)return;
    btn.dataset.avatarFixBound='1';
    showInitial();
    btn.onclick=async()=>{
      const p=makePrompt();
      const dna=collect(); saveDNA(dna);
      const out=q('#avPrompt'); if(out)out.textContent=p;
      btn.disabled=true; btn.textContent='Generuję twarz…';
      setStatus('generating','GENEROWANIE TWARZY AVATARA…');
      preview.innerHTML='<div class="avatar-placeholder"><strong>Generowanie w toku</strong><span>Tworzę fotorealistyczny portret z wyraźnie widoczną twarzą.</span></div>';
      try{
        const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:p,format:'4:5'})});
        const data=await r.json().catch(()=>({}));
        if(!r.ok||!data.image)throw new Error(data.error||`Błąd API ${r.status}`);
        preview.innerHTML=`<img alt="AI Avatar – wygenerowana twarz" src="${data.image}">`;
        setStatus('ready','AVATAR GOTOWY — TWARZ WYGENEROWANA');
        if(out)out.textContent=p+'\n\nStatus: avatar wygenerowany poprawnie.';
        toast('Twarz avatara została wygenerowana');
      }catch(e){
        const msg=String(e?.message||e||'Nieznany błąd');
        preview.innerHTML=`<div class="avatar-error-box"><strong>Nie udało się wygenerować twarzy</strong><span>${esc(msg)}<br><br>Avatar DNA zostało zapisane. To problem połączenia z backendem AI, nie ustawień twarzy.</span></div>`;
        setStatus('error','BŁĄD BACKENDU AI — TWARZ NIE ZOSTAŁA WYGENEROWANA');
        if(out)out.textContent=p+'\n\nBłąd backendu: '+msg;
        toast('Generator avatara: backend AI niedostępny');
      }finally{
        btn.disabled=false; btn.textContent='Generuj test avatara';
      }
    };
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const c=document.getElementById('content');
    if(c)new MutationObserver(()=>setTimeout(enhance,0)).observe(c,{childList:true,subtree:true});
    document.querySelectorAll('.nav-item[data-view="avatar"],.nav-item[data-view="ai-avatar"]').forEach(a=>a.addEventListener('click',()=>setTimeout(enhance,40)));
    setTimeout(enhance,100);
  });
})();