(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AstraCore=api;})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const BASE={K:1,E1:6,E2:11,E3:16},IDS=['star-mail','cloud-bridge','prism-lab','living-forest'];
 const bandOf=age=>age<=7?'K':age<=9?'E1':age<=11?'E2':'E3';
 function params(search,game){const p=new URLSearchParams(search),raw=Number(p.get('age')),age=Number.isInteger(raw)&&raw>=5&&raw<=13?raw:null,band=p.get('band')?.toUpperCase();return {game:IDS.includes(game)?game:IDS[0],age,band:Object.hasOwn(BASE,band)?band:age?bandOf(age):null,level:Math.max(1,Math.min(5,Math.trunc(Number(p.get('level')))||1)),lang:p.get('lang')==='en'?'en':'ko',name:(p.get('name')||'').slice(0,20)};}
 function shuffled(items,seed=Date.now()){const a=[...items];let n=seed>>>0;for(let i=a.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
 function check(task,selection,filter='clear'){
  if(!Array.isArray(selection))return false;
  if(task.kind==='build'){if(!selection.length||selection.length>(task.maxPieces||12))return false;let sum=0;for(const id of selection){const p=task.pieces.find(x=>x.id===id);if(!p)return false;sum+=p.value;}return Math.abs(sum-task.target)<1e-8;}
  if(task.kind==='light'){const actual=[...new Set(selection)].sort(),expected=[...task.answer].sort();return JSON.stringify(actual)===JSON.stringify(expected)&&filter===(task.filterAnswer||'clear');}
  return JSON.stringify(selection)===JSON.stringify(task.answer);
 }
 function result(config,rounds,feel=null,activeMs=0){const firstTry=rounds.filter(r=>r.correct&&r.attempts===1&&!r.hinted).length,questions=rounds.length,stars=firstTry,good=rounds.length===3&&rounds.every(r=>r.correct&&r.attempts===1);
  return {type:'mysia-game',game:config.game,band:config.band,level:config.level,d:BASE[config.band]+config.level-1,lang:config.lang,stars,firstTry,questions,mistakes:rounds.reduce((n,r)=>n+(r.correct?Math.max(0,r.attempts-1):Math.max(1,r.attempts)),0),hints:rounds.filter(r=>r.hinted).length,activeMs:Math.max(0,Math.round(activeMs)),feel,nextLevel:feel==='hard'?Math.max(1,config.level-1):feel==='easy'&&good?Math.min(5,config.level+1):config.level,suggestBandUp:feel==='easy'&&good&&config.level===5&&config.band!=='E3',answers:rounds.map(r=>({id:r.id,prompt:r.prompt,answer:r.answer,expected:r.expected,explanation:r.explanation,firstTry:r.correct&&r.attempts===1&&!r.hinted,attempts:r.attempts,hinted:r.hinted,activeMs:Math.round(r.activeMs)}))};
 }
 function readText(text,lang='ko'){const en=lang==='en';return String(text).replace(/(\d+)\/(\d+)/g,(_,a,b)=>en?a+' over '+b:b+'분의 '+a).replace(/×/g,en?' times ':' 곱하기 ').replace(/÷/g,en?' divided by ':' 나누기 ').replace(/\+/g,en?' plus ':' 더하기 ').replace(/−|\s-\s/g,en?' minus ':' 빼기 ').replace(/%/g,en?' percent':' 퍼센트').replace(/cm²/g,en?' square centimeters':' 제곱센티미터').replace(/m²/g,en?' square meters':' 제곱미터').replace(/kg/g,en?' kilograms':' 킬로그램').replace(/cm/g,en?' centimeters':' 센티미터');}
 return {BASE,IDS,bandOf,params,shuffled,check,result,readText};
});
