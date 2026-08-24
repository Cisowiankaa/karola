(() => {
  const q=s=>document.querySelector(s);
  const content=()=>document.getElementById('content');
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const toast=t=>window.showToast?window.showToast(t):alert(t);
  const setHead=(title,sub)=>{const a=q('#pageTitle'),b=q('#pageSubtitle');if(a)a.textContent=title;if(b)b.textContent=sub};
  const KEY='aii-social-queue';
  const PROFILES='aii-social-profiles';
  const defaultProfiles=[
    {platform:'Instagram',handle:'@karolajna.86',active:true},
    {platform:'Instagram',handle:'@oczytana.karolcia',active:true},
    {platform:'TikTok',handle:'',active:false},
    {platform:'Facebook',handle:'',active:false}
  ];
  const style=document.createElement('style');
  style.textContent=`
    .social-grid{display:grid;grid-template-columns:minmax(300px,.75fr) minmax(460px,1.25fr);gap:14px}.social-card{background:#fff;border:1px solid #e7e9f1;border-radius:16px;padding:18px}.social-form{display:grid;gap:10px}.social-form label{display:grid;gap:5px;font-size:9px;font-weight:800;color:#717887}.social-form input,.social-form textarea,.social-form select{width:100%;box-sizing:border-box;border:1px solid #dfe2eb;border-radius:10px;padding:10px 11px;background:#fbfbfd;color:#242833;font:inherit}.social-form textarea{min-height:88px}.social-two{display:grid;grid-template-columns:1fr 1fr;gap:9px}.social-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.social-list{display:grid;gap:8px}.social-row{display:grid;grid-template-columns:1.2fr .8fr .7fr .7fr auto;gap:8px;align-items:center;border:1px solid #eceef5;border-radius:12px;padding:10px;background:#fafafe}.social-row small{color:#7b8290}.social-badge{display:inline-flex;padding:5px 8px;border-radius:999px;background:#f1edff;color:#6647da;font-size:8px;font-weight:900}.social-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}.social-kpi{padding:12px;border:1px solid #eceef5;border-radius:12px;background:#fafafe}.social-kpi b{display:block;font-size:18px}.social-kpi span{font-size:8px;color:#7b8290}.profile-row{display:grid;grid-template-columns:.8fr 1.2fr auto;gap:8px;align-items:center;margin-bottom:8px}.profile-row input{width:100%;box-sizing:border-box;border:1px solid #dfe2eb;border-radius:9px;padding:9px}.profile-row button{white-space:nowrap}@media(max-width:950px){.social-grid,.social-two,.social-kpis,.social-row{grid-template-columns:1fr}}`;
  document.head.appendChild(style);

  function render(){
    setHead('Social Media','Profile, planowanie publikacji i kolejka treści.');
    const items=read(KEY,[]);
    const profiles=read(PROFILES,defaultProfiles);
    const now=new Date();
    const scheduled=items.filter(x=>x.status==='Zaplanowany').length;
    const draft=items.filter(x=>x.status==='Szkic').length;
    const ready=items.filter(x=>x.status==='Gotowy').length;
    const published=items.filter(x=>x.status==='Opublikowany').length;
    content().innerHTML=`<section class="creator-tool-hero"><div><div class="eyebrow">SOCIAL COMMAND CENTER</div><h2>Social Media Studio</h2><p>Zarządzaj profilami, kolejką treści i terminami publikacji w jednym miejscu.</p></div><span class="tag">PUBLISHING QUEUE</span></section>
    <section class="social-kpis"><div class="social-kpi"><b>${scheduled}</b><span>zaplanowane</span></div><div class="social-kpi"><b>${draft}</b><span>szkice</span></div><div class="social-kpi"><b>${ready}</b><span>gotowe</span></div><div class="social-kpi"><b>${published}</b><span>opublikowane</span></div></section>
    <section class="social-grid"><div class="social-card"><h3>Profile</h3><div id="socialProfiles">${profiles.map((p,i)=>`<div class="profile-row"><select data-p-platform="${i}"><option ${p.platform==='Instagram'?'selected':''}>Instagram</option><option ${p.platform==='TikTok'?'selected':''}>TikTok</option><option ${p.platform==='Facebook'?'selected':''}>Facebook</option><option ${p.platform==='YouTube'?'selected':''}>YouTube</option></select><input data-p-handle="${i}" value="${esc(p.handle)}" placeholder="@nazwa profilu"><button class="ghost" data-p-toggle="${i}">${p.active?'Aktywny':'Wyłączony'}</button></div>`).join('')}</div><div class="social-actions"><button class="ghost" id="socialAddProfile">+ Dodaj profil</button><button class="primary" id="socialSaveProfiles">Zapisz profile</button></div><hr style="border:0;border-top:1px solid #eceef5;margin:18px 0"><h3>Nowa publikacja</h3><div class="social-form"><label>Tytuł / temat<input id="socialTitle" placeholder="Np. Reels – test serum"></label><div class="social-two"><label>Platforma<select id="socialPlatform">${profiles.filter(p=>p.active).map(p=>`<option>${esc(p.platform)} ${esc(p.handle)}</option>`).join('')||'<option>Instagram</option>'}</select></label><label>Typ<select id="socialType"><option>Post</option><option>Reels</option><option>Stories</option><option>Carousel</option><option>Shorts</option></select></label></div><div class="social-two"><label>Data<input id="socialDate" type="date"></label><label>Godzina<input id="socialTime" type="time" value="18:00"></label></div><label>Status<select id="socialStatus"><option>Szkic</option><option>Gotowy</option><option>Zaplanowany</option><option>Opublikowany</option></select></label><label>Opis / notatki<textarea id="socialNotes" placeholder="CTA, link, oznaczenia, uwagi..."></textarea></label></div><div class="social-actions"><button class="primary" id="socialAdd">Dodaj do kolejki</button></div></div>
    <div class="social-card"><h3>Kolejka publikacji</h3><div class="social-list" id="socialList">${items.length?items.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).map((x,i)=>`<div class="social-row" data-id="${x.id}"><div><b>${esc(x.title)}</b><small>${esc(x.type)}</small></div><div>${esc(x.platform)}</div><div>${esc(x.date||'bez daty')}<small>${esc(x.time||'')}</small></div><div><span class="social-badge">${esc(x.status)}</span></div><button class="ghost" data-social-done="${x.id}">${x.status==='Opublikowany'?'Cofnij':'Publikacja ✓'}</button></div>`).join(''):'<div class="social-row"><div><b>Brak publikacji</b><small>Dodaj pierwszą po lewej stronie.</small></div></div>'}</div></div></section>`;

    const saveProfiles=()=>{const base=read(PROFILES,profiles);const next=[...document.querySelectorAll('[data-p-handle]')].map((el,i)=>({platform:document.querySelector(`[data-p-platform="${i}"]`).value,handle:el.value.trim(),active:base[i]?.active!==false}));save(PROFILES,next);toast('Profile social media zapisane')};
    q('#socialSaveProfiles').onclick=saveProfiles;
    document.querySelectorAll('[data-p-toggle]').forEach(btn=>btn.onclick=()=>{const arr=read(PROFILES,profiles);const i=Number(btn.dataset.pToggle);arr[i].active=!arr[i].active;save(PROFILES,arr);render()});
    q('#socialAddProfile').onclick=()=>{const arr=read(PROFILES,profiles);arr.push({platform:'Instagram',handle:'',active:true});save(PROFILES,arr);render()};
    q('#socialAdd').onclick=()=>{const title=q('#socialTitle').value.trim();if(!title){toast('Wpisz tytuł publikacji');return}const arr=read(KEY,[]);arr.push({id:Date.now(),title,platform:q('#socialPlatform').value,type:q('#socialType').value,date:q('#socialDate').value,time:q('#socialTime').value,status:q('#socialStatus').value,notes:q('#socialNotes').value.trim(),createdAt:Date.now()});save(KEY,arr);document.dispatchEvent(new CustomEvent('aii:social-changed',{detail:{count:arr.length}}));toast('Publikacja dodana do kolejki');render()};
    document.querySelectorAll('[data-social-done]').forEach(btn=>btn.onclick=()=>{const arr=read(KEY,[]);const x=arr.find(v=>String(v.id)===String(btn.dataset.socialDone));if(x)x.status=x.status==='Opublikowany'?'Gotowy':'Opublikowany';save(KEY,arr);render()});
  }
  function bind(){document.querySelectorAll('.nav-item[data-view="social"]').forEach(a=>{if(a.dataset.socialStudioBound)return;a.dataset.socialStudioBound='1';a.addEventListener('click',()=>setTimeout(()=>{render();localStorage.setItem('aii-last-view','social')},20));});}
  document.addEventListener('DOMContentLoaded',()=>{bind();if(localStorage.getItem('aii-last-view')==='social')setTimeout(render,80);const nav=document.querySelector('.nav');if(nav)new MutationObserver(bind).observe(nav,{childList:true,subtree:true});});
})();