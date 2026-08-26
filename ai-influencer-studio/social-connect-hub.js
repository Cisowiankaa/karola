(() => {
  const STATUS='/api/social-provider-status';
  const VERCEL_SETTINGS='https://vercel.com/karolciagleinert-9043/ai-influencer-studio-api/settings/environment-variables';
  const q=(s,r=document)=>r.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const toast=t=>window.showToast?window.showToast(t):null;
  let last=null;

  const style=document.createElement('style');
  style.textContent=`
    .social-connect-hub{margin:0 0 14px;padding:14px;border:1px solid #e7e9f1;border-radius:14px;background:#fff}
    .social-connect-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px}
    .social-connect-head b{font-size:10px}.social-connect-head span{font-size:8px;color:#7b8290}
    .social-provider-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
    .social-provider-card{padding:12px;border:1px solid #eceef5;border-radius:12px;background:#fafafe;min-height:92px}
    .social-provider-card b{display:block;font-size:9px;margin-bottom:5px}.social-provider-card strong{display:block;font-size:10px;margin-bottom:5px}
    .social-provider-card small{display:block;font-size:7.5px;line-height:1.45;color:#777f8d;word-break:break-word}
    .social-provider-card.live{background:#f1fbf5;border-color:#d5efdf}.social-provider-card.warn{background:#fffaf0;border-color:#f1e3bd}.social-provider-card.local{background:#f7f4ff;border-color:#e2d9fb}.social-provider-card.error{background:#fff4f4;border-color:#f0d0d0}
    .social-connect-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
    .social-connect-note{margin-top:8px;font-size:7.5px;line-height:1.45;color:#777f8d}
    @media(max-width:900px){.social-provider-grid{grid-template-columns:1fr 1fr}}@media(max-width:560px){.social-provider-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function card(name,state,detail,cls='warn'){
    return `<div class="social-provider-card ${cls}"><b>${esc(name)}</b><strong>${esc(state)}</strong><small>${esc(detail)}</small></div>`;
  }

  function instagramCard(ig,m){
    if(ig.metaHealthy)return card('Instagram','META LIVE','Autoryzacja Meta działa poprawnie.','live');
    if(ig.metaConfigured&&ig.metaHealthCode==='REAUTH_REQUIRED'){
      const fallback=ig.apifyConfigured?'Fallback Apify jest dostępny.':'Brak Apify — używane są ostatnie dane lokalne.';
      return card('Instagram','META: WYMAGA AUTORYZACJI',`Meta jest skonfigurowane, ale token został odrzucony. ${fallback}`,'error');
    }
    if(ig.apifyConfigured)return card('Instagram','APIFY GOTOWY','Meta nie jest gotowe, ale fallback Apify jest skonfigurowany.','live');
    return card('Instagram','TRYB LOKALNY',`Brak aktywnego źródła LIVE. Potrzebne: ${(m.instagram||[]).join(', ')||'konfiguracja Meta/Apify'}`,'warn');
  }

  function facebookCard(fb,m){
    if(fb.metaHealthy)return card('Facebook','META LIVE','Autoryzacja Facebook działa poprawnie.','live');
    if(fb.metaConfigured&&fb.metaHealthCode==='REAUTH_REQUIRED')return card('Facebook','META: WYMAGA AUTORYZACJI','Połączenie istnieje, ale Meta odrzuca aktualne poświadczenie.','error');
    return card('Facebook','TRYB LOKALNY',`Brak aktywnego źródła LIVE. Potrzebne: ${(m.facebook||[]).join(', ')||'konfiguracja Meta'}`,'warn');
  }

  function tiktokCard(tt,m){
    if(tt.healthy)return card('TikTok','TIKTOK LIVE','Oficjalne TikTok API jest skonfigurowane.','live');
    if(tt.apifyConfigured)return card('TikTok','APIFY GOTOWY','Publiczne dane TikTok mogą być pobierane przez podpięty fallback Apify.','live');
    return card('TikTok','TRYB LOKALNY',`Fallback TikTok jest już gotowy w aplikacji, ale brakuje APIFY_TOKEN. ${(m.tiktok||[]).join(', ')}`,'warn');
  }

  function needsApify(data){
    const p=data?.providers||{};
    return !p.instagram?.apifyConfigured && !p.tiktok?.apifyConfigured;
  }

  function html(data){
    const p=data?.providers||{},m=data?.missing||{};
    const ig=p.instagram||{},fb=p.facebook||{},tt=p.tiktok||{};
    const apifyMissing=needsApify(data);
    return `<section class="social-connect-hub" id="socialConnectHub">
      <div class="social-connect-head"><div><b>Social Connect Hub</b><span>Źródła danych, stan autoryzacji i automatyczne fallbacki</span></div><span>${esc(data?.checkedAt?new Date(data.checkedAt).toLocaleTimeString('pl-PL'):'')}</span></div>
      <div class="social-provider-grid">
        ${instagramCard(ig,m)}
        ${facebookCard(fb,m)}
        ${tiktokCard(tt,m)}
        ${card('Dane lokalne','ZAWSZE DOSTĘPNE','Ostatnie zapisane profile i publikacje pozostają dostępne przy awarii API.','local')}
      </div>
      <div class="social-connect-actions">
        <button class="ghost" type="button" id="socialProviderRefresh">↻ Sprawdź źródła</button>
        ${apifyMissing?'<button class="primary" type="button" id="socialConfigureApify">Skonfiguruj Apify</button><button class="ghost" type="button" id="socialCopyApifyVar">Kopiuj APIFY_TOKEN</button>':''}
      </div>
      ${apifyMissing?'<div class="social-connect-note">Aby uruchomić fallback Instagram/TikTok, dodaj w Vercel jedną zmienną środowiskową <b>APIFY_TOKEN</b> dla Production i wykonaj Redeploy. Nie wklejaj wartości tokenu do aplikacji ani czatu.</div>':''}
    </section>`;
  }

  async function copy(text,label){
    try{await navigator.clipboard.writeText(text);toast?.(label)}catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();toast?.(label)}
  }

  async function load(){
    try{
      const r=await fetch(`${STATUS}?_=${Date.now()}`,{headers:{Accept:'application/json'},cache:'no-store'});
      const data=await r.json().catch(()=>({}));
      if(!r.ok||!data.ok)throw new Error(data.error||`HTTP ${r.status}`);
      last=data;
      render();
      return data;
    }catch(e){
      last={ok:false,error:e?.message||String(e)};
      render();
      return last;
    }
  }

  function render(){
    const panel=q('.social-sync-panel');
    if(!panel)return;
    q('#socialConnectHub')?.remove();
    if(last?.ok){
      panel.insertAdjacentHTML('afterend',html(last));
      q('#socialProviderRefresh')?.addEventListener('click',async e=>{const b=e.currentTarget;b.disabled=true;b.textContent='Sprawdzam…';await load();toast?.('Status źródeł odświeżony');});
      q('#socialConfigureApify')?.addEventListener('click',()=>window.open(VERCEL_SETTINGS,'_blank','noopener'));
      q('#socialCopyApifyVar')?.addEventListener('click',()=>copy('APIFY_TOKEN','Nazwa APIFY_TOKEN skopiowana'));
    }else{
      panel.insertAdjacentHTML('afterend',`<section class="social-connect-hub" id="socialConnectHub"><b>Social Connect Hub</b><p class="page-subtitle">Nie udało się odczytać statusu providerów. Dane lokalne pozostają dostępne.</p></section>`);
    }
  }

  function ensure(){
    if(!q('.social-sync-panel'))return;
    if(last)render();else load();
  }

  document.addEventListener('DOMContentLoaded',()=>{
    const root=q('#content');
    if(root)new MutationObserver(()=>setTimeout(ensure,30)).observe(root,{childList:true,subtree:true});
    setTimeout(ensure,250);
  });
  window.AIISocialConnectHub={refresh:load,get status(){return last;}};
})();