# MAYF commerce release gates — NOT AUTHORIZED FOR LIVE CHECKOUT

**Candidate:** `staging/consolidated-mayf-2026-10-21`, tracked by draft PR #77 and issue #78.

## Current implementation
- `paymentOrders`, `paymentEntitlements`, `paymentWebhookEvents`, payment claims and renewal cursors: Firestore durable ledger for signed payment settlement. Do not confuse these with the legacy `orders` / `entitlements` collections.
- `/api/admin/orders`: authenticated read of the **durable ledger**, not sample records; displays paid, created, pending, failed and refunded statuses and exports CSV (guarded against spreadsheet formulas).
- `/api/admin/orders/:orderId/refund`: **501 / not implemented** for refund initiation. **Never** display a real refund as completed from this route. A cryptographically verified full Razorpay refund webhook can reconcile a known paid order and revoke its matching entitlement; partial refunds and later renewal conflicts need manual review.
- `/api/payments/verify-signature` and `/api/payments/verify-and-grant`: the legacy browser confirmation path is not authorized for production settlement. Additional `MAYF_ENABLE_CHECKOUT` gate defaults closed.
- Coupon input is rejected before provider order creation if invalid, ineligible, expired or disabled; only validated coupon codes and discounts persist on orders. Discounted checkout has a separate `MAYF_ENABLE_COUPON_CHECKOUT` flag defaulting off.
- `/api/admin/payments/simulate-webhook`: local-only feature with explicit `MAYF_ENABLE_PAYMENT_SIMULATION` flag; never enable on staging or production.
- `/api/admin/payments/settings`: encrypted settings with a revision-checked Firestore save; stage-only secrets and gateway test credentials required.
- Analytics must read `paymentOrders` and `paymentEntitlements`. It must not infer paid revenue from client events.

## Blocking work before enabling checkout
- [x] Commit coupon global/per-user counters and per-order redemption receipts in the **same** Firestore transaction as the verified paid order, webhook claim and entitlement. Tested duplicate events, two competing workers, exhausted limits and corrupted records. A failed limit/revision precondition causes retry/manual reconciliation rather than false success.
- [ ] Reserve coupon inventory **before creating a chargeable provider order**, with bounded expiration/abandonment recovery. Until then, `MAYF_ENABLE_COUPON_CHECKOUT` must remain unset/false, even if checkout is subsequently enabled. Settling an already-captured payment without a reservation may still need manual reconciliation.
- [ ] Decide whether verified full refunds restore coupon uses and test the policy; current successful refund reconciliation does not decrement coupon counters.
- [ ] Compare PR #5's unique checkout and orders work to current staging code and preserve relevant features. Never merge divergent old implementation over newer durable payments wholesale.
- [ ] Validate real orders and renewals using isolated Firebase, R2/Drive staging scope, test-only Razorpay/Stripe accounts, signed gateway webhooks and one known staging account. No real funds or production accounts.
- [ ] Assert amount/currency/provider checks, duplicate webhook idempotency, cross-account ownership, invalid signatures, retry on unavailable storage, and refunds that match the full payment.
- [ ] Confirm admin order list, student order list, audit trail, analytics, active/expired/revoked Annual Pass, tax/currency, coupon discounts, export and failed-storage UX against persisted Firestore records.
- [ ] Review all production/staging secrets, webhook URLs, domain/hostname guards and rollback steps; have separate signoff before any production change.

## Safety controls and rollback
1. Leave `MAYF_ENABLE_CHECKOUT` **and `MAYF_ENABLE_COUPON_CHECKOUT`** unset or false (even in preview) while reconciliation is incomplete.
2. Leave `MAYF_ENABLE_PAYMENT_SIMULATION` unset in preview, staging and production.
3. Never report a refund completed without verified provider settlement. Never write synthetic admin orders.
4. On failed staging acceptance, restore the previous staging commit/Worker version; do not merge PR #77 to `main`.
5. Record the exact staging SHA, automated CI run URL and real sandbox acceptance evidence when available.
6. Only after acceptance may a separately approved deployment promote a reviewed candidate to production.

**Automated CI passing is not evidence that real Firestore, payment gateway, webhooks, Drive and R2 were exercised.**

## Staging deployment registration
- The staging workflow now allowlists `staging/consolidated-mayf-2026-10-21` and explicitly requires `confirm_isolated_staging = true`; it is **manual-only** and does not deploy on push.
- GitHub workflow-dispatch requires the workflow file on the default branch. This workflow is not present on `main` yet; the release team must approve a minimal workflow-registration route or use an independently approved isolated staging mechanism. Do **not** merge the entire draft release merely to register the staging workflow.
- No staging deploy or production deploy has been initiated by these changes. Validate separate staging Firebase, R2 bucket, Cloudflare credentials, hostname and test-mode gateway before any real staging execution.
