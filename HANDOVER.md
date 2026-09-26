# Production handover

## Canonical hosts

- `https://oceanyatchregistration.com` — existing live website; **do not attach the new Worker until final cutover**
- `https://register.oceanyatchregistration.com` — registration application
- `https://track.oceanyatchregistration.com` — customer tracking
- `https://admin.oceanyatchregistration.com` — administration
- `https://staging.oceanyatchregistration.com` — isolated staging deployment (separate Worker/data resources)

During the pre-cutover phase, the production Worker is attached only to `register`, `track`, and `admin`. The root domain and `www` remain on the existing live website until explicit final-cutover approval.

## Production deployment

Production configuration: `wrangler.production.jsonc`.

Before first live deployment, configure these secrets in Cloudflare without committing their values:

- `ADMIN_PASSWORD` — at least 16 characters
- `ADMIN_SESSION_SECRET` — at least 32 random characters
- `RESEND_API_KEY`
- `EMAIL_FROM_ADDRESS`
- storage credentials required by the selected private storage adapter (Supabase or R2)

Set the public contact variables used by the marketing site:

- `PUBLIC_CONTACT_EMAIL`
- `PUBLIC_WHATSAPP`
- `PUBLIC_BUSINESS_ADDRESS`

Apply production D1 migrations deliberately before deploying a schema-dependent release. Do not run migrations automatically on every frontend build.

Deploy:

```sh
npm ci
npm run build
npm test
npx wrangler deploy --config wrangler.production.jsonc
```

After deployment, verify `/health` on `register`, `track`, and `admin`, confirm the root domain still serves the existing live website, complete one controlled registration in a controlled acceptance test, verify private document upload/download, verify tracking with the submitted reference/email, verify admin login/status update, and verify transactional email delivery.

## Staging isolation

Do not bind `staging.oceanyatchregistration.com` to the production D1 database or production document bucket.

Provision separate resources:

```sh
npx wrangler d1 create ocean-yacht-registration-staging
npx wrangler r2 bucket create ocean-yacht-registration-staging-documents
```

Create a separate staging Worker/config using the returned D1 database ID, bind only the staging hostname, and use staging-only secrets. Protect the staging hostname with Cloudflare Access and add `noindex` behavior before exposing it.

## Security model

Registration and admin session cookies are host-only and HttpOnly. The registration cookie therefore stays on the registration hostname and the administrator cookie stays on the admin hostname. Admin API routes are not exposed through the public hostname. Customer documents remain private and are downloaded through authenticated admin endpoints.

## Release gate

The repository includes `.github/workflows/main-qa.yml`, which performs a build, backend test suite and isolated browser acceptance suite on `main`. It does not deploy.

A release is handover-ready only after:
1. the quality gate passes,
2. production secrets/contact values are configured,
3. D1 migrations are applied,
4. the Worker is deployed to the canonical hosts,
5. the live registration, tracking, admin, private-document and email acceptance checks pass.
