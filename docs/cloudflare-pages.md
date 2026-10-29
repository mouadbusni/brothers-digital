# Cloudflare Pages deployment

This repository supports its existing Sites deployment and a separate Cloudflare Pages deployment. `npm run build` remains the Sites Worker build. `npm run build:pages` exports the same complete HTML, styles, images and scripts, plus a small Pages Worker that uses the existing tested enquiry handler.

## Dashboard settings

Connect the GitHub repository `mouadbusni/brothers-digital` as a **Pages** project:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | None |
| Build command | `npm run build:pages` |
| Build output directory | `dist-pages` |
| Root directory | Repository root |
| `NODE_VERSION` | `22` |
| `SITE_ORIGIN` | The assigned production HTTPS origin, e.g. `https://brothers-digital.pages.dev` |

The example project name is not a reservation. If Cloudflare assigns another name, use that exact address for `SITE_ORIGIN`. This value controls canonical URLs, language alternates, social metadata and the sitemap; omit any path or trailing query. Keep the production origin for preview builds too.

The HTML and assets use static delivery. Only enquiry requests and localized missing pages invoke the Worker. Pages Functions and D1 remain subject to the account's free-plan limits.

## Enquiry database

1. Create a Cloudflare D1 database for this deployment, such as `brothers-digital-inquiries`.
2. Apply `drizzle/0000_reflective_veda.sql` to this **new** database once. Do not run a destructive reset on an existing database.
3. In the Pages project, add a production D1 binding named exactly **DB** and select that database.
4. Add a new random **RATE_LIMIT_SALT** as an encrypted runtime secret.
5. Redeploy after the bindings and secrets have been saved.
6. Verify a clearly labeled test enquiry reaches the database before sharing the new URL.

Do not connect preview builds to the production database. Use a separate preview database, or leave it unbound; an unbound enquiry endpoint returns an explicit unavailable response and never claims to have saved a message.

Existing enquiry records remain with the original Sites deployment. This setup creates separate storage in the owner's Cloudflare account; it does not export, transfer, or delete previous records.

Optional inbox notifications require `RESEND_API_KEY`, `CONTACT_TO_EMAIL` and a verified `CONTACT_FROM_EMAIL`. Never put runtime credentials in this repository.

## Local verification

```bash
npm run install:ci
npm test
npm run typecheck
SITE_ORIGIN=https://build-check.pages.dev npm run build:pages
npm run test:pages
```

The Pages checks exercise the compiled Worker, localized 404 responses, API method/origin protection, routing exclusions and exported metadata. The main enquiry regression suite covers persistence, duplicate retries and failure handling. GitHub CI runs both build targets.

## Deployment boundaries

The `dist-pages` directory is generated and ignored by Git. Upload through the Git integration or Wrangler; dashboard drag-and-drop alone is not the deployment path for the Worker and D1 setup.

This is an additional deployment target. It leaves the existing Site identity, code path and live address in place. Future changes should continue to preserve both targets until the owner explicitly retires one.
