(()=>{
if(window.__bdsmDailyReportsInstalled)return;
window.__bdsmDailyReportsInstalled=true;

const KEY='bdsm-app-daily-reports-v1';
const EVENTS='bdsm-app-events-v3';
const OFF='bdsm-app-offences-v1';
const TASKS='bdsm-app-education-tasks-v1';
const NOTES='bdsm-app-written-notes-v1';
const HOURS='bdsm-app-hourly-reports-v1';
const DAYMETA='bdsm-app-day-agenda-meta-v1';

const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const pad=n=>String(n).padStart(2,'0');
const keyOf=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const same=(v,k)=>{if(!v)return false;const d=new Date(v);return !Number.isNaN(d.getTime())&&keyOf(d)===k};
const reports=()=>{const x=read(KEY,[]);return Array.isArray(x)?x:[]};
const saveReports=x=>write(KEY,x);
const dailyBtn=()=>[...document.querySelectorAll('#nav button')].find(x=>x.textContent.includes('Raport dzienny'));
const monthlyBtn=()=>[...document.querySelectorAll('#nav button')].find(x=>x.textContent.includes('Raport miesięczny'));

function snapshot(date){
 const ev=read(EVENTS,[]).filter(x=>same(x.start,date)||same(x.end,date)||same(x.created_at,date));
 const off=read(OFF,[]).filter(x=>same(x.occurred_at||x.created_at,date));
 const tasks=read(TASKS,[]).filter(x=>same(x.due_at||x.created_at,date));
 const notes=read(NOTES,[]).filter(x=>same(x.issued_at||x.date||x.created_at,date));
 const hours=read(HOURS,[]).filter(x=>x.date===date);
 const meta=(read(DAYMETA,{})||{})[date]||{};
 const check=Array.isArray(meta.checklist)?meta.checklist:[];
 const checkDone=check.filter(x=>x.done).length;
 const points=ev.reduce((sum,x)=>{const raw=x.points_delta!=null?x.points_delta:(x.points!=null?x.points:0);return sum+(Number(raw)||0)},0);
 return {date,events:ev.length,offences:off.length,tasks:tasks.length,notes:notes.length,hourly:hours.length,points,checklist_total:check.length,checklist_done:checkDone,checklist_pct:check.length?Math.round(checkDone/check.length*100):0,day_done:!!meta.done,plan:meta.plan||'',summary:meta.summary||'',updated_at:new Date().toISOString()};
}

function ensureDate(date){
 const all=reports(),i=all.findIndex(x=>x.date===date),snap=snapshot(date);
 if(i>=0)all[i]={...all[i],...snap,report_id:all[i].report_id||`DAY-${date}`};
 else all.push({report_id:`DAY-${date}`,created_at:new Date().toISOString(),...snap});
 all.sort((a,b)=>b.date.localeCompare(a.date));saveReports(all);return snap;
}

function catchUp(){
 const all=reports(),today=new Date();let start=new Date(today);
 if(all.length){const last=[...all].sort((a,b)=>b.date.localeCompare(a.date))[0]?.date;if(last){start=new Date(last+'T12:00:00');start.setDate(start.getDate()+1)}}else start.setDate(start.getDate()-6);
 const min=new Date(today);min.setDate(min.getDate()-31);if(start<min)start=min;
 for(let d=new Date(start);d<=today;d.setDate(d.getDate()+1))ensureDate(keyOf(d));
 ensureDate(keyOf(today));
}

function ensureStyles(){
 if(document.querySelector('#dailyReportsStyles'))return;
 const st=document.createElement('style');st.id='dailyReportsStyles';
 st.textContent='.dr-head{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}.dr-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.dr-toolbar input{background:#0a101a;color:#eef1f6;border:1px solid #283141;border-radius:8px;padding:9px}.dr-list{display:grid;gap:8px;margin-top:14px}.dr-row{display:grid;grid-template-columns:120px repeat(6,minmax(70px,1fr)) auto;gap:8px;align-items:center;padding:11px;border:1px solid #252d3c;border-radius:10px;background:#0c121c}.dr-detail{margin-top:14px}.dr-pills{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.dr-pill{padding:6px 9px;border:1px solid #313b4f;border-radius:999px;font-size:11px}.mr-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:14px 0}.mr-card{background:#0c121c;border:1px solid #252d3c;border-radius:12px;padding:14px}.mr-card strong{display:block;font-size:24px;margin-top:6px}@media(max-width:1000px){.dr-row{grid-template-columns:110px 1fr auto}.dr-stat{display:none}.mr-grid{grid-template-columns:repeat(2,1fr)}}';
 document.head.appendChild(st);
}

function ensureDailyUI(){
 ensureStyles();const content=document.querySelector('.content');if(!content)return;
 if(document.querySelector('#view-daily-reports'))return;
 const s=document.createElement('section');s.id='view-daily-reports';s.className='hidden';
 s.innerHTML='<div class="panel"><div class="dr-head"><div><h3 style="margin-bottom:4px">📅 Raport dzienny</h3><small style="color:#98a2b3">Osobny raport dla każdego dnia — tworzony automatycznie bez duplikatów.</small></div><div class="dr-toolbar"><input type="date" id="drDate"><button class="btn" id="drOpenDate">Otwórz datę</button><button class="btn" id="drToday">Dzisiaj</button><button class="btn primary" id="dailyReportRefresh">Odśwież dzisiaj</button></div></div><div id="dailyReportsList" class="dr-list"></div><div id="dailyReportDetail" class="dr-detail"></div></div>';
 content.appendChild(s);
 s.querySelector('#dailyReportRefresh').onclick=()=>{const d=keyOf(new Date());ensureDate(d);renderDaily();renderDetail(d)};
 s.querySelector('#drToday').onclick=()=>{const d=keyOf(new Date());s.querySelector('#drDate').value=d;ensureDate(d);renderDetail(d)};
 s.querySelector('#drOpenDate').onclick=()=>{const d=s.querySelector('#drDate').value;if(d){ensureDate(d);renderDaily();renderDetail(d)}};
 s.onclick=e=>{const o=e.target.closest('[data-dr-open]');if(o){renderDetail(o.dataset.drOpen);return}const p=e.target.closest('[data-dr-print]');if(p)printReport(p.dataset.drPrint)};
}

function showOnly(id,button){
 document.querySelectorAll('.content > section').forEach(x=>x.classList.add('hidden'));
 document.querySelector(id)?.classList.remove('hidden');
 document.querySelectorAll('#nav button').forEach(x=>x.classList.remove('active'));
 button?.classList.add('active');
}

function openDaily(){
 catchUp();ensureDailyUI();showOnly('#view-daily-reports',dailyBtn());
 const d=keyOf(new Date()),inp=document.querySelector('#drDate');if(inp)inp.value=d;
 renderDaily();renderDetail(d);
}

function renderDaily(){
 ensureDailyUI();const box=document.querySelector('#dailyReportsList');if(!box)return;const all=reports().slice(0,31);
 box.innerHTML=all.length?all.map(x=>`<div class="dr-row"><strong>${esc(new Date(x.date+'T12:00:00').toLocaleDateString('pl-PL'))}</strong><span class="dr-stat">⚠ ${x.offences||0}</span><span class="dr-stat">📚 ${x.tasks||0}</span><span class="dr-stat">⚖ ${x.events||0}</span><span class="dr-stat">📝 ${x.notes||0}</span><span class="dr-stat">🕐 ${x.hourly||0}</span><span class="dr-stat">☑ ${x.checklist_pct||0}%</span><span><button class="btn" data-dr-open="${x.date}">Otwórz</button> <button class="btn" data-dr-print="${x.date}">PDF</button></span></div>`).join(''):'<div class="empty">Brak raportów.</div>';
}

function renderDetail(date){
 const x=reports().find(r=>r.date===date),box=document.querySelector('#dailyReportDetail');if(!x||!box)return;
 const label=new Date(date+'T12:00:00').toLocaleDateString('pl-PL',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
 box.innerHTML=`<div class="panel"><h3>Raport dzienny — ${esc(label)}</h3><div class="dr-pills"><span class="dr-pill">⚠ Przewinienia: ${x.offences||0}</span><span class="dr-pill">📚 Zadania: ${x.tasks||0}</span><span class="dr-pill">⚖/⊘ Wpisy: ${x.events||0}</span><span class="dr-pill">📝 Uwagi: ${x.notes||0}</span><span class="dr-pill">🕐 Dziennik: ${x.hourly||0}</span><span class="dr-pill">☑ Checklista: ${x.checklist_pct||0}%</span><span class="dr-pill">★ Punkty: ${x.points||0}</span></div><p><strong>Plan dnia:</strong><br>${esc(x.plan||'—')}</p><p><strong>Podsumowanie dnia:</strong><br>${esc(x.summary||'—')}</p><p><strong>Status dnia:</strong> ${x.day_done?'✓ zakończony':'otwarty'}</p><button class="btn primary" data-dr-print="${date}">📄 Zapisz jako PDF</button></div>`;
}

function openMonthly(){
 ensureStyles();const view=document.querySelector('#view-reports'),box=document.querySelector('#reportsView');if(!view||!box)return;
 showOnly('#view-reports',monthlyBtn());
 const panel=view.querySelector('.panel > h3');if(panel)panel.textContent='Raport miesięczny';
 const now=new Date();const ev=read(EVENTS,[]).filter(e=>{const d=new Date(e.start||e.created_at);return !Number.isNaN(d.getTime())&&d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()});
 const types=[['spanking','Spanking'],['kara','Kary'],['szlaban','Szlabany'],['nagroda','Nagrody']];
 const points=ev.reduce((s,e)=>s+(Number(e.points_delta!=null?e.points_delta:(e.points!=null?e.points:0))||0),0);
 box.innerHTML=`<div><h3 style="margin-bottom:6px">${esc(now.toLocaleDateString('pl-PL',{month:'long',year:'numeric'}))}</h3><small style="color:#98a2b3">Podsumowanie bieżącego miesiąca.</small><div class="mr-grid">${types.map(([k,l])=>`<div class="mr-card">${l}<strong>${ev.filter(e=>String(e.type||'').toLowerCase()===k).length}</strong></div>`).join('')}<div class="mr-card">Punkty<strong>${points}</strong></div></div></div>`;
}

function printReport(date){
 const x=reports().find(r=>r.date===date);if(!x)return;const q=window.open('','_blank');if(!q)return;
 const label=new Date(date+'T12:00:00').toLocaleDateString('pl-PL',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
 q.document.write(`<!doctype html><meta charset="utf-8"><title>Raport dzienny ${esc(date)}</title><style>@page{size:A4;margin:15mm}body{font-family:Arial;font-size:12px}.box{border:1px solid #bbb;padding:9px;margin:7px 0}</style><h1>Raport dzienny</h1><p>${esc(label)}</p><div class="box">⚠ Przewinienia: <b>${x.offences||0}</b> • 📚 Zadania: <b>${x.tasks||0}</b> • ⚖/⊘ Wpisy: <b>${x.events||0}</b> • 📝 Uwagi: <b>${x.notes||0}</b> • 🕐 Dziennik: <b>${x.hourly||0}</b> • ☑ Checklista: <b>${x.checklist_pct||0}%</b> • ★ Punkty: <b>${x.points||0}</b></div><div class="box"><b>Plan dnia</b><br>${esc(x.plan||'—')}</div><div class="box"><b>Podsumowanie dnia</b><br>${esc(x.summary||'—')}</div><script>onload=()=>setTimeout(()=>print(),200)<\/script>`);q.document.close();
}

function install(){
 catchUp();ensureDailyUI();
 document.addEventListener('click',e=>{
  const b=e.target.closest?.('#nav button');if(!b)return;
  if(b.textContent.includes('Raport dzienny')){e.preventDefault();e.stopImmediatePropagation();openDaily();return}
  if(b.textContent.includes('Raport miesięczny')){e.preventDefault();e.stopImmediatePropagation();openMonthly()}
 },true);
 ['bdsm-day-agenda-updated','bdsm-offences-updated','bdsm-education-tasks-updated','bdsm-written-notes-updated','bdsm-hourly-reports-updated','bdsm-sync-complete'].forEach(ev=>document.addEventListener(ev,()=>{ensureDate(keyOf(new Date()));renderDaily()}));
 window.addEventListener('focus',()=>{catchUp();renderDaily()});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){catchUp();renderDaily()}});
 setInterval(()=>{catchUp();renderDaily()},3600000);
 window.bdsmDailyReports={list:reports,refresh:()=>{catchUp();renderDaily()},open:openDaily,openDate:renderDetail,print:printReport,openMonthly};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
