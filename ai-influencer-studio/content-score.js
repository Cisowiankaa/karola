(() => {
  const q=(s,r=document)=>r.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const clamp=n=>Math.max(0,Math.min(100,Math.round(n)));

  const style=document.createElement('style');
  style.textContent=`
    .content-score-card{margin-top:12px;padding:12px;border:1px solid #e7e9f1;border-radius:14px;background:#fff}.content-score-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.content-score-head b{font-size:9.5px}.content-score-head span{display:block;font-size:7px;color:#777f8d;margin-top:3px}.content-score-value{font-size:24px;font-weight:900}.content-score-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:10px}.content-score-box{padding:9px;border:1px solid #eceef5;border-radius:10px;background:#fafafe}.content-score-box span{display:block;font-size:6.8px;color:#777f8d}.content-score-box strong{display:block;font-size:12px;margin-top:4px}.content-score-note{margin-top:9px;padding:9px;border-radius:10px;background:#f7f6fc;font-size:7px;color:#666d79;line-height:1.45}.content-score-good{color:#287a4b}.content-score-mid{color:#9a6a16}.content-score-low{color:#a13f3f}@media(max-width:700px){.content-score-grid{grid-template-columns:1fr 1fr}}
  `;
  document.head.appendChild(style);

  function textOf(root){
    const hook=q('[data-hook],#postHook,#reelHook,.post-hook,.reel-hook',root)?.value||q('[data-hook],#postHook,#reelHook,.post-hook,.reel-hook',root)?.textContent||'';
    const cta=q('[data-cta],#postCta,#reelCta,.post-cta,.reel-cta',root)?.value||q('[data-cta],#postCta,#reelCta,.post-cta,.reel-cta',root)?.textContent||'';
    const body=q('textarea:not([data-hook]):not([data-cta]),[contenteditable="true"],.generated-copy,.post-copy,.reel-script',root)?.value||q('textarea:not([data-hook]):not([data-cta]),[contenteditable="true"],.generated-copy,.post-copy,.reel-script',root)?.textContent||'';
    const type=(q('select[name="type"],#projectType,#contentType',root)?.value||root.dataset?.contentType||'').toLowerCase();
    return {hook:String(hook).trim(),cta:String(cta).trim(),body:String(body).trim(),type};
  }

  function analyze(input={}){
    const hook=String(input.hook||''),cta=String(input.cta||''),body=String(input.body||''),type=String(input.type||'').toLowerCase();
    let hookScore=0;
    if(hook.length>=18)hookScore+=35;
    if(hook.length>=35&&hook.length<=120)hookScore+=25;
    if(/[?!:]/.test(hook))hookScore+=15;
    if(/\b(3|5|7|jak|dlaczego|błąd|sekret|sprawdź|zobacz|nie|warto|musisz|test)\b/i.test(hook))hookScore+=25;
    hookScore=clamp(hookScore);

    let ctaScore=0;
    if(cta.length>=10)ctaScore+=35;
    if(/komentarz|napisz|zapisz|wyślij|udostępnij|daj znać|który|która|część 2|obserwuj/i.test(cta))ctaScore+=45;
    if(/[?!]/.test(cta))ctaScore+=20;
    ctaScore=clamp(ctaScore);

    const words=body.split(/\s+/).filter(Boolean).length;
    let lengthScore=0;
    if(/reel|video/.test(type))lengthScore=words>=55&&words<=115?100:words>=35&&words<=140?70:40;
    else lengthScore=words>=55&&words<=220?100:words>=25&&words<=320?70:40;

    let formatScore=70;
    if(/reel|video/.test(type))formatScore=90;
    else if(/carousel/.test(type))formatScore=85;
    else if(/post/.test(type)||!type)formatScore=75;

    const total=clamp(hookScore*.35+ctaScore*.25+lengthScore*.25+formatScore*.15);
    const tips=[];
    if(hookScore<70)tips.push('Wzmocnij pierwsze zdanie: dodaj konkretny problem, liczbę albo pytanie.');
    if(ctaScore<70)tips.push('Dodaj jedno jasne CTA zachęcające do komentarza, zapisu lub udostępnienia.');
    if(lengthScore<70)tips.push(/reel|video/.test(type)?'Dopasuj scenariusz do około 30–45 sekund.':'Skróć lub rozwiń opis, aby był łatwiejszy do przeczytania.');
    if(formatScore<80)tips.push('Rozważ Reels lub Carousel, jeśli temat da się pokazać wizualnie.');
    if(!tips.length)tips.push('Treść ma dobry balans. Przetestuj godzinę publikacji i porównaj wynik po 24–48 h.');
    return {total,hook:hookScore,cta:ctaScore,length:lengthScore,format:formatScore,words,tips};
  }

  function cls(v){return v>=80?'content-score-good':v>=60?'content-score-mid':'content-score-low'}
  function cardHtml(s){return `<div class="content-score-card" data-content-score-card><div class="content-score-head"><div><b>Content Score — 0 tokenów</b><span>Lokalna ocena przed publikacją</span></div><div class="content-score-value ${cls(s.total)}">${s.total}/100</div></div><div class="content-score-grid"><div class="content-score-box"><span>Hook</span><strong class="${cls(s.hook)}">${s.hook}/100</strong></div><div class="content-score-box"><span>CTA</span><strong class="${cls(s.cta)}">${s.cta}/100</strong></div><div class="content-score-box"><span>Długość</span><strong class="${cls(s.length)}">${s.length}/100</strong></div><div class="content-score-box"><span>Format</span><strong class="${cls(s.format)}">${s.format}/100</strong></div></div><div class="content-score-note">${s.tips.map(x=>`• ${esc(x)}`).join('<br>')}</div></div>`}

  function enhance(root){
    if(!root||q('[data-content-score-card]',root))return;
    const data=textOf(root);
    if(!data.hook&&!data.cta&&!data.body)return;
    const score=analyze(data);
    root.insertAdjacentHTML('beforeend',cardHtml(score));
    root.querySelectorAll('input,textarea,select,[contenteditable="true"]').forEach(el=>el.addEventListener('input',()=>{
      const old=q('[data-content-score-card]',root);if(old)old.outerHTML=cardHtml(analyze(textOf(root)));
    }));
  }

  function scan(){
    document.querySelectorAll('#content .card,#content .panel-card,#content .generator-card,#content .studio-card').forEach(enhance);
  }

  document.addEventListener('DOMContentLoaded',()=>{
    const root=q('#content');if(root)new MutationObserver(()=>setTimeout(scan,80)).observe(root,{childList:true,subtree:true});
    setTimeout(scan,500);
  });
  window.AIIContentScore={analyze,scan};
})();