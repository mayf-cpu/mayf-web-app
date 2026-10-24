# Razorpay sandbox acceptance — 24 October 2026

This evidence applies only to the isolated `staging-acceptance-mayf` Worker, the owner-approved disposable Firebase project, and Razorpay Test Mode. Production has not been deployed. Stripe remains deferred.

## Verified sequence

- Read back the owner-created enabled webhook at the exact staging `/api/payments/webhook/razorpay` URL. Its four events are `payment.captured`, `payment.failed`, `order.paid`, and `refund.processed`; Razorpay confirms a secret was supplied.
- The encrypted stored test key pair passed the deployed bounded read-only connection probe.
- Explicit temporary workflow input enabled checkout and admin refunds only on isolated staging. Normal configuration keeps both false, with coupons and payment simulation false throughout.
- Signed in through Google. Created one Annual Pass order using synthetic checkout contact details and the provider's documented example phone number. Hosted checkout visibly displayed **Test Mode**. Used Razorpay's mock Netbanking bank Success control; no real card or banking credentials were entered.
- Provider order `order_TrlFuj1fVXvD8v`, payment `pay_TrlIUBXfU9HMuM`, app order `MAYF-ORD-20261024-EC608F`.
- Razorpay independently showed **Captured** for INR 1,179.00. Student history and admin ledger showed the same paid order. Receipt downloaded and contained the matching identifiers, INR 999 gross, INR 180 recorded tax, INR 0 discount, and INR 1,179 total.
- Durable settlement event `TrlJKY7Qgp9MX4` was recorded at `2026-10-24T13:29:10.033Z`. The staging browser callback cannot grant volatile access: signed webhook settlement produced the durable paid state.
- The first normal-config redeployment completed successfully (run `40098635865`, version `583decb8-8830-453a-bf8b-7473d9083c0c`), disabling checkout/refund initiation while preserving the paid order.
- Found and fixed two operator gaps: webhook audit previously read legacy in-memory logs; current admin ledger had no refund initiation control. The audit now reads allowlisted durable settlement records, fails closed on unavailable storage, and supports refreshing. A reviewed full-refund form uses the existing guarded backend and never treats initiation as settlement.
- Updated candidate `c495bfce4ee33200726d479ec87b1525ad8f0360` passed **287 application tests**, **8 Firestore rule scenarios**, TypeScript, production-dependency audit (zero vulnerabilities), frontend build, Worker compilation and resource preflight in run `40098964332`. Development dependencies still have audit findings and are not included in the production-only audit result.
- Submitted the full INR 1,179 sandbox refund through the new admin form. Initial acknowledgement correctly retained **paid / awaiting_webhook**, without revoking access prematurely or permitting another send.
- Razorpay independently showed **Refunded / Refund (Processed)**, refund `rfnd_TrlUjEDf9S2fNA`. Verified refund event `TrlVIh3KYZuxQK` was durably settled at `2026-10-24T13:40:29.591Z`. Refresh showed **REFUNDED / Refund: completed**, the matching refund ID, and both payment/refund settlement records.
- The durable refund transaction atomically updates the order, revokes its paid entitlement, restores the prior renewal cursor, records the event, and completes the saved refund request. An administrator's separate access bypass must not be used as proof of a paid membership.

## Limits and remaining gates

This completed one successful provider sandbox capture, authentic payment webhook, receipt download, full refund, and authentic refund webhook. It does not prove every payment method or failure scenario. Duplicate/delayed/concurrent events and refund repeat-send guards pass automated tests; a provider-side replay/delay exercise is still outstanding. Ordinary redeployment preserved state, but an actual previous-version rollback exercise remains outstanding. Mobile acceptance, AI image/quota/reliability acceptance, remaining admin/student mutations, and launch content/contact cleanup also remain. Production remains gated on those results.

The normal staging workflow must be restored with `enable_payment_acceptance` unchecked immediately after this test window. Runtime flags and fresh readback are the authority for the current deployment state; this document is not permission to leave sandbox initiation enabled.

Final default restoration: run `40099279412` completed successfully, version `cdee813a-2f20-4a2a-a520-10fafb0e202d`, with checkout and admin refunds both false. The refund and both durable settlements remained after redeployment; the admin student directory showed the test account on FREE ACCESS.
