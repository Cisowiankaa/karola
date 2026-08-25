(()=>{
  if(window.__bdsmRelationshipTimelineInstalled)return;
  window.__bdsmRelationshipTimelineInstalled=true;
  const OFF='bdsm-app-offences-v1', EVENTS='bdsm-app-events-v3', TASKS='bdsm-app-education-tasks-v1', NOTES='bdsm-app-written-notes-v1', LINKS='bdsm-app-event-offence-links-v1';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(_){return d}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const eventId=e=>e.event_id||e.id||e.uuid||'';
  const fmt=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleString('pl-PL')};
  const monthOf=v=>{if(!v)return '';const d=new Date(v);if(Number.isNaN(d.getTime()))return '';return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`};
  function build(){
    const offences=read(OFF,[]),events=read(EVENTS,[]),tasks=read(TASKS,[]),notes=read(NOTES,[]),links=read(LINKS,{}),map=new Map();
    offences.forEach(o=>map.set(o.offence_id,{offence:o,notes:[],tasks:[],events:[]}));
    const ensure=id=>{if(!id)return null;if(!map.has(id))map.set(id,{offence:{offence_id:id,title:'Powiązane przewinienie'},notes:[],tasks:[],events:[]});return map.get(id)};
    notes.forEach(n=>{if(n.offence_id)ensure(n.offence_id)?.notes.push(n)});
    tasks.forEach(t=>{if(t.offence_id)ensure(t.offence_id)?.tasks.push(t)});
    events.forEach(e=>{const id=eventId(e),offId=links[id]||e.offence_id||null;if(offId)ensure(offId)?.events.push(e)});
    return [...map.values()].sort((a,b)=>new Date(b.offence?.occurred_at||0)-new Date(a.offence?.occurred_at||0));
  }
  function sorted(g){return {notes:[...g.notes].sort((a,b)=>new Date(a.issued_at)-new Date(b.issued_at)),tasks:[...g.tasks].sort((a,b)=>new Date(a.due_at||a.created_at)-new Date(b.due_at||b.created_at)),events:[...g.events].sort((a,b)=>new Date(a.start||a.created_at||0)-new Date(b.start||b.created_at||0))}}
  function stepsHtml(g){const o=g.offence||{},s=sorted(g),steps=[];steps.push(`<div class="tl-step"><div class="tl-dot">⚠</div><div><strong>Przewinienie</strong><div>${esc(o.title||o.offence_id)}</div><small>${fmt(o.occurred_at)} • ${esc(o.status||'—')} • ${esc(o.offence_id||'')}</small></div></div>`);s.notes.forEach(n=>steps.push(`<div class="tl-step"><div class="tl-dot">📝</div><div><strong>${esc(n.type||'Uwaga')}</strong><div>${esc(n.title)}</div><small>${fmt(n.issued_at)} • ${esc(n.status||'—')}</small></div></div>`));s.tasks.forEach(t=>steps.push(`<div class="tl-step"><div class="tl-dot">📚</div><div><strong>${esc(t.type||'Zadanie')}</strong><div>${esc(t.title)}</div><small>termin: ${fmt(t.due_at)} • ${esc(t.status||'—')}</small></div></div>`));s.events.forEach(e=>steps.push(`<div class="tl-step"><div class="tl-dot">${String(e.type).toLowerCase()==='szlaban'?'⊘':'⚖'}</div><div><strong>${esc(e.type||'Kara')}</strong><div>${esc(e.title||'Bez nazwy')}</div><small>${fmt(e.start)} → ${fmt(e.end)} • ${esc(e.status||'—')}</small></div></div>`));return steps.join('')}
  function card(g){const o=g.offence||{};return `<button class="tl-card tl-card-btn" type="button" data-case-id="${esc(o.offence_id||'')}"><div class="tl-card-head"><h4>${esc(o.title||o.offence_id||'Sprawa')}</h4><span>Otwórz kartę →</span></div>${stepsHtml(g)}</button>`}
  function ensureUI(){
    const nav=document.querySelector('#nav'),content=document.querySelector('.content');if(!nav||!content)return;
    if(!document.querySelector('#timelineNav')){const b=document.createElement('button');b.id='timelineNav';b.type='button';b.dataset.view='timeline';b.innerHTML='🔗 Oś powiązań';const n=document.querySelector('#writtenNotesNav');if(n&&n.nextSibling)nav.insertBefore(b,n.nextSibling);else nav.appendChild(b);b.addEventListener('click',e=>{e.preventDefault();openView()})}
    if(!document.querySelector('#timelineStyles')){const st=document.createElement('style');st.id='timelineStyles';st.textContent='.tl-grid{display:grid;gap:12px}.tl-card{background:#0c121c;border:1px solid #252d3c;border-radius:12px;padding:14px;color:inherit;text-align:left;width:100%}.tl-card-btn{cursor:pointer}.tl-card-btn:hover{border-color:#7c3aed;transform:translateY(-1px)}.tl-card-head{display:flex;justify-content:space-between;gap:12px;align-items:center}.tl-card h4{margin:0 0 12px}.tl-card-head span{font-size:11px;color:#b79cff}.tl-step{display:grid;grid-template-columns:32px 1fr;gap:10px;padding:9px 0;border-top:1px solid #222a39;position:relative}.tl-step:first-of-type{border-top:0}.tl-dot{width:28px;height:28px;border-radius:999px;background:#1b2230;display:grid;place-items:center}.tl-step small{color:#98a2b3}.case-modal{position:fixed;inset:0;background:rgba(3,6,12,.78);z-index:10050;display:none;place-items:center;padding:20px}.case-modal.open{display:grid}.case-box{width:min(900px,96vw);max-height:90vh;overflow:auto;background:#111724;border:1px solid #394258;border-radius:16px;padding:18px;box-shadow:0 24px 80px rgba(0,0,0,.55)}.case-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.case-top h3{margin:0 0 4px}.case-close{background:#1b2230;border:1px solid #313b4f;color:#fff;border-radius:9px;padding:8px 11px;cursor:pointer}.case-meta{color:#98a2b3;font-size:12px}.case-desc{white-space:pre-wrap;background:#0c121c;border:1px solid #252d3c;border-radius:10px;padding:12px;margin:14px 0}.case-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}.case-grid div{background:#0c121c;border:1px solid #252d3c;border-radius:10px;padding:10px}.case-grid b{display:block;font-size:18px}.case-grid span{font-size:10px;color:#98a2b3}.case-actions{display:flex;flex-wrap:wrap;gap:8px;padding:12px 0 2px}.case-actions .btn{flex:1;min-width:135px}.case-link-banner{background:#17122a;border:1px solid #55318a;color:#dec8ff;border-radius:10px;padding:9px 12px;margin-bottom:12px;font-size:12px}@media(max-width:700px){.case-grid{grid-template-columns:repeat(2,1fr)}.case-actions .btn{min-width:46%}}';document.head.appendChild(st)}
    if(!document.querySelector('#view-timeline')){const s=document.createElement('section');s.id='view-timeline';s.className='hidden';s.innerHTML='<div class="panel"><h3>🔗 Oś powiązań</h3><p style="color:#98a2b3;font-size:12px;margin-top:-6px">Kliknij sprawę, aby otworzyć pełną kartę przewinienia z uwagami, zadaniami, karami/szlabaniami i terminami.</p><div id="timelineStats" style="margin:12px 0"></div><div id="timelineList" class="tl-grid"></div></div>';content.appendChild(s);s.addEventListener('click',e=>{const c=e.target.closest('[data-case-id]');if(c)openCase(c.dataset.caseId)})}
    if(!document.querySelector('#caseModal')){const m=document.createElement('div');m.id='caseModal';m.className='case-modal';m.innerHTML='<div class="case-box" id="caseBox"></div>';document.body.appendChild(m);m.addEventListener('click',e=>{if(e.target===m)closeCase()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCase()})}
  }
  function openCase(id){ensureUI();const g=build().find(x=>String(x.offence?.offence_id||'')===String(id));if(!g)return;const o=g.offence||{},s=sorted(g),box=document.querySelector('#caseBox'),m=document.querySelector('#caseModal'),readonly=document.querySelector('#app')?.classList.contains('readonly');const desc=o.description||o.notes||o.note||'Brak dodatkowego opisu.';const actions=readonly?'':`<div class="case-actions"><button class="btn" data-case-action="note">📝 Dodaj uwagę</button><button class="btn" data-case-action="task">📚 Dodaj zadanie</button><button class="btn" data-case-action="kara">⚖ Dodaj karę</button><button class="btn" data-case-action="szlaban">⊘ Dodaj szlaban</button></div>`;box.innerHTML=`<div class="case-top"><div><h3>⚠ ${esc(o.title||o.offence_id||'Karta sprawy')}</h3><div class="case-meta">${esc(o.offence_id||'')} • ${fmt(o.occurred_at)} • status: ${esc(o.status||'—')}</div></div><button class="case-close" id="caseClose">✕ Zamknij</button></div><div class="case-desc">${esc(desc)}</div><div class="case-grid"><div><b>${s.notes.length}</b><span>uwag / upomnień</span></div><div><b>${s.tasks.length}</b><span>zadań edukacyjnych</span></div><div><b>${s.events.filter(e=>String(e.type).toLowerCase()==='kara').length}</b><span>kar</span></div><div><b>${s.events.filter(e=>String(e.type).toLowerCase()==='szlaban').length}</b><span>szlabanów</span></div></div>${actions}<h4>Chronologia sprawy</h4>${stepsHtml(g)}`;box.querySelector('#caseClose').addEventListener('click',closeCase);box.querySelectorAll('[data-case-action]').forEach(b=>b.addEventListener('click',()=>quickAdd(b.dataset.caseAction,o.offence_id,o.title||'')));m.classList.add('open')}
  function closeCase(){document.querySelector('#caseModal')?.classList.remove('open')}
  function linkedBanner(id,title){const div=document.createElement('div');div.className='case-link-banner';div.innerHTML=`🔗 Powiązane z przewinieniem: <strong>${esc(title||id)}</strong> <span style="font-family:monospace">${esc(id)}</span>`;return div}
  function quickAdd(kind,id,title){
    if(!id||document.querySelector('#app')?.classList.contains('readonly'))return;
    closeCase();
    if(kind==='note'){
      window.bdsmWrittenNotes?.open?.();
      setTimeout(()=>{const sel=document.querySelector('#noteOff');if(sel)sel.value=id;const t=document.querySelector('#noteTitle');if(t&&!t.value)t.value=`Uwaga — ${title||id}`;document.querySelector('#noteBody')?.focus()},0);
      return;
    }
    if(kind==='task'){
      window.bdsmEducationTasks?.open?.();
      setTimeout(()=>{const sel=document.querySelector('#eduOffence');if(sel)sel.value=id;document.querySelector('#eduTitle')?.focus()},0);
      return;
    }
    if(kind==='kara'||kind==='szlaban'){
      if(typeof showView!=='function'||typeof makeForm!=='function')return;
      showView('add');
      const node=document.querySelector('#fullForm');if(!node)return;
      makeForm(node,false,kind);
      const form=node.querySelector('form');if(!form)return;
      node.insertBefore(linkedBanner(id,title),node.firstChild);
      const before=new Set(read(EVENTS,[]).map(eventId));
      form.addEventListener('submit',()=>setTimeout(()=>{
        const data=read(EVENTS,[]),created=data.find(e=>!before.has(eventId(e)));
        if(!created)return;
        const eid=eventId(created),links=read(LINKS,{});links[eid]=id;write(LINKS,links);
        created.offence_id=id;write(EVENTS,data);
        document.dispatchEvent(new CustomEvent('bdsm-case-linked',{detail:{offence_id:id,event_id:eid}}));
        document.dispatchEvent(new Event('bdsm-sync-complete'));
      },20),{once:true});
      form.querySelector('[name="title"]')?.focus();
    }
  }
  function render(){const groups=build(),box=document.querySelector('#timelineList'),stats=document.querySelector('#timelineStats');if(!box)return;const linked=groups.filter(g=>g.notes.length||g.tasks.length||g.events.length).length;if(stats)stats.innerHTML=`Spraw: <strong>${groups.length}</strong> &nbsp; Z powiązaniami: <strong>${linked}</strong>`;box.innerHTML=groups.length?groups.map(card).join(''):'<div class="empty">Brak powiązanych spraw.</div>'}
  function openView(){ensureUI();document.querySelectorAll('.content > section').forEach(s=>s.classList.add('hidden'));document.querySelector('#view-timeline')?.classList.remove('hidden');document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));document.querySelector('#timelineNav')?.classList.add('active');render()}
  function monthHtml(month){const groups=build().filter(g=>{const dates=[g.offence?.occurred_at,...g.notes.map(x=>x.issued_at),...g.tasks.map(x=>x.due_at||x.created_at),...g.events.map(x=>x.start||x.end||x.created_at)];return dates.some(d=>monthOf(d)===month)});if(!groups.length)return '<h2>Oś powiązań</h2><p>Brak powiązanych spraw w tym miesiącu.</p>';return `<h2>Oś powiązań</h2>${groups.map(g=>{const o=g.offence||{},rows=[];rows.push(`<tr><td>${fmt(o.occurred_at)}</td><td>Przewinienie</td><td>${esc(o.title||o.offence_id)}</td><td>${esc(o.status||'—')}</td></tr>`);g.notes.forEach(n=>rows.push(`<tr><td>${fmt(n.issued_at)}</td><td>${esc(n.type||'Uwaga')}</td><td>${esc(n.title)}</td><td>${esc(n.status||'—')}</td></tr>`));g.tasks.forEach(t=>rows.push(`<tr><td>${fmt(t.due_at||t.created_at)}</td><td>${esc(t.type||'Zadanie')}</td><td>${esc(t.title)}</td><td>${esc(t.status||'—')}</td></tr>`));g.events.forEach(e=>rows.push(`<tr><td>${fmt(e.start||e.end||e.created_at)}</td><td>${esc(e.type||'Kara')}</td><td>${esc(e.title||'Bez nazwy')}</td><td>${esc(e.status||'—')} • do ${fmt(e.end)}</td></tr>`));return `<h3>${esc(o.title||o.offence_id||'Sprawa')}</h3><table><thead><tr><th>Data</th><th>Etap</th><th>Opis</th><th>Status / termin</th></tr></thead><tbody>${rows.join('')}</tbody></table>`}).join('')}`}
  function refresh(){ensureUI();render()}
  function install(){refresh();['bdsm-offences-updated','bdsm-written-notes-updated','bdsm-education-tasks-updated','bdsm-case-linked','bdsm-sync-complete'].forEach(ev=>document.addEventListener(ev,refresh));window.addEventListener('storage',refresh);window.bdsmRelationshipTimeline={open:openView,openCase,quickAdd,groups:build,monthHtml};}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();