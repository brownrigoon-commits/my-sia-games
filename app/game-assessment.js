(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SiaGameAssessment=api;})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const integer=n=>Number.isSafeInteger(n)&&n>=0;
 // Read only the game's published score interface. Missing evidence never becomes a perfect score.
 function snapshot(view,id){
  try{
   let errors,detail;
   if(typeof view.SiaGameProgress==='function'){detail=view.SiaGameProgress();errors=detail.mistakes;}
   else if(id==='fossil-dig'){
    const s=view.__fossil;if(!s)return null;
    errors=s.wrongDrops+Math.max(0,(s.quiz?.taps||0)-(s.quizRight?1:0));
   }else if(id==='fruit-stand')errors=view.__fruit?.mistakes;
   else{
    const s=view.__game;if(!s)return null;
    if(id==='letter-flight')errors=s.score?.().mistakes;
    else if(id==='float-lab'){detail=s.progress?.();const score=detail?.score;if(integer(score?.n)&&integer(score?.ok)&&score.ok<=score.n)errors=score.n-score.ok;}
    else errors=typeof s.mistakes==='function'?s.mistakes():s.mistakes;
   }
   return integer(errors)?{mistakes:errors}:null;
  }catch{return null;}
 }
 function outcome(record,evidence){
  const known=evidence&&integer(evidence.mistakes),mistakes=known?evidence.mistakes:null;
  return {policy:1,verified:!!known,passed:!!known&&mistakes===0,completed:true,mistakes};
 }
 return {snapshot,outcome};
});
