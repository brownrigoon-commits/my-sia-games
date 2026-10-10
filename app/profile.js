(function(root){
 'use strict';
 const interests=[
  {id:'animals',label:'동물',emoji:'🐾',words:'고양|강아지|개미|나비|(?:^|\\s)새는|물고기|달팽이|동물|벌은|거미|\\b(cat|dog|bird|fish|snail|animal|ant|bee|butterfly)s?\\b',tags:[]},
  {id:'nature',label:'자연',emoji:'🌿',words:'나무|나뭇잎|꽃|씨앗|싹|식물|비는|눈은|바람|\\b(tree|leaf|leaves|plant|seed|flower|rain|snow|wind)s?\\b',tags:['자연']},
  {id:'space',label:'우주',emoji:'🚀',words:'별|달은|달 하나|우주|로켓|행성|태양|\\b(moon|star|space|rocket|planet|sun)s?\\b',tags:[]},
  {id:'things',label:'물건·기계',emoji:'⚙️',words:'기계|지퍼|자물쇠|우산|자동차|톱니|바퀴|엘리베이터|\\b(machine|zipper|lock|wheel|car|umbrella|gear)s?\\b',tags:['집안 물건','탈것·기계']},
  {id:'art',label:'그림·만들기',emoji:'🎨',words:'그림|그리|그린|색종이|종이|팽이|만들|연필|\\b(draw|drawing|paint|painting|paper|pencil|crayon|craft)s?\\b',tags:['만들기']},
  {id:'school',label:'학교·친구',emoji:'🏫',words:'학교|친구|교실|급식|선생|\\b(school|friend|class|teacher|lunch)s?\\b',tags:['학교 적응']}
 ];
 const choices={
  ko:[{id:'together',label:'함께 읽어요',sample:'읽어 주면 좋아요.',icon:'volume'},{id:'short',label:'짧은 글 읽어요',sample:'새가 나무에 앉았어.',icon:'book'},{id:'long',label:'책도 읽어요',sample:'혼자 이야기를 읽어요.',icon:'spark'}],
  en:[{id:'together',label:'처음이에요',sample:'A · B · C',icon:'volume'},{id:'short',label:'짧은 글 읽어요',sample:'I see a bird.',icon:'book'},{id:'long',label:'책도 읽어요',sample:'혼자 영어책을 읽어요.',icon:'spark'}]
 };
 function ageStage(age){return ({5:0,6:1,7:2,8:3,9:3,10:4,11:4,12:5,13:6})[age]??2;}
 function startingBand(age,choice,language){return ageStage(age);}
 function validAnswers(p){return typeof p?.name==='string'&&p.name.trim().length>0&&p.name.trim().length<=12&&Number.isInteger(p.age)&&p.age>=5&&p.age<=13&&['girl','boy','skip'].includes(p.gender)&&Array.isArray(p.interests)&&p.interests.length<=3&&new Set(p.interests).size===p.interests.length&&p.interests.every(id=>interests.some(x=>x.id===id))&&['ko','en'].every(lang=>choices[lang].some(x=>x.id===p.readingPreferences?.[lang]));}
 function complete(p){return p?.profileVersion===2&&p.onboardingCompleted===true&&validAnswers(p)&&['ko','en'].every(lang=>Number.isInteger(p[lang])&&p[lang]>=0&&p[lang]<=6);}
 function fromAnswers(previous,draft){if(!validAnswers(draft))throw Error('Incomplete profile');const next={...previous,name:draft.name.trim(),age:draft.age,gender:draft.gender,interests:[...draft.interests],readingPreferences:{...draft.readingPreferences},ko:startingBand(draft.age,draft.readingPreferences.ko,'ko'),en:startingBand(draft.age,draft.readingPreferences.en,'en'),storyLevels:previous.storyDataVersion?{...previous.storyLevels}:{ko:1,en:1},profileVersion:2,onboardingCompleted:true,profileUpdatedAt:new Date().toISOString()};if(previous.age&&root.SiaLearningCore.ageBand(previous.age)!==root.SiaLearningCore.ageBand(draft.age)){next.bandOverride={};if(previous.learningProgress){next.learningProgress=JSON.parse(JSON.stringify(previous.learningProgress));for(const t of Object.values(next.learningProgress.tracks||{}))t.revision=(t.revision||0)+1;}}return next;}
 function matches(item,id){const interest=interests.find(x=>x.id===id);return Boolean(interest&&(new RegExp(interest.words,'i').test(item?.title||'')||interest.tags.some(t=>item?.tags?.includes(t))));}
 function ranked(library,profile,mood={}){const C=root.SiaLearningCore,minutes={K:6,E1:10,E2:15,E3:15}[C.bandOf(profile,'library')];return C.libraryItems(library,profile).map((item,n)=>{const matched=(profile.interests||[]).filter(id=>matches(item,id));return {item,matched,score:matched.length*65+(profile.completed?.[item.id]?-25:20)-Math.abs(item.minutes-minutes)*.4-n/100000};}).sort((a,b)=>b.score-a.score);}
 root.SiaProfile={interests,choices,ageStage,startingBand,validAnswers,complete,fromAnswers,matches,ranked};
})(typeof window==='undefined'?globalThis:window);
