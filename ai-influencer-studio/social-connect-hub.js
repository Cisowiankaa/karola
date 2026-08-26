(() => {
  const STATUS='/api/social-provider-status';
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
    .social-provider-card.live{background:#f1fbf5;border-color:#d5efdf}.social-provider-card.warn{background:#fffaf0;border-color:#f1e3bd}.social-provider-card.local{background:#f7f4ff;border-color:#e2d9fb}
    .social-connect-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
    @media(max-width:900px){.social-provider-grid{grid-template-columns:1fr 1fr}}@media(max-width:560px){.social-provider-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const yes=v=>Boolean(v);
  function card(name,state,detail,cls='warn'){
    return `<div class="social-provider-card ${cls}"><b>${esc(name)}</b><strong>${esc(state)}</strong><small>${esc(detail)}</small></div>`;
  }

  function html(data){
    const p=data?.providers||{},m=data?.missing||{};
    const ig=p.instagram||{},fb=p.facebook||{},tt=p.tiktok||{};
    const igState=ig.metaConfigured?'META GOTOWE':ig.apifyConfigured?'APIFY GOTOWY':'TRYB LOKALNY';
    const igCls=ig.metaConfigured||ig.apifyConfigured?'live':'warn';
    const igDetail=ig.metaConfigured?'Instagram może używać Meta LIVE.':ig.apifyConfigured?'Meta niedostępne — dostępny fallback Apify.':`Brak LIVE. Potrzebne: ${(m.instagram||[]).join(', ')||'konfiguracja Meta/Apify'}`;
    const fbState=fb.metaConfigured?'META GOTOWE':'TRYB LOKALNY';
    const fbDetail=fb.metaConfigured?'Facebook może używać Meta LIVE.':`Brak LIVE. Potrzebne: ${(m.facebook||[]).join(', ')||'konfiguracja Meta'}`;
    const ttState=tt.configured?'TIKTOK GOTOWY':tt.apifyConfigured?'APIFY READY':'TRYB LOKALNY';
    const ttDetail=tt.configured?'TikTok API skonfigurowane.':tt.apifyConfigured?'Możliwy fallback Apify po podpięciu aktora TikTok.':`Brak LIVE. Potrzebne: ${(m.tiktok||[]).join(', ')||'konfiguracja TikTok'}`;
    return `<section class="social-connect-hub" id="socialConnectHub">
      <div class="social-connect-head"><div><b>Social Connect Hub</b><span>Źródła danych i automatyczne fallbacki</span></div><span>${esc(data?.checkedAt?new Date(data.checkedAt).toLocaleTimeString('pl-PL'):'')}</span></div>
      <div class="social-provider-grid">
        ${card('Instagram',igState,igDetail,igCls)}
        ${card('Facebook',fbState,fbDetail,fb.metaConfigured?'live':'warn')}
        ${card('TikTok',ttState,ttDetail,tt.configured||tt.apifyConfigured?'live':'warn')}
        ${card('Dane lokalne','ZAWSZE DOSTĘPNE','Ostatnie zapisane profile i publikacje pozostają dostępne przy awarii API.','local')}
      </div>
      <div class="social-connect-actions"><button class="ghost" type="button" id="socialProviderRefresh">↻ Sprawdź źródła</button></div>
    </section>`;
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