# Redesign branch acceptance — 23 September 2026

Scope: continue the existing Worker/D1 implementation on `redesign/luxury-marine-v2`. Baseline: `e6365b803a0be8c54929613c9f71ca380b9b7e02`.

## Changes

- Removed the renewal FAQ and replaced it with a practical application checklist.
- Hide unavailable email/WhatsApp controls; display approved contact configuration when present.
- Removed setup-specific customer copy and aligned intake limits with server validation.
- Prevent an older pricing response from overwriting a newer selection or a different step.
- Clear stale tracking results before another lookup and constrain long portal content.
- Correct the 320px below-hero marine layout without touching the hero.
- Normalize admin pagination and align pricing with the supported minimum vessel length.
- Prevent concurrent submissions from sending duplicate customer/admin notifications.
- Added a disposable D1/R2 browser acceptance environment and branch-only GitHub QA workflow. Neither deploys nor writes to production.
- Corrected setup instructions to apply all migrations, including reviews.

## Verification

`npm test`: 14 passing tests covering pricing, private storage, validation, persisted registration, admin authentication, tracking privacy, optimistic concurrency, immutable status history, upload limits, rate limiting, intake resume, review moderation, pagination, email adapter behavior and concurrent submission.

Email-provider tests use a mock. No real customer or administrator emails were sent.

The cinematic hero markup, complete existing `public/style.css`, poster and video match the approved baseline byte-for-byte. The automated preservation test remains part of the suite.

Browser acceptance passed at 1440px (desktop), 768px (tablet), 390px (mobile), and 320px (small mobile), with no JavaScript page errors or horizontal page overflow in the checked homepage, review, admin and tracking screens. The 320px marine section and portal header defects found during QA were fixed and retested.

Browser acceptance uses the built production Worker with fresh local D1/R2 bindings. It covers public-page layout, all five registration steps, upload, review, submission, authenticated private download, admin status change, tracking, wrong-email lookup and logout. Screenshots and machine-readable results are generated under ignored `work/qa/`.

## Remaining release gates

This is local acceptance, not production certification. Before launch, verify the same flows against an isolated deployed environment with actual storage and email credentials. Verify receipt of submission and status-update emails, private storage permissions, administrator access and final canonical domain configuration.

The repository's existing requirements still identify client-supplied contact details and dealer pricing/access policy as pending. No business facts, testimonials or dealer discounts were invented. References retain the existing `OYR-` format used throughout the implementation.

Production/main have not been modified or deployed. A production cutover requires the owner's approval.
