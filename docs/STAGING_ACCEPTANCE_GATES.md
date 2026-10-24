# MAYF release acceptance gates — updated 24 October 2026

The integrated candidate is PR #77 in `mayf-cpu/mayf-web-app`. Use Worker `staging-acceptance-mayf`, private bucket `mayf-staging-materials`, binding `MAYF_PDF_BUCKET`. The old `mayf-staging` Worker/repository is unrelated and must remain untouched.

## Required automated checks

GitHub Actions installs dependencies and runs the production dependency audit, TypeScript, application tests, eight Firestore rules scenarios, frontend build, Worker compilation and resource preflight. A normal staging dispatch must leave payment acceptance, rollback exercise and production provisioning options off. Local Worker dry-runs are not part of this session's authorized execution path.

Read-only smoke: `node scripts/staging-http-smoke.mjs https://staging-acceptance-mayf.sachinagrawal16.workers.dev/`. It checks staging identity, closed checkout and anonymous private API denial. An optional securely supplied administrator token extends read-only checks; never print or commit tokens. Smoke success alone does not prove external service functionality.

## Acceptance evidence

See `PRODUCTION_READINESS_2026-10-22.md` for current scope and limitations, and `PAYMENT_ACCEPTANCE_2026-10-24.md` for actual sandbox settlement/refund evidence. Google authentication, real Drive/PDF import and private retrieval, typed/image AI history, browser mobile-width navigation, and an actual staging rollback have been exercised. Physical device/camera behavior and all real provider edge events have not been certified.

The owner explicitly approved the existing disposable Firebase project. The staging registry is separate. The accepted PDF has been copied into the named private production bucket with readback hash validation; this does not deploy production or enable public bucket access. Production payment credentials use a separate storage namespace from staging.

## Production promotion

Keep checkout, admin refunds, coupons and simulation false. Stripe is deferred. Before promotion, require the exact candidate CI success, truthful catalogue reads and recoverable dummy-data cleanup; configure the three missing production Worker secrets; verify production Firebase/Turnstile host configuration; then use the reviewed production workflow with recorded rollback and post-deployment smoke. Live payments require their own production credential/webhook acceptance before checkout is enabled.

Do not replace failed reads with invented successful empty state, purge archived examples, reuse sandbox payment keys in production, or report unperformed live checks as passed.
