(() => {
  const VIEW_KEY = 'aii-last-view';
  const FORM_KEY = 'aii-project-draft';

  function saveLastView(view){
    if(view) localStorage.setItem(VIEW_KEY, view);
  }

  function restoreLastView(){
    const saved = localStorage.getItem(VIEW_KEY);
    if(!saved) return;
    const nav = document.querySelector(`.nav-item[data-view="${saved}"]`);
    if(nav) nav.click();
  }

  function bindNavigationPersistence(){
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
      item.addEventListener('click', () => saveLastView(item.dataset.view));
    });
  }

  function readDraft(){
    try { return JSON.parse(localStorage.getItem(FORM_KEY) || '{}'); }
    catch { return {}; }
  }

  function saveDraft(){
    const draft = {
      name: document.getElementById('projectName')?.value || '',
      type: document.getElementById('projectType')?.value || '',
      platform: document.getElementById('projectPlatform')?.value || '',
      date: document.getElementById('projectDate')?.value || '',
      notes: document.getElementById('projectNotes')?.value || ''
    };
    localStorage.setItem(FORM_KEY, JSON.stringify(draft));
  }

  function restoreDraft(){
    const d = readDraft();
    const pairs = [['projectName','name'],['projectType','type'],['projectPlatform','platform'],['projectDate','date'],['projectNotes','notes']];
    pairs.forEach(([id,key]) => {
      const el = document.getElementById(id);
      if(el && d[key]) el.value = d[key];
    });
  }

  function bindDraftPersistence(){
    ['projectName','projectType','projectPlatform','projectDate','projectNotes'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', saveDraft);
      document.getElementById(id)?.addEventListener('change', saveDraft);
    });
    document.getElementById('newProjectBtn')?.addEventListener('click', () => setTimeout(restoreDraft, 0));
    document.getElementById('saveProject')?.addEventListener('click', () => localStorage.removeItem(FORM_KEY));
  }

  function installUnsavedWarning(){
    window.addEventListener('beforeunload', e => {
      const d = readDraft();
      if(Object.values(d).some(Boolean)){
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindNavigationPersistence();
    bindDraftPersistence();
    restoreLastView();
    installUnsavedWarning();
  });
})();
