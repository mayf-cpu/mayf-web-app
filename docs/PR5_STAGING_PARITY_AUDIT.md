# PR #5 vs consolidated staging: feature-parity audit

Updated 2026-10-21. This is a **release-blocking reconciliation record**, not an acceptance certificate.

## Verified
- The staging candidate includes the cumulative payment, Drive/R2, PDF, webhook and isolated staging work from the stacked staging chain.
- It also has durable catalogue/admin-role audit changes.
- PR #5 is eight commits ahead of staging's common ancestor and contains distinct work across 50+ files; green CI on staging alone does not establish PR #5 feature parity.
- **SEO (repaired):** staging previously returned a purely local “Saved SEO!” state. The authenticated editor, Firestore-backed configuration, public metadata endpoint and tests were restored to the staging candidate; validate through an authenticated live staging browser session before sign-off.
- **Analytics (code repaired; live validation pending):** staging now reads Firestore daily counters, paid orders, entitlements and saved AI sessions rather than seeding synthetic figures. Unsupported user/visitor/renewal metrics explicitly display 'Not measured' in the retained dashboard. Public purchase/AI events cannot fabricate revenue and usage, rate limiting protects telemetry, and the synthetic reset endpoint is disabled. Exact staged-SHA regression passed. Still verify authenticated staging dashboards against known test events/orders and ensure refund/renewal reporting matches the ledger.
- **Payment gateway settings (code repaired, live validation pending):** authenticated settings persist through revision-checked Firestore writes with AES-GCM encryption, fail closed without storage and discard stale runtime secrets. Staging regression passed; live isolated credential-save/reload tests are still required.
- **Coupons and promotions (code repaired, live validation pending):** offer state now participates in the catalogue Firestore commit alongside audit records, protected writes fail without Firestore, and admin UI requests use current Firebase sessions rather than placeholder tokens. Exact staged-SHA regression checks passed. Verify browser create/edit/delete/reload and coupon redemption under concurrency before payment launch; coupon usage accounting is not yet proven atomic with orders/webhooks.
- **AI Teacher (code repaired; live validation pending):** durable IST daily quotas, authenticated owner-scoped history and rating, verified App Check when enabled, and real saved administrator telemetry are integrated. Synthetic sample history, invented teacher answers, and hard-coded admin activity totals were removed; unavailable AI now returns an error instead of pretend success. Exact staged-SHA CI validation and live Gemini/Firebase checks remain release gates.
- **Other UI + backend changes (requires comparison):** PR #5 changed checkout, SEO, administration, imports, analytics and ledger UI. Avoid replacing newer staging payments/import logic wholesale; adapt missing UI and endpoints on the development branch.

## Gates before retiring PR #5 or deploying
1. Compare each of the eight unique PR #5 commits with current staging behavior, tests and source; mark equivalent, ported or blocked.
2. Preserve both source branches and all data. Do not bulk-merge unrelated diverged histories.
3. Ensure development and staging GitHub regression workflows pass **at the exact staged SHA**.
4. Run real isolated staging browser/service acceptance (Firebase, Google Drive, R2 PDF, payment sandbox, ledger, coupons, SEO, analytics) and verify no production writes.
5. Keep checkout and production deployment disabled until authorized live testing and acceptance.

Do not close original PRs merely to reduce the PR count; first verify no unique functionality or tests remain.
