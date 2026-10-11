/* Original, looping fantasy scores. No network calls or licensed recordings. */
(function(){'use strict';
 const THEMES={
  'star-mail':{bpm:76,key:62,mode:[0,2,4,7,9],chords:[0,5,3,4,0,3,5,4],melody:[0,2,3,4,3,2,1,0],colour:'celesta'},
  'cloud-bridge':{bpm:80,key:60,mode:[0,2,4,7,9],chords:[0,3,5,4,0,5,3,4],melody:[0,1,2,4,3,2,4,3],colour:'harp'},
  'prism-lab':{bpm:72,key:65,mode:[0,2,4,7,9],chords:[0,4,5,3,0,5,4,3],melody:[0,3,2,4,1,3,2,0],colour:'glass'},
  'living-forest':{bpm:68,key:57,mode:[0,2,4,7,9],chords:[0,3,0,5,3,4,5,0],melody:[0,2,1,3,2,4,2,0],colour:'flute'},
  'story-studio':{bpm:78,key:60,mode:[0,2,4,7,9],chords:[0,5,3,4,0,3,4,0],melody:[2,3,2,0,1,2,4,3],colour:'celesta'},
  'balance-port':{bpm:70,key:59,mode:[0,2,3,7,9],chords:[0,3,5,4,0,5,3,0],melody:[0,2,4,3,2,1,3,0],colour:'glass'},
  'circuit-workshop':{bpm:84,key:62,mode:[0,2,4,7,9],chords:[0,4,3,5,0,3,4,0],melody:[0,2,1,3,4,2,3,1],colour:'harp'},
  'habitat-rangers':{bpm:70,key:55,mode:[0,2,4,7,9],chords:[0,3,5,0,3,4,5,0],melody:[2,1,0,2,3,4,3,2],colour:'flute'},
  'carousel-pattern':{bpm:78,key:65,mode:[0,2,4,7,9],chords:[0,3,4,0,5,3,4,0],melody:[0,2,4,3,2,1,2,0],colour:'celesta',meter:3},
  'sky-rail':{bpm:82,key:60,mode:[0,2,4,7,9],chords:[0,3,5,4,0,5,3,4],melody:[0,1,3,2,4,3,2,0],colour:'harp'},
  'balloon-safari':{bpm:66,key:62,mode:[0,2,4,7,9],chords:[0,5,3,4,0,3,5,0],melody:[0,3,4,2,3,1,2,0],colour:'flute'}
 };
 function create(game){const theme=THEMES[game]||THEMES['star-mail'];let ctx,master,bus,wet,delay,scheduler,started=false,muted=false,disposed=false,step=0,next=0,duckUntil=0;const nodes=new Set();
  const hz=n=>440*Math.pow(2,(n-69)/12),diatonic=[0,2,4,5,7,9,11],beat=60/theme.bpm,meter=theme.meter||4;
  function envelope(g,t,peak,attack,hold,release){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+attack);g.gain.setValueAtTime(peak,t+attack+hold);g.gain.exponentialRampToValueAtTime(.0001,t+attack+hold+release);}
  function voice(note,t,duration,volume,kind='bell',pan=0){if(!ctx||muted||disposed)return;const gain=ctx.createGain(),stereo=ctx.createStereoPanner();stereo.pan.value=pan;gain.connect(stereo);stereo.connect(bus);stereo.connect(wet);const partials=kind==='pad'?[[1,1,'sine',-5],[1,.6,'sine',5],[2,.12,'sine',0]]:kind==='flute'?[[1,1,'sine',0],[2,.18,'sine',0],[3,.07,'sine',0]]:kind==='glass'?[[1,1,'sine',0],[2.01,.24,'sine',0],[3.98,.05,'sine',0]]:kind==='harp'?[[1,1,'triangle',0],[2,.1,'sine',0]]:[[1,1,'sine',0],[2,.2,'sine',0],[3,.07,'sine',0]];envelope(gain,t,volume,kind==='pad'?.6:.018,kind==='pad'?Math.max(.1,duration-.8):.04,kind==='pad'?1.5:duration);let left=partials.length;
   partials.forEach(([ratio,amp,type,detune])=>{const o=ctx.createOscillator(),part=ctx.createGain();o.type=type;o.frequency.value=hz(note)*ratio;o.detune.value=detune;part.gain.value=amp;o.connect(part);part.connect(gain);nodes.add(o);o.onended=()=>{nodes.delete(o);o.disconnect();part.disconnect();if(--left===0){gain.disconnect();stereo.disconnect();}};o.start(t);o.stop(t+duration+2.2);});
  }
  function compose(){if(!ctx||muted||document.hidden||ctx.state!=='running')return;master.gain.setTargetAtTime(ctx.currentTime<duckUntil?.075:.3,ctx.currentTime,.3);while(next<ctx.currentTime+.2){const bar=Math.floor(step/(meter*2)),eighth=step%(meter*2),root=theme.key+diatonic[theme.chords[bar%8]],section=Math.floor(bar/8)%4;
    if(eighth===0){[0,[0,3,4].includes(theme.chords[bar%8])?4:3,7,12].forEach((offset,i)=>voice(root-12+offset,next,meter*beat,.018/(i?1.4:1),'pad',(i-1.5)*.35));voice(root-24,next,beat*2,.045,'flute',0);}
    const third=[0,3,4].includes(theme.chords[bar%8])?4:3,arp=[0,7,12,third,7,12+third,12,7][eighth%8];voice(root+arp,next,beat*1.6,.034,theme.colour,(eighth%2?1:-1)*.3);
    if(eighth%2===0&&section!==3){const degree=theme.melody[(bar*2+Math.floor(eighth/2))%theme.melody.length],note=theme.key+12+theme.mode[degree%5]+(section===2&&eighth===0?12:0);voice(note,next+.035,beat*1.8,.038,theme.colour,Math.sin(bar)*.25);}
    if(eighth===meter&&bar%2===1)voice(root+24,next,beat*2.4,.014,'glass',.5);
    step++;next+=beat/2;
   }
  }
  function setup(){ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=0;const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-22;compressor.knee.value=20;compressor.ratio.value=3;master.connect(compressor);compressor.connect(ctx.destination);bus=ctx.createBiquadFilter();bus.type='lowpass';bus.frequency.value=4400;bus.Q.value=.3;bus.connect(master);wet=ctx.createGain();wet.gain.value=.14;delay=ctx.createDelay(2);delay.delayTime.value=beat*.75;const feedback=ctx.createGain();feedback.gain.value=.24;const low=ctx.createBiquadFilter();low.type='lowpass';low.frequency.value=2500;wet.connect(delay);delay.connect(low);low.connect(master);low.connect(feedback);feedback.connect(delay);next=ctx.currentTime+.08;}
  function start(){if(disposed)return;try{if(!ctx)setup();ctx.resume().catch(()=>{});if(!started){started=true;scheduler=setInterval(compose,50);}next=Math.max(next,ctx.currentTime+.06);compose();}catch{}}
  function mute(value){muted=!!value;if(ctx){master.gain.setTargetAtTime(muted?0:.3,ctx.currentTime,.15);if(!muted){next=ctx.currentTime+.08;ctx.resume().catch(()=>{});}}}
  function duck(text){if(ctx)duckUntil=Math.max(duckUntil,ctx.currentTime+Math.min(30,Math.max(2.6,String(text).length*(/[가-힣]/.test(text)?.125:.07))));}
  function cue(index){if(ctx&&ctx.state==='running'&&!muted)voice(theme.key+12+theme.mode[index%5],ctx.currentTime+.01,.45,.22,'glass',0);}
  function visibility(){if(!ctx)return;if(document.hidden){ctx.suspend().catch(()=>{});}else if(started&&!muted){next=ctx.currentTime+.08;ctx.resume().catch(()=>{});}}
  function dispose(){disposed=true;clearInterval(scheduler);document.removeEventListener('visibilitychange',visibility);nodes.forEach(o=>{try{o.stop();}catch{}});ctx?.close();}
  document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',dispose,{once:true});return {start,mute,duck,cue,dispose};
 }
 window.SiaJourneyMusic={create,THEMES};
})();
