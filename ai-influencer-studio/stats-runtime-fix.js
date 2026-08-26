(() => {
  const q=(s,r=document)=>r.querySelector(s);
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const QUEUE='aii-social-queue';
  const PROFILES='aii-social-profiles';

  function detectedMode(){
    if(!navigator.onLine)return 'OFFLINE';
    const el=q('#systemStatus');
    const detected=el?.dataset?.detectedMode;
    if(detected==='online-ai')return 'ONLINE + AI';
    if(detected==='online-local')return 'ONLINE bez AI';
    if(detected==='offline')return 'OFFLINE';
    return window.AII_RUNTIME_HEALTH?.ai?.ok?'ONLINE + AI':'ONLINE bez AI';
  }
  function metrics(){
    const profiles=read(PROFILES,[]),queue=read(QUEUE,[]);
    const published=queue.filter(x=>String(x.status||'').toLowerCase()==='opublikowany');
    const likes=published.reduce((s,x)=>s+(Number(x.likes)||0),0);
    const comments=published.reduce((s,x)=>s+(Number(x.comments)||0),0);
    const followers=profiles.reduce((s,p)=>s+(Number(p.followers)||0),0);
    const reels=published.filter(x=>String(x.type||'').toLowerCase()==='reels').length;
    const er=followers>0?((likes+comments)/followers*100):0;
    return {followers,published:published.length,likes,comments,reels,er};
  }
  function html(){
    const m=metrics(),mode=detectedMode();
    const aiOff=mode!=='ONLINE + AI';
    return `<section class="card panel-card"><div class="section-head"><div><h2>Statystyki</h2><p class="page-subtitle">Rzeczywiste dane z zapisanych i zsynchronizowanych publikacji.</p></div><span class="tag">${esc(mode)}</span></div>
      <section class="metrics-grid">
        <article class="card metric-card"><div class="metric-label">Obserwujący</div><div class="metric-value">${m.followers.toLocaleString('pl-PL')}</div><div class="metric-change">Z zapisanych profili</div></article>
        <article class="card metric-card"><div class="metric-label">Publikacje</div><div class="metric-value">${m.published}</div><div class="metric-change">Opublikowane</div></article>
        <article class="card metric-card"><div class="metric-label">Polubienia</div><div class="metric-value">${m.likes.toLocaleString('pl-PL')}</div><div class="metric-change">Łącznie</div></article>
        <article class="card metric-card"><div class="metric-label">Komentarze</div><div class="metric-value">${m.comments.toLocaleString('pl-PL')}</div><div class="metric-change">Łącznie</div></article>
        <article class="card metric-card"><div class="metric-label">Reels</div><div class="metric-value">${m.reels}</div><div class="metric-change">Opublikowane</div></article>
        <article class="card metric-card"><div class="metric-label">ER orientacyjny</div><div class="metric-value">${m.er.toFixed(2)}%</div><div class="metric-change">Interakcje / obserwujący</div></article>
      </section>
      <div class="kpi-line"><span>Status</span><b>Aktywny</b></div>
      <div class="kpi-line"><span>Tryb</span><b>${esc(mode)}</b></div>
      <div class="kpi-line"><span>AI</span><b>${aiOff?'Niewymagane — statystyki działają lokalnie':'Dostępne, ale niewymagane'}</b></div>
      <p class="page-subtitle" style="margin-top:10px">Ten moduł nie wymaga tokenów OpenAI. Dane i podstawowe obliczenia pozostają dostępne także w trybie lokalnym.</p>
    </section>`;
  }
  function render(){
    const active=q('.nav-item.active')?.dataset?.view;
    if(active!=='stats' && localStorage.getItem('aii-last-view')!=='stats')return;
    const content=q('#content');if(!content)return;
    content.innerHTML=html();
  }
  document.addEventListener('click',e=>{const a=e.target.closest?.('.nav-item[data-view="stats"]');if(a)setTimeout(render,20)});
  document.addEventListener('DOMContentLoaded',()=>setTimeout(render,350));
  window.addEventListener('online',()=>setTimeout(render,50));
  window.addEventListener('offline',()=>setTimeout(render,50));
  const obs=new MutationObserver(()=>{const a=q('.nav-item.active')?.dataset?.view;if(a==='stats'&&!q('#content .metrics-grid'))setTimeout(render,10)});
  document.addEventListener('DOMContentLoaded',()=>{const c=q('#content');if(c)obs.observe(c,{childList:true,subtree:false})});
  window.AIIStatsRuntimeFix={refresh:render,mode:detectedMode,metrics};
})();