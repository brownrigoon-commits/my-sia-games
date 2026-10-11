(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CloudParkCore=api;})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const BANDS=['K','E1','E2','E3'];
 const META={
  'carousel-pattern':{ko:'구름 회전목마',en:'Cloud Carousel',subject:'수학 · 관찰',subjectEn:'Math · Observation',intro:['말들을 둘러보고, 비밀 좌석을 찾아 타 볼까?','Look around the horses. Find your secret seat and take a ride.']},
  'sky-rail':{ko:'하늘 레일 여행',en:'Sky Rail Journey',subject:'수학 · 설계',subjectEn:'Math · Building',intro:['레일을 이어 구름 너머 정거장으로 출발!','Build the track, then ride to the station beyond the clouds.']},
  'balloon-safari':{ko:'열기구 사진 탐험',en:'Balloon Photo Safari',subject:'자연 · 과학',subjectEn:'Nature · Science',intro:['열기구에 올라, 발견한 풍경을 사진에 담아 줘.','Climb into your balloon. Photograph the wonders you discover.']}
 };
 const OBJECTS=[
  {id:'flowers',ko:'나비 꽃밭',en:'Butterfly garden',clues:[['나비가 날아다니는 꽃밭을 찍어 줘.','Photograph the flowers with fluttering butterflies.'],['꽃가루를 옮기는 곤충이 찾아오는 곳을 찍어 줘.','Find the place visited by insects that carry pollen.'],['곤충이 꿀을 얻고, 식물은 꽃가루를 옮길 수 있는 곳을 찍어 줘.','Photograph a place where insects get nectar and plants get help moving pollen.'],['곤충과 식물이 서로 도움을 주는 관계를 관찰할 곳을 찍어 줘.','Find a place to observe a mutually helpful relationship between insects and plants.']],fact:['나비는 꽃의 꿀을 먹으며 꽃가루를 옮기기도 해.','Butterflies drink nectar and can carry pollen between flowers.']},
  {id:'waterfall',ko:'반짝 폭포',en:'Waterfall',clues:[['아래로 흐르는 폭포를 찍어 줘.','Photograph the waterfall flowing down.'],['높은 곳에서 낮은 곳으로 물이 흐르는 곳을 찍어 줘.','Find water flowing from a high place to a low place.'],['중력 때문에 물이 아래로 내려오는 곳을 찍어 줘.','Find water moving downward because of gravity.'],['높이 에너지가 물의 움직임으로 바뀌는 풍경을 찍어 줘.','Find a scene where energy from height becomes moving water.']],fact:['중력이 물을 아래로 끌어당겨 폭포가 흘러.','Gravity pulls the water downward, making the waterfall flow.']},
  {id:'tree',ko:'초록 나무',en:'Green tree',clues:[['커다란 초록 나무를 찍어 줘.','Photograph the big green tree.'],['뿌리로 물을 빨아들이고 잎으로 빛을 받는 식물을 찍어 줘.','Find a plant that takes in water through roots and light through leaves.'],['빛과 물, 이산화탄소로 양분을 만드는 생물을 찍어 줘.','Find a living thing that makes food using light, water and carbon dioxide.'],['광합성으로 탄소를 받아들이고 산소를 내놓는 생물을 찍어 줘.','Find an organism that takes in carbon and releases oxygen during photosynthesis.']],fact:['나무는 잎에서 빛을 이용해 스스로 양분을 만들어.','Trees use light in their leaves to make their own food.']},
  {id:'windmill',ko:'바람 풍차',en:'Windmill',clues:[['빙글빙글 도는 풍차를 찍어 줘.','Photograph the spinning windmill.'],['바람의 힘으로 날개가 돌아가는 건물을 찍어 줘.','Find the building whose blades turn in the wind.'],['움직이는 공기의 에너지를 회전 운동으로 바꾸는 장치를 찍어 줘.','Find a device that turns moving air into rotation.'],['연료를 태우지 않고 공기의 운동 에너지를 이용하는 장치를 찍어 줘.','Find a device that uses the kinetic energy of air without burning fuel.']],fact:['바람이 날개를 밀면 풍차가 돌아가.','Wind pushes the blades and makes the windmill turn.']},
  {id:'solar',ko:'태양광 지붕',en:'Solar roof',clues:[['파란 판이 놓인 집 지붕을 찍어 줘.','Photograph the house with blue panels on the roof.'],['햇빛으로 전기를 만드는 파란 판을 찍어 줘.','Find blue panels that make electricity from sunlight.'],['빛 에너지를 전기 에너지로 바꾸는 장치를 찍어 줘.','Find a device that turns light energy into electrical energy.'],['움직이는 날개 없이 햇빛을 전기로 바꾸는 장치를 찍어 줘.','Find a device that converts sunlight into electricity without moving blades.']],fact:['태양광 전지판은 햇빛을 받아 전기를 만들어.','Solar panels turn sunlight into electricity.']},
  {id:'rainbow',ko:'무지개 다리',en:'Rainbow arch',clues:[['여러 색깔의 무지개를 찍어 줘.','Photograph the colourful rainbow.'],['빛이 여러 색으로 나뉜 무지개를 찍어 줘.','Find a rainbow with light separated into many colours.'],['물방울에서 빛이 굴절하고 반사되어 보이는 색 띠를 찍어 줘.','Find coloured bands formed when light bends and reflects in water droplets.'],['파장에 따라 빛이 다르게 굴절하면서 만들어지는 색 띠를 찍어 줘.','Find coloured bands made as different wavelengths of light bend differently.']],fact:['햇빛이 물방울을 지나며 꺾이고 반사되면 여러 색의 무지개가 보여.','Sunlight bends and reflects in water droplets, forming the colours of a rainbow.']}
 ];
 const mod=(a,n)=>(a%n+n)%n;
 function random(seed){let x=seed>>>0;return()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296);}
 function make(id,band,level,lang='ko',round=0,seed=1){
  if(!META[id]||!BANDS.includes(band)||!Number.isInteger(level)||level<1||level>5)throw Error('Invalid cloud park challenge');
  const b=BANDS.indexOf(band),r=random(seed+round*197),t=(ko,en)=>lang==='en'?en:ko,base={id,band,level,lang,round};
  if(id==='carousel-pattern'){
   const seats=b<2?6:8,start=Math.floor(r()*seats),dir=b===0||level<3?1:-1;let steps=1+Math.floor(r()*(b===0?Math.min(4,level):seats)),prompt;
   const direction=t(dir===1?'번호가 커지는 쪽':'번호가 작아지는 쪽',dir===1?'toward increasing numbers':'toward decreasing numbers');
   if(b===0)prompt=t((start+1)+'번 말에서 '+steps+'칸 앞으로! 다음에 탈 말은?', 'Start at horse '+(start+1)+'. Move forward '+steps+' seats. Which horse?');
   if(b===1){steps+=level>=4?seats:0;prompt=t((start+1)+'번에서 '+direction+'으로 '+steps+'칸 이동해 줘.', 'From horse '+(start+1)+', move '+steps+' seats '+direction+'.');}
   if(b===2){steps=[1,2,4,6,3][level-1];prompt=t((start+1)+'번에서 '+direction+'으로 '+(steps*45)+'° 이동하면 어느 말일까?', 'From horse '+(start+1)+', move '+(steps*45)+'° '+direction+'. Which horse?');}
   if(b===3){steps=[10,12,14,18,22][level-1];prompt=t((start+1)+'번에서 '+direction+'으로 '+(steps/8)+'바퀴 이동한 자리를 찾아 줘.', 'Start at '+(start+1)+'. Move '+(steps/8)+' turns '+direction+'. Find the final seat.');}
   return {...base,seats,start,steps,dir,answer:mod(start+dir*steps,seats),prompt,hint:t('위에서 보며 번호 순서대로 세어 봐. '+seats+'번 다음은 1번이야.','Use the overhead view. After '+seats+' comes 1.'),explanation:t('한 바퀴를 돌면 같은 자리로 돌아와. '+(start+1)+'번에서 '+steps+'칸 이동하면 '+(mod(start+dir*steps,seats)+1)+'번이야.','A full turn returns to the same seat. Moving '+steps+' seats from '+(start+1)+' lands on '+(mod(start+dir*steps,seats)+1)+'.')};
  }
  if(id==='sky-rail'){
   const slots=b===0?(level<4?2:3):b===1?(level<4?3:4):b===2?(level<4?3:4):(level===1?3:4),unit=b===2?(level<3?2:4):b===3?10:1,values=b===0?(level===1?[1,2]:[1,2,3]):b===1?[1,2,3+level]:b===2?(level===1?[1,2]:level===2?[1,2,3]:level===5?[1,2,3,5]:[1,2,3,4]):[2,5,10,15],parts=Array.from({length:slots},()=>values[Math.floor(r()*values.length)]),goal=parts.reduce((a,c)=>a+c,0),format=v=>b===2?(v%unit===0?''+v/unit:v+'/'+unit):''+(v/unit),minutes=[1,2,.5,2.5,5][level-1],speed=b===3?Number((goal/10/minutes).toFixed(3)):0;
   return {...base,slots,unit,values,goal,answer:parts,formatValues:values.map(format),target:format(goal),prompt:b===3?t('분속 '+speed+' km로 '+minutes+'분 여행! 레일 '+slots+'개로 필요한 거리를 만들어 줘.','Travel for '+minutes+' minutes at '+speed+' km per minute. Build the distance with '+slots+' rails.'):t('정거장까지 '+format(goal)+' km! 레일 '+slots+'개를 이어 줘.','The station is '+format(goal)+' km away. Join '+slots+' rails.'),hint:t('레일은 여러 번 쓸 수 있어. 합이 목표와 같아야 해.','You may reuse a rail. Their total must match the distance.'),explanation:t('이어 붙인 레일의 길이를 모두 더하면 이동 거리가 돼. 이제 직접 타 보자!','Adding the rail lengths gives the travel distance. Now let’s ride!')};
  }
  // A stable shuffled itinerary gives three different discoveries per session.
  const stable=random(seed),itinerary=OBJECTS.map((_,i)=>i);for(let i=5;i>0;i--){const j=Math.floor(stable()*(i+1));[itinerary[i],itinerary[j]]=[itinerary[j],itinerary[i]];}
  const target=OBJECTS[itinerary[round%3]],clue=target.clues[b];
  return {...base,answer:target.id,targetName:target[lang],prompt:(level<=2?t(target.ko+' 관찰: ',target.en+' study: '):'')+clue[lang==='en'?1:0],hint:t('화면을 밀어 둘러보고, 풍경을 가운데에 놓은 뒤 찰칵!','Drag to look around. Centre a discovery, then take a photo!'),explanation:target.fact[lang==='en'?1:0],tolerance:Math.max(.10,.26-b*.035-level*.012),yawOffset:(seed%40)/100};
 }
 function check(task,answer){if(task.id==='carousel-pattern')return Number.isInteger(answer)&&answer===task.answer;if(task.id==='sky-rail')return Array.isArray(answer)&&answer.length===task.slots&&answer.every(v=>task.values.includes(v))&&answer.reduce((a,c)=>a+c,0)===task.goal;return typeof answer==='string'&&answer===task.answer;}
 return {BANDS,META,OBJECTS,make,check,mod};
});
