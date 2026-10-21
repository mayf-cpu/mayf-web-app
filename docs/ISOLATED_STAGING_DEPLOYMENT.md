# Isolated MAYF staging deployment

The integrated candidate is in `staging/integrated-acceptance-2026-10-21`. **Do not deploy production or enable checkout.**

The file `wrangler.staging.jsonc` targets Worker `staging-acceptance-mayf` and the separate R2 bucket `mayf-staging-materials`. Neither the bucket nor required credentials are created by this change.

Before any staging deployment, provision **staging-only** Cloudflare API credentials and R2 bucket, and staging Firebase/service-account secrets. Never copy live payment gateway credentials. Ensure the service account can only access test material and staging Firestore data.

Run `node scripts/check-staging-isolation.mjs` before deployment. Once the isolated environment is configured and approved, an operator can deploy the candidate locally using `npx wrangler deploy --config wrangler.staging.jsonc`, then run `node scripts/staging-http-smoke.mjs https://staging-acceptance-mayf.ACCOUNT.workers.dev`. Check the actual account URL reported by Wrangler; do not guess it.

`.github/workflows/deploy-staging.yml` is a manual-only workflow and hard-pins the source branch. **GitHub generally requires workflow_dispatch workflow files to exist on the default branch before the Run workflow UI is available.** Because this remains a draft integration branch and must not be merged to main prematurely, the local CLI route above is the safe documented alternative. Do not merge simply to enable the workflow.

The HTTP smoke check is read-only and does not prove Drive OAuth, PDF uploads, student downloads, browser experience or Razorpay sandbox payments. Complete `docs/STAGING_ACCEPTANCE_GATES.md` before considering a release.

## Deployment preflight

The manual GitHub Actions workflow refuses to deploy without the staging-only secrets `MAYF_STAGING_CLOUDFLARE_API_TOKEN` and `MAYF_STAGING_CLOUDFLARE_ACCOUNT_ID`, and the environment variable `MAYF_STAGING_FIREBASE_PROJECT_ID`. The Firebase project ID must not be the production-default project `maths-at-your-fingertips`. Configure all three in the protected `mayf-staging` GitHub environment.

**Important:** This preflight validates only supplied configuration values, not the actual Firebase project bound to the Worker. Before deploying, separately ensure the staging Worker secret `FIREBASE_SERVICE_ACCOUNT_JSON`, and if used, `GOOGLE_SERVICE_ACCOUNT_KEY`, contain staging-only service accounts, and verify a staging R2 bucket exists. A project ID variable by itself does not isolate Firestore or grant Drive access. Do not assume deploy success establishes external service connectivity.
