(() => {
  const API='https://ai-influencer-studio-api.vercel.app/api/generate-image';
  const q=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const toast=t=>window.showToast?window.showToast(t):alert(t);
  const saveDNA=d=>localStorage.setItem('aii-avatar-dna',JSON.stringify(d));
  const PREVIEW='avatar-preview.svg?v=20260824-2';

  const style=document.createElement('style');
  style.textContent=`
    .avatar-runtime-status{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:12px;margin:0 0 10px;font-size:9px;font-weight:800;background:#f5f6fa;border:1px solid #e4e7ef;color:#555e70}
    .avatar-runtime-status .dot{width:9px;height:9px;border-radius:50%;background:#8e95a5;box-shadow:0 0 0 4px rgba(142,149,165,.12)}
    .avatar-runtime-status.generating{background:#f4f0ff;border-color:#d9ceff;color:#6546d8}.avatar-runtime-status.generating .dot{background:#7655e8;animation:avatarPulse 1s infinite}
    .avatar-runtime-status.ready{background:#eefaf3;border-color:#cbead7;color:#267247}.avatar-runtime-status.ready .dot{background:#34a56a}
    .avatar-runtime-status.error{background:#fff3f3;border-color:#f1cccc;color:#a63d3d}.avatar-runtime-status.error .dot{background:#d95151}
    .avatar-error-layer{position:absolute;left:12px;right:12px;bottom:12px;padding:10px 12px;border-radius:10px;background:rgba(23,25,37,.88);color:#fff;font-size:9px;text-align:center;backdrop-filter:blur(8px)}
    @keyframes avatarPulse{50%{transform:scale(1.35);opacity:.55}}
  `;
  document.head.appendChild(style);

  function collect(){return {
    name:q('#avName')?.value.trim()||'Nova',age:q('#avAge')?.value.trim()||'28–35',
    hair:q('#avHair')?.value.trim()||'ciemny blond, delikatne fale',eyes:q('#avEyes')?.value.trim()||'zielone',
    style:q('#avStyle')?.value||'Premium beauty + natural UGC',traits:q('#avTraits')?.value.trim()||'ciepła, pewna siebie, autentyczna',
    signature:q('#avSignature')?.value.trim()||'miękkie światło, jasne neutralne tło'};}
  function makePrompt(){const d=collect(),scene=q('#avScene')?.value.trim()||'professional beauty creator portrait, face clearly visible, looking toward camera, bright premium studio';return `Create a photorealistic recurring AI influencer named ${d.name}. Visual age: ${d.age}. Hair: ${d.hair}. Eyes: ${d.eyes}. Style: ${d.style}. Personality: ${d.traits}. Visual signature: ${d.signature}. Scene: ${scene}. Show a clearly visible unobstructed human face with realistic eyes, nose, mouth and natural skin texture. Keep facial identity and proportions consistent. Commercial photography, no watermark, no text.`;}
  function setStatus(kind,text){let el=q('#avatarRuntimeStatus');const preview=q('#avPreview');if(!preview)return;if(!el){el=document.createElement('div');el.id='avatarRuntimeStatus';preview.parentElement.insertBefore(el,preview)}el.className='avatar-runtime-status '+kind;el.innerHTML=`<span class="dot"></span><span>${esc(text)}</span>`;}
  function showPreview(){const preview=q('#avPreview');if(!preview)return;preview.innerHTML=`<img src="${PREVIEW}" alt="Podgląd twarzy avatara AI" style="width:100%;height:100%;object-fit:cover">`;setStatus('','PODGLĄD TWARZY — GOTOWY DO GENEROWANIA AI');}
  function enhance(){const btn=q('#avGenerate'),preview=q('#avPreview');if(!btn||!preview||btn.dataset.avatarFixBound)return;btn.dataset.avatarFixBound='1';showPreview();btn.onclick=async()=>{const p=makePrompt(),dna=collect(),out=q('#avPrompt');saveDNA(dna);if(out)out.textContent=p;btn.disabled=true;btn.textContent='Generuję twarz…';setStatus('generating','GENEROWANIE TWARZY AVATARA…');try{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:p,format:'4:5'})});const data=await r.json().catch(()=>({}));if(!r.ok||!data.image)throw new Error(data.error||`Błąd API ${r.status}`);preview.innerHTML=`<img alt="AI Avatar – wygenerowana twarz" src="${data.image}" style="width:100%;height:100%;object-fit:cover">`;setStatus('ready','AVATAR GOTOWY — TWARZ WYGENEROWANA');if(out)out.textContent=p+'\n\nStatus: avatar wygenerowany poprawnie.';toast('Twarz avatara została wygenerowana')}catch(e){const msg=String(e?.message||e||'Nieznany błąd');preview.innerHTML=`<img src="${PREVIEW}" alt="Podgląd twarzy avatara AI" style="width:100%;height:100%;object-fit:cover"><div class="avatar-error-layer">Generator AI chwilowo niedostępny. Wyświetlam podgląd twarzy avatara.</div>`;setStatus('error','BACKEND AI NIEDOSTĘPNY — PODGLĄD TWARZY POZOSTAJE WIDOCZNY');if(out)out.textContent=p+'\n\nBłąd backendu: '+msg;toast('Backend AI niedostępny — pokazuję podgląd avatara')}finally{btn.disabled=false;btn.textContent='Generuj test avatara'}};}
  document.addEventListener('DOMContentLoaded',()=>{const c=document.getElementById('content');if(c)new MutationObserver(()=>setTimeout(enhance,0)).observe(c,{childList:true,subtree:true});document.querySelectorAll('.nav-item[data-view="avatar"],.nav-item[data-view="ai-avatar"]').forEach(a=>a.addEventListener('click',()=>setTimeout(enhance,50)));setTimeout(enhance,120);});
})();