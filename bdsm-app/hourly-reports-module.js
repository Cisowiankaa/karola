(()=>{
  if(window.__bdsmHourlyReportsInstalled)return;
  window.__bdsmHourlyReportsInstalled=true;
  const KEY='bdsm-app-hourly-reports-v1';
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(_){return[]}};
  const write=v=>localStorage.setItem(KEY,JSON.stringify(v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const uid=()=> 'RPT-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
  const isoDate=d=>{const x=new Date(d),z=n=>String(n).padStart(2,'0');return `${x.getFullYear()}-${z(x.getMonth()+1)}-${z(x.getDate())}`};
  const today=()=>isoDate(new Date());
  const currentMonth=()=>today().slice(0,7);
  const fmtDate=v=>{if(!v)return '—';const d=new Date(v+'T12:00:00');return Number.isNaN(d.getTime())?v:d.toLocaleDateString('pl-PL')};
  const fmtTime=v=>String(v||'').slice(0,5);

  function ensureUI(){
    const nav=document.querySelector('#nav'),content=document.querySelector('.content');if(!nav||!content)return;
    if(!document.querySelector('#hourlyReportsNav')){
      const b=document.createElement('button');b.id='hourlyReportsNav';b.type='button';b.dataset.view='hourly-reports';b.innerHTML='🕐 Dziennik godzinowy';
      const reports=[...nav.querySelectorAll('button')].find(x=>x.dataset.view==='reports');
      if(reports)nav.insertBefore(b,reports);else nav.appendChild(b);
      b.addEventListener('click',e=>{e.preventDefault();openView()});
    }
    if(!document.querySelector('#view-hourly-reports')){
      const s=document.createElement('section');s.id='view-hourly-reports';s.className='hidden';
      s.innerHTML=`<div class="panel"><h3>🕐 Dziennik godzinowy</h3><p style="color:#98a2b3;font-size:12px;margin-top:-6px">Zapisuj, co było robione w ciągu dnia. Wpisy można prowadzić godzina po godzinie, a cały miesiąc przygotować jako raport PDF przez systemowy zapis/druk do PDF.</p>
      <div class="form-grid">
        <div class="field"><label>Data</label><input id="hrDate" type="date"></div>
        <div class="field"><label>Od</label><input id="hrFrom" type="time"></div>
        <div class="field"><label>Do</label><input id="hrTo" type="time"></div>
        <div class="field span2"><label>Co było robione</label><input id="hrTitle" placeholder="np. praca, nauka, obowiązki, odpoczynek"></div>
        <div class="field"><label>Status</label><select id="hrStatus"><option value="wykonane">Wykonane</option><option value="częściowo">Częściowo</option><option value="niewykonane">Niewykonane</option><option value="przerwa">Przerwa</option></select></div>
        <div class="field span3"><label>Notatka</label><textarea id="hrNote" placeholder="Szczegóły, efekt, uwagi"></textarea></div>
      </div>
      <div class="actions"><button class="btn" id="hrAddNext">Dodaj następną godzinę</button><button class="btn primary" id="hrSave">Zapisz wpis</button></div>
      <div style="display:flex;gap:10px;align-items:end;flex-wrap:wrap;margin:18px 0 10px"><div class="field"><label>Miesiąc raportu</label><input id="hrMonth" type="month"></div><button class="btn" id="hrPrintMonth">📄 Zapisz miesiąc jako PDF</button></div>
      <div id="hrStats" style="margin:12px 0"></div><div id="hrTable"></div></div>`;
      content.appendChild(s);
      const now=new Date(),h=String(now.getHours()).padStart(2,'0');
      s.querySelector('#hrDate').value=today();s.querySelector('#hrFrom').value=`${h}:00`;s.querySelector('#hrTo').value=`${String((now.getHours()+1)%24).padStart(2,'0')}:00`;s.querySelector('#hrMonth').value=currentMonth();
      s.querySelector('#hrSave').addEventListener('click',saveEntry);
      s.querySelector('#hrAddNext').addEventListener('click',nextHour);
      s.querySelector('#hrPrintMonth').addEventListener('click',printMonth);
      s.querySelector('#hrDate').addEventListener('change',render);
      s.addEventListener('click',e=>{const del=e.target.closest('[data-hr-delete]');if(del)deleteEntry(del.dataset.hrDelete)});
    }
  }
  function openView(){ensureUI();document.querySelectorAll('.content > section').forEach(s=>s.classList.add('hidden'));document.querySelector('#view-hourly-reports')?.classList.remove('hidden');document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));document.querySelector('#hourlyReportsNav')?.classList.add('active');render()}
  function saveEntry(){
    const date=document.querySelector('#hrDate')?.value,title=document.querySelector('#hrTitle')?.value.trim(),from=document.querySelector('#hrFrom')?.value,to=document.querySelector('#hrTo')?.value;if(!date||!from||!to||!title)return;
    const item={report_id:uid(),date,from,to,title,status:document.querySelector('#hrStatus').value,note:document.querySelector('#hrNote').value.trim(),created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
    const data=read();data.push(item);data.sort((a,b)=>(a.date+a.from).localeCompare(b.date+b.from));write(data);document.querySelector('#hrTitle').value='';document.querySelector('#hrNote').value='';nextHour(false);render();document.dispatchEvent(new Event('bdsm-hourly-reports-updated'));
  }
  function nextHour(focus=true){const from=document.querySelector('#hrFrom'),to=document.querySelector('#hrTo');if(!from||!to)return;const [h,m]=String(to.value||from.value||'00:00').split(':').map(Number);from.value=`${String(h).padStart(2,'0')}:${String(m||0).padStart(2,'0')}`;to.value=`${String((h+1)%24).padStart(2,'0')}:${String(m||0).padStart(2,'0')}`;if(focus)document.querySelector('#hrTitle')?.focus()}
  function deleteEntry(id){write(read().filter(x=>x.report_id!==id));render()}
  function render(){
    const date=document.querySelector('#hrDate')?.value||today(),data=read().filter(x=>x.date===date).sort((a,b)=>a.from.localeCompare(b.from)),box=document.querySelector('#hrTable'),stats=document.querySelector('#hrStats');if(!box)return;
    const done=data.filter(x=>x.status==='wykonane').length;
    if(stats)stats.innerHTML=`${fmtDate(date)} — wpisów: <strong>${data.length}</strong> &nbsp; wykonane: <strong>${done}</strong>`;
    if(!data.length){box.innerHTML='<div class="empty">Brak wpisów dla wybranego dnia.</div>';return}
    box.innerHTML=`<div style="overflow:auto"><table class="table"><thead><tr><th>Godzina</th><th>Aktywność</th><th>Status</th><th>Notatka</th><th></th></tr></thead><tbody>${data.map(x=>`<tr><td><strong>${esc(fmtTime(x.from))}–${esc(fmtTime(x.to))}</strong></td><td>${esc(x.title)}</td><td>${esc(x.status)}</td><td>${esc(x.note||'—')}</td><td><button class="btn danger" data-hr-delete="${esc(x.report_id)}">Usuń</button></td></tr>`).join('')}</tbody></table></div>`;
  }
  function printMonth(){
    const month=document.querySelector('#hrMonth')?.value||currentMonth(),data=read().filter(x=>x.date.startsWith(month)).sort((a,b)=>(a.date+a.from).localeCompare(b.date+b.from));
    if(!data.length)return alert('Brak wpisów w wybranym miesiącu.');
    const by={};data.forEach(x=>(by[x.date]??=[]).push(x));
    const total=data.length,done=data.filter(x=>x.status==='wykonane').length;
    const days=Object.keys(by).sort().map(date=>`<section><h2>${esc(fmtDate(date))}</h2><table><thead><tr><th>Godzina</th><th>Aktywność</th><th>Status</th><th>Notatka</th></tr></thead><tbody>${by[date].map(x=>`<tr><td>${esc(fmtTime(x.from))}–${esc(fmtTime(x.to))}</td><td>${esc(x.title)}</td><td>${esc(x.status)}</td><td>${esc(x.note||'')}</td></tr>`).join('')}</tbody></table></section>`).join('');
    const w=window.open('','_blank');if(!w)return alert('Przeglądarka zablokowała okno raportu. Zezwól na wyskakujące okna dla tej aplikacji.');
    w.document.write(`<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>Raport miesięczny ${esc(month)}</title><style>@page{size:A4;margin:14mm}body{font-family:Arial,sans-serif;color:#111;font-size:11px}h1{font-size:20px;margin:0 0 6px}h2{font-size:14px;margin:20px 0 6px;border-bottom:1px solid #bbb;padding-bottom:4px}.meta{color:#555;margin-bottom:16px}table{width:100%;border-collapse:collapse;margin-bottom:10px;page-break-inside:auto}tr{page-break-inside:avoid}th,td{border:1px solid #ccc;padding:6px;text-align:left;vertical-align:top}th{background:#f2f2f2}section{page-break-inside:auto}</style></head><body><h1>Raport miesięczny — dziennik godzinowy</h1><div class="meta">Miesiąc: ${esc(month)} • wpisów: ${total} • wykonane: ${done} • wygenerowano: ${new Date().toLocaleString('pl-PL')}</div>${days}<script>window.onload=()=>setTimeout(()=>window.print(),250)<\/script></body></html>`);w.document.close();
  }
  function install(){ensureUI();render();window.bdsmHourlyReports={list:read,open:openView,printMonth};}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
