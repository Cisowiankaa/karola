(() => {
  const QUEUE='aii-social-queue';
  const PROFILES='aii-social-profiles';
  const HISTORY='aii-social-growth-history';
  const RECOMMENDATIONS='aii-social-local-recommendations';
  const q=(s,r=document)=>r.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[c]));
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const num=v=>Number.isFinite(Number(v))?Number(v):0;
  const fmt=n=>new Intl.NumberFormat('pl-PL',{notation:Math.abs(Number(n)||0)>=10000?'compact':'standard',maximumFractionDigits:1}).format(Number(n)||0);
  const day=d=>String(d||'').slice(0,10);
  const addDays=(date,n)=>{const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};

  const style=document.createElement('style');
  style.textContent=`
    .social-performance{margin:14px 0;padding:14px;border:1px solid #e7e9f1;border-radius:14px;background:#fff}.social-performance-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.social-performance-head b{font-size:10px}.social-performance-head span{display:block;font-size:7.5px;color:#777f8d;margin-top:3px}.social-performance-grid{display:grid;grid-template-columns:1.35fr .65fr;gap:10px;margin-top:10px}.social-top-list{display:grid;gap:7px}.social-top-row{display:grid;grid-template-columns:30px minmax(0,1fr) auto;gap:9px;align-items:center;padding:9px;border:1px solid #eceef5;border-radius:10px;background:#fafafe}.social-rank{width:28px;height:28px;border-radius:9px;display:grid;place-items:center;background:#f0ecff;color:#6548d9;font-weight:900;font-size:9px}.social-top-copy{min-width:0}.social-top-copy b{display:block;font-size:8.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.social-top-copy small{display:block;font-size:7px;color:#777f8d;margin-top:3px}.social-top-score{text-align:right}.social-top-score strong{display:block;font-size:12px}.social-top-score small{display:block;font-size:7px;color:#777f8d}.social-format-list{display:grid;gap:7px}.social-format-card{padding:10px;border:1px solid #eceef5;border-radius:10px;background:#fafafe}.social-format-card b{font-size:8.5px}.social-format-card strong{display:block;font-size:15px;margin-top:4px}.social-format-card small{display:block;font-size:7px;color:#777f8d;margin-top:2px}.social-performance-note{margin-top:8px;font-size:7px;color:#777f8d;line-height:1.45}
    .social-local-recs{margin-top:12px;padding:12px;border:1px solid #ded8f6;border-radius:12px;background:#fbfaff}.social-local-recs-head{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.social-local-recs-head b{font-size:9.5px}.social-local-recs-head span{display:block;font-size:7px;color:#777f8d;margin-top:3px}.social-local-badge{display:inline-flex;padding:4px 7px;border-radius:999px;background:#edf8f1;color:#287a4b;font-size:6.8px;font-weight:900;white-space:nowrap}.social-local-recs-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:9px}.social-local-rec{padding:10px;border:1px solid #ebe7f7;border-radius:10px;background:#fff}.social-local-rec em{display:block;font-style:normal;font-size:7px;color:#777f8d;text-transform:uppercase;font-weight:900;letter-spacing:.04em}.social-local-rec strong{display:block;font-size:9.5px;margin-top:4px;line-height:1.35}.social-local-rec small{display:block;font-size:7px;color:#777f8d;line-height:1.45;margin-top:4px}.social-confidence{display:inline-flex;margin-top:6px;padding:3px 6px;border-radius:999px;background:#f1f2f5;color:#6f7682;font-size:6.4px;font-weight:900}.social-confidence.high{background:#edf8f1;color:#287a4b}.social-confidence.medium{background:#fff6e4;color:#9a6918}.social-local-summary{margin-top:9px;padding:9px;border-radius:9px;background:#f5f2ff;font-size:7.5px;line-height:1.5;color:#5d6170}
    @media(max-width:1000px){.social-local-recs-grid{grid-template-columns:1fr 1fr}}@media(max-width:900px){.social-performance-grid{grid-template-columns:1fr}}@media(max-width:600px){.social-top-row{grid-template-columns:28px 1fr}.social-top-score{grid-column:2;text-align:left}.social-local-recs-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function parsePlatform(item){
    const raw=String(item?.platform||'');
    if(/^tiktok/i.test(raw))return 'tiktok';
    if(/^facebook/i.test(raw))return 'facebook';
    return 'instagram';
  }
  function extractHandle(item){
    const m=String(item?.platform||'').match(/@([A-Za-z0-9._-]+)/);
    return m?`@${m[1]}`:'';
  }
  function profileFor(item){
    const platform=parsePlatform(item),handle=extractHandle(item).toLowerCase();
    const profiles=read(PROFILES,[]);
    return profiles.find(p=>String(p.platform||'').toLowerCase()===platform&&(handle?String(p.handle||'').toLowerCase()===handle:true))||profiles.find(p=>String(p.platform||'').toLowerCase()===platform)||null;
  }
  function historyKey(platform,handle){return `${platform}:${String(handle||'').replace(/^@/,'').toLowerCase()}`}
  function followerDelta72(item){
    const platform=parsePlatform(item),handle=extractHandle(item)||profileFor(item)?.handle||'';
    if(!handle||!item?.date)return null;
    const series=read(HISTORY,{})[historyKey(platform,handle)]||[];
    if(!Array.isArray(series)||series.length<2)return null;
    const date=day(item.date),target=addDays(date,3);
    const ordered=series.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    const before=ordered.filter(x=>x.date<=date).pop();
    const after=ordered.find(x=>x.date>=target);
    if(!before||!after)return null;
    return num(after.followers)-num(before.followers);
  }
  function metrics(item){
    const likes=num(item.likes),comments=num(item.comments),score=likes+(comments*4);
    const followers=num(profileFor(item)?.followers);
    const er=followers>0?((likes+comments)/followers)*100:null;
    return {likes,comments,score,er,delta72:followerDelta72(item)};
  }
  function published(){
    return read(QUEUE,[]).filter(x=>String(x.status||'').toLowerCase()==='opublikowany'&&(x.likes!=null||x.comments!=null));
  }
  function topItems(){
    return published().map(x=>({...x,_m:metrics(x)})).sort((a,b)=>b._m.score-a._m.score||String(b.date||'').localeCompare(String(a.date||''))).slice(0,5);
  }
  function formatStats(){
    const groups={};
    published().forEach(x=>{const type=String(x.type||'Post');const m=metrics(x);const g=groups[type]||(groups[type]={type,count:0,score:0,er:0,erCount:0});g.count++;g.score+=m.score;if(m.er!=null){g.er+=m.er;g.erCount++}});
    return Object.values(groups).map(g=>({...g,avgScore:g.count?g.score/g.count:0,avgEr:g.erCount?g.er/g.erCount:null})).sort((a,b)=>b.avgScore-a.avgScore).slice(0,4);
  }
  function sign(v){return v>0?'+':''}
  function row(item,i){
    const m=item._m,delta=m.delta72==null?'brak historii':`${sign(m.delta72)}${fmt(m.delta72)} obserw. / 72 h`;
    const er=m.er==null?'ER —':`ER ~${m.er.toFixed(2)}%`;
    return `<div class="social-top-row"><div class="social-rank">${i+1}</div><div class="social-top-copy"><b>${esc(item.title||'Bez tytułu')}</b><small>${esc(item.type||'Post')} • ${esc(item.date||'')} • ❤️ ${fmt(m.likes)} • 💬 ${fmt(m.comments)} • ${esc(er)} • ${esc(delta)}</small></div><div class="social-top-score"><strong>${fmt(m.score)}</strong><small>wynik</small></div></div>`;
  }
  function formatCard(g,i){
    return `<div class="social-format-card"><b>${i===0?'🏆 ':''}${esc(g.type)}</b><strong>${g.avgScore.toFixed(1)}</strong><small>średni wynik • ${g.count} treści${g.avgEr!=null?` • ER ~${g.avgEr.toFixed(2)}%`:''}</small></div>`;
  }

  const STOP=new Set('oraz albo ale żeby który która które tego tej ten ta to jest są być był była było jako przy przez dla pod nad bez czy się sie nie tak już juz też tez bardzo tylko kiedy gdzie jeśli jesli więc wiec czyli moja moje mój moj nasza nasze wasza wasze dziś dzis warto wartość podczas można mozna będzie bedzie jeden jedna jeszcze więcej wiecej mniej właśnie wlasnie produkt produkty książka ksiazka książki ksiazki recenzja opinia ocena współpraca wspolpraca'.split(' '));
  function words(text){
    return String(text||'').toLowerCase().replace(/https?:\/\/\S+/g,' ').replace(/[@#][\w._-]+/g,' ').replace(/[^a-ząćęłńóśźż0-9\s-]/gi,' ').split(/\s+/).map(x=>x.replace(/^-+|-+$/g,'')).filter(x=>x.length>=4&&!STOP.has(x)&&!/^\d+$/.test(x));
  }
  function topicStats(items){
    const map=new Map();
    items.forEach(item=>{
      const m=metrics(item),weight=Math.max(1,Math.log10(m.score+10));
      const unique=new Set(words(`${item.title||''} ${item.notes||''}`));
      unique.forEach(w=>map.set(w,(map.get(w)||0)+weight));
    });
    return [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([word,score])=>({word,score}));
  }
  function hourStats(items){
    const groups={};
    items.forEach(item=>{
      const h=Number(String(item.time||'').slice(0,2));if(!Number.isFinite(h)||h<0||h>23)return;
      const m=metrics(item),g=groups[h]||(groups[h]={hour:h,count:0,total:0});g.count++;g.total+=m.score;
    });
    return Object.values(groups).map(g=>({...g,avg:g.total/g.count})).sort((a,b)=>b.avg-a.avg||b.count-a.count);
  }
  function commentRate(items){
    const total=items.reduce((a,x)=>a+num(x.likes)+num(x.comments),0),comments=items.reduce((a,x)=>a+num(x.comments),0);
    return total?comments/total:0;
  }
  function confidence(count){return count>=5?{label:'wysoka',cls:'high'}:count>=2?{label:'średnia',cls:'medium'}:{label:'wstępna',cls:''}}
  function recCard(kind,title,detail,count){
    const c=confidence(count);
    return `<div class="social-local-rec"><em>${esc(kind)}</em><strong>${esc(title)}</strong><small>${esc(detail)}</small><span class="social-confidence ${c.cls}">pewność: ${c.label}</span></div>`;
  }
  function localRecommendations(){
    const items=published(),formats=formatStats(),topics=topicStats(items),hours=hourStats(items),top=topItems();
    const bestFormat=formats[0]||null,bestHour=hours[0]||null,bestTopic=topics[0]||null;
    const cr=commentRate(items);
    const formatRec=bestFormat
      ?{kind:'Format',title:`Powtórz: ${bestFormat.type}`,detail:`Ten format ma najwyższy średni wynik ${bestFormat.avgScore.toFixed(1)} na podstawie ${bestFormat.count} publikacji.`,count:bestFormat.count}
      :{kind:'Format',title:'Zbierz więcej danych',detail:'Potrzebne są opublikowane treści z reakcjami.',count:0};
    const topicRec=bestTopic
      ?{kind:'Temat',title:`Rozwijaj temat: ${bestTopic.word}`,detail:`Słowo najczęściej pojawia się w treściach o wysokim wyniku. Testuj warianty zamiast kopiować identyczny post.`,count:Math.min(items.length,5)}
      :{kind:'Temat',title:'Brak dominującego tematu',detail:'Po kolejnych publikacjach aplikacja wykryje powtarzające się motywy.',count:0};
    const hourRec=bestHour
      ?{kind:'Godzina',title:`Testuj około ${String(bestHour.hour).padStart(2,'0')}:00`,detail:`Ta godzina ma najwyższy średni wynik (${bestHour.avg.toFixed(1)}) w zapisanych publikacjach.`,count:bestHour.count}
      :{kind:'Godzina',title:'Brak danych godzinowych',detail:'Synchronizuj publikacje z godziną publikacji, aby wykryć najlepsze okno.',count:0};
    const ctaRec=items.length
      ?(cr<0.01
        ?{kind:'CTA',title:'Dodaj pytanie do komentarza',detail:'Komentarze stanowią mniej niż 1% zapisanych interakcji. Testuj jedno proste pytanie na końcu opisu.',count:items.length}
        :{kind:'CTA',title:'Utrzymuj CTA do rozmowy',detail:`Komentarze stanowią około ${(cr*100).toFixed(1)}% zapisanych interakcji. Powtarzaj pytania, które naturalnie zachęcają do odpowiedzi.`,count:items.length})
      :{kind:'CTA',title:'Zbierz dane interakcji',detail:'Rekomendacja CTA pojawi się po synchronizacji reakcji.',count:0};
    const lead=top[0];
    const summary=lead
      ?`Najbliższy test: ${bestFormat?bestFormat.type:'sprawdzony format'}${bestTopic?` o temacie „${bestTopic.word}”`:''}${bestHour?` około ${String(bestHour.hour).padStart(2,'0')}:00`:''}. Zmień tylko 1–2 elementy, aby łatwiej porównać wynik.`
      :'Najpierw zsynchronizuj opublikowane treści; rekomendacje tworzą się lokalnie z realnych wyników.';
    const result={generatedAt:new Date().toISOString(),format:formatRec,topic:topicRec,hour:hourRec,cta:ctaRec,summary,sampleSize:items.length};
    save(RECOMMENDATIONS,result);
    return result;
  }
  function recommendationsHtml(){
    const r=localRecommendations();
    return `<div class="social-local-recs"><div class="social-local-recs-head"><div><b>Local Recommendations Engine</b><span>Rekomendacje z Twoich danych — bez OpenAI</span></div><span class="social-local-badge">LOKALNE • 0 TOKENÓW</span></div><div class="social-local-recs-grid">${recCard(r.format.kind,r.format.title,r.format.detail,r.format.count)}${recCard(r.topic.kind,r.topic.title,r.topic.detail,r.topic.count)}${recCard(r.hour.kind,r.hour.title,r.hour.detail,r.hour.count)}${recCard(r.cta.kind,r.cta.title,r.cta.detail,r.cta.count)}</div><div class="social-local-summary"><b>Plan testu:</b> ${esc(r.summary)}</div></div>`;
  }
  function html(){
    const top=topItems(),formats=formatStats();
    return `<section class="social-performance" id="socialPerformanceRadar"><div class="social-performance-head"><div><b>Performance Radar</b><span>Najlepiej działające opublikowane treści i formaty</span></div><button class="ghost" type="button" id="socialPerformanceRefresh">↻ Odśwież</button></div><div class="social-performance-grid"><div><div class="social-top-list">${top.length?top.map(row).join(''):'<div class="social-performance-note">Brak zsynchronizowanych publikacji z polubieniami/komentarzami.</div>'}</div></div><div><div class="social-format-list">${formats.length?formats.map(formatCard).join(''):'<div class="social-performance-note">Za mało danych do porównania formatów.</div>'}</div></div></div>${recommendationsHtml()}<div class="social-performance-note">Wynik = polubienia + 4× komentarze. ER jest orientacyjny względem bieżącej liczby obserwujących. Zmiana obserwujących w 72 h jest korelacją czasową i może obejmować wpływ innych publikacji. Rekomendacje lokalne są heurystyką na podstawie zapisanych wyników, nie gwarancją zasięgu.</div></section>`;
  }
  function render(){
    if(localStorage.getItem('aii-last-view')!=='social')return;
    const anchor=q('#socialApifyBox')||q('#socialConnectHub')||q('.social-sync-panel');
    if(!anchor)return;
    q('#socialPerformanceRadar')?.remove();
    anchor.insertAdjacentHTML('afterend',html());
    q('#socialPerformanceRefresh')?.addEventListener('click',render);
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const root=q('#content');if(root)new MutationObserver(()=>setTimeout(render,40)).observe(root,{childList:true,subtree:true});
    document.addEventListener('aii:social-changed',()=>setTimeout(render,40));
    setTimeout(render,300);
  });
  window.AIISocialPerformance={refresh:render,recommendations:localRecommendations};
})();