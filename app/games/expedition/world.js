/* Four tactile 3D learning environments. Local Three.js; no remote artwork. */
(function(){'use strict';
 const T=window.THREE;
 function create(canvas,id,onPick){
  const scene=new T.Scene(),renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'}),camera=new T.PerspectiveCamera(39,1,.1,120);
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const palette={'story-studio':[0x392d65,0xffbe91,0xe79077],'balance-port':[0x0a2945,0x67d5e1,0x40597f],'circuit-workshop':[0x194b4c,0xffdb85,0x387278],'habitat-rangers':[0xa3d7cf,0xffecb8,0x70b0a1]}[id];
  scene.background=new T.Color(palette[0]);scene.fog=new T.Fog(palette[0],25,55);
  scene.add(new T.HemisphereLight(palette[1],0x3f5571,.72));const sun=new T.DirectionalLight(0xfff1d3,1.5);sun.position.set(-6,13,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:.1,far:40});sun.shadow.normalBias=.04;scene.add(sun);
  const rim=new T.DirectionalLight(0x75edff,.8);rim.position.set(7,4,-5);scene.add(rim);
  const materials=new Map(),textures=new Map(),targets=[],moving=[],staticGroup=new T.Group(),content=new T.Group();scene.add(staticGroup,content);let task,state={},balanceBeam=null,alive=true,frame=0,celebrate=0;
  const mat=(color,metal=0,rough=.45)=>{const key=color+':'+metal;if(!materials.has(key)){const m=new T.MeshStandardMaterial({color,metalness:metal,roughness:rough});m.color.convertSRGBToLinear();materials.set(key,m);}return materials.get(key);};
  function mesh(geo,color,x=0,y=0,z=0,parent=content,metal=0){const o=new T.Mesh(geo,mat(color,metal));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  const box=(x,y,z,w,h,d,c,p=content)=>mesh(new T.BoxGeometry(w,h,d),c,x,y,z,p);
  const ball=(x,y,z,r,c,p=content)=>mesh(new T.SphereGeometry(r,20,14),c,x,y,z,p);
  const cyl=(x,y,z,rt,rb,h,c,p=content,segments=40)=>mesh(new T.CylinderGeometry(rt,rb,h,segments),c,x,y,z,p);
  function line(a,b,r,c,p=content,metal=.4){const v=new T.Vector3().subVectors(new T.Vector3(...b),new T.Vector3(...a)),o=mesh(new T.CylinderGeometry(r,r,v.length(),12),c,...a,p,metal);o.position.addScaledVector(v,.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
  function label(text,x,y,z,w=1.1,p=content,color='#f8efca'){
   const key=text+'|'+color;let tex=textures.get(key);if(!tex){const c=document.createElement('canvas');c.width=512;c.height=160;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.font='700 82px Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,85,495);tex=new T.CanvasTexture(c);tex.encoding=T.sRGBEncoding;textures.set(key,tex);}
   const o=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthTest:false}));o.position.set(x,y,z);o.scale.set(w,w*.31,1);p.add(o);return o;
  }
  function interactive(o,key){o.userData.pick=key;targets.push(o);return o;}
  function tree(x,z,scale=1,p=content){cyl(x,.5*scale,z,.08*scale,.12*scale,scale,0x785d4a,p,10);ball(x,1.1*scale,z,.52*scale,0x69a883,p);ball(x-.22*scale,1.25*scale,z,.36*scale,0x9bc88c,p);}
  function flower(x,y,z,p=content,color=0xffba6c){line([x,y,z],[x,y+.35,z],.025,0x4f9a6c,p);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ball(x+Math.cos(a)*.12,y+.4,z+Math.sin(a)*.12,.095,color,p);}ball(x,y+.42,z,.075,0xffdd73,p);}
  function haru(x,y,z,scale=1,p=staticGroup){const g=new T.Group();g.position.set(x,y,z);g.scale.setScalar(scale);p.add(g);const body=ball(0,.45,0,.36,0x65cee2,g);body.scale.y=1.28;ball(-.14,.53,.31,.058,0x143b51,g);ball(.14,.53,.31,.058,0x143b51,g);ball(-.13,.55,.356,.017,0xffffff,g);ball(.15,.55,.356,.017,0xffffff,g);ball(-.19,.12,.1,.13,0x4bb7d8,g);ball(.19,.12,.1,.13,0x4bb7d8,g);ball(-.33,.43,0,.1,0x75d9e7,g);ball(.33,.43,0,.1,0x75d9e7,g);if(p===staticGroup)moving.push({g,kind:'bob',base:y});return g;}
  function clear(){targets.length=0;balanceBeam=null;while(content.children.length){const o=content.children[0];o.traverse(n=>{n.geometry?.dispose();if(n.isSprite)n.material.dispose();});content.remove(o);}}
  const floor=mesh(new T.PlaneGeometry(200,200),palette[2],0,-1.15,0,staticGroup);floor.rotation.x=-Math.PI/2;
  if(id==='habitat-rangers'){
   cyl(0,-.65,0,6.8,5.4,1,0x75bbaa,staticGroup,64);cyl(0,-.13,0,6.5,6.6,.22,0xc6dab8,staticGroup,64);
   for(let i=0;i<12;i++){const a=i*.54;tree(Math.cos(a)*5.75,Math.sin(a)*5.2,.55+(i%3)*.15,staticGroup);}
   const ring=mesh(new T.TorusGeometry(6.8,.055,12,100),0xe6edc1,0,0,0,staticGroup,.7);ring.rotation.x=Math.PI/2;
   for(let i=0;i<7;i++){const b=ball(-7+i*2.4,5+(i%2)*.8,-6,.7,0xe9f0dc,staticGroup);b.scale.set(2,.45,.7);}
  }else{
   cyl(0,-.67,0,6.3,5.8,1,0x253e58,staticGroup,64);cyl(0,-.13,0,6.35,6.35,.18,0xd4b98d,staticGroup,64);cyl(0,.01,0,6.05,6.1,.12,palette[2],staticGroup,64);
   for(let i=0;i<48;i++){const a=i*Math.PI/24;const o=box(Math.cos(a)*6.13,-.46,Math.sin(a)*6.13,.04,.35,.12,i%4?0x597b8c:0x92eddd,staticGroup);o.rotation.y=-a;}
   for(let i=0;i<60;i++){const a=i*2.399,r=10+(i%11)*1.7;const s=ball(Math.cos(a)*r,3+(i%9),Math.sin(a)*r,.025+(i%3)*.012,0xd4ebde,staticGroup);moving.push({g:s,kind:'star',base:s.position.y});}
  }
  // Inlaid floor rings and brass fixtures make the learning tools feel like built objects.
  if(id!=='habitat-rangers')for(const radius of [4.85,5.55]){const rail=mesh(new T.TorusGeometry(radius,.025,10,96),0xb6ba9d,0,.095,0,staticGroup,.45);rail.rotation.x=Math.PI/2;}
  if(id==='story-studio'){
   cyl(0,.2,-.2,5.4,5.4,.2,0x67496c,staticGroup,64);
   for(const x of [-5.6,5.6]){cyl(x,2.5,-1,.17,.24,5,0xc6a676,staticGroup);ball(x,5.2,-1,.24,0xffd399,staticGroup);box(x,2.7,-2,1.1,4.8,.35,0x803858,staticGroup);}
   line([-5.6,5.1,-1],[5.6,5.1,-1],.1,0xc6a676,staticGroup);
   for(let i=0;i<8;i++){const x=-4.7+i*1.35;line([x,5,-1],[x,4.5,-1],.015,0xc1ab8d,staticGroup);ball(x,4.4,-1,.12,0xffedb0,staticGroup);}
   tree(-3.8,-3,.75,staticGroup);tree(3.8,-3,.75,staticGroup);box(-4.8,.9,2,.75,1.4,.75,0x20364c,staticGroup);const lens=cyl(-4.8,1.6,2,.2,.2,.45,0xd5bd8b,staticGroup);lens.rotation.x=Math.PI/2;
  }
  if(id==='balance-port'){
   for(const x of [-4.7,4.7]){box(x,.35,-2.2,1.6,.55,1.5,0x325f77,staticGroup);cyl(x,1.1,-2.2,.52,.6,1.2,0x9cd8d3,staticGroup);const dome=ball(x,1.8,-2.2,.55,0xf2d79e,staticGroup);dome.scale.y=.65;}
   const planet=ball(-8,2,-11,2,0x76bdc6,staticGroup);const rings=mesh(new T.TorusGeometry(3.2,.07,12,80),0xdcc399,-8,2,-11,staticGroup,.7);rings.rotation.set(1.05,.4,-.4);
   for(let i=0;i<4;i++){const xx=3.7+i%2*.55,yy=.4+Math.floor(i/2)*.6;box(xx,yy,3.4,.52,.52,.52,[0xe7a372,0x80cbbb][i%2],staticGroup);box(xx,yy,3.675,.12,.48,.025,0xf0d9af,staticGroup);}
  }
  if(id==='circuit-workshop'){
   for(const x of [-5,5]){cyl(x,.7,-2,.7,.9,1.4,0x38677a,staticGroup);cyl(x,1.65,-2,.5,.5,.5,0xd9ac64,staticGroup);ball(x,2.1,-2,.65,0xa2e8d1,staticGroup);}
   for(let i=0;i<4;i++){const a=mesh(new T.TorusGeometry(2.8+i*.17,.025,10,70),0xc3b58b,0,3.4,-4,staticGroup,.7);a.rotation.y=.3;}
   box(4.8,.8,2.5,1.4,1.4,1,0x9da998,staticGroup);label('V',4.8,1.2,3.02,.8,staticGroup,'#233f48');
  }
  haru(-4.6,.12,3.3,1.1);const fireflies=[];for(let i=0;i<22;i++){const b=ball((i%7-3)*2,1+(i%5)*.6,(i%4-2)*2,.028,0xf7e29d,staticGroup);fireflies.push(b);}
  function miniature(kind,step,x,z,p){
   const g=new T.Group();g.position.set(x,.32,z);p.add(g);cyl(0,.1,0,.63,.68,.18,0xbed3b8,g,24);
   if(kind==='plant'){if(step<2)ball(0,.3,0,.16,0xa7764d,g);else if(step<4){line([0,.2,0],[0,.9,0],.055,0x609a64,g);const a=ball(.18,.6,0,.2,0x97bc6d,g);a.scale.set(1,.3,.6);}else{tree(0,0,.75,g);if(kind==='bird')ball(.3,1.2,.2,.14,0xecbb6f,g);else flower(.2,.4,.3,g);}}
   else if(kind==='bird'){
    if(step>=3)tree(-.12,0,.78,g);
    const house=new T.Group();house.position.set(.16,step>=3?.88:.33,.13);if(step<2)house.rotation.z=-.45;g.add(house);
    box(0,0,0,.38,.4,.3,0xb77c55,house);const roof=mesh(new T.ConeGeometry(.35,.22,4),0xc7664e,0,.3,0,house);roof.rotation.y=Math.PI/4;
    ball(0,.06,.165,.075,0x3d4242,house);line([0,-.08,.17],[0,-.08,.3],.018,0xd0af7b,house);
    if(step===1||step===4)haru(-.35,.2,.3,.4,g);
    if(step===5){const bird=ball(.25,1.34,.2,.14,0xf1c36b,g);ball(.35,1.43,.2,.09,0xf1c36b,g);ball(.4,1.45,.26,.015,0x1b3b4b,g);const beak=mesh(new T.ConeGeometry(.04,.12,8),0xd28c47,.45,1.42,.2,g);beak.rotation.z=-Math.PI/2;}
   }
   else if(kind==='bridge'){box(0,.18,0,1.25,.08,.6,0x75c4cb,g);if(step>=2){for(let j=0;j<step-1;j++)box(-.5+j*.2,.35,0,.16,.09,.8,0xd6b787,g);}if(step===5)haru(.15,.4,.1,.5,g);}
   else if(kind==='lamp'){cyl(0,.45,0,.15,.25,.55,0xe1b577,g);ball(0,.86,0,.27,step>=4?0xffec98:0x789caa,g);if(step>=4)label('✦',0,1.4,0,.55,g);}
   else if(kind==='rain'){const cloud=ball(0,1.05,0,.42,step<4?0x7896af:0xf1ddd1,g);cloud.scale.y=.5;for(let k=0;k<3;k++)ball(-.3+k*.3,.55,0,.05,step<4?0x7ed5eb:0xffd078,g);if(step>=2&&step<5){const umbrella=cyl(0,.6,0,.05,.42,.27,0xeec982,g,24);line([0,.4,0],[0,.15,0],.025,0x9b6d55,g);}}
   else {box(0,.23,0,.9,.04,.9,0xa9c294,g);const kite=mesh(new T.OctahedronGeometry(.42,0),0xf2b376,0,.55+step*.1,0,g);kite.scale.z=.2;if(step>2)line([0,.25,0],[0,1.05,0],.01,0xe7d5b1,g);}
  }
  function draw(){clear();if(!task)return;content.scale.setScalar(.98);
   if(id==='story-studio'){
    const chosen=state.answer||[],cols=Math.min(3,task.n),rows=Math.ceil(task.n/cols);
    for(let i=0;i<task.n;i++){const x=(i%cols-(cols-1)/2)*2.55,z=(Math.floor(i/cols)-(rows-1)/2)*2.55;const tile=cyl(x,.27,z,1.03,1.03,.18,chosen[i]?0xd9cfb2:0x977888,content,48);interactive(tile,'slot:'+i);label('0'+(i+1),x,.65,z+1, .5);const card=task.cards.find(c=>c.id===chosen[i]);if(card)miniature(card.scene,card.step,x,z,content);else{const r=mesh(new T.TorusGeometry(.65,.024,8,40),0xbca8ba,x,.4,z);r.rotation.x=Math.PI/2;}}
   }else if(id==='balance-port'){
    cyl(0,1.3,0,.22,.38,2.5,0xf0c378);cyl(0,.32,0,1.1,1.4,.4,0x30566a);cyl(0,.6,0,.48,.6,.2,0xc9b680);for(let i=0;i<8;i++){const a=i*Math.PI/4;ball(Math.cos(a)*.83,.56,Math.sin(a)*.83,.07,0xe3cd9c);}label('=',0,1.2,.4,.8,content,'#234c59');const beam=new T.Group();beam.position.set(0,2.7,0);content.add(beam);balanceBeam=beam;box(0,0,0,6.4,.22,.25,0xe1c28e,beam);ball(0,0,0,.25,0xf4d898,beam);
    const masses=[task.goal,(state.answer||[]).reduce((n,v)=>n+(task.weights.find(w=>w.id===v)?.value||0),0)];
    for(let side=0;side<2;side++){const x=side?2.65:-2.65;line([x,0,-.15],[x,-1.55,-.8],.028,0xdacb96,beam);line([x,0,.15],[x,-1.55,.8],.028,0xdacb96,beam);cyl(x,-1.62,0,1.22,1.03,.16,0x79b5b7,beam);const edge=mesh(new T.TorusGeometry(1.19,.035,10,60),0xdcc491,x,-1.51,0,beam,.6);edge.rotation.x=Math.PI/2;const count=side?Math.min(12,(state.answer||[]).length):1;for(let i=0;i<count;i++){const a=side?state.answer[i]:null;const v=task.weights.find(w=>w.id===a);const xx=x+(side?(i%3-1)*.49:0),y=-1.3+Math.floor(i/6)*.55,z=side?(Math.floor(i/3)%2-.5)*.54:0;box(xx,y,z,side?.43:.96,side?.46:.8,side?.43:.9,side?[0x75cbbe,0xefb475,0xafa0d8][i%3]:0xe3be86,beam);label(side?v?.label||'':task.targetLabel,xx,y+.16,z+.29,side?.45:.85,beam,'#1b3b4c');}label(side?'YOU':'kg',x,-2.06,.5,.7,beam);}
    balanceBeam.userData.angle=T.MathUtils.clamp((masses[0]-masses[1])/Math.max(task.goal,1),-.7,.7)*.22;
   }else if(id==='circuit-workshop'){
    const size=task.size,step=1.28;box(0,.17,0,size*step+.55,.28,size*step+.55,0x183d49);
    task.tiles.forEach((tile,i)=>{const x=(i%size-(size-1)/2)*step,z=(Math.floor(i/size)-(size-1)/2)*step,g=new T.Group();g.position.set(x,.4,z);content.add(g);const base=box(0,0,0,1.12,.18,1.12,0x6c9690,g);interactive(base,'tile:'+i);const ports=tile.ports.map(p=>(p+(state.answer?.[i]||0))%4);ports.forEach(p=>{const v=[[0,-.64],[.64,0],[0,.64],[-.64,0]][p];line([0,.14,0],[v[0],.14,v[1]],.07,state.lit?0xffe291:0xdbab62,g);});cyl(0,.15,0,.105,.105,.08,state.lit?0xfff5ba:0xe3c790,g);label('↻',x,.85,z,.5,content,'#eef5dc');});
    const off=size*step/2+.65,endX=task.path[task.path.length-1]%size===0?-off:off;box(-off,.57,-(size-1)/2*step,.52,.7,.68,0xe8bd6e);label('+',-off,1.17,-(size-1)/2*step,.42);line([-off+.25,.52,-(size-1)/2*step],[-size*step/2,.52,-(size-1)/2*step],.055,0xdbab62);cyl(endX,.57,(size-1)/2*step,.32,.4,.48,0xd8b881);ball(endX,1.1,(size-1)/2*step,.38,state.lit?0xffec9a:0x89b9b0);
    line([endX+(endX<0?.3:-.3),.52,(size-1)/2*step],[(endX<0?-1:1)*size*step/2,.52,(size-1)/2*step],.055,0xdbab62);line([-off,.24,-(size-1)/2*step],[-off,.24,size*step/2+.4],.045,0xc29a67);line([-off,.24,size*step/2+.4],[endX,.24,size*step/2+.4],.045,0xc29a67);line([endX,.24,size*step/2+.4],[endX,.24,(size-1)/2*step],.045,0xc29a67);
   }else{
    window.ExpeditionCore.CELLS.forEach((cell,i)=>{const x=cell.q*1.4,z=(cell.r+cell.q*.5)*1.62,kind=state.answer?.[i],colors={water:0x57bbcb,forest:0x679a72,meadow:0xb7ce80,rock:0x9ca99e};const base=cyl(x,.2,z,.91,.94,.24,colors[kind]||0xe4d6ab,content,6);base.rotation.y=Math.PI/6;interactive(base,'cell:'+i);
     if(kind==='forest')tree(x,z,.68);else if(kind==='water'){const ripple=mesh(new T.TorusGeometry(.5,.02,8,36),0xc1f3e7,x,.38,z);ripple.rotation.x=Math.PI/2;ball(x+.22,.41,z+.1,.09,0x8dad69);}else if(kind==='meadow'){flower(x-.18,.3,z-.2);flower(x+.22,.3,z+.2,content,0xf4b4b4);}else if(kind==='rock'){const a=mesh(new T.DodecahedronGeometry(.4),0xc7c9b7,x,.51,z);a.scale.y=.7;}else label('+',x,.48,z,.42,content,'#859b87');});
   }
  }
  function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.set(10,12,14).multiplyScalar(w/h<1.2?1.3:1);camera.lookAt(0,.7,0);camera.updateProjectionMatrix();}
  const journey=window.SiaJourneyWorld?.create({scene,camera,renderer,canvas,game:id,onInspect:id=>window.dispatchEvent(new CustomEvent('sia-journey-inspect',{detail:id}))});
  const ray=new T.Raycaster(),pointer=new T.Vector2();let down;
  function pick(e){if(!down||Math.hypot(down.x-e.clientX,down.y-e.clientY)>14)return;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(targets)[0];if(hit)onPick(hit.object.userData.pick);}
  canvas.addEventListener('pointerdown',e=>down={x:e.clientX,y:e.clientY});canvas.addEventListener('pointerup',pick);const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);resize();
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,clock=new T.Clock();
  function animate(){if(!alive)return;frame=requestAnimationFrame(animate);if(document.hidden)return;const t=clock.getElapsedTime();if(!reduce){moving.forEach((m,i)=>{m.g.position.y=m.base+Math.sin(t*.8+i)*.05;});fireflies.forEach((f,i)=>{f.position.y=1.4+Math.sin(t*.5+i)*.6;});}if(balanceBeam)balanceBeam.rotation.z=T.MathUtils.lerp(balanceBeam.rotation.z,balanceBeam.userData.angle,.06);if(celebrate>0){celebrate-=.015;rim.intensity=.8+Math.sin(celebrate*10)*.6;}content.scale.lerp(new T.Vector3(1,1,1),.14);journey?.frame(.016);renderer.render(scene,camera);}
  animate();return {journey,set(next,values={}){task=next;state=values;draw();},update(values){state={...state,...values};draw();},celebrate(){celebrate=3;},dispose(){journey?.dispose();alive=false;cancelAnimationFrame(frame);resizeObserver.disconnect();scene.traverse(o=>o.geometry?.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();}};
 }
 window.ExpeditionWorld={create};
})();
