(() => {
  const API='https://ai-influencer-studio-api.vercel.app/api/apify-instagram';
  const q=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const toast=t=>window.showToast?window.showToast(t):alert(t);
  const KEY='aii-apify-profile-cache';
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
  const save=v=>localStorage.setItem(KEY,JSON.stringify(v));

  const style=document.createElement('style');
  style.textContent=`
    .apify-box{margin-top:14px;padding:14px;border:1px solid #e6e8f1;border-radius:14px;background:#fbfbfe}.apify-row{display:grid;grid-template-columns:1fr auto;gap:8px}.apify-row input{width:100%;box-sizing:border-box;border:1px solid #dfe2eb;border-radius:9px;padding:10px}.apify-result{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:start;margin-top:12px}.apify-avatar{width:58px;height:58px;border-radius:50%;object-fit:cover;background:#ececf4}.apify-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}.apify-stat{padding:8px;border:1px solid #eceef5;border-radius:10px;background:#fff}.apify-stat b{display:block;font-size:14px}.apify-stat span{font-size:8px;color:#767d89}.apify-meta{font-size:8px;color:#767d89;margin-top:6px}.apify-badge{display:inline-flex;padding:4px 7px;border-radius:999px;background:#eef8f2;color:#287a4b;font-size:7px;font-weight:900;margin-left:6px}@media(max-width:750px){.apify-row,.apify-result,.apify-stats{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const fmt=n=>n==null?'—':new Intl.NumberFormat('pl-PL',{notation:n>=10000?'compact':'standard',maximumFractionDigits:1}).format(n);

  function card(p){
    if(!p)return '<div class="apify-meta">Wpisz nick publicznego profilu Instagram i kliknij „Pobierz dane”.</div>';
    return `<div class="apify-result">${p.profilePicUrl?`<img class="apify-avatar" src="${esc(p.profilePicUrl)}" alt="">`:'<div class="apify-avatar"></div>'}<div><div><b>@${esc(p.username)}</b>${p.verified?'<span class="apify-badge">ZWERYFIKOWANY</span>':''}</div><div class="apify-meta">${esc(p.fullName||'')} ${p.private?'• konto prywatne':'• konto publiczne'}</div><div class="apify-stats"><div class="apify-stat"><b>${fmt(p.followers)}</b><span>obserwujących</span></div><div class="apify-stat"><b>${fmt(p.following)}</b><span>obserwuje</span></div><div class="apify-stat"><b>${fmt(p.posts)}</b><span>publikacji</span></div></div>${p.biography?`<div class="apify-meta">${esc(p.biography)}</div>`:''}<div class="apify-meta">Źródło: Apify • ${p.scrapedAt?new Date(p.scrapedAt).toLocaleString('pl-PL'):''}</div></div></div>`;
  }

  function enhance(){
    if(localStorage.getItem('aii-last-view')!=='social')return;
    const profiles=q('#socialProfiles');
    if(!profiles||q('#socialApifyBox'))return;
    const cache=read();
    const box=document.createElement('div');box.id='socialApifyBox';box.className='apify-box';
    box.innerHTML=`<div><b>Pobierz profil z Instagrama przez Apify</b><span class="apify-badge">APIFY</span></div><div class="apify-meta">Token pozostaje bezpiecznie na Vercel. Tutaj wpisujesz tylko nick.</div><div class="apify-row" style="margin-top:9px"><input id="apifyUsername" placeholder="np. karolajna.86"><button class="primary" id="apifyLookup">Pobierz dane</button></div><div id="apifyResult">${card(cache.profile)}</div>`;
    profiles.parentElement.insertBefore(box,profiles);
    q('#apifyLookup').onclick=async()=>{
      const username=q('#apifyUsername').value.trim().replace(/^@/,'');
      if(!username){toast('Wpisz nick Instagrama');return}
      const btn=q('#apifyLookup'),out=q('#apifyResult');btn.disabled=true;btn.textContent='Pobieram…';out.innerHTML='<div class="apify-meta">Łączenie z Apify…</div>';
      try{
        const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username})});
        const data=await r.json().catch(()=>({}));
        if(!r.ok||!data.profile)throw new Error(data.error||`Błąd API ${r.status}`);
        save({profile:data.profile,ts:Date.now()});out.innerHTML=card(data.profile);toast('Dane profilu pobrane z Apify');
      }catch(e){out.innerHTML=`<div class="apify-meta" style="color:#a63d3d">${esc(e.message||e)}</div>`;toast('Nie udało się pobrać profilu z Apify')}
      finally{btn.disabled=false;btn.textContent='Pobierz dane'}
    };
  }

  document.addEventListener('DOMContentLoaded',()=>{
    const c=document.getElementById('content');if(c)new MutationObserver(()=>setTimeout(enhance,30)).observe(c,{childList:true,subtree:true});
    document.querySelectorAll('.nav-item[data-view="social"]').forEach(a=>a.addEventListener('click',()=>setTimeout(enhance,100)));
    setTimeout(enhance,150);
  });
})();