(function(root){
 'use strict';
 // Completion belongs to this exact attempt and its reading/question plan.
 function ready(session,flow){
  return Boolean(session?.completedAt&&flow?.length&&flow.some(s=>s.kind==='read')&&flow.some(s=>s.q)&&flow.every(step=>{
   if(step.kind==='read')return session.completedReadPages?.includes(step.id);
   if(!step.q)return false;
   const a=session.answers?.[step.q.id];
   return a?.submittedAt&&root.SiaStoryCore.hasAnswer(step.q,a.value,session.drawings?.[step.q.id],a.spoken);
  }));
 }
 function create({parts,lang='en',allowed,onChange=()=>{},synth=root.speechSynthesis,Utterance=root.SpeechSynthesisUtterance}){
  let index=-1,status='idle',rate=1,single=false,ticket=0,timer=null,disposed=false;
  const snapshot=()=>({index,status,rate,total:parts.length});
  const notify=()=>onChange(snapshot());
  function cancel(){ticket++;clearTimeout(timer);timer=null;try{synth?.cancel();}catch{}}
  function run(){
   if(disposed||!allowed())return stop();
   if(!synth||!Utterance){status='unavailable';notify();return false;}
   const stamp=ticket,u=new Utterance(parts[index]);
   u.lang=lang==='en'?'en-US':'ko-KR';u.voice=root.SiaVoice?.choose(lang)||null;
   const tone=root.SiaVoice?.delivery(lang)||{rate:1,pitch:1};u.rate=tone.rate*rate;u.pitch=tone.pitch;
   status='playing';notify();
   u.onend=()=>{if(stamp!==ticket||disposed)return;if(single||index===parts.length-1){status='ended';notify();}else{index++;timer=setTimeout(run,220);}};
   u.onerror=()=>{if(stamp!==ticket||disposed)return;cancel();status='error';notify();};
   try{synth.speak(u);return true;}catch{cancel();status='error';notify();return false;}
  }
  function play(from=0,one=false){if(disposed||!allowed()||!Number.isInteger(from)||from<0||from>=parts.length)return false;root.SiaVoice?.stop();cancel();index=from;single=one;return run();}
  function pause(){if(status!=='playing')return;cancel();status='paused';notify();}
  function resume(){if(status==='paused')return play(index,single);return false;}
  function stop(){cancel();status='idle';index=-1;notify();return false;}
  function speed(value){if(![.75,1,1.25].includes(value))return;rate=value;if(status==='playing')play(index,single);else notify();}
  return {play,pause,resume,stop,speed,snapshot,dispose(){stop();disposed=true;}};
 }
 const E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function mount(node,{paragraphs,lang,allowed,band='E1',level=1}){
  if(!allowed())return null;
  const R=root.SiaReadingLayout,pages=R.paginate(paragraphs,band,level,lang),parts=pages.flatMap(p=>p.items.map(s=>s.text.trim()));let page=0;
  node.innerHTML=`<div class="narration-controls"><button class="btn primary" data-narration="all">▶ 전체 듣기</button><button class="btn outline" data-narration="pause" disabled>잠깐 멈춤</button><button class="btn outline" data-narration="stop" disabled>정지</button><fieldset><legend>듣기 속도</legend>${[.75,1,1.25].map(n=>`<button class="btn outline" data-narration-speed="${n}" aria-pressed="${n===1}">${n===.75?'천천히':n===1?'보통':'빠르게'}</button>`).join('')}</fieldset></div><p class="narration-status" role="status" aria-live="polite">문장을 누르면 그 문장만 다시 들을 수 있어요.</p><article class="narration-text" lang="${E(lang)}"></article><div class="narration-pages"><button class="btn outline" data-narration-page="-1">이전 쪽</button><span></span><button class="btn outline" data-narration-page="1">다음 쪽</button></div><p class="series-small">기기의 음성으로 읽어 줘요. 이어 듣기는 멈춘 문장 처음부터 시작해요.</p>`;
  function paintPage(){const view=pages[page];node.style.cssText=R.style(band,level,view);node.querySelector('.narration-text').innerHTML=view.items.map(item=>`<button type="button" data-narration-sentence="${item.sentence}" aria-label="문장 듣기: ${E(item.text.trim())}">${E(item.text.trim())}</button>`).join('');node.querySelector('.narration-pages span').textContent=`${page+1} / ${pages.length}쪽`;node.querySelector('[data-narration-page="-1"]').disabled=page===0;node.querySelector('[data-narration-page="1"]').disabled=page===pages.length-1;}
  paintPage();
  const player=create({parts,lang,allowed,onChange(s){
   if(!node.isConnected)return;
   if(s.status==='playing'){const next=pages.findIndex(p=>p.items.some(item=>item.sentence===s.index));if(next>=0&&next!==page){page=next;paintPage();}}
   const busy=s.status==='playing'||s.status==='paused';
   node.querySelector('[data-narration="pause"]').disabled=!busy;
   node.querySelector('[data-narration="pause"]').textContent=s.status==='paused'?'이어 듣기':'잠깐 멈춤';
   node.querySelector('[data-narration="stop"]').disabled=!busy;
   node.querySelectorAll('[data-narration-speed]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.narrationSpeed)===s.rate)));
   node.querySelectorAll('[data-narration-sentence]').forEach(b=>{const active=Number(b.dataset.narrationSentence)===s.index;b.classList.toggle('is-current',active);if(active)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});
   node.querySelector('.narration-status').textContent=({idle:'문장을 누르면 그 문장만 다시 들을 수 있어요.',playing:`${s.index+1} / ${s.total}번째 문장을 듣고 있어요.`,paused:'잠깐 멈췄어요. 이어 들으면 이 문장부터 다시 시작해요.',ended:'잘 들었어요! 전체 또는 원하는 문장을 다시 들어 보세요.',unavailable:'이 브라우저에서 음성 읽기를 사용할 수 없어요. 본문은 계속 읽을 수 있어요.',error:'음성을 재생하지 못했어요. 기기 음량과 음성 설정을 확인하고 다시 눌러 주세요.'})[s.status];
  }});
  const click=e=>{const b=e.target.closest('button');if(!b||!node.contains(b))return;if(b.dataset.narrationPage){player.pause();page=Math.max(0,Math.min(pages.length-1,page+Number(b.dataset.narrationPage)));paintPage();}else if(b.dataset.narrationSentence!==undefined)player.play(Number(b.dataset.narrationSentence),true);else if(b.dataset.narrationSpeed)player.speed(Number(b.dataset.narrationSpeed));else if(b.dataset.narration==='all')player.play();else if(b.dataset.narration==='pause')player.snapshot().status==='paused'?player.resume():player.pause();else if(b.dataset.narration==='stop')player.stop();};
  node.addEventListener('click',click);return {pause:player.pause,dispose(){node.removeEventListener('click',click);player.dispose();}};
 }

 root.SiaStoryNarration={ready,create,mount};
})(typeof window!=='undefined'?window:globalThis);
