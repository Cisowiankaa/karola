(() => {
  const HISTORY_KEY='aii-photo-history';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const toast=t=>window.showToast?window.showToast(t):alert(t);

  function currentPrompt(){
    const p=document.getElementById('gPhotoPrompt')?.value.trim()||'';
    const f=document.getElementById('gPhotoFormat')?.value||'4:5';
    const st=document.getElementById('gPhotoStyle')?.value||'Beauty premium';
    const d=document.getElementById('gPhotoDetails')?.value.trim()||'';
    return {
      prompt:`${p||'Profesjonalna sesja influencera AI'}. Styl: ${st}. Format: ${f}. ${d?`Detale: ${d}.`:''} Realistyczne światło, spójna anatomia, naturalna skóra, kompozycja reklamowa, bez znaków wodnych.`,
      format:f
    };
  }

  function bind(){
    const btn=document.getElementById('gPhotoGenerate');
    if(!btn||btn.dataset.apiBound==='1')return;
    btn.dataset.apiBound='1';
    const localFallback=btn.onclick;
    btn.textContent='Generuj zdjęcie AI';
    btn.onclick=async()=>{
      const {prompt,format}=currentPrompt();
      const preview=document.getElementById('gPhotoPreview');
      const result=document.getElementById('gPhotoResult');
      const old=btn.textContent;
      btn.disabled=true;btn.textContent='Generuję…';
      if(preview)preview.innerHTML='<span>Generowanie obrazu AI…</span>';
      if(result)result.innerHTML='<pre>Łączenie z bezpiecznym backendem OpenAI…</pre>';
      try{
        const response=await fetch('/api/generate-image',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({prompt,format})
        });
        const data=await response.json().catch(()=>({}));
        if(!response.ok||!data.image)throw new Error(data.error||`Błąd API ${response.status}`);
        if(preview)preview.innerHTML=`<img alt="Wygenerowane zdjęcie AI" src="${data.image}">`;
        if(result)result.innerHTML=`<pre>${prompt}</pre><div class="gen-note">Wygenerowano przez ${data.model||'OpenAI'} • ${data.size||''}</div>`;
        const h=read(HISTORY_KEY,[]);h.unshift({prompt,format,ts:Date.now(),ai:true});save(HISTORY_KEY,h.slice(0,20));
        toast('Zdjęcie AI wygenerowane');
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
    bind();
  });
})();