(function(root){
 'use strict';
 const KEY='mysia-voice-settings-v1',STYLES={gentle:{ko:.91,en:.93,pitch:1.04,pause:280},bright:{ko:1,en:1,pitch:1.08,pause:200},calm:{ko:.85,en:.87,pitch:1,pause:340}};
 const synth=root.speechSynthesis,watchers=new Set(),attached=new WeakSet();
 let generation=0,timer=null,current=null,signature='';
 const language=lang=>String(lang||'ko').toLowerCase().startsWith('en')?'en':'ko';
 function read(key,fallback){try{return JSON.parse(root.localStorage.getItem(key))??fallback;}catch{return fallback;}}
 function settings(){const s=read(KEY,{});return {style:Object.hasOwn(STYLES,s.style)?s.style:'gentle',speed:[.9,1,1.1].includes(s.speed)?s.speed:1};}
 const selected=lang=>{const value=read('mysia-voice-'+language(lang),null);return typeof value==='string'?value:null;};
 function installed(view=root){try{return Array.from(view.speechSynthesis?.getVoices?.()||[]);}catch{return [];}}
 function refresh(){const all=installed(),sig=all.map(v=>v.voiceURI+'|'+v.name+'|'+v.lang).join(';');if(sig!==signature){signature=sig;watchers.forEach(fn=>fn());}return all;}
 function rank(v,lang){const n=v.name+' '+v.voiceURI,female=lang==='ko'?/yuna|유나|sora|소라|sunhi|선히|heami|혜미|seoyeon|서연|soonbok|순복/i:/samantha|ava|zoe|allison|joelle|jenny|aria|emma|michelle|susan|zira|victoria|karen|moira|tessa/i;return (female.test(n)?1000:0)+(/premium|enhanced|프리미엄|향상|고품질/i.test(n)?200:0)+(/natural|neural|자연/i.test(n)?150:0)+(v.lang.toLowerCase()===(lang==='en'?'en-us':'ko-kr')?5:0)+(v.localService?2:0);}
 function list(lang,view=root){const code=language(lang),all=view===root?refresh():installed(view);return all.filter(v=>String(v.lang).replace('_','-').toLowerCase().split('-')[0]===code).sort((a,b)=>rank(b,code)-rank(a,code));}
 function choose(lang,view=root,uri=selected(lang)){const voices=list(lang,view);return voices.find(v=>uri&&(v.voiceURI===uri||v.name===uri))||voices[0]||null;}
 function delivery(lang,s=settings()){const style=STYLES[s.style]||STYLES.gentle,speed=[.9,1,1.1].includes(s.speed)?s.speed:1;return {rate:Math.round(style[language(lang)]*speed*1000)/1000,pitch:style.pitch,pause:style.pause};}
 function save(next){if(!next||!Object.hasOwn(STYLES,next.style)||![.9,1,1.1].includes(next.speed))return false;const entries=[[KEY,JSON.stringify({version:1,style:next.style,speed:next.speed})],...['ko','en'].map(lang=>['mysia-voice-'+lang,next[lang]?JSON.stringify(String(next[lang])):null])];let before;
  try{before=entries.map(([key])=>[key,root.localStorage.getItem(key)]);for(const [key,value] of entries){if(value===null)root.localStorage.removeItem(key);else root.localStorage.setItem(key,value);}return true;}catch{if(before)for(const [key,value] of before)try{if(value===null)root.localStorage.removeItem(key);else root.localStorage.setItem(key,value);}catch{}return false;}
 }
 function stop(){generation++;clearTimeout(timer);current=null;try{synth?.cancel();}catch{}}
 function sentences(text,lang){if(root.Intl?.Segmenter)return [...new root.Intl.Segmenter(lang,{granularity:'sentence'}).segment(text)].map(x=>x.segment.trim()).filter(Boolean);return String(text).split(/(?<=[.!?。！？])\s+|\n+/).map(x=>x.trim()).filter(Boolean);}
 function speak(text,lang='ko-KR',onError=()=>{},options={}){stop();if(!synth||!root.SpeechSynthesisUtterance){onError();return false;}const ticket=generation,parts=sentences(String(text),lang),tone=delivery(lang,options.settings);let i=0;
  function next(){if(ticket!==generation)return;if(i>=parts.length){current=null;options.onEnd?.();return;}const u=new root.SpeechSynthesisUtterance(parts[i++]);current=u;u.lang=language(lang)==='en'?'en-US':'ko-KR';u.voice=choose(lang,root,Object.hasOwn(options,'voiceURI')?options.voiceURI:selected(lang));u.rate=tone.rate;u.pitch=tone.pitch;u.onend=()=>{if(ticket===generation)timer=setTimeout(next,tone.pause);};u.onerror=e=>{if(ticket===generation&&!['canceled','interrupted'].includes(e.error)){current=null;onError();}};try{synth.speak(u);}catch{onError();}}
  next();return true;
 }
 // Use Claude's public voice API without changing game files, timing promises or mute controls.
 function attach(view){const core=view?.SiaVoiceCore;if(!core||attached.has(core))return false;attached.add(core);const say=core.say.bind(core);
  core.get=lang=>choose(lang,view);core.best=lang=>choose(lang,view,null);
  core.say=(text,lang,options={})=>{const tone=delivery(lang);return say(text,lang,{...options,rate:tone.rate,pitch:tone.pitch,clips:false});};
  return true;
 }
 function onVoices(fn){watchers.add(fn);return ()=>watchers.delete(fn);}
 synth?.addEventListener?.('voiceschanged',refresh);root.addEventListener?.('storage',e=>{if(e.key===KEY||e.key?.startsWith('mysia-voice-'))watchers.forEach(fn=>fn());});
 root.SiaVoice={speak,stop,choose,sentences,list,settings,selected,delivery,save,attach,onVoices};
})(window);
