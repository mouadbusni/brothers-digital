(() => {
  'use strict';
  const BD=window.BD;
  if(!BD)return;
  const {$,$$}=BD;
  const root=document.documentElement;
  const fine=matchMedia('(hover:hover) and (pointer:fine)');
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const canMove=()=>BD.motion&&!reduced.matches;
  const animations=new Set();
  function animate(el,keyframes,options={}){
    if(!el||!canMove()||typeof el.animate!=='function')return;
    const a=el.animate(keyframes,{duration:650,easing:'cubic-bezier(.16,1,.3,1)',...options});
    animations.add(a);a.finished.then(()=>animations.delete(a),()=>animations.delete(a));return a;
  }
  const resetMotion=()=>{if(!canMove()){animations.forEach(a=>a.cancel());animations.clear();$$('.motion-magnetic').forEach(el=>{el.style.removeProperty('--mag-x');el.style.removeProperty('--mag-y');});}};
  addEventListener('bd-motion',resetMotion);reduced.addEventListener?.('change',resetMotion);
  $$('.desktop-nav a').forEach(link=>{
    const label=link.textContent.trim();link.setAttribute('aria-label',label);
    const wrap=document.createElement('span');wrap.className='nav-roll';
    const first=document.createElement('span');first.textContent=label;
    const second=first.cloneNode(true);second.setAttribute('aria-hidden','true');
    wrap.append(first,second);link.replaceChildren(wrap);
  });
  $$('.header-cta,.hero-project-link,.page-next-link').forEach(el=>{
    el.classList.add('motion-magnetic');
    el.addEventListener('pointermove',e=>{
      if(!fine.matches||!canMove()||e.pointerType!=='mouse')return;
      const b=el.getBoundingClientRect();
      el.style.setProperty('--mag-x',((e.clientX-b.left-b.width/2)*.055).toFixed(2)+'px');
      el.style.setProperty('--mag-y',((e.clientY-b.top-b.height/2)*.11).toFixed(2)+'px');
    },{passive:true});
    el.addEventListener('pointerleave',()=>{el.style.setProperty('--mag-x','0px');el.style.setProperty('--mag-y','0px');});
  });
  $$('.project-art').forEach(el=>el.addEventListener('pointermove',e=>{
    if(!fine.matches||!canMove())return;const b=el.getBoundingClientRect();
    el.style.setProperty('--shine-x',((e.clientX-b.left)/b.width*100).toFixed(1)+'%');
    el.style.setProperty('--shine-y',((e.clientY-b.top)/b.height*100).toFixed(1)+'%');
  },{passive:true}));

  // Animate words without flattening emphasis, line breaks, language or accessible text.
  const titles=$$('.standalone-main h1,.case-title-row h1,.page-next h2,.case-quote');
  const enterTitle=el=>{
    if(!canMove())return;
    const words=$$('.living-word',el);
    words.forEach((word,i)=>animate(word,[{opacity:0,transform:'translate3d(0,32px,0) rotate(2deg)',filter:'blur(4px)'},{opacity:1,transform:'none',filter:'blur(0px)'}],{duration:850,delay:Math.min(i,14)*55}));
  };
  const titleObserver='IntersectionObserver'in window?new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting){enterTitle(entry.target);titleObserver.unobserve(entry.target);}});
  },{threshold:.15}):null;
  titles.forEach(el=>{
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);const nodes=[];let node;
    while((node=walker.nextNode()))if(node.textContent.trim())nodes.push(node);
    nodes.forEach(textNode=>{
      const fragment=document.createDocumentFragment();
      textNode.textContent.split(/(\s+)/).forEach(word=>{if(!word)return;if(/^\s+$/.test(word))fragment.append(document.createTextNode(word));else{const span=document.createElement('span');span.className='living-word';span.textContent=word;fragment.append(span);}});
      textNode.replaceWith(fragment);
    });
    if(titleObserver)titleObserver.observe(el);else enterTitle(el);
  });
  const effects=[...$$('.studio-art,.studio-demo').map(el=>[el,'--living-depth',16]),...$$('.case-page-cover>img').map(el=>[el,'--image-drift',19]),...$$('.footer-big').map(el=>[el,'--footer-drift',22])];
  effects.forEach(([el,key])=>{if(key==='--living-depth')el.classList.add('living-depth');});
  let scrollFrame=0;
  function updateDepth(){
    scrollFrame=0;
    effects.forEach(([el,key,amount])=>{
      if(!canMove()||!fine.matches){el.style.setProperty(key,'0px');return;}
      const box=el.getBoundingClientRect();if(box.bottom<0||box.top>innerHeight)return;
      const progress=Math.max(-1,Math.min(1,(box.top+box.height/2-innerHeight/2)/innerHeight));
      el.style.setProperty(key,(progress*amount).toFixed(2)+'px');
    });
    $$('.process-steps li').forEach(el=>{
      const box=el.getBoundingClientRect();
      el.style.setProperty('--step-progress',String(!canMove()?1:Math.max(0,Math.min(1,(innerHeight*.8-box.top)/Math.max(1,box.height)))));
    });
  }
  function queueDepth(){if(!scrollFrame)scrollFrame=requestAnimationFrame(updateDepth);}
  addEventListener('scroll',queueDepth,{passive:true});addEventListener('resize',queueDepth);addEventListener('bd-motion',queueDepth);queueDepth();
  $$('.service-toggle').forEach(button=>button.addEventListener('click',()=>animate($('#studio-demo .demo-panel:not([hidden])'),[{opacity:.3,translate:'0 18px'},{opacity:1,translate:'0 0'}])));
  $$('[data-studio-lens]').forEach(button=>button.addEventListener('click',()=>animate($('#studio-lens-copy'),[{opacity:.2,translate:'0 9px'},{opacity:1,translate:'0 0'}],{duration:450})));
  $$('.demo-swatch,.demo-calendar button,.demo-device').forEach(button=>button.addEventListener('click',()=>animate(button,[{scale:.92},{scale:1.035,offset:.6},{scale:1}],{duration:380})));
  $$('.enquiry-services input,.brief-options input').forEach(input=>input.addEventListener('change',()=>animate(input.nextElementSibling,[{scale:.96},{scale:1.025,offset:.6},{scale:1}],{duration:350})));

  const stage=$('#sculpture-stage');if(!stage)return;
  const hero=$('.hero');
  const field=document.createElement('canvas');field.className='scene-lines';field.setAttribute('aria-hidden','true');
  stage.prepend(field);
  const c=field.getContext('2d');if(!c){field.remove();return;}
  let width=1,height=1,visible=true,frame=0,last=0,elapsed=0,previous=0;
  let mx=0,my=0,tx=0,ty=0;
  const active=()=>canMove()&&visible&&!document.hidden&&root.dataset.intro!=='playing';
  const lastLine=$('.hero-last>span');
  const headlines=BD.language==='fr'?['Sur mesure','Avec du sens','Pour durer']:['Made for you','With purpose','Built to last'];
  let copyIndex=0,copyTimer=0,copyAnimation=null;
  if(lastLine){$('#hero-heading')?.setAttribute('aria-label',$$('.hero-line').map(el=>el.textContent.trim()).join(' '));lastLine.setAttribute('aria-hidden','true');}
  function stopCopy(){clearTimeout(copyTimer);copyAnimation?.cancel();copyAnimation=null;}
  function scheduleCopy(){stopCopy();if(lastLine&&active())copyTimer=setTimeout(cycleCopy,4800);}
  function cycleCopy(){
    if(!lastLine||!active())return;
    copyAnimation=animate(lastLine,[{opacity:1,translate:'0 0'},{opacity:0,translate:'0 -18%'}],{duration:250,easing:'cubic-bezier(.5,0,1,.5)'});
    copyAnimation?.finished.then(()=>{
      if(!active())return;copyIndex=(copyIndex+1)%headlines.length;lastLine.textContent=headlines[copyIndex];
      copyAnimation=animate(lastLine,[{opacity:0,translate:'0 45%',filter:'blur(4px)'},{opacity:1,translate:'0 0',filter:'blur(0px)'}],{duration:650});
      copyTimer=setTimeout(cycleCopy,4800);
    },()=>{});
  }
  function draw(){
    c.clearRect(0,0,width,height);
    const cx=width*.45+mx*12,cy=height*.43+my*10;
    const radius=Math.min(width*.35,height*.39);
    const glow=c.createRadialGradient(cx+mx*radius*.45,cy+my*radius*.35,0,cx,cy,radius*1.35);
    glow.addColorStop(0,'rgba(163,170,145,0.13)');glow.addColorStop(1,'rgba(163,170,145,0)');
    c.fillStyle=glow;c.fillRect(0,0,width,height);
    for(let k=0;k<3;k++){
      const rot=[-.35,.65,1.9][k],a=radius*(1+k*.055+Math.sin(elapsed*.45+k)*.009),b=radius*(.68+k*.045);
      c.save();c.translate(cx,cy);c.rotate(rot+mx*.025);c.lineWidth=.7;
      c.strokeStyle=k===0?'rgba(83,103,67,0.17)':'rgba(83,103,67,0.085)';
      c.beginPath();c.ellipse(0,0,a,b,0,0,Math.PI*2);c.stroke();
      const phase=elapsed*(k%2?-.28:.22)+k*2.094;
      // Three travelling points echo the studio's three connected forms.
      for(let j=9;j>=0;j--){const th=phase-j*.035;c.beginPath();c.arc(Math.cos(th)*a,Math.sin(th)*b,j===0?2.3:1.4,0,Math.PI*2);c.fillStyle=`rgba(102,122,81,${(1-j/10)*.65})`;c.fill();}
      c.restore();
    }
    const corners=[[-.82,-.66],[.85,-.45],[-.7,.68],[.9,.63]];
    c.strokeStyle='rgba(83,103,67,0.32)';c.lineWidth=.7;
    corners.forEach(([x,y])=>{const px=cx+x*radius,py=cy+y*radius;c.beginPath();c.moveTo(px-3,py);c.lineTo(px+3,py);c.moveTo(px,py-3);c.lineTo(px,py+3);c.stroke();});
  }
  function tick(now){
    frame=0;if(!active()){previous=0;return;}
    if(previous)elapsed+=Math.min(now-previous,100)/1000;previous=now;
    const interval=innerWidth<761?50:33;
    if(now-last>=interval){mx+=(tx-mx)*.09;my+=(ty-my)*.09;draw();last=now;}
    frame=requestAnimationFrame(tick);
  }
  function schedule(){if(!frame&&active())frame=requestAnimationFrame(tick);}
  function stop(){if(frame)cancelAnimationFrame(frame);frame=0;previous=0;}
  function resize(){
    const box=stage.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,1.4);
    width=Math.max(1,box.width);height=Math.max(1,box.height);field.width=Math.round(width*ratio);field.height=Math.round(height*ratio);c.setTransform(ratio,0,0,ratio,0,0);draw();schedule();
  }
  stage.addEventListener('pointermove',event=>{
    if(!active()||event.pointerType!=='mouse')return;
    const b=stage.getBoundingClientRect();tx=(event.clientX-b.left)/b.width*2-1;ty=(event.clientY-b.top)/b.height*2-1;
    stage.style.setProperty('--light-x',(40+tx*20).toFixed(1)+'%');stage.style.setProperty('--light-y',(40+ty*20).toFixed(1)+'%');
  },{passive:true});
  stage.addEventListener('pointerleave',()=>{tx=ty=0;});
  hero?.addEventListener('pointermove',event=>{
    if(!fine.matches||!active()||event.pointerType!=='mouse')return;
    const b=hero.getBoundingClientRect();hero.style.setProperty('--hero-px',((event.clientX-b.left)/b.width*2-1).toFixed(3));hero.style.setProperty('--hero-py',((event.clientY-b.top)/b.height*2-1).toFixed(3));
  },{passive:true});
  hero?.addEventListener('pointerleave',()=>{hero.style.setProperty('--hero-px','0');hero.style.setProperty('--hero-py','0');});
  addEventListener('bd-intro',event=>{stop();if(event.detail.playing&&lastLine){copyIndex=0;lastLine.textContent=headlines[0];}schedule();scheduleCopy();});
  addEventListener('bd-scene-visibility',event=>{visible=event.detail.visible;stop();schedule();scheduleCopy();});
  addEventListener('bd-motion',()=>{stop();schedule();if(!canMove()&&lastLine){copyIndex=0;lastLine.textContent=headlines[0];}scheduleCopy();});
  reduced.addEventListener?.('change',()=>{stop();schedule();if(!canMove()&&lastLine){copyIndex=0;lastLine.textContent=headlines[0];}scheduleCopy();});
  document.addEventListener('visibilitychange',()=>{stop();schedule();scheduleCopy();});
  addEventListener('pagehide',()=>{stop();stopCopy();});
  addEventListener('pageshow',()=>{schedule();scheduleCopy();});
  if('ResizeObserver'in window)new ResizeObserver(resize).observe(stage);else addEventListener('resize',resize);
  resize();scheduleCopy();
})();
