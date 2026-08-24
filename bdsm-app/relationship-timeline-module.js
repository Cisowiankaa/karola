(()=>{
  if(window.__bdsmRelationshipTimelineInstalled)return;
  window.__bdsmRelationshipTimelineInstalled=true;
  const OFF='bdsm-app-offences-v1', EVENTS='bdsm-app-events-v3', TASKS='bdsm-app-education-tasks-v1', NOTES='bdsm-app-written-notes-v1', LINKS='bdsm-app-event-offence-links-v1';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(_){return d}};
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const eventId=e=>e.event_id||e.id||e.uuid||'';
  const fmt=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleString('pl-PL')};
  const monthOf=v=>{if(!v)return '';const d=new Date(v);if(Number.isNaN(d.getTime()))return '';return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`};
  function build(){
    const offences=read(OFF,[]),events=read(EVENTS,[]),tasks=read(TASKS,[]),notes=read(NOTES,[]),links=read(LINKS,{});
    const map=new Map();
    offences.forEach(o=>map.set(o.offence_id,{offence:o,notes:[],tasks:[],events:[]}));
    const ensure=id=>{if(!id)return null;if(!map.has(id))map.set(id,{offence:{offence_id:id,title:'Powiązane przewinienie'},notes:[],tasks:[],events:[]});return map.get(id)};
    notes.forEach(n=>{if(n.offence_id)ensure(n.offence_id)?.notes.push(n)});
    tasks.forEach(t=>{if(t.offence_id)ensure(t.offence_id)?.tasks.push(t)});
    events.forEach(e=>{const id=eventId(e),offId=links[id]||e.offence_id||null;if(offId)ensure(offId)?.events.push(e)});
    return [...map.values()].sort((a,b)=>new Date(b.offence?.occurred_at||0)-new Date(a.offence?.occurred_at||0));
  }
  function card(g){
    const o=g.offence||{};
    const notes=g.notes.sort((a,b)=>new Date(a.issued_at)-new Date(b.issued_at));
    const tasks=g.tasks.sort((a,b)=>new Date(a.due_at||a.created_at)-new Date(b.due_at||b.created_at));
    const events=g.events.sort((a,b)=>new Date(a.start||a.created_at||0)-new Date(b.start||b.created_at||0));
    const steps=[];
    steps.push(`<div class="tl-step"><div class="tl-dot">⚠</div><div><strong>Przewinienie</strong><div>${esc(o.title||o.offence_id)}</div><small>${fmt(o.occurred_at)} • ${esc(o.status||'—')} • ${esc(o.offence_id||'')}</small></div></div>`);
    notes.forEach(n=>steps.push(`<div class="tl-step"><div class="tl-dot">📝</div><div><strong>${esc(n.type||'Uwaga')}</strong><div>${esc(n.title)}</div><small>${fmt(n.issued_at)} • ${esc(n.status||'—')}</small></div></div>`));
    tasks.forEach(t=>steps.push(`<div class="tl-step"><div class="tl-dot">📚</div><div><strong>${esc(t.type||'Zadanie')}</strong><div>${esc(t.title)}</div><small>termin: ${fmt(t.due_at)} • ${esc(t.status||'—')}</small></div></div>`));
    events.forEach(e=>steps.push(`<div class="tl-step"><div class="tl-dot">${String(e.type).toLowerCase()==='szlaban'?'⊘':'⚖'}</div><div><strong>${esc(e.type||'Kara')}</strong><div>${esc(e.title||'Bez nazwy')}</div><small>${fmt(e.start)} → ${fmt(e.end)} • ${esc(e.status||'—')}</small></div></div>`));
    return `<div class="tl-card"><h4>${esc(o.title||o.offence_id||'Sprawa')}</h4>${steps.join('')}</div>`;
  }
  function ensureUI(){
    const nav=document.querySelector('#nav'),content=document.querySelector('.content');if(!nav||!content)return;
    if(!document.querySelector('#timelineNav')){const b=document.createElement('button');b.id='timelineNav';b.type='button';b.dataset.view='timeline';b.innerHTML='🔗 Oś powiązań';const n=document.querySelector('#writtenNotesNav');if(n&&n.nextSibling)nav.insertBefore(b,n.nextSibling);else nav.appendChild(b);b.addEventListener('click',e=>{e.preventDefault();openView()})}
    if(!document.querySelector('#timelineStyles')){const st=document.createElement('style');st.id='timelineStyles';st.textContent='.tl-grid{display:grid;gap:12px}.tl-card{background:#0c121c;border:1px solid #252d3c;border-radius:12px;padding:14px}.tl-card h4{margin:0 0 12px}.tl-step{display:grid;grid-template-columns:32px 1fr;gap:10px;padding:9px 0;border-top:1px solid #222a39;position:relative}.tl-step:first-of-type{border-top:0}.tl-dot{width:28px;height:28px;border-radius:999px;background:#1b2230;display:grid;place-items:center}.tl-step small{color:#98a2b3}';document.head.appendChild(st)}
    if(!document.querySelector('#view-timeline')){const s=document.createElement('section');s.id='view-timeline';s.className='hidden';s.innerHTML='<div class="panel"><h3>🔗 Oś powiązań</h3><p style="color:#98a2b3;font-size:12px;margin-top:-6px">Jedna sprawa w jednym miejscu: przewinienie, uwagi, zadania edukacyjne oraz powiązane kary/szlabany i ich terminy.</p><div id="timelineStats" style="margin:12px 0"></div><div id="timelineList" class="tl-grid"></div></div>';content.appendChild(s)}
  }
  function render(){const groups=build(),box=document.querySelector('#timelineList'),stats=document.querySelector('#timelineStats');if(!box)return;const linked=groups.filter(g=>g.notes.length||g.tasks.length||g.events.length).length;if(stats)stats.innerHTML=`Spraw: <strong>${groups.length}</strong> &nbsp; Z powiązaniami: <strong>${linked}</strong>`;box.innerHTML=groups.length?groups.map(card).join(''):'<div class="empty">Brak powiązanych spraw.</div>'}
  function openView(){ensureUI();document.querySelectorAll('.content > section').forEach(s=>s.classList.add('hidden'));document.querySelector('#view-timeline')?.classList.remove('hidden');document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));document.querySelector('#timelineNav')?.classList.add('active');render()}
  function monthHtml(month){const groups=build().filter(g=>{const dates=[g.offence?.occurred_at,...g.notes.map(x=>x.issued_at),...g.tasks.map(x=>x.due_at||x.created_at),...g.events.map(x=>x.start||x.end||x.created_at)];return dates.some(d=>monthOf(d)===month)});if(!groups.length)return '<h2>Oś powiązań</h2><p>Brak powiązanych spraw w tym miesiącu.</p>';return `<h2>Oś powiązań</h2>${groups.map(g=>{const o=g.offence||{};const rows=[];rows.push(`<tr><td>${fmt(o.occurred_at)}</td><td>Przewinienie</td><td>${esc(o.title||o.offence_id)}</td><td>${esc(o.status||'—')}</td></tr>`);g.notes.forEach(n=>rows.push(`<tr><td>${fmt(n.issued_at)}</td><td>${esc(n.type||'Uwaga')}</td><td>${esc(n.title)}</td><td>${esc(n.status||'—')}</td></tr>`));g.tasks.forEach(t=>rows.push(`<tr><td>${fmt(t.due_at||t.created_at)}</td><td>${esc(t.type||'Zadanie')}</td><td>${esc(t.title)}</td><td>${esc(t.status||'—')}</td></tr>`));g.events.forEach(e=>rows.push(`<tr><td>${fmt(e.start||e.end||e.created_at)}</td><td>${esc(e.type||'Kara')}</td><td>${esc(e.title||'Bez nazwy')}</td><td>${esc(e.status||'—')} • do ${fmt(e.end)}</td></tr>`));return `<h3>${esc(o.title||o.offence_id||'Sprawa')}</h3><table><thead><tr><th>Data</th><th>Etap</th><th>Opis</th><th>Status / termin</th></tr></thead><tbody>${rows.join('')}</tbody></table>`}).join('')}`}
  function refresh(){ensureUI();render()}
  function install(){refresh();['bdsm-offences-updated','bdsm-written-notes-updated','bdsm-education-tasks-updated','bdsm-sync-complete'].forEach(ev=>document.addEventListener(ev,refresh));window.addEventListener('storage',refresh);window.bdsmRelationshipTimeline={open:openView,groups:build,monthHtml};}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();