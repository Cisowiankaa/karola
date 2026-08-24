(() => {
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(_){return d}};
  const fmt=v=>{if(!v)return'—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleString('pl-PL')};
  function badge(s){const m={sent:['Wysłano','#12351f','#7ee2a8'],sending:['Wysyłanie…','#33270f','#ffd36f'],error:['Błąd','#3a171d','#ff929c'],pending:['Oczekuje','#202735','#c6cedb']};const [t,b,c]=m[s]||m.pending;return `<span style="display:inline-block;padding:5px 8px;border-radius:8px;background:${b};color:${c};font-size:11px;font-weight:700">${t}</span>`}
  function ensureSection(){
    let sec=document.querySelector('#view-email-invites');
    if(!sec){
      const content=document.querySelector('.content'); if(!content)return null;
      sec=document.createElement('section'); sec.id='view-email-invites'; sec.className='hidden';
      sec.innerHTML='<div class="panel"><h3>E-maile / Zaproszenia</h3><p style="color:#98a2b3;font-size:12px">Centralny podgląd wysyłki zaproszeń.</p><div id="emailInviteStats" style="margin:12px 0"></div><div id="emailInviteTable"></div></div>';
      content.appendChild(sec);
    }
    return sec;
  }
  function render(){
    const sec=ensureSection(); if(!sec)return;
    const table=sec.querySelector('#emailInviteTable'),stats=sec.querySelector('#emailInviteStats');
    const local=read('bdsm-app-access',[]),log=read('bdsm-app-invite-log-v1',{}),map=new Map();
    local.forEach(x=>x&&x.person&&map.set(String(x.person).toLowerCase(),x));
    Object.keys(log).forEach(p=>{const k=p.toLowerCase();if(!map.has(k))map.set(k,{person:p,role:'—',centralOnly:true})});
    if(!map.size)map.set('cisowianka20@gmail.com',{person:'cisowianka20@gmail.com',role:'—',centralOnly:true});
    const list=[...map.values()];
    const rows=list.map(x=>{const key=Object.keys(log).find(k=>k.toLowerCase()===String(x.person).toLowerCase());const st=key?log[key]:{status:'pending'};const msg=(st.messageId&&st.messageId!=='14.1')?st.messageId:'—';return `<tr><td>${x.person}</td><td>${x.role||'—'}</td><td>${badge(st.status)}</td><td>${fmt(st.sentAt||st.lastAttemptAt)}</td><td style="font-family:monospace;font-size:11px">${msg}</td><td>${st.source==='central'?'Baza centralna':'Lokalny'}</td></tr>`}).join('');
    const sent=list.filter(x=>{const k=Object.keys(log).find(y=>y.toLowerCase()===String(x.person).toLowerCase());return k&&log[k].status==='sent'}).length;
    if(stats)stats.innerHTML=`Wysłano: <strong>${sent}</strong> &nbsp; Łącznie: <strong>${list.length}</strong>`;
    if(table)table.innerHTML=`<div style="overflow:auto"><table class="table"><thead><tr><th>Adres</th><th>Rola</th><th>Status</th><th>Data</th><th>Message ID</th><th>Źródło</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function openPanel(e){
    const btn=e.target.closest&&e.target.closest('#emailInvitesNav'); if(!btn)return;
    e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation();
    const sec=ensureSection(); if(!sec)return;
    document.querySelectorAll('.content > section').forEach(s=>s.classList.add('hidden'));
    sec.classList.remove('hidden'); sec.style.display='block';
    document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
    render();
  }
  document.addEventListener('click',openPanel,true);
  document.addEventListener('bdsm-invite-status-updated',render);
  const install=()=>{const b=document.querySelector('#emailInvitesNav');if(b)b.dataset.view='email-invites';ensureSection();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
