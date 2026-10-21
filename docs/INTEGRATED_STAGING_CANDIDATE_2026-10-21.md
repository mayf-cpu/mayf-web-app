# Integrated MAYF staging acceptance candidate — 21 October 2026

Branch: `staging/integrated-acceptance-2026-10-21`
Source: `fix/staging-preview-host-guard` (stacked changes through PR #70).

## Release policy
**Candidate only. Do not merge to main or deploy to mayf.co.in.** Production checkout must remain disabled. GitHub CI passing is not evidence of working Firebase, R2, Drive, Razorpay, or browser workflows.

## Required staging steps
1. Confirm a dedicated staging Worker, nonproduction Firebase project/data, and private R2 bucket. Do not reuse production payment credentials.
2. Confirm the preview Worker contains this *integrated* branch, not an earlier feature branch. Use its exact branch-prefixed workers.dev preview URL.
3. Run `node scripts/staging-http-smoke.mjs https://BRANCH-mayf.ACCOUNT.workers.dev` for read-only anonymous security checks.
4. With an authorized staging Admin identity token supplied securely as `MAYF_STAGING_ADMIN_TOKEN`, rerun to verify protected Admin APIs, configuration, and Firestore/R2 read-only connectivity.
5. Import a real **non-sensitive staging PDF** from a test Drive folder, verify private R2 bytes, CMS publishing, reimport/versioning, hidden/archived access, download-token expiry, concurrent redemption, and browser rendering.
6. Exercise free and paid student access, Admin CMS functions and the full payment/refund/renewal path using **sandbox credentials only**.
7. Record pass/fail evidence and any remaining defects before requesting permission to merge or deploy.

## Explicitly unverified
- Isolated preview deployment of the integrated candidate.
- Real Drive OAuth and permissions; actual R2 upload/read, Firestore content writes and browser downloads.
- Student/Admin browser end-to-end workflows and payment sandbox settlement.
- All error-recovery and concurrency edge cases.

No migration, payment enablement, checkout or production action is performed by this branch or document.
