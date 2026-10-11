(function(){'use strict';
 const games=[
 {id:'star-mail',title:'별빛 문장\n우체국',short:'별빛 문장 우체국',subject:'LANGUAGE · 언어',line:'말을 잇고, 마음을 전해요',text:'별 너머로 편지를 보내 볼까?\n흩어진 말의 조각이 한 문장이 되는 순간.',goal:'낱말 · 문장 · 맥락'},
 {id:'cloud-bridge',title:'구름 다리\n건축가',short:'구름 다리 건축가',subject:'MATHEMATICS · 수학',line:'수로 잇는 작은 세상',text:'하루의 기차가 기다리고 있어.\n수의 조각으로 구름 사이 다리를 완성해 줘.',goal:'수 감각 · 연산 · 비율'},
 {id:'prism-lab',title:'무지개 빛\n연구소',short:'무지개 빛 연구소',subject:'SCIENCE · 과학',line:'켜고, 섞고, 발견해요',text:'세 가지 빛으로 어떤 색을 만들까?\n생각한 뒤 직접 켜 보고, 필터도 바꿔 봐.',goal:'빛의 혼합 · 필터 · 실험'},
 {id:'living-forest',title:'숲의 연결\n탐험대',short:'숲의 연결 탐험대',subject:'NATURE · 자연',line:'우리는 모두 이어져 있어요',text:'햇빛에서 작은 잎으로, 잎에서 숲의 친구로.\n살아 있는 숲의 연결을 찾아 줘.',goal:'관찰 · 먹이 관계 · 순환'}
 ];let world,chosen=0;const $=s=>document.querySelector(s);let profile;try{profile=JSON.parse(localStorage.getItem('my-sia-v1'));}catch{}
 const recognized=profile?.onboardingCompleted&&profile.age>=5&&profile.age<=13;
 $('#cards').innerHTML=games.map((g,i)=>'<button class="card" data-game="'+i+'" aria-pressed="'+(i===0)+'"><small>'+g.subject+'</small><strong>'+g.short+'</strong><span class="line">'+g.line+'</span><span class="num">0'+(i+1)+'</span></button>').join('');
 function choose(i){chosen=i;const g=games[i];world?.dispose();try{world=window.AstraWorld.create({canvas:$('#world'),game:g.id,onPick:()=>{}});}catch(e){console.error(e);$('#error').hidden=false;$('#error').textContent='입체 미리보기를 열지 못했어요. 아래에서 게임을 골라 직접 열어 주세요.';}
 $('#title').textContent=g.title;$('#subject').textContent=g.subject;$('#description').textContent=g.text;$('#goal').textContent=g.goal;$('#start').href='../../?adventure='+g.id+'#play';$('#cards').querySelectorAll('button').forEach((b,n)=>b.setAttribute('aria-pressed',n===i));$('#loading').hidden=true;
 }
 $('#cards').addEventListener('click',e=>{const b=e.target.closest('[data-game]');if(b)choose(+b.dataset.game);});
 if(recognized)$('#profile-note').textContent=profile.name+'의 나이와 현재 레벨로 시작해요.';
 window.addEventListener('pagehide',()=>world?.dispose());choose(0);
})();
