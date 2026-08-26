(() => {
  const QUEUE_KEY='aii-social-queue';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const toast=t=>window.showToast?window.showToast(t):alert(t);
  const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const style=document.createElement('style');
  style.textContent=`
    .cch-row{display:flex;gap:8px;flex-wrap:wrap;align-items:end;margin-top:12px;padding-top:12px;border-top:1px solid #eceef4}
    .cch-row label{display:grid;gap:5px;font-size:8px;font-weight:800;color:#717887}.cch-row input,.cch-row select{border:1px solid #dfe2eb;border-radius:9px;padding:8px;background:#fff;font:inherit}.cch-add{border:0;border-radius:9px;padding:9px 12px;background:linear-gradient(90deg,#46dff0,#7f73ff 50%,#e75eb0);color:#fff;font-size:8px;font-weight:900;cursor:pointer}
  `;document.head.appendChild(style);

  function addToCalendar(item){
    const arr=read(QUEUE_KEY,[]);
    const existing=arr.find(x=>x.sourceId===item.sourceId);
    const payload={
      id:existing?.id||Date.now(),sourceId:item.sourceId,title:item.title,platform:item.platform||'Instagram',type:item.type||'Post',date:item.date,time:item.time,status:'Zaplanowany',notes:item.notes||'',createdAt:existing?.createdAt||Date.now(),updatedAt:Date.now()
    };
    if(existing) Object.assign(existing,payload); else arr.unshift(payload);
    save(QUEUE_KEY,arr);
    document.dispatchEvent(new CustomEvent('aii:social-changed',{detail:{count:arr.length}}));
    toast(existing?'Zaktualizowano termin w kalendarzu':'Dodano materiał do kalendarza');
  }

  function injectPost(){
    const actions=document.querySelector('.post-pro-actions'); if(!actions||document.getElementById('cchPostAdd'))return;
    const row=document.createElement('div');row.className='cch-row';
    row.innerHTML=`<label>Data<input id="cchPostDate" type="date" value="${today()}"></label><label>Godzina<input id="cchPostTime" type="time" value="18:00"></label><label>Platforma<select id="cchPostPlatform"><option>Instagram</option><option>Facebook</option><option>TikTok</option></select></label><button class="cch-add" id="cchPostAdd">Dodaj do kalendarza</button>`;
    actions.parentElement.appendChild(row);
    document.getElementById('cchPostAdd').onclick=()=>{
      const topic=document.getElementById('ppTopic')?.value.trim()||'Post';
      const text=document.getElementById('ppOut')?.textContent?.trim()||'';
      addToCalendar({sourceId:'post-'+topic,type:'Post',title:topic,date:document.getElementById('cchPostDate').value,time:document.getElementById('cchPostTime').value,platform:document.getElementById('cchPostPlatform').value,notes:text});
    };
  }

  function injectReels(){
    const actions=[...document.querySelectorAll('.rp-actions')].pop(); if(!actions||document.getElementById('cchReelsAdd'))return;
    const row=document.createElement('div');row.className='cch-row';
    row.innerHTML=`<label>Data<input id="cchReelsDate" type="date" value="${today()}"></label><label>Godzina<input id="cchReelsTime" type="time" value="18:00"></label><label>Platforma<select id="cchReelsPlatform"><option>Instagram</option><option>TikTok</option><option>YouTube</option></select></label><button class="cch-add" id="cchReelsAdd">Dodaj do kalendarza</button>`;
    actions.parentElement.appendChild(row);
    document.getElementById('cchReelsAdd').onclick=()=>{
      const topic=document.getElementById('rpTopic')?.value.trim()||'Reels';
      const text=document.getElementById('rpCaption')?.textContent?.trim()||'';
      addToCalendar({sourceId:'reels-'+topic,type:'Reels',title:topic,date:document.getElementById('cchReelsDate').value,time:document.getElementById('cchReelsTime').value,platform:document.getElementById('cchReelsPlatform').value,notes:text});
    };
  }

  function inject(){injectPost();injectReels();}
  document.addEventListener('DOMContentLoaded',()=>{const root=document.getElementById('content');if(root)new MutationObserver(()=>setTimeout(inject,0)).observe(root,{childList:true,subtree:true});inject();});
  window.AIIContentCalendarHandoff={addToCalendar};
})();