(() => {
 'use strict';
 const {$,$$,tr}=window.BD;
 $$('.case-explorer-tools button').forEach(button=>button.addEventListener('click',()=>{$$('.case-explorer-tools button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$('.case-explorer').dataset.view=button.dataset.view;$('.case-explore-note').textContent=$('.case-explore-note').dataset[button.dataset.view];}));
 $$('[data-case-swatch]').forEach(button=>button.addEventListener('click',()=>{$$('[data-case-swatch]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$('.case-brand-playground').dataset.swatch=button.dataset.caseSwatch;}));
 $('#visualizer-toggle')?.addEventListener('click',()=>{const paused=$('#visualizer-toggle').getAttribute('aria-pressed')!=='true';$('#visualizer-toggle').setAttribute('aria-pressed',String(paused));$('.case-sound-art').classList.toggle('is-paused',paused);$('#visualizer-toggle').textContent=paused?tr('Reprendre l’animation ▷','Resume animation ▷'):tr('Pause de l’animation Ⅱ','Pause animation Ⅱ');});
 $('#type-experiment')?.addEventListener('input',event=>{const text=event.target.value.trim()||tr('Explorer.','Explore.');$('#type-art-output').textContent=text;});
 $$('[data-type-color]').forEach(button=>button.addEventListener('click',()=>{$$('[data-type-color]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$('.case-type-art').dataset.typeColor=button.dataset.typeColor;}));
 $('#share-project')?.addEventListener('click',async()=>{try{if(navigator.share){await navigator.share({title:document.title,url:location.href});}else{await navigator.clipboard.writeText(location.href);$('#share-status').textContent=tr('Lien copié.','Link copied.');$('#share-project').textContent=tr('Lien copié ✓','Link copied ✓');}}catch{$('#share-status').textContent=tr('Copiez l’adresse de cette page pour la partager.','Copy this page’s address to share it.');}});
 if('IntersectionObserver'in window&&$('.case-feature'))new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('is-offscreen',!e.isIntersecting)),{rootMargin:'100px'}).observe($('.case-feature'));
})();
