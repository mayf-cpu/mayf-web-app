# Isolated MAYF staging deployment

The consolidated release candidate is in `staging/consolidated-mayf-2026-10-21` (draft PR #77). **Do not deploy production or enable checkout.**

The file `wrangler.staging.jsonc` targets Worker `staging-acceptance-mayf` and the separate R2 bucket `mayf-staging-materials`. Neither the bucket nor required credentials are created by this change.

Before any staging deployment, provision **staging-only** Cloudflare API credentials and R2 bucket, and staging Firebase/service-account secrets. Never copy live payment gateway credentials. Ensure the service account can only access test material and staging Firestore data.

Run `node scripts/check-staging-isolation.mjs` before deployment. Once the isolated environment is configured and approved, an operator can deploy the candidate locally using `npx wrangler deploy --config wrangler.staging.jsonc`, then run `node scripts/staging-http-smoke.mjs https://staging-acceptance-mayf.ACCOUNT.workers.dev`. Check the actual account URL reported by Wrangler; do not guess it.

`.github/workflows/deploy-staging.yml` is a manual-only workflow and hard-pins the source branch. **GitHub generally requires workflow_dispatch workflow files to exist on the default branch before the Run workflow UI is available.** Because this remains a draft integration branch and must not be merged to main prematurely, the local CLI route above is the safe documented alternative. Do not merge simply to enable the workflow.

The HTTP smoke check is read-only and does not prove Drive OAuth, PDF uploads, student downloads, browser experience or Razorpay sandbox payments. Complete `docs/STAGING_ACCEPTANCE_GATES.md` before considering a release.

## Deployment preflight

The manual GitHub Actions workflow refuses to deploy without the staging-only secrets `MAYF_STAGING_CLOUDFLARE_API_TOKEN` and `MAYF_STAGING_CLOUDFLARE_ACCOUNT_ID`, and the environment variable `MAYF_STAGING_FIREBASE_PROJECT_ID`. The Firebase project ID must not be the production-default project `maths-at-your-fingertips`. Configure all three in the protected `mayf-staging` GitHub environment.

**Important:** This preflight validates only supplied configuration values, not the actual Firebase project bound to the Worker. Before deploying, separately ensure the staging Worker secret `FIREBASE_SERVICE_ACCOUNT_JSON`, and if used, `GOOGLE_SERVICE_ACCOUNT_KEY`, contain staging-only service accounts, and verify a staging R2 bucket exists. A project ID variable by itself does not isolate Firestore or grant Drive access. Do not assume deploy success establishes external service connectivity.

## Additional isolation constraints

The preflight also fails if staging enables administrator refunds or gains custom route/zone settings, environment overrides, Worker service bindings, D1/KV bindings or unsafe bindings without an explicit reviewed update to the isolation policy. Staging checkout, coupon checkout, simulations and admin refunds must all remain `false`.

These **static safeguards are not live acceptance**. GitHub's `MAYF_STAGING_FIREBASE_PROJECT_ID` variable must be cross-checked against the actual staging Worker service-account project and real Firebase initialization. Do not deploy until isolation is verified at the runtime/configuration boundary; never set production secrets in the staging environment.

## Content Registry webhook credential gate

The Google Sheets import webhook requires **INGESTION_WEBHOOK_SECRET** in the Worker runtime and **MAYF_INGESTION_WEBHOOK_SECRET** in Apps Script Project Settings (Script Properties), set to the same unique random value of at least 32 characters. Also set **MAYF_WEBHOOK_URL** in Script Properties to the correct isolated staging HTTPS URL ending in `/api/ingestion/webhook`. Never use the publicly documented example secret or an implicit production domain fallback. Missing or weak values deny the webhook. Use the installable edit trigger (not a simple `onEdit` trigger) for Google UrlFetchApp permissions. When promoting, rotate the credentials and explicitly set the approved production URL separately; never copy staging secrets into production. The Admin Import page sends current Firebase ID tokens for protected jobs/sync/retry routes; verify this end-to-end in staging.
