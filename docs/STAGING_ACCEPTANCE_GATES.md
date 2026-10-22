# MAYF staging release acceptance gates

## Automated CI gates

Run `npm ci && npm run lint && npm test && npm run build && npm run test:worker`.
The `staging-release-gates.test.ts` guards the critical code wiring. Passing these checks does **not** establish that external services or browser workflows work.

## Read-only preview smoke check

After deploying the **integrated draft stack to an isolated preview Worker**, run:

`node scripts/staging-http-smoke.mjs https://YOUR-PREVIEW.workers.dev`

This performs live GET checks that the Worker environment is actually `staging` and for backend health and anonymous denial on Admin verification, storage readiness, import jobs and legacy migration audit. To additionally check authenticated Admin access and staging configuration presence, set the environment variable `MAYF_STAGING_ADMIN_TOKEN` securely in your shell/CI secrets before running the same command. Never commit or print this token. Missing or false configuration flags cause the smoke check to fail. It refuses production URLs and does not send secrets or write data. Do **not** treat the check as evidence of Firebase/R2/Drive connectivity, admin sign-in success, student downloads, or payments. Authentication and configured services do not prove external connectivity. Run full authenticated browser and sandbox acceptance separately.

## External staging prerequisites (must be checked manually)

- Use a dedicated staging Worker/environment. Do not enable production checkout.
- Confirm Firebase service account and Firestore rules in staging; verify authenticated student and admin sessions.
- Provision separate **staging** Cloudflare R2 bucket `mayf-staging-materials` and bind `MAYF_PDF_BUCKET`. Never import test PDFs to the production `mayf-study-materials` bucket. Check actual object byte reads, PDF rendering, and private access.
- Grant the configured Google service account read access to a test Drive folder. Import a **real PDF** and verify both R2 object and persisted `contentItems` document with the matching ID.
- Verify an unpublished/archived PDF cannot be downloaded, and that re-import does not republish it.
- Confirm download authorization, Turnstile, subscription checks, 60-second expiry, atomic single-use redemption, audit records, and concurrent requests across Worker instances.
- Check Razorpay **sandbox** order creation, signed webhook settlement, duplicate event behavior, refund reconciliation, and subscription expiry. Do not take live payments before these pass.
- Review whether the CMS download resolver and catalog use one authoritative data model. Check non-PDF formats separately: Drive import currently only supports PDF.
- Do not merge/deploy the stacked draft PRs before all dependent changes and environment provisioning are reviewed together.

## Open risks

- PRs are stacked and not deployed; isolated successful CI runs are not a substitute for an integrated staging test.
- Private R2 provisioning, real PDF uploads and OAuth permissions have not been confirmed.
- Versioned PDF keys reduce accidental overwrite risk, but full conditional write semantics, orphan cleanup, and concurrent-service staging tests are still needed.
- Payment initial renewal migration, refunds with multiple successive renewals, and full sandbox E2E need additional verification.
- Firestore audit listing currently loads all audit records; pagination and retention are still outstanding.

## Expanded read-only non-Stripe acceptance

The staging HTTP smoke suite first verifies `/api/health` identifies the Worker as `staging`, then reads `/api/annual-pass/config` to prove checkout remains disabled. Anonymous protected CMS, analytics, SEO and gateway endpoints must return HTTP 401/403. If `MAYF_STAGING_ADMIN_TOKEN` is supplied securely, it also reads admin import configuration/jobs, SEO, content/categories, site settings, homepage layout, AdSense, measured analytics, Annual Pass pricing, masked payments, orders and students. Any non-200/failure blocks staging acceptance. **All of these are GET requests**; they do not test mutations, live browser behavior, true Firebase project parity, real Drive or Razorpay flows. Use a dedicated staging administrator identity token only.
