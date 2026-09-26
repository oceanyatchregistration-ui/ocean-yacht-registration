# Ocean Yacht Registration — Handover Gap Audit

**Audited baseline:** redesign/luxury-marine-v2 @ 21fb8d8e0619f9cc544b62709c310abe448d418d  
**Audit date:** 26 September 2026

## P0 — blocks client handover

- **Sixth service — BLOCKED BY CLIENT INPUT.** Runtime catalogue currently has five services. The latest call requires six but does not name the additional service in the supplied transcript.
- **Short C…PL reference — BLOCKED BY FORMAT CONFIRMATION.** Current generator and admin route patterns use OYR- plus 12 characters. The call clearly requests no more than roughly seven characters beginning C and ending PL, but the exact numeric rule is ambiguous.
- **Partner/dealer flow — MISSING.** No partner route, pricing context, source marker or partner-specific pricing exists. Confirmed partner prices are €280 registration under 24 m and €300 ownership change, with no €15/€50 delivery fee.
- **Production business identity — BLOCKED BY CLIENT INPUT.** Final domain, official email, new phone/contact details, address and promised boat/logo references are outstanding.
- **Production email acceptance — PARTIAL.** Resend adapter and detailed customer/admin templates exist, but final sender/domain configuration and real delivery must be verified.
- **Retention automation — BLOCKED BY CLIENT INPUT.** Storage deletion primitives exist, but the 10-day clock trigger and deletion scope are not defined.

## P1 — required before production

- Vessel beam, draft and place-of-build are missing from schema/UI/API/admin.
- Customer-facing current-flag collection must be removed; the historical database column can remain for backward compatibility.
- Public Administration links must be removed from customer-facing footers.
- Hero copy must match the latest client wording while the video subsystem remains unchanged.
- Visual palette needs a controlled final pass toward the client-requested darker/navy blue + white + restrained grey; avoid another broad override layer.
- Partner/retail pricing must be server-authoritative and isolated.
- Upload timeout, pricing-preview failure state, tracking/review error states, menu aria state, reduced-motion scrolling and focus behavior require verification/hardening.
- Privacy/terms/retention disclosure and production metadata need final approved content/configuration.

## Already strong / preserve

- Cloudflare Worker + D1 architecture and deployment configuration.
- Five-step draft registration flow with optimistic version protection.
- Server-authoritative retail pricing and submission price snapshot.
- Private storage abstraction with Supabase or R2 fallback.
- PDF/JPEG/PNG signature/type/size validation and ten-file cap.
- Authenticated administrator document downloads.
- Signed HttpOnly admin sessions with allowlist and password/session-secret requirements.
- Status transition validation and immutable status-history protections.
- Privacy-preserving tracking by reference + email.
- Moderated reviews with approved-only public rendering.
- Duplicate submission protection and email concurrency test coverage.
- Existing responsive E2E coverage at desktop/tablet/mobile/small-mobile.
- Protected cinematic hero video subsystem and regression test.

## Implementation order

1. Confirmed client-call field/content cleanup.
2. Sixth-service and short-reference changes immediately after client-format/service confirmation.
3. Partner/dealer route, isolated pricing context and source visibility.
4. Registration/admin/tracking/email hardening and known UX failure states.
5. Retention workflow after trigger/scope confirmation.
6. Final navy/white/grey visual/content pass and logo asset integration.
7. Full automated + responsive + security QA.
8. Configure client domain/contact/email values and run deployed acceptance.
9. Client review, approved corrections, release and handover documentation.
