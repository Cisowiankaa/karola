(() => {
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const toast=t=>window.showToast?window.showToast(t):alert(t);
  const defaults=[
    {id:'m1',brand:'Marka Beauty',subject:'Propozycja współpracy',status:'Do odpowiedzi',type:'Płatna',body:'Dzień dobry, chcielibyśmy zaprosić do współpracy przy kampanii beauty.'},
    {id:'m2',brand:'Wydawnictwo',subject:'Egzemplarz recenzencki',status:'Oczekuje',type:'Barter',body:'Czy byłaby Pani zainteresowana recenzją nowej książki?'}
  ];
  function reply(kind,brand){const b=brand||'Marka';const m={
    positive:`Dzień dobry,\n\ndziękuję za wiadomość i propozycję współpracy z ${b}. Temat jest dla mnie interesujący. Proszę o przesłanie pełnego briefu, zakresu materiałów, terminu publikacji, informacji o budżecie oraz zasad wykorzystania przygotowanych treści.\n\nPo zapoznaniu się ze szczegółami chętnie potwierdzę dostępność.\n\nPozdrawiam`,
    negotiate:`Dzień dobry,\n\ndziękuję za przesłane warunki. Przy wskazanym zakresie materiałów moja stawka wymaga korekty. Wycena uwzględnia przygotowanie koncepcji, produkcję, montaż, publikację oraz prawa do wykorzystania treści.\n\nProponuję omówić budżet i dopasować zakres tak, aby był korzystny dla obu stron.\n\nPozdrawiam`,
    decline:`Dzień dobry,\n\ndziękuję za kontakt i propozycję współpracy. Tym razem nie będę mogła jej przyjąć. Chętnie pozostanę w kontakcie przy kolejnych projektach lepiej dopasowanych do mojego profilu.\n\nPozdrawiam`,
    follow:`Dzień dobry,\n\nwracam do naszej wcześniejszej wiadomości dotyczącej współpracy. Czy udało się już podjąć decyzję w sprawie briefu, budżetu i terminu realizacji?\n\nBędę wdzięczna za krótką informację zwrotną.\n\nPozdrawiam`
  };return m[kind]||''}
  function render(){
    const content=document.getElementById('content'); if(!content)return;
    const title=document.getElementById('pageTitle'),sub=document.getElementById('pageSubtitle');
    if(title)title.textContent='Wiadomości'; if(sub)sub.textContent='Skrzynka współprac, gotowe odpowiedzi i follow-upy.';
    document.querySelectorAll('.nav-item').forEach(a=>a.classList.toggle('active',a.dataset.view==='messages'));
    const msgs=read('aii-messages',defaults); const due=msgs.filter(x=>x.status==='Do odpowiedzi').length;
    content.innerHTML=`<section class="creator-tool-hero"><div><div class="eyebrow">INBOX CRM</div><h2>Wiadomości i negocjacje</h2><p>Obsługuj rozmowy z markami, zapisuj odpowiedzi i pilnuj follow-upów.</p></div><span class="tag">${due} DO ODPOWIEDZI</span></section>
    <section style="display:grid;grid-template-columns:minmax(280px,.8fr) minmax(420px,1.2fr);gap:14px">
      <article class="card panel-card"><div class="section-head"><h2>Skrzynka</h2><button class="primary" id="mhNew">＋ Nowa</button></div><div id="mhList" style="display:grid;gap:8px"></div></article>
      <article class="card panel-card"><div class="form-grid"><label>Marka / kontakt<input id="mhBrand"></label><label>Temat<input id="mhSubject"></label><label>Status<select id="mhStatus"><option>Do odpowiedzi</option><option>Oczekuje</option><option>Odpowiedziano</option><option>Zamknięta</option></select></label><label>Typ<select id="mhType"><option>Płatna</option><option>Barter</option><option>Affiliate</option><option>Ambasadorstwo</option><option>Inna</option></select></label><label>Treść wiadomości<textarea id="mhBody" rows="9"></textarea></label></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0"><button class="ghost" data-mh="positive">Odpowiedź pozytywna</button><button class="ghost" data-mh="negotiate">Negocjacja stawki</button><button class="ghost" data-mh="decline">Odmowa</button><button class="ghost" data-mh="follow">Follow-up</button></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="primary" id="mhSave">Zapisz rozmowę</button><button class="ghost" id="mhCopy">Kopiuj</button><button class="ghost" id="mhDone">Oznacz odpowiedziano</button><button class="ghost" id="mhDelete">Usuń</button></div></article>
    </section>`;
    let current=null;
    const list=()=>{const box=document.getElementById('mhList');box.innerHTML=msgs.length?msgs.map(m=>`<button data-id="${m.id}" style="text-align:left;border:1px solid #e7e9f1;border-radius:12px;background:${current===m.id?'#f4f0ff':'#fff'};padding:11px;cursor:pointer"><b>${esc(m.brand)}</b><br><small>${esc(m.subject)} • ${esc(m.status)}</small></button>`).join(''):'<p class="page-subtitle">Brak wiadomości.</p>';box.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>load(b.dataset.id))};
    const clear=()=>{current=null;['mhBrand','mhSubject','mhBody'].forEach(id=>document.getElementById(id).value='');document.getElementById('mhStatus').value='Do odpowiedzi';document.getElementById('mhType').value='Płatna';list()};
    const load=id=>{const m=msgs.find(x=>String(x.id)===String(id));if(!m)return;current=m.id;document.getElementById('mhBrand').value=m.brand||'';document.getElementById('mhSubject').value=m.subject||'';document.getElementById('mhStatus').value=m.status||'Do odpowiedzi';document.getElementById('mhType').value=m.type||'Płatna';document.getElementById('mhBody').value=m.body||'';list()};
    document.getElementById('mhNew').onclick=clear;
    document.querySelectorAll('[data-mh]').forEach(b=>b.onclick=()=>document.getElementById('mhBody').value=reply(b.dataset.mh,document.getElementById('mhBrand').value.trim()));
    document.getElementById('mhSave').onclick=()=>{const item={id:current||('m'+Date.now()),brand:document.getElementById('mhBrand').value.trim()||'Nowy kontakt',subject:document.getElementById('mhSubject').value.trim()||'Bez tematu',status:document.getElementById('mhStatus').value,type:document.getElementById('mhType').value,body:document.getElementById('mhBody').value.trim(),date:new Date().toISOString()};const i=msgs.findIndex(x=>String(x.id)===String(item.id));if(i>=0)msgs[i]=item;else msgs.unshift(item);current=item.id;save('aii-messages',msgs);list();toast('Rozmowa zapisana')};
    document.getElementById('mhCopy').onclick=async()=>{try{await navigator.clipboard.writeText(document.getElementById('mhBody').value);toast('Odpowiedź skopiowana')}catch{toast('Nie udało się skopiować')}};
    document.getElementById('mhDone').onclick=()=>{document.getElementById('mhStatus').value='Odpowiedziano';document.getElementById('mhSave').click()};
    document.getElementById('mhDelete').onclick=()=>{if(!current)return;const i=msgs.findIndex(x=>String(x.id)===String(current));if(i>=0)msgs.splice(i,1);save('aii-messages',msgs);clear();toast('Wiadomość usunięta')};
    list(); if(msgs[0])load(msgs[0].id);
  }
  function bind(){document.querySelectorAll('.nav-item[data-view="messages"]').forEach(a=>{a.onclick=e=>{e.preventDefault();localStorage.setItem('aii-last-view','messages');render()}})}
  document.addEventListener('DOMContentLoaded',()=>{bind();if(localStorage.getItem('aii-last-view')==='messages')setTimeout(render,50);const nav=document.querySelector('.nav');if(nav)new MutationObserver(bind).observe(nav,{childList:true,subtree:true})});
})();