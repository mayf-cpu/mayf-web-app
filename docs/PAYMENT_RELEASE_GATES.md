# MAYF commerce release gates — NOT AUTHORIZED FOR LIVE CHECKOUT

**Candidate:** `staging/consolidated-mayf-2026-10-21`, tracked by draft PR #77 and issue #78.

## Current implementation
- `paymentOrders`, `paymentEntitlements`, `paymentWebhookEvents`, payment claims and renewal cursors: Firestore durable ledger for signed payment settlement. Do not confuse these with the legacy `orders` / `entitlements` collections.
- `/api/admin/orders`: authenticated read of the **durable ledger**, not sample records; displays paid, created, pending, failed and refunded statuses and exports CSV (guarded against spreadsheet formulas).
- `/api/admin/orders/:orderId/refund`: durable full INR refund initiation for the latest paid Razorpay pass, gated by default-off `MAYF_ENABLE_ADMIN_REFUNDS`. Saves immutable amount, payment, idempotency key, actor and reason before the real API call. Duplicate/concurrent clicks never resend; unknown outcomes require review. Returns 202 with request status, never changes paid access itself. Only the signed full-refund webhook completes the request and revokes access atomically. Stripe initiation, partial refunds and older-renewal conflicts remain unsupported/manual review.
- `/api/payments/verify-signature` and `/api/payments/verify-and-grant`: the legacy browser confirmation path is not authorized for production settlement. Additional `MAYF_ENABLE_CHECKOUT` gate defaults closed.
- Coupon input is rejected before provider order creation if invalid, ineligible, expired or disabled; only validated coupon codes and discounts persist on orders. Reservation happens before a gateway order is created, and failed initialization attempts to release it. Discounted checkout has a separate `MAYF_ENABLE_COUPON_CHECKOUT` flag defaulting off.
- `/api/admin/payments/simulate-webhook`: local-only feature with explicit `MAYF_ENABLE_PAYMENT_SIMULATION` flag; never enable on staging or production.
- `/api/admin/payments/settings`: encrypted settings with a revision-checked Firestore save; stage-only secrets and gateway test credentials required.
- Analytics must read `paymentOrders` and `paymentEntitlements`. It must not infer paid revenue from client events.
- Verified but unsuccessful webhook settlements now create sanitized, idempotent `paymentReconciliationCases` records; `/api/admin/payments/reconciliation` exposes unresolved items to authenticated admins only. A later verified successful retry resolves the matching case. Unverified callbacks never enter this queue.

## Blocking work before enabling checkout
- [x] Commit coupon global/per-user counters and per-order redemption receipts in the **same** Firestore transaction as the verified paid order, webhook claim and entitlement. Tested duplicate events, two competing workers, exhausted limits and corrupted records. A failed limit/revision precondition causes retry/manual reconciliation rather than false success.
- [x] Pre-gateway coupon reservations are recorded in Firestore using a coupon-document revision check, a 30-minute hold and a per-order reservation receipt; competing customers and per-user limits are serialized. Failed checkout initialization releases the hold; expired holds are lazily reclaimed only when there is no unresolved persisted provider order. Admin edits preserve holds, cannot reduce limits below obligations, and cannot delete coupons with any outstanding holds. Settlement consumes the matching hold in the same atomic payment/entitlement commit. The tested implementation rejects stale coupon quotes.
- [x] Retain expired reservations on `created`/`pending` provider orders and allow delayed **verified** webhooks to consume the original still-protected hold without double allocation. Absent-order/terminal holds can be lazily reclaimed. Regression coverage includes late capture, concurrent capacity, terminal release, date-only coupon expiry, and admin limit reductions.
- [ ] Validate **real sandbox and delayed webhook behavior** before enabling `MAYF_ENABLE_COUPON_CHECKOUT`. The orphan scenario (provider order created but internal Firestore order write failed) can still require gateway reconciliation; do not treat unit tests as live provider evidence.
- [x] Interim refund policy is explicit and tested: a verified full refund revokes pass access but **does not restore a redeemed limited coupon** (prevents repeated redemption), and the refund event records `couponUsagePolicy: retained_after_refund`.
- [ ] Obtain final business approval for whether exceptional/refunded coupon eligibility should ever be restored; no automatic restoration is enabled.
- [ ] Compare PR #5's unique checkout and orders work to current staging code and preserve relevant features. Never merge divergent old implementation over newer durable payments wholesale.
- [ ] Validate real orders and renewals using isolated Firebase, R2/Drive staging scope, test-only Razorpay/Stripe accounts, signed gateway webhooks and one known staging account. No real funds or production accounts.
- [ ] Assert amount/currency/provider checks, duplicate webhook idempotency, cross-account ownership, invalid signatures, retry on unavailable storage, and refunds that match the full payment.
- [ ] Confirm admin order list, student order list, audit trail, analytics, active/expired/revoked Annual Pass, tax/currency, coupon discounts, export and failed-storage UX against persisted Firestore records.
- [ ] Review all production/staging secrets, webhook URLs, domain/hostname guards and rollback steps; complete the user-authorized production deployment only after the remaining technical gates pass.

## Safety controls and rollback
1. Leave `MAYF_ENABLE_CHECKOUT` **and `MAYF_ENABLE_COUPON_CHECKOUT`** unset or false (even in preview) while reconciliation is incomplete.
2. Leave `MAYF_ENABLE_PAYMENT_SIMULATION` unset in preview, staging and production.
3. Never report a refund completed without verified provider settlement. Never write synthetic admin orders.
4. On failed staging acceptance, restore the previous staging commit/Worker version; do not merge PR #77 to `main`.
5. Record the exact staging SHA, automated CI run URL and real sandbox acceptance evidence when available.
6. Only after acceptance may deployment promote the reviewed candidate to production, as requested by the user.

**Automated CI passing is not evidence that real Firestore, payment gateway, webhooks, Drive and R2 were exercised.**

## Staging deployment registration
- The staging workflow now allowlists `staging/consolidated-mayf-2026-10-21` and explicitly requires `confirm_isolated_staging = true`; it is **manual-only** and does not deploy on push.
- GitHub workflow-dispatch requires the workflow file on the default branch. This workflow is not present on `main` yet; the release team must approve a minimal workflow-registration route or use an independently approved isolated staging mechanism. Do **not** merge the entire draft release merely to register the staging workflow.
- No staging deploy or production deploy has been initiated by these changes. Validate separate staging Firebase, R2 bucket, Cloudflare credentials, hostname and test-mode gateway before any real staging execution.

## Refund sandbox acceptance and recovery
- Official API: https://razorpay.com/docs/api/refunds/normal-refunds-idempotent — exact saved amount and body with `X-Refund-Idempotency`; never generate a new key for an uncertain prior request.
- Private `paymentRefundRequests/{orderId}` is an audit record of actor, reason, amount in paise, immutable key, requested time, state and provider refund ID. Browser clients (including administrator SDK clients) cannot write it. Authenticated admins may inspect the sanitized `/api/admin/payments/refunds` list. Ledger and CSV distinguish the refund request state from the payment status.
- `requested` can mean a crash before/after send; `needs_review` includes network failures, declined requests and malformed responses. Neither implies a completed refund or proves no money moved. Check the payment/refund directly in Razorpay before controlled recovery, reuse the saved key and exact body where the gateway permits, and replay the genuine signed webhook. No automated retry or fabricated settlement is provided.
- A concurrent later purchase after initiation can make rollback ambiguous. Such a signed refund must stay in the existing reconciliation queue for manual adjustment; automated reconciliation never removes a later purchased term.
- Required isolated sandbox evidence: valid full refund; duplicate/concurrent admin submissions; API timeout after acceptance; webhook before API response; invalid signature; mismatched amount/currency; failed Firestore precondition; renewal between initiation and webhook; final pass revocation and ledger/audit agreement after restart.
- Keep `MAYF_ENABLE_ADMIN_REFUNDS` false until this evidence exists. This implementation has mocked-provider and emulator coverage, not live refund acceptance.

## Razorpay sandbox and deployed checkout confirmation
- Real Razorpay test credentials now create an actual provider order, including in a deployed production runtime used for isolated staging. Live credentials are rejected when `APP_ENV=staging` for both order creation and refund initiation. Configured key mode must match the key prefix. Local mock IDs exist only for the exact built-in development credential pair, outside deployed/staging runtimes; real API errors never fall back to simulation.
- Authoritative provider order responses must match the requested INR amount, receipt and new/unpaid state. Provider errors and unknown outcomes do not acknowledge a purchase. Official API: https://razorpay.com/docs/api/orders/create/.
- Deployed checkout no longer invokes the deliberately disabled legacy signature-settlement endpoint after the browser callback. It reads authenticated `/api/student/orders/:orderId/confirmation`, which confirms only the exact owner's paid order and matching active payment entitlement. This route cannot write or settle anything.
- Confirmation polling is bounded, cancellable on account change/unmount, and shows a pending message with a read-only retry. A pending confirmation disables new checkout submission on that page. Only matching settled results show purchase confirmation. A full reload still relies on purchase history; complete live resume/reload acceptance before enablement.
- Stripe's real sandbox/hosted checkout flow and paid-resource purchases remain release blockers. This change does not certify them or enable any checkout/refund flag.

## Interim gateway availability

For the requested first release, **Stripe is postponed**, not removed. The checkout page displays the international option as unavailable; server order creation only permits INR/Razorpay, including when the administrator has saved `activeProvider=stripe` and the client sends `auto`. `MAYF_ENABLE_CHECKOUT` remains false pending actual Razorpay sandbox settlement acceptance. Enabling Stripe later requires implementing and verifying hosted Checkout, signed settlement, refunds, and frontend confirmation; do not bypass the server gateway policy for a partially tested route.
