(() => {
  const LIVE_API='/api/social-sync';
  const QUEUE='aii-social-queue';
  const PROFILES='aii-social-profiles';
  const HISTORY='aii-social-growth-history';
  const CACHE='aii-stats-live-cache';
  const q=(s,r=document)=>r.querySelector(s);
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const num=v=>Number.isFinite(Number(v))?Number(v):0;
  const fmt=n=>n==null?'—':new Intl.NumberFormat('pl-PL',{notation:Math.abs(Number(n))>=10000?'compact':'standard',maximumFractionDigits:1}).format(Number(n));
  const modeLabel=()=>({
    'online-ai':'ONLINE + AI',
    'online-local':'ONLINE bez AI',
    'offline':'OFFLINE'
  })[localStorage.getItem('aii-mode')||'online-ai']||'ONLINE';
  const toast=t=>window.showToast?window.showToast(t):null;

  const style=document.createElement('style');
  style.textContent=`
    .stats-pro{display:grid;gap:14px}.stats-hero{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:17px;border-radius:17px;background:linear-gradient(135deg,#171925,#28233b);color:#fff}.stats-hero h2{margin:4px 0 5px;color:#fff}.stats-hero p{margin:0;color:#d4d0df;font-size:9px}.stats-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.stats-status{display:inline-flex;padding:5px 8px;border-radius:999px;background:rgba(255,255,255,.11);font-size:7px;font-weight:900;white-space:nowrap}.stats-status.live{background:#dff7e8;color:#247447}.stats-status.cache{background:#fff2d8;color:#8b6519}.stats-status.local{background:#eceef5;color:#646b78}.stats-kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:9px}.stats-kpi{padding:13px;border:1px solid #e7e9f1;border-radius:14px;background:#fff}.stats-kpi span{display:block;font-size:7.5px;color:#7b8290}.stats-kpi strong{display:block;font-size:20px;margin-top:5px;color:#232631}.stats-kpi small{display:block;font-size:7px;color:#777f8d;margin-top:4px}.stats-up{color:#287a4b!important}.stats-down{color:#a13f3f!important}.stats-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:12px}.stats-card{padding:14px;border:1px solid #e7e9f1;border-radius:15px;background:#fff}.stats-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.stats-head b{font-size:10px}.stats-head span{display:block;font-size:7px;color:#777f8d;margin-top:3px}.stats-platforms{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.stats-platform{padding:11px;border:1px solid #eceef5;border-radius:11px;background:#fafafe}.stats-platform strong{display:block;font-size:18px;margin-top:4px}.stats-platform small{display:block;font-size:7px;color:#777f8d;margin-top:4px}.stats-growth{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}.stats-growth-box{padding:9px;border:1px solid #eceef5;border-radius:10px;background:#fafafe}.stats-growth-box b{display:block;font-size:13px}.stats-growth-box span{display:block;font-size:7px;color:#777f8d;margin-top:3px}.stats-chart{height:95px;display:flex;align-items:end;gap:3px;margin-top:12px;padding:8px 4px 0;border-bottom:1px solid #eceef5}.stats-bar{flex:1;min-width:3px;max-width:18px;border-radius:4px 4px 0 0;background:linear-gradient(180deg,#8b74f0,#5e49cf);opacity:.72}.stats-empty{padding:18px 4px;color:#777f8d;font-size:8px;line-height:1.5}.stats-top{display:grid;gap:7px;margin-top:10px}.stats-top-row{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:9px;align-items:center;padding:9px;border:1px solid #eceef5;border-radius:10px;background:#fafafe}.stats-rank{width:28px;height:28px;border-radius:9px;display:grid;place-items:center;background:#f0ecff;color:#6548d9;font-size:8px;font-weight:900}.stats-copy{min-width:0}.stats-copy b{display:block;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.stats-copy small{display:block;font-size:6.8px;color:#777f8d;margin-top:3px}.stats-score{text-align:right}.stats-score strong{display:block;font-size:12px}.stats-score small{display:block;font-size:6.5px;color:#777f8d}.stats-formats{display:grid;gap:7px;margin-top:10px}.stats-format{padding:9px;border:1px solid #eceef5;border-radius:10px;background:#fafafe}.stats-format-line{display:flex;justify-content:space-between;gap:8px;font-size:8px}.stats-meter{height:6px;border-radius:999px;background:#eceef5;margin-top:6px;overflow:hidden}.stats-meter i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#55d9e9,#8067ee)}.stats-note{font-size:7px;color:#777f8d;line-height:1.5;margin-top:9px}@media(max-width:1120px){.stats-kpis{grid-template-columns:repeat(3,1fr)}}@media(max-width:900px){.stats-grid{grid-template-columns:1fr}}@media(max-width:650px){.stats-kpis,.stats-platforms,.stats-growth{grid-template-columns:1fr 1fr}}@media(max-width:440px){.stats-kpis,.stats-platforms,.stats-growth{grid-template-columns:1fr}.stats-hero{display:block}.stats-actions{justify-content:flex-start;margin-top:10px}}
  `;
  document.head.appendChild(style);

  function localProfiles(){return Array.isArray(read(PROFILES,[]))?read(PROFILES,[]):[]}
  function localQueue(){return Array.isArray(read(QUEUE,[]))?read(QUEUE,[]):[]}
  function igLocal(){return localProfiles().find(x=>String(x.platform||'').toLowerCase()==='instagram'&&x.connected)||localProfiles().find(x=>String(x.platform||'').toLowerCase()==='instagram')||null}
  function ttLocal(){return localProfiles().find(x=>String(x.platform||'').toLowerCase()==='tiktok'&&x.connected)||localProfiles().find(x=>String(x.platform||'').toLowerCase()==='tiktok')||null}

  function normalizeProfile(p){
    if(!p||typeof p!=='object')return null;
    return {
      handle:p.handle||p.username||p.userName||'',
      followers:p.followers??p.followersCount??p.followerCount??null,
      posts:p.mediaCount??p.posts??p.postCount??p.videos??null,
      source:p.source||'Meta'
    };
  }
  function normalizeItem(x){
    if(!x||typeof x!=='object')return null;
    const mediaType=String(x.media_type||x.mediaType||x.type||'Post');
    return {
      id:String(x.id||x.externalId||x.permalink||`${x.timestamp||x.date||''}-${x.caption||x.title||''}`),
      title:x.title||x.caption||x.text||'Publikacja',
      date:String(x.timestamp||x.date||x.publishedAt||'').slice(0,10),
      type:/reel|video/i.test(mediaType)?'Reels':/carousel/i.test(mediaType)?'Carousel':'Post',
      likes:num(x.like_count??x.likes??x.likeCount),
      comments:num(x.comments_count??x.comments??x.commentCount),
      permalink:x.permalink||x.url||''
    };
  }
  function extractLive(data){
    const profile=normalizeProfile(data?.profile||data?.instagram?.profile||data?.sources?.instagram?.profile||data?.providers?.instagram?.profile);
    const raw=data?.items||data?.instagram?.items||data?.media||data?.posts||data?.sources?.instagram?.items||[];
    const items=(Array.isArray(raw)?raw:[]).map(normalizeItem).filter(Boolean);
    return {profile,items,raw:data};
  }
  function cachedLive(){
    const c=read(CACHE,null);return c&&c.data?{...c.data,cachedAt:c.cachedAt}:null;
  }

  function queueItems(){
    return localQueue().filter(x=>String(x.status||'').toLowerCase()==='opublikowany').map(x=>normalizeItem({...x,media_type:x.type})).filter(Boolean);
  }
  function mergeItems(live){
    const map=new Map();
    [...(live?.items||[]),...queueItems()].forEach(x=>{
      const key=x.permalink||x.id||`${x.date}-${x.title}`;
      if(!map.has(key))map.set(key,x);else{
        const a=map.get(key);map.set(key,{...a,...x,likes:Math.max(num(a.likes),num(x.likes)),comments:Math.max(num(a.comments),num(x.comments))});
      }
    });
    return [...map.values()].filter(x=>x.likes||x.comments).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  }

  function historySeries(platform,handle){
    const h=read(HISTORY,{}),needle=String(handle||'').replace(/^@/,'').toLowerCase();
    const exact=h[`${platform}:${needle}`];
    if(Array.isArray(exact))return exact.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    const key=Object.keys(h).find(k=>k.startsWith(`${platform}:`));
    return key&&Array.isArray(h[key])?h[key].slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))):[];
  }
  function delta(series,days){
    if(!series.length)return null;
    const current=series[series.length-1];
    const target=new Date(`${current.date}T00:00:00Z`);target.setUTCDate(target.getUTCDate()-days);
    const key=target.toISOString().slice(0,10),base=series.filter(x=>String(x.date)<=key).pop();
    if(!base)return null;
    const d=num(current.followers)-num(base.followers),pct=num(base.followers)>0?d/num(base.followers)*100:null;
    return {value:d,pct};
  }
  const deltaText=d=>d==null?'zbieranie danych':`${d.value>0?'+':''}${fmt(d.value)}${d.pct==null?'':` (${d.pct>0?'+':''}${d.pct.toFixed(1)}%)`}`;
  const deltaClass=d=>d?.value>0?'stats-up':d?.value<0?'stats-down':'';

  function aggregate(live){
    const ig=live?.profile||normalizeProfile(igLocal())||{handle:'',followers:null,posts:null,source:'lokalne'};
    const tt=normalizeProfile(ttLocal());
    const items=mergeItems(live);
    const totalLikes=items.reduce((s,x)=>s+num(x.likes),0),totalComments=items.reduce((s,x)=>s+num(x.comments),0);
    const followers=num(ig.followers);
    const avgEr=followers&&items.length?items.reduce((s,x)=>s+((num(x.likes)+num(x.comments))/followers*100),0)/items.length:null;
    const reels=items.filter(x=>x.type==='Reels').length;
    const igHistory=historySeries('instagram',ig.handle),ttHistory=historySeries('tiktok',tt?.handle);
    return {ig,tt,items,totalLikes,totalComments,totalInteractions:totalLikes+totalComments,avgEr,reels,igHistory,ttHistory,g7:delta(igHistory,7),g30:delta(igHistory,30),tt7:delta(ttHistory,7),tt30:delta(ttHistory,30)};
  }
  function score(x){return num(x.likes)+(num(x.comments)*4)}
  function top(items){return items.slice().sort((a,b)=>score(b)-score(a)).slice(0,5)}
  function formatStats(items){
    const groups={};items.forEach(x=>{const k=x.type||'Post',g=groups[k]||(groups[k]={type:k,count:0,total:0,interactions:0});g.count++;g.total+=score(x);g.interactions+=num(x.likes)+num(x.comments)});
    return Object.values(groups).map(g=>({...g,avg:g.count?g.total/g.count:0})).sort((a,b)=>b.avg-a.avg);
  }
  function chart(series){
    const s=series.slice(-30);if(s.length<2)return '<div class="stats-empty">Wykres wzrostu pojawi się po zapisaniu kolejnych dziennych snapshotów.</div>';
    const vals=s.map(x=>num(x.followers)),min=Math.min(...vals),max=Math.max(...vals),range=Math.max(1,max-min);
    return `<div class="stats-chart" title="Ostatnie ${s.length} pomiarów">${vals.map(v=>`<i class="stats-bar" style="height:${Math.max(9,Math.round((v-min)/range*78)+9)}px"></i>`).join('')}</div>`;
  }
  function topRows(items,followers){
    if(!items.length)return '<div class="stats-empty">Brak zsynchronizowanych publikacji z reakcjami.</div>';
    return top(items).map((x,i)=>{const er=followers?((x.likes+x.comments)/followers*100):null;return `<div class="stats-top-row"><span class="stats-rank">${i+1}</span><div class="stats-copy"><b>${esc(String(x.title||'Publikacja').replace(/\s+/g,' ').slice(0,95))}</b><small>${esc(x.type)} • ${esc(x.date||'')} • ❤️ ${fmt(x.likes)} • 💬 ${fmt(x.comments)}${er==null?'':` • ER ~${er.toFixed(2)}%`}</small></div><div class="stats-score"><strong>${fmt(score(x))}</strong><small>wynik</small></div></div>`}).join('');
  }
  function formatsHtml(items){
    const groups=formatStats(items);if(!groups.length)return '<div class="stats-empty">Za mało danych do porównania formatów.</div>';
    const max=Math.max(...groups.map(x=>x.avg),1);
    return groups.slice(0,5).map((g,i)=>`<div class="stats-format"><div class="stats-format-line"><b>${i===0?'🏆 ':''}${esc(g.type)}</b><span>${g.count} treści • śr. wynik ${g.avg.toFixed(1)}</span></div><div class="stats-meter"><i style="width:${Math.max(5,g.avg/max*100)}%"></i></div></div>`).join('');
  }

  function sourceState(live){
    if(live?.profile)return {label:'META LIVE',cls:'live',detail:'Dane odświeżone z Meta Graph API'};
    if(cachedLive())return {label:'CACHE',cls:'cache',detail:'Meta niedostępna — używam ostatniego zapisu'};
    return {label:'LOKALNE',cls:'local',detail:'Dane z pamięci aplikacji'};
  }
  function render(live=null){
    if(localStorage.getItem('aii-last-view')!=='stats')return;
    const root=q('#content');if(!root)return;
    const fallback=cachedLive(),effective=live||fallback||null,a=aggregate(effective),source=sourceState(live);
    const followers=a.ig.followers,posts=a.ig.posts??a.items.length;
    q('#pageTitle')&&(q('#pageTitle').textContent='Statystyki');
    q('#pageSubtitle')&&(q('#pageSubtitle').textContent='Wyniki profili, wzrost i skuteczność treści.');
    root.innerHTML=`<section class="stats-pro" id="statsStudio"><div class="stats-hero"><div><div class="eyebrow">ANALYTICS CONTROL CENTER</div><h2>Statystyki LIVE</h2><p>${esc(source.detail)}. AI jest dodatkiem — podstawowa analityka działa również bez OpenAI.</p></div><div class="stats-actions"><span class="stats-status ${source.cls}">${source.label}</span><span class="stats-status">${esc(modeLabel())}</span><button class="primary" type="button" id="statsRefresh">↻ Odśwież dane</button></div></div><div class="stats-kpis"><div class="stats-kpi"><span>Obserwujący Instagram</span><strong>${fmt(followers)}</strong><small class="${deltaClass(a.g7)}">7 dni: ${esc(deltaText(a.g7))}</small></div><div class="stats-kpi"><span>Publikacje</span><strong>${fmt(posts)}</strong><small>${a.items.length} z reakcjami w analizie</small></div><div class="stats-kpi"><span>Śr. engagement rate</span><strong>${a.avgEr==null?'—':`${a.avgEr.toFixed(2)}%`}</strong><small>średnia dla analizowanych treści</small></div><div class="stats-kpi"><span>Polubienia</span><strong>${fmt(a.totalLikes)}</strong><small>w analizowanych treściach</small></div><div class="stats-kpi"><span>Komentarze</span><strong>${fmt(a.totalComments)}</strong><small>łącznie</small></div><div class="stats-kpi"><span>Reels</span><strong>${fmt(a.reels)}</strong><small>w analizowanym zbiorze</small></div></div><div class="stats-grid"><div class="stats-card"><div class="stats-head"><div><b>Wzrost społeczności — Instagram</b><span>Historia lokalnych snapshotów, do 30 ostatnich pomiarów na wykresie</span></div></div><div class="stats-growth"><div class="stats-growth-box"><b class="${deltaClass(a.g7)}">${esc(deltaText(a.g7))}</b><span>zmiana 7 dni</span></div><div class="stats-growth-box"><b class="${deltaClass(a.g30)}">${esc(deltaText(a.g30))}</b><span>zmiana 30 dni</span></div></div>${chart(a.igHistory)}</div><div class="stats-card"><div class="stats-head"><div><b>Porównanie platform</b><span>Instagram LIVE + TikTok z podłączonego źródła/cache</span></div></div><div class="stats-platforms"><div class="stats-platform"><span>Instagram ${esc(a.ig.handle||'')}</span><strong>${fmt(a.ig.followers)}</strong><small>obserwujących • ${fmt(a.ig.posts)} publikacji</small><small class="${deltaClass(a.g30)}">30 dni: ${esc(deltaText(a.g30))}</small></div><div class="stats-platform"><span>TikTok ${esc(a.tt?.handle||'')}</span><strong>${fmt(a.tt?.followers)}</strong><small>obserwujących • ${fmt(a.tt?.posts)} filmów</small><small class="${deltaClass(a.tt30)}">30 dni: ${esc(deltaText(a.tt30))}</small></div></div><div class="stats-note">Brak danych TikTok nie blokuje statystyk Instagrama. Po podłączeniu Apify/TikTok karta uzupełni się automatycznie.</div></div></div><div class="stats-grid"><div class="stats-card"><div class="stats-head"><div><b>TOP 5 treści</b><span>Ranking: polubienia + 4× komentarze</span></div></div><div class="stats-top">${topRows(a.items,num(a.ig.followers))}</div></div><div class="stats-card"><div class="stats-head"><div><b>Skuteczność formatów</b><span>Średni wynik treści według formatu</span></div></div><div class="stats-formats">${formatsHtml(a.items)}</div><div class="stats-note">Wyniki są analityką opisową. Nie gwarantują przyszłego zasięgu.</div></div></div><div class="stats-card"><div class="stats-head"><div><b>Stan danych</b><span>Odporność aplikacji na brak AI i internetu</span></div></div><div class="stats-platforms"><div class="stats-platform"><span>Źródło główne</span><strong style="font-size:13px">${source.label}</strong><small>${esc(source.detail)}</small></div><div class="stats-platform"><span>Tryb aplikacji</span><strong style="font-size:13px">${esc(modeLabel())}</strong><small>Statystyki nie wymagają kredytów OpenAI.</small></div></div></div></section>`;
    q('#statsRefresh')?.addEventListener('click',()=>refreshLive(true));
  }

  async function refreshLive(manual=false){
    if(localStorage.getItem('aii-last-view')!=='stats')return;
    if(!navigator.onLine||localStorage.getItem('aii-mode')==='offline'){
      render(null);if(manual)toast?.('Tryb offline — pokazuję zapisane statystyki');return;
    }
    const btn=q('#statsRefresh');if(btn){btn.disabled=true;btn.textContent='Odświeżam…'}
    try{
      const r=await fetch(LIVE_API,{cache:'no-store'}),data=await r.json().catch(()=>({}));
      if(!r.ok||data?.ok===false)throw new Error(data?.error||`HTTP ${r.status}`);
      const live=extractLive(data);
      if(live.profile||live.items.length){save(CACHE,{data:live,cachedAt:new Date().toISOString()});render(live);if(manual)toast?.('Statystyki odświeżone z Meta LIVE');}
      else{render(null);if(manual)toast?.('Brak nowych danych LIVE — pokazuję zapisane');}
    }catch(e){render(null);if(manual)toast?.('Meta niedostępna — statystyki z cache/lokalne');}
  }

  function activate(){
    localStorage.setItem('aii-last-view','stats');
    setTimeout(()=>{render(null);refreshLive(false)},35);
  }
  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('.nav-item[data-view="stats"]').forEach(a=>a.addEventListener('click',activate));
    const root=q('#content');if(root)new MutationObserver(()=>{if(localStorage.getItem('aii-last-view')==='stats'&&!q('#statsStudio'))setTimeout(()=>render(null),20)}).observe(root,{childList:true,subtree:false});
    if(localStorage.getItem('aii-last-view')==='stats')activate();
  });
  document.addEventListener('aii:social-changed',()=>{if(localStorage.getItem('aii-last-view')==='stats')setTimeout(()=>render(cachedLive()),60)});
  window.addEventListener('storage',e=>{if([QUEUE,PROFILES,HISTORY].includes(e.key)&&localStorage.getItem('aii-last-view')==='stats')render(cachedLive())});
  window.AIIStatsStudio={refresh:()=>refreshLive(true),render};
})();
