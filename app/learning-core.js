(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SiaLearningCore=api;})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const BANDS=['K','E1','E2','E3'],BASE={K:1,E1:6,E2:11,E3:16},BAND_LABEL={K:'5–7살',E1:'8–9살',E2:'10–11살',E3:'12–13살'};
 const TITLES={story:'이야기',library:'책장',drawing:'그리기','letter-flight':'글자 비행','fruit-orchard':'열매 숲','float-lab':'물 실험실','nature-explorer':'자연 탐험 사진가','fossil-dig':'공룡 화석 발굴','fruit-stand':'과일 가게 계산대',kitchen:'과일 주방',words:'낱말 조립',sequence:'이야기 탐정',memory:'짝꿍 찾기',rhythm:'리듬 톡톡','post-office':'숲속 우체국','number-bakery':'도토리 빵집','water-lab':'둥실 물 연구소','seed-garden':'씨앗의 작은 정원'};
 const TRACKS=Object.fromEntries(Object.entries(TITLES).map(([id,title])=>[id,{title,max:5}]));
 const GAMES=Object.keys(TRACKS).filter(id=>!['story','library','drawing'].includes(id)),K_ONLY=['kitchen','words','sequence','memory','rhythm','post-office','number-bakery','water-lab','seed-garden'];
 const MOODS={easy:'쉬웠어',just:'딱 좋아',hard:'어려웠어'},isGame=id=>GAMES.includes(id),language=v=>v==='en'?'en':'ko',clamp=(v,max=5)=>Math.max(1,Math.min(max,Number.isInteger(Number(v))?Number(v):1));
 const ageBand=age=>Number(age)<=7?'K':Number(age)<=9?'E1':Number(age)<=11?'E2':'E3';
 const areaOf=(domain,lang)=>isGame(domain)&&!['words','sequence'].includes(domain)?'play':language(lang);
 function bandFor(profile,area){const natural=ageBand(profile.age||7),override=profile.bandOverride?.[area];return override?.forBand===natural&&BANDS.includes(override.band)?override.band:natural;}
 const bandOf=(p,domain,lang=p.lang)=>bandFor(p,areaOf(domain,lang)),bandOverridden=(p,area)=>bandFor(p,area)!==ageBand(p.age||7);
 const difficulty=(band,level)=>BASE[BANDS.includes(band)?band:'K']+clamp(level)-1,nextBand=band=>BANDS[BANDS.indexOf(band)+1]||null;
 function setBand(profile,area,band){if(!['ko','en','play'].includes(area))throw Error('Unknown band area');if(band&&band!=='auto'&&!BANDS.includes(band))throw Error('Invalid band');const before=bandFor(profile,area),progress=state(profile);profile.bandOverride??={};if(!band||band==='auto')delete profile.bandOverride[area];else profile.bandOverride[area]={band,forBand:ageBand(profile.age||7),at:new Date().toISOString()};const after=bandFor(profile,area);if(before!==after)for(const [key,t] of Object.entries(progress.tracks)){const [group,domain,savedBand]=key.split(':');if(!savedBand)continue;const affected=group==='game'?(area==='play'?!['words','sequence'].includes(domain):['words','sequence'].includes(domain)):group===area;if(affected)t.revision=(t.revision||0)+1;}return after;}
 const available=(p,id,lang=p.lang)=>!['post-office','number-bakery','water-lab','seed-garden'].includes(id)&&(!K_ONLY.includes(id)||(Number(p.age)<=7&&bandOf(p,id,lang)==='K'));
 function initial(profile,domain,lang=profile.lang){if(!TRACKS[domain])throw Error('Unknown learning domain');return domain==='library'?({together:1,short:2,long:3}[profile.readingPreferences?.[language(lang)]]||1):1;}
 const keyFor=(domain,lang,band)=>(isGame(domain)?'game':language(lang))+':'+domain+':'+band;
 function state(profile){
  if(![1,2,3].includes(profile.learningProgress?.version)){
   profile.learningProgress={version:3,tracks:{},history:[]};
   if(profile.storyDataVersion)for(const lang of ['ko','en']){const previous=profile.storyProgress?.[lang]?.current??profile.storyLevels?.[lang];if(previous)profile.learningProgress.tracks[keyFor('story',lang,bandOf(profile,'story',lang))]={level:clamp(previous),band:bandOf(profile,'story',lang),source:'previous',revision:0};}
  }
  const p=profile.learningProgress;p.tracks??={};if(!Array.isArray(p.history))p.history=[];
  if(p.version===1){for(const id of GAMES)if(!p.tracks['game:'+id]){const old=['ko','en'].map(l=>p.tracks[l+':'+id]).filter(t=>t&&t.source!=='profile').sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||'')||(b.revision||0)-(a.revision||0));if(old[0])p.tracks['game:'+id]={...old[0]};}p.version=2;}
  if(p.version===2){
   // Preserve old keys for audit. Only the current band's track is migrated.
   for(const domain of Object.keys(TRACKS))for(const lang of isGame(domain)?[language(profile.lang)]:['ko','en']){
    const band=bandOf(profile,domain,lang),old=p.tracks[(isGame(domain)?'game':lang)+':'+domain],key=keyFor(domain,lang,band);
    if(!old||p.tracks[key]||domain==='library'&&band!=='K')continue;
    let n=clamp(old.level);if(isGame(domain)&&band!=='K')n=1;else if(domain==='library')n=({1:1,2:3,3:4})[clamp(old.level,3)];
    p.tracks[key]={...old,level:n,band,source:'migration',revision:(old.revision||0)+1};
   }p.version=3;
  }return p;
 }
 function track(profile,domain,lang=profile.lang,legacy){const rule=TRACKS[domain];if(!rule)throw Error('Unknown learning domain');const p=state(profile),band=bandOf(profile,domain,lang),key=keyFor(domain,lang,band);if(!p.tracks[key])p.tracks[key]={band,level:clamp(legacy??initial(profile,domain,lang)),revision:0,source:legacy?'previous':'profile'};p.tracks[key].level=clamp(p.tracks[key].level);return p.tracks[key];}
 const level=(p,domain,lang=p.lang)=>track(p,domain,lang).level;
 function start(profile,domain,id,options={}){const lang=language(options.lang||profile.lang),t=track(profile,domain,lang),band=BANDS.includes(options.band)?options.band:bandOf(profile,domain,lang),n=clamp(options.level??t.level);return {id,domain,lang,band,level:n,d:difficulty(band,n),age:profile.age,childName:profile.name||'',revision:t.revision,title:options.title||TRACKS[domain].title,startedAt:new Date().toISOString(),completedAt:null,feedback:null};}
 function respond(profile,attempt,mood,metrics={},now=new Date().toISOString()){
  if(!attempt?.completedAt||!TRACKS[attempt.domain]||!MOODS[mood])return null;
  const p=state(profile),old=p.history.find(x=>x.id===attempt.id),t=track(profile,attempt.domain,attempt.lang),band=attempt.band||ageBand(attempt.age||7);
  if(old&&old.status!=='pending'){attempt.feedback=old.feedback;attempt.adjustment={...old};return old;}
  if(!old&&attempt.adjustment?.status==='applied')return attempt.adjustment;
  const stale=band!==bandOf(profile,attempt.domain,attempt.lang)||attempt.level!==t.level||attempt.revision!==t.revision;
  const chosen=old?.feedback||mood,from=attempt.level;let to=from,status='applied',reason='just',suggestBandUp=false;
  if(stale){reason='newer';to=t.level;}
  else if(chosen==='hard'){to=Math.max(1,from-1);reason=from===1?'minimum':'easier';}
  else if(chosen==='easy'){
   if(metrics.pending){status='pending';reason='parent';}
   else if((isGame(attempt.domain)||attempt.domain==='story')&&(!metrics.ready||!Number.isFinite(metrics.ratio)||metrics.ratio<(isGame(attempt.domain)?2/3:.8)||(attempt.domain==='fossil-dig'&&metrics.quizRight!==true)))reason='practice';
   else if(from===5){suggestBandUp=!!nextBand(band);reason=suggestBandUp?'band-up':'maximum';}
   else{to=from+1;reason='harder';}
  }
  const result={id:attempt.id,domain:attempt.domain,lang:attempt.lang,title:attempt.title,band,d:difficulty(band,from),suggestBandUp,age:attempt.age,childName:attempt.childName,feedback:chosen,from,to,status,reason,completedAt:attempt.completedAt,updatedAt:now,metrics:{ready:metrics.ready===true,pending:metrics.pending||0,ratio:Number.isFinite(metrics.ratio)?metrics.ratio:null,quizRight:typeof metrics.quizRight==='boolean'?metrics.quizRight:null}};
  if(!stale&&status==='applied'){t.level=to;t.revision++;t.source='feedback';t.updatedAt=now;if(suggestBandUp)t.suggestBandUp={domain:attempt.domain,lang:attempt.lang,from:band,to:nextBand(band),at:now};}
  if(old)p.history[p.history.indexOf(old)]=result;else p.history.push(result);p.history=p.history.slice(-160);attempt.feedback=chosen;attempt.adjustment={...result};return result;
 }
 function manual(profile,domain,lang,value){const t=track(profile,domain,lang),n=clamp(value);if(n!==t.level||t.source!=='parent'){t.level=n;t.revision++;t.source='parent';t.updatedAt=new Date().toISOString();}delete t.suggestBandUp;return n;}
 function libraryItems(items,profile){if(Number(profile.age)>=8||bandOf(profile,'library')!=='K')return [];const lang=language(profile.lang),n=level(profile,'library',lang),old=n<=2?1:n===3?2:3;return items.filter(i=>i.lang===lang&&(i.school?n>=4:Number(i.level)===old)).sort((a,b)=>{const weight=i=>(profile.interests||[]).filter(t=>({nature:/자연|씨|나무|seed|tree|rain/i,animals:/동물|고양|cat|dog|bird/i,school:/학교|친구|school|friend/i,space:/우주|달|moon|space|star/i,things:/기계|지퍼|zipper|machine/i,art:/그림|연필|pencil|draw/i}[t]?.test(i.title+' '+(i.tags||[]).join(' ')))).length;return weight(b)-weight(a);});}
 const PROMPTS={K:['좋아하는 것 하나를 크게 그려 봐.','놀이터에서 함께 노는 두 친구를 그려 봐.','친구들이 무엇을 하는지 배경도 함께 그려 봐.','기쁜 마음과 속상한 마음이 드러나는 두 장면을 그려 봐.','친구에게 생긴 문제와 해결한 모습을 이야기로 그려 봐.'],E1:['이야기 한 장면을 그리고 말풍선을 넣어 봐.','두 컷 만화를 그려 봐.','오늘 한 일을 시간 순서대로 세 칸에 그려 봐.','길을 안내하는 지도를 그려 봐.','내 가게의 간판과 가격표를 만들어 봐.'],E2:['관찰한 물건을 그리고 길이를 cm로 적어 봐.','원인과 결과가 보이는 네 컷 만화를 그려 봐.','실험 장면과 결과 표를 그려 봐.','방위를 표시한 동네 지도를 그려 봐.','재료 목록이 있는 설계도를 그려 봐.'],E3:['축척이 있는 지도를 그려 봐.','안쪽이 보이는 단면도를 그려 봐.','원그래프로 비율을 보여 주는 포스터를 그려 봐.','발명품 설계도에 작동 원리를 화살표로 넣어 봐.','주장과 근거가 담긴 홍보 포스터를 그려 봐.']};
 const drawingPrompt=p=>PROMPTS[bandOf(p,'drawing')][level(p,'drawing')-1]+' 자유롭게 표현해도 좋아!';
 function gameStars(record){if(Number.isInteger(record.stars)&&record.stars>=0&&record.stars<=3)return record.stars;const ratio=record.gameId==='memory'?Math.max(0,(record.checks-record.retries)/Math.max(1,record.checks)):record.firstTry/Math.max(1,record.rounds);return ratio>=.8?3:ratio>=.5?2:1;}
 const gameScore=r=>({ready:true,ratio:gameStars(r)/3,quizRight:r.quizRight});
 return {BANDS,BASE,BAND_LABEL,ageBand,areaOf,bandFor,bandOf,bandOverridden,difficulty,nextBand,setBand,available,K_ONLY,TRACKS,MOODS,GAMES,isGame,initial,state,track,level,start,respond,manual,libraryItems,drawingPrompt,gameScore,gameStars};
});
