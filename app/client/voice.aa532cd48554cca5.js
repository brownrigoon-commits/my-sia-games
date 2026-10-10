(function(root){
 'use strict';
 let generation=0,timer=null,current=null,voices=[];
 const synth=root.speechSynthesis;
 function refresh(){voices=synth?.getVoices?.()||[];}
 if(synth){refresh();synth.addEventListener?.('voiceschanged',refresh);}
 function stop(){generation++;clearTimeout(timer);current=null;synth?.cancel();}
 function choose(lang){refresh();const code=lang.slice(0,2);return voices.filter(v=>v.lang.replace('_','-').slice(0,2)===code).sort((a,b)=>rank(b)-rank(a))[0];
  function rank(v){return (/premium|enhanced|natural|프리미엄|고품질/i.test(v.name)?100:0)+(/yuna|유나|sora|소라|ava|samantha/i.test(v.name)?15:0)+(v.lang===lang?5:0)+(v.localService?2:0);}
 }
 function sentences(text,lang){if(root.Intl?.Segmenter)return [...new Intl.Segmenter(lang,{granularity:'sentence'}).segment(text)].map(x=>x.segment.trim()).filter(Boolean);return String(text).split(/(?<=[.!?。！？])\s+|\n+/).map(x=>x.trim()).filter(Boolean);}
 function speak(text,lang='ko-KR',onError=()=>{}){stop();if(!synth){onError();return false;}const ticket=generation,parts=sentences(String(text),lang);let i=0;
  function next(){if(ticket!==generation||i>=parts.length)return;const u=new SpeechSynthesisUtterance(parts[i++]);current=u;u.lang=lang;u.voice=choose(lang)||null;u.rate=lang.startsWith('ko')?.9:.86;u.onend=()=>{if(ticket===generation)timer=setTimeout(next,160);};u.onerror=e=>{if(ticket===generation&&!['canceled','interrupted'].includes(e.error))onError();};synth.speak(u);}
  next();return true;
 }
 root.SiaVoice={speak,stop,choose,sentences};
})(window);

