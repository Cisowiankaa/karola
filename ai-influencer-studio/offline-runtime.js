(() => {
  const toast=t=>window.showToast?.(t);
  const KEY='aii-offline-runtime';
  function writeState(extra={}){const state={online:navigator.onLine,updatedAt:new Date().toISOString(),...extra};try{localStorage.setItem(KEY,JSON.stringify(state))}catch{};return state}
  async function register(){
    if(!('serviceWorker' in navigator))return writeState({supported:false});
    try{
      const reg=await navigator.serviceWorker.register('./sw.js',{scope:'./'});
      writeState({supported:true,registered:true,scope:reg.scope});
      if(reg.waiting)reg.waiting.postMessage('SKIP_WAITING');
      reg.addEventListener('updatefound',()=>{const w=reg.installing;if(!w)return;w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller){w.postMessage('SKIP_WAITING')}})});
      navigator.serviceWorker.addEventListener('controllerchange',()=>writeState({supported:true,registered:true,controller:true}));
      return reg;
    }catch(error){writeState({supported:true,registered:false,error:String(error?.message||error)});return null}
  }
  function syncBack(){
    writeState({reconnected:true});
    try{localStorage.setItem('aii-mode','online-local')}catch{}
    if(typeof window.AII_detectRuntime==='function')window.AII_detectRuntime();
    if(typeof window.AII_refreshDashboard==='function')window.AII_refreshDashboard();
    document.dispatchEvent(new CustomEvent('aii:connection-restored'));
    toast?.('Połączenie wróciło — synchronizacja wznowiona');
  }
  function goOffline(){
    writeState({reconnected:false});
    try{localStorage.setItem('aii-mode','offline')}catch{}
    document.dispatchEvent(new CustomEvent('aii:offline-active'));
    toast?.('Tryb OFFLINE — pracujesz na danych lokalnych');
  }
  window.addEventListener('online',syncBack);
  window.addEventListener('offline',goOffline);
  document.addEventListener('DOMContentLoaded',()=>{register();writeState();});
  window.AIIOfflineRuntime={register,state:()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}};
})();