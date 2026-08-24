(() => {
  const PREVIEW_SRC='avatar-preview.svg?v=20260824-1';
  const q=s=>document.querySelector(s);
  function renderPreview(){
    const preview=q('#avPreview');
    if(!preview) return;
    const hasGenerated=preview.querySelector('img[alt*="wygenerowana twarz"]');
    const isGenerating=preview.textContent.includes('Generowanie');
    if(hasGenerated||isGenerating) return;
    preview.innerHTML=`<img src="${PREVIEW_SRC}" alt="Podgląd twarzy avatara AI" style="width:100%;height:100%;object-fit:cover">`;
    const status=q('#avatarRuntimeStatus');
    if(status && !status.classList.contains('ready') && !status.classList.contains('generating')) {
      status.className='avatar-runtime-status';
      status.innerHTML='<span class="dot"></span><span>PODGLĄD TWARZY — KLIKNIJ „GENERUJ TEST AVATARA” DLA WERSJI AI</span>';
    }
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const c=document.getElementById('content');
    if(c)new MutationObserver(()=>setTimeout(renderPreview,30)).observe(c,{childList:true,subtree:true});
    document.querySelectorAll('.nav-item[data-view="avatar"],.nav-item[data-view="ai-avatar"]').forEach(a=>a.addEventListener('click',()=>setTimeout(renderPreview,120)));
    setTimeout(renderPreview,180);
  });
})();