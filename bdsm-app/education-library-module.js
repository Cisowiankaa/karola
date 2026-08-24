(()=>{
  if(window.__bdsmEducationLibraryInstalled)return;
  window.__bdsmEducationLibraryInstalled=true;
  const presets=[
    {id:'dict-ort',label:'Dyktando — ortografia',type:'dyktando',title:'Dyktando ortograficzne',desc:'Wykonaj dyktando i zapisz wynik.'},
    {id:'pl-read',label:'Język polski — czytanie ze zrozumieniem',type:'zadanie domowe',title:'Czytanie ze zrozumieniem',desc:'Przeczytaj wskazany tekst i odpowiedz na pytania.'},
    {id:'math-basic',label:'Matematyka — działania',type:'kartkówka',title:'Kartkówka z matematyki',desc:'Wykonaj zestaw działań i zapisz wynik.'},
    {id:'knowledge',label:'Test wiedzy',type:'test online',title:'Test wiedzy',desc:'Wykonaj uzgodniony test i zapisz wynik.'},
    {id:'writing',label:'Praca pisemna',type:'zadanie domowe',title:'Praca pisemna',desc:'Przygotuj krótką pracę pisemną na uzgodniony temat.'},
    {id:'revision',label:'Powtórka materiału',type:'sprawdzian',title:'Powtórka materiału',desc:'Powtórz wskazany materiał i wykonaj sprawdzian.'}
  ];
  function install(){
    const section=document.querySelector('#view-education-tasks'); if(!section||document.querySelector('#eduPresetBox'))return;
    const grid=section.querySelector('.form-grid'); if(!grid)return;
    const wrap=document.createElement('div'); wrap.id='eduPresetBox'; wrap.className='field span3';
    wrap.innerHTML=`<label>Biblioteka gotowych zadań</label><div style="display:flex;gap:8px;flex-wrap:wrap"><select id="eduPreset" style="flex:1;min-width:240px"><option value="">— wybierz gotowe zadanie —</option>${presets.map(p=>`<option value="${p.id}">${p.label}</option>`).join('')}</select><button class="btn" id="eduPresetApply" type="button">Wstaw</button></div>`;
    grid.insertBefore(wrap,grid.firstChild);
    document.querySelector('#eduPresetApply')?.addEventListener('click',()=>{
      const p=presets.find(x=>x.id===document.querySelector('#eduPreset')?.value); if(!p)return;
      const type=document.querySelector('#eduType'),title=document.querySelector('#eduTitle'),desc=document.querySelector('#eduDesc');
      if(type)type.value=p.type;if(title)title.value=p.title;if(desc)desc.value=p.desc;
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0),{once:true});else setTimeout(install,0);
  document.addEventListener('bdsm-education-tasks-updated',install);
})();
