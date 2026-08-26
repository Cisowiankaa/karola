(() => {
  const HISTORY='aii-social-growth-history';
  const QUEUE='aii-social-queue';
  const PROFILES='aii-social-profiles';
  const q=(s,r=document)=>r.querySelector(s);
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const num=v=>Number.isFinite(Number(v))?Number(v):0;
  const fmt=n=>new Intl.NumberFormat('pl-PL',{notation:Math.abs(Number(n)||0)>=10000?'compact':'standard',maximumFractionDigits:1}).format(Number(n)||0);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  const style=document.createElement('style');
  style.textContent=`
    .stats-trends90{padding:14px;border:1px solid #e7e9f1;border-radius:15px;background:#fff}.stats-trends90-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.stats-trends90-head b{font-size:10px}.stats-trends90-head span{display:block;font-size:7px;color:#777f8d;margin-top:3px}.stats-range-tabs{display:flex;gap:5px;flex-wrap:wrap}.stats-range-tabs button{border:1px solid #e2e4ec;background:#fff;border-radius:999px;padding:5px 8px;font-size:7px;cursor:pointer}.stats-range-tabs button.active{background:#242333;color:#fff;border-color:#242333}.stats-trend-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.stats-trend-box{padding:10px;border:1px solid #eceef5;border-radius:11px;background:#fafafe}.stats-trend-box span{display:block;font-size:7px;color:#777f8d}.stats-trend-box strong{display:block;font-size:15px;margin-top:4px}.stats-trend-chart{height:120px;display:flex;align-items:end;gap:3px;margin-top:12px;padding:8px 4px 0;border-bottom:1px solid #eceef5}.stats-trend-bar{flex:1;min-width:2px;max-width:12px;border-radius:4px 4px 0 0;background:linear-gradient(180deg,#8b74f0,#5e49cf);opacity:.72}.stats-trend-caption{font-size:7px;color:#777f8d;line-height:1.45;margin-top:8px}.stats-compare{margin-top:12px;padding:11px;border:1px solid #eceef5;border-radius:12px;background:#fafafe}.stats-compare-head{display:flex;justify-content:space-between;gap:8px;align-items:center}.stats-compare-head b{font-size:9px}.stats-verdict{padding:4px 7px;border-radius:999px;font-size:6.8px;font-weight:900}.stats-verdict.up{background:#e7f7ec;color:#247447}.stats-verdict.down{background:#fdecec;color:#a13f3f}.stats-verdict.flat{background:#eef0f5;color:#666d79}.stats-compare-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:9px}.stats-compare-box{padding:9px;border:1px solid #eceef5;border-radius:10px;background:#fff}.stats-compare-box span{display:block;font-size:6.8px;color:#777f8d}.stats-compare-box strong{display:block;font-size:11px;margin-top:4px}.stats-delta-up{color:#287a4b}.stats-delta-down{color:#a13f3f}@media(max-width:700px){.stats-trend-grid,.stats-compare-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function igProfile(){
    const p=read(PROFILES,[]);return (Array.isArray(p)?p:[]).find(x=>String(x.platform||'').toLowerCase()==='instagram'&&x.connected)||(Array.isArray(p)?p:[]).find(x=>String(x.platform||'').toLowerCase()==='instagram')||null;
  }
  function series(){
    const h=read(HISTORY,{}),handle=String(igProfile()?.handle||'').replace(/^@/,'').toLowerCase();
    const exact=h[`instagram:${handle}`];
    if(Array.isArray(exact))return exact.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    const key=Object.keys(h||{}).find(k=>k.startsWith('instagram:'));
    return key&&Array.isArray(h[key])?h[key].slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))):[];
  }
  function delta(s,days){
    if(!s.length)return null;const cur=s[s.length-1],target=new Date(`${cur.date}T00:00:00Z`);target.setUTCDate(target.getUTCDate()-days);const key=target.toISOString().slice(0,10),base=s.filter(x=>String(x.date)<=key).pop();if(!base)return null;const v=num(cur.followers)-num(base.followers),pct=num(base.followers)?v/num(base.followers)*100:null;return {v,pct};
  }
  function dtext(d){return d?`${d.v>0?'+':''}${fmt(d.v)}${d.pct==null?'':` (${d.pct>0?'+':''}${d.pct.toFixed(1)}%)`}`:'zbieranie danych'}
  function itemScore(x){return num(x.likes)+(num(x.comments)*4)}
  function allPublished(){return (read(QUEUE,[])||[]).filter(x=>String(x.status||'').toLowerCase()==='opublikowany'&&x.date&&(x.likes!=null||x.comments!=null));}
  function periodItems(from,to){return allPublished().filter(x=>String(x.date)>=from&&String(x.date)<=to);}
  function published(days){
    const cutoff=new Date();cutoff.setDate(cutoff.getDate()-days);const key=cutoff.toISOString().slice(0,10);
    return allPublished().filter(x=>String(x.date)>=key);
  }
  function summarize(items){return {count:items.length,score:items.reduce((s,x)=>s+itemScore(x),0),interactions:items.reduce((s,x)=>s+num(x.likes)+num(x.comments),0)};}
  function activity(days){return summarize(published(days));}
  function periodComparison(days){
    const end=new Date();end.setHours(12,0,0,0);
    const currentStart=new Date(end);currentStart.setDate(currentStart.getDate()-days+1);
    const prevEnd=new Date(currentStart);prevEnd.setDate(prevEnd.getDate()-1);
    const prevStart=new Date(prevEnd);prevStart.setDate(prevStart.getDate()-days+1);
    const day=d=>d.toISOString().slice(0,10);
    const current=summarize(periodItems(day(currentStart),day(end)));
    const previous=summarize(periodItems(day(prevStart),day(prevEnd)));
    const pct=(a,b)=>b?((a-b)/b*100):(a?100:0);
    const changes={count:pct(current.count,previous.count),interactions:pct(current.interactions,previous.interactions),score:pct(current.score,previous.score)};
    const signal=(changes.interactions*.55)+(changes.score*.35)+(changes.count*.10);
    const verdict=signal>5?{label:'LEPIEJ',cls:'up'}:signal<-5?{label:'GORZEJ',cls:'down'}:{label:'BEZ WIĘKSZEJ ZMIANY',cls:'flat'};
    return {current,previous,changes,verdict,currentRange:`${day(currentStart)} – ${day(end)}`,previousRange:`${day(prevStart)} – ${day(prevEnd)}`};
  }
  function changeText(v){return `${v>0?'+':''}${v.toFixed(1)}%`;}
  function changeClass(v){return v>0?'stats-delta-up':v<0?'stats-delta-down':'';}
  function chart(s,days){
    if(s.length<2)return '<div class="stats-empty">Brak wystarczającej historii do wykresu.</div>';
    const end=s[s.length-1],cut=new Date(`${end.date}T00:00:00Z`);cut.setUTCDate(cut.getUTCDate()-days);const key=cut.toISOString().slice(0,10),part=s.filter(x=>String(x.date)>=key);if(part.length<2)return '<div class="stats-empty">Zbieram kolejne snapshoty wzrostu.</div>';
    const vals=part.map(x=>num(x.followers)),min=Math.min(...vals),max=Math.max(...vals),range=Math.max(1,max-min);
    return `<div class="stats-trend-chart">${vals.map(v=>`<i class="stats-trend-bar" style="height:${Math.max(8,Math.round((v-min)/range*100)+8)}px" title="${esc(fmt(v))}"></i>`).join('')}</div>`;
  }
  function comparisonHtml(days){
    const c=periodComparison(days);
    return `<div class="stats-compare"><div class="stats-compare-head"><div><b>Porównanie okres do okresu</b><span>${esc(c.currentRange)} vs ${esc(c.previousRange)}</span></div><span class="stats-verdict ${c.verdict.cls}">${c.verdict.label}</span></div><div class="stats-compare-grid"><div class="stats-compare-box"><span>Publikacje</span><strong>${fmt(c.current.count)} vs ${fmt(c.previous.count)}</strong><small class="${changeClass(c.changes.count)}">${changeText(c.changes.count)}</small></div><div class="stats-compare-box"><span>Interakcje</span><strong>${fmt(c.current.interactions)} vs ${fmt(c.previous.interactions)}</strong><small class="${changeClass(c.changes.interactions)}">${changeText(c.changes.interactions)}</small></div><div class="stats-compare-box"><span>Wynik treści</span><strong>${fmt(c.current.score)} vs ${fmt(c.previous.score)}</strong><small class="${changeClass(c.changes.score)}">${changeText(c.changes.score)}</small></div></div><div class="stats-trend-caption">Werdykt liczony lokalnie z publikacji i interakcji. Brak poprzednich danych nie jest traktowany jako spadek.</div></div>`;
  }
  function renderRange(days){
    const s=series(),d=delta(s,days),a=activity(days),box=q('#statsTrends90');if(!box)return;
    box.querySelectorAll('[data-stats-range]').forEach(b=>b.classList.toggle('active',Number(b.dataset.statsRange)===days));
    const target=q('#statsTrendDynamic',box);if(target)target.innerHTML=`<div class="stats-trend-grid"><div class="stats-trend-box"><span>Wzrost obserwujących</span><strong>${esc(dtext(d))}</strong></div><div class="stats-trend-box"><span>Publikacje w okresie</span><strong>${fmt(a.count)}</strong></div><div class="stats-trend-box"><span>Interakcje w okresie</span><strong>${fmt(a.interactions)}</strong></div></div>${chart(s,days)}${comparisonHtml(days)}<div class="stats-trend-caption">Zakres ${days} dni. Dane liczone lokalnie z historii profilu i zapisanych publikacji — bez OpenAI i bez tokenów.</div>`;
  }
  function render(){
    if(localStorage.getItem('aii-last-view')!=='stats')return;const host=q('#statsStudio');if(!host)return;
    q('#statsTrends90')?.remove();
    const wrap=document.createElement('div');wrap.id='statsTrends90';wrap.className='stats-trends90';
    wrap.innerHTML='<div class="stats-trends90-head"><div><b>Trendy 7 / 30 / 90 dni</b><span>Historia wzrostu, aktywności i porównanie okresów — lokalnie, 0 tokenów</span></div><div class="stats-range-tabs"><button data-stats-range="7">7 dni</button><button data-stats-range="30">30 dni</button><button class="active" data-stats-range="90">90 dni</button></div></div><div id="statsTrendDynamic"></div>';
    const firstGrid=host.querySelector('.stats-grid');if(firstGrid)firstGrid.insertAdjacentElement('beforebegin',wrap);else host.appendChild(wrap);
    wrap.querySelectorAll('[data-stats-range]').forEach(b=>b.addEventListener('click',()=>renderRange(Number(b.dataset.statsRange))));
    renderRange(90);
  }
  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('.nav-item[data-view="stats"]').forEach(a=>a.addEventListener('click',()=>setTimeout(render,120)));
    const root=q('#content');if(root)new MutationObserver(()=>{if(localStorage.getItem('aii-last-view')==='stats'&&!q('#statsTrends90'))setTimeout(render,80)}).observe(root,{childList:true,subtree:false});
    document.addEventListener('aii:social-changed',()=>setTimeout(render,120));
    setTimeout(render,500);
  });
  window.AIIStatsTrends={refresh:render,range:renderRange,compare:periodComparison};
})();