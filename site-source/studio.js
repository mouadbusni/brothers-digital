(() => {
  'use strict';
  const { $, $$, tr } = window.BD;
  const descriptions = {
    design: tr('Un langage visuel qui vous ressemble.','A visual language with your own character.'),
    code: tr('Une idée qui devient une expérience concrète.','An idea that becomes a working experience.'),
    strategy: tr('Votre image, vos outils et votre communication dans la même direction.','Your identity, digital products and communication moving in the same direction.'),
  };
  $$('[data-studio-lens]').forEach(button => button.addEventListener('click', () => {
    $$('[data-studio-lens]').forEach(item => item.setAttribute('aria-pressed',String(item === button)));
    $('.studio-art').dataset.lens = button.dataset.studioLens; $('#studio-lens-copy').textContent = descriptions[button.dataset.studioLens];
    window.dispatchEvent(new CustomEvent('bd-studio-lens',{detail:{lens:button.dataset.studioLens}}));
  }));
})();
