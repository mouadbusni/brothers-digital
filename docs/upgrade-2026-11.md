# Studio website refresh — November 2026

The opening page now introduces the studio in a compact, editorial layout with a
clear statement of its work, equal-size project/contact actions, a framed 3D
sculpture, direct links into each discipline, and one featured personal project.
Detailed work, services, studio information, and enquiries retain dedicated pages.

## Changes

- Keep the ivory, graphite, sage, and olive identity, with stronger typography,
  clearer contrast, consistent controls, and more deliberate spacing.
- Preserve the intro, motion preferences, reduced-motion behavior, and the three
  Design / Code / Strategy scenes; reduce ambient canvas frame frequency.
- Open the selected service when arriving from the home page and retain the
  selection when switching between French and English.
- Improve small-screen button wrapping, touch targets, project cards, and contact
  form focus positioning below the fixed header.
- Explain the next steps on the contact page and reassure visitors that a complete
  brief is not required to start a conversation.
- Update current team descriptions to four people while retaining three disciplines.
- Add no paid service or new runtime dependency. Preserve both Sites and Cloudflare
  Pages deployment configurations and the existing enquiry backend.

## Verification

- Existing application suite: 45 tests passed.
- TypeScript check passed.
- Cloudflare Pages production build and all 6 deployment tests passed.
- Browser review covered desktop, tablet, and narrow mobile layouts (320px,
  390px, and 768px review frames), including both languages.
- Checked equal CTA dimensions and absence of horizontal document overflow in
  the inspected narrow home and studio views.
- Checked service selection across language changes, mobile navigation, and
  studio scene selection.
- Contact validation correctly rejects a brief without a selected service. The
  browser review did not submit a real enquiry; the backend is covered by the
  existing automated tests.
- Physical-device Safari and device-specific GPU behavior have not been tested.

Presentation sources live in `site-source/`; generated documents and public
assets are refreshed by `scripts/build-content.mjs`.
