(() => {
  const q=s=>document.querySelector(s);
  const content=()=>document.getElementById('content');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const toast=t=>window.showToast?window.showToast(t):alert(t);
  const setHead=(title,sub)=>{const a=q('#pageTitle'),b=q('#pageSubtitle');if(a)a.textContent=title;if(b)b.textContent=sub};

  const style=document.createElement('style');
  style.textContent=`
    .msg-grid{display:grid;grid-template-columns:minmax(300px,.8fr) minmax(440px,1.2fr);gap:14px}.msg-card{background:#fff;border:1px solid #e7e9f1;border-radius:16px;padding:16px}.msg-list{display:grid;gap:8px;max-height:560px;overflow:auto}.msg-item{border:1px solid #e8eaf1;border-radius:12px;padding:11px;background:#fff;cursor:pointer}.msg-item.active{border-color:#8b70ef;background:#f7f4ff}.msg-item b{display:block;font-size:10px}.msg-item span{font-size:8px;color:#7b8290}.msg-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#6d4be8;margin-right:5px}.msg-form{display:grid;gap:9px}.msg-form label{display:grid;gap:5px;font-size:9px;font-weight:800;color:#717887}.msg-form input,.msg-form textarea,.msg-form select{width:100%;box-sizing:border-box;border:1px solid #dfe2eb;border-radius:10px;padding:10px 11px;background:#fbfbfd;color:#242833;font:inherit}.msg-form textarea{min-height:120px;resize:vertical}.msg-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.msg-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}.msg-kpi{background:#fff;border:1px solid #e7e9f1;border-radius:14px;padding:12px}.msg-kpi b{font-size:18px;display:block}.msg-kpi span{font-size:8px;color:#7b8290}.msg-template{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.msg-template button{border:1px solid #e3e5ed;background:#fff;border-radius:999px;padding:7px 9px;font-size:8px;cursor:pointer}@media(max-width:900px){.msg-grid,.msg-kpis{grid-template-columns:1fr}}
  `;document.head.appendChild(style);

  const defaults=[
    {id:'m1',brand:'Marka Beauty',subject:'Propozycja współpracy',status:'Do odpowiedzi',type:'Płatna',date:new Date().toISOString().slice(0,10),body:'Dzień dobry, chcielibyśmy zaprosić do współpracy przy kampanii beauty.'},
    {id:'m2',brand:'Wydawnictwo',subject:'Egzemplarz recenzencki',status:'Oczekuje',type:'Barter',date:new Date().toISOString().slice(0,10),body:'Czy byłaby Pani zainteresowana recenzją nowej książki?'}
  ];

  function templates(kind,brand='Marka'){
    const map={
      'Odpowiedź pozytywna':`Dzień dobry,\n\ndziękuję za wiadomość i propozycję współpracy z ${brand}. Temat jest dla mnie interesujący. Proszę o przesłanie pełnego briefu, zakresu materiałów, terminu publikacji, informacji o budżecie oraz zasad wykorzystania przygotowanych treści.\n\nPo zapoznaniu się ze szczegółami chętnie potwierdzę dostępność.\n\nPozdrawiam`,
      'Negocjacja stawki':`Dzień dobry,\n\ndziękuję za przesłane warunki. Przy wskazanym zakresie materiałów moja stawka wymaga korekty. Wycena uwzględnia przygotowanie koncepcji, produkcję, montaż, publikację oraz prawa do wykorzystania treści.\n\nProponuję omówić budżet i dopasować zakres tak, aby był korzystny dla obu stron.\n\nPozdrawiam`,
      'Odmowa':`Dzień dobry,\n\ndziękuję za kontakt i propozycję współpracy. Tym razem nie będę mogła jej przyjąć. Doceniam zaproszenie i chętnie pozostanę w kontakcie przy kolejnych projektach lepiej dopasowanych do mojego profilu.\n\nPozdrawiam`,
      'Follow-up':`Dzień dobry,\n\nwracam do naszej wcześniejszej wiadomości dotyczącej współpracy. Czy udało się już podjąć decyzję w sprawie briefu, budżetu i terminu realizacji?\n\nBędę wdzięczna za krótką informację zwrotną.\n\nPozdrawiam`
    };
    return map[kind]||'';
  }

  function render(){
    setHead('Wiadomości','Skrzynka współprac, gotowe odpowiedzi i follow-upy.');
    const msgs=read('aii-messages',defaults);
    const collabs=read('aii-collabs',[]);
    const due=msgs.filter(x=>x.status==='Do odpowiedzi').length;
    const waiting=msgs.filter(x=>x.status==='Oczekuje').length;
    content().innerHTML=`<section class="creator-tool-hero"><div><div class="eyebrow">INBOX CRM</div><h2>Wiadomości i negocjacje</h2><p>Obsługuj rozmowy z markami, zapisuj odpowiedzi i pilnuj follow-upów.</p></div><span class="tag">CRM</span></section><section class="msg-kpis"><div class="msg-kpi"><b>${msgs.length}</b><span>wszystkie rozmowy</span></div><div class="msg-kpi"><b>${due}</b><span>do odpowiedzi</span></div><div class="msg-kpi"><b>${waiting}</b><span>oczekujące</span></div><div class="msg-kpi"><b>${collabs.length}</b><span>powiązane współprace</span></div></section><section class="msg-grid"><div class="msg-card"><div class="msg-actions" style="margin-top:0;margin-bottom:10px"><button class="primary" id="msgNew">＋ Nowa wiadomość</button><select id="msgFilter"><option>Wszystkie</option><option>Do odpowiedzi</option><option>Oczekuje</option><option>Zamknięta</option></select></div><div class="msg-list" id="msgList"></div></div><div class="msg-card"><div class="msg-form"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><label>Marka / kontakt<input id="msgBrand"></label><label>Status<select id="msgStatus"><option>Do odpowiedzi</option><option>Oczekuje</option><option>Odpowiedziano</option><option>Zamknięta</option></select></label></div><label>Temat<input id="msgSubject"></label><label>Typ współpracy<select id="msgType"><option>Płatna</option><option>Barter</option><option>Affiliate</option><option>Ambasadorstwo</option><option>Inna</option></select></label><label>Powiązana współpraca<select id="msgCollab"><option value="">Brak</option>${collabs.map((c,i)=>`<option value="${i}">${esc(c.brand||c.name||'Współpraca')}</option>`).join('')}</select></label><label>Treść wiadomości<textarea id="msgBody"></textarea></label></div><div class="msg-template"><button data-tpl="Odpowiedź pozytywna">Odpowiedź pozytywna</button><button data-tpl="Negocjacja stawki">Negocjacja stawki</button><button data-tpl="Odmowa">Odmowa</button><button data-tpl="Follow-up">Follow-up</button></div><div class="msg-actions"><button class="primary" id="msgSave">Zapisz rozmowę</button><button class="ghost" id="msgCopy">Kopiuj odpowiedź</button><button class="ghost" id="msgAnswered">Oznacz jako odpowiedziano</button><button class="ghost" id="msgDelete">Usuń</button></div></div></section>`;

    let current=null;
    const draw=()=>{const filter=q('#msgFilter').value;const rows=msgs.filter(x=>filter==='Wszystkie'||x.status===filter);q('#msgList').innerHTML=rows.length?rows.map(x=>`<div class="msg-item ${current===x.id?'active':''}" data-id="${x.id}"><b>${x.status==='Do odpowiedzi'?'<span class="msg-dot"></span>':''}${esc(x.brand)}</b><span>${esc(x.subject)} • ${esc(x.status)}</span></div>`).join(''):'<div class="suite-note">Brak wiadomości w tym widoku.</div>';q('#msgList').querySelectorAll('[data-id]').forEach(el=>el.onclick=()=>load(el.dataset.id));};
    const clear=()=>{current=null;q('#msgBrand').value='';q('#msgSubject').value='';q('#msgStatus').value='Do odpowiedzi';q('#msgType').value='Płatna';q('#msgCollab').value='';q('#msgBody').value='';draw();};
    const load=id=>{const m=msgs.find(x=>x.id===id);if(!m)return;current=id;q('#msgBrand').value=m.brand||'';q('#msgSubject').value=m.subject||'';q('#msgStatus').value=m.status||'Do odpowiedzi';q('#msgType').value=m.type||'Płatna';q('#msgCollab').value=m.collab??'';q('#msgBody').value=m.body||'';draw();};
    q('#msgFilter').onchange=draw;q('#msgNew').onclick=clear;
    q('#msgSave').onclick=()=>{const item={id:current||('m'+Date.now()),brand:q('#msgBrand').value.trim()||'Nowy kontakt',subject:q('#msgSubject').value.trim()||'Bez tematu',status:q('#msgStatus').value,type:q('#msgType').value,collab:q('#msgCollab').value,body:q('#msgBody').value.trim(),date:new Date().toISOString()};const i=msgs.findIndex(x=>x.id===item.id);if(i>=0)msgs[i]=item;else msgs.unshift(item);current=item.id;save('aii-messages',msgs);draw();toast('Rozmowa zapisana')};
    q('#msgCopy').onclick=async()=>{try{await navigator.clipboard.writeText(q('#msgBody').value);toast('Odpowiedź skopiowana')}catch{toast('Nie udało się skopiować')}};
    q('#msgAnswered').onclick=()=>{q('#msgStatus').value='Odpowiedziano';q('#msgSave').click()};
    q('#msgDelete').onclick=()=>{if(!current)return;const i=msgs.findIndex(x=>x.id===current);if(i>=0)msgs.splice(i,1);save('aii-messages',msgs);clear();toast('Wiadomość usunięta')};
    document.querySelectorAll('[data-tpl]').forEach(b=>b.onclick=()=>{q('#msgBody').value=templates(b.dataset.tpl,q('#msgBrand').value.trim()||'Marka');toast('Szablon wstawiony')});
    draw();if(msgs[0])load(msgs[0].id);
  }

  function bind(){document.querySelectorAll('.nav-item[data-view="messages"]').forEach(a=>{if(a.dataset.msgBound)return;a.dataset.msgBound='1';a.addEventListener('click',()=>setTimeout(()=>{render();localStorage.setItem('aii-last-view','messages')},20));});}
  document.addEventListener('DOMContentLoaded',()=>{bind();if(localStorage.getItem('aii-last-view')==='messages')setTimeout(render,120);const nav=document.querySelector('.nav');if(nav)new MutationObserver(bind).observe(nav,{childList:true,subtree:true});});
})();