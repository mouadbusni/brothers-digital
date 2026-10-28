(() => {
  'use strict';
  const { $, $$, tr } = window.BD;
  const grid = $('#project-grid'), parameters = new URLSearchParams(location.search);
  const categories = ['all','code','web','identity','experience'];
  let category = categories.includes(parameters.get('category')) ? parameters.get('category') : 'all';
  let layout = parameters.get('view');
  if (!['grid','list'].includes(layout)) { try { layout = localStorage.getItem('bd-work-view'); } catch {} }
  if (!['grid','list'].includes(layout)) layout = 'grid';
  let filterAnimations=[];
  addEventListener('bd-motion',event=>{if(!event.detail.enabled){filterAnimations.forEach(a=>a.cancel());filterAnimations=[];}});
  function apply(updateUrl = false, announce = false) {
    filterAnimations.forEach(a=>a.cancel());filterAnimations=[];
    let count = 0;
    $$('.filter').forEach(button => { const selected = button.dataset.filter === category; button.classList.toggle('is-active', selected); button.setAttribute('aria-pressed', String(selected)); });
    $$('.project-card').forEach(card => { const visible = category === 'all' || card.dataset.category.split(' ').includes(category); card.hidden = !visible; card.classList.toggle('is-filtered', category !== 'all'); if (visible) { count++; card.classList.add('is-visible'); } });
    grid.dataset.layout = layout;
    $$('[data-work-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.workView === layout)));
    $('#work-count').textContent = String(count).padStart(2,'0');
    if (announce) $('#work-status').textContent = count + ' ' + (count === 1 ? tr('projet affiché.', 'project shown.') : tr('projets affichés.', 'projects shown.'));
    if (updateUrl) {
      const url = new URL(location.href);
      if (category === 'all') url.searchParams.delete('category'); else url.searchParams.set('category', category);
      if (layout === 'grid') url.searchParams.delete('view'); else url.searchParams.set('view', layout);
      history.replaceState(null,'',url); try { localStorage.setItem('bd-work-view', layout); } catch {}
    }
    if(updateUrl&&window.BD.motion&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
      $$('.project-card:not([hidden])').forEach((card,i)=>{
        if(typeof card.animate!=='function')return;
        filterAnimations.push(card.animate([{opacity:.2,transform:'translate3d(0,24px,0) scale(.985)'},{opacity:1,transform:'none'}],{duration:620,delay:Math.min(i,5)*55,easing:'cubic-bezier(.16,1,.3,1)'}));
      });
    }
    window.BD.updateProgress();
  }
  $$('.filter').forEach(button => button.addEventListener('click', () => { category = button.dataset.filter; apply(true,true); }));
  $$('[data-work-view]').forEach(button => button.addEventListener('click', () => { layout = button.dataset.workView; apply(true,true); }));
  if (matchMedia('(pointer:fine)').matches) {
    $$('.project-art').forEach(art=>{
      const clear=()=>{art.style.setProperty('--card-x','0deg');art.style.setProperty('--card-y','0deg');};
      art.addEventListener('pointermove',event=>{if(!window.BD.motion||layout!=='grid')return;const box=art.getBoundingClientRect();art.style.setProperty('--card-x',((.5-(event.clientY-box.top)/box.height)*4).toFixed(2)+'deg');art.style.setProperty('--card-y',(((event.clientX-box.left)/box.width-.5)*4).toFixed(2)+'deg');},{passive:true});
      art.addEventListener('pointerleave',clear);addEventListener('bd-motion',event=>{if(!event.detail.enabled)clear();});
    });
  }
  apply();
})();
