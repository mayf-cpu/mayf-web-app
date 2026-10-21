# PR #5 vs consolidated staging: feature-parity audit

Updated 2026-10-21. This is a **release-blocking reconciliation record**, not an acceptance certificate.

## Verified
- The staging candidate includes the cumulative payment, Drive/R2, PDF, webhook and isolated staging work from the stacked staging chain.
- It also has durable catalogue/admin-role audit changes.
- PR #5 is eight commits ahead of staging's common ancestor and contains distinct work across 50+ files; green CI on staging alone does not establish PR #5 feature parity.
- **SEO (repaired):** staging previously returned a purely local “Saved SEO!” state. The authenticated editor, Firestore-backed configuration, public metadata endpoint and tests were restored to the staging candidate; validate through an authenticated live staging browser session before sign-off.
- **Analytics (blocking):** `src/lib/analytics/aggregateMetricsService.ts` on staging still populates its default dashboard with synthetic page views, AI usage and revenue and uses optional local-file persistence. PR #5 uses Firestore daily counters and verified payment records. The dashboard must not present synthetic metrics as measured activity. Preserve the existing dashboard visual components while replacing the data source.
- **Payment gateway settings (code repaired, live validation pending):** authenticated settings now hydrate from Firestore and persist through a revision-checked write, with AES-GCM encrypted credentials; write/read fail closed if Firestore is absent. Initial regression passed on the staged code, and an additional stale-credential reset safeguard is awaiting its exact staging SHA CI result. Real isolated staging credential-save/reload tests are still required.
- **Coupons and promotions (requires parity work):** PR #5 has separate durable coupon/promotion repositories and authenticated persistence changes that are not currently present as-is in staging. Verify no loss of promotional/admin actions and no false success reporting.
- **AI quotas and history (requires parity work):** PR #5 has `src/lib/ai/aiQuota.ts` and related signed-in history improvements not present as-is in staging.
- **Other UI + backend changes (requires comparison):** PR #5 changed checkout, SEO, administration, imports, analytics and ledger UI. Avoid replacing newer staging payments/import logic wholesale; adapt missing UI and endpoints on the development branch.

## Gates before retiring PR #5 or deploying
1. Compare each of the eight unique PR #5 commits with current staging behavior, tests and source; mark equivalent, ported or blocked.
2. Preserve both source branches and all data. Do not bulk-merge unrelated diverged histories.
3. Ensure development and staging GitHub regression workflows pass **at the exact staged SHA**.
4. Run real isolated staging browser/service acceptance (Firebase, Google Drive, R2 PDF, payment sandbox, ledger, coupons, SEO, analytics) and verify no production writes.
5. Keep checkout and production deployment disabled until authorized live testing and acceptance.

Do not close original PRs merely to reduce the PR count; first verify no unique functionality or tests remain.
