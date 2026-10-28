(() => {
  'use strict';
  const { $, $$, tr } = window.BD;
  const dialog = $('#image-viewer');
  if (!dialog?.showModal) { $$('[data-image-src]').forEach(button => { button.hidden = true; }); return; }
  const stage = $('#viewer-stage'), picture = $('#viewer-image');
  const pointers = new Map();
  let scale = 1, x = 0, y = 0, drag = null, pinch = null, opener = null, releaseIsolation = null;
  function paint() {
    const limitX = Math.max(0, (picture.clientWidth * scale - stage.clientWidth) / 2);
    const limitY = Math.max(0, (picture.clientHeight * scale - stage.clientHeight) / 2);
    x = Math.max(-limitX, Math.min(limitX, x)); y = Math.max(-limitY, Math.min(limitY, y));
    picture.style.transform = `translate3d(${x}px,${y}px,0) scale(${scale})`;
    $('#viewer-scale').textContent = Math.round(scale * 100) + '%';
    $('#viewer-minus').disabled = scale <= 1; $('#viewer-plus').disabled = scale >= 3.5;
    stage.classList.toggle('is-zoomed', scale > 1);
  }
  function zoom(next) { scale = Math.max(1, Math.min(3.5, next)); if (scale === 1) x = y = 0; paint(); }
  function reset() { scale = 1; x = y = 0; paint(); }
  function open(button) {
    opener = button; picture.removeAttribute('srcset'); picture.src = button.dataset.imageSrc;
    picture.alt = button.dataset.imageTitle || tr('Visuel du projet', 'Project visual');
    $('#viewer-title').textContent = picture.alt; $('#viewer-error').hidden = true; dialog.dataset.loading = 'true';
    reset(); dialog.showModal(); document.body.classList.add('viewer-open');
    releaseIsolation = window.BD.isolateOverlay(dialog); $('#viewer-close').focus({ preventScroll: true });
  }
  $$('[data-image-src]').forEach(button => { button.addEventListener('click', () => open(button)); button.disabled=false; });
  picture.addEventListener('load', () => { dialog.dataset.loading = 'false'; reset(); });
  picture.addEventListener('error', () => { dialog.dataset.loading = 'false'; $('#viewer-error').hidden = false; });
  $('#viewer-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    pointers.clear(); drag = pinch = null; document.body.classList.remove('viewer-open');
    releaseIsolation?.(); releaseIsolation = null; opener?.isConnected && opener.focus({ preventScroll: true });
  });
  $('#viewer-minus').addEventListener('click', () => zoom(scale - .4));
  $('#viewer-plus').addEventListener('click', () => zoom(scale + .4)); $('#viewer-reset').addEventListener('click', reset);
  stage.addEventListener('dblclick', () => zoom(scale > 1 ? 1 : 2));
  stage.addEventListener('wheel', event => { event.preventDefault(); zoom(scale + (event.deltaY > 0 ? -.15 : .15)); }, { passive: false });
  stage.addEventListener('pointerdown', event => {
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY }); stage.setPointerCapture(event.pointerId);
    if (pointers.size === 2) { const [a,b] = [...pointers.values()]; pinch = { distance: Math.hypot(a.x-b.x,a.y-b.y), scale }; drag = null; }
    else drag = { x: event.clientX, y: event.clientY, originX: x, originY: y };
  });
  stage.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2 && pinch) { const [a,b] = [...pointers.values()]; zoom(pinch.scale * Math.hypot(a.x-b.x,a.y-b.y) / Math.max(1,pinch.distance)); }
    else if (drag && scale > 1) { x = drag.originX + event.clientX - drag.x; y = drag.originY + event.clientY - drag.y; paint(); }
  });
  const finishPointer = event => { pointers.delete(event.pointerId); drag = pinch = null; };
  stage.addEventListener('pointerup', finishPointer); stage.addEventListener('pointercancel', finishPointer);
  stage.addEventListener('keydown', event => {
    if (['+','=','-','0','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) event.preventDefault();
    if (event.key === '+' || event.key === '=') zoom(scale + .4); else if (event.key === '-') zoom(scale - .4); else if (event.key === '0') reset();
    else if (event.key === 'ArrowLeft') { x += 45; paint(); } else if (event.key === 'ArrowRight') { x -= 45; paint(); }
    else if (event.key === 'ArrowUp') { y += 45; paint(); } else if (event.key === 'ArrowDown') { y -= 45; paint(); }
  });
  addEventListener('resize', () => { if (dialog.open) paint(); });
})();
