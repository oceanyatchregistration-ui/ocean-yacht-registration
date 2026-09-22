# Ocean Yacht Registration — local source snapshot

This archive contains the current Ocean project, including the approved website and the registration/backend implementation in progress.

Status: production-hardening branch. Core registration, private documents, tracking, administration, client-approved pricing, status history and transactional-email integration are implemented. Live production still requires hosting bindings/secrets, deployment, and real-provider acceptance testing.

## Run locally

Install Node.js 22 or newer with npm. Extract this ZIP, open a terminal in the extracted `ocean-yacht-registration` folder, then run:

```sh
npm ci
node --import ./scripts/local-env.mjs node_modules/wrangler/bin/wrangler.js d1 execute DB --local --persist-to .wrangler/state --file drizzle/0000_medical_glorian.sql
node --import ./scripts/local-env.mjs node_modules/wrangler/bin/wrangler.js d1 execute DB --local --persist-to .wrangler/state --file drizzle/0001_workflow_guards.sql
node --import ./scripts/local-env.mjs node_modules/wrangler/bin/wrangler.js d1 execute DB --local --persist-to .wrangler/state --file drizzle/0002_service_catalog_cleanup.sql
npm run dev
```

The migration commands initialise a NEW local database and apply workflow/service guards. Run them once for a fresh extraction, not every time you start the project.

Open http://localhost:5173 in your browser. Stop the server with Ctrl+C. If ports 5173 or 8788 are already occupied by another copy of this project, stop that copy first.

- Website: `/`
- Registration: `/register`
- Tracking: `/track`
- Administration: `/admin`

Local admin sign-in is simulated by the loopback development proxy. The local application database and private uploads live in `.wrangler/state` and survive a restart. This ZIP excludes live application data, uploaded customer documents, local test data, credentials, dependency folders and Git history.

Production uses Cloudflare Workers and D1. Private document storage uses Supabase Storage when configured and falls back to a private R2 `BUCKET` binding. Administration uses a Worker-native email/password gate plus signed 12-hour HttpOnly sessions; `ADMIN_EMAILS` is the administrator allowlist. Password/session secrets and storage/email credentials belong only in hosting-platform secret configuration.

## Build and tests

```sh
npm run build
npm test
```

For the scripted browser acceptance test, keep `npm run dev` running in another terminal:

```sh
node --import ./scripts/local-env.mjs node_modules/playwright/cli.js install chromium
npm run test:e2e
```

Some sandboxed environments block launching Chromium. That occurred during development, and browser acceptance testing remains pending.

## Project layout

- `public/`: website, approved stylesheet, yacht image and registration/admin/tracking UI
- `server/`: server-side APIs, validation and database helpers
- `db/`: relational schema
- `drizzle/`: database migrations
- `scripts/`: build and local development tools
- `tests/`: integration/security and browser workflow tests
- `ARCHITECTURE.md`: architecture, endpoints, storage and authorization details

The client-approved EUR pricing matrix is calculated authoritatively on the server from vessel length, service type, usage, MMSI, processing priority and delivery choice; the final snapshot is persisted at submission. Admin inbox notifications remain durable. Transactional email uses Resend when `RESEND_API_KEY` and `EMAIL_FROM_ADDRESS` are configured; delivery failures are logged and do not roll back application/status transactions.
