(()=>{
if(window.__bdsmMonthlyReportChartsInstalled)return;
window.__bdsmMonthlyReportChartsInstalled=true;
const EVENTS='bdsm-app-events-v3',DAILY='bdsm-app-daily-reports-v1',OFF='bdsm-app-offences-v1',TASKS='bdsm-app-education-tasks-v1',NOTES='bdsm-app-written-notes-v1',HOURS='bdsm-app-hourly-reports-v1';
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const pad=n=>String(n).padStart(2,'0');
const monthKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}`;
const dayKey=v=>{if(!v)return'';const d=new Date(v);return Number.isNaN(d.getTime())?'':`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const inMonth=(v,m)=>dayKey(v).slice(0,7)===m;
const pointOf=e=>Number(e.points_delta!=null?e.points_delta:(e.points!=null?e.points:0))||0;
function series(m){
 const [y,mo]=m.split('-').map(Number),days=new Date(y,mo,0).getDate();
 const ev=read(EVENTS,[]).filter(e=>inMonth(e.start||e.created_at,m));
 const dr=read(DAILY,[]).filter(r=>String(r.date||'').slice(0,7)===m);
 const off=read(OFF,[]).filter(x=>inMonth(x.occurred_at||x.created_at,m));
 const tasks=read(TASKS,[]).filter(x=>inMonth(x.due_at||x.created_at,m));
 const notes=read(NOTES,[]).filter(x=>inMonth(x.issued_at||x.date||x.created_at,m));
 const hours=read(HOURS,[]).filter(x=>String(x.date||'').slice(0,7)===m);
 const rows=[];
 for(let day=1;day<=days;day++){
  const key=`${m}-${pad(day)}`;
  const de=ev.filter(e=>dayKey(e.start||e.created_at)===key),rpt=dr.find(r=>r.date===key);
  const roff=off.filter(x=>dayKey(x.occurred_at||x.created_at)===key).length;
  const rtasks=tasks.filter(x=>dayKey(x.due_at||x.created_at)===key).length;
  const rnotes=notes.filter(x=>dayKey(x.issued_at||x.date||x.created_at)===key).length;
  const rhours=hours.filter(x=>String(x.date||'')===key).length;
  rows.push({day,date:key,points:de.reduce((s,e)=>s+pointOf(e),0),events:rpt?.events??de.length,offences:rpt?.offences??roff,tasks:rpt?.tasks??rtasks,notes:rpt?.notes??rnotes,hourly:rpt?.hourly??rhours,checklist:rpt?.checklist_pct??0,done:!!rpt?.day_done});
 }
 return rows;
}
function svgChart(data,key,title){
 const W=760,H=220,p=34,vals=data.map(x=>Number(x[key])||0),min=Math.min(0,...vals),max=Math.max(1,...vals),range=max-min||1;
 const x=i=>p+(i*(W-p*2)/Math.max(1,data.length-1)),y=v=>H-p-((v-min)/range)*(H-p*2),pts=data.map((d,i)=>`${x(i)},${y(d[key])}`).join(' '),zero=y(0);
 const labels=data.map((d,i)=>((i===0||i===data.length-1||((i+1)%5===0))?`<text x="${x(i)}" y="${H-9}" text-anchor="middle" fill="#98a2b3" font-size="10">${d.day}</text>`:'')).join('');
 return `<div class="mrc-card"><div class="mrc-title">${title}</div><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}"><line x1="${p}" y1="${zero}" x2="${W-p}" y2="${zero}" stroke="#354052"/><polyline fill="none" stroke="currentColor" stroke-width="3" points="${pts}"/>${data.map((d,i)=>`<circle cx="${x(i)}" cy="${y(d[key])}" r="3" fill="currentColor"><title>Dzień ${d.day}: ${d[key]}</title></circle>`).join('')}${labels}</svg></div>`;
}
function totalEntries(r){return (r.events||0)+(r.offences||0)+(r.tasks||0)+(r.notes||0)+(r.hourly||0)}
function weekly(data){const out=[];for(let i=0;i<data.length;i+=7){const chunk=data.slice(i,i+7);out.push({week:out.length+1,from:chunk[0]?.day,to:chunk.at(-1)?.day,points:chunk.reduce((s,r)=>s+r.points,0),entries:chunk.reduce((s,r)=>s+totalEntries(r),0),check:chunk.length?Math.round(chunk.reduce((s,r)=>s+r.checklist,0)/chunk.length):0})}return out}
function summaryHtml(data){
 const active=data.filter(r=>totalEntries(r)>0||r.points!==0||r.checklist>0),best=[...data].sort((a,b)=>b.points-a.points)[0],worst=[...data].sort((a,b)=>a.points-b.points)[0],weeks=weekly(data);
 return `<div class="mrc-summary"><div><small>Dni z aktywnością</small><strong>${active.length}</strong></div><div><small>Najlepszy dzień</small><strong>${best?best.day+' ('+best.points+' pkt)':'—'}</strong></div><div><small>Najsłabszy dzień</small><strong>${worst?worst.day+' ('+worst.points+' pkt)':'—'}</strong></div><div><small>Łącznie wpisów</small><strong>${data.reduce((s,r)=>s+totalEntries(r),0)}</strong></div></div><div class="mrc-week"><h4>Podsumowanie tygodni</h4><div class="mrc-week-grid">${weeks.map(w=>`<div><b>Tydzień ${w.week}</b><span>${w.from}–${w.to} dzień</span><span>${w.points} pkt • ${w.entries} wpisów • checklista ${w.check}%</span></div>`).join('')}</div></div>`;
}
function tableHtml(data){return `<div class="mr-section mrc-table-wrap"><h4>Pełna tabela dni</h4><div style="overflow:auto"><table class="mr-table"><thead><tr><th>Dzień</th><th>Wpisy</th><th>Przewinienia</th><th>Zadania</th><th>Uwagi</th><th>Dziennik</th><th>Checklista</th><th>Punkty</th><th>Status</th></tr></thead><tbody>${data.map(r=>`<tr><td>${r.day}</td><td>${r.events}</td><td>${r.offences}</td><td>${r.tasks}</td><td>${r.notes}</td><td>${r.hourly}</td><td>${r.checklist}%</td><td>${r.points}</td><td>${r.done?'✓ zakończony':'otwarty'}</td></tr>`).join('')}</tbody></table></div></div>`}
function printFullMonth(m){
 const data=series(m),[y,mo]=m.split('-').map(Number),label=new Date(y,mo-1,1).toLocaleDateString('pl-PL',{month:'long',year:'numeric'}),q=window.open('','_blank');if(!q)return;
 const weeks=weekly(data),sum=k=>data.reduce((s,r)=>s+(Number(r[k])||0),0),entries=data.reduce((s,r)=>s+totalEntries(r),0);
 q.document.write(`<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>Raport miesięczny ${esc(m)}</title><style>body{font-family:Arial,sans-serif;color:#111;padding:28px}h1,h2{margin-bottom:6px}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:18px 0}.card{border:1px solid #bbb;padding:10px;border-radius:8px}.card b{display:block;font-size:20px;margin-top:4px}table{width:100%;border-collapse:collapse;margin-top:14px;font-size:11px}th,td{border:1px solid #ccc;padding:6px;text-align:left}th{background:#eee}.weeks{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:12px 0}.week{border:1px solid #ccc;padding:8px;border-radius:6px}@media print{body{padding:0}.cards{grid-template-columns:repeat(4,1fr)}}</style></head><body><h1>Raport miesięczny</h1><h2>${esc(label)}</h2><div class="cards"><div class="card">Łącznie wpisów<b>${entries}</b></div><div class="card">Przewinienia<b>${sum('offences')}</b></div><div class="card">Zadania<b>${sum('tasks')}</b></div><div class="card">Uwagi<b>${sum('notes')}</b></div><div class="card">Dziennik<b>${sum('hourly')}</b></div><div class="card">Punkty<b>${sum('points')}</b></div><div class="card">Śr. checklista<b>${Math.round(sum('checklist')/Math.max(1,data.length))}%</b></div><div class="card">Dni zakończone<b>${data.filter(r=>r.done).length}</b></div></div><h2>Tygodnie</h2><div class="weeks">${weeks.map(w=>`<div class="week"><b>Tydzień ${w.week}</b><br>${w.from}–${w.to} dzień<br>${w.points} pkt • ${w.entries} wpisów • checklista ${w.check}%</div>`).join('')}</div><h2>Dzień po dniu</h2><table><thead><tr><th>Dzień</th><th>Wpisy</th><th>Przew.</th><th>Zadania</th><th>Uwagi</th><th>Dziennik</th><th>Checklista</th><th>Punkty</th><th>Status</th></tr></thead><tbody>${data.map(r=>`<tr><td>${r.day}</td><td>${r.events}</td><td>${r.offences}</td><td>${r.tasks}</td><td>${r.notes}</td><td>${r.hourly}</td><td>${r.checklist}%</td><td>${r.points}</td><td>${r.done?'zakończony':'otwarty'}</td></tr>`).join('')}</tbody></table><script>onload=()=>setTimeout(()=>print(),250)<\/script></body></html>`);q.document.close();
}
function inject(){
 const box=document.querySelector('#reportsView');if(!box||!document.querySelector('#mrMonth'))return;
 const m=document.querySelector('#mrMonth')?.value||monthKey(new Date()),data=series(m);
 let host=document.querySelector('#monthlyTrendCharts');if(!host){host=document.createElement('div');host.id='monthlyTrendCharts';const table=box.querySelector('.mr-section');box.insertBefore(host,table||null)}
 host.innerHTML=summaryHtml(data)+`<div class="mrc-grid">${svgChart(data,'points','★ Trend punktów — dzień po dniu')}${svgChart(data,'events','▦ Wydarzenia — dzień po dniu')}</div>`+tableHtml(data);
 const pdf=document.querySelector('#mrPdf');if(pdf&&!pdf.dataset.fullPdf){pdf.dataset.fullPdf='1';pdf.onclick=e=>{e.preventDefault();e.stopPropagation();printFullMonth(document.querySelector('#mrMonth')?.value||m)}}
}
function styles(){if(document.querySelector('#monthlyTrendChartStyles'))return;const s=document.createElement('style');s.id='monthlyTrendChartStyles';s.textContent='.mrc-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}.mrc-card{background:#0c121c;border:1px solid #252d3c;border-radius:12px;padding:14px;color:#b56cff}.mrc-title{color:#f4f6fb;font-weight:700;margin-bottom:8px}.mrc-card svg{width:100%;height:auto;display:block}.mrc-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}.mrc-summary>div,.mrc-week-grid>div{background:#0c121c;border:1px solid #252d3c;border-radius:10px;padding:12px}.mrc-summary small,.mrc-week-grid span{display:block;color:#98a2b3;font-size:11px}.mrc-summary strong{display:block;font-size:18px;margin-top:5px}.mrc-week-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.mrc-table-wrap{margin-top:16px}@media(max-width:1000px){.mrc-grid,.mrc-week-grid{grid-template-columns:1fr}.mrc-summary{grid-template-columns:repeat(2,1fr)}}';document.head.appendChild(s)}
function install(){styles();document.addEventListener('click',e=>{const b=e.target.closest?.('#nav button');if(b&&b.textContent.includes('Raport miesięczny'))setTimeout(inject,20);if(e.target.closest?.('#mrOpen,#mrCurrent'))setTimeout(inject,20)},true);document.addEventListener('change',e=>{if(e.target?.id==='mrMonth')setTimeout(inject,20)},true);const obs=new MutationObserver(()=>{if(document.querySelector('#mrMonth'))setTimeout(inject,0)});const box=document.querySelector('#reportsView');if(box)obs.observe(box,{childList:true,subtree:true});setTimeout(inject,300)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();