(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const safeRead = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const safeWrite = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  let language = safeRead('bd-language') === 'en' ? 'en' : 'fr';
  const mediaReduced = matchMedia('(prefers-reduced-motion: reduce)');
  let motion = safeRead('bd-motion') ? safeRead('bd-motion') === 'on' : !mediaReduced.matches;
  const tr = (fr, en) => language === 'fr' ? fr : en;

  // Render the approved raster mark as a crisp monochrome mask, preserving its silhouette.
  $$('[data-logo]').forEach((node, i) => {
    node.innerHTML = `<svg class="brand-icon" viewBox="0 0 110 84" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><filter id="bd-key-${i}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  2 3 1 0 -1.2"/></filter><mask id="bd-mask-${i}" x="0" y="0" width="110" height="84" maskUnits="userSpaceOnUse"><image href="assets/brand-mark.png" x="-38.2" y="-50.5" width="185" height="185" filter="url(#bd-key-${i})"/></mask></defs><rect width="110" height="84" fill="currentColor" mask="url(#bd-mask-${i})"/></svg>`;
  });

  const projects = {
    fieldnotes: {
      title: 'MoD — Field Notes', image: 'assets/portfolio.jpg', color: '#252336',
      tag: ['Projet personnel · Portfolio', 'Personal project · Portfolio'],
      description: ['Un espace personnel pour réunir développement, création et exploration digitale.', 'A personal space bringing development, creativity and digital exploration together.'],
      intent: ['Montrer plusieurs facettes d’un même créateur à travers une expérience qui a sa propre personnalité, au-delà d’une simple liste de projets.', 'Present the different sides of one creator through an experience with its own personality, beyond a simple list of projects.'],
      approach: ['Une direction éditoriale marquée, une navigation par univers et des compositions qui donnent à chaque projet une place à part.', 'A strong editorial direction, navigation through different creative worlds and layouts that give each project room to stand out.'],
      disciplines: ['Design d’interface', 'Développement créatif', 'Portfolio personnel'], disciplinesEn: ['Interface design', 'Creative development', 'Personal portfolio']
    },
    amine: {
      title: 'AMINE AI', image: 'assets/amine.jpg', color: '#ddd4c4',
      tag: ['Concept d’interface · Exploration', 'Interface concept · Exploration'],
      description: ['Une exploration visuelle pour une interface conversationnelle en darija, ancrée dans une sensibilité marocaine.', 'A visual exploration for a Darija conversational interface, rooted in a Moroccan sensibility.'],
      intent: ['Imaginer une interface qui donne une place centrale à la langue et à la culture, avec une présence visuelle plus singulière.', 'Imagine an interface that puts language and culture at its heart, with a more distinctive visual presence.'],
      approach: ['Recherche d’identité, exploration des couleurs et hiérarchie d’interface pour rendre le parcours conversationnel plus lisible et plus singulier.', 'Identity exploration, color studies and interface hierarchy to make the conversational journey clearer and more distinctive.'],
      disciplines: ['Direction artistique', 'Design UI', 'Concept d’expérience'], disciplinesEn: ['Art direction', 'UI design', 'Experience concept']
    },
    archive: {
      title: 'The Sound Archive', image: 'assets/archive.jpg', color: '#251b1b',
      tag: ['Projet personnel · Expérience musicale', 'Personal project · Music experience'],
      description: ['Une collection cinématographique de musique et d’images, organisée comme un univers à explorer.', 'A cinematic collection of music and artwork, organized as a world to explore.'],
      intent: ['Créer un écrin pour un univers musical personnel et donner autant d’importance à l’image qu’à la découverte des morceaux.', 'Create a home for a personal music universe and give visual storytelling as much importance as discovering the tracks.'],
      approach: ['Une direction sombre et expressive, des compositions immersives et une organisation qui relie musique et identité visuelle.', 'A dark, expressive art direction, immersive layouts and an approach that connects music with visual identity.'],
      disciplines: ['Direction artistique', 'Design web', 'Expérience éditoriale'], disciplinesEn: ['Art direction', 'Web design', 'Editorial experience']
    },
    identity: {
      title: 'Brothers Digital', image: 'assets/identity.png', color: '#a3aa91',
      tag: ['Identité du studio · Built together', 'Studio identity · Built together'],
      description: ['Une identité pensée pour relier trois esprits créatifs à travers un langage visuel commun.', 'An identity connecting three creative minds through a shared visual language.'],
      intent: ['Traduire l’idée de collaboration en une identité sobre, expressive et cohérente, du signe aux prises de parole du studio.', 'Translate collaboration into a restrained, expressive and coherent identity, from the mark to the studio’s communications.'],
      approach: ['Un monogramme interconnecté, une palette graphite, ivoire et olive, et une typographie franche. Les formes se prolongent dans les compositions et les supports de communication.', 'An interlocking monogram, a graphite, ivory and olive palette, and confident typography. Its shapes extend naturally into layouts and communication materials.'],
      disciplines: ['Identité visuelle', 'Système graphique', 'Direction artistique'], disciplinesEn: ['Visual identity', 'Graphic system', 'Art direction']
    }
  };
  let currentProject = null;
  const caseDialog = $('#case-dialog');
  let focusBeforeDialog = null;

  function renderCase(key) {
    const p = projects[key];
    if (!p) return;
    currentProject = key;
    const ix = language === 'fr' ? 0 : 1;
    $('#case-title').textContent = p.title;
    $('#case-tag').textContent = p.tag[ix];
    $('#case-description').textContent = p.description[ix];
    $('#case-intent').textContent = p.intent[ix];
    $('#case-approach').textContent = p.approach[ix];
    const image = $('#case-image');
    image.src = p.image;
    image.alt = p.title + ' — ' + p.tag[ix];
    $('.case-image-wrap').style.backgroundColor = p.color;
    $('#case-disciplines').replaceChildren(...(language === 'fr' ? p.disciplines : p.disciplinesEn).map(text => {
      const li = document.createElement('li'); li.textContent = text; return li;
    }));
    $('#case-counter').textContent = String(Object.keys(projects).indexOf(key) + 1).padStart(2, '0') + ' / 04';
    caseDialog.dataset.case = key;
  }

  function setLanguage(next) {
    language = next;
    root.lang = language;
    safeWrite('bd-language', language);
    $$('[data-fr][data-en]').forEach(el => { el.textContent = el.dataset[language]; });
    $$('[data-placeholder-fr]').forEach(el => { el.placeholder = el.dataset['placeholder' + (language === 'fr' ? 'Fr' : 'En')]; });
    $('.lang-fr').classList.toggle('is-active', language === 'fr');
    $('.lang-en').classList.toggle('is-active', language === 'en');
    $('#lang-toggle').setAttribute('aria-label', tr('Switch to English', 'Passer en français'));
    document.title = tr('Brothers Digital — Des idées. Du caractère. Du digital.', 'Brothers Digital — Big ideas. Real craft. Made digital.');
    if (currentProject) renderCase(currentProject);
    updateMotionLabel();
    updateMenuLabel();
    if (!$('#brief-result').hidden) $('#brief-output').value = makeBrief();
    $('#brief-error').textContent = '';
  }
  $('#lang-toggle').addEventListener('click', () => setLanguage(language === 'fr' ? 'en' : 'fr'));

  function updateMotionLabel() {
    const btn = $('#motion-toggle');
    btn.textContent = motion ? tr('Animations : oui', 'Motion: on') : tr('Animations : non', 'Motion: off');
    btn.setAttribute('aria-pressed', String(motion));
  }
  function setMotion(value, remember = false) {
    motion = value;
    root.dataset.motion = motion ? 'on' : 'off';
    if (remember) safeWrite('bd-motion', motion ? 'on' : 'off');
    updateMotionLabel();
    window.dispatchEvent(new CustomEvent('bd-motion', { detail: { enabled: motion } }));
    if (!motion) { $$('.reveal').forEach(el => el.classList.add('is-visible')); finishIntro(); }
  }
  $('#motion-toggle').addEventListener('click', () => setMotion(!motion, true));
  mediaReduced.addEventListener?.('change', event => { if (!safeRead('bd-motion')) setMotion(!event.matches); });

  let introTimer;
  function finishIntro() {
    clearTimeout(introTimer);
    const intro = $('#intro');
    if (!intro.hidden) {
      intro.classList.add('is-leaving');
      setTimeout(() => { intro.hidden = true; }, motion ? 900 : 0);
    }
    $('.hero').classList.add('is-ready');
    try { sessionStorage.setItem('bd-intro-seen', '1'); } catch {}
  }
  function playIntro() {
    const intro = $('#intro');
    intro.hidden = false;
    intro.classList.remove('is-leaving');
    $('.hero').classList.remove('is-ready');
    clearTimeout(introTimer);
    introTimer = setTimeout(finishIntro, 1750);
  }
  $('#skip-intro').addEventListener('click', finishIntro);
  $('#replay-intro').addEventListener('click', () => { if (motion) playIntro(); else $('.hero').scrollIntoView(); });
  let seenIntro = false;
  try { seenIntro = sessionStorage.getItem('bd-intro-seen') === '1'; } catch {}
  setMotion(motion);
  if (motion && !seenIntro) playIntro(); else finishIntro();

  let menuOpen = false;
  function updateMenuLabel() { $('#menu-toggle').setAttribute('aria-label', menuOpen ? tr('Fermer le menu', 'Close menu') : tr('Ouvrir le menu', 'Open menu')); }
  function toggleMenu(value) {
    menuOpen = value;
    $('#menu-toggle').setAttribute('aria-expanded', String(value));
    $('#mobile-menu').classList.toggle('is-open', value);
    $('#mobile-menu').inert = !value;
    document.body.classList.toggle('body-locked', value || caseDialog.open);
    updateMenuLabel();
    if (value) { finishIntro(); setTimeout(() => $('#mobile-menu a').focus(), motion ? 450 : 0); }
  }
  $('#menu-toggle').addEventListener('click', () => toggleMenu(!menuOpen));
  $$('#mobile-menu a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuOpen) { toggleMenu(false); $('#menu-toggle').focus(); }
    if (menuOpen && event.key === 'Tab') {
      const all = [$('#menu-toggle'), ...$$('#mobile-menu a')];
      if (event.shiftKey && document.activeElement === all[0]) { event.preventDefault(); all.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === all.at(-1)) { event.preventDefault(); all[0].focus(); }
    }
  });
  matchMedia('(min-width: 761px)').addEventListener?.('change', event => { if (event.matches && menuOpen) toggleMenu(false); });

  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }) : null;
  $$('.reveal').forEach(el => observer ? observer.observe(el) : el.classList.add('is-visible'));

  function updateProgress() {
    const max = document.documentElement.scrollHeight - innerHeight;
    $('.scroll-progress').style.width = (max > 0 ? Math.min(100, scrollY / max * 100) : 0) + '%';
    $('#header').classList.toggle('is-scrolled', scrollY > 20);
  }
  let scrollPending = false;
  addEventListener('scroll', () => {
    if (!scrollPending) { scrollPending = true; requestAnimationFrame(() => { updateProgress(); scrollPending = false; }); }
  }, { passive: true });
  addEventListener('resize', updateProgress);
  updateProgress();
  function updateClock() {
    try { $('#studio-clock').textContent = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Casablanca', hour: '2-digit', minute: '2-digit' }).format(new Date()) + ' GMT+1'; } catch {}
  }
  updateClock(); setInterval(updateClock, 60000);
  $('#year').textContent = new Date().getFullYear();

  $$('.filter').forEach(button => button.addEventListener('click', () => {
    $$('.filter').forEach(b => { b.classList.toggle('is-active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
    let count = 0;
    $$('.project-card').forEach(card => {
      const visible = button.dataset.filter === 'all' || card.dataset.category === button.dataset.filter;
      card.hidden = !visible;
      card.classList.toggle('is-filtered', button.dataset.filter !== 'all');
      if (visible) { count++; card.classList.add('is-visible'); }
    });
    $('#work-count').textContent = String(count).padStart(2, '0');
    updateProgress();
  }));
  $('#work-count').setAttribute('aria-live', 'polite');

  $$('[data-open-project]').forEach(button => button.addEventListener('click', () => {
    focusBeforeDialog = button;
    finishIntro();
    renderCase(button.dataset.openProject);
    caseDialog.showModal();
    document.body.classList.add('body-locked');
    caseDialog.scrollTop = 0;
    $('#case-close').focus();
  }));
  function closeCase() {
    caseDialog.close();
    document.body.classList.toggle('body-locked', menuOpen);
    if (focusBeforeDialog) focusBeforeDialog.focus({ preventScroll: true });
  }
  $('#case-close').addEventListener('click', closeCase);
  caseDialog.addEventListener('cancel', event => { event.preventDefault(); closeCase(); });
  $('#case-next').addEventListener('click', () => {
    const keys = Object.keys(projects);
    renderCase(keys[(keys.indexOf(currentProject) + 1) % keys.length]);
    caseDialog.scrollTo({ top: 0, behavior: motion ? 'smooth' : 'instant' });
  });
  $$('.case-dialog a[href^="#"]').forEach(a => a.addEventListener('click', event => {
    event.preventDefault(); closeCase(); $(a.getAttribute('href')).scrollIntoView({ behavior: motion ? 'smooth' : 'instant' });
  }));

  $$('.service-toggle').forEach(button => button.addEventListener('click', () => {
    const willOpen = button.getAttribute('aria-expanded') !== 'true';
    $$('.service-toggle').forEach(other => {
      const active = other === button && willOpen;
      other.setAttribute('aria-expanded', String(active));
      other.closest('.service').classList.toggle('is-open', active);
      $('#' + other.getAttribute('aria-controls')).inert = !active;
    });
    if (willOpen) {
      $('#expertise-object').dataset.state = button.dataset.service;
      $('#object-index').textContent = ({ web: '01 / BUILD', design: '02 / DEFINE', growth: '03 / CONNECT' })[button.dataset.service];
    }
  }));

  let briefStep = 1;
  function showBriefStep(step) {
    briefStep = step;
    $$('.brief-step').forEach(el => { el.hidden = Number(el.dataset.step) !== step; });
    $('#brief-back').hidden = step === 1;
    $('#brief-next').hidden = step === 3;
    $('#brief-submit').hidden = step !== 3;
    $('#brief-counter').textContent = '0' + step + ' / 03';
    $('.brief-progress>span').style.width = step / 3 * 100 + '%';
    $('#brief-error').textContent = '';
  }
  function validateStep() {
    let error = '';
    if (briefStep === 1 && !$('#brief-form input[name=service]:checked')) error = tr('Choisissez au moins un besoin pour continuer.', 'Choose at least one service to continue.');
    if (briefStep === 2 && $('#brief-description').value.trim().length < 10) error = tr('Quelques mots sur votre idée nous aideront à démarrer (10 caractères minimum).', 'Tell us a little about your idea to get started (at least 10 characters).');
    if (briefStep === 3 && $('#brief-name').value.trim().length < 2) error = tr('Indiquez votre nom ou celui de votre entreprise.', 'Please enter your name or your business name.');
    if (briefStep === 3 && $('#brief-email').value && !$('#brief-email').checkValidity()) error = tr('Vérifiez le format de votre email.', 'Please check your email address.');
    $('#brief-error').textContent = error;
    return !error;
  }
  $('#brief-next').addEventListener('click', () => {
    if (!validateStep()) return;
    showBriefStep(Math.min(3, briefStep + 1));
    const first = $('.brief-step:not([hidden]) input, .brief-step:not([hidden]) textarea');
    first?.focus({ preventScroll: true });
  });
  $('#brief-back').addEventListener('click', () => showBriefStep(Math.max(1, briefStep - 1)));
  const services = { web: ['Site web', 'Website'], app: ['Application', 'Application'], design: ['Identité & design', 'Identity & design'], growth: ['Contenu & visibilité', 'Content & visibility'] };
  function makeBrief() {
    const name = $('#brief-name').value.trim();
    const email = $('#brief-email').value.trim();
    const selected = $$('#brief-form input[name=service]:checked').map(el => services[el.value][language === 'fr' ? 0 : 1]).join(', ');
    const timing = $('#brief-timing').selectedOptions[0]?.dataset[language] || $('#brief-timing').value;
    return tr('Bonjour Brothers Digital,', 'Hello Brothers Digital,') + '\n\n' + tr('Je m’appelle ', 'My name is ') + name + '.\n' + tr('Mon projet : ', 'My project: ') + selected + '.\n\n' + $('#brief-description').value.trim() + '\n\n' + tr('Horizon : ', 'Timeframe: ') + timing + (email ? '\nEmail : ' + email : '') + '\n\n' + tr('Pouvons-nous en discuter ?', 'Could we talk about it?');
  }
  $('#brief-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!validateStep()) return;
    $('#brief-output').value = makeBrief();
    $('#brief-form').hidden = true;
    $('#brief-result').hidden = false;
    $('#brief-counter').textContent = tr('PRÊT ↗', 'READY ↗');
    $('.brief-progress>span').style.width = '100%';
    $('#brief-result h3').setAttribute('tabindex', '-1');
    $('#brief-result h3').focus({ preventScroll: true });
  });
  $('#copy-brief').addEventListener('click', async () => {
    let copied = false;
    try { await navigator.clipboard.writeText($('#brief-output').value); copied = true; }
    catch { $('#brief-output').select(); try { copied = document.execCommand('copy'); } catch {} }
    $('#copy-status').textContent = copied ? tr('Message copié. Ouvrez Instagram et collez-le dans votre message.', 'Message copied. Open Instagram and paste it into your message.') : tr('Sélectionnez le texte et utilisez Copier dans votre navigateur.', 'Select the text and use your browser’s Copy command.');
  });
  $('#download-brief').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([$('#brief-output').value], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'brothers-digital-brief.txt'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  $('#reset-brief').addEventListener('click', () => {
    $('#brief-form').reset(); $('#brief-result').hidden = true; $('#brief-form').hidden = false; $('#copy-status').textContent = ''; showBriefStep(1);
  });
  $$('[data-brief-service]').forEach(button => button.addEventListener('click', () => {
    $('#brief-result').hidden = true; $('#brief-form').hidden = false; showBriefStep(1);
    const input = $('#brief-form input[value="' + button.dataset.briefService + '"]');
    if (input) input.checked = true;
    $('#brief-builder').scrollIntoView({ behavior: motion ? 'smooth' : 'instant', block: 'center' });
  }));

  if (matchMedia('(pointer:fine)').matches) {
    const follower = $('#cursor-follower');
    let x = 0, y = 0, px = 0, py = 0, active = false, raf = 0;
    function cursorLoop() {
      px += (x - px) * .2; py += (y - py) * .2;
      follower.style.transform = `translate3d(${px}px,${py}px,0)`;
      if (active && motion) raf = requestAnimationFrame(cursorLoop); else raf = 0;
    }
    $$('.project-art').forEach(card => {
      card.addEventListener('pointerenter', event => { active = true; x = px = event.clientX; y = py = event.clientY; follower.classList.add('is-visible'); if (!raf) cursorLoop(); });
      card.addEventListener('pointermove', event => { x = event.clientX; y = event.clientY; });
      card.addEventListener('pointerleave', () => { active = false; follower.classList.remove('is-visible'); });
    });
  }
  setLanguage(language);
})();
