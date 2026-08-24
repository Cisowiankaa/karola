(() => {
  const q=s=>document.querySelector(s);
  const toast=t=>window.showToast?window.showToast(t):alert(t);
  const style=document.createElement('style');
  style.textContent=`
    .voice-runtime-panel{display:grid;gap:10px;margin-top:12px;padding:12px;border:1px solid #e5e7ef;border-radius:12px;background:#fafafe}
    .voice-runtime-controls{display:grid;grid-template-columns:minmax(220px,1.4fr) 1fr 1fr;gap:10px;align-items:end}
    .voice-runtime-controls label{display:grid;gap:5px;font-size:9px;font-weight:800;color:#646b79}.voice-runtime-controls select{width:100%;border:1px solid #dfe2eb;border-radius:9px;padding:9px;background:white}
    .voice-range{display:grid;gap:5px}.voice-range input{width:100%}.voice-range-line{display:flex;justify-content:space-between;font-size:8px;color:#777f8d}
    .voice-runtime-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.voice-runtime-status{font-size:9px;font-weight:800;color:#5f6675;margin-left:auto}.voice-runtime-status.ready{color:#267247}.voice-runtime-status.speaking{color:#6546d8}.voice-runtime-status.error{color:#a63d3d}
    .voice-presets{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.voice-preset{border:1px solid #e3e5ed;background:#fff;border-radius:11px;padding:10px;text-align:left;cursor:pointer}.voice-preset b{display:block;font-size:9px;margin-bottom:3px}.voice-preset span{font-size:8px;color:#7a8190}.voice-preset.active{border-color:#7758e8;background:#f4f0ff}
    @media(max-width:850px){.voice-runtime-controls,.voice-presets{grid-template-columns:1fr}}
  `;document.head.appendChild(style);

  const presets={
    natural:{name:'Naturalna twórczyni',rate:1,pitch:1.04,desc:'naturalny, ciepły, codzienny'},
    ugc:{name:'UGC energiczny',rate:1.17,pitch:1.08,desc:'szybszy, dynamiczny, reels'},
    beauty:{name:'Spokojny beauty',rate:.88,pitch:1.08,desc:'miękki, spokojny, premium'},
    premium:{name:'Reklamowy premium',rate:.94,pitch:.98,desc:'pewny, elegancki, sprzedażowy'}
  };
  function langCode(v){return v==='English'?'en-US':v==='Deutsch'?'de-DE':'pl-PL'}
  function preferredNames(lang){if(lang==='pl-PL')return /zosia|ewa|anna|monika|paulina|female|woman/i;if(lang==='de-DE')return /katja|anna|heda|female|woman/i;return /samantha|zira|aria|jenny|female|woman/i}
  function availableVoices(lang){const all=('speechSynthesis' in window)?speechSynthesis.getVoices():[];const exact=all.filter(v=>v.lang===lang);const prefix=all.filter(v=>v.lang?.toLowerCase().startsWith(lang.slice(0,2).toLowerCase()));const set=[...exact,...prefix,...all];return set.filter((v,i,a)=>a.findIndex(x=>x.name===v.name&&x.lang===v.lang)===i)}
  function loadSaved(){try{return JSON.parse(localStorage.getItem('aii-voice-playback')||'{}')}catch{return {}}}
  function savePrefs(){localStorage.setItem('aii-voice-playback',JSON.stringify({voice:q('#vcVoiceSelect')?.value||'',rate:Number(q('#vcRate')?.value||1),pitch:Number(q('#vcPitch')?.value||1),preset:q('.voice-preset.active')?.dataset.preset||''}))}
  function fillVoices(){const sel=q('#vcVoiceSelect');if(!sel)return;const lang=langCode(q('#vcLang')?.value||'Polski'),list=availableVoices(lang),saved=loadSaved();sel.innerHTML=list.length?list.map(v=>`<option value="${String(v.name).replace(/"/g,'&quot;')}" ${saved.voice===v.name?'selected':''}>${v.name} — ${v.lang}</option>`).join(''):'<option value="">Domyślny głos systemowy</option>';if(!saved.voice&&list.length){const preferred=list.find(v=>preferredNames(lang).test(v.name))||list[0];if(preferred)sel.value=preferred.name}}
  function enhance(){
    const prep=q('#vcPrep'),out=q('#vcOut'),script=q('#vcScript');if(!prep||!out||!script||prep.dataset.voiceRuntimeBound)return;prep.dataset.voiceRuntimeBound='1';
    const saved=loadSaved();const panel=document.createElement('div');panel.className='voice-runtime-panel';
    panel.innerHTML=`<div><b style="font-size:9px">Presety głosu</b><div class="voice-presets" style="margin-top:7px">${Object.entries(presets).map(([k,p])=>`<button class="voice-preset ${saved.preset===k?'active':''}" data-preset="${k}"><b>${p.name}</b><span>${p.desc}</span></button>`).join('')}</div></div><div class="voice-runtime-controls"><label>Głos<select id="vcVoiceSelect"><option>Ładowanie głosów…</option></select></label><div class="voice-range"><div class="voice-range-line"><b>Szybkość</b><span id="vcRateValue">${Number(saved.rate||1).toFixed(2)}×</span></div><input id="vcRate" type="range" min="0.65" max="1.45" step="0.05" value="${saved.rate||1}"></div><div class="voice-range"><div class="voice-range-line"><b>Wysokość</b><span id="vcPitchValue">${Number(saved.pitch||1).toFixed(2)}</span></div><input id="vcPitch" type="range" min="0.65" max="1.45" step="0.05" value="${saved.pitch||1}"></div></div><div class="voice-runtime-bar"><button class="primary" id="vcPlay">▶ Odtwórz głos</button><button class="ghost" id="vcStop">■ Stop</button><button class="ghost" id="vcPreview">Próbka 5 s</button><span id="vcRuntimeStatus" class="voice-runtime-status">GŁOS LOKALNY GOTOWY</span></div>`;
    out.insertAdjacentElement('afterend',panel);
    const status=q('#vcRuntimeStatus'),rate=q('#vcRate'),pitch=q('#vcPitch');
    const refreshVals=()=>{q('#vcRateValue').textContent=Number(rate.value).toFixed(2)+'×';q('#vcPitchValue').textContent=Number(pitch.value).toFixed(2);savePrefs()};rate.oninput=refreshVals;pitch.oninput=refreshVals;q('#vcVoiceSelect').onchange=savePrefs;
    document.querySelectorAll('.voice-preset').forEach(b=>b.onclick=()=>{const p=presets[b.dataset.preset];document.querySelectorAll('.voice-preset').forEach(x=>x.classList.remove('active'));b.classList.add('active');rate.value=p.rate;pitch.value=p.pitch;refreshVals();toast('Preset głosu: '+p.name)});
    fillVoices();if('speechSynthesis' in window)speechSynthesis.onvoiceschanged=fillVoices;q('#vcLang')?.addEventListener('change',()=>setTimeout(fillVoices,20));
    const speak=(sample=false)=>{if(!('speechSynthesis' in window)){status.textContent='BRAK OBSŁUGI SYNTEZY MOWY';status.className='voice-runtime-status error';toast('Ta przeglądarka nie obsługuje odtwarzania głosu');return}let text=script.value.trim()||out.textContent.replace(/^\[[^\n]+\]\s*/,'').trim();if(sample)text=(text||'Cześć! To jest próbka głosu AI w aplikacji.').slice(0,115);if(!text){toast('Wpisz tekst próbny');return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text),lang=langCode(q('#vcLang')?.value||'Polski');u.lang=lang;u.rate=Number(rate.value);u.pitch=Number(pitch.value);const voices=availableVoices(lang),selected=voices.find(v=>v.name===q('#vcVoiceSelect').value);if(selected)u.voice=selected;u.onstart=()=>{status.textContent='ODTWARZANIE GŁOSU…';status.className='voice-runtime-status speaking'};u.onend=()=>{status.textContent='GŁOS GOTOWY';status.className='voice-runtime-status ready'};u.onerror=()=>{status.textContent='BŁĄD ODTWARZANIA';status.className='voice-runtime-status error'};speechSynthesis.speak(u);savePrefs()};
    q('#vcPlay').onclick=()=>speak(false);q('#vcPreview').onclick=()=>speak(true);q('#vcStop').onclick=()=>{if('speechSynthesis' in window)speechSynthesis.cancel();status.textContent='ZATRZYMANO';status.className='voice-runtime-status'};status.className='voice-runtime-status ready';
  }
  document.addEventListener('DOMContentLoaded',()=>{const c=document.getElementById('content');if(c)new MutationObserver(()=>setTimeout(enhance,0)).observe(c,{childList:true,subtree:true});document.querySelectorAll('.nav-item[data-view="voice"]').forEach(a=>a.addEventListener('click',()=>setTimeout(enhance,40)));if('speechSynthesis' in window)speechSynthesis.getVoices();setTimeout(enhance,100)});
})();