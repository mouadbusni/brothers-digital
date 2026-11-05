// A compact introduction; detailed content lives on dedicated routes.
export function homePage(language, routes) {
  const t = (fr, en) => language === 'fr' ? fr : en;
  const fields = [
    ['design','01','Design',t('Identités & expériences','Identity & experiences')],
    ['web','02',t('Développement','Development'),t('Sites & applications','Websites & applications')],
    ['growth','03',t('Stratégie','Strategy'),t('Contenu & visibilité','Content & visibility')],
  ];
  return `<section class="hero" id="accueil" aria-labelledby="hero-heading">
    <div class="hero-topline">
      <span class="eyebrow"><i class="status-dot" aria-hidden="true"></i>${t('STUDIO DIGITAL INDÉPENDANT','INDEPENDENT DIGITAL STUDIO')}</span>
      <span class="hero-location">${t('BASÉS AU MAROC. SANS FRONTIÈRES.','BASED IN MOROCCO. THINKING BEYOND.')}</span>
    </div>
    <div class="home-layout">
      <div class="home-copy">
        <div class="hero-heading-wrap"><h1 id="hero-heading">
          <span class="hero-line"><span>${t('Votre vision.','Your vision.')}</span></span>
          <span class="hero-line"><span>${t('Prend forme.','Takes shape.')}</span></span>
          <span class="hero-line hero-last"><span>${t('Avec nous','With us')}</span><b>.</b></span>
        </h1></div>
        <div class="hero-bottom">
          <p>${t('Sites web, applications et identités visuelles. Le design, le code et la stratégie réunis pour faire avancer votre activité.','Websites, applications and visual identities. Design, code and strategy brought together to move your business forward.')}</p>
          <div class="hero-links">
            <a class="hero-project-link" href="${routes.work}"><span>${t('Explorer nos projets','Explore our work')}</span><span aria-hidden="true">↗</span></a>
            <a class="hero-project-link hero-contact-link" href="${routes.contact}"><span>${t('Parlons de votre idée','Let’s talk about your idea')}</span><span aria-hidden="true">↗</span></a>
          </div>
          <span class="home-signature">${t('UN STUDIO. TROIS DISCIPLINES. VOTRE PROJET.','ONE STUDIO. THREE DISCIPLINES. YOUR PROJECT.')}</span>
        </div>
      </div>
      <div class="sculpture-stage" id="sculpture-stage">
        <div class="exhibit-heading" aria-hidden="true"><span>BD / CONNECTED BY DESIGN</span><span>01 — 03</span></div>
        <div class="exhibit-word" aria-hidden="true">together.</div>
        <canvas id="sculpture" aria-label="${t('Sculpture : trois formes interconnectées représentant le design, le code et la stratégie.','Sculpture: three connected forms representing design, code and strategy.')}" role="img"></canvas>
        <div class="sculpture-fallback" aria-hidden="true"><img src="/assets/sculpture.png" alt="" width="1254" height="1254" fetchpriority="high" decoding="async"></div>
        <div class="sculpture-caption"><span class="scene-index">${t('DES IDÉES QUI PRENNENT VIE.','IDEAS, BROUGHT TO LIFE.')}</span><span class="exhibit-symbol" aria-hidden="true">✳</span></div>
      </div>
    </div>
    <div class="home-discover">
      <nav class="discipline-links" aria-label="${t('Découvrir nos disciplines','Explore our disciplines')}">
        ${fields.map(([key,index,title,detail])=>`<a href="${routes.services}?service=${key}"><span class="discipline-index">${index}</span><span><strong>${title}</strong><small>${detail}</small></span><span class="discipline-arrow" aria-hidden="true">↗</span></a>`).join('')}
      </nav>
      <a class="home-featured" href="${routes.work}aura/">
        <img src="/assets/aura-cover.svg" width="120" height="90" alt="" decoding="async">
        <span><small>${t('DANS NOTRE SÉLECTION','FROM OUR SELECTED WORK')}</small><strong>AURA — E-commerce</strong><span>${t('Projet personnel · Voir l’étude','Personal build · Explore the case')}</span></span><b aria-hidden="true">↗</b>
      </a>
    </div>
  </section>`;
}
