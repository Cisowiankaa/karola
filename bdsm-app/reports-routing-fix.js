(()=>{
if(window.__bdsmReportsRoutingFixInstalled)return;window.__bdsmReportsRoutingFixInstalled=true;
const EVENTS='bdsm-app-events-v3';
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const labels={spanking:'Spanking',kara:'Kary',szlaban:'Szlabany',nagroda:'Nagrody'};
const isMonthlyButton=b=>!!b&&b.textContent.includes('Raport miesięczny');
const isDailyButton=b=>!!b&&b.textContent.includes('Raport dzienny');
function monthData(){const now=new Date(),ev=read(EVENTS,[]).filter(e=>{const d=new Date(e.start||e.created_at);return !isNaN(d)&&d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()});return ev}
function showMonthly(){
 document.querySelectorAll('.content > section').forEach(x=>x.classList.add('hidden'));
 const view=document.querySelector('#view-reports');if(!view)return;view.classList.remove('hidden');
 document.querySelectorAll('#nav button').forEach(x=>x.classList.remove('active'));
 const btn=[...document.querySelectorAll('#nav button')].find(isMonthlyButton);btn?.classList.add('active');
 const panel=view.querySelector('.panel');const box=document.querySelector('#reportsView');if(!box)return;
 const ev=monthData();const points=ev.reduce((a,e)=>a+Number(e.points_delta??e.points??0),0);
 if(panel?.querySelector(':scope > h3'))panel.querySelector(':scope > h3').textContent='Raport miesięczny';
 box.innerHTML=`<div><h3 style="margin-bottom:14px">Raport miesięczny — ${esc(new Date().toLocaleDateString('pl-PL',{month:'long',year:'numeric'}))}</h3><table class="table"><tbody>${Object.keys(labels).map(t=>`<tr><td>${labels[t]}</td><td>${ev.filter(e=>String(e.type||'').toLowerCase()===t).length}</td></tr>`).join('')}<tr><td><strong>Punkty</strong></td><td><strong>${points}</strong></td></tr></tbody></table></div>`;
}
function install(){
 document.addEventListener('click',e=>{
  const b=e.target.closest?.('#nav button');if(!b)return;
  if(isDailyButton(b)){
   e.preventDefault();e.stopImmediatePropagation();
   if(window.bdsmDailyReports?.open)window.bdsmDailyReports.open();
   return;
  }
  if(isMonthlyButton(b)){
   e.preventDefault();e.stopImmediatePropagation();showMonthly();
  }
 },true);
 window.bdsmReportsRoutingFix={openMonthly:showMonthly};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
