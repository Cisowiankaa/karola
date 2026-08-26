(() => {
  const API={
    instagram:'https://ai-influencer-studio-api.vercel.app/api/apify-instagram',
    tiktok:'https://ai-influencer-studio-api.vercel.app/api/apify-tiktok'
  };
  const CACHE={instagram:'aii-apify-profile-cache',tiktok:'aii-apify-tiktok-cache'};
  const PROFILES='aii-social-profiles';
  const HISTORY='aii-social-growth-history';
  const q=(s,r=document)=>r.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const toast=t=>window.showToast?window.showToast(t):alert(t);
  const read=(k,d={})=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

  const style=document.createElement('style');
  style.textContent=`
    .apify-box{margin-top:14px;padding:14px;border:1px solid #e6e8f1;border-radius:14px;background:#fbfbfe}.apify-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}.apify-provider{padding:12px;border:1px solid #eceef5;border-radius:12px;background:#fff}.apify-provider-head{display:flex;justify-content:space-between;gap:8px;align-items:center}.apify-row{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:9px}.apify-row input{width:100%;box-sizing:border-box;border:1px solid #dfe2eb;border-radius:9px;padding:10px}.apify-result{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:start;margin-top:12px}.apify-avatar{width:58px;height:58px;border-radius:50%;object-fit:cover;background:#ececf4}.apify-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:8px}.apify-stat{padding:8px;border:1px solid #eceef5;border-radius:10px;background:#fff}.apify-stat b{display:block;font-size:13px}.apify-stat span{font-size:7px;color:#767d89}.apify-meta{font-size:8px;color:#767d89;margin-top:6px;line-height:1.45}.apify-badge{display:inline-flex;padding:4px 7px;border-radius:999px;background:#eef8f2;color:#287a4b;font-size:7px;font-weight:900}.apify-badge.tt{background:#f5f3ff;color:#6554a8}.social-compare{margin-top:12px;padding:12px;border:1px solid #e8eaf2;border-radius:12px;background:#fff}.social-compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.social-compare-card{padding:10px;border:1px solid #eceef5;border-radius:10px;background:#fafafe}.social-compare-card b{display:block;font-size:9px}.social-compare-card strong{display:block;font-size:18px;margin-top:4px}.social-compare-card small{display:block;font-size:7.5px;color:#777f8d;margin-top:3px}.social-compare-foot{font-size:8px;color:#777f8d;margin-top:8px}.social-growth{margin-top:10px;padding:12px;border:1px solid #e8eaf2;border-radius:12px;background:#fff}.social-growth-head{display:flex;justify-content:space-between;gap:8px;align-items:center}.social-growth-head b{font-size:9px}.social-growth-head span{font-size:7.5px;color:#777f8d}.social-growth-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.social-growth-card{padding:10px;border:1px solid #eceef5;border-radius:10px;background:#fafafe}.social-growth-title{display:flex;justify-content:space-between;gap:8px;align-items:center}.social-growth-title b{font-size:9px}.social-growth-title span{font-size:7px;color:#777f8d}.social-growth-kpis{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}.social-growth-kpi{padding:7px;border:1px solid #eceef5;border-radius:8px;background:#fff}.social-growth-kpi strong{display:block;font-size:13px}.social-growth-kpi small{display:block;font-size:7px;color:#777f8d;margin-top:2px}.social-growth-kpi .up{color:#287a4b}.social-growth-kpi .down{color:#a63d3d}.social-spark{height:34px;display:flex;gap:2px;align-items:end;margin-top:8px;padding-top:4px}.social-spark span{flex:1;min-width:2px;border-radius:2px 2px 0 0;background:currentColor;opacity:.38}.social-growth-empty{font-size:7.5px;color:#777f8d;margin-top:8px;line-height:1.45}@media(max-width:900px){.apify-grid,.social-compare-grid,.social-growth-grid{grid-template-columns:1fr}}@media(max-width:750px){.apify-row,.apify-result,.apify-stats{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const fmt=n=>n==null?'—':new Intl.NumberFormat('pl-PL',{notation:Number(n)>=10000?'compact':'standard',maximumFractionDigits:1}).format(Number(n));
  const metric=(v,label)=>`<div class="apify-stat"><b>${fmt(v)}</b><span>${label}</span></div>`;
  const dayKey=d=>new Date(d||Date.now()).toISOString().slice(0,10);
  const profileKey=(platform,handle)=>`${String(platform||'').toLowerCase()}:${String(handle||'').replace(/^@/,'').toLowerCase()}`;

  function card(p,platform){
    if(!p)return '<div class="apify-meta">Wpisz nick publicznego profilu i kliknij „Pobierz dane”.</div>';
    const isTikTok=platform==='tiktok';
    return `<div class="apify-result">${p.profilePicUrl?`<img class="apify-avatar" src="${esc(p.profilePicUrl)}" alt="">`:'<div class="apify-avatar"></div>'}<div><div><b>@${esc(p.username)}</b>${p.verified?'<span class="apify-badge">ZWERYFIKOWANY</span>':''}</div><div class="apify-meta">${esc(p.fullName||'')} ${p.private?'• konto prywatne':'• konto publiczne'}</div><div class="apify-stats">${isTikTok?`${metric(p.followers,'obserwujących')}${metric(p.following,'obserwuje')}${metric(p.likes,'polubień')}${metric(p.videos,'filmów')}`:`${metric(p.followers,'obserwujących')}${metric(p.following,'obserwuje')}${metric(p.posts,'publikacji')}${metric(null,'—')}`}</div>${p.biography?`<div class="apify-meta">${esc(p.biography)}</div>`:''}<div class="apify-meta">Źródło: Apify • ${p.scrapedAt?new Date(p.scrapedAt).toLocaleString('pl-PL'):''}</div></div></div>`;
  }

  function upsertSharedProfile(platform,p){
    const label=platform==='tiktok'?'TikTok':'Instagram';
    const arr=read(PROFILES,[]);
    const idx=arr.findIndex(x=>String(x.platform||'').toLowerCase()===label.toLowerCase()&&String(x.handle||'').replace(/^@/,'').toLowerCase()===String(p.username||'').toLowerCase());
    const profile={platform:label,handle:`@${p.username}`,active:true,connected:true,source:'Apify',followers:p.followers??null,following:p.following??null,posts:platform==='tiktok'?(p.videos??null):(p.posts??null),likes:platform==='tiktok'?(p.likes??null):null,avatar:p.profilePicUrl||'',fullName:p.fullName||'',verified:Boolean(p.verified),scrapedAt:p.scrapedAt||new Date().toISOString()};
    if(idx>=0)arr[idx]={...arr[idx],...profile};else arr.push(profile);
    save(PROFILES,arr);
    captureGrowthSnapshots();
    document.dispatchEvent(new CustomEvent('aii:social-changed',{detail:{platform:label,source:'Apify'}}));
  }

  function bestInstagram(){
    const profiles=read(PROFILES,[]);
    const live=profiles.find(p=>String(p.platform||'').toLowerCase()==='instagram'&&p.connected&&p.followers!=null);
    if(live)return {followers:live.followers,posts:live.mediaCount??live.posts,source:live.source||'Meta',handle:live.handle};
    const ap=read(CACHE.instagram,{}).profile;
    return ap?{followers:ap.followers,posts:ap.posts,source:'Apify',handle:`@${ap.username}`} : null;
  }

  function bestTikTok(){
    const profiles=read(PROFILES,[]);
    const live=profiles.find(p=>String(p.platform||'').toLowerCase()==='tiktok'&&p.connected&&p.followers!=null);
    if(live)return {followers:live.followers,posts:live.posts??live.videos,likes:live.likes,source:live.source||'Apify',handle:live.handle};
    const ap=read(CACHE.tiktok,{}).profile;
    return ap?{followers:ap.followers,posts:ap.videos,likes:ap.likes,source:'Apify',handle:`@${ap.username}`} : null;
  }

  function captureOne(history,platform,p){
    if(!p||p.followers==null||!p.handle)return;
    const key=profileKey(platform,p.handle),today=dayKey();
    const list=Array.isArray(history[key])?history[key]:[];
    const snap={date:today,followers:Number(p.followers)||0,posts:p.posts==null?null:Number(p.posts),likes:p.likes==null?null:Number(p.likes),source:p.source||'local'};
    const idx=list.findIndex(x=>x.date===today);
    if(idx>=0)list[idx]={...list[idx],...snap};else list.push(snap);
    list.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    history[key]=list.slice(-400);
  }

  function captureGrowthSnapshots(){
    const history=read(HISTORY,{}),ig=bestInstagram(),tt=bestTikTok();
    captureOne(history,'instagram',ig);
    captureOne(history,'tiktok',tt);
    save(HISTORY,history);
    return history;
  }

  function seriesFor(platform,p){
    if(!p?.handle)return [];
    const h=read(HISTORY,{});
    return (Array.isArray(h[profileKey(platform,p.handle)])?h[profileKey(platform,p.handle)]:[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  }

  function growthDelta(series,days){
    if(!series.length)return null;
    const current=series[series.length-1];
    const target=new Date(`${current.date}T00:00:00Z`);target.setUTCDate(target.getUTCDate()-days);
    const targetKey=dayKey(target);
    const candidates=series.filter(x=>x.date<=targetKey);
    if(!candidates.length)return null;
    const base=candidates[candidates.length-1];
    const delta=Number(current.followers)-Number(base.followers);
    const pct=Number(base.followers)>0?(delta/Number(base.followers))*100:null;
    return {delta,pct,baseDate:base.date,currentDate:current.date};
  }

  function deltaHtml(g,label){
    if(!g)return `<div class="social-growth-kpi"><strong>—</strong><small>${label} • zbieranie danych</small></div>`;
    const cls=g.delta>0?'up':g.delta<0?'down':'';
    const sign=g.delta>0?'+':'';
    const pct=g.pct==null?'':` • ${g.pct>0?'+':''}${g.pct.toFixed(1)}%`;
    return `<div class="social-growth-kpi"><strong class="${cls}">${sign}${fmt(g.delta)}</strong><small>${label}${pct}</small></div>`;
  }

  function sparkHtml(series){
    const s=series.slice(-30);
    if(s.length<2)return '<div class="social-growth-empty">Trend zacznie się rysować po zapisaniu kolejnych dziennych pomiarów.</div>';
    const vals=s.map(x=>Number(x.followers)||0),min=Math.min(...vals),max=Math.max(...vals),range=Math.max(1,max-min);
    return `<div class="social-spark" title="Ostatnie ${s.length} pomiarów">${vals.map(v=>`<span style="height:${Math.max(8,Math.round(((v-min)/range)*26)+8)}px"></span>`).join('')}</div>`;
  }

  function growthCard(platform,label,p){
    const series=seriesFor(platform,p),g7=growthDelta(series,7),g30=growthDelta(series,30);
    return `<div class="social-growth-card"><div class="social-growth-title"><b>${label} ${esc(p?.handle||'')}</b><span>${series.length?`${series.length} dni pomiarów`:'brak historii'}</span></div><div class="social-growth-kpis">${deltaHtml(g7,'7 dni')}${deltaHtml(g30,'30 dni')}</div>${sparkHtml(series)}</div>`;
  }

  function growthHtml(){
    captureGrowthSnapshots();
    const ig=bestInstagram(),tt=bestTikTok();
    return `<div class="social-growth" id="socialGrowthPanel"><div class="social-growth-head"><b>Trend obserwujących</b><span>Snapshot maks. 1× dziennie • historia do 400 dni</span></div><div class="social-growth-grid">${growthCard('instagram','Instagram',ig)}${growthCard('tiktok','TikTok',tt)}</div></div>`;
  }

  function comparisonHtml(){
    const ig=bestInstagram(),tt=bestTikTok();
    const igF=Number(ig?.followers||0),ttF=Number(tt?.followers||0);
    let lead='Dodaj dane TikTok, aby zobaczyć pełne porównanie.';
    if(ig&&tt){
      const diff=Math.abs(igF-ttF);
      lead=igF===ttF?'Obie platformy mają podobną liczbę obserwujących.':igF>ttF?`Instagram ma o ${fmt(diff)} obserwujących więcej.`:`TikTok ma o ${fmt(diff)} obserwujących więcej.`;
    }
    return `<div class="social-compare" id="socialPlatformCompare"><b>Instagram vs TikTok</b><div class="social-compare-grid"><div class="social-compare-card"><b>Instagram ${esc(ig?.handle||'')}</b><strong>${fmt(ig?.followers)}</strong><small>obserwujących • ${fmt(ig?.posts)} publikacji • ${esc(ig?.source||'brak danych')}</small></div><div class="social-compare-card"><b>TikTok ${esc(tt?.handle||'')}</b><strong>${fmt(tt?.followers)}</strong><small>obserwujących • ${fmt(tt?.posts)} filmów${tt?.likes!=null?` • ${fmt(tt.likes)} polubień`:''} • ${esc(tt?.source||'brak danych')}</small></div></div><div class="social-compare-foot">${esc(lead)}</div></div>`;
  }

  function refreshComparison(){
    captureGrowthSnapshots();
    const old=q('#socialPlatformCompare');if(old)old.outerHTML=comparisonHtml();
    const growth=q('#socialGrowthPanel');if(growth)growth.outerHTML=growthHtml();
  }

  async function lookup(platform){
    const id=platform==='tiktok'?'TikTok':'Instagram';
    const input=q(`#apify${id}Username`),btn=q(`#apify${id}Lookup`),out=q(`#apify${id}Result`);
    const username=String(input?.value||'').trim().replace(/^@/,'');
    if(!username){toast(`Wpisz nick ${id}`);return}
    btn.disabled=true;btn.textContent='Pobieram…';out.innerHTML='<div class="apify-meta">Łączenie z Apify…</div>';
    try{
      const r=await fetch(API[platform],{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username})});
      const data=await r.json().catch(()=>({}));
      if(!r.ok||!data.profile)throw new Error(data.error||`Błąd API ${r.status}`);
      save(CACHE[platform],{profile:data.profile,ts:Date.now()});
      upsertSharedProfile(platform,data.profile);
      out.innerHTML=card(data.profile,platform);
      refreshComparison();
      toast(`Dane ${id} pobrane z Apify i zapisane w profilach`);
    }catch(e){
      const msg=e?.message||String(e);
      out.innerHTML=`<div class="apify-meta" style="color:#a63d3d">${esc(msg)}</div>`;
      toast(/APIFY_TOKEN/i.test(msg)?'Apify wymaga konfiguracji tokenu w Vercel':`Nie udało się pobrać profilu ${id}`);
    }finally{btn.disabled=false;btn.textContent='Pobierz dane'}
  }

  function providerBox(platform,title,placeholder){
    const id=platform==='tiktok'?'TikTok':'Instagram',cache=read(CACHE[platform]);
    return `<div class="apify-provider"><div class="apify-provider-head"><b>${title}</b><span class="apify-badge ${platform==='tiktok'?'tt':''}">APIFY</span></div><div class="apify-meta">Publiczne statystyki profilu. Token pozostaje wyłącznie na Vercel.</div><div class="apify-row"><input id="apify${id}Username" placeholder="${placeholder}"><button class="primary" id="apify${id}Lookup">Pobierz dane</button></div><div id="apify${id}Result">${card(cache.profile,platform)}</div></div>`;
  }

  function enhance(){
    if(localStorage.getItem('aii-last-view')!=='social')return;
    const profiles=q('#socialProfiles');
    if(!profiles||q('#socialApifyBox'))return;
    captureGrowthSnapshots();
    const box=document.createElement('div');box.id='socialApifyBox';box.className='apify-box';
    box.innerHTML=`<div><b>Fallback publicznych danych przez Apify</b><span class="apify-badge" style="margin-left:6px">BEZ OPENAI</span></div><div class="apify-meta">Instagram korzysta przede wszystkim z Meta LIVE. Apify pozostaje warstwą awaryjną; TikTok może korzystać z Apify, gdy oficjalne API nie jest podłączone.</div><div class="apify-grid">${providerBox('instagram','Instagram przez Apify','np. karolajna.86')}${providerBox('tiktok','TikTok przez Apify','np. nazwa_konta')}</div>${comparisonHtml()}${growthHtml()}`;
    profiles.parentElement.insertBefore(box,profiles);
    q('#apifyInstagramLookup')?.addEventListener('click',()=>lookup('instagram'));
    q('#apifyTikTokLookup')?.addEventListener('click',()=>lookup('tiktok'));
  }

  document.addEventListener('DOMContentLoaded',()=>{
    const c=document.getElementById('content');if(c)new MutationObserver(()=>setTimeout(enhance,30)).observe(c,{childList:true,subtree:true});
    document.querySelectorAll('.nav-item[data-view="social"]').forEach(a=>a.addEventListener('click',()=>setTimeout(enhance,100)));
    document.addEventListener('aii:social-changed',()=>setTimeout(refreshComparison,30));
    setTimeout(enhance,150);
  });
  window.AIISocialApify={lookup,refreshComparison,captureGrowthSnapshots};
})();