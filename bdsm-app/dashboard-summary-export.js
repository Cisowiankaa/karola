(()=>{
  if(window.__bdsmDashboardSummaryExportInstalled)return;
  window.__bdsmDashboardSummaryExportInstalled=true;
  const IDS=['dashboardTodayPanel','dashboardTomorrowPanel','dashboardUpcomingWeekPanel','dashboardWeekSummary','dashboardFourWeekTrend','dashboardMonthCompare','dashboardTrendInsights','dashboardActivityToday'];
  function installButton(){
    const dash=document.querySelector('#view-dashboard'); if(!dash)return;
    if(document.querySelector('#dashboardExportBtn'))return;
    const btn=document.createElement('button');
    btn.id='dashboardExportBtn'; btn.className='btn'; btn.textContent='🖨 Drukuj / PDF Dashboard';
    btn.style.margin='0 0 12px 0';
    btn.onclick=printDashboard;
    const first=dash.firstElementChild; if(first)dash.insertBefore(btn,first); else dash.appendChild(btn);
  }
  function printDashboard(){
    const sections=IDS.map(id=>document.getElementById(id)).filter(Boolean).map(x=>x.outerHTML).join('\n');
    const w=window.open('','_blank','width=1100,height=800'); if(!w)return;
    const now=new Date().toLocaleString('pl-PL');
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Dashboard BDSM — ${now}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{margin:0 0 6px}.meta{color:#666;margin-bottom:20px}.panel{border:1px solid #ccc;border-radius:10px;padding:14px;margin:0 0 14px;background:#fff}.btn{display:none!important}.dws-grid,.dfw-grid,.dmc-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.dws-kpi,.dfw-card,.dmc-card,.dti-row{border:1px solid #ddd;border-radius:8px;padding:10px}.dtp-row{display:grid;grid-template-columns:70px 30px 1fr;gap:8px;border-top:1px solid #eee;padding:8px 0}@media print{body{padding:0}.panel{break-inside:avoid}}</style></head><body><h1>Dashboard — raport podglądowy</h1><div class="meta">Wygenerowano: ${now}</div>${sections}<p class="meta">Raport ma charakter informacyjny. Nie uruchamia automatycznych konsekwencji ani zmian terminów.</p><script>window.onload=()=>setTimeout(()=>window.print(),150)<\/script></body></html>`);
    w.document.close();
  }
  const install=()=>{installButton();new MutationObserver(installButton).observe(document.body,{childList:true,subtree:true})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();