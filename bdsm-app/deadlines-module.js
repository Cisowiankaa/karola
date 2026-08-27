(()=>{
  if(window.__bdsmDeadlinesInstalled)return;
  window.__bdsmDeadlinesInstalled=true;
  const EVENTS='bdsm-app-events-v3', OFF='bdsm-app-offences-v1', LINKS='bdsm-app-event-offence-links-v1', EDU='bdsm-app-education-tasks-v1';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(_){return d}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const pad=n=>String(n).padStart(2,'0');
  const dayKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const monthKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}`;
  const isClosed=x=>['wykonane','anulowane','zakończone','zamknięte'].includes(String(x.status||'').toLowerCase());
  const eventRelevant=e=>['kara','szlaban'].includes(String(e.type||'').toLowerCase())&&e.end;
  const taskRelevant=t=>!!t.due_at;
  const dueStatus=(date,closed=false)=>{if(closed)return{key:'closed',label:'Zakończone'};const end=new Date(date);if(Number.isNaN(end.getTime()))return{key:'none',label:'Brak daty'};const ms=end-Date.now(),d=ms/86400000;if(ms<0)return{key:'overdue',label:'Po terminie'};if(d<1&&dayKey(end)===dayKey(new Date()))return{key:'today',label:'Dzisiaj'};if(d<=7)return{key:'week',label:'Do 7 dni'};return{key:'ok',label:'Zaplanowane'}};
  const badge=s=>{const map={closed:['Zakończone','#17251d','#86d9a5'],overdue:['Po terminie','#3a171d','#ff929c'],today:['Dzisiaj','#3b2a12','#ffd36f'],week:['Do 7 dni','#27243d','#c9b9ff'],ok:['Zaplanowane','#12351f','#7ee2a8']};const x=map[s.key]||['—','#202735','#c6cedb'];return `<span style="padding:5px 8px;border-radius:8px;background:${x[1]};color:${x[2]};font-size:11px;font-weight:700">${x[0]}</span>`};
  const idOf=e=>e.event_id||e.id||e.uuid||('EVT-'+String(e.title||'')+'-'+String(e.end||''));
  let activeFilter='all', calendarMonth=monthKey(new Date());

  const allItems=()=>[
    ...read(EVENTS,[]).filter(eventRelevant).map(e=>({kind:'event',type:e.type,title:e.title||'Bez nazwy',due:e.end,id:idOf(e),offence_id:read(LINKS,{})[idOf(e)]||null,closed:isClosed(e),raw:e})),
    ...read(EDU,[]).filter(taskRelevant).map(t=>({kind:'task',type:t.type||'zadanie edukacyjne',title:t.title||'Bez nazwy',due:t.due_at,id:t.task_id||t.id||('TASK-'+String(t.title||'')),offence_id:t.offence_id||null,closed:isClosed(t),raw:t}))
  ].sort((a,b)=>new Date(a.due)-new Date(b.due));

  function filteredItems(){
    const all=allItems(),now=new Date(),limit=new Date(Date.now()+7*86400000);
    if(activeFilter==='today')return all.filter(x=>!x.closed&&dayKey(new Date(x.due))===dayKey(now));
    if(activeFilter==='week')return all.filter(x=>!x.closed&&new Date(x.due)>=now&&new Date(x.due)<=limit);
    if(activeFilter==='overdue')return all.filter(x=>!x.closed&&new Date(x.due)<now);
    if(activeFilter==='closed')return all.filter(x=>x.closed);
    return all;
  }

  function ensureStyles(){if(document.querySelector('#deadlineStylesV2'))return;const s=document.createElement('style');s.id='deadlineStylesV2';s.textContent='.deadline-tools{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.deadline-filter{border:1px solid #313b4f;background:#111826;color:#d9deea;border-radius:9px;padding:8px 10px;cursor:pointer}.deadline-filter.active{background:#6d3bd1;color:#fff;border-color:#8b5cf6}.deadline-layout{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:14px}.deadline-cal{border:1px solid #252d3c;background:#0c121c;border-radius:12px;padding:12px}.deadline-cal-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px}.deadline-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}.deadline-cal-day,.deadline-cal-label{min-height:38px;display:grid;place-items:center;border-radius:8px;font-size:11px}.deadline-cal-label{min-height:24px;color:#7f8a9d}.deadline-cal-day{position:relative;background:#101725;border:1px solid #202a3a}.deadline-cal-day.has{border-color:#6d3bd1}.deadline-cal-day.today{outline:1px solid #ffd36f}.deadline-cal-day.empty{background:transparent;border-color:transparent}.deadline-cal-count{position:absolute;right:3px;top:3px;min-width:15px;height:15px;padding:0 3px;border-radius:999px;background:#7c3aed;color:#fff;font-size:9px;display:grid;place-items:center}.deadline-cal-day.overdue .deadline-cal-count{background:#9d2c3a}.deadline-cal-day.closed .deadline-cal-count{background:#247a49}@media(max-width:1100px){.deadline-layout{grid-template-columns:1fr}}';document.head.appendChild(s)}

  function ensureUI(){
    ensureStyles();const nav=document.querySelector('#nav'),content=document.querySelector('.content');if(!nav||!content)return;
    if(!document.querySelector('#deadlinesNav')){const b=document.createElement('button');b.id='deadlinesNav';b.dataset.view='deadlines';b.innerHTML='📅 Terminy';const p=[...nav.querySelectorAll('button')].find(x=>x.dataset.view==='active');if(p&&p.nextSibling)nav.insertBefore(b,p.nextSibling);else nav.appendChild(b);b.addEventListener('click',e=>{e.preventDefault();openView()})}
    if(!document.querySelector('#view-deadlines')){const s=document.createElement('section');s.id='view-deadlines';s.className='hidden';s.innerHTML='<div class="panel"><h3>📅 Terminy</h3><p style="color:#98a2b3;font-size:12px;margin-top:-6px">Terminy są wyłącznie organizacyjne. Przekroczenie terminu oznacza potrzebę ręcznego przeglądu — system niczego automatycznie nie przedłuża ani nie zaostrza.</p><div id="deadlineStats" style="margin:12px 0"></div><div class="deadline-tools" id="deadlineFilters"><button class="deadline-filter active" data-deadline-filter="all">Wszystkie</button><button class="deadline-filter" data-deadline-filter="today">Dzisiaj</button><button class="deadline-filter" data-deadline-filter="week">7 dni</button><button class="deadline-filter" data-deadline-filter="overdue">Zaległe</button><button class="deadline-filter" data-deadline-filter="closed">Zakończone</button></div><div class="deadline-layout"><div id="deadlineTable"></div><div id="deadlineCalendar" class="deadline-cal"></div></div></div>';content.appendChild(s);
      s.addEventListener('change',e=>{const sel=e.target.closest('[data-link-offence]');if(sel){const links=read(LINKS,{});links[sel.dataset.linkOffence]=sel.value||null;write(LINKS,links);render()}});
      s.addEventListener('click',e=>{const f=e.target.closest('[data-deadline-filter]');if(f){activeFilter=f.dataset.deadlineFilter;render();return}const m=e.target.closest('[data-cal-shift]');if(m){const [y,mo]=calendarMonth.split('-').map(Number),d=new Date(y,mo-1+Number(m.dataset.calShift),1);calendarMonth=monthKey(d);renderCalendar();}})
    }
  }
  function openView(){ensureUI();document.querySelectorAll('.content > section').forEach(s=>s.classList.add('hidden'));document.querySelector('#view-deadlines')?.classList.remove('hidden');document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));document.querySelector('#deadlinesNav')?.classList.add('active');render()}

  function render(){
    const all=allItems(),shown=filteredItems(),off=read(OFF,[]),links=read(LINKS,{}),box=document.querySelector('#deadlineTable'),stats=document.querySelector('#deadlineStats');if(!box)return;
    document.querySelectorAll('[data-deadline-filter]').forEach(b=>b.classList.toggle('active',b.dataset.deadlineFilter===activeFilter));
    const open=all.filter(x=>!x.closed),overdue=open.filter(x=>dueStatus(x.due).key==='overdue').length,today=open.filter(x=>dueStatus(x.due).key==='today').length,week=open.filter(x=>dueStatus(x.due).key==='week').length,closed=all.filter(x=>x.closed).length;
    if(stats)stats.innerHTML=`Zaległe: <strong style="color:#ff929c">${overdue}</strong> &nbsp; Dzisiaj: <strong style="color:#ffd36f">${today}</strong> &nbsp; 7 dni: <strong>${week}</strong> &nbsp; Aktywne: <strong>${open.length}</strong> &nbsp; Zakończone: <strong>${closed}</strong>`;
    if(!shown.length){box.innerHTML='<div class="empty">Brak terminów dla wybranego filtra.</div>';renderCalendar();decorateCalendar();return}
    const opts=id=>'<option value="">— bez powiązania —</option>'+off.map(o=>`<option value="${esc(o.offence_id)}" ${links[id]===o.offence_id?'selected':''}>${esc(o.title)} • ${esc(o.offence_id)}</option>`).join('');
    box.innerHTML=`<div style="overflow:auto"><table class="table"><thead><tr><th>Źródło</th><th>Typ</th><th>Nazwa</th><th>Termin</th><th>Status</th><th>Przewinienie</th><th>Materiał</th></tr></thead><tbody>${shown.map(x=>{const st=dueStatus(x.due,x.closed),isTask=x.kind==='task';return `<tr><td>${isTask?'📚 Zadanie':'⚖ Wpis'}</td><td>${esc(x.type)}</td><td><strong>${esc(x.title)}</strong><div style="font-family:monospace;font-size:10px;color:#768197">${esc(x.id)}</div></td><td>${new Date(x.due).toLocaleString('pl-PL')}</td><td>${badge(st)}</td><td>${isTask?(x.offence_id?esc(x.offence_id):'—'):`<select class="btn" data-link-offence="${esc(x.id)}">${opts(x.id)}</select>`}</td><td>${isTask&&x.raw.url?`<a href="${esc(x.raw.url)}" target="_blank" rel="noopener noreferrer" style="color:#9bd0ff">Otwórz</a>`:'—'}</td></tr>`}).join('')}</tbody></table></div>`;
    renderCalendar();decorateCalendar();
  }

  function renderCalendar(){
    const box=document.querySelector('#deadlineCalendar');if(!box)return;const [y,m]=calendarMonth.split('-').map(Number),first=new Date(y,m-1,1),days=new Date(y,m,0).getDate(),offset=(first.getDay()+6)%7,items=allItems().filter(x=>monthKey(new Date(x.due))===calendarMonth),by={};items.forEach(x=>(by[new Date(x.due).getDate()]??=[]).push(x));
    const labels=['Pn','Wt','Śr','Cz','Pt','So','Nd'].map(x=>`<div class="deadline-cal-label">${x}</div>`).join('');let cells='';for(let i=0;i<offset;i++)cells+='<div class="deadline-cal-day empty"></div>';for(let d=1;d<=days;d++){const arr=by[d]||[],isToday=calendarMonth===monthKey(new Date())&&d===new Date().getDate(),hasOver=arr.some(x=>!x.closed&&new Date(x.due)<new Date()),allClosed=arr.length&&arr.every(x=>x.closed),cls=['deadline-cal-day',arr.length?'has':'',isToday?'today':'',hasOver?'overdue':'',allClosed?'closed':''].filter(Boolean).join(' '),title=arr.map(x=>`${x.kind==='task'?'Zadanie':'Wpis'}: ${x.title} — ${dueStatus(x.due,x.closed).label}`).join('\n');cells+=`<div class="${cls}" title="${esc(title)}"><span>${d}</span>${arr.length?`<span class="deadline-cal-count">${arr.length}</span>`:''}</div>`}
    const label=first.toLocaleDateString('pl-PL',{month:'long',year:'numeric'});box.innerHTML=`<div class="deadline-cal-head"><button class="btn" data-cal-shift="-1">‹</button><strong>${esc(label)}</strong><button class="btn" data-cal-shift="1">›</button></div><div class="deadline-cal-grid">${labels}${cells}</div>`;
  }

  function decorateCalendar(){const cal=document.querySelector('#calendar');if(!cal)return;cal.querySelectorAll('.deadline-mark').forEach(x=>x.remove());const now=new Date(),y=now.getFullYear(),m=now.getMonth(),byDay={};allItems().filter(x=>!x.closed).forEach(x=>{const d=new Date(x.due);if(d.getFullYear()===y&&d.getMonth()===m)(byDay[d.getDate()]??=[]).push(x)});cal.querySelectorAll('.day').forEach(el=>{const n=parseInt(el.textContent,10);if(!n||!byDay[n])return;const mark=document.createElement('span');mark.className='deadline-mark';mark.textContent=String(byDay[n].length);mark.title=byDay[n].map(x=>`${x.kind==='task'?'zadanie':'wpis'}: ${x.title} — ${dueStatus(x.due).label}`).join('\n');mark.style.cssText='position:absolute;top:3px;right:3px;min-width:16px;height:16px;padding:0 4px;border-radius:999px;background:#7c3aed;color:#fff;font-size:9px;display:grid;place-items:center;font-weight:800';el.appendChild(mark)})}
  function alertBanner(){const list=allItems().filter(x=>!x.closed),urgent=list.filter(x=>['overdue','today'].includes(dueStatus(x.due).key));let b=document.querySelector('#deadlineAlert');if(!urgent.length){b?.remove();return}if(!b){b=document.createElement('div');b.id='deadlineAlert';b.className='sync-banner';const target=document.querySelector('.content');target?.insertAdjacentElement('beforebegin',b)}b.innerHTML=`<span>⏰ <strong>${urgent.length}</strong> termin(y) wymaga uwagi — ${urgent.filter(x=>dueStatus(x.due).key==='overdue').length} zaległych.</span><button class="btn" id="deadlineOpenBtn">Pokaż terminy</button>`;b.querySelector('#deadlineOpenBtn')?.addEventListener('click',openView)}
  function refresh(){ensureUI();render();alertBanner()}
  function install(){refresh();setInterval(refresh,60000);window.addEventListener('storage',refresh);document.addEventListener('bdsm-sync-complete',refresh);document.addEventListener('bdsm-cloud-restored',refresh);document.addEventListener('bdsm-offences-updated',refresh);document.addEventListener('bdsm-education-tasks-updated',refresh);const mo=new MutationObserver(()=>decorateCalendar());const cal=document.querySelector('#calendar');if(cal)mo.observe(cal,{childList:true,subtree:true});window.bdsmDeadlines={open:openView,refresh,filter:f=>{activeFilter=f;render()}}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
