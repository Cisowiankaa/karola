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
  const toast=t=>window.showToast?window.showToast(t):null;

  function detectedMode(){
    if(!navigator.onLine)return 'OFFLINE';
    const detected=q('#systemStatus')?.dataset?.detectedMode;
    if(detected==='online-ai')return 'ONLINE + AI';
    if(detected==='online-local')return 'ONLINE bez AI';
    if(detected==='offline')return 'OFFLINE';
    const stored=localStorage.getItem('aii-mode');
    if(stored==='online-ai')return 'ONLINE + AI';
    if(stored==='online-local')return 'ONLINE bez AI';
    if(stored==='offline')return 'OFFLINE';
    return window.AII_RUNTIME_HEALTH?.ai?.ok?'ONLINE + AI':'ONLINE bez AI';
  }
  function active(){return q('.nav-item.active')?.dataset?.view==='stats'||localStorage.getItem('aii-last-view')==='stats'}

  const style=document.createElement('style');
  style.textContent=`
    .stats-pro{display:grid;gap:14px}.stats-hero{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:17px;border-radius:17px;background:linear-gradient(135deg,#171925,#28233b);color:#fff}.stats-hero h2{margin:4px 0 5px;color:#fff}.stats-hero p{margin:0;color:#d4d0df;font-size:9px}.stats-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.stats-status{display:inline-flex;padding:5px 8px;border-radius:999px;background:rgba(255,255,255,.11);font-size:7px;font-weight:900;white-space:nowrap}.stats-status.live{background:#dff7e8;color:#247447}.stats-status.cache{background:#fff2d8;color:#8b6519}.stats-status.local{background:#eceef5;color:#646b78}.stats-kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:9px}.stats-kpi{padding:13px;border:1px solid #e7e9f1;border-radius:14px;background:#fff}.stats-kpi span{display:block;font-size:7.5px;color:#7b8290}.stats-kpi strong{display:block;font-size:20px;margin-top:5px;color:#232631}.stats-kpi small{display:block;font-size:7px;color:#777f8d;margin-top:4px}.stats-up{color:#287a4b!important}.stats-down{color:#a13f3f!important}.stats-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:12px}.stats-card{padding:14px;border:1px solid #e7e9f1;border-radius:15px;background:#fff}.stats-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.stats-head b{font-size:10px}.stats-head span{display:block;font-size:7px;color:#777f8d;margin-top:3px}.stats-platforms{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.stats-platform{padding:11px;border:1px solid #eceef5;border-radius:11px;background:#fafafe}.stats-platform strong{display:block;font-size:18px;margin-top:4px}.stats-platform small{display:block;font-size:7px;color:#777f8d;margin-top:4px}.stats-growth{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}.stats-growth-box{padding:9px;border:1px solid #eceef5;border-radius:10px;background:#fafafe}.stats-growth-box b{display:block;font-size:13px}.stats-growth-box span{display:block;font-size:7px;color:#777f8d;margin-top:3px}.stats-chart{height:95px;display:flex;align-items:end;gap:3px;margin-top:12px;padding:8px 4px 0;border-bottom:1px solid #eceef5}.stats-bar{flex:1;min-width:3px;max-width:18px;border-radius:4px 4px 0 0;background:linear-gradient(180deg,#8b74f0,#5e49cf);opacity:.72}.stats-empty{padding:18px 4px;color:#777f8d;font-size:8px;line-height:1.5}.stats-top{display:grid;gap:7px;margin-top:10px}.stats-top-row{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:9px;align-items:center;padding:9px;border:1px solid #eceef5;border-radius:10px;background:#fafafe}.stats-rank{width:28px;height:28px;border-radius:9px;display:grid;place-items:center;background:#f0ecff;color:#6548d9;font-size:8px;font-weight:900}.stats-copy{min-width:0}.stats-copy b{display:block;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.stats-copy small{display:block;font-size:6.8px;color:#777f8d;margin-top:3px}.stats-score{text-align:right}.stats-score strong{display:block;font-size:12px}.stats-score small{display:block;font-size:6.5px;color:#777f8d}.stats-formats{display:grid;gap:7px;margin-top:10px}.stats-format{padding:9px;border:1px solid #eceef5;border-radius:10px;background:#fafafe}.stats-format-line{display:flex;justify-content:space-between;gap:8px;font-size:8px}.stats-meter{height:6px;border-radius:999px;background:#eceef5;margin-top:6px;overflow:hidden}.stats-meter i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#55d9e9,#8067ee)}.stats-note{font-size:7px;color:#777f8d;line-height:1.5;margin-top:9px}@media(max-width:1120px){.stats-kpis{grid-template-columns:repeat(3,1fr)}}@media(max-width:900px){.stats-grid{grid-template-columns:1fr}}@media(max-width:650px){.stats-kpis,.stats-platforms,.stats-growth{grid-template-columns:1fr 1fr}}@media(max-width:440px){.stats-kpis,.stats-platforms,.stats-growth{grid-template-columns:1fr}.stats-hero{display:block}.stats-actions{justify-content:flex-start;margin-top:10px}}
  `;
  document.head.appendChild(style);

  const profiles=()=>{const x=read(PROFILES,[]);return Array.isArray(x)?x:[]};
  const queue=()=>{const x=read(QUEUE,[]);return Array.isArray(x)?x:[]};
  const localProfile=platform=>profiles().find(x=>String(x.platform||'').toLowerCase()===platform&&x.connected)||profiles().find(x=>String(x.platform||'').toLowerCase()===platform)||null;

  function normalizeProfile(p){
    if(!p||typeof p!=='object')return null;
    return {handle:p.handle||p.username||p.userName||'',followers:p.followers??p.followersCount??p.followerCount??null,posts:p.mediaCount??p.posts??p.postCount??p.videos??null,source:p.source||'Meta'};
  }
  function normalizeItem(x){
    if(!x||typeof x!=='object')return null;
    const media=String(x.media_type||x.mediaType||x.type||'Post');
    return {id:String(x.id||x.externalId||x.permalink||`${x.timestamp||x.date||''}-${x.caption||x.title||''}`),title:x.title||x.caption||x.text||'Publikacja',date:String(x.timestamp||x.date||x.publishedAt||'').slice(0,10),type:/reel|video/i.test(media)?'Reels':/carousel/i.test(media)?'Carousel':'Post',likes:num(x.like_count??x.likes??x.likeCount),comments:num(x.comments_count??x.comments??x.commentCount),permalink:x.permalink||x.url||''};
  }
  function extractLive(data){
    const profile=normalizeProfile(data?.profile||data?.instagram?.profile||data?.sources?.instagram?.profile||data?.providers?.instagram?.profile);
    const raw=data?.items||data?.instagram?.items||data?.media||data?.posts||data?.sources?.instagram?.items||[];
    return {profile,items:(Array.isArray(raw)?raw:[]).map(normalizeItem).filter(Boolean)};
  }
  function cached(){const c=read(CACHE,null);return c?.data?{...c.data,cachedAt:c.cachedAt}:null}
  function localPublished(){return queue().filter(x=>String(x.status||'').toLowerCase()==='opublikowany').map(x=>normalizeItem({...x,media_type:x.type})).filter(Boolean)}
  function mergeItems(live){
    const map=new Map();[...(live?.items||[]),...localPublished()].forEach(x=>{const key=x.permalink||x.id||`${x.date}-${x.title}`;if(!map.has(key))map.set(key,x);else{const a=map.get(key);map.set(key,{...a,...x,likes:Math.max(num(a.likes),num(x.likes)),comments:Math.max(num(a.comments),num(x.comments))})}});return [...map.values()].filter(x=>x.likes||x.comments).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  }
  function history(platform,handle){
    const h=read(HISTORY,{}),needle=String(handle||'').replace(/^@/,'').toLowerCase(),exact=h[`${platform}:${needle}`];if(Array.isArray(exact))return exact.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));const key=Object.keys(h).find(k=>k.startsWith(`${platform}:`));return key&&Array.isArray(h[key])?h[key].slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))):[];
  }
  function growth(series,days){
    if(!series.length)return null;const current=series[series.length-1],target=new Date(`${current.date}T00:00:00Z`);target.setUTCDate(target.getUTCDate()-days);const key=target.toISOString().slice(0,10),base=series.filter(x=>String(x.date)<=key).pop();if(!base)return null;const value=num(current.followers)-num(base.followers),pct=num(base.followers)>0?value/num(base.followers)*100:null;return {value,pct};
  }
  const growthText=g=>g==null?'zbieranie danych':`${g.value>0?'+':''}${fmt(g.value)}${g.pct==null?'':` (${g.pct>0?'+':''}${g.pct.toFixed(1)}%)`}`;
  const growthClass=g=>g?.value>0?'stats-up':g?.value<0?'stats-down':'';
  const score=x=>num(x.likes)+(num(x.comments)*4);

  function aggregate(live){
    const ig=live?.profile||normalizeProfile(localProfile('instagram'))||{handle:'',followers:null,posts:null,source:'lokalne'},tt=normalizeProfile(localProfile('tiktok')),items=mergeItems(live),likes=items.reduce((s,x)=>s+num(x.likes),0),comments=items.reduce((s,x)=>s+num(x.comments),0),followers=num(ig.followers),avgEr=followers&&items.length?items.reduce((s,x)=>s+((num(x.likes)+num(x.comments))/followers*100),0)/items.length:null,igHistory=history('instagram',ig.handle),ttHistory=history('tiktok',tt?.handle);return {ig,tt,items,likes,comments,avgEr,reels:items.filter(x=>x.type==='Reels').length,igHistory,ttHistory,g7:growth(igHistory,7),g30:growth(igHistory,30),tt30:growth(ttHistory,30)};
  }
  function chart(series){
    const s=series.slice(-30);if(s.length<2)return '<div class="stats-empty">Wykres wzrostu pojawi się po zapisaniu kolejnych dziennych snapshotów.</div>';const vals=s.map(x=>num(x.followers)),min=Math.min(...vals),max=Math.max(...vals),range=Math.max(1,max-min);return `<div class="stats-chart" title="Ostatnie ${s.length} pomiarów">${vals.map(v=>`<i class="stats-bar" style="height:${Math.max(9,Math.round((v-min)/range*78)+9)}px"></i>`).join('')}</div>`;
  }
  function topRows(items,followers){
    const top=items.slice().sort((a,b)=>score(b)-score(a)).slice(0,5);if(!top.length)return '<div class="stats-empty">Brak zsynchronizowanych publikacji z reakcjami.</div>';return top.map((x,i)=>{const er=followers?((x.likes+x.comments)/followers*100):null;return `<div class="stats-top-row"><span class="stats-rank">${i+1}</span><div class="stats-copy"><b>${esc(String(x.title||'Publikacja').replace(/\s+/g,' ').slice(0,95))}</b><small>${esc(x.type)} • ${esc(x.date||'')} • ❤️ ${fmt(x.likes)} • 💬 ${fmt(x.comments)}${er==null?'':` • ER ~${er.toFixed(2)}%`}</small></div><div class="stats-score"><strong>${fmt(score(x))}</strong><small>wynik</small></div></div>`}).join('');
  }
  function formats(items){
    const groups={};items.forEach(x=>{const k=x.type||'Post',g=groups[k]||(groups[k]={type:k,count:0,total:0});g.count++;g.total+=score(x)});const list=Object.values(groups).map(g=>({...g,avg:g.count?g.total/g.count:0})).sort((a,b)=>b.avg-a.avg);if(!list.length)return '<div class="stats-empty">Za mało danych do porównania formatów.</div>';const max=Math.max(...list.map(x=>x.avg),1);return list.slice(0,5).map((g,i)=>`<div class="stats-format"><div class="stats-format-line"><b>${i===0?'🏆 ':''}${esc(g.type)}</b><span>${g.count} treści • śr. wynik ${g.avg.toFixed(1)}</span></div><div class="stats-meter"><i style="width:${Math.max(5,g.avg/max*100)}%"></i></div></div>`).join('');
  }
  function sourceState(fresh){if(fresh?.profile)return {label:'META LIVE',cls:'live',detail:'Dane odświeżone z Meta Graph API'};if(cached())return {label:'CACHE',cls:'cache',detail:'Meta niedostępna — używam ostatniego zapisu'};return {label:'LOKALNE',cls:'local',detail:'Dane z pamięci aplikacji'}}

  function render(fresh=null){
    if(!active())return;localStorage.setItem('aii-last-view','stats');const root=q('#content');if(!root)return;const effective=fresh||cached()||null,a=aggregate(effective),source=sourceState(fresh),mode=detectedMode(),followers=num(a.ig.followers),posts=a.ig.posts??a.items.length;
    q('#pageTitle')&&(q('#pageTitle').textContent='Statystyki');q('#pageSubtitle')&&(q('#pageSubtitle').textContent='Wyniki profili, wzrost i skuteczność treści.');
    root.innerHTML=`<section class="stats-pro" id="statsStudio"><div class="stats-hero"><div><div class="eyebrow">ANALYTICS CONTROL CENTER</div><h2>Statystyki LIVE</h2><p>${esc(source.detail)}. Podstawowa analityka działa również bez OpenAI.</p></div><div class="stats-actions"><span class="stats-status ${source.cls}">${source.label}</span><span class="stats-status">${esc(mode)}</span><button class="primary" type="button" id="statsRefresh">↻ Odśwież dane</button></div></div><div class="stats-kpis"><div class="stats-kpi"><span>Obserwujący Instagram</span><strong>${fmt(a.ig.followers)}</strong><small class="${growthClass(a.g7)}">7 dni: ${esc(growthText(a.g7))}</small></div><div class="stats-kpi"><span>Publikacje</span><strong>${fmt(posts)}</strong><small>${a.items.length} z reakcjami w analizie</small></div><div class="stats-kpi"><span>Śr. engagement rate</span><strong>${a.avgEr==null?'—':`${a.avgEr.toFixed(2)}%`}</strong><small>średnia dla analizowanych treści</small></div><div class="stats-kpi"><span>Polubienia</span><strong>${fmt(a.likes)}</strong><small>w analizowanych treściach</small></div><div class="stats-kpi"><span>Komentarze</span><strong>${fmt(a.comments)}</strong><small>łącznie</small></div><div class="stats-kpi"><span>Reels</span><strong>${fmt(a.reels)}</strong><small>w analizowanym zbiorze</small></div></div><div class="stats-grid"><div class="stats-card"><div class="stats-head"><div><b>Wzrost społeczności — Instagram</b><span>Historia lokalnych snapshotów</span></div></div><div class="stats-growth"><div class="stats-growth-box"><b class="${growthClass(a.g7)}">${esc(growthText(a.g7))}</b><span>zmiana 7 dni</span></div><div class="stats-growth-box"><b class="${growthClass(a.g30)}">${esc(growthText(a.g30))}</b><span>zmiana 30 dni</span></div></div>${chart(a.igHistory)}</div><div class="stats-card"><div class="stats-head"><div><b>Porównanie platform</b><span>Instagram + TikTok</span></div></div><div class="stats-platforms"><div class="stats-platform"><span>Instagram ${esc(a.ig.handle||'')}</span><strong>${fmt(a.ig.followers)}</strong><small>obserwujących • ${fmt(a.ig.posts)} publikacji</small><small class="${growthClass(a.g30)}">30 dni: ${esc(growthText(a.g30))}</small></div><div class="stats-platform"><span>TikTok ${esc(a.tt?.handle||'')}</span><strong>${fmt(a.tt?.followers)}</strong><small>obserwujących • ${fmt(a.tt?.posts)} filmów</small><small class="${growthClass(a.tt30)}">30 dni: ${esc(growthText(a.tt30))}</small></div></div><div class="stats-note">Brak danych TikTok nie blokuje statystyk Instagrama.</div></div></div><div class="stats-grid"><div class="stats-card"><div class="stats-head"><div><b>TOP 5 treści</b><span>Ranking: polubienia + 4× komentarze</span></div></div><div class="stats-top">${topRows(a.items,followers)}</div></div><div class="stats-card"><div class="stats-head"><div><b>Skuteczność formatów</b><span>Średni wynik treści według formatu</span></div></div><div class="stats-formats">${formats(a.items)}</div><div class="stats-note">Wyniki są analityką opisową i nie gwarantują przyszłego zasięgu.</div></div></div><div class="stats-card"><div class="stats-head"><div><b>Stan modułu</b><span>Odporność na brak AI i internetu</span></div></div><div class="stats-platforms"><div class="stats-platform"><span>Status</span><strong style="font-size:13px">AKTYWNY</strong><small>${esc(source.detail)}</small></div><div class="stats-platform"><span>Tryb</span><strong style="font-size:13px">${esc(mode)}</strong><small>AI jest dostępne, ale niewymagane do obliczeń statystycznych.</small></div></div></div></section>`;
    q('#statsRefresh')?.addEventListener('click',()=>refreshLive(true));
  }

  async function refreshLive(manual=false){
    if(!active())return;if(!navigator.onLine||detectedMode()==='OFFLINE'){render(null);if(manual)toast?.('Tryb offline — pokazuję zapisane statystyki');return;}const btn=q('#statsRefresh');if(btn){btn.disabled=true;btn.textContent='Odświeżam…'}
    try{const r=await fetch(LIVE_API,{cache:'no-store'}),data=await r.json().catch(()=>({}));if(!r.ok||data?.ok===false)throw new Error(data?.error||`HTTP ${r.status}`);const live=extractLive(data);if(live.profile||live.items.length){save(CACHE,{data:live,cachedAt:new Date().toISOString()});render(live);if(manual)toast?.('Statystyki odświeżone z Meta LIVE');}else{render(null);if(manual)toast?.('Brak nowych danych LIVE — pokazuję zapisane');}}catch{render(null);if(manual)toast?.('Meta niedostępna — statystyki z cache/lokalne');}
  }

  function activate(){localStorage.setItem('aii-last-view','stats');setTimeout(()=>{render(null);refreshLive(false)},30)}
  document.addEventListener('click',e=>{if(e.target.closest?.('.nav-item[data-view="stats"]'))activate()});
  document.addEventListener('DOMContentLoaded',()=>{if(active())activate();const c=q('#content');if(c)new MutationObserver(()=>{if(active()&&!q('#statsStudio'))setTimeout(()=>render(null),15)}).observe(c,{childList:true,subtree:false})});
  document.addEventListener('aii:social-changed',()=>{if(active())setTimeout(()=>render(cached()),60)});
  window.addEventListener('online',()=>{if(active())setTimeout(()=>refreshLive(false),60)});window.addEventListener('offline',()=>{if(active())setTimeout(()=>render(null),60)});
  window.addEventListener('storage',e=>{if([QUEUE,PROFILES,HISTORY].includes(e.key)&&active())render(cached())});
  window.AIIStatsRuntimeFix={refresh:()=>refreshLive(true),render,mode:detectedMode};
})();
