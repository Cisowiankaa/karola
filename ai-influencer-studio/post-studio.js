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
    .post-pro-grid{display:grid;grid-template-columns:minmax(320px,.85fr) minmax(420px,1.15fr);gap:14px}.post-pro-card{background:#fff;border:1px solid #e7e9f1;border-radius:16px;padding:18px}.post-pro-form{display:grid;gap:10px}.post-pro-form label{display:grid;gap:5px;font-size:9px;font-weight:800;color:#717887}.post-pro-form input,.post-pro-form textarea,.post-pro-form select{width:100%;box-sizing:border-box;border:1px solid #dfe2eb;border-radius:10px;padding:10px 11px;background:#fbfbfd;color:#242833;font:inherit}.post-pro-form textarea{min-height:100px;resize:vertical}.post-pro-two{display:grid;grid-template-columns:1fr 1fr;gap:9px}.post-pro-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.post-pro-output{white-space:pre-wrap;line-height:1.55;background:#fafafe;border:1px dashed #d9ddea;border-radius:12px;padding:15px;min-height:430px;font-size:10px}.post-pro-meta{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 10px}.post-pro-pill{padding:6px 9px;border-radius:999px;background:#f1edff;color:#6647da;font-size:8px;font-weight:900}.post-pro-history{display:grid;gap:7px;margin-top:10px}.post-pro-history button{border:1px solid #e6e8ef;background:#fff;border-radius:9px;padding:9px;text-align:left;font-size:8px;cursor:pointer}.post-template-note{padding:10px;border-radius:10px;background:#faf8ff;border:1px solid #ece7ff;font-size:8px;color:#6f6684}@media(max-width:900px){.post-pro-grid,.post-pro-two{grid-template-columns:1fr}}
  `;document.head.appendChild(style);

  const toneOpen={
    'Naturalny':'Piszę o tym bez napinki, bo właśnie takie rzeczy najlepiej sprawdzać po swojemu i bez udawania, że wszystko zawsze działa idealnie.',
    'Ekspercki':'Warto spojrzeć na ten temat praktycznie: nie przez modne hasła, ale przez konkretne efekty, wygodę i to, czy rozwiązanie rzeczywiście ma sens w codziennym użyciu.',
    'Humorystyczny':'No dobrze, przyznaję: podeszłam do tego z miną „zobaczymy, czy to naprawdę takie dobre”, a potem sama zaczęłam się zastanawiać, czemu wcześniej tego nie sprawdziłam.',
    'Sprzedażowy':'Jeśli szukasz rozwiązania, które ma być nie tylko ładne na zdjęciu, ale przede wszystkim przydatne i wygodne w codziennym użyciu, ten temat zdecydowanie warto poznać bliżej.',
    'Emocjonalny':'Są takie drobiazgi, które pozornie niczego nie zmieniają, a jednak potrafią poprawić dzień, dodać pewności siebie albo po prostu sprawić, że codzienność staje się przyjemniejsza.'
  };

  const typeData={
    'Recenzja kosmetyku':{goal:'Recenzja',tone:'Naturalny',hint:'Efekt, konsystencja, zapach, opakowanie, sposób użycia, plusy i minusy.',hook:t=>`${t} — czy naprawdę zasługuje na miejsce w kosmetyczce? Sprawdziłam to w praktyce.`},
    'Współpraca reklamowa':{goal:'Sprzedaż',tone:'Naturalny',hint:'Marka, najważniejsza korzyść, obowiązkowy przekaz, kod rabatowy lub CTA.',hook:t=>`Współpraca reklamowa | Dzisiaj pokazuję Wam ${t} i to, co najbardziej zwróciło moją uwagę podczas testów.`},
    'Recenzja książki':{goal:'Recenzja',tone:'Emocjonalny',hint:'Tytuł, autor, gatunek, klimat, mocne i słabe strony, ocena bez spoilerów.',hook:t=>`${t} — książka, po której zostało ze mną zdecydowanie więcej niż tylko ostatnie zdanie.`},
    'Lifestyle':{goal:'Zaangażowanie',tone:'Naturalny',hint:'Osobiste doświadczenie, codzienna sytuacja, refleksja, pytanie do obserwujących.',hook:t=>`Ostatnio coraz częściej wracam myślami do tematu: ${t}.`},
    'Konkurs':{goal:'Zaangażowanie',tone:'Naturalny',hint:'Nagroda, zasady, termin, sposób wyboru zwycięzcy, wymagane oznaczenia.',hook:t=>`KONKURS 🎁 Mam dla Was coś specjalnego: ${t}.`},
    'Post sprzedażowy':{goal:'Sprzedaż',tone:'Sprzedażowy',hint:'Problem odbiorcy, korzyści, cena/oferta, termin, CTA do zakupu.',hook:t=>`Jeśli właśnie szukasz rozwiązania w temacie ${t}, ten post może oszczędzić Ci sporo czasu.`},
    'Informacyjny / edukacyjny':{goal:'Informacyjny',tone:'Ekspercki',hint:'Fakty, wskazówki, kroki, błędy, podsumowanie i wezwanie do zapisania posta.',hook:t=>`${t} — najważniejsze rzeczy, które warto wiedzieć, zanim zaczniesz.`}
  };

  function hashtags(topic,platform,type){
    const base=topic.toLowerCase().replace(/[^a-ząćęłńóśźż0-9 ]/gi,' ').split(/\s+/).filter(x=>x.length>3).slice(0,2).map(x=>'#'+x.replace(/[ąćęłńóśźż]/g,c=>({'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z'}[c]||c)));
    const typeTag=type.includes('książ')?'#bookstagram':type.includes('kosmet')?'#beauty':type==='Konkurs'?'#konkurs':type.includes('sprzeda')?'#polecam':'#inspiracja';
    return [...base,typeTag,'#'+platform.toLowerCase().replace(/\s/g,''),'#recenzja'].slice(0,5).join(' ');
  }

  function buildPost(topic,platform,tone,goal,details,type){
    const preset=typeData[type]||typeData['Lifestyle'];
    const hook=preset.hook(topic);
    const extra=details ? `\n\nWażny szczegół, którego nie chcę pominąć: ${details}. To właśnie te konkretne elementy najbardziej wpływają na moją końcową ocenę i na to, czy po pierwszym wrażeniu nadal mam ochotę wracać do tematu.` : '';
    const disclosure=type==='Współpraca reklamowa'?'\n\nMateriał powstał we współpracy reklamowej. Jak zawsze pokazuję produkt w swoim stylu i skupiam się na tym, co rzeczywiście może być przydatne w codziennym użyciu.':'';
    const contest=type==='Konkurs'?'\n\nZasady konkursu wpisz w polu „Ważne szczegóły”. Przed publikacją koniecznie sprawdź termin, warunki udziału oraz sposób ogłoszenia wyniku.':'';
    const book=type==='Recenzja książki'?'\n\nBez spoilerów mogę powiedzieć jedno: najbardziej liczył się dla mnie klimat, sposób prowadzenia historii i to, czy bohaterowie zostają w głowie po odłożeniu książki. Nie każda scena musi być idealna, żeby całość potrafiła zrobić wrażenie.':'';
    let text=`${hook}\n\n${toneOpen[tone]||toneOpen.Naturalny}${disclosure}${book}\n\nPierwsze wrażenie jest ważne, ale dla mnie nigdy nie jest najważniejsze. Liczy się to, co dzieje się później: czy ${topic} rzeczywiście spełnia swoje zadanie, czy korzystanie z niego jest wygodne i czy po kilku dniach nadal mam ochotę do niego wracać. Właśnie na tym skupiłam się najbardziej.\n\nNa plus zaliczam przede wszystkim praktyczność. Lubię rzeczy, które można bez problemu włączyć do codziennej rutyny i które nie wymagają robienia wokół nich całej rewolucji. Dobre rozwiązanie powinno po prostu pomagać, dawać przyjemność albo konkretny efekt — najlepiej bez zbędnego komplikowania.${extra}\n\nDruga rzecz to oczekiwania. W social mediach często widzimy tylko efekt końcowy, dlatego wolę pokazywać temat szerzej. ${topic} może być świetnym wyborem, ale dużo zależy od potrzeb, budżetu, gustu i sposobu używania. To, co u jednej osoby będzie hitem, u innej może być po prostu przeciętne.\n\nPo swoim teście mam jedno główne wrażenie: warto patrzeć na realne korzyści, a nie tylko na trend, opakowanie czy pierwszą falę zachwytu. Jeżeli coś faktycznie ułatwia codzienność, daje efekt, którego szukamy, albo sprawia zwyczajnie dużo radości — wtedy ma dla mnie sens.\n\nCzy poleciłabym ${topic}? Tak, ale świadomie. Najpierw sprawdziłabym, czy odpowiada dokładnie na Twoją potrzebę. Wtedy szansa na zadowolenie jest zdecydowanie większa.${contest}\n\nDaj znać w komentarzu: znasz już ${topic}, używasz, czy dopiero planujesz sprawdzić? Jestem bardzo ciekawa Waszych doświadczeń.\n\n${hashtags(topic,platform,type)}`;
    if(text.length<1850) text=text.replace('\n\nDaj znać',`\n\nNajbardziej lubię właśnie takie materiały, w których można powiedzieć coś więcej niż tylko „podoba mi się” albo „nie dla mnie”. Dobra rekomendacja powinna pokazywać zarówno mocne strony, jak i ograniczenia, żeby każdy mógł wyciągnąć własne wnioski.\n\nDaj znać`);
    if(text.length>2200) text=text.slice(0,2140).replace(/\s+\S*$/,'')+`…\n\n${hashtags(topic,platform,type)}`;
    return text;
  }

  function render(){
    setHead('Generator postów','Gotowe posty do publikacji — około 2000 znaków.');
    const history=read('aii-post-history',[]);
    content().innerHTML=`<section class="creator-tool-hero"><div><div class="eyebrow">COPY LAB PRO</div><h2>Generator gotowych postów</h2><p>Wybierz rodzaj treści i otrzymaj pełny post około 2000 znaków z CTA i hashtagami.</p></div><span class="tag">7 GOTOWYCH FORMATÓW</span></section><section class="post-pro-grid"><div class="post-pro-card"><div class="post-pro-form"><label>Rodzaj posta<select id="ppType">${Object.keys(typeData).map(x=>`<option>${x}</option>`).join('')}</select></label><div class="post-template-note" id="ppHint"></div><label>Temat / produkt / książka<textarea id="ppTopic" placeholder="Np. serum z witaminą C, tytuł książki, produkt, wydarzenie..."></textarea></label><div class="post-pro-two"><label>Platforma<select id="ppPlatform"><option>Instagram</option><option>Facebook</option><option>TikTok</option></select></label><label>Ton<select id="ppTone"><option>Naturalny</option><option>Ekspercki</option><option>Humorystyczny</option><option>Sprzedażowy</option><option>Emocjonalny</option></select></label></div><div class="post-pro-two"><label>Cel<select id="ppGoal"><option>Recenzja</option><option>Zaangażowanie</option><option>Sprzedaż</option><option>Informacyjny</option></select></label><label>Długość<select id="ppLength"><option value="2000">około 2000 znaków</option></select></label></div><label>Ważne szczegóły<textarea id="ppDetails" placeholder="Wpisz fakty, zalety, wady, doświadczenia, wymagania marki, zasady konkursu itd."></textarea></label></div><div class="post-pro-actions"><button class="primary" id="ppGenerate">Generuj gotowy post</button><button class="ghost" id="ppCopy">Kopiuj</button><button class="ghost" id="ppSave">Zapisz</button></div><div class="post-pro-history">${history.slice(0,5).map((h,i)=>`<button data-post-h="${i}">${esc(h.type||'Post')} • ${esc(h.topic)} • ${h.text.length} znaków</button>`).join('')}</div></div><div class="post-pro-card"><div class="post-pro-meta"><span class="post-pro-pill" id="ppCount">0 znaków</span><span class="post-pro-pill">do 5 hashtagów</span><span class="post-pro-pill" id="ppTypeBadge">Recenzja kosmetyku</span></div><div class="post-pro-output" id="ppOut">Wybierz rodzaj posta, wpisz temat i kliknij „Generuj gotowy post”.</div></div></section>`;
    let last='';
    const applyPreset=()=>{const p=typeData[q('#ppType').value];q('#ppGoal').value=p.goal;q('#ppTone').value=p.tone;q('#ppHint').textContent='Podpowiedź: '+p.hint;q('#ppTypeBadge').textContent=q('#ppType').value};
    applyPreset();q('#ppType').onchange=applyPreset;
    const generate=()=>{const topic=q('#ppTopic').value.trim()||'wybrany temat';const type=q('#ppType').value;last=buildPost(topic,q('#ppPlatform').value,q('#ppTone').value,q('#ppGoal').value,q('#ppDetails').value.trim(),type);q('#ppOut').textContent=last;q('#ppCount').textContent=`${last.length} znaków`;q('#ppTypeBadge').textContent=type;toast('Gotowy post wygenerowany')};
    q('#ppGenerate').onclick=generate;
    q('#ppCopy').onclick=async()=>{if(!last)generate();try{await navigator.clipboard.writeText(last);toast('Post skopiowany')}catch{toast('Nie udało się skopiować')}};
    q('#ppSave').onclick=()=>{if(!last)generate();const h=read('aii-post-history',[]);h.unshift({type:q('#ppType').value,topic:q('#ppTopic').value.trim()||'Post',text:last,ts:Date.now()});save('aii-post-history',h.slice(0,30));toast('Post zapisany')};
    document.querySelectorAll('[data-post-h]').forEach(b=>b.onclick=()=>{const h=history[Number(b.dataset.postH)];if(h){last=h.text;if(h.type&&typeData[h.type])q('#ppType').value=h.type;q('#ppTopic').value=h.topic;q('#ppOut').textContent=h.text;q('#ppCount').textContent=`${h.text.length} znaków`;applyPreset();toast('Wczytano zapisany post')}});
  }

  function bind(){document.querySelectorAll('.nav-item[data-view="posts"]').forEach(a=>{if(a.dataset.postProBound)return;a.dataset.postProBound='1';a.addEventListener('click',()=>setTimeout(()=>{render();localStorage.setItem('aii-last-view','posts')},20));});}
  document.addEventListener('DOMContentLoaded',()=>{bind();if(localStorage.getItem('aii-last-view')==='posts')setTimeout(render,80);const nav=document.querySelector('.nav');if(nav)new MutationObserver(bind).observe(nav,{childList:true,subtree:true});});
})();