# Ocean Yacht Registration — Client Alignment Implementation Status

## Implemented in this package

- Polish-only public positioning; removed international flag/jurisdiction marketing.
- Five distinct Polish service blocks: new registration, ownership transfer, modification, deletion certificate and duplicate registration.
- White/blue visual system retained and expanded with stronger hierarchy, service cards, pricing, process, FAQ and marine sections.
- Lightweight yacht/marine motion added with `prefers-reduced-motion` accessibility support.
- Responsive mobile navigation added.
- Homepage vessel length aligned to the server-supported 1–24 m range.
- Existing-draft homepage intake now updates the draft instead of silently discarding the newly entered enquiry.
- Server-authoritative live pricing preview added to registration package edits.
- Submission confirmation no longer falsely claims that no email was sent.
- Submission email expanded with applicant, vessel, service, status, total, pricing breakdown, document count, submission time and tracking/admin links.
- Moderated client reviews implemented: public submission, pending-by-default storage, admin approve/reject/delete, and approved-review rendering.
- Floating email/WhatsApp controls implemented and driven by public environment configuration. They remain hidden/non-direct until approved client contact values are configured.
- No testimonials, business statistics, addresses, phone numbers, email addresses or guarantees were fabricated or copied from Felix Yacht.

## Intentionally pending client-supplied business data

These cannot be completed truthfully without the client:

1. Final business email, WhatsApp/phone and address (`PUBLIC_CONTACT_EMAIL`, `PUBLIC_WHATSAPP`, `PUBLIC_BUSINESS_ADDRESS`).
2. Real customer testimonials/reviews. The moderation system is implemented; content is not invented.
3. Dealer price list and the approved dealer access/authentication model. Dealer discounts are not exposed or guessed. The existing retail price book remains authoritative until these are supplied.
4. Any Ocean-specific years-of-experience, registration-count, approval-rate or legal-guarantee claims.

## Deployment gate

Before production cutover: apply all D1 migrations including `0003_reviews.sql`, configure secrets/environment variables, build, run automated tests, submit one harmless end-to-end application, verify customer/admin email delivery, verify private document upload/download, status updates, tracking, review moderation and mobile behavior.
