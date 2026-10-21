# PR #5 vs consolidated staging: feature-parity audit

Updated 2026-10-21. This is a **release-blocking reconciliation record**, not an acceptance certificate.

## Verified
- The staging candidate includes the cumulative payment, Drive/R2, PDF, webhook and isolated staging work from the stacked staging chain.
- It also has durable catalogue/admin-role audit changes.
- PR #5 is eight commits ahead of staging's common ancestor and contains distinct work across 50+ files; green CI on staging alone does not establish PR #5 feature parity.
- **SEO (repaired):** staging previously returned a purely local “Saved SEO!” state. The authenticated editor, Firestore-backed configuration, public metadata endpoint and tests were restored to the staging candidate; validate through an authenticated live staging browser session before sign-off.
- **Analytics (code repaired; live validation pending):** staging now reads Firestore daily counters, actual `paymentOrders`, actual `paymentEntitlements` and saved AI sessions rather than seeding synthetic figures. Unsupported user/visitor/renewal metrics explicitly display 'Not measured' in the retained dashboard. Public purchase/AI events cannot fabricate revenue and usage, rate limiting protects telemetry, and the synthetic reset endpoint is disabled. Exact staged-SHA regression passed. Still verify authenticated staging dashboards against known test events/orders and ensure refund/renewal reporting matches the ledger.
- **Payment gateway settings (code repaired, live validation pending):** authenticated settings persist through revision-checked Firestore writes with AES-GCM encryption, fail closed without storage and discard stale runtime secrets. Staging regression passed; live isolated credential-save/reload tests are still required.
- **Coupons and promotions (code repaired, live validation pending):** offer state now participates in the catalogue Firestore commit alongside audit records, protected writes fail without Firestore, and admin UI requests use current Firebase sessions rather than placeholder tokens. Exact staged-SHA regression checks passed. Verify browser create/edit/delete/reload and coupon redemption under concurrency before payment launch; coupon redemption is now atomically committed with verified payment settlement and tested under retries/concurrency; pre-gateway 30-minute reservations and lazy abandonment expiry recovery are now implemented and tested; delayed live webhook behavior still requires sandbox validation.
- **AI Teacher (code repaired; live validation pending):** durable IST daily quotas, authenticated owner-scoped history and rating, verified App Check when enabled, and real saved administrator telemetry are integrated. Synthetic sample history, invented teacher answers, and hard-coded admin activity totals were removed; unavailable AI now returns an error instead of pretend success. Exact staged-SHA CI validation and live Gemini/Firebase checks remain release gates.
- **Financial ledger (code repaired; live validation pending):** the admin orders list now reads Firestore-backed payment orders, no longer presents fake customer purchases, distinguishes paid/pending/refunded states, and exports a guarded CSV. The admin refund route persists an immutable full-refund intent before calling the real Razorpay INR API, prevents duplicate sends, and returns a pending/review state. Signed verified full-refund webhooks alone complete refunds and revoke access. The independent refund enablement flag remains off pending sandbox acceptance. Test real sandbox refunds, multi-currency display and ledger export before sign-off.
- **Checkout guardrails (code repaired; live validation pending):** legacy client-side verification and webhook simulation are explicitly disabled by default; simulator is local-only with a dedicated opt-in. Checkout remains disabled until gateway sandbox acceptance and late-payment reconciliation are validated.
- **Other UI + backend changes (requires comparison):** PR #5 changed checkout, SEO, administration, imports, analytics and ledger UI. Avoid replacing newer staging payments/import logic wholesale; adapt missing UI and endpoints on the development branch.

## Gates before retiring PR #5 or deploying
1. Compare each of the eight unique PR #5 commits with current staging behavior, tests and source; mark equivalent, ported or blocked.
2. Preserve both source branches and all data. Do not bulk-merge unrelated diverged histories.
3. Ensure development and staging GitHub regression workflows pass **at the exact staged SHA**.
4. Run real isolated staging browser/service acceptance (Firebase, Google Drive, R2 PDF, payment sandbox, ledger, coupons, SEO, analytics) and verify no production writes.
5. Keep checkout and production deployment disabled until authorized live testing and acceptance.

Do not close original PRs merely to reduce the PR count; first verify no unique functionality or tests remain.

## Additional commerce reconciliation (2026-10-21)
- PR #5 diverges by eight commits; the staging release branch now has newer durable-payment primitives absent from PR #5, including signed webhook settlement, idempotent payment claims, refund webhook reconciliation and renewal cursors. Do not cherry-pick the older payment service wholesale.
- The previous admin order endpoint returned hard-coded fictional customers when it had no in-memory orders, while the refund action returned success without initiating a gateway refund. Both behaviors have been removed.
- Browser verification is not a substitute for durable signed webhooks, and verified coupon redemption is now atomic with payment settlement; however, coupon holds are now placed before gateway initialization, but delayed gateway capture after hold expiry remains an unresolved sandbox/policy gate. Discounted purchases remain gated off. The checkout safety flag remains off.
- Confirm analytics uses the actual Firestore collections (`paymentOrders`, `paymentEntitlements`) rather than PR #5's older `orders` and `entitlements` names. Covered by regression tests; isolated staging tests are still needed.
- See `docs/PAYMENT_RELEASE_GATES.md` and issue #78 for the operational checklist and remaining blockers.

## Verified coupon redemption reconciliation (2026-10-21)
- Signed payment settlement now updates `coupons` usage counters, `paymentCouponRedemptions` receipt, `paymentOrders` paid status, entitlement, payment claims and webhook event in one revision-checked Firestore commit. Unit tests cover simultaneous customers and duplicate signed events.
- Invalid coupon input is rejected before provider order creation; only a validated, discounted code is persisted on the order. Coupon state is reloaded from Firestore at checkout.
- **Still blocked:** pre-gateway coupon reservations now hold a discount for 30 minutes and are released after checkout initialization failures; abandoned holds are reclaimed lazily. If verified gateway capture or its webhook arrives after the hold expires, manual reconciliation can still be required. `MAYF_ENABLE_COUPON_CHECKOUT` and the general checkout flag remain disabled pending live staging acceptance.
- Staging workflow targets the consolidated branch with manual opt-in, but requires registration on the default GitHub branch or an approved equivalent staging-only executor. No environment has been deployed from these commits.

## Authentication, privacy and security reconciliation (2026-10-21)

- Reconciled the later PR #5 changes through bae3880 into the consolidated candidate by inspecting source equivalence first. The independent client files matched their earlier baseline; newer payment/Drive/R2 implementations were preserved rather than replaced.
- Ported account-scoped activity/recent-view caches, guest/account local favorites, absence of fabricated learner history, delayed-request guards, confirmed sign-out/error handling, profile-auth race protection, visible share popovers and honest clipboard feedback.
- Adapted administrator student history to the candidate's **paymentOrders** collection and server-filtered owner queries; retained the candidate's paid-status semantics and asynchronous inspector guards. No legacy orders collection is substituted for the durable ledger.
- Ported hardened Firestore rules, bounded profile/activity schemas, Java 21 emulator coverage and the patched gRPC transport dependency. Extended the existing regression workflow with Java, the rules emulator and production dependency audit; retained its existing Worker smoke step.
- Local rules tests cover both legacy and candidate payment collection bypass attempts. Repository rules do not change the active Firebase rules; actual rules deployment/IAM/bucket inspection and authenticated isolated staging remain blocking.
- Source comparison and these ports do not certify every PR #5 feature. Remaining Annual Pass/import/settings/admin differences require targeted parity review. Old PRs/branches are preserved and must not be merged in parallel into main.

## Annual Pass / pricing reconciliation

- Replaced the candidate's fake Annual Pass save UI with authenticated load/save/error handling. Config now persists with a conditional Firestore revision; cold services reload it, failed writes roll back, and concurrent saves cannot silently overwrite each other. The family amount remains a saved proposal and is labelled as unavailable for checkout.
- Checkout reads saved membership settings and respects enabled status and inclusive IST promotional calendar dates. Public configuration supplies the effective price, configured added tax and the existing checkout flag without exposing the editor's UID. The pass page and checkout consume those values; no demo customer or automatic BOARD2026 coupon is inserted. Missing pricing and disabled checkout block submission.
- New orders snapshot their server-selected duration. Signed settlement uses that purchased duration instead of silently changing a buyer's term when the administrator edits settings later. Pre-existing orders without a duration snapshot still use the legacy configured-duration fallback and require sandbox reconciliation.
- The existing payment, reservation, refund and checkout gates remain in place. Latest parallel payment-ledger changes through 3f3a459 were merged without overwriting their implementation.
- Local validation: 203 application tests, TypeScript and frontend build pass. Six tests cover settings persistence, failed-write rollback, contention, invalid settings/storage, IST pricing and purchased-duration settlement. Eight security emulator tests passed for the preceding security batch. Live authenticated settings edit/reload, checkout amount/tax and webhook acceptance remain outstanding.

## Refund initiation and credential revocation follow-through (2026-10-21)
- Latest paid Razorpay INR passes have durable refund initiation with immutable provider idempotency key, full tax-inclusive amount, actor/reason audit, duplicate/concurrency prevention, review states for uncertain outcomes and atomic signed-webhook completion. Admin UI/CSV keep pending refund requests separate from completed payment refunds.
- Nine additional refund scenarios cover durable preparation, duplicate/restarted/concurrent requests, unknown outcomes, failed acknowledgement saves, mismatched refund IDs, webhook-before-response and real API request/response validation. No real funds were refunded. Stripe initiation, partial refunds and older-renewal adjustment remain manual review.
- Refund batch 6356c29 passed exact-SHA CI run 39649137142, including 212 application tests, eight rules emulator scenarios, production audit, TypeScript, frontend build and Worker smoke.
- Adapter configuration now replaces the complete authoritative credential snapshot. Removed settings clear stale Razorpay/Stripe API and webhook credentials; three additional regressions prove that previously valid signatures fail after removal, including the production service storage boundary.
- Local combined checks: 215 application tests, TypeScript and frontend build pass; eight rules emulator scenarios passed for the refund batch. Live isolated acceptance and production deployment remain pending.

## Razorpay test-key and checkout callback repair (2026-10-21)
- Real configured Razorpay test keys now use the real Orders API in deployed staging; live keys are rejected in staging for order/refund creation. Order response amount/currency/receipt and unpaid/new status are verified. Real API errors no longer become mock successes.
- Production checkout callbacks now wait for an owner-scoped durable paid-order plus matching active entitlement rather than invoking the disabled legacy callback settlement route. Pending confirmation has bounded polling, account-change cancellation, truthful delayed feedback and a read-only retry; purchase submission stays disabled while waiting.
- Removed the checkout's unsupported instant-refund guarantee and fixed decimal currency rendering for tax-inclusive totals.
- Local validation: 223 application tests, TypeScript and frontend build pass. Three gateway creation scenarios and five confirmation scenarios cover test-key use, failures/mismatches/live-key staging rejection, ownership, delayed settlement, timeout, wrong order and account cancellation. Worker CI now also checks that the confirmation and refund-review APIs require authentication.
- Previous credential-reset commit 19d258d passed CI run 39649384587 including Worker smoke. Live sandbox acceptance, Stripe checkout, paid-resource parity and operational staging remain outstanding; all commerce flags stay off.

## Connected Sheets registry parity (2026-10-21)

PR #5's actual saved Google Sheets registry configuration, authenticated Admin connection UI and Google Sheets approved-row import were adapted to the consolidated branch without replacing the newer durable import jobs, R2/PDF ingest or Firestore CMS transaction. The manual sync fetches up to five **Approved** rows from the saved tab per call, imports each through the secured current pipeline, and posts outcome metadata back to Sheets; unknown failures are returned rather than treated as successful. Read/save requires authenticated admin and available Firestore. Staging Sheets API permissions, Drive access and real writeback remain unverified.
