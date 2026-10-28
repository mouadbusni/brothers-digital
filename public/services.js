(() => {
  'use strict';
  const { $, $$, language } = window.BD;
  function activateService(service){$$('.service-toggle').forEach(button=>{const active=button.dataset.service===service;button.setAttribute('aria-expanded',String(active));button.closest('.service').classList.toggle('is-open',active);$('#'+button.getAttribute('aria-controls')).inert=!active;});$('#studio-demo').dataset.demo=service;$$('.demo-panel').forEach(panel=>{panel.hidden=panel.id!=='demo-'+service;});}
  $$('.service-toggle').forEach(button=>button.addEventListener('click',()=>activateService(button.dataset.service)));
  $$('.demo-device').forEach(button=>button.addEventListener('click',()=>{$$('.demo-device').forEach(b=>{b.classList.toggle('is-active',b===button);b.setAttribute('aria-pressed',String(b===button));});$('.demo-browser').dataset.deviceView=button.dataset.device;}));
  $('#demo-mini-menu')?.addEventListener('click',()=>{const open=$('#demo-mini-menu').getAttribute('aria-expanded')!=='true';$('#demo-mini-menu').setAttribute('aria-expanded',String(open));$('#demo-mini-links').hidden=!open;});
  $('#demo-discover')?.addEventListener('click',()=>{const open=$('#demo-discover').getAttribute('aria-expanded')!=='true';$('#demo-discover').setAttribute('aria-expanded',String(open));$('#demo-mini-detail').hidden=!open;});
  $$('.demo-swatch').forEach(button=>button.addEventListener('click',()=>{$$('.demo-swatch').forEach(b=>{b.classList.toggle('is-active',b===button);b.setAttribute('aria-pressed',String(b===button));});$('#demo-brand-card').dataset.swatch=button.dataset.swatch;}));
  const contentTitles={expertise:['Le détail<br>fait la différence.','Details<br>make a difference.'],project:['Une idée.<br>Un projet concret.','An idea.<br>A real project.'],studio:['Trois esprits.<br>Une vision.','Three minds.<br>One vision.']};
  $$('.demo-calendar button').forEach(button=>button.addEventListener('click',()=>{$$('.demo-calendar button').forEach(b=>{b.classList.toggle('is-active',b===button);b.setAttribute('aria-pressed',String(b===button));});$('#demo-content-preview').dataset.content=button.dataset.content;$('#demo-content-title').innerHTML=contentTitles[button.dataset.content][language==='fr'?0:1];}));
  $('#demo-content-title').innerHTML=contentTitles.expertise[language==='fr'?0:1];
})();
