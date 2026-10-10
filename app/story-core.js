(function(root){
 'use strict';
 const BANDS={K:{label:'5–7살',ko:150,en:60},E1:{label:'8–9살',ko:220,en:90},E2:{label:'10–11살',ko:330,en:140},E3:{label:'12–13살',ko:420,en:180}};
 const DOMAINS={lang:{label:'말과 글',color:'#3B559E'},math:{label:'수와 모양',color:'#E88F4D'},sci:{label:'과학',color:'#3F7D5B'}};
 const FORMS=['short','choice4','draw'];
 const safeId=id=>typeof id==='string'&&/^(K|E[1-3])-(ko|en)-\d{3,}$/.test(id);
 const version=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}(?:[a-z0-9.-]*)$/.test(v);
 function level(v){const n=Number(v);return Number.isInteger(n)&&n>=1&&n<=5?n:1;}
 const ageBand=age=>age<=7?'K':age<=9?'E1':age<=11?'E2':'E3';
 const units=(text,lang)=>lang==='ko'?(String(text).match(/[가-힣0-9]/g)||[]).length:(String(text).match(/[A-Za-z0-9’'-]+/g)||[]).length;
 function paginate(paragraphs,band,lang){
  const budget=BANDS[band]?.[lang];if(!budget)throw Error('Unknown band or language');
  const pages=[];let group=[],size=0;
  for(const [index,text] of paragraphs.entries()){if(typeof text!=='string')throw Error('Invalid paragraph');const count=units(text,lang);if(group.length&&size+count>budget){pages.push({paragraphs:group,units:size});group=[];size=0;}group.push({index,text});size+=count;}
  if(group.length)pages.push({paragraphs:group,units:size});return pages;
 }
 function validateIndex(data,expectedVersion){
  if(!data||!version(data.v)||expectedVersion&&data.v!==expectedVersion||!Array.isArray(data.list)||data.list.length!==data.count||!data.count)throw Error('Invalid or outdated catalog');
  const ids=new Set();for(const s of data.list){if(!safeId(s.id)||ids.has(s.id)||!BANDS[s.band]||!['ko','en'].includes(s.lang)||!s.id.startsWith(s.band+'-'+s.lang+'-')||typeof s.title!=='string'||!s.title||!Array.isArray(s.tags)||s.tags.some(t=>typeof t!=='string')||!Array.isArray(s.min)||s.min.length!==5||s.min.some((n,i)=>!Number.isFinite(n)||n<=0||i>0&&n<=s.min[i-1]))throw Error('Invalid catalog entry '+s.id);ids.add(s.id);}
  for(let n=1;n<=5;n++){const p=data.levels?.[n];if(p?.eps!==n||p.fin!==(n===4?1:n===5?2:0)||typeof p.ask!=='string')throw Error('Invalid v2 level '+n);}
  return data;
 }
 function validateQuestion(q){
  const fail=()=>{throw Error('Invalid v2 question '+q?.id);};
  if(!q||!/^([1-5][abc]|f[12])$/.test(q.id)||!FORMS.includes(q.f)||typeof q.q!=='string'||!q.q.trim()||typeof q.e!=='string'||!q.e.trim()||!Array.isArray(q.d)||q.d.length!==1||!DOMAINS[q.d[0]])fail();
  if(q.f==='choice4'&&(!Array.isArray(q.c)||q.c.length!==4||q.c.some(c=>typeof c!=='string'||!c.trim())||!Number.isInteger(q.a)||q.a<0||q.a>3))fail();
  if(q.f==='short'&&(typeof q.a!=='string'||!q.a.trim()||!Array.isArray(q.k)||!q.k.length||q.k.some(k=>typeof k!=='string'||!k.trim())))fail();
  if(q.f==='draw'&&(!Array.isArray(q.look)||q.look.length<1||q.look.length>3||q.look.some(s=>typeof s!=='string'||!s.trim())))fail();
  return q;
 }
 function validateSeries(s,meta){
  if(!s||!safeId(s.id)||s.id!==meta.id||s.band!==meta.band||s.lang!==meta.lang||s.title!==meta.title||!Array.isArray(s.eps)||s.eps.length!==5||!Array.isArray(s.fin)||s.fin.length!==2||!Array.isArray(s.cast)||!s.cast.length||s.cast.some(c=>typeof c.look!=='string'||!c.look.trim()))throw Error('Invalid v2 series '+meta.id);
  const ids=new Set();for(const [i,ep] of s.eps.entries()){
   if(ep.n!==i+1||typeof ep.t!=='string'||!ep.t||!Array.isArray(ep.p)||!ep.p.length||ep.p.some(t=>typeof t!=='string'||!t.trim())||!Array.isArray(ep.q)||ep.q.length!==3||typeof ep.art?.s!=='string'||!ep.art.s.trim())throw Error('Invalid v2 episode '+s.id+':'+(i+1));
   for(const q of ep.q){validateQuestion(q);if(ids.has(q.id)||!q.id.startsWith(String(ep.n)))throw Error('Question episode mismatch');ids.add(q.id);}
   if(new Set(ep.q.map(q=>q.f)).size!==3||new Set(ep.q.map(q=>q.d[0])).size!==3)throw Error('Episode must contain three different types and domains');
  }
  for(const [i,q] of s.fin.entries()){validateQuestion(q);if(q.id!=='f'+(i+1)||q.f==='draw')throw Error('Invalid finale');}
  return s;
 }
 function hash(text){let n=2166136261;for(const c of text){n^=c.codePointAt(0);n=Math.imul(n,16777619);}return (n>>>0).toString(16);}
 const pageFingerprint=page=>hash(JSON.stringify(page.paragraphs.map(p=>[p.index,p.text])));
 function shuffledTypes(seed){const types=[...FORMS];let n=parseInt(hash(String(seed)),16);for(let i=types.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[types[i],types[j]]=[types[j],types[i]];}return types;}
 function questionIds(s,selected,plans,{seed='default',mode='rotate'}={}){
  const n=level(selected),plan=plans[n],types=shuffledTypes(seed),ids=[];
  for(const ep of s.eps.slice(0,n)){const chosen=n===1||mode==='all'?ep.q:[ep.q.find(q=>q.f===types[(ep.n-1)%3])];if(chosen.some(q=>!q))throw Error('Missing question type');ids.push(...chosen.map(q=>q.id));}
  ids.push(...s.fin.slice(0,plan.fin).map(q=>q.id));return ids;
 }
 function steps(s,selected,plans,options={}){
  const n=level(selected),wanted=options.ids||questionIds(s,n,plans,options),expected=questionIds(s,n,plans,options);
  if(new Set(wanted).size!==wanted.length||wanted.length!==expected.length)throw Error('Invalid saved question plan');
  const result=[];
  for(const ep of s.eps.slice(0,n)){
   const pages=paginate(ep.p,s.band,s.lang);pages.forEach((p,i)=>result.push({kind:'read',id:`e${ep.n}-p${i}`,episode:ep.n,page:i+1,pageCount:pages.length,...p}));
   const chosen=wanted.filter(id=>id.startsWith(String(ep.n))).map(id=>ep.q.find(q=>q.id===id));
   if(chosen.some(q=>!q)||chosen.length!==(n===1||options.mode==='all'?3:1))throw Error('Invalid episode question plan');
   for(const q of chosen)result.push({kind:q.f==='draw'?'draw':'question',id:q.id,episode:ep.n,q});
  }
  const finals=wanted.filter(id=>id.startsWith('f'));if(JSON.stringify(finals)!==JSON.stringify(s.fin.slice(0,plans[n].fin).map(q=>q.id)))throw Error('Invalid finale plan');
  for(const id of finals){const q=s.fin.find(q=>q.id===id);result.push({kind:'question',id:q.id,episode:n,finale:true,q});}
  if(result.filter(s=>s.q).length!==wanted.length)throw Error('Incomplete plan');return result;
 }
 const normalize=v=>String(v??'').normalize('NFKC').trim().replace(/\s+/gu,'').toLowerCase();
 function hasAnswer(q,value,ink=[],spoken=false){if(q.f==='draw')return ink.some(s=>!s.erase&&s.p?.length);if(q.f==='short')return Boolean(normalize(value)||ink.some(s=>!s.erase&&s.p?.length)||spoken);return Number.isInteger(value)&&value>=0&&value<4;}
 function grade(q,value){
  if(q.f==='draw')return {gradable:false,correct:null,needsParent:false};
  if(q.f==='choice4')return {gradable:true,correct:hasAnswer(q,value)?value===q.a:null,needsParent:false};
  const text=normalize(value),match=Boolean(text)&&q.k.some(k=>text.includes(normalize(k)));
  return {gradable:true,correct:match?true:null,needsParent:!match};
 }
 const answerText=q=>q.f==='choice4'?q.c[q.a]:q.f==='draw'?q.look.join(' / '):q.a;
 function newSession(s,n,v,id,now=new Date().toISOString()){
  const timings={};for(const ep of s.eps.slice(0,level(n)))timings[ep.n]={readingMs:0,questionMs:0,drawingMs:0,reviewMs:0,unobservedMs:0,readAloudUsed:false,units:units(ep.p.join(' '),s.lang),pages:paginate(ep.p,s.band,s.lang).length,completedPages:[]};
  return {schemaVersion:2,id,seriesId:s.id,title:s.title,band:s.band,lang:s.lang,level:level(n),catalogVersion:v,contentHash:hash(JSON.stringify(s)),startedAt:now,updatedAt:now,completedAt:null,stepIndex:0,seed:id,questionMode:'rotate',answers:{},drawings:{},parentChecklist:{},timings,finalQuestionMs:0,completedReadPages:[],feedback:null,timingMethod:'foreground-unpaused-v1'};
 }
 function score(s){
  const questions=(s.plan||[]).filter(p=>p.q&&p.q.f!=='draw');let correct=0,pending=0;
  for(const {q} of questions){const a=s.answers[q.id];const judged=typeof a?.parentCorrect==='boolean'?a.parentCorrect:a?.firstCorrect;if(!a?.firstSubmittedAt||typeof judged!=='boolean')pending++;else if(judged)correct++;}
  return {correct,total:questions.length,pending,ready:questions.length>0&&pending===0,ratio:questions.length?correct/questions.length:0};
 }
 function progressFor(sessions,lang,v,band){
  let current=1,lowStreak=0,offer=null;
  const all=sessions.filter(s=>s.schemaVersion===2&&s.catalogVersion===v&&s.lang===lang&&s.band===band&&s.completedAt).sort((a,b)=>a.completedAt.localeCompare(b.completedAt)||a.id.localeCompare(b.id));
  for(const s of all){const result=score(s);if(s.level!==current||!result.ready)continue;offer=null;
   if(result.ratio<.5){lowStreak++;if(lowStreak>=2){current=Math.max(1,current-1);lowStreak=0;}}
   else{lowStreak=0;if(result.ratio>=.8&&s.feedback==='easy'&&current<5){if(s.promotionAcceptedAt)current++;else offer={sessionId:s.id,level:current+1};}}
  }
  return {current,lowStreak,offer};
 }
 class ActiveClock{
  constructor(onElapsed,now=()=>performance.now()){this.onElapsed=onElapsed;this.now=now;this.context=null;this.running=false;this.last=now();}
  flush(){const at=this.now(),ms=Math.max(0,at-this.last);this.last=at;if(this.running&&this.context&&ms)this.onElapsed(this.context,ms,ms>15000);}
  set(context,running){this.flush();this.context=context;this.running=Boolean(running);this.last=this.now();}
  active(running){this.flush();this.running=Boolean(running);this.last=this.now();}
 }
 function recordTime(s,context,ms,unobserved=false){const row=s.timings[context.episode];if(!row)return;if(unobserved){row.unobservedMs+=ms;return;}if(context.finale&&context.kind==='question'){s.finalQuestionMs+=ms;return;}const field={read:'readingMs',question:'questionMs',draw:'drawingMs',review:'reviewMs'}[context.kind];if(field)row[field]+=ms;}
 function reportRows(sessions){return sessions.flatMap(s=>Object.entries(s.timings).map(([episode,t])=>({session_id:s.id,series_id:s.seriesId,content_hash:s.contentHash,catalog_version:s.catalogVersion,band:s.band,language:s.lang,level:s.level,question_mode:s.questionMode||'',question_ids:(s.questionIds||[]).join('|'),episode:Number(episode),started_at:s.startedAt,completed_at:s.completedAt||'',environment:s.environment||'',device:s.device||'',presentation_version:s.presentationVersion||'',art_version:s.artVersion||'',reading_seconds:Math.round(t.readingMs/1000),question_seconds:Math.round(t.questionMs/1000),drawing_seconds:Math.round(t.drawingMs/1000),rereading_seconds:Math.round(t.reviewMs/1000),unobserved_seconds:Math.round(t.unobservedMs/1000),final_question_seconds:Number(episode)===s.level?Math.round(s.finalQuestionMs/1000):0,units:t.units,unit:s.lang==='ko'?'ko_chars':'en_words',pages:t.pages,completed_pages:t.completedPages.length,episode_read_complete:t.completedPages.length===t.pages,tts_used:t.readAloudUsed,feedback:s.feedback||'',timing_method:s.timingMethod})));}
 const api={BANDS,DOMAINS,FORMS,safeId,version,level,ageBand,units,paginate,pageFingerprint,validateIndex,validateQuestion,validateSeries,questionIds,steps,normalize,hasAnswer,grade,answerText,hash,newSession,score,progressFor,ActiveClock,recordTime,reportRows};
 root.SiaStoryCore=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
