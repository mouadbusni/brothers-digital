# Release review — 28 October 2026

## Changes

- Enquiry insertion is idempotent under concurrent retries. A reused reference with different content returns a recoverable conflict instead of acknowledging the wrong enquiry.
- JSON bodies are read with a 32 KiB streaming limit, including requests without `Content-Length`. Valid maximum-length Unicode messages remain supported.
- A saved enquiry remains successful if optional email delivery or its status update fails.
- Validation errors identify and focus the relevant field; clearing a draft restores useful keyboard focus.
- French and English error pages return HTTP 404 with `noindex`, appropriate language, and a working route home.
- Footer links have larger touch targets; narrow-screen footer controls remain readable.
- GitHub CI now includes regression tests as well as typechecking and a production build.

## Verification

- 45 automated tests cover enquiry validation, body limits, duplicate and conflicting retries, rate limiting, notification failure, all 26 generated documents, internal links/assets, localized metadata and sitemap coverage.
- Local browser enquiry submission returned a saved confirmation using `qa@example.invalid`. No production enquiries or email messages were sent for this test.
- Checked guided-brief generation and transfer, draft restoration after reload, draft clearing, and validation focus.
- Checked mobile navigation, project filters and list view, image zoom and Escape dismissal, language switching with filters preserved, service panels and FAQs.
- Checked Studio Design, Code and Strategy selection, localized model descriptions, the retained olive background, and the global motion toggle.
- Reviewed desktop, 768px tablet and 320–360px mobile layouts. The sampled routes showed no horizontal document overflow.

## Operational setup and limits

Enquiries are stored in D1. Production has a rate-limit salt; email notification settings are not configured. To receive inbox notifications, configure `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, and a verified `CONTACT_FROM_EMAIL` through the hosting environment, then redeploy. Never commit these values.

Browser checks used cloud Chromium and responsive iframes. They do not replace physical iOS/Android or Safari checks. The cloud environment exercised the image/software rendering fallback rather than confirming hardware-accelerated WebGL on a physical device. No third-party performance score or universal compatibility claim is made.

GitHub Actions records the final production-build and typecheck result for the corresponding commit. GitHub and Sites use separate commit histories; deployment is performed through Sites, not automatically by GitHub pushes.
