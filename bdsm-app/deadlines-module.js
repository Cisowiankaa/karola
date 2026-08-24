(()=>{
  if(window.__bdsmDeadlinesInstalled)return;
  window.__bdsmDeadlinesInstalled=true;
  const EVENTS='bdsm-app-events-v3', OFF='bdsm-app-offences-v1', LINKS='bdsm-app-event-offence-links-v1', EDU='bdsm-app-education-tasks-v1';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(_){return d}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[m]));
  const eventRelevant=e=>['kara','szlaban'].includes(String(e.type||'').toLowerCase())&&!['wykonane','anulowane'].includes(String(e.status||'').toLowerCase())&&e.end;
  const taskRelevant=t=>!['wykonane','anulowane'].includes(String(t.status||'').toLowerCase())&&t.due_at;
  const dueStatus=date=>{const end=new Date(date);if(Number.isNaN(end.getTime()))return{key:'none',label:'Brak daty'};const ms=end-Date.now(),d=ms/86400000;if(ms<0)return{key:'overdue',label:'Po terminie'};if(d<1)return{key:'today',label:'Dzisiaj'};if(d<=3)return{key:'soon',label:'Wkrótce'};return{key:'ok',label:'Zaplanowane'}};
  const badge=s=>{const map={overdue:['Po terminie','#3a171d','#ff929c'],today:['Dzisiaj','#3b2a12','#ffd36f'],soon:['Wkrótce','#27243d','#c9b9ff'],ok:['Zaplanowane','#12351f','#7ee2a8']};const x=map[s.key]||['—','#202735','#c6cedb'];return `<span style="padding:5px 8px;border-radius:8px;background:${x[1]};color:${x[2]};font-size:11px;font-weight:700">${x[0]}</span>`};
  const idOf=e=>e.event_id||e.id||e.uuid||('EVT-'+String(e.title||'')+'-'+String(e.end||''));
  const allItems=()=>[
    ...read(EVENTS,[]).filter(eventRelevant).map(e=>({kind:'event',type:e.type,title:e.title||'Bez nazwy',due:e.end,id:idOf(e),offence_id:read(LINKS,{})[idOf(e)]||null,raw:e})),
    ...read(EDU,[]).filter(taskRelevant).map(t=>({kind:'task',type:t.type||'zadanie edukacyjne',title:t.title||'Bez nazwy',due:t.due_at,id:t.task_id,offence_id:t.offence_id||null,raw:t}))
  ].sort((a,b)=>new Date(a.due)-new Date(b.due));
  function ensureUI(){
    const nav=document.querySelector('#nav'),content=document.querySelector('.content');if(!nav||!content)return;
    if(!document.querySelector('#deadlinesNav')){const b=document.createElement('button');b.id='deadlinesNav';b.dataset.view='deadlines';b.innerHTML='📅 Terminy';const p=[...nav.querySelectorAll('button')].find(x=>x.dataset.view==='active');if(p&&p.nextSibling)nav.insertBefore(b,p.nextSibling);else nav.appendChild(b);b.addEventListener('click',e=>{e.preventDefault();openView()})}
    if(!document.querySelector('#view-deadlines')){const s=document.createElement('section');s.id='view-deadlines';s.className='hidden';s.innerHTML='<div class="panel"><h3>📅 Terminy</h3><p style="color:#98a2b3;font-size:12px;margin-top:-6px">Aplikacja pilnuje terminów kar, szlabanów i uzgodnionych zadań edukacyjnych. Przekroczenie terminu tylko oznacza wpis jako wymagający uwagi — niczego automatycznie nie przedłuża ani nie zaostrza.</p><div id="deadlineStats" style="margin:12px 0"></div><div id="deadlineTable"></div></div>';content.appendChild(s);s.addEventListener('change',e=>{const sel=e.target.closest('[data-link-offence]');if(sel){const links=read(LINKS,{});links[sel.dataset.linkOffence]=sel.value||null;write(LINKS,links);render()}})}
  }
  function openView(){ensureUI();document.querySelectorAll('.content > section').forEach(s=>s.classList.add('hidden'));document.querySelector('#view-deadlines')?.classList.remove('hidden');document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));document.querySelector('#deadlinesNav')?.classList.add('active');render()}
  function render(){
    const all=allItems(),off=read(OFF,[]),links=read(LINKS,{}),box=document.querySelector('#deadlineTable'),stats=document.querySelector('#deadlineStats');if(!box)return;
    const overdue=all.filter(x=>dueStatus(x.due).key==='overdue').length,today=all.filter(x=>dueStatus(x.due).key==='today').length,soon=all.filter(x=>dueStatus(x.due).key==='soon').length;
    if(stats)stats.innerHTML=`Po terminie: <strong style="color:#ff929c">${overdue}</strong> &nbsp; Dzisiaj: <strong style="color:#ffd36f">${today}</strong> &nbsp; Wkrótce: <strong>${soon}</strong> &nbsp; Aktywne: <strong>${all.length}</strong>`;
    if(!all.length){box.innerHTML='<div class="empty">Brak aktywnych terminów.</div>';decorateCalendar();return}
    const opts=id=>'<option value="">— bez powiązania —</option>'+off.map(o=>`<option value="${esc(o.offence_id)}" ${links[id]===o.offence_id?'selected':''}>${esc(o.title)} • ${esc(o.offence_id)}</option>`).join('');
    box.innerHTML=`<div style="overflow:auto"><table class="table"><thead><tr><th>Źródło</th><th>Typ</th><th>Nazwa</th><th>Termin</th><th>Status</th><th>Przewinienie</th><th>Materiał</th></tr></thead><tbody>${all.map(x=>{const st=dueStatus(x.due),isTask=x.kind==='task';return `<tr><td>${isTask?'📚 Zadanie':'⚖ Wpis'}</td><td>${esc(x.type)}</td><td><strong>${esc(x.title)}</strong><div style="font-family:monospace;font-size:10px;color:#768197">${esc(x.id)}</div></td><td>${new Date(x.due).toLocaleString('pl-PL')}</td><td>${badge(st)}</td><td>${isTask?(x.offence_id?esc(x.offence_id):'—'):`<select class="btn" data-link-offence="${esc(x.id)}">${opts(x.id)}</select>`}</td><td>${isTask&&x.raw.url?`<a href="${esc(x.raw.url)}" target="_blank" rel="noopener noreferrer" style="color:#9bd0ff">Otwórz</a>`:'—'}</td></tr>`}).join('')}</tbody></table></div>`;
    decorateCalendar();
  }
  function decorateCalendar(){
    const cal=document.querySelector('#calendar');if(!cal)return;
    cal.querySelectorAll('.deadline-mark').forEach(x=>x.remove());
    const now=new Date(),y=now.getFullYear(),m=now.getMonth(),byDay={};
    allItems().forEach(x=>{const d=new Date(x.due);if(d.getFullYear()===y&&d.getMonth()===m)(byDay[d.getDate()]??=[]).push(x)});
    cal.querySelectorAll('.day').forEach(el=>{const n=parseInt(el.textContent,10);if(!n||!byDay[n])return;const mark=document.createElement('span');mark.className='deadline-mark';mark.textContent=String(byDay[n].length);mark.title=byDay[n].map(x=>`${x.kind==='task'?'zadanie':'wpis'}: ${x.title} — ${dueStatus(x.due).label}`).join('\n');mark.style.cssText='position:absolute;top:3px;right:3px;min-width:16px;height:16px;padding:0 4px;border-radius:999px;background:#7c3aed;color:#fff;font-size:9px;display:grid;place-items:center;font-weight:800';el.appendChild(mark)})
  }
  function alertBanner(){
    const list=allItems(),urgent=list.filter(x=>['overdue','today'].includes(dueStatus(x.due).key));let b=document.querySelector('#deadlineAlert');
    if(!urgent.length){b?.remove();return}
    if(!b){b=document.createElement('div');b.id='deadlineAlert';b.className='sync-banner';const target=document.querySelector('.content');target?.insertAdjacentElement('beforebegin',b)}
    b.innerHTML=`<span>⏰ <strong>${urgent.length}</strong> termin(y) wymaga uwagi — ${urgent.filter(x=>dueStatus(x.due).key==='overdue').length} po terminie.</span><button class="btn" id="deadlineOpenBtn">Pokaż terminy</button>`;b.querySelector('#deadlineOpenBtn')?.addEventListener('click',openView)
  }
  function refresh(){ensureUI();render();alertBanner()}
  function install(){refresh();setInterval(refresh,60000);window.addEventListener('storage',refresh);document.addEventListener('bdsm-sync-complete',refresh);document.addEventListener('bdsm-offences-updated',refresh);document.addEventListener('bdsm-education-tasks-updated',refresh);const mo=new MutationObserver(()=>decorateCalendar());const cal=document.querySelector('#calendar');if(cal)mo.observe(cal,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
