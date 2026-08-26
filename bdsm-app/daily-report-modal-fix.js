(()=>{
  if(window.__bdsmDailyReportModalFixInstalled)return;
  window.__bdsmDailyReportModalFixInstalled=true;
  const KEY='bdsm-app-daily-reports-v1';
  const read=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}};
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  function ensureModal(){
    let m=document.querySelector('#drFixedModal');
    if(m)return m;
    const st=document.createElement('style');st.id='drFixedModalStyles';st.textContent='#drFixedModal{position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.72);display:none;align-items:center;justify-content:center;padding:22px}#drFixedModal.open{display:flex}#drFixedModal .drfm-box{width:min(900px,96vw);max-height:90vh;overflow:auto;background:#111724;border:1px solid #313b4f;border-radius:16px;padding:20px;box-shadow:0 24px 80px rgba(0,0,0,.55)}#drFixedModal .drfm-head{display:flex;justify-content:space-between;gap:12px;align-items:center}#drFixedModal .drfm-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}#drFixedModal .drfm-card{background:#0c121c;border:1px solid #252d3c;border-radius:10px;padding:12px}#drFixedModal .drfm-card b{display:block;font-size:22px;margin-top:5px}#drFixedModal .drfm-close{font-size:22px;line-height:1;background:#1b2230;border:1px solid #313b4f;color:#fff;border-radius:8px;padding:8px 11px;cursor:pointer}@media(max-width:700px){#drFixedModal .drfm-grid{grid-template-columns:repeat(2,1fr)}}';document.head.appendChild(st);
    m=document.createElement('div');m.id='drFixedModal';m.innerHTML='<div class="drfm-box"><div class="drfm-head"><h2 id="drfmTitle" style="margin:0">Raport dzienny</h2><button class="drfm-close" type="button">×</button></div><div id="drfmBody"></div></div>';document.body.appendChild(m);
    m.querySelector('.drfm-close').onclick=()=>m.classList.remove('open');m.onclick=e=>{if(e.target===m)m.classList.remove('open')};return m;
  }
  function open(date){
    const r=read().find(x=>x.date===date);if(!r)return;
    const m=ensureModal(),label=new Date(date+'T12:00:00').toLocaleDateString('pl-PL',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
    m.querySelector('#drfmTitle').textContent='Raport dzienny — '+label;
    m.querySelector('#drfmBody').innerHTML=`<div class="drfm-grid"><div class="drfm-card">⚠ Przewinienia<b>${r.offences||0}</b></div><div class="drfm-card">📚 Zadania<b>${r.tasks||0}</b></div><div class="drfm-card">⚖/⊘ Wpisy<b>${r.events||0}</b></div><div class="drfm-card">📝 Uwagi<b>${r.notes||0}</b></div><div class="drfm-card">🕐 Dziennik<b>${r.hourly||0}</b></div><div class="drfm-card">☑ Checklista<b>${r.checklist_pct||0}%</b></div><div class="drfm-card">★ Punkty<b>${r.points||0}</b></div><div class="drfm-card">Status<b style="font-size:15px">${r.day_done?'Zakończony':'Otwarty'}</b></div></div><div class="panel"><p><strong>Plan dnia:</strong><br>${esc(r.plan||'—')}</p><p><strong>Podsumowanie dnia:</strong><br>${esc(r.summary||'—')}</p></div>`;
    m.classList.add('open');
  }
  document.addEventListener('click',e=>{const b=e.target.closest?.('[data-dr-open]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();open(b.dataset.drOpen)},true);
  window.bdsmDailyReportModalFix={open};
})();
