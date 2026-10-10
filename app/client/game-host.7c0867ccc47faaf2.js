(function(root){
 'use strict';
 // One iframe host for the six content games (SPEC.md §8, LEVELS.md §4): fossil-dig, letter-flight, fruit-orchard,
 // float-lab, nature-explorer, fruit-stand. The app owns band and level; the game's own pickers stay hidden.
 const B=root.SiaGameBridge,L=root.SiaLearning,games=B.GAMES;
 const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let api,host=null,frame=null,run=null,resize=null,loadTimer=0,ownsFullscreen=false,result=null;
 const ko=()=>run?.lang!=='en';
 function init(bridge){api=bridge;root.addEventListener('message',receive);document.addEventListener('fullscreenchange',fullscreenChanged);document.addEventListener('webkitfullscreenchange',fullscreenChanged);}
 function isOpen(){return !!host;}
 // 2D games draw a 1024×768 stage that is scaled to the viewport; the 3D games size themselves to the frame.
 function fit(){if(!frame||!host)return;const area=host.querySelector('.game-viewport'),scale=Math.min(area.clientWidth/1024,area.clientHeight/768);frame.style.transform='translate(-50%,-50%) scale('+scale+')';}
 function tryLandscape(){if(host&&document.fullscreenElement===host)root.screen.orientation?.lock?.('landscape').catch(()=>{});}
 function fullscreenChanged(){if(!host)return;const full=(document.fullscreenElement||document.webkitFullscreenElement)===host;host.querySelector('.game-fullscreen')?.setAttribute('aria-label',ko()?(full?'전체 화면 종료':'전체 화면'):(full?'Exit full screen':'Full screen'));if(!full&&ownsFullscreen){try{root.screen.orientation?.unlock?.();}catch{}ownsFullscreen=false;}fit();}
 function fullscreen(){
  if(!host)return;
  if((document.fullscreenElement||document.webkitFullscreenElement)===host){const exit=document.exitFullscreen||document.webkitExitFullscreen;try{Promise.resolve(exit.call(document)).catch(()=>{});}catch{}return;}
  const target=host,request=target.requestFullscreen||target.webkitRequestFullscreen;
  if(!request)return;
  try{const outcome=request.call(target);ownsFullscreen=true;Promise.resolve(outcome).then(()=>{if(host===target)tryLandscape();}).catch(()=>{ownsFullscreen=false;});}catch{ownsFullscreen=false;}
 }
 function status(message){const el=host?.querySelector('.game-status');if(el)el.textContent=message;}
 // "8–9살 · 레벨 n" (LEVELS.md §2), with the parent's choice named when the band is not the age band.
 function levelText(level,next){return (ko()?L.core.BAND_LABEL[run.band]:'Ages '+L.core.BAND_LABEL[run.band].replace('살',''))+(ko()?' · 레벨 ':' · Level ')+level+(next&&next!==level?' → '+next:'')+(run.overridden?(ko()?' · 부모님이 고른 묶음':' · chosen by a parent'):'');}
 function receive(event){
  if(!host?.isConnected||!frame||event.source!==frame.contentWindow||event.origin!==root.location.origin)return;
  if(event.data?.type==='mysia-game-exit'&&event.data.game===run.game){const id=run.game;close();api.onClose(id);return;}
  const record=B.receive(event,frame.contentWindow,root.location.origin,run);
  if(!record)return;
  record.learning??={...run.learning,id:record.id,completedAt:record.completedAt};record.learning.lang=record.lang;result=record;
  if(record.feel){
   // The app's respond() is authoritative (LEVELS.md §3); the game's nextLevel is advisory.
   L.respond(record.learning,record.feel==='good'?'just':record.feel,L.core.gameScore(record));
   record.appliedNextLevel=L.level(run.game,record.lang);
  }
  const saved=api.onResult(record);
  status(saved?(ko()?'✓ 부모님 기록에 저장했어요':'✓ Saved to your record'):(ko()?'기록을 저장하지 못했어요':'Could not save your record'));
  syncFeedback();
 }
 function syncFeedback(){
  const doc=frame?.contentDocument;if(!doc)return;
  const answered=Boolean(result?.learning?.feedback),locked=Boolean(result&&!answered);
  doc.querySelectorAll('#feel .faces button,#sk-feels .sk-feel').forEach(b=>{b.disabled=answered;});
  doc.querySelectorAll('#btnAgain,#btnOther,#btnTitle,#sk-again,#sk-home').forEach(b=>{b.disabled=locked;});
  if(answered){
   const label=doc.getElementById('feelMsg')||doc.getElementById('sk-feel-msg'),adjustment=result.learning.adjustment;
   if(label)label.textContent=ko()?(adjustment?.reason==='band-up'||adjustment?.reason==='maximum'?L.message(adjustment):'알려 줘서 고마워. 다음 새 놀이에 반영할게!'):(adjustment?.reason==='band-up'?'Level 5 complete! Choose the next age group with your parents.':'Thanks! Your next new game will use your updated level.');
   host.querySelector('.game-level-label').textContent=levelText(result.learning.level);
  }
 }
 function bindGameUI(){
  const doc=frame.contentDocument,view=frame.contentWindow,game=B.meta(run.game);let feelingSent=false;
  // Keep the content repository unchanged. Only gate its public controls and capture round boundaries
  // so duplicate postMessages never count as replays. The 3D kit still shows its level dial when embedded:
  // hide it, since the app decides level changes (LEVELS.md R2).
  if(game.three){const style=doc.createElement('style');style.textContent='#sk-dial{display:none!important}';doc.head.appendChild(style);}
  doc.addEventListener('click',event=>{
   const button=event.target.closest('button');if(!button)return;
   if(button.matches('#feel .faces button,#sk-feels .sk-feel')){if(feelingSent||result?.learning?.feedback){event.preventDefault();event.stopImmediatePropagation();return;}feelingSent=true;return;}
   if(button.matches('#btnAgain,#btnOther,#btnTitle,#sk-again,#sk-home')){
    event.preventDefault();event.stopImmediatePropagation();
    if(result&&!result.learning?.feedback)return;
    // A replay keeps the played URL level; a new menu launch uses the newly earned level.
    const container=host.parentElement;
    open(container,{...L.profile(),gameId:run.game,lang:run.lang,playLevel:run.level,playBand:run.band});return;
   }
   if(button.matches('#btnStart,#sk-start')){
    const html=doc.documentElement.lang,lang=html==='en'?'en':html==='ko'?'ko':(view.__game?.lang==='en'?'en':run.lang);
    const picked=Number(view.__game?.level??view.__fossil?.level??view.__fruit?.level)||run.level;
    if(picked!==run.level){event.preventDefault();event.stopImmediatePropagation();return;}
    B.begin(run,{level:picked,lang});run.learning=L.start(run.game,run.id+':'+run.count,{lang,band:run.band,level:run.level});result=null;feelingSent=false;syncFeedback();
    host.querySelector('.game-level-label').textContent=levelText(run.level);
   }
  },true);
 }
 function open(container,profile){
  close();root.SiaVoice?.stop();
  const game=B.meta(profile.gameId);if(!game)return;
  const band=L.core.BANDS.includes(profile.playBand)?profile.playBand:L.core.bandOf(profile,profile.gameId,profile.lang);
  run=B.session({...profile,playBand:band,playBandOverridden:band!==L.core.ageBand(profile.age)},root.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2));
  run.learning=L.start(run.game,run.id,{lang:run.lang,band:run.band,level:run.level});
  const title=ko()?game.title:game.en;
  host=document.createElement('section');host.className='game-shell game-shell-'+game.id;host.setAttribute('aria-label',title);
  host.innerHTML='<header class="game-toolbar"><button type="button" class="game-close">← <span>'+(ko()?'놀이섬':'Play island')+'</span></button><span class="game-level-label"></span><span class="game-status" role="status" aria-live="polite"></span><button type="button" class="game-fullscreen" aria-label="'+(ko()?'전체 화면':'Full screen')+'">⛶</button></header><p class="game-rotate">↻ '+(ko()?'가로로 돌리면 더 크게 보여요':'Turn sideways for a bigger adventure')+'</p><div class="game-viewport"><div class="game-loading" role="status">'+E(game.icon)+' '+(ko()?E(game.title)+'을(를) 준비하고 있어요…':'Getting '+E(game.en)+' ready…')+'</div></div>';
  container.replaceChildren(host);
  host.querySelector('.game-level-label').textContent=levelText(run.level);
  host.querySelector('.game-close').addEventListener('click',()=>{const id=run.game;close();api.onClose(id);});
  host.querySelector('.game-fullscreen').addEventListener('click',fullscreen);
  const area=host.querySelector('.game-viewport');
  frame=document.createElement('iframe');frame.className='game-frame';frame.title=title;
  frame.allow='autoplay; fullscreen';frame.allowFullscreen=true;frame.referrerPolicy='same-origin';
  frame.src=B.gameUrl(document.baseURI,run,root.SIA_GAMES_RELEASE?.games?.[game.id]?.sha256?.slice(0,16));
  const current=frame;
  frame.addEventListener('load',()=>{
   if(frame!==current)return;
   clearTimeout(loadTimer);
   try{const doc=frame.contentDocument;if(!doc?.getElementById('stage')&&!doc?.getElementById('sk-ui')&&!doc?.querySelector('canvas')){failed();return;}}catch{failed();return;}
   bindGameUI();host.querySelector('.game-loading')?.remove();fit();
  });
  frame.addEventListener('error',failed);
  area.appendChild(frame);resize=new ResizeObserver(fit);resize.observe(area);fit();
  loadTimer=setTimeout(failed,game.three?30000:20000);fullscreen();
 }
 function failed(){
  if(!host)return;clearTimeout(loadTimer);
  let el=host.querySelector('.game-loading');if(!el){el=document.createElement('div');el.className='game-loading';host.querySelector('.game-viewport').appendChild(el);}
  el.textContent=ko()?'게임을 불러오지 못했어요.':'The game could not load.';
  const retry=document.createElement('button');retry.textContent=ko()?'다시 열기':'Try again';
  retry.addEventListener('click',()=>{const container=host.parentElement,profile={...L.profile(),gameId:run.game,lang:run.lang,playLevel:run.level,playBand:run.band};open(container,profile);});el.appendChild(retry);
 }
 function close(){
  clearTimeout(loadTimer);resize?.disconnect();resize=null;
  if(host){try{frame?.contentWindow?.speechSynthesis?.cancel();}catch{}host.remove();}
  const exit=document.exitFullscreen||document.webkitExitFullscreen;
  if(ownsFullscreen){try{root.screen.orientation?.unlock?.();if((document.fullscreenElement||document.webkitFullscreenElement)&&exit)Promise.resolve(exit.call(document)).catch(()=>{});}catch{}}
  host=null;frame=null;run=null;result=null;ownsFullscreen=false;
 }
 // Parent record card: band, level, stars and the game-specific detail (dinosaur + quiz, or mistakes).
 function parentRecord(r){
  const g=B.meta(r.gameId),date=new Date(r.completedAt).toLocaleDateString('ko-KR'),lang=r.lang==='en'?'영어':'한글',level=r.learning?.level||r.tier||r.level||1,stars=Math.max(0,Math.min(3,Number(r.stars)||0));
  const detail=r.gameId==='fossil-dig'?'<span class="game-record-name">'+E(B.DINOS[r.dino]?.ko||'')+'</span>':'';
  const extra=r.gameId==='fossil-dig'?'퀴즈 '+(r.quizRight?'정답':'다시 생각해 보기'):r.gameId==='fruit-stand'?'실수 '+(r.mistakes||0)+'번':'';
  const feedback=r.learning?.feedback?E(L.core.MOODS[r.learning.feedback])+' · 다음 레벨 '+r.learning.adjustment.to+(r.learning.adjustment.reason==='band-up'?' · 다음 묶음 제안':''):'';
  return '<div class="game-record"><span aria-hidden="true">'+g.icon+'</span><div><strong>'+E(g.title)+'</strong><small>'+date+' · '+lang+' · '+(r.band?L.core.BAND_LABEL[r.band]+' · ':'')+'레벨 '+level+(r.child?.name?' · '+E(r.child.name):'')+'</small>'+detail+'</div><p><span class="game-stars" aria-label="별 '+stars+'개 / 3개">'+'★'.repeat(stars)+'☆'.repeat(3-stars)+'</span>'+(extra?'<br><small>'+E(extra)+'</small>':'')+(feedback?'<br><small>'+feedback+'</small>':'')+'</p></div>';
 }
 root.SiaGameHost={games,has:B.has,meta:B.meta,init,isOpen,open,close,parentRecord};
})(window);
