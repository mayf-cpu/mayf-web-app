# Isolated MAYF staging deployment

The consolidated release candidate is in `staging/consolidated-mayf-2026-10-21` (draft PR #77). **Do not deploy production or enable checkout.**

The file `wrangler.staging.jsonc` targets Worker `mayf-staging` and the separate R2 bucket `mayf-staging-files`. Neither the bucket nor required credentials are created by this change.

Before any staging deployment, provision **staging-only** Cloudflare API credentials and R2 bucket, and staging Firebase/service-account secrets. Never copy live payment gateway credentials. Ensure the service account can only access test material and staging Firestore data.

Run `node scripts/check-staging-isolation.mjs` before deployment. Once the isolated environment is configured and approved, an operator can deploy the candidate locally using `npx wrangler deploy --config wrangler.staging.jsonc`, then run `node scripts/staging-http-smoke.mjs https://mayf-staging.ACCOUNT.workers.dev`. Check the actual account URL reported by Wrangler; do not guess it.

` .github/workflows/deploy-staging.yml` is a manual-only workflow that hard-pins the candidate branch. On 2026-10-21 the same workflow definition was **registered on default `main`** as a configuration-only commit `77dfe56bf7654623c6238aae8101dde800b9f93d`. This does **not** merge the unreleased app to main, and does not deploy anything. A manual GitHub Actions dispatch must explicitly select branch `staging/consolidated-mayf-2026-10-21`, set `confirm_isolated_staging=true`, and provide protected `mayf-staging` variables/secrets. Never dispatch against main or enable production checkout. The local CLI route remains possible for a separately approved isolated operator.

A new **read-only Cloudflare resource preflight** checks that `mayf-staging-files` actually exists in the authorized account and that the existing `mayf-staging` Worker has a `FIREBASE_SERVICE_ACCOUNT_JSON` secret binding **before deploying**. It checks only metadata, never reads the service account value or writes any Cloudflare resource. The staging Worker and its secret must therefore be bootstrapped in the staging account first; until then a workflow dispatch will fail safely. Staging resource existence alone does not establish that its Firebase credentials belong to the right project. Follow with authenticated runtime checks.

The HTTP smoke check is read-only and does not prove Drive OAuth, PDF uploads, student downloads, browser experience or Razorpay sandbox payments. Complete `docs/STAGING_ACCEPTANCE_GATES.md` before considering a release.

## Deployment preflight

The manual GitHub Actions workflow refuses to deploy without the staging-only secrets `MAYF_STAGING_CLOUDFLARE_API_TOKEN` and `MAYF_STAGING_CLOUDFLARE_ACCOUNT_ID`, and the environment variable `MAYF_STAGING_FIREBASE_PROJECT_ID`. The Firebase project ID must not be the production-default project `maths-at-your-fingertips`. Configure all three in the protected `mayf-staging` GitHub environment.

**Important:** This preflight validates only supplied configuration values, not the actual Firebase project bound to the Worker. Before deploying, separately ensure the staging Worker secret `FIREBASE_SERVICE_ACCOUNT_JSON`, and if used, `GOOGLE_SERVICE_ACCOUNT_KEY`, contain staging-only service accounts, and verify a staging R2 bucket exists. A project ID variable by itself does not isolate Firestore or grant Drive access. Do not assume deploy success establishes external service connectivity.

## Additional isolation constraints

The preflight also fails if staging enables administrator refunds or gains custom route/zone settings, environment overrides, Worker service bindings, D1/KV bindings or unsafe bindings without an explicit reviewed update to the isolation policy. Staging checkout, coupon checkout, simulations and admin refunds must all remain `false`.

These **static safeguards are not live acceptance**. GitHub's `MAYF_STAGING_FIREBASE_PROJECT_ID` variable must be cross-checked against the actual staging Worker service-account project and real Firebase initialization. Do not deploy until isolation is verified at the runtime/configuration boundary; never set production secrets in the staging environment.

## Content Registry webhook credential gate

The Google Sheets import webhook requires **INGESTION_WEBHOOK_SECRET** in the Worker runtime and **MAYF_INGESTION_WEBHOOK_SECRET** in Apps Script Project Settings (Script Properties), set to the same unique random value of at least 32 characters. Also set **MAYF_WEBHOOK_URL** in Script Properties to the correct isolated staging HTTPS URL ending in `/api/ingestion/webhook`. Never use the publicly documented example secret or an implicit production domain fallback. Missing or weak values deny the webhook. Use the installable edit trigger (not a simple `onEdit` trigger) for Google UrlFetchApp permissions. When promoting, rotate the credentials and explicitly set the approved production URL separately; never copy staging secrets into production. The Admin Import page sends current Firebase ID tokens for protected jobs/sync/retry routes; verify this end-to-end in staging.

## Frontend Firebase build isolation (required)

The public Firebase web configuration is compiled into Vite frontend assets. A normal `npm run build` defaults to production-mode values and **must not** be used for isolated staging, since that can bind the browser to the production Firebase project.

Create these GitHub environment variables in `mayf-staging`, all for the **same isolated Firebase web application**:

- `MAYF_STAGING_FIREBASE_PROJECT_ID`, `MAYF_STAGING_FIREBASE_API_KEY`, `MAYF_STAGING_FIREBASE_AUTH_DOMAIN`, `MAYF_STAGING_FIREBASE_STORAGE_BUCKET`, `MAYF_STAGING_FIREBASE_MESSAGING_SENDER_ID`, `MAYF_STAGING_FIREBASE_APP_ID`

The manual staging workflow supplies the variables as `VITE_FIREBASE_*` and forces `VITE_APP_ENV=staging` for both the isolated preflight and the Vite build. It rejects placeholders, production Firebase IDs, mismatched project IDs and missing values **before generating staging assets**. The Firebase web API key and app ID are public config, not service-account private keys.

This only verifies **frontend build-time** isolation. Independently verify the deployed Worker secret `FIREBASE_SERVICE_ACCOUNT_JSON` (its `project_id`), active Firestore rules, test accounts, and OAuth before staging tests. The GitHub project-ID variable cannot prove a Cloudflare Worker secret is correct.

## Staging runtime Firebase fail-closed guard

At runtime, when `APP_ENV=staging`, the Firebase Admin configuration will refuse the production Firebase project and require a parseable service-account JSON containing its actual isolated `project_id`. A separately set `FIREBASE_ADMIN_PROJECT_ID` must equal the account's project. Missing or production credentials prevent Admin Auth/Firestore initialization rather than silently falling back to `maths-at-your-fingertips`. This does **not** prove that the staging account matches the web client built with the GitHub variable; compare both exact IDs during live acceptance.

## Authenticated staging read-only API matrix

After Cloudflare preflight passes and the isolated Worker is deployed, run `node scripts/staging-http-smoke.mjs https://mayf-staging.YOUR-ACCOUNT.workers.dev`. Securely supply `MAYF_STAGING_ADMIN_TOKEN` to cover the 13 authenticated read-only admin endpoints (CMS, SEO, import, analytics, settings, ledger and student list) in addition to anonymous access restrictions, checkout-disabled configuration and Firestore/R2 connectivity. The script refuses production domains and does not make any POST/PUT/DELETE calls. Then execute real staging-only write tests separately using disposable accounts and content. The branch/Worker URL must be confirmed from Wrangler deployment output.

## Google Sheets status-column integrity

The source tab must have exactly one header each for `content_id`, `title`, `status`, `visibility`, `content_type`, `access_type`, `firestore_id`, `import_status`, `import_error` and `last_imported_at`. A missing/duplicate status column blocks the import **before** transferring PDFs. Without reliable `status=Imported` writeback, retries might repeatedly reprocess approved rows and misleadingly indicate success. The integration now rejects ambiguous column mappings and invalid row numbers; writeback API failures remain visible.

## CI parity before manual staging deploy

The manual staging workflow independently reruns the exact candidate commit's production dependency audit, TypeScript validation, application regression tests, **Firestore security rules emulator** (Java 21), frontend build, Worker dry-run and staging-only Cloudflare resource preflight **before deployment**. This reduces the risk that a manually dispatched candidate bypasses required security checks even if an unrelated pull-request CI run is stale. It still does **not** deploy Firebase rules, configure staging secrets or prove actual external service integration.

## Existing staging resources confirmed by owner (2026-10-22)

The owner confirmed an existing `mayf-staging` Worker with `FIREBASE_SERVICE_ACCOUNT_JSON` and dashboard R2 binding `MAYF_FILES` pointing to `mayf-staging-files`. The candidate now targets those existing resource names instead of provisioning a second staging Worker/bucket. Its Wrangler deployment binds that same bucket as `MAYF_PDF_BUCKET`, which is the runtime name consumed by `worker.ts`; the bucket and its contents are not renamed or migrated. Secret presence does not prove its project identity: verify the service account belongs to `mayf-staging` before deployment. The GitHub Cloudflare secret names and all six public staging Firebase variables were confirmed saved; token validity and resource metadata checks remain pending. Production configuration is unchanged.
