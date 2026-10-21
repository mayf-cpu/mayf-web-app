# Security and authentication release validation

Candidate: consolidated staging PR #77. Production remains blocked pending operational and functional acceptance.

- Hardened client rules: no public raw attachment metadata; no browser writes that bypass server commerce/CMS transactions; no owner-forged AI responses/metrics; bounded profile/activity schemas; owner-scoped reads and boolean-only notification read updates.
- Eight Firestore emulator scenarios passed on Java 21 / Firestore emulator 1.22.0, including candidate paymentOrders, paymentEntitlements, coupon reservation/redemption and internal collections.
- Production dependency audit: zero vulnerabilities after a scoped @grpc/grpc-js 1.14.6 override. The emulator tests pass with the patched dependency.
- Sign-out clears local identity only after Firebase succeeds. Every sign-out surface reports failure. Auth events and unmount invalidate delayed claims/profile responses; account caches/favorites and inspector responses are isolated.
- Student history reads the actual durable payment ledger through exact userId queries, preserves real currency/tax/discount/status, and labels client activity as reported usage. Client activity never grants purchases or access.
- Local TypeScript, 194 application tests and the frontend build pass. The exact pushed candidate SHA must still pass its own CI, including the pre-existing Worker smoke check. The local Worker dry-run was not retried after the earlier automatic approval rejection.

## Remaining production gates

1. Deploy the reviewed Firebase rules/indexes to the confirmed isolated staging project; this workspace has no Firebase CLI login or service-account deployment credentials. Inspect actual Storage/R2 access and legacy public/token URLs.
2. Verify real isolated Firebase login, logout/account switching, profile persistence, admin histories, private media downloads and Turnstile/App Check behavior.
3. Complete payment sandbox/webhook/late-capture/refund acceptance and the remaining code requirements in PAYMENT_RELEASE_GATES.md. Checkout flags stay off until that succeeds.
4. Validate Gemini, Drive/Sheets/R2 imports, settings saves and remaining frontend/feature parity.
5. Require successful exact-SHA CI, reviewed combined diff and rollback readiness before promotion. The user has requested production deployment after all issues are fixed; that condition is not yet satisfied. No live deployment, real payment or production data change was performed for this reconciliation.
