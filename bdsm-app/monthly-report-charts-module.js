(()=>{
if(window.__bdsmMonthlyReportChartsInstalled)return;
window.__bdsmMonthlyReportChartsInstalled=true;
const EVENTS='bdsm-app-events-v3',DAILY='bdsm-app-daily-reports-v1';
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
const pad=n=>String(n).padStart(2,'0');
const monthKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}`;
const inMonth=(v,m)=>{if(!v)return false;const d=new Date(v);return !Number.isNaN(d.getTime())&&monthKey(d)===m};
const pointOf=e=>Number(e.points_delta!=null?e.points_delta:(e.points!=null?e.points:0))||0;
function series(m){
 const [y,mo]=m.split('-').map(Number),days=new Date(y,mo,0).getDate();
 const ev=read(EVENTS,[]).filter(e=>inMonth(e.start||e.created_at,m));
 const dr=read(DAILY,[]).filter(r=>String(r.date||'').slice(0,7)===m);
 const rows=[];
 for(let day=1;day<=days;day++){
  const key=`${m}-${pad(day)}`;
  const de=ev.filter(e=>{const d=new Date(e.start||e.created_at);return !Number.isNaN(d.getTime())&&`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`===key});
  const rpt=dr.find(r=>r.date===key);
  rows.push({day,points:de.reduce((s,e)=>s+pointOf(e),0),entries:rpt?((rpt.events||0)+(rpt.offences||0)+(rpt.tasks||0)+(rpt.notes||0)+(rpt.hourly||0)):de.length});
 }
 return rows;
}
function svgChart(data,key,title){
 const W=760,H=220,p=34,vals=data.map(x=>Number(x[key])||0),min=Math.min(0,...vals),max=Math.max(1,...vals),range=max-min||1;
 const x=i=>p+(i*(W-p*2)/Math.max(1,data.length-1)),y=v=>H-p-((v-min)/range)*(H-p*2);
 const pts=data.map((d,i)=>`${x(i)},${y(d[key])}`).join(' ');
 const zero=y(0);
 const labels=data.filter((_,i)=>i===0||i===data.length-1||((i+1)%5===0)).map((d,i)=>{const idx=data.indexOf(d);return `<text x="${x(idx)}" y="${H-9}" text-anchor="middle" fill="#98a2b3" font-size="10">${d.day}</text>`}).join('');
 return `<div class="mrc-card"><div class="mrc-title">${title}</div><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${title}"><line x1="${p}" y1="${zero}" x2="${W-p}" y2="${zero}" stroke="#354052" stroke-width="1"/><polyline fill="none" stroke="currentColor" stroke-width="3" points="${pts}"/>${data.map((d,i)=>`<circle cx="${x(i)}" cy="${y(d[key])}" r="3" fill="currentColor"><title>Dzień ${d.day}: ${d[key]}</title></circle>`).join('')}${labels}</svg></div>`;
}
function inject(){
 const box=document.querySelector('#reportsView');if(!box||!document.querySelector('#mrMonth'))return;
 const m=document.querySelector('#mrMonth')?.value||monthKey(new Date());
 let host=document.querySelector('#monthlyTrendCharts');if(!host){host=document.createElement('div');host.id='monthlyTrendCharts';host.className='mrc-grid';const table=box.querySelector('.mr-section');box.insertBefore(host,table||null)}
 const data=series(m);host.innerHTML=svgChart(data,'points','★ Trend punktów — dzień po dniu')+svgChart(data,'entries','▦ Liczba wpisów — dzień po dniu');
}
function styles(){if(document.querySelector('#monthlyTrendChartStyles'))return;const s=document.createElement('style');s.id='monthlyTrendChartStyles';s.textContent='.mrc-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}.mrc-card{background:#0c121c;border:1px solid #252d3c;border-radius:12px;padding:14px;color:#b56cff}.mrc-title{color:#f4f6fb;font-weight:700;margin-bottom:8px}.mrc-card svg{width:100%;height:auto;display:block}@media(max-width:1000px){.mrc-grid{grid-template-columns:1fr}}';document.head.appendChild(s)}
function install(){styles();document.addEventListener('click',e=>{const b=e.target.closest?.('#nav button');if(b&&b.textContent.includes('Raport miesięczny'))setTimeout(inject,0);if(e.target.closest?.('#mrOpen,#mrCurrent'))setTimeout(inject,0)},true);document.addEventListener('change',e=>{if(e.target?.id==='mrMonth')setTimeout(inject,0)},true);const obs=new MutationObserver(()=>{if(document.querySelector('#mrMonth')&&!document.querySelector('#monthlyTrendCharts'))inject()});const box=document.querySelector('#reportsView');if(box)obs.observe(box,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();