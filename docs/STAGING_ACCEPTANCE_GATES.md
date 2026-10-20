# MAYF staging release acceptance gates

## Automated CI gates

Run `npm ci && npm run lint && npm test && npm run build && npm run test:worker`.
The `staging-release-gates.test.ts` guards the critical code wiring. Passing these checks does **not** establish that external services or browser workflows work.

## External staging prerequisites (must be checked manually)

- Use a dedicated staging Worker/environment. Do not enable production checkout.
- Confirm Firebase service account and Firestore rules in staging; verify authenticated student and admin sessions.
- Provision private Cloudflare R2 bucket `mayf-study-materials` and bind `MAYF_PDF_BUCKET`. Check actual object byte reads, PDF rendering, and private access.
- Grant the configured Google service account read access to a test Drive folder. Import a **real PDF** and verify both R2 object and persisted `contentItems` document with the matching ID.
- Verify an unpublished/archived PDF cannot be downloaded, and that re-import does not republish it.
- Confirm download authorization, Turnstile, subscription checks, 60-second expiry, atomic single-use redemption, audit records, and concurrent requests across Worker instances.
- Check Razorpay **sandbox** order creation, signed webhook settlement, duplicate event behavior, refund reconciliation, and subscription expiry. Do not take live payments before these pass.
- Review whether the CMS download resolver and catalog use one authoritative data model. Check non-PDF formats separately: Drive import currently only supports PDF.
- Do not merge/deploy the stacked draft PRs before all dependent changes and environment provisioning are reviewed together.

## Open risks

- PRs are stacked and not deployed; isolated successful CI runs are not a substitute for an integrated staging test.
- Private R2 provisioning, real PDF uploads and OAuth permissions have not been confirmed.
- R2 object existence checks are not an atomic no-overwrite guarantee; versioned publishing and conditional writes are still needed before allowing concurrent replacements.
- Payment initial renewal migration, refunds with multiple successive renewals, and full sandbox E2E need additional verification.
- Firestore audit listing currently loads all audit records; pagination and retention are still outstanding.
