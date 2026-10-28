import { projects, projectAsset } from './projects.mjs';

export const pageRoutes = {
  fr: { home: '/fr/', work: '/fr/projets/', services: '/fr/services/', studio: '/fr/studio/', contact: '/fr/contact/' },
  en: { home: '/en/', work: '/en/work/', services: '/en/services/', studio: '/en/studio/', contact: '/en/contact/' },
};

const text = (language, fr, en) => language === 'fr' ? fr : en;
const labels = {
  fr: { home: 'Accueil', work: 'Projets', services: 'Services', studio: 'Le studio', contact: 'Contact' },
  en: { home: 'Home', work: 'Work', services: 'Services', studio: 'The studio', contact: 'Contact' },
};

export function pageNavigation(header, language, active) {
  const routes = pageRoutes[language];
  const localize = html => html.replaceAll('href="#accueil"', `href="${routes.home}"`)
    .replaceAll('href="#projets"', `href="${routes.work}"`)
    .replaceAll('href="#expertises"', `href="${routes.services}"`)
    .replaceAll('href="#studio"', `href="${routes.studio}"`)
    .replaceAll('href="#contact"', `href="${routes.contact}"`)
    .replaceAll('data-fr="Expertises" data-en="Expertise">Expertises', 'data-fr="Services" data-en="Services">Services');
  let html = localize(header);
  const current = routes[active === 'case' ? 'work' : active];
  if (current) html = html.replaceAll(`href="${current}"`, `href="${current}" aria-current="page"`);
  return html;
}

export function pageFooter(footer, language, active) {
  const routes = pageRoutes[language];
  if (active === 'home') return `<footer class="hook-footer"><span>© <span id="year">2026</span> Brothers Digital</span><div><a href="https://www.instagram.com/brothers_digital_agency/" target="_blank" rel="noopener noreferrer">Instagram ↗</a><button type="button" id="motion-toggle" aria-pressed="true">${text(language, 'Animations : oui', 'Motion: on')}</button><button type="button" id="replay-intro" class="hook-replay" aria-label="${text(language, 'Revoir l’intro', 'Replay intro')}" title="${text(language, 'Revoir l’intro', 'Replay intro')}">↻</button></div></footer>`;
  const nav = `<nav class="footer-pages" aria-label="${text(language, 'Explorer le studio', 'Explore the studio')}">${Object.entries(routes).map(([key, href]) => `<a href="${href}"${key === (active === 'case' ? 'work' : active) ? ' aria-current="page"' : ''}>${labels[language][key]}<span aria-hidden="true">↗</span></a>`).join('')}</nav>`;
  let html = footer.replace('href="#accueil"', `href="${routes.home}"`).replaceAll('href="#accueil"', 'href="#main"');
  if (active !== 'home') html = html.replace(/<button[^>]*id="replay-intro"[\s\S]*?<\/button>/, '');
  return html.replace('<div class="footer-big"', nav + '<div class="footer-big"');
}

export function documentLinks(html, language) {
  const routes = pageRoutes[language];
  const map = { accueil: routes.home, projets: routes.work, expertises: routes.services, studio: routes.studio, contact: routes.contact, questions: routes.services + '#questions' };
  for (const [id, href] of Object.entries(map)) html = html.replaceAll(`href="#${id}"`, `href="${href}"`);
  return html.replace(/<button([^>]*data-brief-service="([^"]+)"[^>]*)>([\s\S]*?)<\/button>/g, (_, attrs, service, body) => `<a${attrs.replace(/\s+type="button"/, '')} href="${routes.contact}?service=${service}">${body}</a>`);
}

function section(source, id) {
  const expression = new RegExp(`<section\\b[^>]*${id.startsWith('.') ? `class="${id.slice(1)}[^"]*"` : `id="${id}"`}[^>]*>[\\s\\S]*?<\\/section>`);
  const found = source.match(expression);
  if (!found) throw new Error('Missing page source section: ' + id);
  return found[0];
}

function promote(html, id) {
  const expression = new RegExp(`<h2([^>]*id="${id}"[^>]*)>([\\s\\S]*?)<\\/h2>`);
  return html.replace(expression, (_, attrs, content) => `<h1${attrs.replace('class="reveal"', 'class="page-heading reveal"')}>${content}</h1>`);
}

function nextStep(language, title, body, label, href) {
  return `<section class="page-next section-pad"><div class="page-next-copy reveal"><span class="eyebrow">${text(language, 'ÉCRIVONS LA SUITE', 'LET’S WRITE WHAT’S NEXT')}</span><h2>${title}</h2><p>${body}</p></div><a class="page-next-link reveal" href="${href}"><span>${label}</span><span aria-hidden="true">↗</span></a></section>`;
}

function repositoryCards(language) {
  const ix = language === 'fr' ? 0 : 1;
  return projects.filter(p => p.repository).map(p => `<article class="project-card project-github project-${p.id} reveal" data-category="web code" data-project="${p.id}"><a class="project-open" data-project-link="${p.id}" href="__CASE_${p.id}__" aria-label="${text(language,'Explorer','Explore')} ${p.title}"><div class="project-art"><img class="repo-cover" src="${projectAsset(p)}" alt="${text(language,'Présentation éditoriale du projet','Editorial project cover for')} ${p.title}" width="1200" height="900" loading="lazy"><span class="project-badge">${text(language,'PROJET GITHUB','GITHUB PROJECT')}</span><span class="project-arrow" aria-hidden="true">↗</span><span class="project-hover-label">${text(language,'EXPLORER','EXPLORE')}</span></div><div class="project-caption"><div><h3>${p.title}</h3><p>${p.card[ix]}</p></div><span class="project-type">${p.stack.slice(0,2).join(' / ').toUpperCase()}</span></div></a><div class="project-source"><span>${text(language,'PROJET PERSONNEL','PERSONAL BUILD')}</span><a href="${p.repository}" target="_blank" rel="noopener noreferrer" aria-label="${text(language,'Voir le code de','View the source for')} ${p.title} ${text(language,'sur GitHub, nouvel onglet','on GitHub, new tab')}">${text(language,'Code sur GitHub','Code on GitHub')} <span aria-hidden="true">↗</span></a></div></article>`).join('');
}

export function mainPages(source, language) {
  const routes = pageRoutes[language];
  const work = section(source, 'projets')
    .replace('<div class="project-grid" id="project-grid">', '<div class="project-grid" id="project-grid">' + repositoryCards(language))
    .replace('<span id="work-count">04</span>', `<span id="work-count">${String(projects.length).padStart(2,'0')}</span>`);
  const hero = `<section class="hero" id="accueil" aria-labelledby="hero-heading"><div class="hero-topline"><span class="eyebrow"><i class="status-dot" aria-hidden="true"></i>${text(language,'STUDIO DIGITAL INDÉPENDANT','INDEPENDENT DIGITAL STUDIO')}</span><span class="hero-location">${text(language,'MAROC','MOROCCO')}</span></div><div class="home-layout"><div class="home-copy"><div class="hero-heading-wrap"><h1 id="hero-heading"><span class="hero-line"><span>Sites &amp; apps.</span></span><span class="hero-line"><span>${text(language,'Du caractère.','Real character.')}</span></span><span class="hero-line hero-last"><span>${text(language,'Sur mesure','Made for you')}</span><b>.</b></span></h1></div><div class="hero-bottom"><p>${text(language,'Des sites, des applications et des identités qui font la différence.','Websites, apps and identities made to stand out.')}</p><div class="hero-links"><a class="hero-project-link" href="${routes.work}"><span>${text(language,'Voir les projets','See the work')}</span><span aria-hidden="true">↗</span></a><a class="hero-project-link hero-contact-link" href="${routes.contact}"><span>${text(language,'Nous contacter','Get in touch')}</span><span aria-hidden="true">↗</span></a></div></div></div><div class="sculpture-stage" id="sculpture-stage"><canvas id="sculpture" aria-label="${text(language,'Sculpture interactive : trois formes interconnectées','Interactive sculpture: three connected forms')}" role="img"></canvas><div class="sculpture-fallback" aria-hidden="true"><img src="/assets/sculpture.png" alt="" width="1254" height="1254" fetchpriority="high" decoding="async"></div><div class="sculpture-caption"><span class="scene-index">BUILT TOGETHER / 03</span></div></div></div></section>`;
  const cta = nextStep(language, text(language, 'Votre prochaine idée.<br><em>Notre prochain projet.</em>', 'Your next idea.<br><em>Our next project.</em>'), text(language, 'Un premier échange pour découvrir ce que nous pouvons créer ensemble.', 'A first conversation to discover what we can create together.'), text(language, 'Parlons de votre projet', 'Let’s talk about your project'), routes.contact);
  const services = promote(section(source, 'expertises'), 'expertise-heading').replace('02 / ', '01 / ') + section(source, 'questions').replace('05 / ', '02 / ');
  const studio = promote(section(source, 'studio'), 'studio-heading').replace('03 / ', '01 / ') + section(source, '.process').replace('04 / ', '02 / ');
  const contact = promote(section(source, 'contact'), 'contact-heading').replace('06 / ', '01 / ');
  const all = {
    home: { main: hero, title: text(language, 'Brothers Digital — Sites & apps. Du caractère. Sur mesure.', 'Brothers Digital — Sites & apps. Real character. Made for you.'), description: text(language, 'Studio indépendant au Maroc. Sites web, applications, identités visuelles et communication digitale. Découvrez notre univers.', 'Independent Moroccan studio creating websites, applications, visual identities and digital communication. Discover our world.') },
    work: { main: promote(work, 'work-heading') + nextStep(language, text(language, 'À votre projet<br><em>de prendre forme.</em>', 'Time for your project<br><em>to take shape.</em>'), text(language, 'Vous avez une idée en tête ? Donnons-lui un caractère qui vous ressemble.', 'Have something in mind? Let’s give it a character of its own.'), text(language, 'Créer avec nous', 'Create with us'), routes.contact), title: text(language, 'Nos projets — Brothers Digital', 'Our work — Brothers Digital'), description: text(language, 'Découvrez AURA, AutoPro et nos projets de design : e-commerce React, catalogue Next.js, portfolios et identité visuelle. Code des projets disponible sur GitHub.', 'Explore AURA, AutoPro and our design projects: React e-commerce, a Next.js catalog, portfolios and visual identity. Project source available on GitHub.') },
    services: { main: services + cta, title: text(language, 'Services — Web, applications & design — Brothers Digital', 'Services — Web, applications & design — Brothers Digital'), description: text(language, 'Sites web, applications, identité visuelle, design et communication digitale. Découvrez nos expertises et essayez les démonstrations interactives.', 'Websites, applications, visual identity, design and digital communication. Explore our expertise and try the interactive previews.') },
    studio: { main: studio + cta, title: text(language, 'Le studio — Trois esprits, une vision — Brothers Digital', 'The studio — Three minds, one vision — Brothers Digital'), description: text(language, 'Trois amis réunis dans un studio digital indépendant au Maroc. Notre histoire, nos principes et notre façon de construire ensemble.', 'Three friends building an independent Moroccan digital studio. Our story, principles and the way we create together.') },
    contact: { main: contact, title: text(language, 'Contact — Parlons de votre projet — Brothers Digital', 'Contact — Let’s talk about your project — Brothers Digital'), description: text(language, 'Parlez-nous de votre site, application, identité ou communication. Envoyez votre demande ou préparez votre projet avec le brief guidé.', 'Tell us about your website, application, identity or communication. Send an enquiry or shape your idea with our guided project brief.') },
  };
  for (const value of Object.values(all)) value.main = documentLinks(value.main, language);
  return all;
}
