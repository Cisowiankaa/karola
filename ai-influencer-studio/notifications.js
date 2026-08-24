(() => {
  const KEY='aii-notifications';
  const READ_KEY='aii-notifications-read';
  const PROJECTS_KEY='aii-projects';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const readList=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}};
  const writeList=v=>localStorage.setItem(KEY,JSON.stringify(v.slice(0,100)));
  const readSeen=()=>{try{return JSON.parse(localStorage.getItem(READ_KEY)||'{}')}catch{return{}}};
  const writeSeen=v=>localStorage.setItem(READ_KEY,JSON.stringify(v));
  const readProjects=()=>{try{return JSON.parse(localStorage.getItem(PROJECTS_KEY)||'[]')}catch{return[]}};
  const dayStart=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
  const diffDays=date=>Math.round((dayStart(new Date(date+'T12:00:00'))-dayStart(new Date()))/86400000);

  function addNotification(item){
    const list=readList();
    if(item.dedupeKey&&list.some(n=>n.dedupeKey===item.dedupeKey))return;
    list.unshift({id:item.id||Date.now()+Math.random(),title:item.title||'Powiadomienie',message:item.message||'',type:item.type||'info',createdAt:new Date().toISOString(),dedupeKey:item.dedupeKey||''});
    writeList(list);updateBadge();
  }

  function seedDeadlineNotifications(){
    const today=new Date().toISOString().slice(0,10);
    readProjects().filter(p=>p.date&&p.status!=='Zrealizowany').forEach(p=>{
      const d=diffDays(p.date); if(d>3)return;
      const label=d<0?'Termin projektu minął':d===0?'Projekt na dziś':d===1?'Projekt na jutro':'Zbliża się termin projektu';
      addNotification({type:d<0?'danger':d===0?'warning':'info',title:label,message:`${p.name||'Projekt'} · ${p.platform||'—'} · ${p.date}`,dedupeKey:`deadline:${p.id}:${today}:${d}`});
    });
  }

  function unreadCount(){const seen=readSeen();return readList().filter(n=>!seen[n.id]).length}
  function updateBadge(){
    const bell=document.getElementById('notificationBell');if(!bell)return;
    let badge=bell.querySelector('.notification-badge');if(!badge){badge=document.createElement('span');badge.className='notification-badge';bell.appendChild(badge)}
    const count=unreadCount();badge.textContent=count>99?'99+':String(count);badge.style.display=count?'grid':'none';
  }
  function markAllRead(){const seen=readSeen();readList().forEach(n=>seen[n.id]=true);writeSeen(seen);updateBadge()}
  function clearAll(){localStorage.removeItem(KEY);localStorage.removeItem(READ_KEY);renderPanel();updateBadge()}
  function renderPanel(){
    let panel=document.getElementById('notificationPanel');if(!panel)return;
    const list=readList(),seen=readSeen();
    panel.innerHTML=`<div class="notification-head"><div><b>Powiadomienia</b><small>${unreadCount()} nieprzeczytanych</small></div><button id="markNotificationsRead">Oznacz jako przeczytane</button></div><div class="notification-list">${list.length?list.map(n=>`<article class="notification-item ${seen[n.id]?'is-read':''} ${esc(n.type)}"><span class="notification-dot"></span><div><b>${esc(n.title)}</b><p>${esc(n.message)}</p><small>${new Date(n.createdAt).toLocaleString('pl-PL')}</small></div></article>`).join(''):'<div class="notification-empty">Brak powiadomień.</div>'}</div><div class="notification-footer"><button id="clearNotifications">Wyczyść historię</button></div>`;
    panel.querySelector('#markNotificationsRead')?.addEventListener('click',()=>{markAllRead();renderPanel()});
    panel.querySelector('#clearNotifications')?.addEventListener('click',clearAll);
  }
  function togglePanel(){
    const panel=document.getElementById('notificationPanel');if(!panel)return;
    panel.classList.toggle('is-open');if(panel.classList.contains('is-open')){markAllRead();renderPanel()}
  }

  const style=document.createElement('style');style.textContent=`#notificationBell{position:relative}.notification-badge{position:absolute;right:-5px;top:-5px;min-width:16px;height:16px;padding:0 4px;border-radius:999px;background:#6e50e8;color:#fff;font-size:8px;font-weight:800;place-items:center;border:2px solid #fff}.notification-panel{position:fixed;right:22px;top:72px;width:min(380px,calc(100vw - 30px));max-height:70vh;overflow:hidden;background:#fff;border:1px solid #e6e8f0;border-radius:16px;box-shadow:0 24px 60px rgba(31,35,53,.18);z-index:120;display:none}.notification-panel.is-open{display:block}.notification-head,.notification-footer{display:flex;justify-content:space-between;align-items:center;padding:13px 14px;border-bottom:1px solid #eef0f5}.notification-footer{border-top:1px solid #eef0f5;border-bottom:0}.notification-head div{display:grid;gap:2px}.notification-head b{font-size:11px}.notification-head small{font-size:8px;color:#858b98}.notification-head button,.notification-footer button{border:0;background:transparent;color:#6b50d9;font-size:8px;font-weight:700;cursor:pointer}.notification-list{max-height:52vh;overflow:auto}.notification-item{display:grid;grid-template-columns:auto 1fr;gap:9px;padding:12px 14px;border-bottom:1px solid #f0f1f5;background:#faf9ff}.notification-item.is-read{background:#fff}.notification-dot{width:8px;height:8px;border-radius:50%;background:#785ce6;margin-top:4px}.notification-item.warning .notification-dot{background:#e6a63a}.notification-item.danger .notification-dot{background:#d75050}.notification-item b{font-size:9px}.notification-item p{margin:3px 0;font-size:8px;color:#555c68}.notification-item small{font-size:7px;color:#9298a4}.notification-empty{padding:32px;text-align:center;color:#8d93a0;font-size:9px}`;document.head.appendChild(style);

  document.addEventListener('DOMContentLoaded',()=>{
    const bell=document.getElementById('notificationBell');
    if(!document.getElementById('notificationPanel')){const p=document.createElement('aside');p.id='notificationPanel';p.className='notification-panel';document.body.appendChild(p)}
    bell?.addEventListener('click',e=>{e.stopPropagation();togglePanel()});
    document.addEventListener('click',e=>{const p=document.getElementById('notificationPanel');if(p?.classList.contains('is-open')&&!p.contains(e.target)&&e.target!==bell)p.classList.remove('is-open')});
    seedDeadlineNotifications();renderPanel();updateBadge();
    window.addEventListener('aii-tasks-changed',()=>{addNotification({title:'Zaktualizowano zadanie',message:'Status zadania lub projektu został zmieniony.',type:'info'});renderPanel()});
  });

  window.AIINotifications={add:addNotification,refresh:()=>{seedDeadlineNotifications();renderPanel();updateBadge()}};
})();