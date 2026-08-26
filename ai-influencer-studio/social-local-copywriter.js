(() => {
  const PLAN='aii-social-local-month-plan';
  const DRAFTS='aii-social-local-drafts';
  const q=(s,r=document)=>r.querySelector(s);
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const toast=t=>window.showToast?window.showToast(t):null;

  const style=document.createElement('style');
  style.textContent=`
    .local-copywriter{margin-top:12px;padding:12px;border:1px solid #dfe8f5;border-radius:12px;background:#fbfdff}.local-copywriter-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.local-copywriter-head b{font-size:9.5px}.local-copywriter-head span{display:block;font-size:7px;color:#777f8d;margin-top:3px}.local-copywriter-actions{display:flex;gap:7px;flex-wrap:wrap}.local-drafts{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:10px}.local-draft{padding:10px;border:1px solid #e8edf4;border-radius:10px;background:#fff}.local-draft em{font-style:normal;font-size:6.5px;color:#777f8d;font-weight:900;text-transform:uppercase}.local-draft strong{display:block;font-size:9px;margin-top:4px}.local-draft p{font-size:7px;line-height:1.5;color:#5f6672;white-space:pre-line;max-height:170px;overflow:auto}.local-draft button{margin-top:7px}.local-token-badge{display:inline-flex;padding:4px 7px;border-radius:999px;background:#edf8f1;color:#287a4b;font-size:6.8px;font-weight:900}@media(max-width:800px){.local-drafts{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const BODY={
    Post:item=>`${item.hook}\n\n${item.notes}\n\nNajważniejsze:\n• zacznij od jednego konkretu\n• pokaż przykład zamiast ogólnika\n• zakończ jedną jasną myślą\n\n${item.cta}`,
    Carousel:item=>`${item.hook}\n\nSlajd 1: mocny problem lub obietnica.\nSlajd 2: najważniejszy błąd.\nSlajd 3: proste rozwiązanie.\nSlajd 4: przykład lub porównanie.\nSlajd 5: podsumowanie.\n\nOpis: ${item.notes}\n\n${item.cta}`,
    Reels:item=>`0–3 s — HOOK\n${item.hook}\n\n3–10 s — PROBLEM\n${item.notes}\n\n10–25 s — ROZWIĄZANIE\nPokaż 2–3 krótkie kroki, każdy w osobnym ujęciu.\n\n25–35 s — DOWÓD / EFEKT\nPokaż rezultat, detal, porównanie albo konkretny przykład.\n\n35–45 s — CTA\n${item.cta}`
  };

  function hashtags(item){
    const words=String(`${item.title} ${item.notes}`).toLowerCase().replace(/[^a-ząćęłńóśźż0-9 ]/gi,' ').split(/\s+/).filter(x=>x.length>4);
    const uniq=[...new Set(words)].slice(0,5);
    return uniq.map(x=>`#${x}`).join(' ');
  }
  function draft(item){
    const type=BODY[item.type]?item.type:'Post';
    const body=BODY[type](item);
    const text=type==='Reels'?body:`${body}\n\n${hashtags(item)}`;
    return {...item,draftText:text,draftType:type,generatedLocally:true};
  }
  function buildAll(){
    const plan=read(PLAN,[]);
    const drafts=Array.isArray(plan)?plan.map(draft):[];
    save(DRAFTS,drafts);return drafts;
  }
  function getDrafts(){const d=read(DRAFTS,[]);return Array.isArray(d)&&d.length?d:buildAll()}
  async function copyText(text){
    try{await navigator.clipboard.writeText(text);toast?.('Treść skopiowana')}catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();toast?.('Treść skopiowana')}
  }
  function card(x,i){
    return `<article class="local-draft"><em>${esc(x.date)} • ${esc(x.draftType)}</em><strong>${esc(x.title)}</strong><p>${esc(x.draftText)}</p><button class="ghost local-copy-btn" type="button" data-i="${i}">Kopiuj treść</button></article>`;
  }
  function html(){
    const drafts=getDrafts().slice(0,8);
    return `<section class="local-copywriter" id="localCopywriter"><div class="local-copywriter-head"><div><b>Local Copywriter</b><span>Pełne opisy postów i scenariusze Reels 30–45 s</span></div><div class="local-copywriter-actions"><span class="local-token-badge">0 TOKENÓW</span><button class="ghost" type="button" id="localCopyRebuild">↻ Wygeneruj ponownie</button></div></div><div class="local-drafts">${drafts.map(card).join('')}</div></section>`;
  }
  function render(){
    if(localStorage.getItem('aii-last-view')!=='social')return;
    const anchor=q('#localMonthPlanner')||q('#socialPerformanceRadar');if(!anchor)return;
    q('#localCopywriter')?.remove();anchor.insertAdjacentHTML('afterend',html());
    q('#localCopyRebuild')?.addEventListener('click',()=>{buildAll();render();toast?.('Treści lokalne wygenerowane ponownie')});
    document.querySelectorAll('.local-copy-btn').forEach(b=>b.addEventListener('click',()=>{const x=getDrafts()[Number(b.dataset.i)];if(x)copyText(x.draftText)}));
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const root=q('#content');if(root)new MutationObserver(()=>setTimeout(render,80)).observe(root,{childList:true,subtree:true});
    document.addEventListener('aii:social-changed',()=>setTimeout(()=>{buildAll();render()},100));
    setTimeout(render,550);
  });
  window.AIILocalCopywriter={buildAll,getDrafts,draft,refresh:render};
})();