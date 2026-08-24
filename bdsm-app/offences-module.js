(()=>{
  if(window.__bdsmOffencesInstalled)return;
  window.__bdsmOffencesInstalled=true;
  const KEY='bdsm-app-offences-v1';
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(_){return[]}};
  const write=v=>localStorage.setItem(KEY,JSON.stringify(v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const nowLocal=()=>{const d=new Date(),z=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`};
  function uid(){return 'PRZ-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase()}
  function ensureUI(){
    const nav=document.querySelector('#nav'),content=document.querySelector('.content');
    if(!nav||!content)return;
    if(!document.querySelector('#offencesNav')){
      const b=document.createElement('button');b.id='offencesNav';b.type='button';b.dataset.view='offences';b.innerHTML='⚠ Przewinienia';
      const history=[...nav.querySelectorAll('button')].find(x=>x.dataset.view==='history');
      if(history)nav.insertBefore(b,history);else nav.appendChild(b);
      b.addEventListener('click',e=>{e.preventDefault();openView()});
    }
    if(!document.querySelector('#view-offences')){
      const s=document.createElement('section');s.id='view-offences';s.className='hidden';
      s.innerHTML=`<div class="panel"><h3>⚠ Przewinienia</h3><p style="color:#98a2b3;font-size:12px;margin-top:-6px">Rejestr przewinień gotowy do późniejszego powiązania z punktami, karami, szlabanami i raportami. Powiązania nie uruchamiają konsekwencji automatycznie.</p><div class="form-grid"><div class="field"><label>Nazwa / tytuł</label><input id="offTitle" placeholder="np. Spóźnienie"></div><div class="field"><label>Kategoria</label><select id="offCategory"><option>zasady</option><option>obowiązki</option><option>komunikacja</option><option>punktualność</option><option>inne</option></select></div><div class="field"><label>Waga</label><select id="offSeverity"><option value="lekka">Lekka</option><option value="średnia">Średnia</option><option value="poważna">Poważna</option></select></div><div class="field"><label>Status</label><select id="offStatus"><option value="otwarte">Otwarte</option><option value="wyjaśnione">Wyjaśnione</option><option value="zamknięte">Zamknięte</option><option value="anulowane">Anulowane</option></select></div><div class="field"><label>Data i godzina</label><input id="offWhen" type="datetime-local"></div><div class="field"><label>Powiązane ID (opcjonalnie)</label><input id="offLinks" placeholder="np. EVT-123, KARA-7"></div><div class="field span3"><label>Opis</label><textarea id="offDesc" placeholder="Krótki opis sytuacji"></textarea></div></div><div class="actions"><button class="btn primary" id="offSave">Dodaj przewinienie</button></div><div id="offStats" style="margin:14px 0 6px"></div><div id="offTable"></div></div>`;
      content.appendChild(s);
      s.querySelector('#offWhen').value=nowLocal();
      s.querySelector('#offSave').addEventListener('click',saveOffence);
      s.addEventListener('click',e=>{const x=e.target.closest('[data-off-close]');if(x)closeOffence(x.dataset.offClose);const d=e.target.closest('[data-off-delete]');if(d)deleteOffence(d.dataset.offDelete)});
    }
  }
  function openView(){
    ensureUI();
    document.querySelectorAll('.content > section').forEach(s=>s.classList.add('hidden'));
    const s=document.querySelector('#view-offences');if(s)s.classList.remove('hidden');
    document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));
    const b=document.querySelector('#offencesNav');if(b)b.classList.add('active');
    render();
  }
  function saveOffence(){
    const title=document.querySelector('#offTitle')?.value.trim();if(!title)return;
    const item={
      offence_id:uid(),
      title,
      category:document.querySelector('#offCategory')?.value||'inne',
      severity:document.querySelector('#offSeverity')?.value||'lekka',
      status:document.querySelector('#offStatus')?.value||'otwarte',
      occurred_at:document.querySelector('#offWhen')?.value?new Date(document.querySelector('#offWhen').value).toISOString():new Date().toISOString(),
      description:document.querySelector('#offDesc')?.value.trim()||'',
      linked_ids:(document.querySelector('#offLinks')?.value||'').split(',').map(x=>x.trim()).filter(Boolean),
      created_at:new Date().toISOString(),updated_at:new Date().toISOString()
    };
    const data=read();data.unshift(item);write(data);
    document.querySelector('#offTitle').value='';document.querySelector('#offDesc').value='';document.querySelector('#offLinks').value='';document.querySelector('#offWhen').value=nowLocal();render();
    document.dispatchEvent(new CustomEvent('bdsm-offences-updated',{detail:{offence_id:item.offence_id}}));
  }
  function closeOffence(id){const data=read(),x=data.find(v=>v.offence_id===id);if(x){x.status='zamknięte';x.updated_at=new Date().toISOString();write(data);render()}}
  function deleteOffence(id){write(read().filter(x=>x.offence_id!==id));render()}
  function render(){
    const data=read(),table=document.querySelector('#offTable'),stats=document.querySelector('#offStats');if(!table)return;
    const open=data.filter(x=>x.status==='otwarte').length;
    if(stats)stats.innerHTML=`Łącznie: <strong>${data.length}</strong> &nbsp; Otwarte: <strong>${open}</strong> &nbsp; Zamknięte: <strong>${data.filter(x=>x.status==='zamknięte').length}</strong>`;
    if(!data.length){table.innerHTML='<div class="empty">Brak przewinień.</div>';return;}
    table.innerHTML=`<div style="overflow:auto"><table class="table"><thead><tr><th>ID</th><th>Data</th><th>Przewinienie</th><th>Kategoria</th><th>Waga</th><th>Status</th><th>Powiązania</th><th>Akcja</th></tr></thead><tbody>${data.map(x=>`<tr><td style="font-family:monospace;font-size:11px">${esc(x.offence_id)}</td><td>${new Date(x.occurred_at).toLocaleString('pl-PL')}</td><td><strong>${esc(x.title)}</strong>${x.description?`<div style="color:#98a2b3;margin-top:3px">${esc(x.description)}</div>`:''}</td><td>${esc(x.category)}</td><td>${esc(x.severity)}</td><td>${esc(x.status)}</td><td>${x.linked_ids?.length?x.linked_ids.map(esc).join(', '):'—'}</td><td>${x.status!=='zamknięte'?`<button class="btn" data-off-close="${esc(x.offence_id)}">Zamknij</button>`:''} <button class="btn danger" data-off-delete="${esc(x.offence_id)}">Usuń</button></td></tr>`).join('')}</tbody></table></div>`;
  }
  function install(){ensureUI();render();window.bdsmOffences={list:read,open:openView};}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
