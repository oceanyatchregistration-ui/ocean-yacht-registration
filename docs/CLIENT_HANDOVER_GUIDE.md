# Ocean Yacht Registration — Client Handover Guide

## System overview

Ocean Yacht Registration is a Cloudflare Worker application backed by D1 with private document storage, a public site, five-step customer registration, application tracking, administrator operations, moderated reviews and transactional email integration.

The customer flow is: package and server-calculated options → applicant and vessel information → private documents → review and consent → submission → staff review → customer tracking.

## Administrator operations

Open /admin on the production domain. Access requires an email in the ADMIN_EMAILS allowlist and the production administrator password. Sessions are signed, HttpOnly, SameSite=Strict and time-limited.

Staff can search/filter applications, inspect applicant/vessel/package/pricing details, securely download documents, view status history, update allowed statuses and moderate reviews.

Do not share administrator credentials with customers. Do not expose storage object URLs; documents are intentionally downloaded through authenticated routes.

## Application and document handling

Uploaded documents are private. The intended operational process is to review/download them from the admin portal and archive the required business copy in Dropbox.

A roughly ten-day website deletion period was discussed, but destructive automation is intentionally not enabled until the client confirms:
- whether the clock starts at submission, completion or staff archive confirmation;
- whether only uploaded documents are deleted or customer/application data as well;
- what minimum operational/audit record must remain.

## Production configuration

Hosting secrets and client-owned values belong in Cloudflare, never Git:

- ADMIN_EMAILS
- ADMIN_PASSWORD
- ADMIN_SESSION_SECRET
- APP_URL
- RESEND_API_KEY
- EMAIL_FROM_ADDRESS
- EMAIL_REPLY_TO
- PUBLIC_CONTACT_EMAIL
- PUBLIC_WHATSAPP
- PUBLIC_BUSINESS_ADDRESS
- private storage credentials/bindings described in PRODUCTION.md

Apply pending D1 migrations before accepting traffic. Migration 0004_vessel_dimensions.sql adds beam, draft and place-of-build support.

## Email

An application remains stored if the email provider is temporarily unavailable. Production acceptance nevertheless requires real mailbox testing for customer submission confirmation, administrator new-application notification and customer status-update notification.

Configure SPF/DKIM/DMARC at the final sending domain according to the selected provider.

## Tracking and reviews

Customers use /track with application reference plus application email. Wrong-email and unknown-reference attempts intentionally return the same neutral result.

Reviews enter moderation and are not publicly displayed until approved. Do not seed fabricated reviews.

## Backup and recovery

D1 and private document storage are separate data systems. Use provider-supported backup/export procedures for the production account. The Git repository is not a backup of customer data or uploaded documents.

## Client inputs still required before final production acceptance

- Exact sixth service name/details and any price effect.
- Exact short reference rule beginning with C and ending with PL.
- Exact retention trigger/scope for the discussed roughly ten-day deletion.
- Final domain/DNS access.
- Official sender/admin/reply-to email addresses.
- New public phone/WhatsApp, business address and approved contact details.
- Final boat/logo reference assets.

These are deliberately not guessed.

## Release rule

main and production remain untouched until explicit owner approval. Complete docs/ACCEPTANCE_CRITERIA.md on the final redesign-branch release commit, verify the branch preview, then obtain owner/client approval before production cutover.
