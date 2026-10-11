/* Astra miniature worlds. Procedural Three.js r128 art; no network assets. */
(function () {
  'use strict';

  function create(options) {
    var T = window.THREE;
    if (!T) throw new Error('Three.js is required');
    var canvas = options.canvas, game = options.game, onPick = options.onPick || function () {};
    var mobile = Math.min(window.innerWidth, window.innerHeight) < 650;
    var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var reducedMotion = !!(motionQuery && motionQuery.matches);
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.4 : 1.7));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.94;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    var palettes = {
      'star-mail': ['#cbd5ed', '#b8c4e6', '#fff3db'],
      'cloud-bridge': ['#c3e5e5', '#a4d1cf', '#fff1d4'],
      'prism-lab': ['#d6e3e2', '#bdd7d3', '#fff4df'],
      'living-forest': ['#cedfd2', '#adc8b6', '#fff3cc']
    };
    var palette = palettes[game] || palettes['star-mail'];
    var scene = new T.Scene();
    scene.background = new T.Color(palette[0]);
    scene.fog = new T.Fog(palette[0], 33, 68);
    var camera = new T.PerspectiveCamera(34, 1, 0.1, 120);
    var world = new T.Group(); scene.add(world);
    var geometries = new Map(), materials = new Map(), disposables = [], ticks = [], interactives = [];
    var state = { progress: 0, bridge: 0, selected: [], lights: {}, chain: [] }, task = {}, elapsed = 0;
    var alive = true, raf = 0, last = 0, celebration = 0, hovered = null, pointerDown = null;
    var clamp = T.MathUtils.clamp;
    function geo(key, make) { if (!geometries.has(key)) geometries.set(key, make()); return geometries.get(key); }
    function mat(color, type) {
      type = type || 'clay'; var key = color + '/' + type;
      if (!materials.has(key)) {
        // r128 predates automatic sRGB color management. Hex art colors must be
        // decoded once before lighting, otherwise outputEncoding washes them out.
        var linearColor = new T.Color(color).convertSRGBToLinear();
        var m = type === 'glow' ? new T.MeshBasicMaterial({ color: linearColor, toneMapped: false }) :
          new T.MeshStandardMaterial({ color: linearColor, roughness: type === 'metal' ? 0.28 : type === 'gloss' ? 0.27 : 0.68, metalness: type === 'metal' ? 0.55 : 0.04, envMapIntensity: 0.40 });
        materials.set(key, m);
      }
      return materials.get(key);
    }
    function mesh(parent, geometry, material, p, s) {
      var m = new T.Mesh(geometry, typeof material === 'string' ? mat(material) : material);
      if (p) m.position.set(p[0], p[1], p[2]);
      if (s) m.scale.set(s[0], s[1], s[2]);
      m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
    }
    function group(parent, x, y, z) { var g = new T.Group(); g.position.set(x || 0, y || 0, z || 0); parent.add(g); return g; }
    function ball(p, c, x, y, z, sx, sy, sz) {
      return mesh(p, geo('sphere', function () { return new T.SphereGeometry(1, 24, 16); }), c, [x,y,z], [sx,sy === undefined ? sx : sy,sz === undefined ? sx : sz]);
    }
    function box(p, c, x, y, z, w, h, d, radius) {
      var r = Math.min(radius === undefined ? 0.055 : radius, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
      if (r < 0.012) return mesh(p, geo('box', function () { return new T.BoxGeometry(1,1,1); }), c,[x,y,z],[w,h,d]);
      var key = ['round',w,h,d,r].join(':');
      var geometry = geo(key, function () {
        var sh = new T.Shape(), a = w / 2 - r, b = h / 2 - r;
        sh.moveTo(-a,-h/2); sh.lineTo(a,-h/2); sh.quadraticCurveTo(w/2,-h/2,w/2,-b);
        sh.lineTo(w/2,b); sh.quadraticCurveTo(w/2,h/2,a,h/2); sh.lineTo(-a,h/2);
        sh.quadraticCurveTo(-w/2,h/2,-w/2,b); sh.lineTo(-w/2,-b); sh.quadraticCurveTo(-w/2,-h/2,-a,-h/2);
        var g = new T.ExtrudeGeometry(sh,{depth:d-2*r,bevelEnabled:true,bevelSize:r,bevelThickness:r,bevelSegments:3,steps:1,curveSegments:5});
        g.translate(0,0,-d/2+r); g.computeVertexNormals(); return g;
      });
      return mesh(p, geometry, c,[x,y,z]);
    }
    function cylinder(p,c,x,y,z,r,h,rt,n) {
      var top = rt === undefined ? r : rt, seg = n || 48;
      return mesh(p,geo(['cyl',r,h,top,seg].join(':'),function(){return new T.CylinderGeometry(top,r,h,seg);}),c,[x,y,z]);
    }
    function ring(p,c,x,y,z,r,t,rotation) {
      var m=mesh(p,geo('torus:'+r+':'+t,function(){return new T.TorusGeometry(r,t,10,64);}),c,[x,y,z]);
      if(rotation) m.rotation.set(rotation[0],rotation[1],rotation[2]); return m;
    }
    function line(p,c,points,r) {
      var curve = new T.CatmullRomCurve3(points.map(function(v){return new T.Vector3(v[0],v[1],v[2]);}));
      var g = new T.TubeGeometry(curve, Math.max(12,points.length*8),r||.025,6,false); disposables.push(g);
      return mesh(p,g,c);
    }
    function between(p,c,a,b,r) {
      var av=new T.Vector3().fromArray(a),bv=new T.Vector3().fromArray(b),delta=bv.clone().sub(av);
      var m=cylinder(p,c,0,0,0,r,delta.length(),r,12);
      m.position.copy(av.add(bv).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()); return m;
    }
    function pick(g,id) { g.userData.pickId=id; interactives.push(g); return g; }
    function float(g,amount,speed,phase) { var y=g.position.y; ticks.push(function(t){g.position.y=y+Math.sin(t*speed+(phase||0))*amount*(reducedMotion ? .12 : 1);}); }
    function star(p,c,x,y,z,r) {
      var g = geo('star',function(){var sh=new T.Shape();for(var i=0;i<10;i++){var a=Math.PI/2+i*Math.PI/5,rr=i%2?.47:1;var xx=Math.cos(a)*rr,yy=Math.sin(a)*rr;if(i===0)sh.moveTo(xx,yy);else sh.lineTo(xx,yy);}sh.closePath();var gg=new T.ExtrudeGeometry(sh,{depth:.16,bevelEnabled:true,bevelThickness:.065,bevelSize:.055,bevelSegments:2,steps:1});gg.translate(0,0,-.08);return gg;});
      return mesh(p,g,c,[x,y,z],[r,r,r]);
    }
    function cloud(p,x,y,z,s) {
      var g=group(p,x,y,z);g.scale.setScalar(s);
      [[0,0,0,1.0,.35,.56],[-.62,.02,0,.6,.39,.5],[.64,-.02,.03,.66,.3,.48],[-.17,.19,-.05,.48,.41,.45]].forEach(function(a){ball(g,'#f4f5f2',a[0],a[1],a[2],a[3],a[4],a[5]);});return g;
    }
    function flower(p,x,y,z,color,s) {
      var g=group(p,x,y,z);g.scale.setScalar(s||1);
      cylinder(g,'#65875b',0,.17,0,.022,.34,.022,7);
      for(var i=0;i<5;i++){var a=i*Math.PI*2/5;ball(g,color,Math.cos(a)*.09,.38,Math.sin(a)*.09,.08,.045,.065);}
      ball(g,'#f5ce6d',0,.40,0,.052,.04,.052);return g;
    }
    function tree(p,x,y,z,s,color) {
      var g=group(p,x,y,z);g.scale.setScalar(s||1);
      cylinder(g,'#ae8666',0,.6,0,.11,1.2,.075,10);
      between(g,'#ae8666',[0,.65,0],[-.38,1.12,0],.05);
      ball(g,color||'#78a998',0,1.45,0,.62,.86,.59);
      ball(g,color||'#78a998',-.36,1.29,.1,.39,.51,.39);
      ball(g,color||'#78a998',.35,1.32,-.1,.38,.53,.37);
      ball(g,'#a7c99c',-.2,1.94,.23,.18,.17,.17);return g;
    }
    function haru(p,x,y,z,scale) {
      var g=group(p,x,y,z);g.scale.setScalar(scale||1);
      var dg=geo('haru-drop',function(){var points=[new T.Vector2(0,-.42),new T.Vector2(.29,-.39),new T.Vector2(.43,-.17),new T.Vector2(.46,.06),new T.Vector2(.38,.32),new T.Vector2(.23,.53),new T.Vector2(.10,.72),new T.Vector2(0,.91)];return new T.LatheGeometry(points,40);});
      mesh(g,dg,mat('#51b6e5','gloss'),[0,.44,0]);
      ball(g,'#264a61',-.145,.59,.388,.037,.058,.032);ball(g,'#264a61',.145,.59,.388,.037,.058,.032);
      ball(g,'#fffdf2',-.155,.61,.415,.011);ball(g,'#fffdf2',.135,.61,.415,.011);
      ball(g,'#ed9ba7',-.27,.48,.355,.068,.033,.015);ball(g,'#ed9ba7',.27,.48,.355,.068,.033,.015);
      line(g,'#285b75',[[-.048,.48,.421],[0,.451,.427],[.048,.48,.421]],.014);
      ball(g,'#77d1ef',-.47,.29,.02,.105,.17,.10).rotation.z=-.4;
      var hand=ball(g,'#77d1ef',.47,.4,.01,.105,.18,.10);hand.rotation.z=.65;
      ball(g,'#309bcb',-.18,.025,.08,.15,.075,.18);ball(g,'#309bcb',.18,.025,.08,.15,.075,.18);
      ball(g,mat('#d4f6fa','gloss'),-.19,.80,.32,.075,.14,.025).rotation.z=-.45;
      ticks.push(function(t){hand.rotation.z=.65+Math.sin(t*2.6)*.18*(reducedMotion?.1:1);g.rotation.y=Math.sin(t*.55)*.09*(reducedMotion?.1:1);});return g;
    }
    function contact(p,x,y,z,sx,sz) {
      var texture=geo('contactTexture',function(){var c=document.createElement('canvas');c.width=c.height=64;var ctx=c.getContext('2d'),gr=ctx.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(26,63,68,0.3)');gr.addColorStop(.45,'rgba(26,63,68,0.12)');gr.addColorStop(1,'rgba(26,63,68,0)');ctx.fillStyle=gr;ctx.fillRect(0,0,64,64);return new T.CanvasTexture(c);});
      var m=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false});disposables.push(m);
      var o=mesh(p,geo('plane',function(){return new T.PlaneGeometry(1,1);}),m,[x,y,z],[sx,sz,1]);o.rotation.x=-Math.PI/2;o.castShadow=false;return o;
    }

    // A small procedural studio environment provides broad reflections on enamel and glass.
    var envScene=new T.Scene();envScene.background=new T.Color('#b7cbd1');
    var envGeo=new T.PlaneGeometry(12,12),envMat=new T.MeshBasicMaterial({color:'#ffffff'});
    [[0,8,0,-Math.PI/2,0],[-7,2,1,0,Math.PI/2],[5,4,-7,0,0]].forEach(function(a){var p=new T.Mesh(envGeo,envMat);p.position.set(a[0],a[1],a[2]);p.rotation.set(a[3],a[4],0);envScene.add(p);});
    var pmrem=new T.PMREMGenerator(renderer),environment=pmrem.fromScene(envScene,.07);
    scene.environment=environment.texture;pmrem.dispose();envGeo.dispose();envMat.dispose();
    scene.add(new T.HemisphereLight('#f3f8ff','#8ba0a9',.63));
    var key=new T.DirectionalLight('#fff0d2',1.65);key.position.set(-7,12,8);key.castShadow=true;
    key.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);key.shadow.camera.left=-10;key.shadow.camera.right=10;
    key.shadow.camera.top=10;key.shadow.camera.bottom=-9;key.shadow.camera.near=1;key.shadow.camera.far=35;
    key.shadow.normalBias=.035;key.shadow.bias=-.0003;key.shadow.radius=4;scene.add(key);
    var fill=new T.DirectionalLight('#b5dffa',.48);fill.position.set(5,6,-8);scene.add(fill);
    var ground=cylinder(scene,palette[1],0,-3.0,0,80,.1,80,64);ground.castShadow=false;
    contact(scene,0,-2.93,0,20,15);
    var gold=mat('#e6b969','metal'),cream=mat('#f4e8d1'),teal=mat('#487f83','gloss');
    var update=function(){}, haruFigure;

    function mailWorld() {
      var island=group(world,0,0,0);
      cylinder(island,'#9caccb',0,-.45,0,4.3,1.25,3.7,12);
      cylinder(island,'#d0c8e8',0,.18,0,4.15,.22,4.15,64);
      cylinder(island,'#f7e9dc',0,.32,0,3.95,.10,3.95,64);
      ring(island,gold,0,.43,0,3.69,.023,[Math.PI/2,0,0]);
      for(var i=0;i<18;i++){var a=i*Math.PI*2/18;star(island,mat('#faf4da','glow'),Math.cos(a)*3.45,.45,Math.sin(a)*3.45,.07).rotation.x=-Math.PI/2;}
      cloud(world,-3.6,-.7,.7,1.65);cloud(world,2.8,-.65,-1,1.7);cloud(world,.3,-1.15,2.5,2.1);
      var office=group(island,-.6,.39,-.65);
      cylinder(office,'#eadaca',0,1.12,0,1.45,2.15,1.45,48);
      cylinder(office,'#d29c9e',0,.16,0,1.57,.3,1.57,48);
      cylinder(office,'#cbbacf',0,2.2,0,1.64,.22,1.64,48);
      var roof=ball(office,'#9e9abe',0,2.25,0,1.68,.85,1.68);
      cylinder(office,gold,0,2.78,0,.19,.65,.055,24);
      star(office,gold,0,3.27,0,.32);
      // Scalloped eaves, brass ribs and a generous illuminated arched front door.
      for(i=0;i<14;i++){a=i*Math.PI*2/14;ball(office,'#bdb0d0',Math.cos(a)*1.56,2.17,Math.sin(a)*1.56,.15,.15,.15);}
      var door=pick(group(office,0,0,1.43),'action');
      box(door,'#725f87',0,.95,0,.94,1.64,.16,.17);
      box(door,'#86bcc0',0,1.02,.10,.72,1.34,.09,.18);
      box(door,'#304f68',0,1.02,.17,.44,.10,.035,.01);
      box(door,gold,0,.92,.18,.51,.035,.055,.009);
      ball(door,gold,.24,.72,.18,.045);
      for(i=0;i<3;i++)box(office,'#e4d1bf',0,.045+i*.085,1.7-i*.12,1.5-i*.12,.13,.7,.04);
      [-1,1].forEach(function(s){var win=group(office,s*1.02,1.29,1.08);win.rotation.y=s*.53;box(win,gold,0,0,0,.48,.68,.07,.14);box(win,mat('#fff3c6','glow'),0,0,.05,.36,.54,.045,.1);box(win,'#ac8b82',0,0,.09,.034,.54,.03,.005);});
      var sign=group(office,0,1.95,1.49);box(sign,'#f8edce',0,0,0,1.25,.33,.14,.055);
      star(sign,gold,-.42,0,.09,.085);star(sign,gold,.42,0,.09,.085);
      // An embossed envelope symbol replaces tiny unreadable lettering.
      box(sign,'#9d8cb4',0,0,.09,.34,.2,.04,.015);line(sign,'#f5ead7',[[-.16,.09,.125],[0,-.025,.13],[.16,.09,.125]],.014);
      for(i=0;i<3;i++){var slot=pick(group(island,2.25,.46,-.7+i*.85),i===0?'left':i===1?'action':'right');cylinder(slot,'#928faf',0,.42,0,.12,.8,.1,16);box(slot,['#debacb','#91c4c7','#f0c795'][i],0,.94,0,.68,.66,.64,.12);box(slot,'#6c718c',0,1.01,.335,.4,.065,.025,.009);star(slot,gold,0,.8,.346,.09);}
      haruFigure=haru(island,-1.98,.42,1.36,.82);
      var satchel=box(haruFigure,'#e8ad71',.37,.3,.32,.27,.29,.14,.035);satchel.rotation.z=-.2;
      var airship=pick(group(world,3.0,4.20,-1.7),'right');
      ball(airship,'#f3d2a5',0,.3,0,1.35,.55,.56);
      ring(airship,gold,-.65,.3,0,.48,.025,[0,Math.PI/2,0]);ring(airship,gold,.60,.3,0,.49,.025,[0,Math.PI/2,0]);
      box(airship,'#967e98',0,-.55,0,.86,.31,.40,.06);
      [-.33,.33].forEach(function(x){between(airship,gold,[x,-.4,-.14],[x,.04,-.31],.015);between(airship,gold,[x,-.4,.14],[x,.04,.31],.015);});
      var fin=box(airship,'#d69ea5',-1.10,.60,0,.48,.46,.045,.025);fin.rotation.z=-.5;
      var prop=group(airship,-1.46,.15,0);box(prop,gold,0,0,0,.07,.48,.065,.02);ticks.push(function(t){prop.rotation.x=t*12;airship.position.x=3+Math.sin(t*.25)*.5;});float(airship,.17,.9,1);
      line(world,mat('#eee6d4'),[[-4.4,3,-2.2],[-2,4.8,-3.5],[1.2,4.9,-3.3],[4.4,3.8,-1.9]],.018);
      for(i=0;i<7;i++){a=i*.74;var ss=star(world,gold,-4.3+i*1.4,3.3+Math.sin(a)*1.55,-2.7,.10+(i%3)*.04);float(ss,.1,.9,i);}
      var letters=[];
      for(i=0;i<5;i++){var letter=group(world,0,0,0);box(letter,['#fff1d0','#c1e2dc','#f2ced9'][i%3],0,0,0,.40,.28,.045,.018);line(letter,'#cda787',[[-.18,.12,.034],[0,-.025,.04],[.18,.12,.034]],.009);letters.push(letter);}
      ticks.push(function(t){letters.forEach(function(l,i){var a=(t*.13+i/5)%1*Math.PI*2;l.position.set(Math.cos(a)*4.5,1.8+Math.sin(a*.5)*1.1,Math.sin(a)*2.4);l.rotation.set(Math.sin(t+i)*.1,-.3+Math.cos(a)*.4,Math.sin(a)*.17);});});
      // Physical letter trays make every answer selection visible in the scene.
      var trays=[],letterTiles=[];
      for(i=0;i<5;i++){
        var tray=group(island,-1.02+i*.65,.43,2.67);
        box(tray,'#c8b9c9',0,.04,0,.55,.075,.47,.035);
        var tile=group(tray,0,.13,0);tile.rotation.x=-.85;
        box(tile,'#fff0d0',0,0,0,.44,.30,.045,.018);
        line(tile,'#c99e8b',[[-.2,.13,.035],[0,-.025,.041],[.2,.13,.035]],.012);
        star(tile,gold,0,-.005,.065,.058);
        tile.scale.setScalar(.001);trays.push(tray);letterTiles.push(tile);
      }
      var delivered=group(world,0,0,0);delivered.visible=false;
      box(delivered,'#fff0c9',0,0,0,.62,.43,.07,.028);
      line(delivered,'#ca9982',[[-.28,.19,.052],[0,-.035,.061],[.28,.19,.052]],.017);
      star(delivered,gold,0,-.015,.086,.08);
      var deliveryTrail=[];for(i=0;i<9;i++){var dot=ball(world,mat('#ffdf91','glow'),0,0,0,.037);dot.visible=false;deliveryTrail.push(dot);}
      var deliveryTime=-1,mailCorrect=false,selectedCount=0;
      var deliveryCurve=new T.CubicBezierCurve3(new T.Vector3(.25,.92,2.65),new T.Vector3(2.0,3.6,2.5),new T.Vector3(-.6,3.2,2.1),new T.Vector3(-.6,1.41,.99));
      ticks.push(function(t,dt){
        letterTiles.forEach(function(tile,index){var goal=index<selectedCount?1:.001;tile.scale.setScalar(tile.scale.x+(goal-tile.scale.x)*Math.min(1,dt*9));});
        if(deliveryTime<0)return;
        var duration=reducedMotion?.65:1.75;deliveryTime+=dt;var q=clamp(deliveryTime/duration,0,1);
        delivered.visible=q<1;delivered.position.copy(deliveryCurve.getPoint(q));delivered.rotation.set(0,Math.sin(q*Math.PI)*.55,Math.sin(q*Math.PI)*-.18);delivered.scale.setScalar(q>.8?1-(q-.8)*4.9:1);
        deliveryTrail.forEach(function(dot,index){var dq=q-index*.035;dot.visible=q<1&&dq>0;dot.position.copy(deliveryCurve.getPoint(clamp(dq,0,1)));dot.scale.setScalar(.037*(1-index*.07));});
        if(q>=1){deliveryTime=-1;delivered.visible=false;deliveryTrail.forEach(function(dot){dot.visible=false;});}
      });
      update=function(){
        selectedCount=Math.min(5,(state.selected||[]).length);
        letters.forEach(function(l){l.scale.setScalar(1+(state.progress||0)*.20);});
        trays.forEach(function(tray,index){tray.children[0].material=index<selectedCount?mat('#80bdb9'):mat('#c8b9c9');});
        if(state.correct===true&&!mailCorrect){deliveryTime=0;delivered.scale.setScalar(1);}
        mailCorrect=state.correct===true;
      };
    }

    function bridgeWorld() {
      function cliff(x,s) {
        var g=group(world,x,0,0);cylinder(g,'#b2bab1',0,-.68,0,1.1,2.5,2.32,7);
        cylinder(g,'#d3c6ac',0,.4,0,2.30,.45,2.4,12);cylinder(g,'#88ac8a',0,.64,0,2.38,.13,2.33,48);
        cylinder(g,'#b4cba0',0,.725,0,2.17,.07,2.17,48);
        for(var k=0;k<5;k++){var a=k*1.23;ball(g,'#bec6b7',Math.cos(a)*1.4,-.85-k*.07,Math.sin(a)*1.2,.38,.72,.34);}
        tree(g,s*.7,.76,-1.25,.93,'#6e9e8b');tree(g,-s*.8,.76,-.98,.66,'#b1c4a0');
        for(k=0;k<7;k++)flower(g,Math.sin(k*2.1)*1.7,.77,Math.cos(k*1.9)*1.5,k%2?'#faf0c3':'#e5aaa2',.7);
        cloud(world,x,-1.5,0,1.9);return g;
      }
      cliff(-4.25,-1);cliff(4.25,1);
      // A stream pours over the back of the right island into the cloud sea.
      var waterMat=new T.MeshPhysicalMaterial({color:new T.Color('#81d9df').convertSRGBToLinear(),roughness:.22,metalness:.12,transparent:true,opacity:.68,envMapIntensity:.4});disposables.push(waterMat);
      box(world,waterMat,5.28,-.2,-1.22,.46,2.65,.15,.05);
      for(var k=0;k<3;k++){var streak=box(world,mat('#d2f5ef','glow'),5.13+k*.13,-.3,-1.11,.018,1.75,.025,.008);ticks.push((function(m,i){return function(t){m.position.y=-.4+Math.sin(t*1.8+i)*.22;};})(streak,k));}
      cloud(world,0,-1.60,-.4,3.0);cloud(world,-2.1,-1.25,1.8,1.55);cloud(world,2.3,-1.35,2.4,1.8);
      var segments=[];
      for(var i=0;i<4;i++){
        var seg=pick(group(world,-1.65+i*1.10,.82,.35),'action');segments.push(seg);
        for(k=0;k<5;k++)box(seg,'#d6b587',-.44+k*.22,0,0,.19,.13,1.18,.028);
        [-.45,.45].forEach(function(x){[-.59,.59].forEach(function(z){cylinder(seg,'#bd9973',x,.29,z,.038,.65,.038,8);ball(seg,gold,x,.64,z,.057);});});
        [-.59,.59].forEach(function(z){between(seg,'#e9d7b2',[-.48,.5,z],[.48,.5,z],.023);box(seg,'#8e7974',0,.12,z*.65,1.12,.035,.048,.008);});
      }
      // Ghost bridge cradles make the four construction steps visually legible.
      var ghostMat=new T.MeshStandardMaterial({color:'#b1d8cd',roughness:.8,transparent:true,opacity:.24});disposables.push(ghostMat);
      for(i=0;i<4;i++){var ghost=box(world,ghostMat,-1.65+i*1.1,.61,.35,1.0,.08,1.0,.015);ghost.castShadow=false;}
      [-1,1].forEach(function(s){var gate=group(world,s*2.22,.77,.35);[-.79,.79].forEach(function(z){cylinder(gate,'#f1dfb7',0,.6,z,.09,1.2,.085,16);ball(gate,gold,0,1.24,z,.12);});line(gate,'#e7c6a0',[[0,1.23,-.79],[0,1.48,0],[0,1.23,.79]],.04);});
      var station=pick(group(world,4.7,.79,-.1),'action');
      box(station,'#e8d7ac',0,.7,0,1.14,1.34,.9,.07);box(station,'#62918f',0,1.41,0,1.45,.23,1.2,.08);
      box(station,'#b88479',0,1.57,0,1.20,.16,1.04,.05);box(station,'#46676d',0,.54,.49,.45,.84,.04,.1);
      ring(station,gold,0,1.09,.51,.14,.025);ball(station,'#ffedbc',0,1.09,.5,.115,.115,.015);
      var train=pick(group(world,-4.2,.86,.37),'left');
      box(train,'#dca08a',0,.23,0,1.22,.31,.66,.07);box(train,'#588e91',-.3,.61,0,.55,.60,.57,.07);
      box(train,'#f2d9b2',-.3,.98,0,.70,.12,.76,.04);box(train,'#d6ece2',-.3,.65,.3,.32,.28,.02,.035);
      var boiler=cylinder(train,'#e5ba7b',.30,.50,0,.24,.70,.24,32);boiler.rotation.z=Math.PI/2;
      cylinder(train,'#557d83',.49,.82,0,.10,.32,.085,16);cylinder(train,gold,.49,.995,0,.14,.045,.14,16);
      ball(train,mat('#fff4c3','glow'),.67,.5,0,.10,.12,.12);
      var wheels=[];[-.38,.37].forEach(function(x){[-.37,.37].forEach(function(z){var w=cylinder(train,'#435e65',x,.12,z,.19,.07,.19,20);w.rotation.x=Math.PI/2;wheels.push(w);ball(train,gold,x,.12,z*1.13,.064,.064,.025);});});
      var wagon=group(train,-1.2,0,0);box(wagon,'#81aaa0',0,.26,0,.79,.29,.61,.04);box(wagon,'#f0cc8b',0,.56,0,.53,.32,.43,.035);box(wagon,'#ce8e7e',.08,.8,0,.33,.16,.3,.025);
      [-.25,.25].forEach(function(x){[-.32,.32].forEach(function(z){var w=cylinder(wagon,'#53676b',x,.1,z,.14,.065,.14,16);w.rotation.x=Math.PI/2;});});
      haruFigure=haru(world,-3.7,.79,1.54,.62);
      var steam=[];for(i=0;i<4;i++){var puff=ball(world,'#f6f5e9',0,0,0,.15);steam.push(puff);}
      ticks.push(function(t,dt){var goal=-4.0+clamp((state.bridge||0)/4,0,1)*7.7;train.position.x+=(goal-train.position.x)*Math.min(1,dt*1.7);train.position.y=.86+.16*clamp((3.0-Math.abs(train.position.x))/.8,0,1);wheels.forEach(function(w){w.rotation.y=-train.position.x*3;});steam.forEach(function(p,i){var q=(t*.37+i*.25)%1;p.position.set(train.position.x+.48-q*.45,train.position.y+1.03+q*1.4,.35);p.scale.setScalar(.10+q*.25);p.visible=q<.85;});segments.forEach(function(s,i){var built=i<(state.bridge||0);s.position.y+=( (built?.82:-.1)-s.position.y)*Math.min(1,dt*5);s.scale.y+=((built?1:.04)-s.scale.y)*Math.min(1,dt*5);});});
      update=function(){segments.forEach(function(s,i){s.visible=i<(state.bridge||0)||s.position.y>0;});};
      var balloon=group(world,-4.8,4.3,-1.1);ball(balloon,'#dfb7ab',0,0,0,.59,.78,.58);box(balloon,'#c19d78',0,-1.12,0,.35,.25,.3,.025);[-.15,.15].forEach(function(x){between(balloon,'#c9b391',[x,-1,0],[x,-.60,0],.012);});float(balloon,.15,.65);
    }

    function prismWorld() {
      var base=group(world,0,0,0);
      cylinder(base,'#779a9b',0,-.27,0,4.15,.68,4.15,64);cylinder(base,gold,0,.07,0,4.20,.06,4.20,64);
      cylinder(base,'#f4ecd9',0,.17,0,4.10,.18,4.10,64);
      ring(base,'#b7cdc1',0,.275,0,3.62,.028,[Math.PI/2,0,0]);
      // A curved conservatory with three open bays and delicate brass roofwork.
      for(var i=0;i<7;i++){
        var a=Math.PI*.10+i*Math.PI*.8/6,xx=Math.cos(a)*3.43,zz=-Math.sin(a)*3.43;
        cylinder(base,cream,xx,1.72,zz,.11,2.95,.1,16);cylinder(base,gold,xx,.38,zz,.17,.2,.17,20);
        ball(base,gold,xx,3.23,zz,.14);
        line(base,teal,[[xx,3.16,zz],[xx*.8,3.85,zz*.8],[xx*.4,4.31,zz*.4],[0,4.47,0]],.045);
      }
      for(var level=0;level<2;level++){
        var pts=[];for(i=0;i<=24;i++){a=Math.PI*.10+i*Math.PI*.8/24;pts.push([Math.cos(a)*3.43,3.05+level*.15,-Math.sin(a)*3.43]);}line(base,teal,pts,.06);
      }
      var glass=new T.MeshPhysicalMaterial({color:new T.Color('#baded9').convertSRGBToLinear(),transparent:true,opacity:.16,roughness:.14,metalness:.1,side:T.DoubleSide,depthWrite:false,envMapIntensity:.4});disposables.push(glass);
      for(i=0;i<6;i++){a=Math.PI*.10+(i+.5)*Math.PI*.8/6;var pane=box(base,glass,Math.cos(a)*3.41,1.93,-Math.sin(a)*3.41,1.25,2.18,.035,.02);pane.rotation.y=a-Math.PI/2;pane.castShadow=false;}
      ball(base,gold,0,4.48,0,.20);star(base,gold,0,4.83,0,.20);
      var pedestal=pick(group(base,0,.28,0),'action');
      cylinder(pedestal,'#81a6a4',0,.25,0,1.02,.5,1.02,48);cylinder(pedestal,gold,0,.51,0,1.08,.08,1.08,48);
      cylinder(pedestal,'#e8e4d3',0,.62,0,.87,.16,.87,48);
      ring(pedestal,gold,0,.73,0,.64,.03,[Math.PI/2,0,0]);
      var crystalMat=new T.MeshPhysicalMaterial({color:new T.Color('#c4f5e5').convertSRGBToLinear(),roughness:.05,metalness:.16,clearcoat:1,clearcoatRoughness:.05,transparent:true,opacity:.83,emissive:'#87c7b5',emissiveIntensity:.12,envMapIntensity:.45});disposables.push(crystalMat);
      var crystal=mesh(pedestal,geo('crystal',function(){return new T.OctahedronGeometry(.86,0);}),crystalMat,[0,1.65,0],[.74,1.27,.74]);
      var inner=mesh(pedestal,geo('crystalCore',function(){return new T.OctahedronGeometry(.5,0);}),mat('#d5fff1','glow'),[0,1.65,0],[.58,1.38,.58]);
      ticks.push(function(t){crystal.rotation.y=t*.22;inner.rotation.y=-t*.33;crystal.position.y=1.65+Math.sin(t*1.3)*.09;inner.position.y=crystal.position.y;});
      var emitters={}, beams={}, lights={}, colors={red:'#ff837f',green:'#87e0a4',blue:'#80b4ff'};
      var positions={red:[-2.75,.4,1.2],green:[0,.4,2.95],blue:[2.75,.4,1.2]};
      Object.keys(colors).forEach(function(id){
        var pos=positions[id],g=pick(group(base,pos[0],pos[1],pos[2]),id);emitters[id]=g;
        cylinder(g,'#e3d9bf',0,.08,0,.49,.16,.49,40);cylinder(g,gold,0,.22,0,.33,.12,.33,32);
        cylinder(g,'#629292',0,.50,0,.25,.51,.25,32);ball(g,colors[id],0,.86,0,.38,.32,.38);
        var lens=ball(g,mat(colors[id],'glow'),0,.98,0,.21,.14,.21);lights[id]=lens;
        ring(g,gold,0,.76,0,.38,.032,[Math.PI/2,0,0]);
        var beamMat=new T.MeshBasicMaterial({color:new T.Color(colors[id]).convertSRGBToLinear(),transparent:true,opacity:.38,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false});disposables.push(beamMat);
        var midpoint=[pos[0]*.39,1.6765,pos[2]*.39];
        var b=between(base,beamMat,[pos[0],1.28,pos[2]],midpoint,.065);b.castShadow=false;beams[id]=b;
        var outerMat=beamMat.clone();outerMat.opacity=.10;disposables.push(outerMat);var out=between(base,outerMat,[pos[0],1.28,pos[2]],midpoint,.19);out.castShadow=false;b.userData.outer=out;
        var output=between(base,beamMat,midpoint,[0,1.93,0],.065);output.castShadow=false;b.userData.output=output;
        var outputGlow=between(base,outerMat,midpoint,[0,1.93,0],.19);outputGlow.castShadow=false;b.userData.outputGlow=outputGlow;
        var stop=ball(base,mat(colors[id],'glow'),midpoint[0],midpoint[1],midpoint[2],.09,.035,.09);stop.visible=false;b.userData.stop=stop;
        for(var q=0;q<3;q++){var pip=ball(g,gold,-.12+q*.12,.40,.247,.026);}
      });
      // A tiny workbench, glass specimens and a book make this a working laboratory.
      var desk=group(base,-2,.3,-1.3);box(desk,'#d4b98c',0,.84,0,1.6,.15,.7,.045);
      [-.65,.65].forEach(function(x){[-.22,.22].forEach(function(z){cylinder(desk,teal,x,.42,z,.035,.82,.035,10);});});
      for(i=0;i<3;i++){var bottle=group(desk,-.48+i*.43,.93,0);cylinder(bottle,glass,0,.19,0,.12,.32,.10,24);cylinder(bottle,glass,0,.4,0,.065,.15,.065,20);cylinder(bottle,['#dfaba7','#a6cdb3','#9bbace'][i],0,.12,0,.09,.18,.09,24);cylinder(bottle,gold,0,.48,0,.078,.06,.078,16);}
      tree(base,2.3,.3,-1.55,.75,'#93b4a0');cylinder(base,'#d8b29d',2.3,.5,-1.55,.39,.45,.31,32);
      var books=group(base,1.4,.3,-2);for(i=0;i<3;i++){var bk=box(books,['#b6c2d9','#d2b1a5','#88ada5'][i],0,.09+i*.14,0,.8,.13,.52,.018);bk.rotation.y=i*.14;}
      haruFigure=haru(base,-1.50,.3,1.10,.72);
      var orbit=ring(base,gold,0,1.94,0,1.25,.014,[.3,.4,0]);ticks.push(function(t){orbit.rotation.y=t*.17;});
      var filterHolder=group(base,0,1.6765,0);filterHolder.visible=false;
      ring(filterHolder,gold,0,0,0,1.28,.032,[Math.PI/2,0,0]);
      between(filterHolder,gold,[1.28,0,0],[1.92,0,0],.045);box(filterHolder,teal,1.93,0,0,.35,.13,.18,.04);
      var filterMat=new T.MeshPhysicalMaterial({color:'#ffffff',roughness:.15,metalness:.06,transparent:true,opacity:.42,depthWrite:false,envMapIntensity:.2,side:T.DoubleSide});disposables.push(filterMat);
      var filterDisc=cylinder(filterHolder,filterMat,0,0,0,1.25,.024,1.25,64);filterDisc.castShadow=false;
      update=function(){
        var ls=state.lights||{},filter=['red','green','blue'].indexOf(state.filter)>=0?state.filter:'clear';
        var channels={red:!!ls.red&&(filter==='clear'||filter==='red'),green:!!ls.green&&(filter==='clear'||filter==='green'),blue:!!ls.blue&&(filter==='clear'||filter==='blue')};
        Object.keys(colors).forEach(function(id){
          var active=!!ls[id],passes=channels[id],beam=beams[id],factor=active?1.17:.74;
          beam.visible=active;beam.userData.outer.visible=active;beam.userData.output.visible=passes;beam.userData.outputGlow.visible=passes;
          beam.userData.stop.visible=active&&!passes;lights[id].scale.set(.21*factor,.14*factor,.21*factor);
        });
        filterHolder.visible=filter!=='clear';if(filterHolder.visible)filterMat.color.set(colors[filter]).convertSRGBToLinear();
        var r=channels.red?1:0,g=channels.green?1:0,b=channels.blue?1:0,col=new T.Color();
        if(r+g+b)col.setRGB(r*.93+.015,g*.93+.015,b*.93+.015);else col.set('#537b7a').convertSRGBToLinear();
        crystalMat.color.copy(col);crystalMat.emissive.copy(col);crystalMat.emissiveIntensity=r+g+b?.18:0;
        inner.visible=!!(r+g+b);inner.material=mat('#'+col.clone().convertLinearToSRGB().getHexString(),'glow');
      };
    }

    function forestWorld() {
      cylinder(world,'#b7ad91',0,-.36,0,4.8,.9,4.55,12);
      cylinder(world,'#799985',0,.10,0,4.66,.12,4.64,64);cylinder(world,'#a7ba91',0,.18,0,4.49,.10,4.47,64);
      var pond=group(world,.2,.25,1.02);
      var pondEdge=cylinder(pond,'#dad2b5',0,0,0,1.93,.12,1.93,64);pondEdge.scale.set(1.25,1,.72);
      var water=new T.MeshPhysicalMaterial({color:new T.Color('#68b7b9').convertSRGBToLinear(),roughness:.19,metalness:.2,clearcoat:1,envMapIntensity:.4});disposables.push(water);
      var pondWater=cylinder(pond,water,0,.07,0,1.79,.035,1.79,64);pondWater.scale.set(1.25,1,.71);
      var ripples=[];for(var i=0;i<3;i++){var rp=ring(pond,'#b1dcce',-.45,.095,-.1,.37+i*.16,.009,[Math.PI/2,0,0]);rp.scale.y=.65;ripples.push(rp);}
      ticks.push(function(t){ripples.forEach(function(r,i){r.scale.set(1+Math.sin(t*1.5+i)*.09,.7+Math.sin(t*1.5+i)*.06,1);});});
      [[-1.3,.08,.35],[.85,.08,-.25],[1.2,.08,.43]].forEach(function(a){var pad=cylinder(pond,'#719975',a[0],a[1]+.04,a[2],.30,.024,.30,32);pad.scale.z=.78;flower(pond,a[0],a[1]+.045,a[2],'#edb6c4',.53);});
      for(i=0;i<11;i++){var a=i*Math.PI/10,xx=Math.cos(a)*3.5,zz=-Math.sin(a)*2.65;tree(world,xx,.25,zz,.80+(i%3)*.23,['#719b83','#88ab8a','#acc08e'][i%3]);}
      for(i=0;i<20;i++){a=i*2.39;var rr=2.7+(i%4)*.30;flower(world,Math.cos(a)*rr,.27,Math.sin(a)*rr*.8,i%3?'#f2dec0':'#dab1b6',.60+(i%3)*.13);}
      for(i=0;i<9;i++){a=i*1.8;ball(world,'#c6c5a8',Math.cos(a)*3.0,.33,Math.sin(a)*2.45,.20+i%2*.08,.12,.19);}
      function animal(type,x,z) {
        var g=pick(group(world,x,.29,z),type),rabbit=type==='rabbit',c=rabbit?'#f6e9d2':'#d79d74';
        ball(g,c,0,.35,0,.43,.38,.34);ball(g,c,.03,.72,.15,.31,.3,.29);
        if(rabbit){[-.14,.16].forEach(function(xx){var ear=ball(g,c,xx,1.16,.09,.10,.36,.095);ear.rotation.z=xx*.8;var inside=ball(g,'#ddb9ae',xx,1.17,.169,.045,.25,.016);inside.rotation.z=xx*.8;});ball(g,'#fff5df',-.34,.35,-.21,.15);}
        else {[-.20,.20].forEach(function(xx){var e=mesh(g,geo('foxEar',function(){return new T.ConeGeometry(.16,.36,3);}),c,[xx,1.03,.05]);e.rotation.y=Math.PI/6;});var tail=ball(g,c,-.43,.40,-.22,.48,.19,.20);tail.rotation.z=-.40;ball(g,'#f5e8cb',-.78,.55,-.22,.16,.17,.17);ball(g,'#f4e3c5',.03,.62,.39,.23,.14,.12);}
        [-.095,.12].forEach(function(xx){ball(g,'#3c514c',xx,.78,.406,.022,.032,.02);});ball(g,'#986d68',.018,.68,.451,.036,.027,.025);
        [-.21,.21].forEach(function(xx){ball(g,c,xx,.09,.15,.14,.09,.21);});
        ticks.push(function(t){g.rotation.y=Math.sin(t*.75+(rabbit?0:3))*.10;});return g;
      }
      var rabbit=animal('rabbit',-2.3,.43),fox=animal('fox',2.48,.56);
      var leaf=pick(group(world,-1.45,.30,-1.0),'leaf');
      cylinder(leaf,'#698d67',0,.4,0,.035,.8,.025,9);
      [-1,1].forEach(function(s){var l=ball(leaf,s<0?'#7caa73':'#adc784',s*.24,.60,0,.35,.14,.17);l.rotation.z=s*.4;});
      flower(leaf,0,.68,0,'#f7df91',1.6);
      var sun=pick(group(world,2.15,4.1,-2),'sun');ball(sun,mat('#ffdf8c','glow'),0,0,0,.49);
      for(i=0;i<10;i++){a=i*Math.PI*2/10;var ray=box(sun,'#edc77d',Math.cos(a)*.72,Math.sin(a)*.72,0,.075,.22,.07,.02);ray.rotation.z=a-Math.PI/2;}
      ball(sun,'#997e54',-.15,.05,.47,.027,.042,.015);ball(sun,'#997e54',.15,.05,.47,.027,.042,.015);
      line(sun,'#997e54',[[-.07,-.1,.485],[0,-.14,.495],[.07,-.1,.485]],.013);float(sun,.11,.8);
      var bird=pick(group(world,.15,2.8,-1.6),'bird');ball(bird,'#82b5c4',0,0,0,.26,.21,.24);ball(bird,'#eedfc0',0,-.05,.18,.15,.13,.09);
      var wings=[];[-1,1].forEach(function(s){var w=ball(bird,'#6395aa',s*.26,.05,0,.28,.065,.16);wings.push(w);});var beak=mesh(bird,geo('birdBeak',function(){return new T.ConeGeometry(.07,.20,5);}),gold,[0,.06,.3]);beak.rotation.x=Math.PI/2;
      [-.095,.095].forEach(function(x){ball(bird,'#30484d',x,.09,.205,.021);});
      ticks.push(function(t){bird.position.x=Math.sin(t*.6)*.55;bird.position.y=2.8+Math.sin(t*1.2)*.15;wings[0].rotation.z=Math.sin(t*5)*.3;wings[1].rotation.z=-Math.sin(t*5)*.3;});
      haruFigure=haru(world,.3,.3,2.65,.65);
      var nodes={sun:sun,leaf:leaf,rabbit:rabbit,fox:fox,bird:bird},links=[];
      [['sun','leaf'],['leaf','rabbit'],['rabbit','fox'],['leaf','bird']].forEach(function(pair){var a=nodes[pair[0]].position,b=nodes[pair[1]].position;var ln=line(world,mat('#f1df9c','glow'),[[a.x,a.y+.42,a.z],[ (a.x+b.x)/2,Math.max(a.y,b.y)+.5,(a.z+b.z)/2],[b.x,b.y+.5,b.z]],.027);ln.visible=false;ln.castShadow=false;links.push({mesh:ln,pair:pair});});
      var nodeRings={};Object.keys(nodes).forEach(function(id){var n=nodes[id];nodeRings[id]=ring(world,gold,n.position.x,.31,n.position.z,.57,.03,[Math.PI/2,0,0]);if(id==='sun'||id==='bird')nodeRings[id].visible=false;});
      // Neutral stepping stones represent sequence positions for every curriculum,
      // including events/decomposers that are intentionally not invented as animals.
      var stones=[],stoneLights=[],stonePaths=[],blossoms=[];
      for(i=0;i<5;i++){
        var angle=Math.PI*.18+i*Math.PI*.64/4,px=Math.cos(angle)*3.55,pz=Math.sin(angle)*3.27;
        var stone=group(world,px,.29,pz);cylinder(stone,'#d2c7a8',0,.05,0,.26,.10,.29,12);
        var stoneLight=ring(stone,gold,0,.12,0,.19,.025,[Math.PI/2,0,0]);stoneLight.visible=false;
        for(var pip=0;pip<=i;pip++){var pa=pip*Math.PI*2/(i+1);ball(stone,'#a59475',Math.cos(pa)*.10,.12,Math.sin(pa)*.10,.019,.012,.019);}
        stones.push(stone);stoneLights.push(stoneLight);
        if(i){var prev=stones[i-1].position;var path=line(world,mat('#f2d787','glow'),[[prev.x,.38,prev.z],[(prev.x+px)/2,.45,(prev.z+pz)/2],[px,.38,pz]],.022);path.visible=false;stonePaths.push(path);}
      }
      for(i=0;i<10;i++){var ba=i*Math.PI*2/10;var bloom=flower(world,Math.cos(ba)*2.72,.29,Math.sin(ba)*2.22,['#f6d58b','#e1aabf','#f4ede0'][i%3],1);bloom.scale.setScalar(.001);blossoms.push(bloom);}
      var forestCorrect=false,bloomTime=-1,forestCount=0;
      ticks.push(function(t,dt){
        stones.forEach(function(stone,index){var target=index<forestCount?.38:.29;stone.position.y+=(target-stone.position.y)*Math.min(1,dt*7);});
        if(bloomTime<0)return;bloomTime+=dt;
        var duration=reducedMotion?.8:2.6,phase=clamp(bloomTime/duration,0,1);
        blossoms.forEach(function(bloom,index){var grow=Math.max(.001,Math.sin(phase*Math.PI))*(.9+index%3*.18);bloom.scale.set(grow,grow,grow);});
        if(phase>=1){bloomTime=-1;blossoms.forEach(function(bloom){bloom.scale.setScalar(.001);});}
      });
      var fireflies=[];for(i=0;i<12;i++){var f=ball(world,mat('#fff0af','glow'),0,0,0,.025);fireflies.push(f);}
      ticks.push(function(t){fireflies.forEach(function(f,i){f.position.set(Math.sin(t*.25+i*2.2)*3.6,.8+(Math.sin(t*.37+i)*.5+.5)*1.5,Math.cos(t*.28+i*1.4)*2.6);f.scale.setScalar(.025*(.6+Math.sin(t*2+i)*.3));});});
      update=function(){
        var chain=state.chain&&state.chain.length?state.chain:(state.selected||[]);
        links.forEach(function(l){l.mesh.visible=chain.some(function(id,index){return id===l.pair[0]&&chain[index+1]===l.pair[1];});});
        Object.keys(nodes).forEach(function(id){if(id!=='sun'&&id!=='bird')nodeRings[id].visible=chain.indexOf(id)>=0;});
        forestCount=Math.min(5,chain.length);stoneLights.forEach(function(light,index){light.visible=index<forestCount;});stonePaths.forEach(function(path,index){path.visible=index+1<forestCount;});
        if(state.correct===true&&!forestCorrect)bloomTime=0;forestCorrect=state.correct===true;
      };
    }

    if(game==='cloud-bridge')bridgeWorld();else if(game==='prism-lab')prismWorld();else if(game==='living-forest')forestWorld();else mailWorld();
    // A light field of drifting motes adds depth without post-processing passes.
    var moteGeo=new T.BufferGeometry(),moteCount=mobile?34:64,motePositions=new Float32Array(moteCount*3);
    for(var mi=0;mi<moteCount;mi++){motePositions[mi*3]=Math.sin(mi*127.1)*9;motePositions[mi*3+1]=Math.cos(mi*57.7)*4+2;motePositions[mi*3+2]=Math.sin(mi*19.3)*6-3;}
    moteGeo.setAttribute('position',new T.BufferAttribute(motePositions,3));disposables.push(moteGeo);
    var moteMat=new T.PointsMaterial({color:palette[2],size:.047,transparent:true,opacity:.8,depthWrite:false});disposables.push(moteMat);
    var motes=new T.Points(moteGeo,moteMat);world.add(motes);
    var confetti=[];
    for(var ci=0;ci<(mobile?32:52);ci++){var conf=mesh(world,geo('confetti',function(){return new T.BoxGeometry(.075,.13,.025);}),mat(['#f7d777','#8dcccd','#d9b0c9','#a5c995','#f2b39a'][ci%5]),[0,0,0]);conf.visible=false;conf.castShadow=false;conf.userData.seed=ci;confetti.push(conf);}
    var journey=window.SiaJourneyWorld?.create({scene,camera,renderer,canvas,game:game,onInspect:id=>window.dispatchEvent(new CustomEvent('sia-journey-inspect',{detail:id}))});
    var raycaster=new T.Raycaster(),pointer=new T.Vector2();
    function hit(e) {
      var rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
      raycaster.setFromCamera(pointer,camera);var hits=raycaster.intersectObjects(interactives,true);
      for(var i=0;i<hits.length;i++){var ob=hits[i].object,visible=true;while(ob&&ob!==scene){if(!ob.visible)visible=false;if(ob.userData.pickId&&visible)return ob;ob=ob.parent;}}return null;
    }
    function move(e){hovered=hit(e);canvas.style.cursor=hovered?'pointer':'';}
    function down(e){pointerDown={x:e.clientX,y:e.clientY};}
    function up(e){if(!pointerDown)return;var d=Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y);pointerDown=null;if(d>12)return;var h=hit(e);if(h)onPick(h.userData.pickId);}
    canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointerup',up);
    function resize(){if(!alive)return;var rect=canvas.getBoundingClientRect(),w=Math.max(1,rect.width||canvas.clientWidth||window.innerWidth),h=Math.max(1,rect.height||canvas.clientHeight||window.innerHeight);renderer.setSize(w,h,false);camera.aspect=w/h;
      var distance=24.5*Math.max(1,1.32/camera.aspect);camera.position.set(distance*.31,distance*.49,distance*.86);
      camera.lookAt(0,-.6,0);camera.updateProjectionMatrix();}
    function frame(now){if(!alive||document.hidden){raf=0;return;}var dt=Math.min(.05,last?(now-last)/1000:.016);last=now;elapsed+=dt*(reducedMotion?.08:1);
      ticks.forEach(function(fn){fn(elapsed,dt);});motes.rotation.y=elapsed*.012;
      if(celebration>0){celebration=Math.max(0,celebration-dt);var t=(reducedMotion?.65:2.6)-celebration;confetti.forEach(function(c,i){var a=i*2.399,velocity=1.8+(i%7)*.3;c.visible=celebration>0&&(!reducedMotion||i<16);if(reducedMotion){c.position.set(Math.cos(a)*(1.6+i%3*.4),1.7+Math.sin(a)*.6+t*.25,Math.sin(a)*1.1);c.rotation.set(0,a,0);}else{c.position.set(Math.cos(a)*velocity*t,1.1+(3.6+(i%5)*.6)*t-2.6*t*t,Math.sin(a)*velocity*t*.7);c.rotation.set(t*(i%5+1),a+t*2,t*3);}});if(haruFigure&&!reducedMotion)haruFigure.scale.y=haruFigure.scale.x*(1+Math.sin(t*10)*Math.exp(-t*1.5)*.12);}
      journey?.frame(dt);renderer.render(scene,camera);raf=requestAnimationFrame(frame);}
    function visibility(){last=0;if(!document.hidden&&!raf&&alive)raf=requestAnimationFrame(frame);}
    function motionPreference(e){reducedMotion=e.matches;}
    if(motionQuery){if(motionQuery.addEventListener)motionQuery.addEventListener('change',motionPreference);else if(motionQuery.addListener)motionQuery.addListener(motionPreference);}
    document.addEventListener('visibilitychange',visibility);window.addEventListener('resize',resize);
    var observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;if(observer)observer.observe(canvas);
    resize();update();raf=requestAnimationFrame(frame);
    return {
      journey:journey,
      setTask:function(next){task=next||{};state.progress=0;update();},
      setState:function(next){state=Object.assign({},state,next||{});update();},
      celebrate:function(){celebration=reducedMotion?.65:2.6;},
      resize:resize,
      dispose:function(){if(!alive)return;journey?.dispose();alive=false;cancelAnimationFrame(raf);if(observer)observer.disconnect();if(motionQuery){if(motionQuery.removeEventListener)motionQuery.removeEventListener('change',motionPreference);else if(motionQuery.removeListener)motionQuery.removeListener(motionPreference);}window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointerup',up);canvas.style.cursor='';geometries.forEach(function(g){g.dispose();});materials.forEach(function(m){m.dispose();});disposables.forEach(function(d){d.dispose();});environment.dispose();if(key.shadow.map)key.shadow.map.dispose();renderer.dispose();ticks.length=interactives.length=0;}
    };
  }
  window.AstraWorld={create:create};
})();
