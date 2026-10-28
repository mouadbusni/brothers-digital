import fs from 'node:fs';
const root = new URL('../', import.meta.url);
const path = name => new URL(name, root);
let html = fs.readFileSync(path('site-source/index.html'), 'utf8');
const fragments = fs.readFileSync(path('site-source/upgrade-sections.html'), 'utf8');
const fragment = key => fragments.split(`<!-- ${key} -->`)[1].split(`<!-- END ${key} -->`)[0].trim();
function replaceElement(input, pattern, value) {
  const m = pattern.exec(input); if (!m) throw new Error('Element not found: '+pattern);
  const tag = /^<([a-z0-9]+)/i.exec(m[0])[1];
  const scan = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi'); scan.lastIndex=m.index;
  let depth=0, hit;
  while ((hit=scan.exec(input))) {
    depth += hit[1] ? -1 : 1;
    if(depth===0)return input.slice(0,m.index)+value+input.slice(scan.lastIndex);
  }
  throw new Error('Unbalanced element '+tag);
}
html=replaceElement(html,/<h1\b[^>]*id="hero-heading"[^>]*>/,`<h1 id="hero-heading"><span class="hero-line"><span data-fr="Sites & apps." data-en="Sites & apps.">Sites & apps.</span></span><span class="hero-line"><span data-fr="Du caractère." data-en="Real character.">Du caractère.</span></span><span class="hero-line hero-last"><span data-fr="Sur mesure" data-en="Made for you">Sur mesure</span><b>.</b></span></h1>`);
html=replaceElement(html,/<div\b[^>]*class="hero-bottom"[^>]*>/,`<div class="hero-bottom"><p data-fr="Du premier croquis à la mise en ligne, nous créons des sites, des applications et des identités pensés pour votre activité." data-en="From the first sketch to launch, we build websites, applications and identities around your business.">Du premier croquis à la mise en ligne, nous créons des sites, des applications et des identités pensés pour votre activité.</p><div class="hero-links"><a class="hero-project-link" href="#projets"><span data-fr="Voir les projets" data-en="See the work">Voir les projets</span><span>↘</span></a><a class="hero-contact-link" href="#contact" data-fr="Parlons de votre idée ↗" data-en="Let’s talk about your idea ↗">Parlons de votre idée ↗</a></div><a class="scroll-hint" href="#projets"><span data-fr="DÉFILER POUR DÉCOUVRIR" data-en="SCROLL TO EXPLORE">DÉFILER POUR DÉCOUVRIR</span><span class="scroll-hint-line"></span></a></div>`);
html=replaceElement(html,/<div\b[^>]*class="sculpture-caption"[^>]*>/,`<div class="sculpture-caption"><span class="crosshair">+</span><span>BUILT TOGETHER / 3D</span><button id="hero-pause" type="button" aria-pressed="false" aria-label="Mettre la scène en pause" data-aria-fr="Mettre la scène en pause" data-aria-en="Pause the scene"><span data-fr="Pause" data-en="Pause">Pause</span><span aria-hidden="true">Ⅱ</span></button></div>`);
html=replaceElement(html,/<div\b[^>]*id="intro"[^>]*>/,`<div class="intro intro-v2" id="intro" hidden><div class="intro-top"><span>brothers digital.</span><button id="skip-intro" type="button" data-fr="Entrer ↗" data-en="Enter ↗">Entrer ↗</button></div><div class="intro-center"><div class="intro-assembly" aria-hidden="true"><span data-logo></span><span data-logo></span><span data-logo></span></div><div class="intro-words"><span>Design.</span><span>Development.</span><span>Growth.</span></div></div><div class="intro-bottom"><span data-fr="Trois esprits. Une vision." data-en="Three minds. One vision.">Trois esprits. Une vision.</span><span>BUILT TOGETHER.</span></div></div>`);
html=replaceElement(html,/<div\b[^>]*id="expertise-object"[^>]*>/,fragment('DEMO'));
html=html.replace(/<dialog\b[\s\S]*?<\/dialog>/,'');
html=html.replace('<section class="contact section-pad"',fragment('FAQ')+'\n<section class="contact section-pad"');
html=html.replace('05 / <span data-fr="LA SUITE','06 / <span data-fr="LA SUITE');
const oldBrief = (()=>{const m=/<div\b[^>]*id="brief-builder"[^>]*>/.exec(html);const tail=html.slice(m.index);return tail.slice(0,tail.length-replaceElement(tail,/^<div\b[^>]*>/,'').length);})();
html=replaceElement(html,/<div\b[^>]*id="brief-builder"[^>]*>/,`<div class="contact-form-column">${fragment('ENQUIRY')}<details class="brief-assist"><summary><span data-fr="Besoin d’aide pour préciser votre projet ?" data-en="Need help shaping your project?">Besoin d’aide pour préciser votre projet ?</span><span>+</span></summary>${oldBrief}</details></div>`);
html=html.replace('<p class="brief-privacy"','<p class="brief-privacy"');
html=html.replace('<div class="brief-extra-actions">','<button type="button" class="use-brief-button button-dark" id="use-brief"><span data-fr="Utiliser ce brief dans ma demande" data-en="Use this brief in my enquiry">Utiliser ce brief dans ma demande</span><span>↗</span></button><div class="brief-extra-actions">');
html=html.replace(/<button class="project-open" data-open-project="([^"]+)" type="button"/g,'<a class="project-open" data-project-link="$1" href="__CASE_$1__"');
html=html.replace(/<\/button><\/article>/g,'</a></article>');
html=html.replace('brothers digital.</small>','brothers digital.</small>');
html=html.replace('</div><div class="studio-art reveal">','<div class="studio-direct reveal"><span class="status-dot"></span><span data-fr="Une équipe indépendante. Des échanges directs." data-en="An independent team. A direct conversation.">Une équipe indépendante. Des échanges directs.</span></div></div><div class="studio-art reveal">');
html=html.replace(/<link rel="preload" as="font"[^>]+>/,'<link rel="preload" as="font" href="/assets/studio-bold.woff2" type="font/woff2" crossorigin>');
html=html.replace('type="image/png" href="assets/brand-mark.png"','type="image/svg+xml" href="/assets/favicon.svg"');
html=html.replace(/<script defer src="sculpture.js"><\/script>\s*<script defer src="app.js"><\/script>/,'<script defer src="/common.js"></script><script defer src="/sculpture.js"></script><script defer src="/app.js"></script>');
html=html.replace('href="styles.css"','href="/styles.css"><link rel="stylesheet" href="/v2.css"');
html=html.replaceAll('src="assets/','src="/assets/');
html=html.replace(/class="hero-line hero-last"/g,'class="hero-line hero-last"');
fs.writeFileSync(path('site-source/index.html'),html);
