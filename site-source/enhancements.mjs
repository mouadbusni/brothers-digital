import { projectAsset } from './projects.mjs';

const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const tr = (language, fr, en) => language === 'fr' ? fr : en;

function previewButton(src, title, language, className = 'image-open') {
  return `<button type="button" disabled class="${className}" data-image-src="${src}" data-image-title="${esc(title)}" aria-label="${esc(tr(language, 'Agrandir : ', 'Enlarge: ') + title)}"><span aria-hidden="true">⤢</span><span>${tr(language, 'Aperçu', 'Preview')}</span></button>`;
}

function imageViewer(language) {
  return `<dialog id="image-viewer" class="image-viewer" aria-labelledby="viewer-title" aria-describedby="viewer-help"><div class="viewer-top"><div><span class="eyebrow">BROTHERS DIGITAL / ${tr(language,'REGARDER DE PLUS PRÈS','A CLOSER LOOK')}</span><h2 id="viewer-title"></h2></div><button type="button" id="viewer-close" aria-label="${tr(language,'Fermer l’aperçu','Close preview')}"><span aria-hidden="true">×</span><span>${tr(language,'Fermer','Close')}</span><kbd>Esc</kbd></button></div><div id="viewer-stage" class="viewer-stage" tabindex="0" role="region" aria-label="${tr(language,'Visuel du projet. Utilisez les flèches pour déplacer le visuel agrandi.','Project image. Use arrow keys to pan when zoomed.')}" aria-describedby="viewer-help"><img id="viewer-image" alt="" draggable="false"></div><div class="viewer-bottom"><p id="viewer-help">${tr(language,'Agrandissez, puis faites glisser pour explorer.','Zoom in, then drag to explore.')}</p><div class="viewer-controls" role="group" aria-label="${tr(language,'Contrôles du zoom','Zoom controls')}"><button type="button" id="viewer-minus" aria-label="${tr(language,'Réduire','Zoom out')}">−</button><output id="viewer-scale" aria-live="polite">100%</output><button type="button" id="viewer-plus" aria-label="${tr(language,'Agrandir','Zoom in')}">+</button><button type="button" id="viewer-reset">${tr(language,'Ajuster','Fit')}</button></div></div><p class="viewer-error" id="viewer-error" role="status" hidden>${tr(language,'Le visuel n’a pas pu être chargé. Fermez cet aperçu pour revenir au projet.','The image could not be loaded. Close this preview to return to the project.')}</p></dialog>`;
}

export function enhanceDocument(html, { language, kind, url, projects, pageRoutes }) {
  const t = (fr, en) => tr(language, fr, en);
  const routes = pageRoutes[language];
  if (kind === 'home') {
    html = html.replace('<canvas id="sculpture"', '<div class="scene-atmosphere" aria-hidden="true"><div class="scene-halo"></div><i class="scene-orbit orbit-one"></i><i class="scene-orbit orbit-two"></i><span class="scene-coordinate coordinate-a">03 / 01</span><span class="scene-coordinate coordinate-b">BD — STUDIO</span></div><canvas id="sculpture"');
  }
  if (kind === 'work') {
    const views = `<div class="work-views" role="group" aria-label="${t('Affichage des projets','Project layout')}"><button type="button" data-work-view="grid" aria-pressed="true"><span aria-hidden="true">⊞</span>${t('Galerie','Gallery')}</button><button type="button" data-work-view="list" aria-pressed="false"><span aria-hidden="true">☷</span>${t('Index','Index')}</button></div>`;
    html = html.replace('<span class="work-count">', views + '<span class="work-count">');
    html = html.replace('<div class="project-grid" id="project-grid">', `<p class="sr-only" id="work-status" role="status" aria-live="polite"></p><div class="project-grid" id="project-grid" data-layout="grid">`);
    html = html.replace(/<article class="project-card[\s\S]*?<\/article>/g, card => {
      const id = card.match(/data-project="([^"]+)"/)?.[1];
      const p = projects.find(project => project.id === id);
      if (!p) return card;
      const index = projects.indexOf(p) + 1;
      const src = projectAsset(p);
      return card.replace('<article ', `<article data-index="0${index}" `).replace('</article>', previewButton(src,p.title,language,'project-preview') + '</article>');
    });
  }
  if (kind === 'services') {
    html = html.replace(/<a([^>]*data-brief-service="(web|design|growth)"[^>]*)>([\s\S]*?)<\/a>/g, (all, attrs, service) => {
      const href = service === 'growth' ? (language === 'fr' ? '/fr/projets/identity/' : '/en/work/identity/') : routes.work + '?category=' + (service === 'design' ? 'identity' : 'web');
      return all + `<a class="service-proof" href="${href}"><span>${service === 'growth' ? t('Voir l’univers du studio','See the studio’s visual world') : t('Explorer les projets associés','Explore related projects')}</span><span aria-hidden="true">↗</span></a>`;
    });
  }
  if (kind === 'studio') {
    html = html.replace('<span class="studio-big-mark" data-logo></span>', `<div class="studio-model"><i class="studio-model-shadow" aria-hidden="true"></i><canvas id="studio-model" role="img" aria-label="${t('Design : plume et palette de matières en trois dimensions.','Design: a three-dimensional pen nib and material palette.')}"></canvas><span class="studio-big-mark" data-logo aria-hidden="true"></span></div>`);
    const lens = `<div class="studio-lens"><div class="studio-lens-tabs" role="group" aria-label="${t('Les disciplines du studio','Studio disciplines')}">${[['design','Design','Design'],['code','Code','Code'],['strategy','Stratégie','Strategy']].map(([id,fr,en],i) => `<button type="button" data-studio-lens="${id}" aria-pressed="${i===0}" aria-controls="studio-lens-copy"><span>0${i+1}</span>${t(fr,en)}</button>`).join('')}</div><p id="studio-lens-copy" aria-live="polite">${t('Un langage visuel qui vous ressemble.','A visual language with your own character.')}</p></div>`;
    html = html.replace('<div class="studio-art reveal">','<div class="studio-art reveal" data-lens="design">');
    html = html.replace('<span class="studio-art-coord">BD / 03 → 01</span>', lens.replaceAll('aria-controls="studio-lens-copy"','aria-controls="studio-model studio-lens-copy"'));
  }
  if (kind === 'contact') {
    html = html.replace('<form id="enquiry-form">', `<noscript><style>#enquiry-form{display:none!important}</style><p class="enquiry-note">${t('Le formulaire nécessite JavaScript. Vous pouvez nous contacter directement sur Instagram.', 'This form needs JavaScript. You can contact us directly on Instagram.')}</p></noscript><form id="enquiry-form" method="post" action="/api/inquiries">`);
    html = html.replace('<fieldset class="enquiry-services">','<fieldset class="enquiry-services" aria-describedby="enquiry-status">');
    html = html.replace('<textarea name="message"','<textarea name="message" aria-describedby="message-count"');
    html = html.replace(/(<textarea name="message"[\s\S]*?<\/textarea><\/label>)/, `$1<div class="message-meta"><span id="draft-state" role="status"></span><button type="button" id="clear-draft" hidden>${t('Effacer le brouillon','Clear draft')}</button><span id="message-count">0 / 5 000</span></div>`);
    html = html.replace('<small id="enquiry-reference"></small>', `<div class="enquiry-reference-row"><small id="enquiry-reference"></small><button type="button" id="copy-reference">${t('Copier la référence','Copy reference')} ⧉</button></div>`);
    html = html.replace('<p class="enquiry-note"', `<p class="submit-shortcut">${t('Un dernier détail ? Prenez votre temps.','One last detail? Take your time.')}<span><kbd>Ctrl / ⌘</kbd> + <kbd>↵</kbd></span></p><p class="enquiry-note"`);
  }
  if (kind === 'case') {
    const id = url.split('/').filter(Boolean).at(-1);
    const p = projects.find(project => project.id === id);
    if (p) {
      const src = projectAsset(p);
      html = html.replace(/(<div class="case-page-cover"[^>]*><img[^>]*>)(<\/div>)/, `$1${previewButton(src,p.title,language)}$2`);
      html = html.replace(/(<div class="case-explorer"[^>]*><img[^>]*>)(<\/div>)/, `$1${previewButton(src,p.title,language)}$2`);
      const i = projects.indexOf(p), previous = projects[(i + projects.length - 1) % projects.length], next = projects[(i+1)%projects.length];
      const path = project => language === 'fr' ? `/fr/projets/${project.id}/` : `/en/work/${project.id}/`;
      html = html.replace(/(<p class="case-provenance">[\s\S]*?<\/p>)/, `$1<nav class="case-project-step" aria-label="${t('Parcourir les projets','Browse projects')}"><a href="${path(previous)}"><span aria-hidden="true">←</span>${t('Projet précédent','Previous project')}</a><span>0${i+1} / 0${projects.length}</span><a href="${path(next)}">${t('Projet suivant','Next project')}<span aria-hidden="true">→</span></a></nav>`);
    }
  }
  if (kind === 'work' || kind === 'case') html = html.replace('</body>', imageViewer(language) + '</body>');
  return html;
}
