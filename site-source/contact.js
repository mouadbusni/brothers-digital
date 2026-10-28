(() => {
  'use strict';
  const { $, $$, tr, language } = window.BD;
  let motion = window.BD.motion;
  addEventListener('bd-motion', e => { motion = e.detail.enabled; });
  /* SUBMISSION_STATE */
  const form = $('#enquiry-form'), status = $('#enquiry-status'), send = $('#send-enquiry');
  const draftKey = 'bd-project-draft-v2', allowedServices = ['web','app','design','growth'];
  const uuid = () => typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : [...crypto.getRandomValues(new Uint8Array(16))].map((n,i) => { const b=i===6?(n&15)|64:i===8?(n&63)|128:n; return ([4,6,8,10].includes(i)?'-':'')+b.toString(16).padStart(2,'0'); }).join('');
  let lastSubmission = null, submitting = false, draftTimer = 0, confirmed = false, reference = '';
  const messages = {
    invalid_name: tr('Indiquez votre nom ou votre entreprise.','Please enter your name or business.'),
    invalid_email: tr('Vérifiez votre adresse email.','Please check your email address.'),
    invalid_message: tr('Décrivez votre idée en au moins dix caractères.','Describe your idea in at least ten characters.'),
    missing_service: tr('Choisissez au moins un besoin.','Choose at least one service.'),
    rate_limited: tr('Plusieurs demandes ont déjà été envoyées. Réessayez dans quelques minutes ou contactez-nous sur Instagram.','Several enquiries have already been sent. Try again in a few minutes or contact us on Instagram.'),
    submission_conflict: tr('Cette référence appartient déjà à une demande. Réessayez pour envoyer votre nouvelle idée.','This reference belongs to an earlier enquiry. Please retry to send your new idea.'),
    temporarily_unavailable: tr('Votre demande n’a pas pu être confirmée. Vos informations sont conservées ici. Réessayez ou contactez-nous sur Instagram.','We couldn’t confirm your enquiry. Your information is still here. Try again or contact us on Instagram.'),
  };
  function formValues() {
    return { name: form.elements.name.value, email: form.elements.email.value, message: form.elements.message.value,
      services: $$('#enquiry-form input[name=services]:checked').map(e=>e.value), timeframe: form.elements.timeframe.value };
  }
  function hasContent() {
    const value = formValues();
    return !!(value.name || value.email || value.message || value.services.length || $('#brief-name').value || $('#brief-email').value || $('#brief-description').value || $('#brief-form input[name=service]:checked'));
  }
  function updateDraftUI(saved = false) {
    $('#message-count').textContent = form.elements.message.value.length.toLocaleString(language) + ' / 5 000';
    $('#clear-draft').hidden = !hasContent();
    if (saved) $('#draft-state').textContent = tr('Brouillon conservé dans cet onglet.','Draft kept in this tab.');
    else if (!hasContent()) $('#draft-state').textContent = '';
  }
  function persistDraft() {
    clearTimeout(draftTimer);
    if (confirmed || !hasContent()) { try { sessionStorage.removeItem(draftKey); } catch {} return; }
    const brief = { name: $('#brief-name').value, email: $('#brief-email').value, description: $('#brief-description').value, timing: $('#brief-timing').value,
      services: $$('#brief-form input[name=service]:checked').map(e=>e.value), step: briefStep, ready: !$('#brief-result').hidden, output: $('#brief-output').value, open: $('.brief-assist').open };
    try { sessionStorage.setItem(draftKey, JSON.stringify({ savedAt: Date.now(), values: formValues(), brief, submission: lastSubmission })); updateDraftUI(true); } catch { updateDraftUI(); }
  }
  function scheduleDraft() { confirmed = false; updateDraftUI(); clearTimeout(draftTimer); draftTimer = setTimeout(persistDraft, 400); }
  function clearStatus() { status.textContent = ''; status.classList.remove('is-error'); form.querySelectorAll('[aria-invalid]').forEach(input => input.removeAttribute('aria-invalid')); }
  function resetBrief() { $('#brief-form').reset(); $('#brief-output').value = ''; $('#brief-result').hidden = true; $('#brief-form').hidden = false; $('#copy-status').textContent = ''; showBriefStep(1); }
  function clearDraft() {
    clearTimeout(draftTimer); form.reset(); resetBrief(); lastSubmission = null; confirmed = false;
    try { sessionStorage.removeItem(draftKey); } catch {}
    clearStatus(); updateDraftUI(); $('#draft-state').textContent = tr('Brouillon effacé.','Draft cleared.');
    if (!form.hidden) form.elements.name.focus({ preventScroll: true });
  }
  form.addEventListener('input', () => { clearStatus(); scheduleDraft(); });
  form.addEventListener('change', scheduleDraft);
  $('#brief-form').addEventListener('input', scheduleDraft); $('#brief-form').addEventListener('change', scheduleDraft);
  $('.brief-assist').addEventListener('toggle', () => { if (hasContent()) persistDraft(); });
  addEventListener('pagehide', persistDraft); addEventListener('bd-before-navigate', persistDraft);
  $('#clear-draft').addEventListener('click', clearDraft);
  form.addEventListener('keydown', event => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); form.requestSubmit(); } });
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (submitting) return; clearStatus();
    const values = formValues();
    if (!values.services.length) { status.textContent = messages.missing_service; status.classList.add('is-error'); $('#enquiry-form input[name=services]').focus(); return; }
    if (!form.reportValidity()) return;
    lastSubmission = submissionFor(lastSubmission, values, uuid); persistDraft();
    const payload = { ...values, id: lastSubmission.id, website: form.elements.website.value, language };
    submitting = true; $('.brief-assist').inert = true; send.disabled = true; send.setAttribute('aria-busy','true'); form.setAttribute('aria-busy','true');
    send.firstElementChild.textContent = tr('Envoi en cours…','Sending…');
    const inputs = [...form.querySelectorAll('input,textarea,select')]; inputs.forEach(input => { input.disabled = true; }); $('#clear-draft').disabled = true;
    let invalidField = null;
    try {
      const response = await fetch('/api/inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(18000) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'temporarily_unavailable');
      confirmed = true; clearTimeout(draftTimer); try { sessionStorage.removeItem(draftKey); } catch {}
      form.hidden = true; $('#enquiry-success').hidden = false; reference = String(result.id).slice(0,8).toUpperCase();
      $('#enquiry-reference').textContent = tr('Référence : ','Reference: ') + reference; $('#copy-reference').textContent=tr('Copier la référence','Copy reference')+' ⧉';
      $('#enquiry-success h4').setAttribute('tabindex','-1'); $('#enquiry-success h4').focus({ preventScroll: true });
      form.reset(); resetBrief(); $('.brief-assist').open = false; lastSubmission = null; updateDraftUI();
    } catch (error) {
      if (error.message === 'submission_conflict') lastSubmission = null;
      const fieldName = { invalid_name: 'name', invalid_email: 'email', invalid_message: 'message' }[error.message];
      invalidField = fieldName ? form.elements[fieldName] : null;
      invalidField?.setAttribute('aria-invalid','true');
      status.textContent = messages[error.message] || messages.temporarily_unavailable; status.classList.add('is-error'); persistDraft();
    } finally {
      submitting = false; $('.brief-assist').inert = false; inputs.forEach(input => { input.disabled = false; }); $('#clear-draft').disabled = false;
      send.disabled = false; send.removeAttribute('aria-busy'); form.removeAttribute('aria-busy'); send.firstElementChild.textContent = tr('Envoyer ma demande','Send my enquiry');
      invalidField?.focus();
    }
  });
  $('#enquiry-reset').addEventListener('click', () => { clearDraft(); form.hidden = false; $('#enquiry-success').hidden = true; form.elements.name.focus({ preventScroll: true }); });
  $('#copy-reference').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(reference); $('#copy-reference').textContent = tr('Référence copiée ✓','Reference copied ✓'); }
    catch { const input = document.createElement('textarea'); input.value = reference; input.className = 'sr-only'; document.body.append(input); input.select(); const copied = document.execCommand('copy'); input.remove(); $('#copy-reference').textContent = copied ? tr('Référence copiée ✓','Reference copied ✓') : reference; }
  });
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
    persistDraft();
    const first = $('.brief-step:not([hidden]) input, .brief-step:not([hidden]) textarea');
    first?.focus({ preventScroll: true });
  });
  $('#brief-back').addEventListener('click', () => { showBriefStep(Math.max(1, briefStep - 1)); persistDraft(); });
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
    if (submitting || !validateStep()) return;
    $('#brief-output').value = makeBrief();
    $('#brief-form').hidden = true;
    $('#brief-result').hidden = false;
    $('#brief-counter').textContent = tr('PRÊT ↗', 'READY ↗');
    $('.brief-progress>span').style.width = '100%';
    $('#brief-result h3').setAttribute('tabindex', '-1');
    $('#brief-result h3').focus({ preventScroll: true }); persistDraft();
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
    resetBrief(); persistDraft();
  });

  $('#use-brief').addEventListener('click', () => {
    if (submitting) return; if (form.hidden) lastSubmission = null;
    form.elements.message.value = $('#brief-output').value; form.elements.name.value = $('#brief-name').value; form.elements.email.value = $('#brief-email').value;
    const selected = new Set($$('#brief-form input[name=service]:checked').map(input=>input.value));
    $$('#enquiry-form input[name=services]').forEach(input=>{ input.checked = selected.has(input.value); });
    form.elements.timeframe.value = $('#brief-timing').value; form.hidden = false; $('#enquiry-success').hidden = true; $('.brief-assist').open = false;
    confirmed = false; persistDraft(); updateDraftUI(); $('#enquiry-card').scrollIntoView({ behavior: motion?'smooth':'instant', block:'center' }); form.elements.message.focus({ preventScroll:true });
  });
  function restoreDraft() {
    let draft; try { draft = JSON.parse(sessionStorage.getItem(draftKey) || 'null'); } catch {}
    if (draft && Date.now()-draft.savedAt < 86400000 && draft.savedAt <= Date.now() && draft.values && typeof draft.values === 'object') {
      const setText = (element,value,max) => { if (typeof value === 'string') element.value = value.slice(0,max); };
      setText(form.elements.name,draft.values.name,100); setText(form.elements.email,draft.values.email,180); setText(form.elements.message,draft.values.message,5000);
      if (typeof draft.values.timeframe === 'string') form.elements.timeframe.value = draft.values.timeframe;
      $$('#enquiry-form input[name=services]').forEach(input=>{input.checked = Array.isArray(draft.values.services) && draft.values.services.includes(input.value);});
      const brief = draft.brief || {};
      setText($('#brief-name'),brief.name,100); setText($('#brief-email'),brief.email,180); setText($('#brief-description'),brief.description,1800); setText($('#brief-output'),brief.output,5000);
      if (typeof brief.timing === 'string') $('#brief-timing').value = brief.timing;
      $$('#brief-form input[name=service]').forEach(input=>{input.checked = Array.isArray(brief.services) && brief.services.includes(input.value);});
      showBriefStep([1,2,3].includes(brief.step)?brief.step:1);
      if (brief.ready && $('#brief-output').value) { $('#brief-form').hidden=true; $('#brief-result').hidden=false; $('#brief-counter').textContent=tr('PRÊT ↗','READY ↗'); $('.brief-progress>span').style.width='100%'; }
      $('.brief-assist').open = !!brief.open;
      if (draft.submission && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(draft.submission.id) && typeof draft.submission.signature === 'string' && draft.submission.signature.length < 6500) lastSubmission = draft.submission;
      updateDraftUI(true);
    }
    const preselected = new URLSearchParams(location.search).get('service');
    if (allowedServices.includes(preselected)) form.querySelector(`input[value="${preselected}"]`).checked = true;
    updateDraftUI();
  }
  restoreDraft();
})();
