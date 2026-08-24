(() => {
  const q=s=>document.querySelector(s);
  const content=()=>document.getElementById('content');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const toast=t=>window.showToast?window.showToast(t):alert(t);
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const setHead=(title,sub)=>{const a=q('#pageTitle'),b=q('#pageSubtitle');if(a)a.textContent=title;if(b)b.textContent=sub};

  const style=document.createElement('style');
  style.textContent=`
    .post-pro-grid{display:grid;grid-template-columns:minmax(320px,.85fr) minmax(420px,1.15fr);gap:14px}.post-pro-card{background:#fff;border:1px solid #e7e9f1;border-radius:16px;padding:18px}.post-pro-form{display:grid;gap:10px}.post-pro-form label{display:grid;gap:5px;font-size:9px;font-weight:800;color:#717887}.post-pro-form input,.post-pro-form textarea,.post-pro-form select{width:100%;box-sizing:border-box;border:1px solid #dfe2eb;border-radius:10px;padding:10px 11px;background:#fbfbfd;color:#242833;font:inherit}.post-pro-form textarea{min-height:100px;resize:vertical}.post-pro-two{display:grid;grid-template-columns:1fr 1fr;gap:9px}.post-pro-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.post-pro-output{white-space:pre-wrap;line-height:1.55;background:#fafafe;border:1px dashed #d9ddea;border-radius:12px;padding:15px;min-height:430px;font-size:10px}.post-pro-meta{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 10px}.post-pro-pill{padding:6px 9px;border-radius:999px;background:#f1edff;color:#6647da;font-size:8px;font-weight:900}.post-pro-history{display:grid;gap:7px;margin-top:10px}.post-pro-history button{border:1px solid #e6e8ef;background:#fff;border-radius:9px;padding:9px;text-align:left;font-size:8px;cursor:pointer}@media(max-width:900px){.post-pro-grid,.post-pro-two{grid-template-columns:1fr}}
  `;document.head.appendChild(style);

  const toneOpen={
    'Naturalny':'Piszę o tym bez napinki, bo właśnie takie rzeczy najlepiej sprawdzać po swojemu i bez udawania, że wszystko zawsze działa idealnie.',
    'Ekspercki':'Warto spojrzeć na ten temat praktycznie: nie przez modne hasła, ale przez konkretne efekty, wygodę i to, czy rozwiązanie rzeczywiście ma sens w codziennym użyciu.',
    'Humorystyczny':'No dobrze, przyznaję: podeszłam do tego z miną „zobaczymy, czy to naprawdę takie dobre”, a potem sama zaczęłam się zastanawiać, czemu wcześniej tego nie sprawdziłam.',
    'Sprzedażowy':'Jeśli szukasz rozwiązania, które ma być nie tylko ładne na zdjęciu, ale przede wszystkim przydatne i wygodne w codziennym użyciu, ten temat zdecydowanie warto poznać bliżej.',
    'Emocjonalny':'Są takie drobiazgi, które pozornie niczego nie zmieniają, a jednak potrafią poprawić dzień, dodać pewności siebie albo po prostu sprawić, że codzienność staje się przyjemniejsza.'
  };

  function hashtags(topic,platform){
    const base=topic.toLowerCase().replace(/[^a-ząćęłńóśźż0-9 ]/gi,' ').split(/\s+/).filter(x=>x.length>3).slice(0,2).map(x=>'#'+x.replace(/[ąćęłńóśźż]/g,c=>({'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z'}[c]||c)));
    return [...base,'#recenzja','#polecam','#'+platform.toLowerCase().replace(/\s/g,'')].slice(0,5).join(' ');
  }

  function buildPost(topic,platform,tone,goal,details){
    const hook=goal==='Sprzedaż' ? `Czy ${topic} naprawdę jest warte uwagi i pieniędzy? Sprawdziłam to dokładniej.` : goal==='Recenzja' ? `${topic} — hit, przeciętniak czy coś, do czego naprawdę warto wrócić?` : goal==='Zaangażowanie' ? `Jestem ciekawa, czy też macie podobnie z tematem: ${topic}.` : `Dzisiaj biorę pod lupę: ${topic}. Bez przesadnych obietnic, za to z konkretnymi wnioskami.`;
    const extra=details ? `\n\nW moim przypadku szczególnie zwróciłam uwagę na: ${details}. To właśnie takie detale często decydują, czy coś zostaje ze mną na dłużej, czy po pierwszym zachwycie trafia na dalszy plan.` : '';
    let text=`${hook}\n\n${toneOpen[tone]||toneOpen.Naturalny}\n\nPierwsze wrażenie jest ważne, ale dla mnie nigdy nie jest najważniejsze. Liczy się to, co dzieje się później: czy korzystanie z tego jest wygodne, czy efekt jest powtarzalny i czy po kilku dniach nadal mam ochotę po to sięgać. Przy ${topic} właśnie na tym skupiłam się najbardziej.\n\nNa plus zaliczam przede wszystkim łatwość włączenia tego do codziennej rutyny. Nie trzeba od razu zmieniać wszystkiego ani robić rewolucji. Można zacząć od małego kroku, obserwować efekt i dopiero potem zdecydować, czy warto iść dalej. To podejście sprawdza mi się najlepiej, bo pozwala uniknąć kupowania lub robienia czegoś tylko dlatego, że akurat jest modne.${extra}\n\nDruga rzecz to oczekiwania. Często widzimy w social mediach efekt końcowy, ale nie widzimy całego procesu. Dlatego wolę mówić wprost: ${topic} może być świetnym wyborem, ale dużo zależy od potrzeb, budżetu i sposobu używania. To, co u jednej osoby będzie hitem, u innej może okazać się zupełnie zbędne.\n\nPo swoim teście mam jedno główne wrażenie: warto patrzeć na praktyczne korzyści, a nie tylko na opakowanie, trend czy pierwsze emocje. Jeżeli coś faktycznie ułatwia codzienność, oszczędza czas albo daje efekt, którego szukamy, wtedy ma dla mnie sens. Jeżeli nie — bez żalu odpuszczam.\n\nCzy poleciłabym ${topic}? Tak, ale świadomie. Najpierw sprawdziłabym, czy odpowiada dokładnie na potrzebę, którą masz teraz. Wtedy szansa na zadowolenie jest zdecydowanie większa.\n\nDaj znać w komentarzu: znasz już ${topic}, używasz, planujesz sprawdzić, a może masz zupełnie inne doświadczenia? Chętnie porównam opinie.\n\n${hashtags(topic,platform)}`;
    if(text.length<1800){text=text.replace('\n\nDaj znać',`\n\nNajbardziej lubię właśnie takie testy, w których po kilku dniach można powiedzieć coś więcej niż tylko „ładne” albo „nie dla mnie”. Dla mnie dobra rekomendacja powinna pokazywać zarówno mocne strony, jak i ograniczenia — dzięki temu łatwiej podjąć własną decyzję.\n\nDaj znać`)}
    if(text.length>2200) text=text.slice(0,2150).replace(/\s+\S*$/,'')+`…\n\n${hashtags(topic,platform)}`;
    return text;
  }

  function render(){
    setHead('Generator postów','Gotowe posty do publikacji — około 2000 znaków.');
    const history=read('aii-post-history',[]);
    content().innerHTML=`<section class="creator-tool-hero"><div><div class="eyebrow">COPY LAB PRO</div><h2>Generator gotowych postów</h2><p>Tworzy pełne teksty około 2000 znaków: hook, rozwinięcie, opinia, CTA i 5 hashtagów.</p></div><span class="tag">~2000 ZNAKÓW</span></section><section class="post-pro-grid"><div class="post-pro-card"><div class="post-pro-form"><label>Temat / produkt<textarea id="ppTopic" placeholder="Np. serum z witaminą C, książka, kosmetyk, usługa..."></textarea></label><div class="post-pro-two"><label>Platforma<select id="ppPlatform"><option>Instagram</option><option>Facebook</option><option>TikTok</option></select></label><label>Ton<select id="ppTone"><option>Naturalny</option><option>Ekspercki</option><option>Humorystyczny</option><option>Sprzedażowy</option><option>Emocjonalny</option></select></label></div><div class="post-pro-two"><label>Cel<select id="ppGoal"><option>Recenzja</option><option>Zaangażowanie</option><option>Sprzedaż</option><option>Informacyjny</option></select></label><label>Długość<select id="ppLength"><option value="2000">około 2000 znaków</option></select></label></div><label>Ważne szczegóły<textarea id="ppDetails" placeholder="Co koniecznie ma znaleźć się w poście? Zalety, wady, doświadczenia, cechy produktu..."></textarea></label></div><div class="post-pro-actions"><button class="primary" id="ppGenerate">Generuj gotowy post</button><button class="ghost" id="ppCopy">Kopiuj</button><button class="ghost" id="ppSave">Zapisz</button></div><div class="post-pro-history">${history.slice(0,4).map((h,i)=>`<button data-post-h="${i}">${esc(h.topic)} • ${h.text.length} znaków</button>`).join('')}</div></div><div class="post-pro-card"><div class="post-pro-meta"><span class="post-pro-pill" id="ppCount">0 znaków</span><span class="post-pro-pill">5 hashtagów</span><span class="post-pro-pill">gotowy do publikacji</span></div><div class="post-pro-output" id="ppOut">Wpisz temat i kliknij „Generuj gotowy post”.</div></div></section>`;
    let last='';
    const generate=()=>{const topic=q('#ppTopic').value.trim()||'wybrany produkt';last=buildPost(topic,q('#ppPlatform').value,q('#ppTone').value,q('#ppGoal').value,q('#ppDetails').value.trim());q('#ppOut').textContent=last;q('#ppCount').textContent=`${last.length} znaków`;toast('Gotowy post wygenerowany')};
    q('#ppGenerate').onclick=generate;
    q('#ppCopy').onclick=async()=>{if(!last)generate();try{await navigator.clipboard.writeText(last);toast('Post skopiowany')}catch{toast('Nie udało się skopiować')}};
    q('#ppSave').onclick=()=>{if(!last)generate();const h=read('aii-post-history',[]);h.unshift({topic:q('#ppTopic').value.trim()||'Post',text:last,ts:Date.now()});save('aii-post-history',h.slice(0,30));toast('Post zapisany')};
    document.querySelectorAll('[data-post-h]').forEach(b=>b.onclick=()=>{const h=history[Number(b.dataset.postH)];if(h){last=h.text;q('#ppTopic').value=h.topic;q('#ppOut').textContent=h.text;q('#ppCount').textContent=`${h.text.length} znaków`;toast('Wczytano zapisany post')}});
  }

  function bind(){document.querySelectorAll('.nav-item[data-view="posts"]').forEach(a=>{if(a.dataset.postProBound)return;a.dataset.postProBound='1';a.addEventListener('click',()=>setTimeout(()=>{render();localStorage.setItem('aii-last-view','posts')},20));});}
  document.addEventListener('DOMContentLoaded',()=>{bind();if(localStorage.getItem('aii-last-view')==='posts')setTimeout(render,80);const nav=document.querySelector('.nav');if(nav)new MutationObserver(bind).observe(nav,{childList:true,subtree:true});});
})();