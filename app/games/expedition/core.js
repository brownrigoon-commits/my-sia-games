(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ExpeditionCore=api;})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const BANDS=['K','E1','E2','E3'];
 const META={
  'story-studio':{ko:'이야기 영화 공방',en:'Story Studio',subject:'언어',subjectEn:'Language',intro:['장면을 이어 한 편의 이야기를 만들어 줘.','Arrange the scenes. Bring a little story to life.']},
  'balance-port':{ko:'우주 화물 항구',en:'Balance Port',subject:'수학',subjectEn:'Math',intro:['화물을 실어 우주 저울의 균형을 맞춰 줘.','Load the cargo. Bring the space scales into balance.']},
  'circuit-workshop':{ko:'반짝 회로 공방',en:'Circuit Workshop',subject:'과학',subjectEn:'Science',intro:['선을 돌려 전기가 흐르는 길을 이어 줘.','Turn the wires. Complete a path for electricity.']},
  'habitat-rangers':{ko:'작은 지구 설계사',en:'Habitat Rangers',subject:'자연',subjectEn:'Nature',intro:['물과 숲, 꽃밭을 놓아 생명이 살 곳을 만들어 줘.','Build a little habitat with water, woodland and flowers.']}
 };
 const text=(lang,ko,en)=>lang==='en'?en:ko;
 function random(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
 function shuffle(a,r){const out=[...a];for(let i=out.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
 const STORIES=[
  {scene:'plant',ko:['하루가 씨앗을 골랐어요.','씨앗을 흙에 심었어요.','흙이 마르자 물을 주었어요.','며칠 뒤 새싹이 나왔어요.','햇빛을 받은 줄기가 자랐어요.','마침내 꽃이 피었어요.'],en:['Haru chose a seed.','The seed went into the soil.','When the soil dried, Haru watered it.','A few days later, a shoot appeared.','The stem grew in the sunlight.','At last, a flower opened.'],extra:['아직 씨앗도 심지 않았는데 꽃을 땄어요.','Haru picked a flower before planting the seed.']},
  {scene:'bridge',ko:['비 때문에 작은 다리가 끊어졌어요.','하루가 양쪽 땅 사이를 살폈어요.','튼튼한 나무판을 모았어요.','나무판으로 새 다리를 놓았어요.','하루가 다리가 안전한지 확인했어요.','친구들이 다리를 건너 집에 갔어요.'],en:['Rain damaged the little bridge.','Haru inspected the gap between the banks.','They gathered strong wooden planks.','They built a new bridge with the planks.','Haru checked that the bridge was safe.','The friends crossed it and went home.'],extra:['다리가 없는데 모두 다리 위에 서 있었어요.','Everyone stood on the bridge before it existed.']},
  {scene:'kite',ko:['바람이 불어 하루는 연을 만들기로 했어요.','종이와 막대를 준비했어요.','막대에 종이를 붙였어요.','연에 긴 꼬리와 줄을 달았어요.','넓은 들판에서 줄을 잡고 달렸어요.','바람을 받은 연이 하늘로 떠올랐어요.'],en:['A breeze inspired Haru to make a kite.','Haru collected paper and sticks.','The paper was attached to the sticks.','A long tail and a string were added.','Haru ran across an open field holding the string.','The wind lifted the kite into the sky.'],extra:['줄을 달기도 전에 줄을 감았어요.','Haru wound the string before attaching one.']},
  {scene:'rain',ko:['먹구름이 모여 하늘이 어두워졌어요.','창문에 빗방울이 떨어졌어요.','하루는 우산을 챙겼어요.','우산을 쓰고 밖으로 나갔어요.','비가 그치고 구름 사이로 해가 나왔어요.','하루는 우산을 접고 무지개를 보았어요.'],en:['Dark clouds gathered overhead.','Raindrops began to tap the window.','Haru fetched an umbrella.','Haru opened it and went outside.','The rain stopped and sunshine broke through.','Haru folded the umbrella and saw a rainbow.'],extra:['계속 비가 오는데 무지개가 비를 만들었어요.','The rainbow made the rain fall.']},
  {scene:'lamp',ko:['밤이 되어 방이 어두워졌어요.','하루는 손전등을 찾았어요.','불이 켜지지 않아 배터리를 살폈어요.','다 쓴 배터리를 새것으로 바꿨어요.','스위치를 누르자 불이 켜졌어요.','밝아진 곳에서 잃어버린 열쇠를 찾았어요.'],en:['Night fell and the room grew dark.','Haru found a torch.','It would not light, so Haru checked the batteries.','The empty batteries were replaced.','The light came on when Haru pressed the switch.','In the light, Haru found the missing key.'],extra:['배터리를 빼자 더 밝은 불이 켜졌어요.','Removing the batteries made the torch brighter.']},
  {scene:'bird',ko:['하루는 땅에 떨어진 새집을 보았어요.','다친 새가 없는지 어른과 살폈어요.','어른이 안전하게 새집을 고쳤어요.','고친 새집을 원래 나무에 달았어요.','하루는 멀리 물러나 조용히 기다렸어요.','새가 나무로 돌아오는 것을 보았어요.'],en:['Haru saw a fallen bird box.','An adult helped check that no bird was hurt.','The adult repaired the box safely.','They attached it to its original tree.','Haru stepped away and waited quietly.','A bird returned to the tree.'],extra:['새를 놀라게 하려고 계속 큰 소리를 냈어요.','Haru kept shouting to frighten the bird.']}
 ];
 function make(id,band,level,lang='ko',round=0,seed=Date.now()){
  if(!META[id]||!BANDS.includes(band)||!Number.isInteger(level)||level<1||level>5)throw Error('Invalid expedition');
  const b=BANDS.indexOf(band),d=b*5+level,r=random(seed+round*97),t=(ko,en)=>text(lang,ko,en);
  if(id==='story-studio'){
   const story=STORIES[(Math.floor(r()*STORIES.length)+round)%STORIES.length],n=Math.min(6,3+Math.floor((d-1)/4)),indices=n===3?[0,3,5]:n===4?[0,1,3,5]:n===5?[0,1,2,4,5]:[0,1,2,3,4,5];
   const cards=indices.map((v,i)=>({id:'scene-'+v,order:i,text:story[lang][v],step:v,scene:story.scene}));
   if(b>=2)cards.push({id:'extra',order:-1,text:story.extra[lang==='en'?1:0],step:-1,scene:story.scene});
   return {id,band,level,round,scene:story.scene,n,cards:shuffle(cards,r),answer:indices.map(v=>'scene-'+v),prompt:t('이야기가 이어지도록 장면 '+n+'개를 골라 차례로 놓아 줘.', 'Choose '+n+' scenes and place them in story order.'),explanation:t('앞에서 일어난 일이 다음 장면의 이유가 돼. 원인과 결과를 이어 읽어 보자.','Earlier events explain what happens next. Read the causes and effects together.')};
  }
  if(id==='balance-port'){
   const unit=b<2?1:b===2?(level<3?2:4):10,goal=(b===0?3:7)+level+round+Math.floor(r()*4),values=b===0?[1,2,3]:b===1?[1,2,5]:b===2?[1,2,3,4]:[1,5,10,20];
   const weights=values.map(v=>({id:'w'+v,value:v,label:b===2?(v%unit===0?''+v/unit:v+'/'+unit):''+(v/unit)}));
   const format=v=>b===2?(v%unit===0?''+v/unit:v+'/'+unit):''+(v/unit);
   return {id,band,level,round,goal,unit,weights,answer:Array(goal).fill('w1'),targetLabel:format(goal),prompt:t(format(goal)+' kg 화물과 저울의 균형을 맞춰 줘.','Balance the '+format(goal)+' kg cargo.'),explanation:t('수평인 저울은 양쪽 질량이 같다는 뜻이야. 작은 무게를 합해 전체 무게를 만들 수 있어.','A level balance has equal mass on both sides. Small masses can add up to the whole.')};
  }
  if(id==='circuit-workshop'){
   const size=b+2,path=[];for(let y=0;y<size;y++)for(let j=0;j<size;j++)path.push(y*size+(y%2?size-1-j:j));
   const dir=(a,c)=>c===a-size?0:c===a+1?1:c===a+size?2:3,tiles=Array(size*size);
   path.forEach((v,i)=>{tiles[v]={ports:[i?dir(v,path[i-1]):3,i<path.length-1?dir(v,path[i+1]):(v%size===0?3:1)],turns:0};});
   const selected=shuffle(path,r).slice(0,Math.min(path.length,level+b*3));selected.forEach(v=>tiles[v].turns=1+Math.floor(r()*3));
   if(checkCircuit({size,tiles,path},tiles.map(x=>x.turns)))tiles[path[0]].turns=(tiles[path[0]].turns+1)%4;
   return {id,band,level,round,size,tiles,path,answer:tiles.map(()=>0),prompt:t('전선 조각을 돌려 전지에서 전구까지 모두 이어 줘.','Turn the wire tiles. Connect the battery to the lamp.'),explanation:t('전기가 계속 흐르려면 전지로 돌아오는 길까지 끊김 없이 이어져야 해. 아래의 고정된 선이 돌아오는 길이야.','Electricity needs an unbroken loop back to the battery. The fixed lower wire is the return path.')};
  }
  const total=5+b*3+Math.min(2,Math.floor(level/2)),water=1+(b>0?1:0),forest=1+Math.min(3,b+Math.floor(level/3)),rock=b>=2?1:0,meadow=total-water-forest-rock;
  const counts={water,forest,meadow,rock},labels={water:t('연못','Ponds'),forest:t('숲','Woods'),meadow:t('꽃밭','Flowers'),rock:t('바위 쉼터','Rock shelters')};
  return {id,band,level,round,total,counts,labels,adjacent:b>=2,answer:[...Array(water).fill('water'),...Array(forest).fill('forest'),...Array(meadow).fill('meadow'),...Array(rock).fill('rock')],prompt:t('개구리와 벌, 새가 함께 살 작은 지구를 만들어 줘.','Build a little home for frogs, bees and birds.'),explanation:t('연못은 개구리에게, 꽃은 벌에게, 숲은 새에게 필요해. 서로 이웃한 서식지는 동물들이 이동하는 데도 도움이 돼.','Frogs need water, bees need flowers, and birds need woodland. Neighbouring habitats also help animals move between them.')};
 }
 function checkCircuit(task,turns){
  if(!Array.isArray(turns)||turns.length!==task.tiles.length)return false;
  const ports=task.tiles.map((tile,i)=>tile.ports.map(p=>(p+turns[i])%4)),start=task.path[0],end=task.path[task.path.length-1],seen=new Set();let current=start,enter=3;
  while(!seen.has(current)){
   seen.add(current);const ps=ports[current];if(!ps.includes(enter))return false;const out=ps.find(p=>p!==enter);if(current===end&&out===(end%task.size===0?3:1))return seen.size===task.tiles.length;
   const x=current%task.size,y=Math.floor(current/task.size),nx=x+[0,1,0,-1][out],ny=y+[-1,0,1,0][out];if(nx<0||ny<0||nx>=task.size||ny>=task.size)return false;current=ny*task.size+nx;enter=(out+2)%4;
  }return false;
 }
 const CELLS=[];for(let q=-2;q<=2;q++)for(let r=-2;r<=2;r++)if(Math.abs(q+r)<=2)CELLS.push({q,r});
 const adjacent=(a,b)=>Math.max(Math.abs(a.q-b.q),Math.abs(a.r-b.r),Math.abs(a.q+a.r-b.q-b.r))===1;
 function check(task,answer){
  if(!Array.isArray(answer))return false;
  if(task.id==='story-studio')return JSON.stringify(answer)===JSON.stringify(task.answer);
  if(task.id==='balance-port')return answer.length>0&&answer.length<=40&&answer.every(id=>task.weights.some(w=>w.id===id))&&answer.reduce((n,id)=>n+task.weights.find(w=>w.id===id).value,0)===task.goal;
  if(task.id==='circuit-workshop')return checkCircuit(task,answer);
  if(answer.length!==CELLS.length||answer.some(v=>v!==null&&!Object.hasOwn(task.counts,v)))return false;
  if(!Object.entries(task.counts).every(([v,n])=>answer.filter(x=>x===v).length===n))return false;
  return !task.adjacent||['water','meadow'].every(v=>answer.some((x,i)=>x===v&&answer.some((y,j)=>y==='forest'&&adjacent(CELLS[i],CELLS[j]))));
 }
 return {META,BANDS,STORIES,CELLS,make,check,checkCircuit,adjacent};
});
