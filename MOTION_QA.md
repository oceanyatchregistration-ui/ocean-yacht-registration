# GSAP and Higgsfield enhancement — 23 September 2026

Base: `49c3190912bdcbadc0df01f32d982b8fc0c84cd0` on `redesign/luxury-marine-v2`.

## Delivered

- Locally bundled GSAP + ScrollTrigger with explicit plugin registration.
- Below-hero editorial reveals, staggered services/pricing, process progress and desktop image parallax.
- Service, CTA and FAQ interaction details; native scrolling retained.
- Reduced-motion and no-JavaScript fallbacks, keyboard focus visibility and page lifecycle cleanup.
- Original Higgsfield yacht image, optimized to a self-hosted 1344 × 752 WebP (~124 KB).
- Development, acceptance and production static bindings use the built `dist/client` assets.

## Verification

- `npm test`: 14/14 passed.
- `npm run test:e2e:isolated`: registration, private upload/download, admin status update, tracking, wrong-email rejection and logout passed at 1440, 768, 390 and 320 px. No page errors.
- Motion browser suite: reveals, local image, service selection, FAQ, reduced-motion toggle, no-JavaScript content visibility and horizontal-overflow checks passed at all four widths.
- Desktop and small-mobile section screenshots inspected; mobile caption alignment refined.
- Byte comparisons against the base commit confirm hero markup, shared `style.css`, `app.js` playlist, poster and every MP4 are unchanged.
- Chromium supplied through an isolated scratch installation because Playwright's browser download failed in this environment. No browser workaround dependencies are included in the repository.

No production deployment, main-branch modification, or live customer data changes were performed. Real-provider email and deployed-environment acceptance remain the existing production gates in `PRODUCTION.md`.
