(function(root){
 'use strict';
 const VERSION='read-think-draw-v1';
 function prepare(series,session,levels){
  const C=root.SiaStoryCore||(typeof require==='function'?require('./story-core.js'):null);
  const original=C.steps(series,session.level,levels,{ids:session.questionIds,mode:session.questionMode,seed:session.seed});
  const rank=s=>s.kind==='read'?0:s.q.f==='choice4'?1:s.q.f==='short'?2:3;
  const flow=[...original].sort((a,b)=>rank(a)-rank(b));
  if(session.flowVersion!==VERSION){
   // Keep answered questions, ink and original reading-page IDs. Resume the first unfinished item.
   const first=flow.findIndex(s=>s.kind==='read'?!session.completedReadPages.includes(s.id):!session.answers[s.q.id]?.submittedAt);
   session.stepIndex=session.completedAt?0:Math.max(0,first);session.flowVersion=VERSION;
  }
  session.stepIndex=Math.max(0,Math.min(session.stepIndex,flow.length-1));
  session.plan=flow.filter(s=>s.q).map(s=>({...s}));return flow;
 }
 const api={prepare,VERSION};root.SiaStoryBookFormat=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
