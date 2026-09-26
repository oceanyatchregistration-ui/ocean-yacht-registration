# Ocean Yacht Registration — Handover Acceptance Criteria

No gate is considered passed solely because code exists. Production-sensitive gates require deployed verification.

- [ ] Public website matches the latest client-approved brand/content direction.
- [ ] Six confirmed retail services are represented consistently across public site, registration, backend and admin.
- [ ] Retail registration completes end to end.
- [ ] Partner/dealer registration completes end to end with isolated partner pricing.
- [ ] Server-authoritative retail and partner pricing are tested and snapshotted at submission.
- [ ] Applicant and vessel data, including length, beam, draft and place of build, persist correctly.
- [ ] Current-flag field is absent from new customer registration.
- [ ] Private document upload and authenticated admin download work in production.
- [ ] Application submission is idempotent and generates the client-approved short C…PL reference.
- [ ] Customer confirmation email is received from the approved production sender with correct application details.
- [ ] Administrator new-application notification is received at the approved production address.
- [ ] Tracking works with reference + matching application email and leaks no private/admin-only data.
- [ ] Admin authentication, application list/detail, document download, status updates/history, pagination and logout pass production smoke tests.
- [ ] Review submission/moderation/publication behavior is correct and contains no fabricated reviews.
- [ ] Responsive QA passes at 1440, 1024, 768, 390 and 320 px without blocking overflow or unusable controls.
- [ ] Keyboard/focus/labels/menu state/reduced-motion/error/loading accessibility checks pass.
- [ ] Security/privacy checks pass for admin authorization, tracking enumeration, private documents, uploads, cookies, secrets and input validation.
- [ ] Agreed retention/deletion workflow is implemented and tested after the client confirms trigger and scope.
- [ ] Production domain, HTTPS, canonical URL, email DNS/sender and contact information are configured from client-provided values.
- [ ] Automated unit/integration/E2E tests pass on the release commit.
- [ ] A harmless full production smoke application passes submission → emails → admin → private download → status update → tracking.
- [ ] Production documentation and client admin/handover guide are complete.
- [ ] Client reviews the final preview and approves release before main/production handover.
