(function(){
 'use strict';
 const current=document.querySelector('meta[name="sia-release"]')?.content;
 if(!current)return;
 const marker='my-sia-release-refresh';
 let latest=null,checking=false,lastCheck=0,observer=null,reloading=false;
 function canRefresh(){
  if(document.hidden||!navigator.onLine)return false;
  const route=location.hash.slice(1)||'home';
  if(!['home','stories','library','companion'].includes(route))return false;
  if(document.querySelector('.intro-screen,dialog[open],#reader:not([hidden]),#series-reader:not([hidden])'))return false;
  return !document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');
 }
 function refreshWhenReady(){
  if(!latest||reloading||!canRefresh())return;
  // A stale intermediary response must never create an automatic reload loop.
  try{if(sessionStorage.getItem(marker)===latest)return;sessionStorage.setItem(marker,latest);}catch{return;}
  reloading=true;
  observer?.disconnect();
  location.reload();
 }
 async function check(){
  if(checking||document.hidden||!navigator.onLine)return;
  if(latest){refreshWhenReady();return;}
  if(Date.now()-lastCheck<10000)return;
  lastCheck=Date.now();checking=true;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
  try{
   const response=await fetch('site-release.json?check='+Date.now(),{cache:'no-store',signal:controller.signal});
   if(!response.ok)return;
   const release=await response.json();
   if(!/^[a-f0-9]{16}$/.test(release.version)||release.version===current)return;
   latest=release.version;
   observer=new MutationObserver(refreshWhenReady);
   observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','open']});
   refreshWhenReady();
  }catch{/* An offline device keeps its current screen and saved reading work. */}
  finally{clearTimeout(timer);checking=false;}
 }
 window.addEventListener('pageshow',check);
 window.addEventListener('focus',check);
 window.addEventListener('online',check);
 window.addEventListener('hashchange',refreshWhenReady);
 document.addEventListener('visibilitychange',check);
 setInterval(check,60000);
 check();
})();
