# Production Hardening Report

## Preserved
- Approved Astra visual design and static asset structure.
- Cloudflare Worker/Sites architecture.
- D1 persistence and immutable status-history triggers.
- Private R2 document storage.
- Platform-owned authenticated admin identity plus `ADMIN_EMAILS` allowlist.
- Five-step registration, tracking and admin workflow.

## Corrected / completed
- Removed registration renewal and legacy flag-change from customer-facing/service catalogue behavior.
- Added the five client-confirmed Polish registration service types.
- Added authoritative EUR pricing: vessel-length tier, service surcharge, usage, MMSI, priority and delivery.
- Browser-supplied prices remain ignored; submission stores the server pricing snapshot.
- Added production Resend adapter for customer submission confirmation, admin new-application alert and customer status-update email.
- Email failure is isolated from the core database/status transaction and logged server-side.
- Added production configuration documentation and secret placeholders only.
- Added service-catalogue cleanup migration.
- Updated desktop/mobile browser acceptance flow for the confirmed package options.
- Added focused pricing tests and renewal-rejection coverage.
- Updated homepage copy to state 24/7 support without changing the layout.
- Updated FAQ to describe supported ownership/modification services rather than flag change.

## Verification performed in this workspace
- `node --check` passed for worker, database/pricing, validation, email adapter, public scripts and updated tests.
- Direct server-pricing checks passed for representative client-approved totals, including €614 for 7.1–12m + MMSI + registered mail.
- Renewal service rejection verified directly.
- Source scan confirms renewal/legacy flag-change are absent from runtime public/server code.

## Verification still required in a clean/full Node environment
Dependency installation timed out in the current execution environment and left `node_modules` incomplete, so `npm run build`, Wrangler/D1 integration tests and Playwright browser tests could not be honestly re-run here after the hardening changes. Run the documented commands from a clean checkout before deployment.

## Production acceptance still required
Configure real D1/R2 bindings, admin allowlist, canonical URL and Resend secret/sender identity; deploy to a staging/provider URL; then execute `PRODUCTION.md` live acceptance before DNS cutover.
