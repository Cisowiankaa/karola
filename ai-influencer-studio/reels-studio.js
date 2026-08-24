(() => {
  const q=s=>document.querySelector(s);
  const content=()=>document.getElementById('content');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const toast=t=>window.showToast?window.showToast(t):alert(t);
  const setHead=(title,sub)=>{const a=q('#pageTitle'),b=q('#pageSubtitle');if(a)a.textContent=title;if(b)b.textContent=sub};

  const style=document.createElement('style');
  style.textContent=`
    .reels-pro-grid{display:grid;grid-template-columns:minmax(330px,.9fr) minmax(380px,1.1fr);gap:14px}.rp-card{background:#fff;border:1px solid #e7e9f1;border-radius:16px;padding:18px}.rp-form{display:grid;gap:10px}.rp-form label{display:grid;gap:5px;font-size:9px;font-weight:800;color:#707786}.rp-form input,.rp-form textarea,.rp-form select{width:100%;box-sizing:border-box;border:1px solid #dde1ea;border-radius:10px;padding:10px 11px;background:#fbfbfd;color:#232733;font:inherit}.rp-form textarea{min-height:92px;resize:vertical}.rp-two{display:grid;grid-template-columns:1fr 1fr;gap:9px}.rp-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.rp-step{display:grid;grid-template-columns:58px 1fr;gap:10px;padding:11px 0;border-bottom:1px solid #eceef4}.rp-time{font-weight:900;color:#6848dd}.rp-step b{display:block;margin-bottom:3px}.rp-step p{margin:0;color:#6f7684;font-size:9px;line-height:1.45}.rp-score{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}.rp-score div{border:1px solid #eceef4;border-radius:12px;padding:10px;background:#fafafe}.rp-score b{font-size:17px;display:block}.rp-score span{font-size:8px;color:#7a8190}.rp-output{background:#fafafe;border:1px dashed #d9ddea;border-radius:12px;padding:13px;white-space:pre-wrap;line-height:1.55;font-size:9px}.rp-tag{display:inline-flex;padding:5px 8px;border-radius:999px;background:#f1edff;color:#6746db;font-size:8px;font-weight:900}.rp-checks{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px}.rp-check{border:1px solid #e8eaf1;border-radius:10px;padding:9px;font-size:8px;background:#fff}.rp-ready{color:#18885f;font-weight:900}@media(max-width:900px){.reels-pro-grid,.rp-two,.rp-score,.rp-checks{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function buildTimeline(topic,len,goal,style,voice,avatar){
    const seconds=parseInt(len,10)||30;
    const hook=Math.min(3,seconds);
    const mid1=Math.max(hook+3,Math.round(seconds*.35));
    const mid2=Math.max(mid1+3,Math.round(seconds*.72));
    return [
      {time:`0–${hook} s`,title:'HOOK',text:`„Nie spodziewałam się, że ${topic} zrobi aż taką różnicę.”`},
      {time:`${hook}–${mid1} s`,title:'UJĘCIE 1 · PROBLEM',text:`Szybkie wejście w temat. Pokaż produkt lub kontekst. Styl: ${style}.`},
      {time:`${mid1}–${mid2} s`,title:'UJĘCIE 2 · DEMO',text:`Pokaż użycie i jeden konkretny efekt. Avatar: ${avatar}. Głos: ${voice}.`},
      {time:`${mid2}–${seconds} s`,title:'CTA',text:goal==='Sprzedaż'?'„Sprawdź szczegóły i zobacz, czy to rozwiązanie jest dla Ciebie.”':'„Chcesz pełną wersję albo część 2? Napisz w komentarzu.”'}
    ];
  }

  function render(){
    setHead('Generator Reels Pro','Avatar DNA → scenariusz → storyboard → napisy → CTA → eksport produkcyjny.');
    const avatar=read('aii-avatar-dna',{name:'Nova',style:'Premium beauty + natural UGC'});
    const voice=read('aii-voice-dna',{language:'Polski',pace:'Naturalne',emotion:'Ciepła pewność siebie'});
    const last=read('aii-reels-project',{topic:'',length:'30 s',goal:'Zaangażowanie',style:'UGC natural',platform:'Instagram Reels'});
    content().innerHTML=`<section class="creator-tool-hero"><div><div class="eyebrow">SHORT VIDEO ENGINE PRO</div><h2>Generator Reels Pro</h2><p>Pełny workflow produkcji krótkiego filmu z zapisanym Avatar DNA i Voice DNA.</p></div><span class="tag">PRODUCTION READY</span></section><section class="reels-pro-grid"><div class="rp-card"><span class="rp-tag">1 · BRIEF</span><div class="rp-form" style="margin-top:12px"><label>Temat / produkt<textarea id="rpTopic" placeholder="Np. test serum, unboxing, recenzja książki...">${esc(last.topic)}</textarea></label><div class="rp-two"><label>Długość<select id="rpLen"><option>15 s</option><option>30 s</option><option>45 s</option><option>60 s</option></select></label><label>Cel<select id="rpGoal"><option>Zaangażowanie</option><option>Sprzedaż</option><option>UGC</option><option>Recenzja</option></select></label></div><div class="rp-two"><label>Platforma<select id="rpPlatform"><option>Instagram Reels</option><option>TikTok</option><option>YouTube Shorts</option></select></label><label>Styl<select id="rpStyle"><option>UGC natural</option><option>Beauty premium</option><option>Editorial</option><option>Dynamic product demo</option></select></label></div><label>Obowiązkowe informacje / claimy<textarea id="rpClaims" placeholder="Np. nazwa produktu, benefit, kod rabatowy, #reklama..."></textarea></label></div><div class="rp-actions"><button class="primary" id="rpBuild">Generuj produkcję</button><button class="ghost" id="rpSave">Zapisz projekt</button></div><div class="rp-checks"><div class="rp-check"><b>Avatar DNA</b><br><span class="rp-ready">✓ ${esc(avatar.name||'zapisany')}</span></div><div class="rp-check"><b>Voice DNA</b><br><span class="rp-ready">✓ ${esc(voice.language||'Polski')} · ${esc(voice.pace||'Naturalne')}</span></div></div></div><div class="rp-card"><div class="rp-score"><div><b id="rpHookScore">92</b><span>Hook</span></div><div><b id="rpPaceScore">88</b><span>Pacing</span></div><div><b id="rpCtaScore">90</b><span>CTA</span></div><div><b id="rpReadyScore">94%</b><span>Gotowość</span></div></div><div id="rpTimeline"><div class="rp-output">Uzupełnij brief i kliknij „Generuj produkcję”.</div></div><div class="rp-output" id="rpCaption" style="margin-top:12px">Napisy i opis publikacji pojawią się tutaj.</div><div class="rp-actions"><button class="ghost" id="rpCopy">Kopiuj pakiet</button><button class="ghost" id="rpTask">Dodaj do zadań</button></div></div></section>`;
    q('#rpLen').value=last.length||'30 s';q('#rpGoal').value=last.goal||'Zaangażowanie';q('#rpStyle').value=last.style||'UGC natural';q('#rpPlatform').value=last.platform||'Instagram Reels';
    let packageText='';
    const collect=()=>({topic:q('#rpTopic').value.trim(),length:q('#rpLen').value,goal:q('#rpGoal').value,style:q('#rpStyle').value,platform:q('#rpPlatform').value,claims:q('#rpClaims').value.trim()});
    const build=()=>{
      const v=collect();const topic=v.topic||'wybrany produkt';
      const timeline=buildTimeline(topic,v.length,v.goal,v.style,`${voice.language||'Polski'} / ${voice.pace||'Naturalne'}`,avatar.name||'AI Avatar');
      q('#rpTimeline').innerHTML=timeline.map(x=>`<div class="rp-step"><div class="rp-time">${esc(x.time)}</div><div><b>${esc(x.title)}</b><p>${esc(x.text)}</p></div></div>`).join('');
      const subtitles=timeline.map(x=>`${x.time}  ${x.title}: ${x.text}`).join('\n');
      const caption=`${topic}\n\n${v.goal==='Sprzedaż'?'Konkretnie, bez zbędnego przedłużania — pokazuję jak działa i dla kogo ma sens.':'Krótko, konkretnie i bez upiększania efektu.'}\n\n${v.claims?`Wymagania: ${v.claims}\n\n`:''}CTA: ${v.goal==='Sprzedaż'?'Sprawdź szczegóły.':'Chcesz część 2? Daj znać w komentarzu.'}\n\n#reels #ugc #creator #content #socialmedia`;
      q('#rpCaption').textContent=`NAPISY DO FILMU\n${subtitles}\n\nOPIS PUBLIKACJI\n${caption}`;
      packageText=`REELS PRODUCTION PACK\nPlatforma: ${v.platform}\nDługość: ${v.length}\nCel: ${v.goal}\nStyl: ${v.style}\nAvatar: ${avatar.name||'AI Avatar'}\nVoice: ${voice.language||'Polski'} / ${voice.pace||'Naturalne'} / ${voice.emotion||''}\n\nSTORYBOARD\n${subtitles}\n\nCAPTION\n${caption}`;
      const hook=Math.min(99,88+(topic.length%10));const pacing=v.length==='60 s'?84:v.length==='15 s'?96:91;const cta=v.goal==='Sprzedaż'?95:91;const ready=Math.round((hook+pacing+cta+94)/4);
      q('#rpHookScore').textContent=hook;q('#rpPaceScore').textContent=pacing;q('#rpCtaScore').textContent=cta;q('#rpReadyScore').textContent=ready+'%';
      save('aii-reels-project',v);save('aii-reels-last-pack',{...v,packageText,ts:Date.now()});toast('Pakiet Reels wygenerowany');
    };
    q('#rpBuild').onclick=build;
    q('#rpSave').onclick=()=>{save('aii-reels-project',collect());toast('Projekt Reels zapisany')};
    q('#rpCopy').onclick=async()=>{if(!packageText)build();try{await navigator.clipboard.writeText(packageText);toast('Pakiet Reels skopiowany')}catch{toast('Nie udało się skopiować')}};
    q('#rpTask').onclick=()=>{const tasks=read('aii-reels-tasks',[]);const v=collect();tasks.unshift({id:Date.now(),title:`Reels: ${v.topic||'nowy materiał'}`,status:'Do zrobienia',createdAt:new Date().toISOString()});save('aii-reels-tasks',tasks.slice(0,50));toast('Dodano do zadań produkcyjnych')};
  }

  function bind(){
    document.querySelectorAll('.nav-item[data-view="reels"],.nav-item[data-view="reels-generator"]').forEach(a=>{
      if(a.dataset.reelsProBound)return;a.dataset.reelsProBound='1';
      a.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();localStorage.setItem('aii-last-view',a.dataset.view);setTimeout(render,0)},true);
    });
  }
  document.addEventListener('DOMContentLoaded',()=>{bind();new MutationObserver(bind).observe(document.querySelector('.nav'),{childList:true,subtree:true});const last=localStorage.getItem('aii-last-view');if(last==='reels'||last==='reels-generator')setTimeout(render,40)});
})();