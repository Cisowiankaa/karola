(() => {
  const SEED_KEY='aii-content-seed';
  const CONSUMED_KEY='aii-content-seed-consumed';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const toast=t=>window.showToast?window.showToast(t):alert(t);

  function hashtags(niche,title){
    const words=(niche+' '+title).toLowerCase().replace(/[^a-ząćęłńóśźż0-9 ]/gi,' ').split(/\s+/).filter(x=>x.length>3);
    const norm=s=>s.replace(/[ąćęłńóśźż]/g,c=>({'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z'}[c]||c));
    return [...new Set(words.map(norm).map(x=>'#'+x)), '#reels', '#inspiracja', '#porady'].slice(0,5).join(' ');
  }

  function makePackage(seed,type){
    const niche=seed.niche||'wybrana nisza';
    const title=seed.title||'Nowy pomysł na treść';
    const brief=seed.brief||'';
    const hook=type==='reels'
      ? `Jeśli interesuje Cię ${niche}, tego błędu lepiej nie popełniać.`
      : `${title} — konkretnie, bez lania wody.`;
    const cta=type==='reels'
      ? 'Zapisz ten materiał i napisz w komentarzu, czy chcesz część 2.'
      : 'Zapisz post na później i daj znać, który punkt mam rozwinąć.';
    return {hook,cta,hashtags:hashtags(niche,title),details:`Nisza: ${niche}. Pomysł: ${title}. Brief: ${brief}. Hook: ${hook}. CTA: ${cta}. Hashtagi: ${hashtags(niche,title)}`};
  }

  function seedId(seed){return String(seed.createdAt||'')+'|'+String(seed.title||'')+'|'+String(seed.niche||'')}

  function fillPost(seed){
    const topic=document.getElementById('ppTopic');
    if(!topic)return false;
    const pack=makePackage(seed,'post');
    topic.value=`${seed.title} — ${seed.niche}`;
    const details=document.getElementById('ppDetails');
    if(details)details.value=pack.details;
    const type=document.getElementById('ppType');
    if(type){
      const preferred=[...type.options].find(o=>/informacyjny|edukacyjny/i.test(o.text));
      if(preferred){type.value=preferred.value;type.dispatchEvent(new Event('change',{bubbles:true}));}
    }
    const tone=document.getElementById('ppTone');if(tone&&[...tone.options].some(o=>o.value==='Ekspercki'))tone.value='Ekspercki';
    const goal=document.getElementById('ppGoal');if(goal&&[...goal.options].some(o=>o.value==='Informacyjny'))goal.value='Informacyjny';
    document.getElementById('ppGenerate')?.click();
    toast('Pomysł z Generatora nisz został wypełniony w poście');
    return true;
  }

  function fillReels(seed){
    const topic=document.getElementById('rpTopic');
    if(!topic)return false;
    const pack=makePackage(seed,'reels');
    topic.value=`${seed.title} — ${seed.niche}`;
    const claims=document.getElementById('rpClaims');if(claims)claims.value=pack.details;
    const len=document.getElementById('rpLen');if(len&&[...len.options].some(o=>o.value==='30 s'))len.value='30 s';
    const goal=document.getElementById('rpGoal');if(goal&&[...goal.options].some(o=>o.value==='Zaangażowanie'))goal.value='Zaangażowanie';
    const style=document.getElementById('rpStyle');if(style&&[...style.options].some(o=>o.value==='UGC natural'))style.value='UGC natural';
    document.getElementById('rpBuild')?.click();
    toast('Pomysł z Generatora nisz został wypełniony w Reels');
    return true;
  }

  function tryConsume(){
    const seed=read(SEED_KEY,null);if(!seed)return;
    const id=seedId(seed);if(read(CONSUMED_KEY,'')===id)return;
    const lastView=localStorage.getItem('aii-last-view');
    let ok=false;
    if(lastView==='posts' || document.getElementById('ppTopic')) ok=fillPost(seed);
    else if(lastView==='reels' || lastView==='reels-generator' || document.getElementById('rpTopic')) ok=fillReels(seed);
    if(ok)save(CONSUMED_KEY,id);
  }

  document.addEventListener('DOMContentLoaded',()=>{
    tryConsume();
    const root=document.getElementById('content');
    if(root)new MutationObserver(()=>setTimeout(tryConsume,20)).observe(root,{childList:true,subtree:true});
  });
  document.addEventListener('click',()=>setTimeout(tryConsume,40));
  window.AIIContentSeedHandoff={tryConsume,makePackage};
})();
