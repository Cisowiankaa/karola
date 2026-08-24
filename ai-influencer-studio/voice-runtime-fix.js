(() => {
  const q=s=>document.querySelector(s);
  const toast=t=>window.showToast?window.showToast(t):alert(t);
  const style=document.createElement('style');
  style.textContent=`
    .voice-runtime-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:12px;padding:11px 12px;border:1px solid #e5e7ef;border-radius:12px;background:#fafafe}
    .voice-runtime-status{font-size:9px;font-weight:800;color:#5f6675;margin-left:auto}.voice-runtime-status.ready{color:#267247}.voice-runtime-status.speaking{color:#6546d8}.voice-runtime-status.error{color:#a63d3d}
  `;document.head.appendChild(style);

  function langCode(v){return v==='English'?'en-US':v==='Deutsch'?'de-DE':'pl-PL'}
  function rateFor(v){return v==='Spokojne'?0.86:v==='Dynamiczne'?1.12:1}
  function pickVoice(lang){
    const voices=speechSynthesis.getVoices();
    return voices.find(v=>v.lang===lang&&/female|woman|zosia|ewa|anna|monika/i.test(v.name))||voices.find(v=>v.lang===lang)||voices.find(v=>v.lang?.startsWith(lang.slice(0,2)))||null;
  }
  function enhance(){
    const prep=q('#vcPrep'),out=q('#vcOut'),script=q('#vcScript');
    if(!prep||!out||!script||prep.dataset.voiceRuntimeBound)return;
    prep.dataset.voiceRuntimeBound='1';
    const bar=document.createElement('div');bar.className='voice-runtime-bar';
    bar.innerHTML='<button class="primary" id="vcPlay">▶ Odtwórz głos</button><button class="ghost" id="vcStop">■ Stop</button><span id="vcRuntimeStatus" class="voice-runtime-status">GŁOS LOKALNY GOTOWY</span>';
    out.insertAdjacentElement('afterend',bar);
    const status=q('#vcRuntimeStatus');
    q('#vcPlay').onclick=()=>{
      if(!('speechSynthesis' in window)){status.textContent='BRAK OBSŁUGI SYNTEZY MOWY';status.className='voice-runtime-status error';toast('Ta przeglądarka nie obsługuje odtwarzania głosu');return}
      const text=script.value.trim()||out.textContent.replace(/^\[[^\n]+\]\s*/,'').trim();
      if(!text){toast('Wpisz tekst próbny');return}
      speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(text);
      const lang=langCode(q('#vcLang')?.value||'Polski');u.lang=lang;u.rate=rateFor(q('#vcPace')?.value||'Naturalne');u.pitch=1.02;
      const v=pickVoice(lang);if(v)u.voice=v;
      u.onstart=()=>{status.textContent='ODTWARZANIE GŁOSU…';status.className='voice-runtime-status speaking'};
      u.onend=()=>{status.textContent='GŁOS GOTOWY';status.className='voice-runtime-status ready'};
      u.onerror=()=>{status.textContent='BŁĄD ODTWARZANIA';status.className='voice-runtime-status error'};
      speechSynthesis.speak(u);
    };
    q('#vcStop').onclick=()=>{if('speechSynthesis' in window)speechSynthesis.cancel();status.textContent='ZATRZYMANO';status.className='voice-runtime-status'};
    status.className='voice-runtime-status ready';
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const c=document.getElementById('content');if(c)new MutationObserver(()=>setTimeout(enhance,0)).observe(c,{childList:true,subtree:true});
    document.querySelectorAll('.nav-item[data-view="voice"]').forEach(a=>a.addEventListener('click',()=>setTimeout(enhance,40)));
    if('speechSynthesis' in window)speechSynthesis.getVoices();
    setTimeout(enhance,100);
  });
})();