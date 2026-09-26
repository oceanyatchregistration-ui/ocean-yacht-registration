# Ocean Yacht Registration — Production Checklist

The application is designed for Cloudflare Workers with D1. Private document storage can use Supabase Storage (current production-oriented configuration) or a private R2 `BUCKET` fallback. Do not put service credentials in browser code or committed files.

## Required platform bindings

- `DB`: production D1 database. Apply all SQL files in `drizzle/` in numeric order.
- `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_STORAGE_BUCKET`: preferred private Supabase Storage configuration. Keep the secret key in platform secrets.
- `BUCKET`: optional private R2 fallback. Public bucket access must remain disabled.
- `ASSETS`: static public assets binding.

## Required configuration

- `ADMIN_EMAILS`: comma-separated administrator allowlist.
- `ADMIN_PASSWORD`: secret administrator password, minimum 16 characters.
- `ADMIN_SESSION_SECRET`: secret HMAC signing key, minimum 32 characters.
- `APP_URL`: canonical HTTPS origin, ultimately `https://oceanyachtregistration.com`.
- `EMAIL_FROM_ADDRESS`: sender identity verified with the transactional email provider.
- `EMAIL_REPLY_TO`: optional monitored business reply address.
- `RESEND_API_KEY`: secret; store only in the hosting platform's encrypted secret configuration.
- `PUBLIC_CONTACT_EMAIL`, `PUBLIC_WHATSAPP`, `PUBLIC_BUSINESS_ADDRESS`: approved public business contact details; leave blank until confirmed by the client.

The application remains functional if email delivery is temporarily unavailable, but production acceptance is incomplete until a real submission and status change both deliver successfully.

## Pre-deployment

1. Run `npm ci` from a clean checkout.
2. Run `npm run build`.
3. Run `npm test`.
4. Run `npm run test:e2e:isolated` for disposable desktop, tablet and mobile browser acceptance. See `QA_REPORT.md` for the latest local evidence.
5. Confirm there are no real `.env`, `.dev.vars`, API keys or customer documents in the repository/archive.
6. Confirm the production service catalogue contains no registration-renewal or legacy flag-change entry.
7. Confirm the pricing matrix with the client before changing any values.

## Live acceptance gate

Do not call the service production-ready until all of the following pass against the deployed environment:

1. Open the public site over HTTPS.
2. Complete the five-step registration using a real test mailbox.
3. Upload a harmless PDF and confirm it is not publicly addressable.
4. Submit and receive the configured customer application reference. Before final release, confirm the client's requested short `C…PL` format and update the generator/routes/tests together; do not deploy an assumed format.
5. Receive the customer confirmation email and administrator alert.
6. Sign in as an allowlisted administrator and find the application.
7. Download the private test document from the authenticated admin route.
8. Change status and confirm immutable history is created.
9. Receive the customer status-update email.
10. Track using reference + matching email and confirm only customer-safe data is returned.
11. Verify wrong email and unknown reference return the same neutral response.
12. Remove the test application/document according to the confirmed business retention procedure after acceptance. Do not automate the discussed ~10-day deletion until the client confirms the clock trigger and whether deletion covers documents only or broader application/customer data.

## Domain cutover

Only point `oceanyachtregistration.com` to the deployment after the live acceptance gate passes on the provider URL/staging hostname. Configure the final domain first in `APP_URL`, verify HTTPS, then repeat submission/email/tracking once after cutover.

## Administrator authentication

The production admin portal uses a Worker-native signed session. Configure `ADMIN_EMAILS` as the allowlist and store both `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` as Cloudflare Worker secrets. `ADMIN_PASSWORD` must be at least 16 characters. `ADMIN_SESSION_SECRET` must be at least 32 characters and should be randomly generated. Never commit either value. Admin sessions are HttpOnly, SameSite=Strict, Secure on HTTPS, and expire after 12 hours.

```bash
npx wrangler secret put ADMIN_PASSWORD --config wrangler.production.jsonc
npx wrangler secret put ADMIN_SESSION_SECRET --config wrangler.production.jsonc
```

Do not place either secret in `wrangler.production.jsonc`, GitHub, screenshots, chat, or documentation.
