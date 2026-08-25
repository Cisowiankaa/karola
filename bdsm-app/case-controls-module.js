(()=>{
  if(window.__bdsmCaseControlsInstalled)return;
  window.__bdsmCaseControlsInstalled=true;
  const OFF='bdsm-app-offences-v1';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(_){return d}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  let filter='all';

  function api(){return window.bdsmRelationshipTimeline||null}
  function groups(){return api()?.groups?.()||[]}
  function status(g){return api()?.caseStatus?.(g)||{key:'open',label:'Otwarta'}}

  function ensureFilter(){
    const stats=document.querySelector('#timelineStats');
    if(!stats||document.querySelector('#caseFilterBar'))return;
    const bar=document.createElement('div');
    bar.id='caseFilterBar';
    bar.style.cssText='display:flex;gap:7px;flex-wrap:wrap;margin:12px 0';
    bar.innerHTML=[['all','Wszystkie'],['open','Otwarte'],['progress','W toku'],['waiting','Czeka'],['closed','Zakończone']].map(([k,l])=>`<button class="btn" type="button" data-case-filter="${k}">${l}</button>`).join('');
    stats.insertAdjacentElement('afterend',bar);
    bar.addEventListener('click',e=>{const b=e.target.closest('[data-case-filter]');if(!b)return;filter=b.dataset.caseFilter;applyFilter()});
  }

  function applyFilter(){
    ensureFilter();
    const gs=groups(),cards=[...document.querySelectorAll('#timelineList [data-case-id]')];
    cards.forEach(card=>{const g=gs.find(x=>String(x.offence?.offence_id||'')===String(card.dataset.caseId));const k=g?status(g).key:'open';card.style.display=(filter==='all'||filter===k)?'':'none'});
    document.querySelectorAll('#caseFilterBar [data-case-filter]').forEach(b=>b.classList.toggle('primary',b.dataset.caseFilter===filter));
  }

  function enhanceModal(){
    const box=document.querySelector('#caseBox');if(!box)return;
    const meta=box.querySelector('.case-meta');if(!meta)return;
    const id=(meta.textContent.match(/PRZ-[A-Z0-9-]+/)||[])[0];if(!id)return;
    const g=groups().find(x=>String(x.offence?.offence_id||'')===id);if(!g)return;
    const st=status(g),readonly=document.querySelector('#app')?.classList.contains('readonly');
    if(st.key==='closed'&&!readonly&&!box.querySelector('[data-case-reopen]')){
      const actions=box.querySelector('.case-actions')||(()=>{const d=document.createElement('div');d.className='case-actions';box.querySelector('.case-grid')?.insertAdjacentElement('afterend',d);return d})();
      const b=document.createElement('button');b.className='btn primary';b.type='button';b.dataset.caseReopen=id;b.textContent='↺ Otwórz ponownie sprawę';actions.appendChild(b);
      b.addEventListener('click',()=>reopen(id));
    }
  }

  function reopen(id){
    const data=read(OFF,[]),o=data.find(x=>String(x.offence_id)===String(id));if(!o)return;
    o.status='otwarte';delete o.closed_at;o.updated_at=new Date().toISOString();write(OFF,data);
    document.dispatchEvent(new CustomEvent('bdsm-offences-updated',{detail:{offence_id:id,reopened:true}}));
    api()?.openCase?.(id);setTimeout(enhanceModal,0);updateDashboard();applyFilter();
  }

  function ensureDashboardCard(){
    const stats=document.querySelector('#stats');if(!stats)return null;
    let card=document.querySelector('#caseAttentionStat');
    if(!card){card=document.createElement('div');card.id='caseAttentionStat';card.className='stat';card.style.cursor='pointer';stats.appendChild(card);card.addEventListener('click',()=>api()?.open?.())}
    return card;
  }
  function updateDashboard(){
    const gs=groups(),needs=gs.filter(g=>['open','progress','waiting'].includes(status(g).key)),waiting=gs.filter(g=>status(g).key==='waiting').length;
    const card=ensureDashboardCard();if(!card)return;
    card.innerHTML=`<div class="ico">⚠</div><div>Sprawy wymagające uwagi</div><div class="value">${needs.length}</div><small>${waiting} czeka na wykonanie</small>`;
  }

  function refresh(){setTimeout(()=>{ensureFilter();applyFilter();updateDashboard();enhanceModal()},0)}
  function install(){
    refresh();
    ['bdsm-offences-updated','bdsm-written-notes-updated','bdsm-education-tasks-updated','bdsm-case-linked','bdsm-sync-complete'].forEach(ev=>document.addEventListener(ev,refresh));
    document.addEventListener('click',e=>{if(e.target.closest?.('[data-case-id]'))setTimeout(enhanceModal,0)},true);
    window.addEventListener('storage',refresh);
    window.bdsmCaseControls={reopen,refresh};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
