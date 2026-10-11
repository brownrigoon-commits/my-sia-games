(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SiaGameBridge=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 // Content games from the my-sia-stories repository (SPEC.md §8, LEVELS.md §4): one self-contained page each,
 // served unchanged from games/<id>/index.html. The 3D ones also load three.js r128 from cdnjs.
 const GAMES=[
  {id:'fossil-dig',title:'공룡 화석 발굴',en:'Fossil Dig',icon:'🦖',subject:'과학',subjectEn:'Science',skill:'수 세기 · 관찰 · 공룡 탐구',skillEn:'Counting · observing · dinosaurs'},
  {id:'letter-flight',title:'글자 비행',en:'Letter Flight',icon:'🎈',subject:'언어',subjectEn:'Language',skill:'글자와 소리 · 낱말 만들기',skillEn:'Letters, sounds and spelling',three:true},
  {id:'fruit-orchard',title:'열매 숲',en:'Fruit Orchard',icon:'🍎',subject:'수학',subjectEn:'Math',skill:'수 세기 · 덧셈 · 곱셈 · 분수',skillEn:'Counting, adding, multiplying, fractions',three:true},
  {id:'float-lab',title:'뜰까 가라앉을까 실험실',en:'Float Lab',icon:'🧪',subject:'과학',subjectEn:'Science',skill:'예측 · 실험 · 뜨고 가라앉는 이유',skillEn:'Predict, test, floating and sinking',three:true},
  {id:'nature-explorer',title:'자연 탐험 사진가',en:'Nature Explorer',icon:'📷',subject:'자연',subjectEn:'Nature',skill:'동물 관찰 · 사는 곳 · 먹이',skillEn:'Animals, habitats and food',three:true},
  {id:'fruit-stand',title:'과일 가게 계산대',en:'Fruit Stand',icon:'🧺',subject:'수학',subjectEn:'Math',skill:'수 세기 · 덧셈 · 돈과 거스름돈',skillEn:'Counting, adding, prices and change'},
  {id:'star-mail',title:'별빛 문장 우체국',en:'Star Mail',icon:'✉️',subject:'언어',subjectEn:'Language',skill:'낱말 · 문장 · 맥락',skillEn:'Words, sentences and context',three:true,astra:true},
  {id:'cloud-bridge',title:'구름 다리 건축가',en:'Cloud Bridge',icon:'🚂',subject:'수학',subjectEn:'Math',skill:'수 감각 · 연산 · 비율',skillEn:'Number sense, operations and ratios',three:true,astra:true},
  {id:'prism-lab',title:'무지개 빛 연구소',en:'Prism Lab',icon:'💎',subject:'과학',subjectEn:'Science',skill:'빛의 혼합 · 필터 · 실험',skillEn:'Light mixing, filters and experiments',three:true,astra:true},
  {id:'living-forest',title:'숲의 연결 탐험대',en:'Living Forest',icon:'🌿',subject:'자연',subjectEn:'Nature',skill:'관찰 · 먹이 관계 · 순환',skillEn:'Observation, food chains and cycles',three:true,astra:true}
 ];
 // RULE v2 (LEVELS.md §1): band = the child's age band, level 1–5 inside it, d = BASE[band] + level − 1 (1..20, no overlap).
 const BANDS=['K','E1','E2','E3'],BASE={K:1,E1:6,E2:11,E3:16};
 const DINOS={trex:{ko:'티라노사우루스',en:'T. rex'},tri:{ko:'트리케라톱스',en:'Triceratops'},steg:{ko:'스테고사우루스',en:'Stegosaurus'}};
 // Game-specific result fields (LEVELS.md §4): validated and copied into the parent record.
 const FIELDS={'fossil-dig':{keys:['dino','quizRight','quizItem'],valid:v=>Object.hasOwn(DINOS,v.dino)&&typeof v.quizRight==='boolean'},'fruit-stand':{keys:['mistakes'],valid:v=>Number.isInteger(v.mistakes)&&v.mistakes>=0}};
 for(const g of GAMES.filter(g=>g.astra))FIELDS[g.id]={keys:['firstTry','questions','mistakes','hints','activeMs','answers'],valid:v=>Number.isInteger(v.firstTry)&&v.firstTry>=0&&v.firstTry<=3&&v.questions===3&&v.stars===v.firstTry&&Number.isInteger(v.mistakes)&&v.mistakes>=0&&Number.isInteger(v.hints)&&v.hints>=0&&v.hints<=3&&Number.isFinite(v.activeMs)&&v.activeMs>=0&&Array.isArray(v.answers)&&v.answers.length===3&&v.answers.every(a=>a&&['id','prompt','answer','expected','explanation'].every(k=>typeof a[k]==='string'&&a[k].length<=3000)&&typeof a.firstTry==='boolean'&&typeof a.hinted==='boolean'&&Number.isInteger(a.attempts)&&a.attempts>=1&&Number.isFinite(a.activeMs)&&a.activeMs>=0)};
 const meta=id=>GAMES.find(g=>g.id===id);
 const has=id=>!!meta(id);
 const language=value=>value==='en'?'en':'ko';
 const level=value=>Number.isInteger(value)&&value>=1&&value<=5;
 const ageBand=age=>{const a=Number(age)||7;return a<=7?'K':a<=9?'E1':a<=11?'E2':'E3';};
 const difficulty=(band,value)=>BASE[band]+value-1;
 function session(profile,id,now=Date.now()){
  const game=meta(profile.gameId)||GAMES[0],age=Number.isInteger(profile.age)&&profile.age>=5&&profile.age<=13?profile.age:7;
  return {id,game:game.id,lang:language(profile.lang),level:Math.max(1,Math.min(5,Number(profile.playLevel)||1)),band:BANDS.includes(profile.playBand)?profile.playBand:ageBand(age),overridden:profile.playBandOverridden===true,child:{name:typeof profile.name==='string'?profile.name:'',age},startedAt:new Date(now).toISOString(),count:0,record:null};
 }
 function begin(run,options={},now=Date.now()){
  run.count++;run.record=null;run.startedAt=new Date(now).toISOString();
  if(level(options.level))run.level=options.level;if(options.lang)run.lang=language(options.lang);
 }
 // The app always sends both band and age, so a game can show "부모님이 고른 묶음" when they differ (LEVELS.md §4).
 function gameUrl(base,run,version){
  const url=new URL('games/'+run.game+'/index.html',base);
  url.searchParams.set('band',run.band);
  url.searchParams.set('age',run.child.age);
  url.searchParams.set('level',run.level);
  url.searchParams.set('lang',run.lang);
  url.searchParams.set('name',run.child.name);
  if(version)url.searchParams.set('v',version);
  return url.href;
 }
 // Common fields only; band and d are optional here so records from the first Fossil Dig release stay readable.
 function validResult(value){
  if(!value||typeof value!=='object'||Array.isArray(value)||value.type!=='mysia-game'||!has(value.game))return false;
  if(!Number.isInteger(value.stars)||value.stars<0||value.stars>3)return false;
  if(value.lang!==undefined&&value.lang!=='ko'&&value.lang!=='en')return false;
  if((value.band!==undefined||value.d!==undefined)&&(!BANDS.includes(value.band)||!level(value.level)||value.d!==difficulty(value.band,value.level)))return false;
  const fields=FIELDS[value.game];return !fields||fields.valid(value);
 }
 function validMessage(value){return validResult(value)&&BANDS.includes(value.band)&&level(value.level)&&level(value.nextLevel)&&['ko','en'].includes(value.lang)&&[null,'hard','good','easy'].includes(value.feel)&&(value.suggestBandUp===undefined||typeof value.suggestBandUp==='boolean');}
 const sameRound=(a,b)=>['band','d','stars','dino','quizRight','mistakes','firstTry','questions','hints','activeMs'].every(key=>a[key]===b[key])&&JSON.stringify(a.answers)===JSON.stringify(b.answers);
 function receive(event,source,origin,run,now=Date.now()){
  if(!run||!source||event.source!==source||event.origin!==origin||!validMessage(event.data))return null;
  const data=event.data;
  // Bridge check (LEVELS.md §4): a message for another game or another band than the app sent is ignored.
  if(data.game!==run.game||data.band!==run.band||data.level!==run.level||data.d!==difficulty(run.band,run.level))return null;
  if(!run.count)begin(run,{},Date.parse(run.startedAt));
  const previous=run.record;
  // A game posts once when its stars screen opens and again after 어땠어 (some 3D games only after 어땠어).
  // A new round is opened by an actual Start / Again click, never by a timeout.
  if(previous&&(previous.feel!==null||data.feel===null||!sameRound(previous,data)))return null;
  const message={type:data.type,game:data.game,band:data.band,level:data.level,d:data.d,stars:data.stars,feel:data.feel,nextLevel:data.nextLevel,suggestBandUp:data.suggestBandUp===true,lang:data.lang};
  for(const key of FIELDS[data.game]?.keys||[])if(data[key]!==undefined)message[key]=data[key];
  const record=previous||{id:run.id+':'+run.count,type:'mysia-game',game:data.game,gameId:data.game,band:data.band,d:data.d,stars:data.stars,lang:data.lang,level:run.level,tier:run.level,age:run.child.age,child:{...run.child},startedAt:run.startedAt,completedAt:new Date(now).toISOString(),messages:[]};
  for(const key of FIELDS[data.game]?.keys||[])if(message[key]!==undefined)record[key]=message[key];
  // The played level stays fixed in the record; the exact payloads are kept separately for the parent record.
  record.lang=message.lang;record.feel=message.feel;record.nextLevel=message.nextLevel;record.suggestBandUp=message.suggestBandUp;record.message=message;
  record.messages.push({receivedAt:new Date(now).toISOString(),payload:message});
  run.record=record;return record;
 }
 function validRecord(record){return validResult(record)&&record.gameId===record.game&&typeof record.id==='string'&&Number.isFinite(Date.parse(record.completedAt));}
 return {GAMES,BANDS,BASE,DINOS,meta,has,ageBand,difficulty,session,begin,gameUrl,validResult,validMessage,receive,validRecord};
});
