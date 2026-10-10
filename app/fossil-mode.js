(function(root){
 'use strict';
 const B=root.SiaGameBridge,L=root.SiaLearning;
 const meta={id:B.GAME,title:'공룡 화석 발굴',icon:'🦖',skill:'수 세기 · 관찰 · 공룡 탐구'};
 let api,host=null,frame=null,run=null,resize=null,loadTimer=0,ownsFullscreen=false,result=null;
 const ko=()=>run?.lang!=='en';
 function init(bridge){api=bridge;root.addEventListener('message',receive);document.addEventListener('fullscreenchange',fullscreenChanged);document.addEventListener('webkitfullscreenchange',fullscreenChanged);}
 function isOpen(){return !!host;}
 function fit(){if(!frame||!host)return;const area=host.querySelector('.fossil-viewport'),scale=Math.min(area.clientWidth/1024,area.clientHeight/768);frame.style.transform='translate(-50%,-50%) scale('+scale+')';}
 function tryLandscape(){if(host&&document.fullscreenElement===host)root.screen.orientation?.lock?.('landscape').catch(()=>{});}
 function fullscreenChanged(){if(!host)return;const full=(document.fullscreenElement||document.webkitFullscreenElement)===host;host.querySelector('.fossil-fullscreen')?.setAttribute('aria-label',ko()?(full?'전체 화면 종료':'전체 화면'):(full?'Exit full screen':'Full screen'));if(!full&&ownsFullscreen){try{root.screen.orientation?.unlock?.();}catch{}ownsFullscreen=false;}fit();}
 function fullscreen(){
  if(!host)return;
  if((document.fullscreenElement||document.webkitFullscreenElement)===host){const exit=document.exitFullscreen||document.webkitExitFullscreen;try{Promise.resolve(exit.call(document)).catch(()=>{});}catch{}return;}
  const target=host,request=target.requestFullscreen||target.webkitRequestFullscreen;
  if(!request)return;
  try{const result=request.call(target);ownsFullscreen=true;Promise.resolve(result).then(()=>{if(host===target)tryLandscape();}).catch(()=>{ownsFullscreen=false;});}catch{ownsFullscreen=false;}
 }
 function status(message){const el=host?.querySelector('.fossil-status');if(el)el.textContent=message;}
 function receive(event){
  if(!host?.isConnected||!frame)return;
  const record=B.receive(event,frame.contentWindow,root.location.origin,run);
  if(!record)return;
  record.learning??={...run.learning,id:record.id,completedAt:record.completedAt};result=record;
  if(record.feel){
   L.respond(record.learning,record.feel==='good'?'just':record.feel,L.core.gameScore(record));
   record.appliedNextLevel=L.level(B.GAME,record.lang);
  }
  const saved=api.onResult(record);
  status(saved?(ko()?'✓ 부모님 기록에 저장했어요':'✓ Saved to your record'):(ko()?'기록을 저장하지 못했어요':'Could not save your record'));
  syncFeedback();
 }
 function syncFeedback(){
  const doc=frame?.contentDocument;if(!doc)return;
  const answered=Boolean(result?.learning?.feedback);
  doc.querySelectorAll('#feel .faces button').forEach(b=>{b.disabled=answered;});
  for(const id of ['btnAgain','btnOther'])doc.getElementById(id).disabled=Boolean(result&&!answered);
  if(answered){
   const label=doc.getElementById('feelMsg');label.textContent=ko()?L.message(result.learning.adjustment):'Next time: level '+result.appliedNextLevel;
   host.querySelector('.fossil-level-label').textContent=(root.SiaStoryCore.BANDS[run.band]?.label||run.child.age+'살')+' · 레벨 '+result.learning.level+' → '+result.appliedNextLevel;
  }
 }
 function bindGameUI(){
  const doc=frame.contentDocument;let feelingSent=false;
  // Keep the content repository unchanged. Only gate its public controls and
  // capture round boundaries so duplicate postMessages never count as replays.
  doc.addEventListener('click',event=>{
   const button=event.target.closest('button');if(!button)return;
   if(button.matches('#feel .faces button')){if(feelingSent||result?.learning?.feedback){event.preventDefault();event.stopImmediatePropagation();return;}feelingSent=true;}
   if(button.id==='btnAgain'||button.id==='btnOther'){
    if(result&&!result.learning?.feedback){event.preventDefault();event.stopImmediatePropagation();return;}
    // Reopen with the app's applied next level (also handles a parent override).
    event.preventDefault();event.stopImmediatePropagation();const container=host.parentElement;
    open(container,{...L.profile(),lang:run.lang,playLevel:L.level(B.GAME,run.lang),playBand:run.band});return;
   }
   if(button.id==='btnStart'){
    const selected=[...doc.querySelectorAll('#levels button')].findIndex(b=>b.classList.contains('on'))+1,lang=doc.documentElement.lang==='en'?'en':'ko';
    if(selected!==L.level(B.GAME,lang)&&!L.select(B.GAME,lang,selected)){event.preventDefault();event.stopImmediatePropagation();return;}
    B.begin(run,{level:selected,lang});run.learning=L.start(B.GAME,run.id+':'+run.count,{lang,level:run.level});result=null;feelingSent=false;syncFeedback();
    host.querySelector('.fossil-level-label').textContent=(root.SiaStoryCore.BANDS[run.band]?.label||run.child.age+'살')+' · 레벨 '+run.level;
   }
  },true);
 }
 function open(container,profile){
  close();root.speechSynthesis?.cancel();
  run=B.session(profile,root.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2));
  run.learning=L.start(B.GAME,run.id,{lang:run.lang,level:run.level});
  host=document.createElement('section');host.className='fossil-shell';host.setAttribute('aria-label',ko()?'공룡 화석 발굴':'Fossil Dig');
  host.innerHTML='<header class="fossil-toolbar"><button type="button" class="fossil-close">← <span>'+(ko()?'놀이섬':'Play island')+'</span></button><span class="fossil-status" role="status" aria-live="polite"></span><button type="button" class="fossil-fullscreen" aria-label="'+(ko()?'전체 화면':'Full screen')+'">⛶</button></header><p class="fossil-rotate">↻ '+(ko()?'가로로 돌리면 더 크게 보여요':'Turn sideways for a bigger adventure')+'</p><div class="fossil-viewport"><div class="fossil-loading" role="status">'+(ko()?'발굴 도구를 챙기고 있어요…':'Getting your digging tools…')+'</div></div>';
  container.replaceChildren(host);
  const label=document.createElement('span');label.className='fossil-level-label';label.textContent=profile.age+'살 · 레벨 '+run.level;host.querySelector('.fossil-close').after(label);
  host.querySelector('.fossil-close').addEventListener('click',()=>{close();api.onClose();});
  host.querySelector('.fossil-fullscreen').addEventListener('click',fullscreen);
  const area=host.querySelector('.fossil-viewport');
  frame=document.createElement('iframe');frame.className='fossil-frame';frame.title=ko()?'공룡 화석 발굴 게임':'Fossil Dig game';
  frame.allow='autoplay; fullscreen';frame.allowFullscreen=true;frame.referrerPolicy='same-origin';
  frame.src=B.gameUrl(document.baseURI,run,root.SIA_GAMES_RELEASE?.games?.[B.GAME]?.sha256?.slice(0,16));
  const current=frame;
  frame.addEventListener('load',()=>{
   if(frame!==current)return;
   clearTimeout(loadTimer);
   try{if(!frame.contentDocument?.getElementById('stage')){failed();return;}}catch{failed();return;}
   bindGameUI();host.querySelector('.fossil-loading')?.remove();fit();
  });
  frame.addEventListener('error',failed);
  area.appendChild(frame);resize=new ResizeObserver(fit);resize.observe(area);fit();
  loadTimer=setTimeout(failed,20000);fullscreen();
 }
 function failed(){
  if(!host)return;clearTimeout(loadTimer);
  let el=host.querySelector('.fossil-loading');if(!el){el=document.createElement('div');el.className='fossil-loading';host.querySelector('.fossil-viewport').appendChild(el);}
  el.textContent=ko()?'게임을 불러오지 못했어요.':'The game could not load.';
  const retry=document.createElement('button');retry.textContent=ko()?'다시 열기':'Try again';
  retry.addEventListener('click',()=>{const container=host.parentElement,profile={...run.child,lang:run.lang,playLevel:run.level};open(container,profile);});el.appendChild(retry);
 }
 function close(){
  clearTimeout(loadTimer);resize?.disconnect();resize=null;
  if(host){try{frame?.contentWindow?.speechSynthesis?.cancel();}catch{}host.remove();}
  const exit=document.exitFullscreen||document.webkitExitFullscreen;
  if(ownsFullscreen){try{root.screen.orientation?.unlock?.();if((document.fullscreenElement||document.webkitFullscreenElement)&&exit)Promise.resolve(exit.call(document)).catch(()=>{});}catch{}}
  host=null;frame=null;run=null;result=null;ownsFullscreen=false;
 }
 root.SiaFossil={meta,init,isOpen,open,close};
})(window);
