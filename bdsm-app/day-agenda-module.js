(()=>{
  if(window.__bdsmDayAgendaInstalled)return;
  window.__bdsmDayAgendaInstalled=true;

  const EVENTS='bdsm-app-events-v3';
  const OFF='bdsm-app-offences-v1';
  const TASKS='bdsm-app-education-tasks-v1';
  const NOTES='bdsm-app-written-notes-v1';
  const HOURS='bdsm-app-hourly-reports-v1';
  const DAYMETA='bdsm-app-day-agenda-meta-v1';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(_){return d}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const pad=n=>String(n).padStart(2,'0');
  const keyOf=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const sameDay=(v,key)=>{if(!v)return false;const d=new Date(v);return !Number.isNaN(d.getTime())&&keyOf(d)===key};
  const t=v=>{if(!v)return'—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'})};
  let currentKey=keyOf(new Date());

  function metaMap(){const x=read(DAYMETA,{});return x&&typeof x==='object'?x:{}}
  function metaFor(key=currentKey){return metaMap()[key]||{}}
  function saveMeta(patch){const m=metaMap(),old=m[currentKey]||{};m[currentKey]={...old,...patch,updated_at:new Date().toISOString()};write(DAYMETA,m);document.dispatchEvent(new CustomEvent('bdsm-day-agenda-updated',{detail:{date:currentKey}}));render()}

  function itemsFor(key){
    const rows=[];
    read(HOURS,[]).forEach(x=>{if(x.date===key)rows.push({kind:'hour',time:x.from||'00:00',icon:'🕐',title:x.title||'Wpis godzinowy',meta:[x.from&&x.to?`${x.from}–${x.to}`:'',x.status||'',x.note||''].filter(Boolean).join(' • '),id:x.report_id||''})});
    read(TASKS,[]).forEach(x=>{if(sameDay(x.due_at,key))rows.push({kind:'task',time:t(x.due_at),icon:'📚',title:x.title||'Zadanie edukacyjne',meta:[x.type||'',x.status||''].filter(Boolean).join(' • '),id:x.task_id||'',offence:x.offence_id||x.przewinienie_id||''})});
    read(EVENTS,[]).forEach(x=>{const type=String(x.type||'').toLowerCase();if(!['kara','szlaban'].includes(type))return;if(sameDay(x.start,key))rows.push({kind:'event',time:t(x.start),icon:type==='szlaban'?'⊘':'⚖',title:x.title||x.type||'Wpis',meta:`początek • ${x.status||''}`,id:x.event_id||x.id||''});if(sameDay(x.end,key))rows.push({kind:'event',time:t(x.end),icon:type==='szlaban'?'⊘':'⚖',title:x.title||x.type||'Wpis',meta:`termin zakończenia • ${x.status||''}`,id:x.event_id||x.id||''})});
    read(OFF,[]).forEach(x=>{const v=x.occurred_at||x.created_at;if(sameDay(v,key))rows.push({kind:'offence',time:t(v),icon:'⚠',title:x.title||'Przewinienie',meta:x.status||'',id:x.offence_id||x.przewinienie_id||''})});
    read(NOTES,[]).forEach(x=>{const v=x.issued_at||x.date||x.created_at;if(sameDay(v,key))rows.push({kind:'note',time:t(v),icon:'📝',title:x.title||x.type||'Uwaga / upomnienie',meta:[x.type||'',x.status||''].filter(Boolean).join(' • '),id:x.note_id||'',offence:x.offence_id||x.przewinienie_id||''})});
    return rows.sort((a,b)=>String(a.time).localeCompare(String(b.time))||a.title.localeCompare(b.title));
  }

  function ensureUI(){
    const content=document.querySelector('.content');if(!content)return;
    if(!document.querySelector('#dayAgendaStyles')){const st=document.createElement('style');st.id='dayAgendaStyles';st.textContent='.agenda-head{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}.agenda-actions{display:flex;gap:8px;flex-wrap:wrap}.agenda-list{margin-top:12px}.agenda-row{display:grid;grid-template-columns:72px 36px 1fr auto;gap:10px;align-items:center;padding:11px 0;border-bottom:1px solid #222a39}.agenda-time{font-weight:800}.agenda-meta{color:#98a2b3;font-size:11px;margin-top:3px}.agenda-quick{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.agenda-empty{padding:28px;text-align:center;color:#7f8a9d}.agenda-daymeta{display:grid;grid-template-columns:1fr 1fr auto;gap:10px;margin:14px 0;align-items:end}.agenda-daymeta label{display:block;color:#98a2b3;font-size:11px;margin-bottom:6px}.agenda-daymeta textarea{width:100%;min-height:82px;resize:vertical;background:#0a101a;color:#eef1f6;border:1px solid #283141;border-radius:8px;padding:9px}.agenda-daymeta-actions{display:grid;gap:8px}.agenda-done{display:inline-block;font-size:11px;padding:5px 8px;border-radius:999px;background:#12351f;color:#7ee2a8;margin-left:8px}@media(max-width:900px){.agenda-daymeta{grid-template-columns:1fr}.agenda-row{grid-template-columns:58px 30px 1fr}.agenda-row .btn{grid-column:1/-1;justify-self:start}}';document.head.appendChild(st)}
    if(!document.querySelector('#view-day-agenda')){const s=document.createElement('section');s.id='view-day-agenda';s.className='hidden';s.innerHTML='<div class="panel"><div class="agenda-head"><div><h3 style="margin-bottom:4px">📋 Agenda dnia <span id="agendaDoneBadge"></span></h3><div id="agendaDate" style="color:#98a2b3;font-size:12px"></div></div><div class="agenda-actions"><button class="btn" id="agendaPrev">← Dzień wcześniej</button><button class="btn" id="agendaToday">Dzisiaj</button><button class="btn" id="agendaNext">Dzień później →</button><button class="btn" id="agendaBackMonth">🗓 Kalendarz miesiąca</button><button class="btn primary" id="agendaPdf">📄 PDF dnia</button></div></div><div class="agenda-daymeta"><div><label>Plan dnia</label><textarea id="agendaPlan" placeholder="Najważniejsze rzeczy na ten dzień"></textarea></div><div><label>Podsumowanie dnia</label><textarea id="agendaConclusion" placeholder="Co zostało zrobione i jakie są wnioski?"></textarea></div><div class="agenda-daymeta-actions"><button class="btn" id="agendaSaveMeta">Zapisz plan i podsumowanie</button><button class="btn" id="agendaDoneBtn">✓ Zakończ dzień</button></div></div><div class="agenda-quick"><button class="btn" data-agenda-quick="entry">＋ Dodaj wpis</button><button class="btn" data-agenda-quick="task">📚 Dodaj zadanie</button><button class="btn" data-agenda-quick="note">📝 Dodaj uwagę</button><button class="btn" data-agenda-quick="offence">⚠ Dodaj przewinienie</button></div><div id="agendaSummary" class="mc-summary"></div><div id="agendaList" class="agenda-list"></div></div>';content.appendChild(s);
      s.querySelector('#agendaPrev').addEventListener('click',()=>shift(-1));s.querySelector('#agendaToday').addEventListener('click',()=>open(keyOf(new Date())));s.querySelector('#agendaNext').addEventListener('click',()=>shift(1));s.querySelector('#agendaBackMonth').addEventListener('click',()=>window.bdsmMonthCalendar?.open?.());s.querySelector('#agendaPdf').addEventListener('click',printDay);
      s.querySelector('#agendaSaveMeta').addEventListener('click',()=>saveMeta({plan:s.querySelector('#agendaPlan').value||'',summary:s.querySelector('#agendaConclusion').value||''}));
      s.querySelector('#agendaDoneBtn').addEventListener('click',()=>{const m=metaFor();saveMeta({done:!m.done,done_at:!m.done?new Date().toISOString():null})});
      s.addEventListener('click',e=>{const q=e.target.closest('[data-agenda-quick]');if(q){quick(q.dataset.agendaQuick);return}const o=e.target.closest('[data-agenda-open]');if(!o)return;const kind=o.dataset.agendaOpen,id=o.dataset.agendaId||'';if(kind==='offence')window.bdsmRelationshipTimeline?.openCase?.(id);else if(kind==='task')window.bdsmEducationTasks?.open?.();else if(kind==='note')window.bdsmWrittenNotes?.open?.();else if(kind==='hour')window.bdsmHourlyReports?.open?.();else if(kind==='event')document.querySelector('#deadlinesNav')?.click();});
    }
  }

  function quick(kind){
    if(kind==='entry'){document.querySelector('#nav [data-view="add"]')?.click();return}
    if(kind==='task'){window.bdsmEducationTasks?.open?.();setTimeout(()=>{const el=document.querySelector('#eduDue');if(el&&!el.value)el.value=currentKey+'T12:00'},80);return}
    if(kind==='note'){window.bdsmWrittenNotes?.open?.();setTimeout(()=>{const el=document.querySelector('#noteIssuedAt');if(el&&!el.value)el.value=currentKey+'T12:00'},80);return}
    if(kind==='offence'){window.bdsmOffences?.open?.();setTimeout(()=>{const d=document.querySelector('#offDate');if(d&&!d.value)d.value=currentKey},80)}
  }
  function shift(n){const d=new Date(currentKey+'T12:00:00');d.setDate(d.getDate()+n);open(keyOf(d))}

  function render(){
    ensureUI();const rows=itemsFor(currentKey),d=new Date(currentKey+'T12:00:00'),m=metaFor();const date=document.querySelector('#agendaDate'),list=document.querySelector('#agendaList'),sum=document.querySelector('#agendaSummary');
    if(date)date.textContent=d.toLocaleDateString('pl-PL',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
    const p=document.querySelector('#agendaPlan'),c=document.querySelector('#agendaConclusion'),badge=document.querySelector('#agendaDoneBadge'),doneBtn=document.querySelector('#agendaDoneBtn');if(p&&p.value!==String(m.plan||''))p.value=m.plan||'';if(c&&c.value!==String(m.summary||''))c.value=m.summary||'';if(badge)badge.innerHTML=m.done?'<span class="agenda-done">✓ Dzień zakończony</span>':'';if(doneBtn)doneBtn.textContent=m.done?'↺ Otwórz ponownie dzień':'✓ Zakończ dzień';
    if(sum){const x={hour:0,task:0,event:0,offence:0,note:0};rows.forEach(r=>x[r.kind]=(x[r.kind]||0)+1);sum.innerHTML=`<span class="mc-pill">Łącznie: <strong>${rows.length}</strong></span><span class="mc-pill">🕐 ${x.hour}</span><span class="mc-pill">📚 ${x.task}</span><span class="mc-pill">⚖/⊘ ${x.event}</span><span class="mc-pill">⚠ ${x.offence}</span><span class="mc-pill">📝 ${x.note}</span>`}
    if(list)list.innerHTML=rows.length?rows.map(x=>`<div class="agenda-row"><div class="agenda-time">${esc(x.time)}</div><div>${x.icon}</div><div><strong>${esc(x.title)}</strong><div class="agenda-meta">${esc(x.meta||'')}</div></div><button class="btn" data-agenda-open="${x.kind}" data-agenda-id="${esc(x.id)}">Otwórz</button></div>`).join(''):'<div class="agenda-empty">Brak wpisów w tym dniu.</div>';
  }

  function printDay(){
    const rows=itemsFor(currentKey),m=metaFor(),d=new Date(currentKey+'T12:00:00'),label=d.toLocaleDateString('pl-PL',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}),type=x=>x.kind==='hour'?'Dziennik':x.kind==='task'?'Zadanie':x.kind==='event'?'Kara / szlaban':x.kind==='offence'?'Przewinienie':'Uwaga / upomnienie';
    const w=window.open('','_blank');if(!w)return;w.document.write(`<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>Agenda dnia ${esc(currentKey)}</title><style>@page{size:A4;margin:15mm}body{font-family:Arial,sans-serif;color:#111;font-size:11px}h1{font-size:20px;margin:0 0 5px}.meta{color:#555;margin-bottom:14px}.box{border:1px solid #bbb;padding:9px;margin:8px 0}.box strong{display:block;margin-bottom:4px}table{width:100%;border-collapse:collapse;margin-top:14px}th,td{border:1px solid #bbb;padding:6px;text-align:left;vertical-align:top}th{background:#f1f1f1}</style></head><body><h1>Agenda dnia</h1><div class="meta">${esc(label)}${m.done?' • DZIEŃ ZAKOŃCZONY':''}</div><div class="box"><strong>Plan dnia</strong>${esc(m.plan||'—')}</div><div class="box"><strong>Podsumowanie dnia</strong>${esc(m.summary||'—')}</div>${rows.length?`<table><thead><tr><th>Godzina</th><th>Typ</th><th>Pozycja</th><th>Status / informacja</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.time)}</td><td>${esc(type(x))}</td><td>${esc(x.title)}</td><td>${esc(x.meta||'')}</td></tr>`).join('')}</tbody></table>`:'<p>Brak wpisów w tym dniu.</p>'}<script>window.onload=()=>setTimeout(()=>window.print(),200)<\/script></body></html>`);w.document.close();
  }

  function open(key){currentKey=key||keyOf(new Date());ensureUI();document.querySelectorAll('.content > section').forEach(s=>s.classList.add('hidden'));document.querySelector('#view-day-agenda')?.classList.remove('hidden');document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));render()}
  function install(){
    ensureUI();
    document.addEventListener('click',e=>{const d=e.target.closest?.('[data-mc-date]');if(!d||!d.closest('#view-month-calendar'))return;e.preventDefault();e.stopImmediatePropagation();open(d.dataset.mcDate)},true);
    ['bdsm-offences-updated','bdsm-education-tasks-updated','bdsm-written-notes-updated','bdsm-hourly-reports-updated','bdsm-case-linked','bdsm-sync-complete','bdsm-day-agenda-updated'].forEach(ev=>document.addEventListener(ev,()=>{if(!document.querySelector('#view-day-agenda')?.classList.contains('hidden'))render()}));
    window.addEventListener('storage',()=>{if(!document.querySelector('#view-day-agenda')?.classList.contains('hidden'))render()});
    window.bdsmDayAgenda={open,refresh:render,date:()=>currentKey,print:printDay,meta:()=>metaFor()};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();