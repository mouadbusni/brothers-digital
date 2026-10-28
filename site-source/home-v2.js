(() => {
  'use strict';
  const { $, $$, tr, language }=window.BD;
  let motion=window.BD.motion;
  addEventListener('bd-motion',e=>{motion=e.detail.enabled;});
  $$('.filter').forEach(button=>button.addEventListener('click',()=>{const filter=button.dataset.filter;$$('.filter').forEach(b=>{b.classList.toggle('is-active',b===button);b.setAttribute('aria-pressed',String(b===button));});let count=0;$$('.project-card').forEach(card=>{const visible=filter==='all'||card.dataset.category===filter;card.hidden=!visible;card.classList.toggle('is-filtered',filter!=='all');if(visible){count++;card.classList.add('is-visible');}});$('#work-count').textContent=String(count).padStart(2,'0');window.BD.updateProgress();}));
  function activateService(service){$$('.service-toggle').forEach(button=>{const active=button.dataset.service===service;button.setAttribute('aria-expanded',String(active));button.closest('.service').classList.toggle('is-open',active);$('#'+button.getAttribute('aria-controls')).inert=!active;});$('#studio-demo').dataset.demo=service;$$('.demo-panel').forEach(panel=>{panel.hidden=panel.id!=='demo-'+service;});}
  $$('.service-toggle').forEach(button=>button.addEventListener('click',()=>activateService(button.dataset.service)));
  $$('.demo-device').forEach(button=>button.addEventListener('click',()=>{$$('.demo-device').forEach(b=>{b.classList.toggle('is-active',b===button);b.setAttribute('aria-pressed',String(b===button));});$('.demo-browser').dataset.deviceView=button.dataset.device;}));
  $('#demo-mini-menu')?.addEventListener('click',()=>{const open=$('#demo-mini-menu').getAttribute('aria-expanded')!=='true';$('#demo-mini-menu').setAttribute('aria-expanded',String(open));$('#demo-mini-links').hidden=!open;});
  $('#demo-discover')?.addEventListener('click',()=>{const open=$('#demo-discover').getAttribute('aria-expanded')!=='true';$('#demo-discover').setAttribute('aria-expanded',String(open));$('#demo-mini-detail').hidden=!open;});
  $$('.demo-swatch').forEach(button=>button.addEventListener('click',()=>{$$('.demo-swatch').forEach(b=>{b.classList.toggle('is-active',b===button);b.setAttribute('aria-pressed',String(b===button));});$('#demo-brand-card').dataset.swatch=button.dataset.swatch;}));
  const contentTitles={expertise:['Le détail<br>fait la différence.','Details<br>make a difference.'],project:['Une idée.<br>Un projet concret.','An idea.<br>A real project.'],studio:['Trois esprits.<br>Une vision.','Three minds.<br>One vision.']};
  $$('.demo-calendar button').forEach(button=>button.addEventListener('click',()=>{$$('.demo-calendar button').forEach(b=>{b.classList.toggle('is-active',b===button);b.setAttribute('aria-pressed',String(b===button));});$('#demo-content-preview').dataset.content=button.dataset.content;$('#demo-content-title').innerHTML=contentTitles[button.dataset.content][language==='fr'?0:1];}));
  $('#demo-content-title').innerHTML=contentTitles.expertise[language==='fr'?0:1];
  $$('[data-brief-service]').forEach(button=>button.addEventListener('click',()=>{const value=button.dataset.briefService;const checkbox=$(`#enquiry-form input[value="${value}"]`);if(checkbox)checkbox.checked=true;$('#enquiry-card').scrollIntoView({behavior:motion?'smooth':'instant',block:'center'});setTimeout(()=>$('#enquiry-form input[name=name]')?.focus({preventScroll:true}),motion?450:0);}));

  const form=$('#enquiry-form'), status=$('#enquiry-status'), send=$('#send-enquiry');
  const uuid=()=>typeof crypto.randomUUID==='function'?crypto.randomUUID():[...crypto.getRandomValues(new Uint8Array(16))].map((n,i)=>{const b=i===6?(n&15)|64:i===8?(n&63)|128:n;return([4,6,8,10].includes(i)?'-':'')+b.toString(16).padStart(2,'0');}).join('');
  let requestId=uuid(),submitting=false;
  const messages={invalid_name:tr('Indiquez votre nom ou votre entreprise.','Please enter your name or business.'),invalid_email:tr('Vérifiez votre adresse email.','Please check your email address.'),invalid_message:tr('Décrivez votre idée en au moins dix caractères.','Describe your idea in at least ten characters.'),missing_service:tr('Choisissez au moins un besoin.','Choose at least one service.'),rate_limited:tr('Plusieurs demandes ont déjà été envoyées. Réessayez dans quelques minutes ou contactez-nous sur Instagram.','Several enquiries have already been sent. Try again in a few minutes or contact us on Instagram.'),temporarily_unavailable:tr('Votre demande n’a pas pu être confirmée. Vos informations sont conservées dans ce formulaire. Réessayez ou contactez-nous sur Instagram.','We couldn’t confirm your enquiry. Your information is still in this form. Try again or contact us on Instagram.')};
  function clearStatus(){status.textContent='';status.classList.remove('is-error');}
  form.addEventListener('input',clearStatus);
  form.addEventListener('submit',async event=>{event.preventDefault();if(submitting)return;clearStatus();const data=new FormData(form);const services=data.getAll('services');if(!services.length){status.textContent=messages.missing_service;status.classList.add('is-error');return;}if(!form.reportValidity())return;submitting=true;send.disabled=true;send.setAttribute('aria-busy','true');send.firstElementChild.textContent=tr('Envoi en cours…','Sending…');try{const response=await fetch('/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:requestId,name:data.get('name'),email:data.get('email'),message:data.get('message'),services,timeframe:data.get('timeframe'),website:data.get('website'),language}),signal:AbortSignal.timeout(18000)});const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.error||'temporarily_unavailable');form.hidden=true;$('#enquiry-success').hidden=false;$('#enquiry-reference').textContent=tr('Référence : ','Reference: ')+String(result.id).slice(0,8).toUpperCase();$('#enquiry-success h4').setAttribute('tabindex','-1');$('#enquiry-success h4').focus({preventScroll:true});}catch(error){status.textContent=messages[error.message]||messages.temporarily_unavailable;status.classList.add('is-error');}finally{submitting=false;send.disabled=false;send.removeAttribute('aria-busy');send.firstElementChild.textContent=tr('Envoyer ma demande','Send my enquiry');}});
  $('#enquiry-reset').addEventListener('click',()=>{form.reset();requestId=uuid();form.hidden=false;$('#enquiry-success').hidden=true;clearStatus();});

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

  $('#use-brief')?.addEventListener('click',()=>{const out=$('#brief-output').value;$('#enquiry-form textarea[name=message]').value=out;$('#enquiry-form input[name=name]').value=$('#brief-name').value;$('#enquiry-form input[name=email]').value=$('#brief-email').value;$$('#brief-form input[name=service]:checked').forEach(input=>{const target=$(`#enquiry-form input[value="${input.value}"]`);if(target)target.checked=true;});form.hidden=false;$('#enquiry-success').hidden=true;$('.brief-assist').open=false;$('#enquiry-card').scrollIntoView({behavior:motion?'smooth':'instant',block:'center'});$('#enquiry-form textarea[name=message]').focus({preventScroll:true});});
})();
