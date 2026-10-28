# Brothers Digital

A bilingual multi-page creative studio portfolio with custom typography, an original interlocking WebGL sculpture, editorial case studies, interactive service previews and durable project enquiries.

## Development

Requires Node 22.13 or later. Install using the Sites dependency helper. `npm run dev` generates the localized pages and starts the Vinext preview; `npm run build` generates content and builds the Cloudflare Worker. Use the supported Sites preview and publication helpers.

## Source

- `site-source/index.html`: shared content source. `page-templates.mjs` assembles distinct Home, Work, Services, Studio and Contact pages.
- `site-source/styles.css`, `v2.css`, `multipage.css`, `elevated.css`: brand system, responsive layouts, spatial art direction, active navigation and motion.
- `site-source/projects.mjs`: bilingual case-study content and provenance.
- `site-source/common.js`: shared navigation, matching-language page routes, legacy section-link forwarding, reveals and motion controls.
- `site-source/work.js`, `services.js`, `studio.js`, `contact.js`, `case.js`: page-specific portfolio layouts and filters, interactive demos, studio discipline views, enquiries and case studies. Only relevant scripts load on each page.
- `site-source/enhancements.mjs`: adds the scene atmosphere, project previews, related-work links, studio discipline views and enquiry recovery UI.
- `site-source/living.js`, `living.css`: travelling orbital light field, pointer-responsive lighting and typography, cycling hero phrases, staggered word entrances, magnetic links and restrained scroll depth. Project filters animate their new results, and repository artwork participates in native page transitions. The native pointer and regular document navigation are preserved.
- `site-source/viewer.js`: native modal image viewer with zoom, pan, fit, keyboard controls, pointer/pinch handling and focus isolation. Loads only for Work and case studies.
- `site-source/submission-state.mjs`: canonical submission signature/key logic, inlined into the contact script at build time and tested separately. Unchanged retries reuse their key; meaningful edits receive a new key.
- `site-source/sculpture.js`: custom WebGL rendering, medium-speed rotation (about 26 seconds per revolution), gentle float and pointer interaction. Rendering stops when paused, offscreen or in a background tab. Reduced motion is supported. An animated optimized image provides the fallback when WebGL is unavailable.
- `scripts/build-content.mjs`: generates 24 HTML documents, the sitemap, robots.txt and production assets. Re-run after editing presentation source.
- `app/[[...slug]]/route.ts`: serves complete HTML without a client React runtime.
- `app/api/inquiries/route.ts`, `lib/inquiries.ts`: validated enquiry submission, idempotency, same-origin checks, honeypot and per-window rate limiting.
- `db/schema.ts`, `drizzle/`: database schema and immutable migrations. Hosted migrations run through Sites publication.
- `public/assets`: optimized WebP images, local WOFF2 fonts and the approved mark as SVG. Original assets remain in `site-source/assets`.

## Routes

French pages: `/fr/`, `/fr/projets/`, `/fr/services/`, `/fr/studio/`, `/fr/contact/`. English pages: `/en/`, `/en/work/`, `/en/services/`, `/en/studio/`, `/en/contact/`. `/` serves French. The homepage is a focused visual hook: one opening scene, the moving 3D sculpture, a brief positioning line, links to Work and Contact, a clear group of headline, description and links, and compact footer preferences. The sculpture has its own desktop column and follows the message on mobile; no model control bar is displayed. Portfolio content, services and the studio story live on their dedicated pages. The complete portfolio, service demos and FAQ, studio story and process, and enquiry form each have their own pages. Portfolio filters and gallery/index views are encoded in the URL; language switching preserves both. Fullscreen previews are available from gallery cards and case-study images. Service contact links preselect the requested service using `?service=web|app|design|growth`, preserved when switching languages. Old homepage section links forward to the appropriate new page. Case studies use `/fr/projets/{aura,autopro,fieldnotes,amine,archive,identity}/` and `/en/work/{aura,autopro,fieldnotes,amine,archive,identity}/`. Each page has localized metadata, a canonical URL and alternate-language links.

## Content provenance

MoD — Field Notes is a personal portfolio; AMINE AI is an interface concept; The Sound Archive is a personal web experience; Brothers Digital is the studio identity. No clients, commercial outcomes, awards or testimonials are fabricated. Interactive examples demonstrate interface and identity choices and do not claim to be production products.

## Enquiries and owner setup

The short form stores enquiries in the Site’s `inquiries` database table. Owners can review records in the Site database viewer. The short form and guided brief recover their fields, step, result and submission identity from session storage in the same browser tab after navigation, refresh or a language change. Recovery expires after 24 hours and is cleared on confirmed delivery or the visitor’s explicit Clear draft action. No draft is sent to a server until the visitor submits it. The guided brief transfers its exact service set and timeframe into the short form. Copyable submission references and a Ctrl/Cmd+Enter shortcut are provided. The verified studio Instagram is linked for direct contact.

Email notifications are optional and remain unconfigured until the owner supplies a verified sender and business inbox. Configure secret `RESEND_API_KEY` and environment values `CONTACT_TO_EMAIL` and `CONTACT_FROM_EMAIL` to activate them. `RATE_LIMIT_SALT` is a runtime secret; no credentials belong in source. Names, addresses, message text and IP addresses are not printed to logs. Production data is not included in source or archives.

The founders’ approved names, individual roles, photos and a custom domain can be added when supplied. The current audience is preserved as public.

## Living edition

The homepage remains a single viewport hook. Its final headline phrase cycles through three localized lines; its accessible heading keeps a stable full description. The orbit field uses a small native 2D canvas capped at 30 draws per second on desktop and 20 on compact screens, with pixel density capped at 1.4. Ambient loops stop offscreen, in a background tab, or when global motion is disabled. The global motion switch and reduced-motion preference suppress the effects. No new dependencies or remote media are required.

Living edition checks: all 24 generated documents passed H1, unique-ID, asset-resolution and versioned-script checks; TypeScript and edited JavaScript syntax checks passed. Browser checks covered the 1363×936 desktop scene, 390×844 French and 360×667 English homepage frame viewports, plus the 375-pixel English services frame. Home scenes had no horizontal or vertical overflow. Global motion off/on, mobile menu/Escape, project category and index changes, preview/Escape and case-study navigation worked in the living edition. No application-script errors appeared in the browser. Cloud WebGL remained unavailable, so visual interaction checks used the image fallback and 2D orbit field; GPU rendering and physical touch were not verified.

## Validation

Production build; inquiry validation checks; all 24 generated documents checked for one H1, one main, unique IDs and resolved internal page and fragment links. Separate content, per-page scripts and portfolio counts were also checked. TypeScript checks passed. Browser QA covered French and English desktop and 390-pixel mobile layouts, responsive overflow, native project navigation, typography/identity/waveform controls, service previews, FAQ, sculpture pause, a real local enquiry and guided-brief transfer, service preselection across language switches, active navigation and links between dedicated pages. The spatial edition also verified gallery/index state across languages, fullscreen zoom and Escape/return focus, modal and mobile-menu background isolation, manual sculpture rotation with automatic motion off, draft recovery in both contact workflows, exact brief transfer, clear-on-success and copyable references. The test enquiry was verified in local D1. Cloud browser WebGL was unavailable, so browser visuals verified the image fallback; the WebGL code was syntax checked and its render lifecycle reviewed.

Optimized production assets total 714,278 bytes, down 88.62% from the original 6,274,728 bytes (including responsive variants and font fallbacks). This is an asset-size measurement, not a claim about field Core Web Vitals.

## Spatial edition verification

Homepage viewport checks: 1363×936 desktop, 390×844 French mobile and 360×667 English compact mobile had no horizontal or vertical overflow. Work, Services, Studio and Contact mobile pages were checked at 375-pixel content width. The generated 24-document route graph, unique IDs, main/H1 landmarks and non-nested preview buttons passed validation. The pure submission-identity checks cover unchanged retries, language/service-order changes and edited briefs. The native image viewer’s mouse/keyboard and mobile-button flows were exercised; physical touch gestures and GPU WebGL rendering were not available in the cloud browser. No field performance or cross-device benchmark results are claimed.

## Homepage composition and intro

The message, supporting sentence and Work/Contact actions form one aligned group. The sculpture occupies a separate grid column on desktop and a dedicated row on mobile. Model rotation, reset and pulse buttons have been removed; direct pointer/drag interaction and the footer’s global motion preference remain. The intro holds for 2.5 seconds, then exits over 0.55 seconds. Its three logo segments and words reveal in stages, with a decorative trace. Skip, keyboard bypass, replay and the session-level first-visit behavior remain available. Headline cycling and the orbit field wait for the intro to finish.

Verified: desktop 1363×936, compact desktop 1024×700, French mobile 390×844 and English mobile 360×667 had no page overflow. The text and model occupy separate regions. All home variants contain no model buttons. The intro artwork was inspected at slower QA playback, then the final 2.5s/0.55s timing was restored and checked; replay, skip and subsequent dismissal worked. The mobile motion preference and English contact CTA also worked.

## Studio disciplines in 3D

The Studio panel keeps its olive background and original line artwork for Design, Code and Strategy. Each discipline has its own actual 3D geometry: a beveled pen nib and material palette; a layered programming window with raised code symbols; and a target with a directed arrow. Existing discipline buttons switch the geometry, description and accessible canvas label. The native scene adds slow bounded movement and a small pointer response; it introduces no new model controls.

`site-source/studio-3d.js` provides a lightweight WebGL renderer and a shared-geometry Canvas 2D software renderer for browsers without WebGL. The software path projects 3D vertices, sorts surfaces and interpolates vertex lighting; it is not a flat image substitution. Rounded surfaces, materials and the preserved background remain visible without GPU support. Rendering stops offscreen or in background tabs. Global motion off and reduced-motion preferences leave a static scene that still changes when selecting a discipline. The original flat mark remains as the final no-JavaScript/no-canvas fallback. The two extra assets are scoped to Studio pages.

Verified in browser: all three scene selections, a constant rgb(163,170,145) background, no internal panel scrolling, localized canvas descriptions, keyboard selection and switching with global motion off. Desktop and 390-, 360- and 375-pixel mobile frame layouts were inspected; no horizontal overflow appeared. The original pattern remains in the DOM. No application-script errors appeared. Cloud WebGL was unavailable, so visual QA covered the complete software-rendered 3D scenes; the GPU path was syntax checked but not visually exercised.
