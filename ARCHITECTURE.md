# Ocean registration workflow

The original landing-page stylesheet and yacht image are preserved in `public/`. The only landing-page changes are registration/tracking/admin links and connecting the existing enquiry form to a draft. New screens use the same styles plus `portal.css`.

## Architecture

- Browser: existing HTML/CSS/JavaScript, with a five-step portal. No client-side secret or database access.
- Server: an ESM Cloudflare Worker, built with esbuild. All authoritative operations run here.
- Relational database: Sites-managed Cloudflare D1 (SQLite). No Supabase/PostgreSQL project or credentials were provided. Prepared statements and transactional batches are used.
- File storage: private Supabase Storage when `SUPABASE_URL` + `SUPABASE_SECRET_KEY` are configured; otherwise a private R2 `BUCKET` binding. Storage is server-only.
- Auth: Worker-native administrator login. The submitted email must be in `ADMIN_EMAILS` and the password must match the server secret `ADMIN_PASSWORD`. Successful login receives a signed 12-hour HttpOnly `oyr_admin` cookie using `ADMIN_SESSION_SECRET`; every admin API request re-checks the allowlist and stored ADMIN role.
- Local development: a loopback-only proxy simulates SIWC, strips identity headers, and uses a random HttpOnly cookie. This simulator is not included in the Worker artifact.

## Schema

`users`, `customers`, `vessels`, `applications`, `application_documents`, `application_status_history`, `services`, `service_options`, `pricing_rules`, `notifications`, `draft_sessions`, `rate_limits`.

Applications have a private UUID and a random 60-bit public reference (`OYR-` plus twelve characters). Draft sessions store SHA-256 token hashes. Documents store type, original filename, private storage key, MIME, size, checksum and upload timestamp. Relational foreign keys link customer, vessel, service, documents and history to applications.

Status transitions are checked in the server and a database trigger. The same transaction creates history and an admin-inbox notification. Database triggers reject updates/deletes to history and mutations of submitted documents. Version checks prevent stale updates. Repeated submission of the same saved draft returns the existing reference.

## Routes

- `/`: approved landing page; registration CTA and existing enquiry form start the workflow.
- `/register`: Package → Applicant → Yacht → Documents → Review & Submit → confirmation.
- `/track`: reference plus application email; returns a deliberately restricted progress view.
- `/admin` and `/admin/login`: authenticated administration and inbox, search/filter/pagination.
- `/admin/applications/:reference`: full details, authenticated document downloads and status updates.
- `/api/admin/login`, `/api/admin/logout` and `/api/admin/me` implement the administrator session lifecycle. No third-party identity flow is required by the current source.

## API

- `GET /api/services`
- `POST /api/draft`, `GET /api/draft`, `PATCH /api/draft`
- `POST /api/draft/documents`, `DELETE /api/draft/documents/:documentId`
- `GET /api/draft/review`, `POST /api/draft/submit`
- `POST /api/track`
- `GET /api/admin/me`, `GET /api/admin/applications`
- `GET /api/admin/applications/:reference`
- `POST /api/admin/applications/:reference/status`
- `POST /api/admin/applications/:reference/read`
- `GET /api/admin/documents/:documentId`

## Validation and boundaries

Server validation covers required fields, types, lengths, numeric ranges, year bounds, service availability, explicit consent, stale versions and allowed transitions. Pricing is calculated server-side from the client-approved EUR matrix (length tier, service type, intended use, MMSI, priority and delivery) and saved as an immutable submission snapshot. Browser-supplied totals are ignored. Registration renewal is intentionally unsupported.

Uploads allow PDF, JPEG and PNG only, with matching extension/MIME/file signatures; ten files per draft, ten MB each. Requests are streamed with a bounded body limit. Private storage paths never reach public tracking or draft responses. Admin downloads are authorization checked, forced attachments, non-cacheable and sandboxed. Files are not antivirus-scanned in this milestone.

All mutating API calls require a matching Origin and custom same-origin header; draft cookies are HttpOnly, SameSite=Strict and Secure on HTTPS. Sensitive API responses are non-cacheable. Tracking and upload/submission operations are rate limited in D1. Tracking returns only reference, vessel name, service, current status and customer-visible timestamped history. Unknown references and wrong emails return the same neutral result.

## Setup and operation

`ADMIN_EMAILS` is required for administration. Production email additionally uses `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, optional `EMAIL_REPLY_TO`, and `APP_URL`. Secrets are configured server-side only. `DB` and `BUCKET` are managed bindings declared in `.openai/hosting.json`. No database, object-store or service-role credentials exist in the browser. Keep `.env` and `.dev.vars` untracked.

Use `npm run db:generate` for future schema changes. Applied migrations are immutable; append new migrations. Local testing uses the Wrangler configuration and local state; production provisioning/migrations are handled by Sites publishing.

Admin notifications are durable inbox records. When production email configuration is present, submission confirmations, new-application alerts and status-update emails are dispatched through Resend without coupling email success to the core database transaction. Supplementary customer document resubmission is not exposed after submission; an administrator can request more documents with customer-visible follow-up instructions. The public application/tracking routes are implemented, but the Site's existing owner-private hosting audience remains unchanged.
