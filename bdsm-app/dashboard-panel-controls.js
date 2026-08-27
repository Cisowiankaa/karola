(()=>{
  if(window.__bdsmDashboardPanelControlsInstalled)return;
  window.__bdsmDashboardPanelControlsInstalled=true;
  const KEY='bdsm-app-dashboard-panel-state-v1';
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return{}}};
  const save=v=>localStorage.setItem(KEY,JSON.stringify(v));
  const state=read();
  function panelKey(panel,i){return panel.id||`panel-${i}`}
  function apply(){
    const root=document.querySelector('#view-dashboard');if(!root)return;
    const panels=[...root.querySelectorAll(':scope > .panel')];
    panels.forEach((panel,i)=>{
      if(panel.dataset.dpcReady==='1')return;
      const key=panelKey(panel,i),head=panel.querySelector('h2,h3');
      if(!head)return;
      panel.dataset.dpcReady='1';
      let toggle=document.createElement('button');
      toggle.type='button';toggle.className='btn dpc-toggle';toggle.setAttribute('aria-label','Zwiń lub rozwiń panel');
      const children=[...panel.children].filter(x=>x!==toggle);
      const body=document.createElement('div');body.className='dpc-body';
      const headContainer=head.parentElement===panel?null:head.parentElement;
      const keep=headContainer&&headContainer.children.length>1?headContainer:head;
      children.forEach(x=>{if(x!==keep)body.appendChild(x)});
      if(keep.parentElement!==panel)panel.appendChild(keep);
      panel.appendChild(toggle);panel.appendChild(body);
      const render=()=>{const collapsed=!!state[key];body.hidden=collapsed;toggle.textContent=collapsed?'Rozwiń':'Zwiń';toggle.setAttribute('aria-expanded',collapsed?'false':'true')};
      toggle.onclick=()=>{state[key]=!state[key];save(state);render()};
      render();
    });
  }
  function install(){
    if(!document.querySelector('#dashboardPanelControlsStyles')){const s=document.createElement('style');s.id='dashboardPanelControlsStyles';s.textContent='#view-dashboard>.panel{position:relative}.dpc-toggle{position:absolute;right:12px;top:10px;font-size:11px;padding:5px 8px}.dpc-body[hidden]{display:none!important}@media(max-width:700px){.dpc-toggle{position:static;float:right;margin:-2px 0 8px 8px}}';document.head.appendChild(s)}
    apply();
    const root=document.querySelector('#view-dashboard');if(root)new MutationObserver(()=>apply()).observe(root,{childList:true});
    window.addEventListener('storage',e=>{if(e.key===KEY)location.reload()});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();