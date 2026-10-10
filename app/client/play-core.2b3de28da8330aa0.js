(function(root){
 'use strict';
 const GAMES=[
  {id:'kitchen',title:'과일 주방',icon:'🍓',haru:'happy.png',skill:'수 세기 · 덧셈',hint:'톡톡 담아 요리해요',color:'peach'},
  {id:'words',title:'낱말 조립',icon:'🔤',haru:'curious.png',skill:'소리와 글자 연결',hint:'글자 조각을 이어요',color:'blue'},
  {id:'sequence',title:'이야기 탐정',icon:'🔍',haru:'inspect.png',skill:'이야기의 순서 이해',hint:'먼저, 그다음, 마지막!',color:'green'},
  {id:'memory',title:'짝꿍 찾기',icon:'🐾',haru:'searching.png',skill:'관찰 · 기억 · 낱말',hint:'숨어 있는 짝을 찾아요',color:'lilac'},
  {id:'rhythm',title:'리듬 톡톡',icon:'🎵',haru:'congratulations.png',skill:'듣기 · 순서 기억',hint:'하루를 따라 톡톡!',color:'yellow'}
 ];
 const WORDS=[
  {id:'dog',icon:'🐶',ko:'강아지',en:'dog',topic:'animals'},
  {id:'cat',icon:'🐱',ko:'고양이',en:'cat',topic:'animals'},
  {id:'rabbit',icon:'🐰',ko:'토끼',en:'rabbit',topic:'animals'},
  {id:'chick',icon:'🐥',ko:'병아리',en:'chick',topic:'animals'},
  {id:'frog',icon:'🐸',ko:'개구리',en:'frog',topic:'animals'},
  {id:'turtle',icon:'🐢',ko:'거북이',en:'turtle',topic:'animals'},
  {id:'butterfly',icon:'🦋',ko:'나비',en:'butterfly',topic:'animals'},
  {id:'apple',icon:'🍎',ko:'사과',en:'apple',topic:'nature'},
  {id:'banana',icon:'🍌',ko:'바나나',en:'banana',topic:'nature'},
  {id:'tree',icon:'🌳',ko:'나무',en:'tree',topic:'nature'},
  {id:'sun',icon:'☀️',ko:'해',en:'sun',topic:'space'},
  {id:'moon',icon:'🌙',ko:'달',en:'moon',topic:'space'},
  {id:'star',icon:'⭐',ko:'별',en:'star',topic:'space'},
  {id:'rocket',icon:'🚀',ko:'로켓',en:'rocket',topic:'space'},
  {id:'bus',icon:'🚌',ko:'버스',en:'bus',topic:'things'},
  {id:'book',icon:'📘',ko:'책',en:'book',topic:'school'}
 ];
 const FRUITS=[{id:'apple',icon:'🍎',ko:'사과'},{id:'banana',icon:'🍌',ko:'바나나'},{id:'berry',icon:'🍓',ko:'딸기'},{id:'orange',icon:'🍊',ko:'귤'}];
 const SCENES=[
  {page:1,ko:'도담이가 할머니와 닭장에 갔어요.',en:'Dodam went to the henhouse with Grandma.'},
  {page:2,ko:'수탉 소리에 놀란 도담이가 할머니 뒤로 숨었어요.',en:'The rooster crowed. Dodam hid behind Grandma.'},
  {page:4,ko:'할머니가 모이를 뿌리자 밤순이가 나왔어요.',en:'Grandma scattered food. The hen came out.'},
  {page:6,ko:'도담이가 둥지에 하얀 알을 놓았어요.',en:'Dodam put a white egg in the nest.'},
  {page:7,ko:'밤순이가 돌아와 알을 따뜻하게 품었어요.',en:'The hen came back and kept the eggs warm.'},
  {page:8,ko:'도담이가 병아리를 기다릴 날을 손가락으로 셌어요.',en:'Dodam counted the days until the chicks would hatch.'},
  {page:9,ko:'밤에는 도담이도 베개를 품고 잠들었어요.',en:'At night, Dodam hugged a pillow and fell asleep.'}
 ];
 function random(seed){let value=2166136261;for(const char of String(seed))value=Math.imul(value^char.charCodeAt(0),16777619);return ()=>{value+=0x6D2B79F5;let t=value;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
 function shuffle(items,rng=Math.random){const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
 function difficulty(profile){const age=Number(profile.age)||7,band=['K','E1','E2','E3'].includes(profile.playBand)?profile.playBand:age<=7?'K':age<=9?'E1':age<=11?'E2':'E3',level=Math.max(1,Math.min(5,Number(profile.playLevel)||1));return {band,level,d:({K:1,E1:6,E2:11,E3:16})[band]+level-1};}
 function create(gameId,profile={},seed=String(Date.now())){
  if(!GAMES.some(g=>g.id===gameId))throw Error('Unknown play activity');
  const info=difficulty(profile);if(info.band!=='K'||Number(profile.age||7)>=8)throw Error('This game is for ages 5–7 only');const rng=random(seed),step=info.level,lang=profile.lang==='en'?'en':'ko';
  const game={schema:2,id:gameId+'-'+seed,gameId,seed,lang,band:info.band,level:info.level,d:info.d,tier:step,round:0,total:['sequence','memory'].includes(gameId)?1:3,checks:0,mistakes:0,roundMistakes:0,firstTry:0,phase:'play',activeMs:0,startedAt:new Date().toISOString()};
  if(gameId==='kitchen')game.tasks=shuffle(FRUITS,rng).slice(0,3).map(fruit=>{const count=[2,5,5,12,11][step-1]+Math.floor(rng()*([4,6,6,5,8][step-1]));return {fruit:fruit.id,count,part:step===3?Math.min(count-1,2+Math.floor(rng()*3)):step===4?11:step===5?8:null};});
  if(gameId==='words'){
   const limit=lang==='ko'?[2,3,4,4,4][step-1]:[3,5,6,7,9][step-1];
   const pool=shuffle(WORDS.filter(w=>w[lang].length<=limit),rng).sort((a,b)=>Number((profile.interests||[]).includes(b.topic))-Number((profile.interests||[]).includes(a.topic)));
   game.tasks=pool.slice(0,3).map(word=>{const text=word[lang],extra=(lang==='ko'?['하','루','바','다']:['s','t','r','p']).slice(0,step-1);const tiles=shuffle([...text,...extra].map((text,id)=>({text,id})),rng);if(text.length>1&&tiles.slice(0,text.length).map(t=>t.text).join('')===text){const other=tiles.findIndex(t=>t.text!==tiles[0].text);if(other>0)[tiles[0],tiles[other]]=[tiles[other],tiles[0]];}return {wordId:word.id,text,tiles};});
  }
  if(gameId==='sequence'){
   const pages=[[1,6,9],[1,4,6,9],[1,4,6,7,9],[1,2,4,6,7,9],[1,2,4,6,7,8,9]][step-1];
   game.cards=SCENES.filter(scene=>pages.includes(scene.page));game.order=shuffle(game.cards.map(s=>s.page),rng);
   if(game.order.every((page,i)=>page===pages[i]))game.order.push(game.order.shift());
  }
  if(gameId==='memory'){
   const items=shuffle(WORDS.filter(w=>step===5||w.topic==='animals'),rng).slice(0,[3,4,5,6,6][step-1]);
   game.deck=shuffle(items.flatMap(word=>[{pair:word.id,id:word.id+'-a'},{pair:word.id,id:word.id+'-b'}]),rng);
  }
  if(gameId==='rhythm')game.pattern=Array.from({length:[2,2,3,3,4][step-1]+2},()=>Math.floor(rng()*4));
  resetRound(game);return game;
 }
 function resetRound(game){game.roundMistakes=0;game.phase=game.gameId==='sequence'?'preview':game.gameId==='rhythm'?'ready':'play';game.bowl=[];game.chosen=[];game.flipped=[];game.matched=[];game.input=[];game.preview=0;}
 function attempt(game,correct){game.checks++;if(correct){if(!game.roundMistakes)game.firstTry++;game.phase='won';}else{game.mistakes++;game.roundMistakes++;}return correct;}
 function check(game){
  if(game.phase!=='play')return null;
  if(game.gameId==='kitchen'){const task=game.tasks[game.round];const correct=attempt(game,game.bowl.length===task.count&&game.bowl.every(id=>id===task.fruit));if(correct){game.phase='prepare';game.prep={stage:'slice',cuts:0,mix:0};}return correct;}
  if(game.gameId==='words'){const task=game.tasks[game.round];return attempt(game,game.chosen.map(id=>task.tiles.find(t=>t.id===id)?.text||'').join('')===task.text);}
  if(game.gameId==='sequence')return attempt(game,game.chosen.length===game.cards.length&&game.cards.every((card,i)=>card.page===game.chosen[i]));
  return null;
 }
 function choose(game,id){
  if(game.phase!=='play')return false;
  if(game.gameId==='words'){const task=game.tasks[game.round];if(game.chosen.length>=task.text.length||game.chosen.includes(id)||!task.tiles.some(t=>t.id===id))return false;game.chosen.push(id);return true;}
  if(game.gameId==='sequence'){if(game.chosen.includes(id)||!game.cards.some(c=>c.page===id))return false;game.chosen.push(id);return true;}
  return false;
 }
 function flip(game,id){
  if(game.gameId!=='memory'||game.phase!=='play'||game.flipped.length>=2||game.flipped.includes(id)||game.matched.includes(id)||!game.deck.some(c=>c.id===id))return null;
  game.flipped.push(id);if(game.flipped.length===1)return 'first';
  const [a,b]=game.flipped.map(id=>game.deck.find(c=>c.id===id));game.checks++;
  if(a.pair===b.pair){game.matched.push(...game.flipped);game.flipped=[];if(game.matched.length===game.deck.length){game.phase='won';if(!game.mistakes)game.firstTry=1;return 'complete';}return 'match';}
  game.mistakes++;game.roundMistakes++;return 'miss';
 }
 function rhythmSequence(game){return game.pattern.slice(0,[2,2,3,3,4][game.tier-1]+game.round);}
 function tap(game,pad){
  if(game.gameId!=='rhythm'||game.phase!=='repeat'||!Number.isInteger(pad)||pad<0||pad>3)return null;
  const sequence=rhythmSequence(game);game.input.push(pad);
  if(pad!==sequence[game.input.length-1]){game.checks++;game.mistakes++;game.roundMistakes++;game.phase='ready';game.input=[];return 'miss';}
  if(game.input.length===sequence.length){attempt(game,true);return 'complete';}
  return 'next';
 }
 function advance(game){if(game.phase!=='won')return false;if(game.round+1>=game.total){game.phase='complete';game.completedAt=new Date().toISOString();return true;}game.round++;resetRound(game);return true;}
 function cut(game){if(game.gameId!=='kitchen'||game.phase!=='prepare'||game.prep?.stage!=='slice')return false;game.prep.cuts++;if(game.prep.cuts>=3)game.prep.stage='mix';return true;}
 function stir(game,amount){if(game.gameId!=='kitchen'||game.phase!=='prepare'||game.prep?.stage!=='mix'||!Number.isFinite(amount)||amount<=0)return false;game.prep.mix=Math.min(1,game.prep.mix+Math.min(amount,.2));if(game.prep.mix>=.999)game.prep.stage='serve';return true;}
 function serve(game){if(game.gameId!=='kitchen'||game.phase!=='prepare'||game.prep?.stage!=='serve')return false;game.phase='won';return true;}
 function resume(game){if(game.gameId==='memory')game.flipped=[];if(game.gameId==='rhythm'&&['showing','repeat'].includes(game.phase)){game.phase='ready';game.input=[];}return game;}
 function valid(game){return [1,2].includes(game?.schema)&&(game.schema===1||game.band==='K'&&game.d===game.level&&game.tier===game.level)&&GAMES.some(g=>g.id===game.gameId)&&[1,2,3,4,5].includes(game.tier)&&['ko','en'].includes(game.lang)&&Number.isInteger(game.round)&&game.round>=0&&game.round<game.total&&['play','preview','ready','showing','repeat','prepare','won','complete'].includes(game.phase)&&(game.phase!=='prepare'||game.gameId==='kitchen'&&['slice','mix','serve'].includes(game.prep?.stage)&&Number.isFinite(game.prep.cuts)&&Number.isFinite(game.prep.mix))&&Number.isFinite(game.activeMs)&&Array.isArray(game.chosen)&&Array.isArray(game.flipped)&&(game.gameId==='kitchen'||game.gameId==='words'?Array.isArray(game.tasks)&&game.tasks.length===3:game.gameId==='sequence'?Array.isArray(game.cards):game.gameId==='memory'?Array.isArray(game.deck):Array.isArray(game.pattern));}
 function report(game){return {id:game.id,gameId:game.gameId,lang:game.lang,tier:game.tier,level:game.level||game.tier,band:game.band||'K',d:game.d||game.tier,completedAt:game.completedAt,rounds:game.total,checks:game.checks,retries:game.mistakes,firstTry:game.firstTry,activeMs:Math.round(game.activeMs)};}
 const api={GAMES,WORDS,FRUITS,SCENES,shuffle,difficulty,create,choose,check,flip,tap,rhythmSequence,advance,cut,stir,serve,resume,valid,report};
 root.SiaPlayCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
