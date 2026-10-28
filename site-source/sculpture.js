(() => {
  'use strict';
  const canvas = document.getElementById('sculpture');
  const stage = document.getElementById('sculpture-stage');
  if (!canvas || !stage) return;
  let manualX = 0, manualY = 0, gesture = null;
  function moveScene(x, y, reset = false) {
    const fallbackMode = stage.classList.contains('no-webgl');
    manualX = fallbackMode ? Math.max(-.65,Math.min(.65,x)) : x;
    manualY = Math.max(-.45,Math.min(.45,y));
    stage.style.setProperty('--manual-y', (manualX*180/Math.PI).toFixed(2)+'deg');
    stage.style.setProperty('--manual-x', (manualY*180/Math.PI).toFixed(2)+'deg');
    window.dispatchEvent(new CustomEvent('bd-scene-orbit',{detail:{x:manualX,y:manualY,reset}}));
  }
  stage.addEventListener('pointerdown',event=>{
    if(event.target.closest('a,button')||(event.pointerType==='mouse'&&event.button!==0))return;
    gesture={id:event.pointerId,x:event.clientX,y:event.clientY,baseX:manualX,baseY:manualY,active:event.pointerType!=='touch'};
    if(gesture.active){stage.setPointerCapture(event.pointerId);stage.classList.add('is-dragging');}
  });
  stage.addEventListener('pointermove',event=>{
    if(!gesture||gesture.id!==event.pointerId)return;
    const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
    if(!gesture.active){if(Math.abs(dy)>Math.abs(dx)+5){gesture=null;return;}if(Math.abs(dx)<8)return;gesture.active=true;stage.setPointerCapture(event.pointerId);stage.classList.add('is-dragging');}
    moveScene(gesture.baseX+dx*.005,gesture.baseY+dy*.004);
  });
  const endGesture=()=>{gesture=null;stage.classList.remove('is-dragging');};
  stage.addEventListener('pointerup',endGesture);stage.addEventListener('pointercancel',endGesture);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    const visible = entries[0].isIntersecting;
    stage.classList.toggle('scene-offscreen', !visible);
    window.dispatchEvent(new CustomEvent('bd-scene-visibility', { detail: { visible } }));
  }, { rootMargin: '100px' }).observe(stage);
  document.addEventListener('visibilitychange', () => stage.classList.toggle('scene-hidden', document.hidden));
  const fallback = (reason = 'context-unavailable') => {
    stage.classList.add('no-webgl'); canvas.style.visibility = 'hidden'; stage.dataset.renderReason = reason;
    moveScene(manualX,manualY);
    if (stage.dataset.fallbackReady) return;
    stage.dataset.fallbackReady = 'true';
    stage.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch' || stage.classList.contains('is-paused') || document.documentElement.dataset.motion === 'off') return;
      const box = stage.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width * 2 - 1;
      const y = (event.clientY - box.top) / box.height * 2 - 1;
      stage.style.setProperty('--tilt-x', (x * 12).toFixed(2) + 'deg');
      stage.style.setProperty('--tilt-y', (-y * 10).toFixed(2) + 'deg');
      const label = document.getElementById('sculpture-coordinate');
      if (label) label.textContent = `X ${x.toFixed(2)} / Y ${y.toFixed(2)}`;
    }, { passive: true });
    stage.addEventListener('pointerleave', () => {
      stage.style.setProperty('--tilt-x', '0deg'); stage.style.setProperty('--tilt-y', '0deg');
    });
  };
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'low-power', premultipliedAlpha: false });
  if (!gl) { fallback(); return; }
  const vertex = `attribute vec3 aPosition;attribute vec3 aNormal;uniform mat4 uModel;uniform mat4 uViewProjection;varying vec3 vNormal;varying vec3 vPosition;void main(){vec4 p=uModel*vec4(aPosition,1.0);vPosition=p.xyz;vNormal=mat3(uModel)*aNormal;gl_Position=uViewProjection*p;}`;
  const fragment = `precision mediump float;varying vec3 vNormal;varying vec3 vPosition;uniform vec3 uColor;uniform float uTime;uniform vec2 uPointer;void main(){vec3 n=normalize(vNormal);vec3 view=normalize(vec3(0.0,0.0,7.0)-vPosition);vec3 light=normalize(vec3(-3.0+sin(uTime*.22)*.6+uPointer.x*1.3,5.0-uPointer.y*.85,5.0)-vPosition);vec3 fill=normalize(vec3(4.0,1.0,2.0)-vPosition);float d=max(dot(n,light),0.0);float f=max(dot(n,fill),0.0);vec3 halfV=normalize(light+view);float highlight=max(dot(n,halfV),0.0);float spec=pow(highlight,85.0)*0.12+pow(highlight,9.0)*0.035;float edge=pow(1.0-max(dot(n,view),0.0),3.0)*0.055;float ambient=0.31+0.09*max(n.y,0.0);vec3 color=uColor*(ambient+0.67*d+0.21*f)+vec3(spec+edge);color=pow(max(color,vec3(0.0)),vec3(1.0/2.2));gl_FragColor=vec4(color,1.0);}`;
  function shader(type, source) {
    const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  let program;
  try {
    program = gl.createProgram(); gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex)); gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment)); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  } catch (error) { fallback('shader: ' + error.message); return; }
  gl.useProgram(program);
  const loc = { p: gl.getAttribLocation(program, 'aPosition'), n: gl.getAttribLocation(program, 'aNormal'), model: gl.getUniformLocation(program, 'uModel'), vp: gl.getUniformLocation(program, 'uViewProjection'), color: gl.getUniformLocation(program, 'uColor'), time:gl.getUniformLocation(program,'uTime'),pointer:gl.getUniformLocation(program,'uPointer') };
  const I = () => [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
  const mul = (a,b) => { const o = new Array(16).fill(0); for(let c=0;c<4;c++) for(let r=0;r<4;r++) for(let k=0;k<4;k++) o[c*4+r]+=a[k*4+r]*b[c*4+k]; return o; };
  const rx = a => { const c=Math.cos(a),s=Math.sin(a);return [1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]; };
  const ry = a => { const c=Math.cos(a),s=Math.sin(a);return [c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]; };
  const rz = a => { const c=Math.cos(a),s=Math.sin(a);return [c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]; };
  const trans = (x,y,z) => { const m=I(); m[12]=x;m[13]=y;m[14]=z;return m; };
  function perspective(fov, aspect, near, far) { const f=1/Math.tan(fov/2),nf=1/(near-far);return [f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]; }
  function path(a,b,r,arcSteps=16) {
    const pts=[];
    const corners=[[a-r,b-r,0],[-a+r,b-r,Math.PI/2],[-a+r,-b+r,Math.PI],[a-r,-b+r,Math.PI*1.5]];
    for(let k=0;k<4;k++) {
      const [cx,cy,start]=corners[k];
      for(let j=0;j<=arcSteps;j++) { const angle=start+j/arcSteps*Math.PI/2;pts.push([cx+Math.cos(angle)*r,cy+Math.sin(angle)*r]); }
      const [nx,ny,na]=corners[(k+1)%4], end=pts[pts.length-1], next=[nx+Math.cos(na)*r,ny+Math.sin(na)*r];
      const length=Math.hypot(next[0]-end[0],next[1]-end[1]),count=Math.max(1,Math.ceil(length*12));
      for(let j=1;j<count;j++) pts.push([end[0]+(next[0]-end[0])*j/count,end[1]+(next[1]-end[1])*j/count]);
    }
    return pts;
  }
  function mesh(a,b,r,width,depth) {
    const outline=path(a,b,r),section=path(width/2,depth/2,Math.min(depth*.35,width*.1),4),p=[],n=[],indices=[];
    for(let i=0;i<outline.length;i++) {
      const current=outline[i],before=outline[(i-1+outline.length)%outline.length],after=outline[(i+1)%outline.length];
      let tx=after[0]-before[0],ty=after[1]-before[1],length=Math.hypot(tx,ty);tx/=length;ty/=length;
      const nx=ty,ny=-tx;
      for(let j=0;j<section.length;j++) {
        const q=section[j],qb=section[(j-1+section.length)%section.length],qa=section[(j+1)%section.length];
        let sx=qa[0]-qb[0],sz=qa[1]-qb[1],sl=Math.hypot(sx,sz);sx/=sl;sz/=sl;
        p.push(current[0]+nx*q[0],current[1]+ny*q[0],q[1]);n.push(nx*sz,ny*sz,-sx);
        const nextI=(i+1)%outline.length,nextJ=(j+1)%section.length;
        const v=i*section.length+j,vj=i*section.length+nextJ,vi=nextI*section.length+j,vij=nextI*section.length+nextJ;
        indices.push(v,vi,vj,vj,vi,vij);
      }
    }
    function buffer(values,target,type){ const b=gl.createBuffer();gl.bindBuffer(target,b);gl.bufferData(target,new type(values),gl.STATIC_DRAW);return b; }
    return {position:buffer(p,gl.ARRAY_BUFFER,Float32Array),normal:buffer(n,gl.ARRAY_BUFFER,Float32Array),index:buffer(indices,gl.ELEMENT_ARRAY_BUFFER,Uint16Array),count:indices.length};
  }
  const linear = color => color.map(c => Math.pow(c,2.2));
  const objects=[
    {mesh:mesh(1.22,.91,.44,.34,.15),rot:[.36,.2,-.62],pos:[-.25,.15,.15],color:linear([.65,.69,.56])},
    {mesh:mesh(1.02,1.18,.46,.36,.17),rot:[1.18,-.75,.65],pos:[.22,.04,-.13],color:linear([.91,.89,.83])},
    {mesh:mesh(1.18,.78,.4,.33,.16),rot:[-.83,1.05,.28],pos:[.02,-.23,.24],color:linear([.28,.33,.28])}
  ];
  gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.clearColor(0,0,0,0);
  let width=0,height=0,visible=true,enabled=document.documentElement.dataset.motion!=='off',sceneTime=0,previousTime=0,raf=0,last=0,px=0,py=0,targetX=0,targetY=0,dragX=0,dragY=0;
  function resize() {
    const box=stage.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,innerWidth<761?1.4:1.7);
    width=Math.max(1,Math.round(box.width*dpr));height=Math.max(1,Math.round(box.height*dpr));
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);}
    requestDraw();
  }
  function draw(time=0) {
    if(gl.isContextLost()) return;
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const aspect=width/Math.max(1,height),small=innerWidth<761;
    const projection=perspective((small?38:36)*Math.PI/180,aspect,.1,50);
    const view=trans(small?0:-.05,small?.08:0,small?-6.9:-6.8);
    gl.uniformMatrix4fv(loc.vp,false,new Float32Array(mul(projection,view)));
    if(enabled){px+=(targetX-px)*.035;py+=(targetY-py)*.035;}
    const t=sceneTime;
    gl.uniform1f(loc.time,t);gl.uniform2f(loc.pointer,px,py);
    const global=mul(rz(-.12+Math.sin(t*.65)*.045),mul(ry(-.24+px*.25+dragX+t*.24),rx(-.12+py*.2+dragY+Math.sin(t*.4)*.035)));
    for(let i=0;i<objects.length;i++) {
      const o=objects[i],floatY=Math.sin(t*.85+i*1.3)*.05;
      let model=mul(global,mul(trans(o.pos[0],o.pos[1]+floatY,o.pos[2]),mul(rz(o.rot[2]),mul(ry(o.rot[1]),rx(o.rot[0])))));
      gl.uniformMatrix4fv(loc.model,false,new Float32Array(model));gl.uniform3fv(loc.color,new Float32Array(o.color));
      gl.bindBuffer(gl.ARRAY_BUFFER,o.mesh.position);gl.enableVertexAttribArray(loc.p);gl.vertexAttribPointer(loc.p,3,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER,o.mesh.normal);gl.enableVertexAttribArray(loc.n);gl.vertexAttribPointer(loc.n,3,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,o.mesh.index);gl.drawElements(gl.TRIANGLES,o.mesh.count,gl.UNSIGNED_SHORT,0);
    }
  }
  function tick(time) {
    raf=0;if(gl.isContextLost()||!visible||document.hidden) return;
    if(enabled&&previousTime)sceneTime+=Math.min(time-previousTime,100)*.001;
    previousTime=time;
    if(time-last>32||!enabled){draw(time);last=time;}
    if(enabled)raf=requestAnimationFrame(tick);
  }
  function requestDraw() { if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(tick); }
  stage.addEventListener('pointermove',event=>{
    if(!enabled||event.pointerType==='touch')return;
    const b=stage.getBoundingClientRect();targetX=(event.clientX-b.left)/b.width*2-1;targetY=(event.clientY-b.top)/b.height*2-1;
    const label=document.getElementById('sculpture-coordinate');if(label)label.textContent=`X ${targetX.toFixed(2)} / Y ${targetY.toFixed(2)}`;
  },{passive:true});
  stage.addEventListener('pointerleave',()=>{targetX=targetY=0;});
  canvas.style.cursor='grab';
  window.addEventListener('bd-scene-orbit',event=>{dragX=event.detail.x;dragY=event.detail.y;if(event.detail.reset){sceneTime=0;px=py=targetX=targetY=0;}requestDraw();});
  window.addEventListener('bd-scene-visibility',event=>{visible=event.detail.visible;previousTime=0;if(visible)requestDraw();else if(raf){cancelAnimationFrame(raf);raf=0;}});
  if('ResizeObserver'in window)new ResizeObserver(resize).observe(stage);else window.addEventListener('resize',resize);
  window.addEventListener('bd-motion',event=>{enabled=event.detail.enabled;previousTime=0;if(raf){cancelAnimationFrame(raf);raf=0;}requestDraw();});
  document.addEventListener('visibilitychange',()=>{previousTime=0;if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0;}else requestDraw();});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();if(raf)cancelAnimationFrame(raf);fallback();});
  resize();
})();
