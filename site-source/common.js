(() => {
  'use strict';
  const root=document.documentElement;
  root.classList.add('js');
  const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
  const read=k=>{try{return localStorage.getItem(k);}catch{return null;}};
  const write=(k,v)=>{try{localStorage.setItem(k,v);}catch{}};
  const language=root.lang==='en'?'en':'fr';
  const tr=(fr,en)=>language==='fr'?fr:en;
  const paths=language==='fr'?{home:'/fr/',work:'/fr/projets/',services:'/fr/services/',studio:'/fr/studio/',contact:'/fr/contact/'}:{home:'/en/',work:'/en/work/',services:'/en/services/',studio:'/en/studio/',contact:'/en/contact/'};
  const previousSections={projets:paths.work,expertises:paths.services,studio:paths.studio,contact:paths.contact,questions:paths.services+'#questions'};
  if(root.dataset.page==='home'&&previousSections[location.hash.slice(1)])location.replace(previousSections[location.hash.slice(1)]);
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  let motion=read('bd-motion')?read('bd-motion')==='on':!reduced.matches;
  const BD=window.BD={language,tr,$,$$,motion,paths};
  BD.isolateOverlay=(overlay,keep=[])=>{const changed=[];const visit=node=>{if(node===overlay||keep.includes(node))return;if(node.contains(overlay)||keep.some(item=>node.contains(item))){[...node.children].forEach(visit);return;}changed.push([node,node.inert]);node.inert=true;};[...document.body.children].forEach(visit);return()=>changed.forEach(([node,inert])=>{node.inert=inert;});};
  function motionLabel(){const b=$('#motion-toggle');if(b){b.textContent=motion?tr('Animations : oui','Motion: on'):tr('Animations : non','Motion: off');b.setAttribute('aria-pressed',String(motion));}}
  function setMotion(value,remember=false){motion=value;BD.motion=value;root.dataset.motion=value?'on':'off';if(remember)write('bd-motion',value?'on':'off');motionLabel();window.dispatchEvent(new CustomEvent('bd-motion',{detail:{enabled:value}}));if(!value){$$('.reveal').forEach(e=>e.classList.add('is-visible'));finishIntro();}}
  BD.setMotion=setMotion;
  $('#motion-toggle')?.addEventListener('click',()=>setMotion(!motion,true));
  reduced.addEventListener?.('change',e=>{if(!read('bd-motion'))setMotion(!e.matches);});
  const INTRO_HOLD_MS=2500,INTRO_EXIT_MS=550;
  let introTimer,introExitTimer;
  function introDone(){root.dataset.intro='done';window.dispatchEvent(new CustomEvent('bd-intro',{detail:{playing:false}}));}
  function finishIntro(){clearTimeout(introTimer);clearTimeout(introExitTimer);const intro=$('#intro');if(intro&&!intro.hidden){intro.classList.add('is-leaving');introExitTimer=setTimeout(()=>{intro.hidden=true;introDone();},motion?INTRO_EXIT_MS:0);}else introDone();$('.hero')?.classList.add('is-ready');if(intro)try{sessionStorage.setItem('bd-intro-seen','1');}catch{}}
  function playIntro(){const intro=$('#intro');if(!intro||!motion)return;clearTimeout(introTimer);clearTimeout(introExitTimer);intro.hidden=false;intro.classList.remove('is-leaving');root.dataset.intro='playing';window.dispatchEvent(new CustomEvent('bd-intro',{detail:{playing:true}}));$('.hero')?.classList.remove('is-ready');introTimer=setTimeout(finishIntro,INTRO_HOLD_MS);}
  BD.finishIntro=finishIntro;
  $('#skip-intro')?.addEventListener('click',finishIntro);
  $('#replay-intro')?.addEventListener('click',playIntro);
  let seen=false;try{seen=sessionStorage.getItem('bd-intro-seen')==='1';}catch{}
  setMotion(motion);if(motion&&!seen&&$('#intro'))playIntro();else finishIntro();
  document.addEventListener('keydown',e=>{if(e.key==='Tab'&&$('#intro')&&!$('#intro').hidden)finishIntro();});
  let menuOpen=false,releaseMenuIsolation=null,menuFocusTimer=0;
  function toggleMenu(open){menuOpen=open;const menu=$('#mobile-menu'),button=$('#menu-toggle');if(!menu||!button)return;clearTimeout(menuFocusTimer);releaseMenuIsolation?.();releaseMenuIsolation=null;button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?tr('Fermer le menu','Close menu'):tr('Ouvrir le menu','Open menu'));menu.classList.toggle('is-open',open);menu.inert=!open;document.body.classList.toggle('body-locked',open);if(open){finishIntro();releaseMenuIsolation=BD.isolateOverlay(menu,[button]);menuFocusTimer=setTimeout(()=>{if(menuOpen)menu.querySelector('a')?.focus();},motion?250:0);}else button.focus({preventScroll:true});}
  $('#menu-toggle')?.addEventListener('click',()=>toggleMenu(!menuOpen));
  $$('#mobile-menu a').forEach(a=>a.addEventListener('click',()=>toggleMenu(false)));
  document.addEventListener('keydown',e=>{if(menuOpen&&e.key==='Escape'){toggleMenu(false);$('#menu-toggle')?.focus();}if(menuOpen&&e.key==='Tab'){const links=[$('#menu-toggle'),...$$('#mobile-menu a')];if(e.shiftKey&&document.activeElement===links[0]){e.preventDefault();links.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===links.at(-1)){e.preventDefault();links[0]?.focus();}}});
  matchMedia('(min-width:761px)').addEventListener?.('change',e=>{if(e.matches&&menuOpen)toggleMenu(false);});
  $('#lang-toggle')?.addEventListener('click',()=>{window.dispatchEvent(new Event('bd-before-navigate'));write('bd-language',language==='fr'?'en':'fr');const destination=root.dataset.alternatePath;const parameters=new URLSearchParams(location.search);const query=new URLSearchParams();if(root.dataset.page==='contact'&&['web','app','design','growth'].includes(parameters.get('service')))query.set('service',parameters.get('service'));if(root.dataset.page==='work'){if(['code','web','identity','experience'].includes(parameters.get('category')))query.set('category',parameters.get('category'));if(parameters.get('view')==='list')query.set('view','list');}if(destination)location.assign(destination+(query.size?'?'+query:''));});
  $$('[data-placeholder-fr]').forEach(e=>{e.placeholder=e.dataset[language==='fr'?'placeholderFr':'placeholderEn'];});
  $$('[data-aria-fr]').forEach(e=>e.setAttribute('aria-label',e.dataset[language==='fr'?'ariaFr':'ariaEn']));
  const observer='IntersectionObserver'in window?new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});},{threshold:.07,rootMargin:'0px 0px -15px 0px'}):null;
  $$('.reveal').forEach(e=>observer&&motion?observer.observe(e):e.classList.add('is-visible'));
  let ticking=false;
  function progress(){const total=root.scrollHeight-innerHeight;$('.scroll-progress')?.style.setProperty('width',(total>0?Math.min(100,scrollY/total*100):0)+'%');$('#header')?.classList.toggle('is-scrolled',scrollY>20);const hero=$('.hero');if(hero&&motion){const p=Math.max(0,Math.min(1,scrollY/Math.max(1,hero.offsetHeight)));hero.style.setProperty('--hero-scroll',p.toFixed(3));}ticking=false;}
  addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(progress);}},{passive:true});addEventListener('resize',progress);progress();BD.updateProgress=progress;
  const year=$('#year');if(year)year.textContent=new Date().getFullYear();
  function clock(){const el=$('#studio-clock');if(!el)return;try{el.textContent=new Intl.DateTimeFormat('fr-FR',{timeZone:'Africa/Casablanca',hour:'2-digit',minute:'2-digit',timeZoneName:'shortOffset'}).format(new Date());}catch{}}
  clock();if($('#studio-clock'))setInterval(clock,60000);
  if(matchMedia('(pointer:fine)').matches){const cursor=$('#cursor-follower');if(cursor){let active=false,x=0,y=0,px=0,py=0,raf=0;function follow(){px+=(x-px)*.25;py+=(y-py)*.25;cursor.style.transform=`translate3d(${px}px,${py}px,0)`;raf=active&&BD.motion?requestAnimationFrame(follow):0;}$$('.project-art').forEach(card=>{card.addEventListener('pointerenter',e=>{if(!BD.motion)return;active=true;x=px=e.clientX;y=py=e.clientY;cursor.classList.add('is-visible');if(!raf)follow();});card.addEventListener('pointermove',e=>{x=e.clientX;y=e.clientY;});card.addEventListener('pointerleave',()=>{active=false;cursor.classList.remove('is-visible');});});}}
})();
