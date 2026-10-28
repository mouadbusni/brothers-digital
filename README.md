# Brothers Digital

A bilingual portfolio for Brothers Digital, an independent studio building websites, applications and visual identities.

**[Visit the website](https://brothers-digital-studio.wisesnow.chatgpt.site)** · Français / English

## What is included

- Separate Home, Work, Services, Studio and Contact pages in French and English.
- Six case studies with project filters, gallery and list views, and accessible image previews.
- A custom WebGL homepage sculpture and three distinct Studio scenes for Design, Code and Strategy.
- Keyboard navigation, reduced-motion support, responsive layouts and local fonts.
- A guided project brief and an enquiry form backed by Cloudflare D1.
- Localized metadata, alternate-language links, sitemap and optimized image variants.

The homepage is a focused introduction. Work, services and the studio story each have their own page. Case studies identify personal work and concepts explicitly; no client outcomes or testimonials are invented.

## Stack

| Area | Implementation |
| --- | --- |
| Server and routing | Vinext, React and TypeScript |
| Presentation | Generated HTML, CSS and page-specific JavaScript |
| 3D and motion | Native WebGL and Canvas; shared-geometry software fallback on Studio |
| Hosting | Cloudflare Workers through Sites |
| Enquiry storage | Cloudflare D1, Drizzle ORM and SQL migrations |
| Package manager | npm with a committed lockfile |

Pages are served as complete HTML documents without a client React hydration layer. Interactive scripts load only where they are needed. The project includes its retained framework tooling; application presentation is authored in `site-source/`.

## Local development

Requirements: **Node.js 22.13 or later** and **npm**. `.nvmrc` selects the Node 22 release line.

```bash
npm run install:ci
npm run dev
```

A clean clone uses the portable development profile and serves at `http://localhost:5173`. The content generation step runs automatically before development and production builds.

To check and build the application:

```bash
npm run typecheck
npm run build
```

To initialize enquiry storage for the built local Worker and start it:

```bash
npm run db:local
npm start
```

`db:local` requires a completed build. It applies the initial SQL schema to the local D1 store; run it once for a new local database. The command and local server share `.wrangler/state`. All database commands above are local; production records are not part of this repository.

## Configuration

Copy `.dev.vars.example` to `.dev.vars` for local values. Keep `.dev.vars` and actual credentials out of Git.

| Setting | Purpose |
| --- | --- |
| `DB` | Cloudflare D1 binding declared in `.openai/hosting.json`; not a connection string |
| `RATE_LIMIT_SALT` | Random runtime secret used by enquiry rate limiting |
| `RESEND_API_KEY` | Optional email notification credential |
| `CONTACT_TO_EMAIL` | Optional business inbox for notifications |
| `CONTACT_FROM_EMAIL` | Optional verified sender address |

Enquiries are stored in D1 even when email notifications are disabled. Notifications require all three email settings and an approved sender. The example file contains placeholders only. Set production secrets through the hosting environment, never in source.

## Repository layout

```text
app/              HTTP routes and enquiry endpoint
site-source/      Canonical page templates, styles, scripts and original assets
public/           Static assets and generated copies of presentation files
generated/        Generated localized HTML documents
db/               Drizzle database schema
drizzle/          SQL migrations and schema metadata
scripts/          Content generation and retained framework tooling
components/       Retained UI components from the application starter
lib/              Server validation, connector support and shared utilities
docs/             Content provenance, asset review and implementation notes
.github/          Build verification workflow
```

Edit presentation in `site-source/`. Run `node scripts/build-content.mjs` to regenerate `public/` copies and `generated/pages.json`; development and build commands do this automatically. Keep the generated output consistent with its source.

## Routes

| Page | French | English |
| --- | --- | --- |
| Home | `/fr/` | `/en/` |
| Work | `/fr/projets/` | `/en/work/` |
| Services | `/fr/services/` | `/en/services/` |
| Studio | `/fr/studio/` | `/en/studio/` |
| Contact | `/fr/contact/` | `/en/contact/` |

`/` serves French. Case studies extend the Work routes with `aura`, `autopro`, `fieldnotes`, `amine`, `archive` or `identity`. Language switching preserves the corresponding page and supported filter state.

## Deployment and checks

The existing live website is published through Sites. `.openai/hosting.json` retains that Site's identity and storage bindings; it contains no login credentials. A GitHub push does not publish or change the live site automatically.

The CI workflow runs a lockfile installation, TypeScript checks and a production build on pushes to `main` and pull requests. It does not deploy or access production enquiry data. Repository CI results are available only after the workflow has run on GitHub.

The app's previous implementation and browser checks are recorded in [implementation notes](docs/implementation-notes.md), including the cloud environment's GPU and touch-testing limits. Current repository preparation results are recorded in [repository checks](docs/repository-checks.md).

## Attribution

Bundled fonts retain their [typeface license](public/assets/typeface-license.txt). Third-party components and retained tooling keep their supplied license notices in `vendor/` and `scripts/vite/`. Project provenance is recorded in `site-source/projects.mjs` and `docs/github-project-review.json`.
