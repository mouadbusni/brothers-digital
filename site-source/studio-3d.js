(() => {
  'use strict';
  let canvas=document.getElementById('studio-model');
  const panel=document.querySelector('.studio-art');
  const BD=window.BD;if(!canvas||!panel||!BD)return;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const palette={ivory:[242,239,231],ink:[32,37,34],olive:[107,122,86],stone:[200,200,189],sage:[148,158,126]};
  const norm=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l);};
  const sub=(a,b)=>a.map((v,i)=>v-b[i]);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const unit=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
  const mul=(a,b)=>{const o=new Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;};
  const rx=a=>{const c=Math.cos(a),s=Math.sin(a);return[1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1];};
  const ry=a=>{const c=Math.cos(a),s=Math.sin(a);return[c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1];};
  const rz=a=>{const c=Math.cos(a),s=Math.sin(a);return[c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1];};
  const translate=(x,y,z)=>{const m=unit();m[12]=x;m[13]=y;m[14]=z;return m;};
  const point=(m,v)=>[m[0]*v[0]+m[4]*v[1]+m[8]*v[2]+m[12],m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13],m[2]*v[0]+m[6]*v[1]+m[10]*v[2]+m[14]];
  const direction=(m,v)=>norm([m[0]*v[0]+m[4]*v[1]+m[8]*v[2],m[1]*v[0]+m[5]*v[1]+m[9]*v[2],m[2]*v[0]+m[6]*v[1]+m[10]*v[2]]);
  function mesh(){return{p:[],n:[]};}
  function tri(g,a,b,c,na,nb=na,nc=na){g.p.push(...a,...b,...c);g.n.push(...na,...nb,...nc);}
  function quad(g,a,b,c,d,na,nb=na,nc=na,nd=na){tri(g,a,b,c,na,nb,nc);tri(g,a,c,d,na,nc,nd);}
  function roundedLoop(w,h,r,inset=0){
    w-=inset*2;h-=inset*2;r=Math.max(.005,r-inset);const out=[];
    const corners=[[w/2-r,h/2-r,0],[-w/2+r,h/2-r,Math.PI/2],[-w/2+r,-h/2+r,Math.PI],[w/2-r,-h/2+r,Math.PI*1.5]];
    for(const[x,y,start]of corners)for(let j=0;j<=6;j++){const a=start+j/6*Math.PI/2;out.push([x+Math.cos(a)*r,y+Math.sin(a)*r]);}
    return out;
  }
  function slab(w,h,d,r=.14){
    const g=mesh(),bevel=Math.min(.055,d*.28,r*.45),rows=[];
    for(let j=0;j<=3;j++){const a=j/3*Math.PI/2;rows.push({z:d/2-bevel+Math.cos(a)*bevel,inset:bevel*(1-Math.sin(a)),nx:Math.sin(a),nz:Math.cos(a)});}
    for(let j=3;j>=0;j--){const a=j/3*Math.PI/2;rows.push({z:-d/2+bevel-Math.cos(a)*bevel,inset:bevel*(1-Math.sin(a)),nx:Math.sin(a),nz:-Math.cos(a)});}
    const loops=rows.map(row=>roundedLoop(w,h,r,row.inset)),n=loops[0].length;
    const get=(i,j)=>[...loops[i][j],rows[i].z];
    const normal=(i,j)=>{const before=loops[i][(j+n-1)%n],after=loops[i][(j+1)%n],v=norm([after[1]-before[1],before[0]-after[0],0]);return[v[0]*rows[i].nx,v[1]*rows[i].nx,rows[i].nz];};
    for(let i=0;i<rows.length-1;i++)for(let j=0;j<n;j++){const k=(j+1)%n;quad(g,get(i,j),get(i+1,j),get(i+1,k),get(i,k),normal(i,j),normal(i+1,j),normal(i+1,k),normal(i,k));}
    for(let j=0;j<n;j++){const k=(j+1)%n;tri(g,[0,0,d/2],get(0,j),get(0,k),[0,0,1]);tri(g,[0,0,-d/2],get(rows.length-1,k),get(rows.length-1,j),[0,0,-1]);}
    return g;
  }
  function polygon(outline,depth){
    let points=outline.map(v=>v.slice());const area=points.reduce((s,p,i)=>{const q=points[(i+1)%points.length];return s+p[0]*q[1]-q[0]*p[1];},0);if(area<0)points.reverse();
    const g=mesh(),ids=points.map((_,i)=>i),z=depth/2;
    const turn=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    const inside=(p,a,b,c)=>turn(a,b,p)>=-1e-8&&turn(b,c,p)>=-1e-8&&turn(c,a,p)>=-1e-8;
    let guard=0;
    while(ids.length>2&&guard++<100){let found=false;for(let k=0;k<ids.length;k++){
      const a=ids[(k+ids.length-1)%ids.length],b=ids[k],c=ids[(k+1)%ids.length];
      if(turn(points[a],points[b],points[c])<=1e-8)continue;
      if(ids.some(i=>i!==a&&i!==b&&i!==c&&inside(points[i],points[a],points[b],points[c])))continue;
      tri(g,[...points[a],z],[...points[b],z],[...points[c],z],[0,0,1]);tri(g,[...points[c],-z],[...points[b],-z],[...points[a],-z],[0,0,-1]);ids.splice(k,1);found=true;break;
    }if(!found)break;}
    points.forEach((a,i)=>{const b=points[(i+1)%points.length],normal=norm([b[1]-a[1],a[0]-b[0],0]);quad(g,[...a,-z],[...b,-z],[...b,z],[...a,z],normal);});return g;
  }
  function sphere(radius,segments=16,rings=10){
    const g=mesh();const v=(i,j)=>{const a=i/rings*Math.PI,b=j/segments*Math.PI*2;return[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];};
    for(let i=0;i<rings;i++)for(let j=0;j<segments;j++){const a=v(i,j),b=v(i+1,j),c=v(i+1,j+1),d=v(i,j+1);quad(g,a.map(x=>x*radius),b.map(x=>x*radius),c.map(x=>x*radius),d.map(x=>x*radius),a,b,c,d);}return g;
  }
  function torus(radius,tube,segments=56,sides=8){
    const g=mesh();const v=(i,j)=>{const a=i/segments*Math.PI*2,b=j/sides*Math.PI*2;return{p:[(radius+tube*Math.cos(b))*Math.cos(a),(radius+tube*Math.cos(b))*Math.sin(a),tube*Math.sin(b)],n:[Math.cos(b)*Math.cos(a),Math.cos(b)*Math.sin(a),Math.sin(b)]};};
    for(let i=0;i<segments;i++)for(let j=0;j<sides;j++){const a=v(i,j),b=v(i+1,j),c=v(i+1,j+1),d=v(i,j+1);quad(g,a.p,b.p,c.p,d.p,a.n,b.n,c.n,d.n);}return g;
  }
  function rod(a,b,radius,endRadius=radius,segments=16){
    const g=mesh(),axis=norm(sub(b,a)),u=norm(cross(axis,Math.abs(axis[1])>.9?[1,0,0]:[0,1,0])),v=cross(axis,u);
    const rim=(center,r,j)=>{const th=j/segments*Math.PI*2;return center.map((x,i)=>x+r*(u[i]*Math.cos(th)+v[i]*Math.sin(th)));};
    for(let j=0;j<segments;j++){const p=rim(a,radius,j),q=rim(a,radius,j+1),r=rim(b,endRadius,j+1),s=rim(b,endRadius,j);const n1=norm(sub(p,a)),n2=norm(sub(q,a));quad(g,p,q,r,s,n1,n2,n2,n1);tri(g,a,q,p,axis.map(x=>-x));if(endRadius)tri(g,b,s,r,axis);}return g;
  }
  const object=(g,color,pos=[0,0,0],rot=[0,0,0],phase=0)=>({g,color:palette[color],pos,rot,phase});
  function bevelPolygon(outline,depth,bevel=.045){
    const g=polygon(outline,depth-bevel*2),inner=outline.map(p=>p.map(v=>v*.94)),caps=polygon(inner,depth);
    for(let i=0;i<caps.p.length;i+=9)if(Math.abs(caps.n[i+2])>.99){g.p.push(...caps.p.slice(i,i+9));g.n.push(...caps.n.slice(i,i+9));}
    for(let i=0;i<outline.length;i++){
      const j=(i+1)%outline.length,a=outline[i],b=outline[j],normal=norm([b[1]-a[1],a[0]-b[0],0]);
      for(const sign of[-1,1]){const z=sign*(depth/2-bevel),front=sign*depth/2,n=norm([normal[0],normal[1],sign]);quad(g,[...a,z],[...b,z],[...inner[j],front],[...inner[i],front],n,n,[0,0,sign],[0,0,sign]);}
    }return g;
  }
  const pen=bevelPolygon([[0,-1.20],[.72,-.05],[.83,.97],[-.83,.97],[-.72,-.05]],.22);
  const penGroup={pos:[-.66,.38,.40],rot:[.10,-.26,-.34]};
  const codeGroup={pos:[.05,.12,.18],rot:[.05,-.15,.07]};
  const component=(g,color,pos,rot,parent,phase=0)=>({...object(g,color,pos,rot,phase),parent});
  const leftBracket=polygon([[.25,.62],[-.42,0],[.25,-.62],[.06,-.82],[-.78,0],[.06,.82]],.13);
  const rightBracket=polygon([[-.25,.62],[.42,0],[-.25,-.62],[-.06,-.82],[.78,0],[-.06,.82]],.13);
  const scenes={
    design:[
      object(slab(1.65,1.55,.18,.18),'ink',[.80,-.45,-.28],[-.2,-.12,-.38],0),
      object(slab(1.65,1.55,.18,.18),'stone',[1.02,-.28,-.04],[-.2,-.12,-.13],.7),
      object(slab(1.65,1.55,.18,.18),'ivory',[1.20,-.08,.20],[-.2,-.12,.12],1.4),
      object(sphere(.30),'olive',[1.11,.04,.38],[0,0,0],1.4),
      component(pen,'ivory',[0,0,0],[0,0,0],penGroup),
      component(rod([0,0,-.015],[0,0,.015],.13),'ink',[0,.30,.135],[0,0,0],penGroup),
      component(slab(.045,.88,.012,.018),'ink',[0,-.65,.13],[0,0,0],penGroup),
      component(slab(1.22,.23,.29,.055),'ink',[0,1.08,0],[0,0,0],penGroup)
    ],
    code:[
      object(slab(3.25,2.50,.17,.20),'stone',[-.18,-.03,-.35],[.05,-.15,-.13],0),
      object(slab(3.25,2.50,.19,.20),'ivory',[-.05,.04,-.10],[.05,-.15,.02],.3),
      component(slab(3.25,2.50,.21,.20),'ink',[0,0,0],[0,0,0],codeGroup,.6),
      component(leftBracket,'ivory',[-.76,-.12,.24],[0,0,0],codeGroup,.6),
      component(rightBracket,'ivory',[.76,-.12,.24],[0,0,0],codeGroup,.6),
      component(slab(.14,1.45,.15,.06),'sage',[0,-.12,.24],[0,0,-.36],codeGroup,.6),
      ...[-1.20,-.98,-.76].map((x,i)=>component(sphere(.055,10,6),['sage','stone','ivory'][i],[x,.99,.17],[0,0,0],codeGroup,.6))
    ],
    strategy:[
      object(torus(1.31,.17),'ivory',[-.16,-.12,0],[.13,-.20,-.10],0),
      object(torus(.92,.135),'ink',[-.16,-.12,.04],[.13,-.20,-.10],0),
      object(torus(.52,.12),'ivory',[-.16,-.12,.08],[.13,-.20,-.10],0),
      object(sphere(.19),'olive',[-.16,-.12,.22],[0,0,0],0),
      object(rod([1.65,1.36,1.55],[.18,.13,.77],.055),'ink',[0,0,0],[0,0,0],.2),
      object(rod([.18,.13,.77],[-.15,-.12,.48],.18,0),'ivory',[0,0,0],[0,0,0],.2),
      object(slab(.42,.66,.075,.07),'ink',[1.44,1.34,1.42],[.65,.3,-.72],.2),
      object(slab(.42,.66,.075,.07),'stone',[1.65,1.14,1.42],[-.2,-.6,-.72],.2),
      object(sphere(.14),'ink',[-1.67,.98,.10],[0,0,0],2),
      object(sphere(.10),'ivory',[1.43,-1.25,.27],[0,0,0],3)
    ]
  };
  // Relief details stay in front of their own broad surfaces in the software painter.
  scenes.design.forEach((o,i)=>{o.layer=i<3?0:i===3?1:i===4?2:3;});
  scenes.code.forEach((o,i)=>{o.layer=Math.min(i,3);});
  scenes.strategy.forEach((o,i)=>{o.layer=i<4?0:i<8?1:2;});
  const labels={
    design:BD.tr('Design : plume et palette de matières en trois dimensions.','Design: a three-dimensional pen nib and material palette.'),
    code:BD.tr('Code : une fenêtre et des symboles de programmation en trois dimensions.','Code: a three-dimensional window and programming symbols.'),
    strategy:BD.tr('Stratégie : une cible et une flèche orientée vers un objectif commun.','Strategy: a three-dimensional target and arrow pointing toward one goal.')
  };
  let mode=panel.dataset.lens in scenes?panel.dataset.lens:'design';
  let w=1,h=1,ratio=1,visible=true,raf=0,last=0,previous=0,time=0,px=0,py=0,tx=0,ty=0,switchAnimation;
  const active=()=>BD.motion&&!reduced.matches&&!document.hidden&&visible;
  let gl=null,ctx=null,program=null,loc=null;
  try{gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,powerPreference:'low-power'});}catch{}
  const vertex='attribute vec3 aP;attribute vec3 aN;uniform mat4 uM;uniform mat4 uVP;varying vec3 vN;varying vec3 vP;void main(){vec4 p=uM*vec4(aP,1.0);vP=p.xyz;vN=mat3(uM)*aN;gl_Position=uVP*p;}';
  const fragment='precision mediump float;varying vec3 vN;varying vec3 vP;uniform vec3 uC;void main(){vec3 n=normalize(vN);vec3 light=normalize(vec3(-3.0,4.5,7.0)-vP);vec3 fill=normalize(vec3(4.0,1.0,3.0)-vP);vec3 eye=normalize(vec3(0.0,0.0,7.5)-vP);float d=max(dot(n,light),0.0);float f=max(dot(n,fill),0.0);float s=pow(max(dot(n,normalize(light+eye)),0.0),48.0)*.10;vec3 color=uC*(.36+.67*d+.15*f)+vec3(s);gl_FragColor=vec4(pow(max(color,vec3(0.0)),vec3(1.0/2.2)),1.0);}';
  function initializeGL(){
    const shader=(type,source)=>{const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw new Error('Studio shader');return sh;};
    program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Studio program');gl.useProgram(program);
    loc={p:gl.getAttribLocation(program,'aP'),n:gl.getAttribLocation(program,'aN'),m:gl.getUniformLocation(program,'uM'),vp:gl.getUniformLocation(program,'uVP'),c:gl.getUniformLocation(program,'uC')};
    const buffer=values=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);return b;};
    Object.values(scenes).flat().forEach(o=>{o.buffers={p:buffer(o.g.p),n:buffer(o.g.n)};});
    gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);panel.dataset.renderer='webgl';
  }
  if(gl){try{initializeGL();}catch{gl=null;}}
  if(!gl){
    // A shared-geometry software renderer keeps all three scenes genuinely 3D on devices without WebGL.
    ctx=canvas.getContext('2d');
    if(!ctx){const replacement=canvas.cloneNode();canvas.replaceWith(replacement);canvas=replacement;ctx=canvas.getContext('2d');}
    if(!ctx)return;
    panel.dataset.renderer='canvas';
  }
  function matrix(o,index){
    const drift=Math.sin(time*.72+o.phase)*.045;
    const root=mul(rz(Math.sin(time*.28)*.025),mul(ry(-.12+Math.sin(time*.25)*.13+px*.15),rx(-.10+py*.11)));
    let local=mul(translate(...o.pos),mul(rz(o.rot[2]),mul(ry(o.rot[1]),rx(o.rot[0]))));
    if(o.parent){const p=o.parent;local=mul(mul(translate(...p.pos),mul(rz(p.rot[2]),mul(ry(p.rot[1]),rx(p.rot[0])))),local);}
    return mul(root,mul(translate(0,drift,0),local));
  }
  function drawGL(){
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);const focal=Math.min(w,h)*1.65,f=2*focal/h,aspect=w/h,near=.1,far=30;
    const projection=[f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0];
    gl.uniformMatrix4fv(loc.vp,false,new Float32Array(mul(projection,translate(0,.06,-7.5))));
    scenes[mode].forEach((o,i)=>{gl.uniformMatrix4fv(loc.m,false,new Float32Array(matrix(o,i)));gl.uniform3fv(loc.c,new Float32Array(o.color.map(c=>Math.pow(c/255,2.2))));for(const[key,at]of[['p',loc.p],['n',loc.n]]){gl.bindBuffer(gl.ARRAY_BUFFER,o.buffers[key]);gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,3,gl.FLOAT,false,0,0);}gl.drawArrays(gl.TRIANGLES,0,o.g.p.length/3);});
  }
  const light=norm([-3,4.5,7]),fill=norm([4,1,3]);
  function drawCanvas(){
    ctx.clearRect(0,0,w,h);const list=[],focal=Math.min(w,h)*1.65;
    scenes[mode].forEach((o,index)=>{
      const m=matrix(o,index),p=o.g.p,n=o.g.n;
      for(let i=0;i<p.length;i+=9){
        const a=point(m,p.slice(i,i+3)),b=point(m,p.slice(i+3,i+6)),c=point(m,p.slice(i+6,i+9));
        const na=direction(m,n.slice(i,i+3)),nb=direction(m,n.slice(i+3,i+6)),nc=direction(m,n.slice(i+6,i+9)),normal=norm(na.map((v,j)=>v+nb[j]+nc[j]));
        const center=a.map((v,j)=>(v+b[j]+c[j])/3);if(dot(normal,sub([0,0,7.5],center))<-.01)continue;
        const lighting=n=>.36+.67*Math.max(0,dot(n,light))+.15*Math.max(0,dot(n,fill));
        const levels=[lighting(na),lighting(nb),lighting(nc)];
        const color=o.color.map(v=>Math.round(Math.min(255,v*(levels[0]+levels[1]+levels[2])/3)));
        const project=v=>[w/2+v[0]/(7.5-v[2])*focal,h/2-(v[1]+.06)/(7.5-v[2])*focal];
        list.push({a:project(a),b:project(b),c:project(c),z:center[2],layer:o.layer,color:`rgb(${color.join(',')})`,levels,material:o.color});
      }
    });
    list.sort((a,b)=>a.layer-b.layer||a.z-b.z);ctx.lineJoin='round';ctx.lineWidth=.45;
    for(const face of list){
      let paint=face.color;
      const[a,b,c]=face.levels,min=Math.min(a,b,c),max=Math.max(a,b,c);
      if(max-min>.008){
        const dx1=face.b[0]-face.a[0],dy1=face.b[1]-face.a[1],dx2=face.c[0]-face.a[0],dy2=face.c[1]-face.a[1],det=dx1*dy2-dx2*dy1;
        if(Math.abs(det)>.1){
          const gx=((b-a)*dy2-(c-a)*dy1)/det,gy=((c-a)*dx1-(b-a)*dx2)/det,size=gx*gx+gy*gy;
          if(size>1e-10){
            const gradient=ctx.createLinearGradient(face.a[0]+gx*(min-a)/size,face.a[1]+gy*(min-a)/size,face.a[0]+gx*(max-a)/size,face.a[1]+gy*(max-a)/size);
            const shade=l=>`rgb(${face.material.map(v=>Math.round(Math.max(0,Math.min(255,v*l)))).join(',')})`;
            gradient.addColorStop(0,shade(min));gradient.addColorStop(1,shade(max));paint=gradient;
          }
        }
      }
      ctx.fillStyle=ctx.strokeStyle=paint;ctx.beginPath();ctx.moveTo(...face.a);ctx.lineTo(...face.b);ctx.lineTo(...face.c);ctx.closePath();ctx.fill();ctx.stroke();
    }
  }
  function draw(){if(gl&&!gl.isContextLost())drawGL();else if(ctx)drawCanvas();else return;panel.dataset.modelReady='true';}
  function tick(now){
    raf=0;if(!visible||document.hidden){previous=0;return;}
    if(active()&&previous)time+=Math.min(now-previous,100)/1000;previous=now;
    const interval=gl?(innerWidth<761?40:33):(innerWidth<761?65:50);
    if(now-last>=interval||!active()){px+=(tx-px)*.12;py+=(ty-py)*.12;draw();last=now;}
    if(active())raf=requestAnimationFrame(tick);
  }
  function stop(){if(raf)cancelAnimationFrame(raf);raf=0;previous=0;}
  function request(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(tick);}
  function resize(){w=Math.max(1,canvas.clientWidth);h=Math.max(1,canvas.clientHeight);ratio=Math.min(devicePixelRatio||1,gl?1.6:1.25);canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);if(gl)gl.viewport(0,0,canvas.width,canvas.height);else ctx.setTransform(ratio,0,0,ratio,0,0);draw();request();}
  function select(lens){
    if(!(lens in scenes))return;mode=lens;canvas.setAttribute('aria-label',labels[mode]);canvas.dataset.field=mode;stop();draw();request();
    switchAnimation?.cancel();if(active()&&canvas.animate){switchAnimation=canvas.animate([{opacity:.15,translate:'0 13px',scale:.97},{opacity:1,translate:'0 0',scale:1}],{duration:650,easing:'cubic-bezier(.16,1,.3,1)'});switchAnimation.finished.catch(()=>{});}
  }
  window.addEventListener('bd-studio-lens',event=>select(event.detail.lens));
  panel.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse'||!active())return;const b=canvas.getBoundingClientRect();tx=Math.max(-1,Math.min(1,(event.clientX-b.left)/b.width*2-1));ty=Math.max(-1,Math.min(1,(event.clientY-b.top)/b.height*2-1));},{passive:true});
  panel.addEventListener('pointerleave',()=>{tx=ty=0;});
  const sync=()=>{stop();if(!active()){switchAnimation?.cancel();tx=ty=px=py=0;}draw();request();};
  window.addEventListener('bd-motion',sync);reduced.addEventListener?.('change',sync);document.addEventListener('visibilitychange',()=>{stop();request();});
  window.addEventListener('pagehide',stop);window.addEventListener('pageshow',request);
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;stop();request();},{rootMargin:'80px'}).observe(panel);
  if('ResizeObserver'in window)new ResizeObserver(resize).observe(canvas);else window.addEventListener('resize',resize);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();stop();panel.dataset.modelReady='false';});
  canvas.addEventListener('webglcontextrestored',()=>{try{initializeGL();resize();}catch{panel.dataset.modelReady='false';}});
  canvas.setAttribute('aria-label',labels[mode]);canvas.dataset.field=mode;resize();
})();
