(() => {
  const QUEUE='aii-social-queue';
  const PROFILES='aii-social-profiles';
  const HISTORY='aii-social-growth-history';
  const q=(s,r=document)=>r.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const num=v=>Number.isFinite(Number(v))?Number(v):0;
  const fmt=n=>new Intl.NumberFormat('pl-PL',{notation:Math.abs(Number(n)||0)>=10000?'compact':'standard',maximumFractionDigits:1}).format(Number(n)||0);
  const day=d=>String(d||'').slice(0,10);
  const addDays=(date,n)=>{const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};

  const style=document.createElement('style');
  style.textContent=`
    .social-performance{margin:14px 0;padding:14px;border:1px solid #e7e9f1;border-radius:14px;background:#fff}.social-performance-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.social-performance-head b{font-size:10px}.social-performance-head span{display:block;font-size:7.5px;color:#777f8d;margin-top:3px}.social-performance-grid{display:grid;grid-template-columns:1.35fr .65fr;gap:10px;margin-top:10px}.social-top-list{display:grid;gap:7px}.social-top-row{display:grid;grid-template-columns:30px minmax(0,1fr) auto;gap:9px;align-items:center;padding:9px;border:1px solid #eceef5;border-radius:10px;background:#fafafe}.social-rank{width:28px;height:28px;border-radius:9px;display:grid;place-items:center;background:#f0ecff;color:#6548d9;font-weight:900;font-size:9px}.social-top-copy{min-width:0}.social-top-copy b{display:block;font-size:8.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.social-top-copy small{display:block;font-size:7px;color:#777f8d;margin-top:3px}.social-top-score{text-align:right}.social-top-score strong{display:block;font-size:12px}.social-top-score small{display:block;font-size:7px;color:#777f8d}.social-format-list{display:grid;gap:7px}.social-format-card{padding:10px;border:1px solid #eceef5;border-radius:10px;background:#fafafe}.social-format-card b{font-size:8.5px}.social-format-card strong{display:block;font-size:15px;margin-top:4px}.social-format-card small{display:block;font-size:7px;color:#777f8d;margin-top:2px}.social-performance-note{margin-top:8px;font-size:7px;color:#777f8d;line-height:1.45}@media(max-width:900px){.social-performance-grid{grid-template-columns:1fr}}@media(max-width:600px){.social-top-row{grid-template-columns:28px 1fr}.social-top-score{grid-column:2;text-align:left}}
  `;
  document.head.appendChild(style);

  function parsePlatform(item){
    const raw=String(item?.platform||'');
    if(/^tiktok/i.test(raw))return 'tiktok';
    if(/^facebook/i.test(raw))return 'facebook';
    return 'instagram';
  }
  function extractHandle(item){
    const m=String(item?.platform||'').match(/@([A-Za-z0-9._-]+)/);
    return m?`@${m[1]}`:'';
  }
  function profileFor(item){
    const platform=parsePlatform(item),handle=extractHandle(item).toLowerCase();
    const profiles=read(PROFILES,[]);
    return profiles.find(p=>String(p.platform||'').toLowerCase()===platform&&(handle?String(p.handle||'').toLowerCase()===handle:true))||profiles.find(p=>String(p.platform||'').toLowerCase()===platform)||null;
  }
  function historyKey(platform,handle){return `${platform}:${String(handle||'').replace(/^@/,'').toLowerCase()}`}
  function followerDelta72(item){
    const platform=parsePlatform(item),handle=extractHandle(item)||profileFor(item)?.handle||'';
    if(!handle||!item?.date)return null;
    const series=read(HISTORY,{})[historyKey(platform,handle)]||[];
    if(!Array.isArray(series)||series.length<2)return null;
    const date=day(item.date),target=addDays(date,3);
    const ordered=series.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    const before=ordered.filter(x=>x.date<=date).pop();
    const after=ordered.find(x=>x.date>=target);
    if(!before||!after)return null;
    return num(after.followers)-num(before.followers);
  }
  function metrics(item){
    const likes=num(item.likes),comments=num(item.comments),score=likes+(comments*4);
    const followers=num(profileFor(item)?.followers);
    const er=followers>0?((likes+comments)/followers)*100:null;
    return {likes,comments,score,er,delta72:followerDelta72(item)};
  }
  function published(){
    return read(QUEUE,[]).filter(x=>String(x.status||'').toLowerCase()==='opublikowany'&&(x.likes!=null||x.comments!=null));
  }
  function topItems(){
    return published().map(x=>({...x,_m:metrics(x)})).sort((a,b)=>b._m.score-a._m.score||String(b.date||'').localeCompare(String(a.date||''))).slice(0,5);
  }
  function formatStats(){
    const groups={};
    published().forEach(x=>{const type=String(x.type||'Post');const m=metrics(x);const g=groups[type]||(groups[type]={type,count:0,score:0,er:0,erCount:0});g.count++;g.score+=m.score;if(m.er!=null){g.er+=m.er;g.erCount++}});
    return Object.values(groups).map(g=>({...g,avgScore:g.count?g.score/g.count:0,avgEr:g.erCount?g.er/g.erCount:null})).sort((a,b)=>b.avgScore-a.avgScore).slice(0,4);
  }
  function sign(v){return v>0?'+':''}
  function row(item,i){
    const m=item._m,delta=m.delta72==null?'brak historii':`${sign(m.delta72)}${fmt(m.delta72)} obserw. / 72 h`;
    const er=m.er==null?'ER —':`ER ~${m.er.toFixed(2)}%`;
    return `<div class="social-top-row"><div class="social-rank">${i+1}</div><div class="social-top-copy"><b>${esc(item.title||'Bez tytułu')}</b><small>${esc(item.type||'Post')} • ${esc(item.date||'')} • ❤️ ${fmt(m.likes)} • 💬 ${fmt(m.comments)} • ${esc(er)} • ${esc(delta)}</small></div><div class="social-top-score"><strong>${fmt(m.score)}</strong><small>wynik</small></div></div>`;
  }
  function formatCard(g,i){
    return `<div class="social-format-card"><b>${i===0?'🏆 ':''}${esc(g.type)}</b><strong>${g.avgScore.toFixed(1)}</strong><small>średni wynik • ${g.count} treści${g.avgEr!=null?` • ER ~${g.avgEr.toFixed(2)}%`:''}</small></div>`;
  }
  function html(){
    const top=topItems(),formats=formatStats();
    return `<section class="social-performance" id="socialPerformanceRadar"><div class="social-performance-head"><div><b>Performance Radar</b><span>Najlepiej działające opublikowane treści i formaty</span></div><button class="ghost" type="button" id="socialPerformanceRefresh">↻ Odśwież</button></div><div class="social-performance-grid"><div><div class="social-top-list">${top.length?top.map(row).join(''):'<div class="social-performance-note">Brak zsynchronizowanych publikacji z polubieniami/komentarzami.</div>'}</div></div><div><div class="social-format-list">${formats.length?formats.map(formatCard).join(''):'<div class="social-performance-note">Za mało danych do porównania formatów.</div>'}</div></div></div><div class="social-performance-note">Wynik = polubienia + 4× komentarze. ER jest orientacyjny względem bieżącej liczby obserwujących. Zmiana obserwujących w 72 h jest korelacją czasową i może obejmować wpływ innych publikacji.</div></section>`;
  }
  function render(){
    if(localStorage.getItem('aii-last-view')!=='social')return;
    const anchor=q('#socialApifyBox')||q('#socialConnectHub')||q('.social-sync-panel');
    if(!anchor)return;
    q('#socialPerformanceRadar')?.remove();
    anchor.insertAdjacentHTML('afterend',html());
    q('#socialPerformanceRefresh')?.addEventListener('click',render);
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const root=q('#content');if(root)new MutationObserver(()=>setTimeout(render,40)).observe(root,{childList:true,subtree:true});
    document.addEventListener('aii:social-changed',()=>setTimeout(render,40));
    setTimeout(render,300);
  });
  window.AIISocialPerformance={refresh:render};
})();