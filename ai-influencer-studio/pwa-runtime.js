(() => {
  const q=(s,r=document)=>r.querySelector(s);
  const toast=t=>window.showToast?.(t);
  let deferredPrompt=null;

  function ensureManifest(){
    if(q('link[rel="manifest"]')) return;
    const link=document.createElement('link');
    link.rel='manifest';
    link.href='manifest.webmanifest?v=20260827-2';
    document.head.appendChild(link);
    let theme=q('meta[name="theme-color"]');
    if(!theme){theme=document.createElement('meta');theme.name='theme-color';document.head.appendChild(theme)}
    theme.content='#171925';
  }

  function routeFromHash(){
    const page=String(location.hash||'').replace(/^#/,'');
    if(!page) return;
    const item=q(`.nav-item[data-view="${CSS.escape(page)}"]`);
    if(item){setTimeout(()=>item.click(),40)}
  }

  function installCard(){
    const root=q('#content');
    if(!root||!q('.nav-item.active[data-view="settings"]')) return;
    if(q('#aiiPwaInstallCard')) return;
    const card=document.createElement('section');
    card.id='aiiPwaInstallCard';
    card.className='card panel-card';
    card.style.marginTop='12px';
    const standalone=window.matchMedia?.('(display-mode: standalone)')?.matches||navigator.standalone===true;
    card.innerHTML=`<div class="section-head"><div><h2>Instalacja aplikacji</h2><p class="page-subtitle">Uruchamiaj AI Influencer Studio jak zwykłą aplikację z pulpitu.</p></div><span class="tag">${standalone?'ZAINSTALOWANA':'PWA'}</span></div><div class="kpi-line"><span>Tryb</span><b>${standalone?'Aplikacja standalone':'Przeglądarka'}</b></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="primary" id="aiiInstallPwa" type="button" ${standalone?'disabled':''}>${standalone?'✓ Zainstalowana':'Zainstaluj aplikację'}</button></div><p class="page-subtitle" style="margin-top:7px">Jeśli przeglądarka nie pokaże okna instalacji, użyj jej opcji „Zainstaluj aplikację” / „Dodaj do ekranu głównego”.</p>`;
    root.appendChild(card);
    q('#aiiInstallPwa')?.addEventListener('click',async()=>{
      if(standalone){toast?.('Aplikacja jest już uruchomiona w trybie standalone');return}
      if(!deferredPrompt){toast?.('Instalacja będzie dostępna, gdy przeglądarka spełni wymagania PWA');return}
      deferredPrompt.prompt();
      await deferredPrompt.userChoice.catch(()=>null);
      deferredPrompt=null;
      installCard();
    });
  }

  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;installCard()});
  window.addEventListener('appinstalled',()=>{deferredPrompt=null;toast?.('AI Influencer Studio zainstalowane');const c=q('#aiiPwaInstallCard');if(c)c.remove();installCard()});
  window.addEventListener('hashchange',routeFromHash);

  document.addEventListener('DOMContentLoaded',()=>{
    ensureManifest();
    routeFromHash();
    const root=q('#content');
    if(root)new MutationObserver(()=>setTimeout(installCard,20)).observe(root,{childList:true});
    q('.nav-item[data-view="settings"]')?.addEventListener('click',()=>setTimeout(installCard,60));
    setTimeout(installCard,500);
  });

  ensureManifest();
  window.AIIPwaRuntime={installCard,routeFromHash};
})();
