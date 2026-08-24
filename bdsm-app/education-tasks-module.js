(()=>{
  if(window.__bdsmEducationTasksInstalled)return;
  window.__bdsmEducationTasksInstalled=true;
  const KEY='bdsm-app-education-tasks-v1', OFF='bdsm-app-offences-v1', EVENTS='bdsm-app-events-v3';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(_){return d}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const uid=()=> 'EDU-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
  const nowLocal=()=>{const d=new Date(),z=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`};
  const fmt=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleString('pl-PL')};

  function statusFor(t){
    if(['wykonane','anulowane'].includes(t.status))return t.status;
    if(!t.due_at)return t.status||'do wykonania';
    const diff=new Date(t.due_at).getTime()-Date.now();
    if(diff<0)return 'po terminie';
    if(diff<=24*3600e3)return 'dzisiaj';
    if(diff<=3*24*3600e3)return 'wkrótce';
    return t.status||'do wykonania';
  }
  function badge(s){
    const m={
      'wykonane':['#12351f','#7ee2a8'], 'anulowane':['#202735','#c6cedb'], 'po terminie':['#3a171d','#ff929c'],
      'dzisiaj':['#3a2710','#ffd36f'], 'wkrótce':['#31254a','#d9b7ff'], 'do wykonania':['#12253a','#9bd0ff'], 'zaplanowane':['#12253a','#9bd0ff']
    }; const [bg,fg]=m[s]||m['do wykonania'];return `<span style="display:inline-block;padding:5px 8px;border-radius:8px;background:${bg};color:${fg};font-size:11px;font-weight:700">${esc(s)}</span>`;
  }
  function offenceOptions(){
    return read(OFF,[]).filter(x=>!['anulowane'].includes(x.status)).map(x=>`<option value="${esc(x.offence_id)}">${esc(x.offence_id)} — ${esc(x.title)}</option>`).join('');
  }
  function eventOptions(){
    return read(EVENTS,[]).filter(x=>['kara','szlaban'].includes(String(x.type||'').toLowerCase())).map(x=>`<option value="${esc(x.id||x.event_id||'')}">${esc(x.type)} — ${esc(x.title||x.id||x.event_id||'')}</option>`).join('');
  }
  function ensureUI(){
    const nav=document.querySelector('#nav'),content=document.querySelector('.content'); if(!nav||!content)return;
    if(!document.querySelector('#eduTasksNav')){
      const b=document.createElement('button');b.id='eduTasksNav';b.type='button';b.dataset.view='education-tasks';b.innerHTML='📚 Zadania edukacyjne';
      const term=document.querySelector('#deadlinesNav'); if(term&&term.nextSibling) nav.insertBefore(b,term.nextSibling); else nav.appendChild(b);
      b.addEventListener('click',e=>{e.preventDefault();openView()});
    }
    if(!document.querySelector('#view-education-tasks')){
      const s=document.createElement('section');s.id='view-education-tasks';s.className='hidden';
      s.innerHTML=`<div class="panel"><h3>📚 Zadania edukacyjne</h3><p style="color:#98a2b3;font-size:12px;margin-top:-6px">Dobrowolnie uzgodnione zadania dla dorosłych użytkowników. Zadanie może być powiązane z przewinieniem lub istniejącą karą/szlabaniem. Zaległość jest tylko oznaczana do ręcznego rozpatrzenia.</p>
      <div class="form-grid">
        <div class="field"><label>Rodzaj</label><select id="eduType"><option value="zadanie domowe">Zadanie domowe</option><option value="sprawdzian">Sprawdzian</option><option value="kartkówka">Kartkówka</option><option value="dyktando">Dyktando</option><option value="test online">Test online</option><option value="inne">Inne</option></select></div>
        <div class="field"><label>Tytuł</label><input id="eduTitle" placeholder="np. Dyktando — ó/u"></div>
        <div class="field"><label>Termin</label><input id="eduDue" type="datetime-local"></div>
        <div class="field"><label>Link / materiał</label><input id="eduUrl" type="url" placeholder="https://..."></div>
        <div class="field"><label>Powiązane przewinienie</label><select id="eduOffence"><option value="">— brak —</option>${offenceOptions()}</select></div>
        <div class="field"><label>Powiązana kara / szlaban</label><select id="eduEvent"><option value="">— brak —</option>${eventOptions()}</select></div>
        <div class="field"><label>Wynik</label><input id="eduScore" type="number" step="0.01" placeholder="np. 8"></div>
        <div class="field"><label>Maks. wynik</label><input id="eduMax" type="number" step="0.01" placeholder="np. 10"></div>
        <div class="field"><label>Status</label><select id="eduStatus"><option value="do wykonania">Do wykonania</option><option value="zaplanowane">Zaplanowane</option><option value="wykonane">Wykonane</option><option value="anulowane">Anulowane</option></select></div>
        <div class="field span3"><label>Opis / polecenie</label><textarea id="eduDesc" placeholder="Co dokładnie trzeba zrobić"></textarea></div>
        <div class="field span3"><label><input id="eduAgreed" type="checkbox" checked> Zadanie zostało uzgodnione</label></div>
      </div>
      <div class="actions"><button class="btn primary" id="eduSave">Dodaj zadanie</button></div>
      <div id="eduStats" style="margin:14px 0 6px"></div><div id="eduTable"></div></div>`;
      content.appendChild(s); s.querySelector('#eduDue').value=nowLocal(); s.querySelector('#eduSave').addEventListener('click',saveTask);
      s.addEventListener('click',e=>{
        const done=e.target.closest('[data-edu-done]'); if(done)updateStatus(done.dataset.eduDone,'wykonane');
        const cancel=e.target.closest('[data-edu-cancel]'); if(cancel)updateStatus(cancel.dataset.eduCancel,'anulowane');
        const del=e.target.closest('[data-edu-delete]'); if(del)deleteTask(del.dataset.eduDelete);
      });
    }
  }
  function refreshSelects(){
    const o=document.querySelector('#eduOffence'),ev=document.querySelector('#eduEvent'); if(o){const v=o.value;o.innerHTML='<option value="">— brak —</option>'+offenceOptions();o.value=v}
    if(ev){const v=ev.value;ev.innerHTML='<option value="">— brak —</option>'+eventOptions();ev.value=v}
  }
  function openView(){
    ensureUI();refreshSelects();document.querySelectorAll('.content > section').forEach(s=>s.classList.add('hidden'));document.querySelector('#view-education-tasks')?.classList.remove('hidden');document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));document.querySelector('#eduTasksNav')?.classList.add('active');render();
  }
  function saveTask(){
    const title=document.querySelector('#eduTitle')?.value.trim(); if(!title)return;
    if(!document.querySelector('#eduAgreed')?.checked)return alert('Zaznacz, że zadanie zostało uzgodnione.');
    const item={task_id:uid(),type:document.querySelector('#eduType').value,title,description:document.querySelector('#eduDesc').value.trim(),url:document.querySelector('#eduUrl').value.trim(),due_at:document.querySelector('#eduDue').value?new Date(document.querySelector('#eduDue').value).toISOString():null,status:document.querySelector('#eduStatus').value,score:document.querySelector('#eduScore').value===''?null:Number(document.querySelector('#eduScore').value),max_score:document.querySelector('#eduMax').value===''?null:Number(document.querySelector('#eduMax').value),offence_id:document.querySelector('#eduOffence').value||null,event_id:document.querySelector('#eduEvent').value||null,agreed:true,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
    const data=read(KEY,[]);data.unshift(item);write(KEY,data);['#eduTitle','#eduDesc','#eduUrl','#eduScore','#eduMax'].forEach(q=>{const x=document.querySelector(q);if(x)x.value=''});document.querySelector('#eduDue').value=nowLocal();render();document.dispatchEvent(new CustomEvent('bdsm-education-tasks-updated',{detail:{task_id:item.task_id}}));
  }
  function updateStatus(id,status){const d=read(KEY,[]),x=d.find(v=>v.task_id===id);if(x){x.status=status;x.updated_at=new Date().toISOString();write(KEY,d);render();document.dispatchEvent(new CustomEvent('bdsm-education-tasks-updated',{detail:{task_id:id}}))}}
  function deleteTask(id){write(KEY,read(KEY,[]).filter(x=>x.task_id!==id));render();document.dispatchEvent(new Event('bdsm-education-tasks-updated'))}
  function render(){
    const data=read(KEY,[]),box=document.querySelector('#eduTable'),stats=document.querySelector('#eduStats');if(!box)return;
    const overdue=data.filter(x=>statusFor(x)==='po terminie').length,today=data.filter(x=>statusFor(x)==='dzisiaj').length,pending=data.filter(x=>!['wykonane','anulowane'].includes(x.status)).length;
    if(stats)stats.innerHTML=`Aktywne: <strong>${pending}</strong> &nbsp; Dzisiaj: <strong>${today}</strong> &nbsp; Po terminie: <strong style="color:${overdue?'#ff929c':'inherit'}">${overdue}</strong> &nbsp; Łącznie: <strong>${data.length}</strong>`;
    if(!data.length){box.innerHTML='<div class="empty">Brak zadań edukacyjnych.</div>';return;}
    box.innerHTML=`<div style="overflow:auto"><table class="table"><thead><tr><th>Termin</th><th>Rodzaj</th><th>Zadanie</th><th>Status</th><th>Wynik</th><th>Powiązania</th><th>Materiał</th><th>Akcja</th></tr></thead><tbody>${data.map(x=>{const st=statusFor(x),score=x.score==null?'—':`${x.score}${x.max_score!=null?'/'+x.max_score:''}`;return `<tr><td>${fmt(x.due_at)}</td><td>${esc(x.type)}</td><td><strong>${esc(x.title)}</strong><div style="font-family:monospace;font-size:10px;color:#768197">${esc(x.task_id)}</div>${x.description?`<div style="color:#98a2b3;margin-top:3px">${esc(x.description)}</div>`:''}</td><td>${badge(st)}</td><td>${esc(score)}</td><td>${x.offence_id?`⚠ ${esc(x.offence_id)}`:''}${x.offence_id&&x.event_id?'<br>':''}${x.event_id?`🔗 ${esc(x.event_id)}`:''||'—'}</td><td>${x.url?`<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer" style="color:#9bd0ff">Otwórz</a>`:'—'}</td><td>${!['wykonane','anulowane'].includes(x.status)?`<button class="btn" data-edu-done="${esc(x.task_id)}">Wykonane</button> <button class="btn" data-edu-cancel="${esc(x.task_id)}">Anuluj</button>`:''} <button class="btn danger" data-edu-delete="${esc(x.task_id)}">Usuń</button></td></tr>`}).join('')}</tbody></table></div>`;
  }
  function install(){ensureUI();render();window.bdsmEducationTasks={list:()=>read(KEY,[]),open:openView};document.addEventListener('bdsm-offences-updated',refreshSelects);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
