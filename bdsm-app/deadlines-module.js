(()=>{
  if(window.__bdsmDeadlinesInstalled)return;
  window.__bdsmDeadlinesInstalled=true;
  const EVENTS='bdsm-app-events-v3', OFF='bdsm-app-offences-v1', LINKS='bdsm-app-event-offence-links-v1';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(_){return d}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const relevant=e=>['kara','szlaban'].includes(String(e.type||'').toLowerCase()) && !['wykonane','anulowane'].includes(String(e.status||'').toLowerCase()) && e.end;
  const status=e=>{const end=new Date(e.end);if(Number.isNaN(end.getTime()))return{key:'none',label:'Brak daty'};const ms=end-Date.now();const d=ms/86400000;if(ms<0)return{key:'overdue',label:'Po terminie'};if(d<1)return{key:'today',label:'Dzisiaj'};if(d<=3)return{key:'soon',label:'Wkrótce'};return{key:'ok',label:'Zaplanowane'}};
  const badge=s=>{const map={overdue:['Po terminie','#3a171d','#ff929c'],today:['Dzisiaj','#3b2a12','#ffd36f'],soon:['Wkrótce','#27243d','#c9b9ff'],ok:['Zaplanowane','#12351f','#7ee2a8']};const x=map[s.key]||['—','#202735','#c6cedb'];return `<span style="padding:5px 8px;border-radius:8px;background:${x[1]};color:${x[2]};font-size:11px;font-weight:700">${x[0]}</span>`};
  function idOf(e){return e.event_id||e.id||e.uuid||('EVT-'+String(e.title||'')+'-'+String(e.end||''));}
  function ensureUI(){
    const nav=document.querySelector('#nav'),content=document.querySelector('.content');if(!nav||!content)return;
    if(!document.querySelector('#deadlinesNav')){const b=document.createElement('button');b.id='deadlinesNav';b.dataset.view='deadlines';b.innerHTML='📅 Terminy';const p=[...nav.querySelectorAll('button')].find(x=>x.dataset.view==='active');if(p&&p.nextSibling)nav.insertBefore(b,p.nextSibling);else nav.appendChild(b);b.addEventListener('click',e=>{e.preventDefault();openView()})}
    if(!document.querySelector('#view-deadlines')){const s=document.createElement('section');s.id='view-deadlines';s.className='hidden';s.innerHTML='<div class="panel"><h3>📅 Terminy kar i szlabanów</h3><p style="color:#98a2b3;font-size:12px;margin-top:-6px">Aplikacja pilnuje dat końcowych. Przekroczenie terminu tylko oznacza wpis jako wymagający uwagi — niczego automatycznie nie przedłuża ani nie zaostrza.</p><div id="deadlineStats" style="margin:12px 0"></div><div id="deadlineTable"></div></div>';content.appendChild(s);s.addEventListener('change',e=>{const sel=e.target.closest('[data-link-offence]');if(sel){const links=read(LINKS,{});links[sel.dataset.linkOffence]=sel.value||null;write(LINKS,links);render()}})}
  }
  function openView(){ensureUI();document.querySelectorAll('.content > section').forEach(s=>s.classList.add('hidden'));document.querySelector('#view-deadlines')?.classList.remove('hidden');document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));document.querySelector('#deadlinesNav')?.classList.add('active');render()}
  function render(){
    const all=read(EVENTS,[]).filter(relevant).sort((a,b)=>new Date(a.end)-new Date(b.end)), off=read(OFF,[]), links=read(LINKS,{}), box=document.querySelector('#deadlineTable'),stats=document.querySelector('#deadlineStats');if(!box)return;
    const overdue=all.filter(e=>status(e).key==='overdue').length,today=all.filter(e=>status(e).key==='today').length,soon=all.filter(e=>status(e).key==='soon').length;
    if(stats)stats.innerHTML=`Po terminie: <strong style="color:#ff929c">${overdue}</strong> &nbsp; Dzisiaj: <strong style="color:#ffd36f">${today}</strong> &nbsp; Wkrótce: <strong>${soon}</strong> &nbsp; Aktywne: <strong>${all.length}</strong>`;
    if(!all.length){box.innerHTML='<div class="empty">Brak aktywnych kar lub szlabanów z terminem końcowym.</div>';decorateCalendar();return}
    const opts=(id)=>'<option value="">— bez powiązania —</option>'+off.map(o=>`<option value="${esc(o.offence_id)}" ${links[id]===o.offence_id?'selected':''}>${esc(o.title)} • ${esc(o.offence_id)}</option>`).join('');
    box.innerHTML=`<div style="overflow:auto"><table class="table"><thead><tr><th>Typ</th><th>Nazwa</th><th>Koniec</th><th>Termin</th><th>Przewinienie</th></tr></thead><tbody>${all.map(e=>{const id=idOf(e),st=status(e);return `<tr><td>${esc(e.type)}</td><td><strong>${esc(e.title||'Bez nazwy')}</strong></td><td>${new Date(e.end).toLocaleString('pl-PL')}</td><td>${badge(st)}</td><td><select class="btn" data-link-offence="${esc(id)}">${opts(id)}</select></td></tr>`}).join('')}</tbody></table></div>`;
    decorateCalendar();
  }
  function decorateCalendar(){
    const cal=document.querySelector('#calendar');if(!cal)return;
    cal.querySelectorAll('.deadline-mark').forEach(x=>x.remove());
    const now=new Date(), y=now.getFullYear(),m=now.getMonth();
    const byDay={};read(EVENTS,[]).filter(relevant).forEach(e=>{const d=new Date(e.end);if(d.getFullYear()===y&&d.getMonth()===m){(byDay[d.getDate()]??=[]).push(e)}});
    cal.querySelectorAll('.day').forEach(el=>{const n=parseInt(el.textContent,10);if(!n||!byDay[n])return;const mark=document.createElement('span');mark.className='deadline-mark';mark.textContent=String(byDay[n].length);mark.title=byDay[n].map(e=>`${e.type}: ${e.title||'Bez nazwy'} — ${status(e).label}`).join('\n');mark.style.cssText='position:absolute;top:3px;right:3px;min-width:16px;height:16px;padding:0 4px;border-radius:999px;background:#7c3aed;color:#fff;font-size:9px;display:grid;place-items:center;font-weight:800';el.appendChild(mark)})
  }
  function alertBanner(){
    const list=read(EVENTS,[]).filter(relevant), urgent=list.filter(e=>['overdue','today'].includes(status(e).key));let b=document.querySelector('#deadlineAlert');
    if(!urgent.length){b?.remove();return}
    if(!b){b=document.createElement('div');b.id='deadlineAlert';b.className='sync-banner';const target=document.querySelector('.content');target?.insertAdjacentElement('beforebegin',b)}
    b.innerHTML=`<span>⏰ <strong>${urgent.length}</strong> termin(y) wymaga uwagi — ${urgent.filter(e=>status(e).key==='overdue').length} po terminie.</span><button class="btn" id="deadlineOpenBtn">Pokaż terminy</button>`;b.querySelector('#deadlineOpenBtn')?.addEventListener('click',openView)
  }
  function refresh(){ensureUI();render();alertBanner()}
  function install(){refresh();setInterval(refresh,60000);window.addEventListener('storage',refresh);document.addEventListener('bdsm-sync-complete',refresh);document.addEventListener('bdsm-offences-updated',refresh);const mo=new MutationObserver(()=>decorateCalendar());const cal=document.querySelector('#calendar');if(cal)mo.observe(cal,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
