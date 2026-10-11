/* Evidence-led journeys shared by the eleven MY SIA worlds. No network or storage. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SiaJourneyCore=api;})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const BANDS=['K','E1','E2','E3'];
 const TITLES={
  'star-mail':[['편지의 섬','별빛 부두','친구의 정원'],['Letter Island','Starlight Dock','Friendship Garden']],
  'cloud-bridge':[['측량 전망대','구름 계곡','기차 종점'],['Survey Lookout','Cloud Valley','Train Terminal']],
  'prism-lab':[['빛의 온실','색 그림자 숲','반짝 등대'],['Light House','Colour Forest','Glimmer Beacon']],
  'living-forest':[['풀밭 관찰소','연못 산책길','나무 위 쉼터'],['Meadow Watch','Pond Trail','Canopy Hideout']],
  'story-studio':[['이야기 정원','단서의 무대','작은 영화관'],['Story Garden','Clue Stage','Little Cinema']],
  'balance-port':[['화물 부두','탐사선 정박지','달빛 창고'],['Cargo Dock','Explorer Berth','Moon Store']],
  'circuit-workshop':[['에너지 정원','전선의 섬','반딧불 마을'],['Energy Garden','Wire Island','Firefly Village']],
  'habitat-rangers':[['개구리 연못','나비의 초원','새들의 숲'],['Frog Pond','Butterfly Meadow','Bird Woodland']],
  'carousel-pattern':[['티켓 정원','회전 전망대','별의 축제'],['Ticket Garden','Turn Lookout','Star Festival']],
  'sky-rail':[['구름 정거장','바람 신호소','무지개 종점'],['Cloud Station','Wind Signal','Rainbow Terminal']],
  'balloon-safari':[['바람의 정원','물빛 계곡','햇살 숲'],['Wind Garden','Water Valley','Sunlit Woodland']]
 };
 function rng(seed){let x=seed>>>0;return()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296);}
 function shuffle(items,r){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 const mod=(n,m)=>(n%m+m)%m;
 function make(game,task,seed,chapter=0){
  if(!TITLES[game])throw Error('Unknown journey');
  const lang=task.lang==='en'?'en':'ko',en=lang==='en',t=(ko,eng)=>en?eng:ko,b=Math.max(0,BANDS.indexOf(task.band)),level=task.level||1,r=rng(seed+chapter*7919+game.length*101),variant=mod((seed>>>0)+chapter,3),n=2+Math.floor(r()*(b+level+2)),nodes=[];
  const node=(model,name,text,quantity=1,tag='',colors)=>{const o={id:game+':'+chapter+':'+nodes.length,model,name,text,quantity:Math.max(1,Math.min(8,quantity)),tag:String(tag),colors};nodes.push(o);return o;};
  let question,correct,wrong,why,intro;
  const numeric=(value,unit='',step=1)=>{correct=String(Number(value.toFixed(3)))+unit;wrong=[value+step,Math.max(0,value-step),value+step*2].map(v=>String(Number(v.toFixed(3)))+unit).filter(v=>v!==correct);};
  const concept=(q,yes,no,explanation)=>{question=q;correct=yes;wrong=no;why=explanation;};
  if(game==='carousel-pattern'){
   node('horse',t('하루의 티켓','Haru’s ticket'),t('하루는 '+(task.start+1)+'번에서 출발해. 말은 모두 '+task.seats+'마리야.','Haru starts at '+(task.start+1)+'. There are '+task.seats+' horses.'),task.seats,task.start+1);
   node('wheel',t('회전 안내판','Turn guide'),t('한 바퀴는 '+task.seats+'칸. 번호는 '+task.seats+' 다음에 1로 이어져.','One turn is '+task.seats+' seats. After '+task.seats+' comes 1.'),1,task.seats);
   const extra=b<2?1+Math.floor(r()*Math.min(3,level)):task.seats/2,forward=b===0||variant!==1;
   question=t('방금 '+(task.answer+1)+'번에 도착했어! 친구는 번호가 '+(forward?'커지는':'작아지는')+' 쪽으로 '+extra+'칸 떨어져 있어. 어디서 만날까?','You arrived at '+(task.answer+1)+'! Your friend is '+extra+' seats toward '+(forward?'increasing':'decreasing')+' numbers. Where will you meet?');
   const next=mod(task.answer+(forward?extra:-extra),task.seats)+1;correct=t(next+'번','Horse '+next);wrong=[1,2,3].map(i=>t((mod(next-1+i,task.seats)+1)+'번','Horse '+(mod(next-1+i,task.seats)+1)));
   why=t('도착한 자리에서 다시 세면 '+next+'번이야. 첫 출발 자리로 돌아가서 세지 않아.','Continue counting from the seat you reached: '+next+'. Do not restart from the original seat.');intro=t('하루의 티켓을 찾고 회전 안내판을 살펴봐. 그 단서로 말을 타고 친구를 만나자.','Find Haru’s ticket and the turn guide. Use them to ride and meet a friend.');
  }else if(game==='sky-rail'){
   node('station',t('정거장 표지판','Station sign'),task.prompt,1,task.target+' km');
   node('train',t('돌아오는 열차','Return train'),t('이 열차는 같은 길을 되돌아와. 돌아올 때는 레일을 새로 만들지 않아.','This train returns along the same track. It does not need a new track for the return.'),1,'↔');
   const distance=task.goal/task.unit;
   if(b===3){question=t('방금 간 '+distance+' km를 같은 속력 '+(distance/[1,2,.5,2.5,5][level-1])+' km/분으로 되돌아와. 왕복 걸린 시간은?','Return along the '+distance+' km track at the same speed. How many minutes for the whole round trip?');numeric([1,2,.5,2.5,5][level-1]*2,t('분',' min'),.5);}
   else{question=t('방금 간 길은 '+distance+' km야. 같은 길로 되돌아오면 모두 몇 km를 달릴까?','You travelled '+distance+' km. If you return along the same track, how far have you travelled in all?');numeric(distance*2,' km',1/task.unit);}
   why=t('왕복은 가는 길과 오는 길을 모두 더해. 같은 길이라 길이도 같아.','A round trip includes both outward and return journeys. The same track has the same length.');intro=t('목적지와 돌아오는 열차를 살펴보고, 이어질 여행을 계획해 줘.','Inspect the destination and return train. Plan a journey that connects them.');
  }else if(game==='balloon-safari'){
   const target=task.answer;
   const models={flowers:'flowers',waterfall:'water',tree:'tree',windmill:'windmill',solar:'solar',rainbow:'rainbow'};
   node(models[target],task.targetName,task.explanation,target==='flowers'?n:1);
   const cases={
    flowers:[['꽃을 찾는 나비','Visiting butterflies'],['꽃이 사라지면 나비가 얻기 어려워지는 것은?','If the flowers disappear, what becomes harder for butterflies to find?'],['꿀','Nectar'],[['돌','Stones'],['전기','Electricity']],['꽃은 나비에게 꿀을 주고, 나비는 꽃가루를 옮길 수 있어.','Flowers provide nectar; butterflies can carry pollen.'],'butterfly'],
    waterfall:[['높은 물길','High stream'],['폭포 아래의 물이 저절로 높은 곳으로 돌아갈까?','Will water below the waterfall return uphill by itself?'],['아니, 물을 올릴 에너지가 필요해','No, lifting water requires energy'],[['언제나 저절로 올라가','It always rises by itself'],['물의 색만 바꾸면 돼','Just change its colour']],['중력에 거슬러 물을 올리려면 펌프 같은 장치에 에너지를 공급해야 해.','Lifting water against gravity requires energy, for example from a pump.'],'water'],
    tree:[['잎의 관찰소','Leaf lookout'],['나무가 양분을 만들 때 쓸 빛이 며칠 동안 줄어들면?','If the light available to the tree drops for several days, what happens?'],['광합성에 쓸 빛이 줄어','Less light is available for photosynthesis'],[['뿌리가 사라져','Its roots disappear'],['물을 전혀 안 써','It no longer uses any water']],['나무의 잎은 빛을 이용해 양분을 만들어. 빛도 성장 조건 중 하나야.','Leaves use light to make food. Light is one of the conditions for growth.'],'leaf'],
    windmill:[['바람계','Wind gauge'],['바람이 잦아들면 이 풍차의 날개는 어떻게 될까?','When the wind dies down, what happens to this windmill?'],['느려지거나 멈춰','It slows or stops'],[['더 빨라져','It always speeds up'],['햇빛만으로 돌아','Sunlight alone turns it']],['이 풍차의 날개를 미는 것은 움직이는 공기야.','Moving air is what pushes this windmill’s blades.'],'windmill'],
    solar:[['구름 관찰소','Cloud lookout'],['구름이 햇빛을 많이 가리면 태양광 전기의 양은?','When clouds block much of the sunlight, the solar panels produce…'],['줄어들 수 있어','Potentially less electricity'],[['반드시 늘어나','Always more electricity'],['바람으로 똑같이 만들어','The same amount from wind']],['태양광 전지판은 받은 빛을 전기로 바꾸기 때문에 햇빛의 양이 영향을 줘.','Solar panels convert received light into electricity, so available sunlight matters.'],'solar'],
    rainbow:[['빛과 물방울','Light and droplets'],['하늘의 무지개를 만들 조건으로 알맞은 짝은?','Which pair can produce a rainbow in the sky?'],['햇빛과 물방울','Sunlight and water droplets'],[['돌과 흙','Stones and soil'],['바람과 종이','Wind and paper']],['물방울이 햇빛을 굴절시키고 반사해 여러 색이 보여.','Water droplets refract and reflect sunlight, revealing its colours.'],'rainbow']
   },c=cases[target];node(c[5],t(...c[0]),t(...c[4]),1,t('관찰','LOOK'));concept(t(...c[1]),t(...c[2]),c[3].map(x=>t(...x)),t(...c[4]));
   intro=t('섬의 두 관찰 지점을 살펴봐. 사진을 찍은 뒤 그 풍경에 변화가 생기면 어떻게 될지 생각해 보자.','Visit both observation spots. After your photograph, predict what a change would do to the scene.');
  }else if(game==='balance-port'){
   node('cargo',t('화물 송장','Cargo manifest'),t('이번 탐사선에는 '+task.targetLabel+' kg을 실어야 해.','This expedition needs '+task.targetLabel+' kg of cargo.'),Math.min(6,task.goal),task.targetLabel+' kg');
   const extra=(b<2?1+variant:variant+1)/task.unit,unload=variant===1&&b>0,delta=unload?-extra:extra;
   node('parcel',t('다음 부두의 소포','Next dock’s parcel'),t('다음 부두에서는 '+extra+' kg 소포를 '+(unload?'내릴':'더 받을')+' 거야.','At the next dock, '+(unload?'unload':'collect')+' a '+extra+' kg parcel.'),1,delta+' kg');
   question=t('균형을 맞춘 '+task.goal/task.unit+' kg을 싣고 다음 부두에 갔어. 부탁을 마친 뒤 배에 남는 질량은?','Take the balanced '+task.goal/task.unit+' kg to the next dock. After completing its request, what mass remains aboard?');numeric(task.goal/task.unit+delta,' kg',1/task.unit);why=t(unload?'내린 소포의 질량은 총질량에서 빼야 해.':'새 소포를 받으면 첫 화물과 새 소포의 질량을 더해.',unload?'Subtract the mass of the parcel you unloaded.':'Add the initial cargo mass and the new parcel mass.');intro=t('두 부두를 살펴보고 실을 화물을 알아내자. 저울을 맞춘 다음, 이어지는 배달도 맡아 줘.','Inspect both docks. Balance the first cargo, then plan the next delivery.');
  }else if(game==='cloud-bridge'){
   node('ruler',t('측량 표지','Survey marker'),task.expression||task.prompt,1,String(task.target));
   const extra=b<2?1+variant:variant+2;node('train',t('추가 구간','Extra section'),t('첫 다리를 건너면 '+extra+'만큼 더 긴 다리가 필요해.','After this bridge, the next bridge needs '+extra+' more units.'),extra,'+'+extra);
   question=t('첫 다리의 값은 '+task.target+'였어. 다음 다리의 목표값은?','The first bridge totals '+task.target+'. What target is needed for the next bridge?');numeric(task.target+extra,'',extra);why=t('이전 다리에 필요한 값에 추가 구간을 더해 다음 목표를 구해.','Add the extra section to the previous bridge target.');intro=t('다리 양쪽을 둘러보며 측량 표지와 다음 구간을 찾아 줘.','Explore both banks. Find the survey marker and the next section.');
  }else if(game==='circuit-workshop'){
   node('battery',t('전지 정원','Battery garden'),t('전지는 회로에 에너지를 공급해. 전구가 계속 켜지려면 돌아오는 길도 필요해.','A battery supplies energy. The lamp needs a complete return path to stay on.'),1,'+ −');
   node('switch',t('다리 스위치','Bridge switch'),t('이 스위치는 두 선 사이를 연결하거나 벌려. 눌러서 움직임을 살펴봐.','This switch joins or separates the wires. Tap to inspect its movement.'),1,'↔');
   const closed=variant===1;
   concept(t(closed?'완성한 회로의 스위치를 계속 닫아 두면 전구는?':'완성한 회로의 스위치를 열어 길을 끊으면 전구는?',closed?'Keep the switch closed in your completed circuit. The lamp…':'Open the switch in your completed circuit. The lamp…'),t(closed?'켜진 상태를 유지해':'꺼져',closed?'Stays lit':'Goes out'),[t(closed?'반드시 꺼져':'계속 켜져',closed?'Must go out':'Stays lit'),t('전지 없이 더 밝아져','Gets brighter without a battery')],t('닫힌 스위치는 길을 이어 주고 열린 스위치는 끊어. 완전한 고리가 있어야 전류가 계속 흘러.','A closed switch connects the path; an open one breaks it. Current needs a complete loop.'));
   intro=t('전지와 스위치를 직접 살펴보고, 어두운 마을에 불을 켜 줘.','Inspect the battery and switch. Bring light back to the village.');
  }else if(game==='habitat-rangers'){
   const species=variant===0?'frog':variant===1?'butterfly':'bird',need=variant===0?'water':variant===1?'meadow':'forest',names={frog:t('개구리','Frog'),butterfly:t('나비','Butterfly'),bird:t('새','Bird')},homes={water:t('연못','Pond'),meadow:t('꽃밭','Flower meadow'),forest:t('숲','Woodland')};
   node(species,names[species]+t('의 부탁','’s request'),t(names[species]+'가 '+homes[need]+' 가까이에 살 곳을 찾고 있어. 숲과도 오갈 수 있으면 좋아.',names[species]+' is looking for a home near '+homes[need]+', with a way to reach woodland.'),2+variant);
   node(need==='water'?'water':need==='meadow'?'flowers':'tree',t('생태 지도','Habitat map'),Object.entries(task.counts).filter(([,v])=>v).map(([k,v])=>task.labels[k]+' '+v).join(' · '),Math.min(4,task.counts[need]),'↔');
   concept(t(names[species]+'를 위해 먼저 보호해야 할 곳은?', 'Which place should we protect first for the '+names[species]+'?'),homes[need],Object.entries(homes).filter(([k])=>k!==need).map(([,v])=>v),t('방금 관찰한 먹이와 물, 쉴 곳이 연결되면 동물이 이용할 수 있는 서식지가 돼.','Connecting the food, water and shelter you observed creates a usable habitat.'));
   intro=t('동물의 부탁과 생태 지도를 모아, 실제로 필요한 이웃을 만들어 줘.','Collect an animal’s request and the habitat map. Build the neighbours it needs.');
  }else if(game==='living-forest'){
   const tokens=task.tokens||[],first=tokens.find(x=>x.id===task.answer[0]),last=tokens.find(x=>x.id===task.answer.at(-1));
   node('leaf',t('숲의 첫 단서','First forest clue'),(first?.label||'')+' · '+task.hint,1);
   node('bird',t('이어진 생명','Connected life'),t('생물은 먹이와 살 곳을 통해 다른 생물과 이어져 있어. 화살표의 뜻도 살펴봐.','Living things depend on other living things for food and habitat. Notice what the arrows mean.'),2+variant,last?.label||'');
   const forestCases=[
    [b<2?t('풀을 먹는 동물에게 풀이 크게 줄어들면?','When grass becomes scarce, what happens to a grass-eating animal?'):t('먹이 관계의 한 생물이 크게 줄면 무엇을 함께 살펴봐야 할까?','If one organism in a food relationship becomes scarce, what else should we examine?'),b<2?t('먹이를 찾기 어려워져','Food becomes harder to find'):t('그 생물과 연결된 먹이와 포식자','Its linked food sources and predators'),[t('다른 생물과 아무 관계 없어','It has no connection to other life'),t('모든 동물이 바로 사라져','Every animal immediately disappears')]],
    [t('숲의 낙엽을 분해하는 생물이 없다면 무엇이 어려워질까?','Without organisms that break down fallen leaves, what becomes harder?'),t('낙엽 속 물질이 다시 흙에서 이용되는 일','Returning materials in leaves for reuse in the soil'),[t('햇빛이 숲에 비추는 일','Sunlight reaching the forest'),t('지구가 회전하는 일','Earth rotating')]],
    [b<2?t('숲에 같은 먹이를 먹는 동물이 늘면 무엇을 살펴볼까?','If more animals eat the same food, what should we check?'):t('같은 먹이를 먹는 두 종이 늘었어. 경쟁을 판단할 추가 증거는?','Two species eating the same food have increased. Which further evidence helps assess competition?'),t('먹이의 양과 동물들이 먹는 양','Available food and how much the animals eat'),[t('나무의 이름만','Only the trees’ names'),t('동물의 색깔만','Only the animals’ colours')]]
   ],fc=forestCases[variant];concept(fc[0],fc[1],fc[2],t('숲의 생물은 먹이와 물질의 이동으로 이어져 있어. 하나의 단서만으로 모두 단정하지 말고 연결된 증거를 살펴봐.','Forest life is linked through food and materials. Examine connected evidence instead of drawing conclusions from one clue.'));
   intro=t('잎과 동물의 흔적을 따라가 보자. 생명을 연결한 뒤 숲의 변화를 예상해 줘.','Follow leaves and animal traces. Connect life, then predict a change in the forest.');
  }else if(game==='prism-lab'){
   const rgb=['red','green','blue'],sources=task.answer.filter(v=>rgb.includes(v)),names={red:t('빨강','red'),green:t('초록','green'),blue:t('파랑','blue'),yellow:t('노랑','yellow'),magenta:t('자홍','magenta'),cyan:t('청록','cyan'),white:t('하양','white'),dark:t('어둠','darkness')},mix=values=>names[['dark','red','green','yellow','blue','magenta','cyan','white'][values.reduce((mask,v)=>mask|({red:1,green:2,blue:4}[v]||0),0)]],sourceName=sources.map(v=>names[v]).join(' + ');
   node('prism',t('빛 실험대','Light experiment'),t('이번 연구에 필요한 광원은 '+sourceName+'이야. 빛의 성분이 겹쳐져. 물감과는 달라.','This study uses '+sourceName+' sources. Their light components add together; this is not paint.'),sources.length,mix(sources),sources);
   node('lamp',t('색 등대','Colour beacon'),b<2?t('광원 하나를 끄면 그 성분이 빠지고, 켜진 광원의 성분은 남아.','Turning off a source removes that component, leaving the others.'):t('이상적 색 필터는 같은 RGB 성분만 통과시켜. 입력에 없는 성분을 만들어 내지는 않아.','An ideal colour filter passes only its matching RGB component. It cannot create a component absent from the input.'),1,'✦',sources);
   const removed=sources[variant%sources.length],newFilter=rgb.filter(v=>v!==task.filterAnswer)[variant%2],out=b<2?mix(sources.filter(v=>v!==removed)):mix(sources.includes(newFilter)?[newFilter]:[]);
   concept(b<2?t('네가 켠 광원에서 '+names[removed]+'을 끄면 어떤 빛이 남을까?','Switch off '+names[removed]+' from the sources you used. What light remains?'):t('광원은 네 실험 그대로 두고 필터만 '+names[newFilter]+'으로 바꾸면 출력은?','Keep your experiment’s sources unchanged. Replace only the filter with '+names[newFilter]+'. What is the output?'),out,[...new Set([mix(sources),names[newFilter],names[removed],names.white,names.dark])].filter(v=>v!==out),t('바꾼 조건과 그대로 둔 조건을 나눠 생각해. 결과는 '+out+'이야.','Separate what changed from what stayed fixed. The output is '+out+'.'));
   intro=t('관찰소에서 광원과 필터를 살펴봐. 연구소에서 실험한 다음, 조건 하나를 바꾸면 어떻게 될지 예측하자.','Inspect the sources and filters. Complete the lab experiment, then predict what changing one condition will do.');
  }else if(game==='story-studio'){
   const scene=task.scene,cards=task.cards.filter(c=>c.order>=0).sort((a,b)=>a.order-b.order);
   node({plant:'leaf',bridge:'ruler',kite:'kite',rain:'water',lamp:'lamp',bird:'bird'}[scene]||'parcel',t('첫 장면의 단서','Opening clue'),cards[0].text,1,'01');
   node(scene==='bird'?'tree':scene==='plant'?'flowers':'parcel',t('마지막 장면의 단서','Ending clue'),cards.at(-1).text,1,String(cards.length).padStart(2,'0'));
   const endings={plant:[['빛과 물을 살피며 계속 돌봐요','Keep checking light and water'],['어두운 상자에 늘 가둬요','Keep it in a dark box'],['뿌리를 매일 뽑아요','Pull out its roots every day']],bridge:[['건너기 전에 안전을 확인해요','Check safety before crossing'],['점검 없이 모두 뛰어가요','Everyone runs across without checking'],['나무판을 모두 빼요','Remove every plank']],kite:[['넓고 안전한 곳에서 바람을 살펴요','Check the wind in a safe open space'],['전선 옆에서 날려요','Fly beside power lines'],['나무 속으로 달려요','Run into the trees']],rain:[['비가 멎었는지 살펴 우산을 접어요','Check the rain has stopped before folding the umbrella'],['우산이 비를 만든다고 생각해요','Assume the umbrella creates rain'],['비가 와도 물건을 밖에 두어요','Leave things outside in the rain']],lamp:[['전지와 스위치를 확인해요','Check the battery and switch'],['불이 안 켜져도 볼 수 있다고 해요','Pretend you can see without light'],['렌즈를 흙으로 덮어요','Cover the lens with soil']],bird:[['멀리서 조용히 관찰해요','Watch quietly from a distance'],['새를 쫓으며 소리쳐요','Chase the bird and shout'],['새집을 계속 흔들어요','Keep shaking its home']]}[scene];
   concept(t('네가 이어 만든 이야기 다음에 하루가 하면 좋을 행동은?','After the story you assembled, what should Haru do next?'),t(...endings[0]),endings.slice(1).map(v=>t(...v)),t('앞 장면의 문제와 해결을 생각하면, 그다음 행동도 자연스럽게 이어져.','Thinking about the problem and its solution helps the next action follow naturally.'));
   intro=t('무대 주변에서 첫 장면과 마지막 단서를 찾아 줘. 사이를 이어 네 영화의 결말까지 정해 보자.','Explore the set for the opening and ending clues. Connect them and direct what happens next.');
  }else{
   const ordered=task.answer.map(id=>task.tokens.find(x=>x.id===id)?.label||id),last=ordered.at(-1);
   node('mail',t('우체부의 단서','Courier’s clue'),t('첫 조각은 “'+ordered[0]+'”. 편지의 나머지도 이어 읽어 줘.','The first piece is “'+ordered[0]+'”. Read how the rest connects.'),1,'✉');
   const stamp=1+variant;node('parcel',t('배달 약속','Delivery promise'),t('친구는 편지의 마지막 내용을 다시 듣고 싶어 해. 다 만든 뒤 끝까지 읽어 줘.','Your friend wants to hear the last part again. Read to the end when the letter is ready.'),stamp,'↗');
   const position=variant===0?0:variant===1?ordered.length-1:Math.min(1,ordered.length-1),part=ordered[position];
   const request=position===0?t('친구가 편지의 첫 부분을 놓쳤어. 어떻게 시작했지?','Your friend missed the start. How did your letter begin?'):position===ordered.length-1?t('편지의 마지막 내용을 친구에게 다시 전해 줘. 무엇이었지?','Tell your friend the last part of your letter. What was it?'):t('친구가 첫 조각 “'+ordered[0]+'”까지만 읽었어. 바로 다음은?','Your friend read only the first piece, “'+ordered[0]+'”. What comes immediately next?');
   nodes[1].text=position===0?t('친구는 편지의 첫 부분을 다시 듣고 싶어 해.','Your friend wants to hear the beginning again.'):position===ordered.length-1?t('친구는 편지의 마지막 내용을 다시 듣고 싶어 해.','Your friend wants to hear the ending again.'):t('친구는 첫 조각 다음에 무엇이 오는지 궁금해해.','Your friend wonders what follows the first piece.');
   concept(request,part,[...ordered.filter(x=>x!==part),t('아직 편지가 없어요','There is no letter yet')],t('조각 하나만 보지 말고 이어진 글을 끝까지 읽으면 전체 뜻을 알 수 있어.','Read the connected message to the end to understand the whole meaning.'));
   intro=t('섬의 우체부와 소포를 찾아 편지의 단서를 모아 줘. 완성한 편지는 친구에게 다시 전할 거야.','Find the courier and parcel. Gather clues for the letter, then tell your friend what it says.');
  }
  const unique=[...new Set([correct,...wrong])];if(unique.length<3)unique.push(t('어느 것도 아니야','None of these'));
  const choices=shuffle(unique.slice(0,3),r).map((label,i)=>({id:'a'+i,label}));
  return {game,chapter,band:task.band,level,lang,variant,zone:TITLES[game][en?1:0][chapter],intro,nodes,question,choices,correct:choices.find(x=>x.label===correct).id,explanation:why,signature:game+':'+seed+':'+chapter};
 }
 function answer(plan,id){return plan.choices.some(c=>c.id===id)&&id===plan.correct;}
 // New observations are idempotent; exploring never changes assessment scores.
 function collect(plan,ids,nodeId){if(!plan.nodes.some(n=>n.id===nodeId)||ids.includes(nodeId))return [...ids];return [...ids,nodeId];}
 function ready(plan,ids){return plan.nodes.every(n=>ids.includes(n.id));}
 return {BANDS,TITLES,make,answer,collect,ready,rng,shuffle};
});
