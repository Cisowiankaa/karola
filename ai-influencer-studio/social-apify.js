(() => {
  const API={
    instagram:'https://ai-influencer-studio-api.vercel.app/api/apify-instagram',
    tiktok:'https://ai-influencer-studio-api.vercel.app/api/apify-tiktok'
  };
  const CACHE={instagram:'aii-apify-profile-cache',tiktok:'aii-apify-tiktok-cache'};
  const PROFILES='aii-social-profiles';
  const q=(s,r=document)=>r.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[c]));
  const toast=t=>window.showToast?window.showToast(t):alert(t);
  const read=(k,d={})=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

  const style=document.createElement('style');
  style.textContent=`
    .apify-box{margin-top:14px;padding:14px;border:1px solid #e6e8f1;border-radius:14px;background:#fbfbfe}.apify-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}.apify-provider{padding:12px;border:1px solid #eceef5;border-radius:12px;background:#fff}.apify-provider-head{display:flex;justify-content:space-between;gap:8px;align-items:center}.apify-row{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:9px}.apify-row input{width:100%;box-sizing:border-box;border:1px solid #dfe2eb;border-radius:9px;padding:10px}.apify-result{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:start;margin-top:12px}.apify-avatar{width:58px;height:58px;border-radius:50%;object-fit:cover;background:#ececf4}.apify-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:8px}.apify-stat{padding:8px;border:1px solid #eceef5;border-radius:10px;background:#fff}.apify-stat b{display:block;font-size:13px}.apify-stat span{font-size:7px;color:#767d89}.apify-meta{font-size:8px;color:#767d89;margin-top:6px;line-height:1.45}.apify-badge{display:inline-flex;padding:4px 7px;border-radius:999px;background:#eef8f2;color:#287a4b;font-size:7px;font-weight:900}.apify-badge.tt{background:#f5f3ff;color:#6554a8}.social-compare{margin-top:12px;padding:12px;border:1px solid #e8eaf2;border-radius:12px;background:#fff}.social-compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.social-compare-card{padding:10px;border:1px solid #eceef5;border-radius:10px;background:#fafafe}.social-compare-card b{display:block;font-size:9px}.social-compare-card strong{display:block;font-size:18px;margin-top:4px}.social-compare-card small{display:block;font-size:7.5px;color:#777f8d;margin-top:3px}.social-compare-foot{font-size:8px;color:#777f8d;margin-top:8px}@media(max-width:900px){.apify-grid,.social-compare-grid{grid-template-columns:1fr}}@media(max-width:750px){.apify-row,.apify-result,.apify-stats{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const fmt=n=>n==null?'—':new Intl.NumberFormat('pl-PL',{notation:Number(n)>=10000?'compact':'standard',maximumFractionDigits:1}).format(Number(n));
  const metric=(v,label)=>`<div class="apify-stat"><b>${fmt(v)}</b><span>${label}</span></div>`;

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
    const old=q('#socialPlatformCompare');if(old)old.outerHTML=comparisonHtml();
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
    const box=document.createElement('div');box.id='socialApifyBox';box.className='apify-box';
    box.innerHTML=`<div><b>Fallback publicznych danych przez Apify</b><span class="apify-badge" style="margin-left:6px">BEZ OPENAI</span></div><div class="apify-meta">Instagram korzysta przede wszystkim z Meta LIVE. Apify pozostaje warstwą awaryjną; TikTok może korzystać z Apify, gdy oficjalne API nie jest podłączone.</div><div class="apify-grid">${providerBox('instagram','Instagram przez Apify','np. karolajna.86')}${providerBox('tiktok','TikTok przez Apify','np. nazwa_konta')}</div>${comparisonHtml()}`;
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
  window.AIISocialApify={lookup,refreshComparison};
})();