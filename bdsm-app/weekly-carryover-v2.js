(()=>{
 if(window.__bdsmWeeklyCarryoverV2Installed)return;
 window.__bdsmWeeklyCarryoverV2Installed=true;
 const EVENTS='bdsm-app-events-v3',TASKS='bdsm-app-education-tasks-v1';
 const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
 const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
 const day=v=>{const d=new Date(v);if(Number.isNaN(d.getTime()))return null;d.setHours(0,0,0,0);return d};
 const active=s=>!['wykonane','anulowane','zamknięte'].includes(String(s||'').toLowerCase());
 function overdueFor(target){
   const t=day(target);if(!t)return[];
   const tasks=read(TASKS,[]).filter(x=>active(x.status)&&x.due_at&&day(x.due_at)<t).map(x=>({kind:'task',title:x.title||'Zadanie',due:x.due_at,open:'tasks'}));
   const events=read(EVENTS,[]).filter(x=>['kara','szlaban'].includes(String(x.type||'').toLowerCase())&&active(x.status)&&x.end&&day(x.end)<t).map(x=>({kind:String(x.type||'kara').toLowerCase(),title:x.title||x.type||'Wpis',due:x.end,open:'deadlines'}));
   return [...tasks,...events].sort((a,b)=>new Date(a.due)-new Date(b.due));
 }
 function enhance(){
   const grid=document.querySelector('#weeklyGrid');if(!grid)return;
   grid.querySelectorAll('.week-day').forEach(card=>{
     card.querySelector('.week-carry-auto')?.remove();
     const btn=card.querySelector('[data-week-done]'),key=btn?.dataset.weekDone;if(!key)return;
     const items=overdueFor(key);if(!items.length)return;
     const host=document.createElement('div');host.className='week-carry-auto';
     host.innerHTML=`<div class="week-carry-title">↪ Do nadrobienia (${items.length})</div>${items.map(x=>`<div class="week-item week-carry-item" data-week-open="${x.open}"><strong>${x.kind==='task'?'📚':x.kind==='szlaban'?'⊘':'⚖'} ${esc(x.title)}</strong><small>Oryginalny termin: ${new Date(x.due).toLocaleString('pl-PL')} • przeniesienie tylko organizacyjne</small></div>`).join('')}`;
     const status=card.querySelector('.week-day-status');status?.insertAdjacentElement('afterend',host);
   });
 }
 function styles(){if(document.querySelector('#weekCarryV2Styles'))return;const s=document.createElement('style');s.id='weekCarryV2Styles';s.textContent='.week-carry-auto{margin:8px 0 10px;padding:8px;border:1px solid #5a4517;border-radius:10px;background:#17140b}.week-carry-title{font-size:11px;font-weight:800;color:#ffd36f;margin-bottom:5px}.week-carry-item{border-color:#5a4517!important;background:#211b0c!important}.week-carry-item small{color:#c9ad68!important}';document.head.appendChild(s)}
 function install(){styles();enhance();const g=document.querySelector('#weeklyGrid');if(g)new MutationObserver(()=>setTimeout(enhance,0)).observe(g,{childList:true,subtree:false});['bdsm-education-tasks-updated','bdsm-case-linked','bdsm-sync-complete'].forEach(e=>document.addEventListener(e,()=>setTimeout(enhance,0)));window.addEventListener('storage',()=>setTimeout(enhance,0))}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();