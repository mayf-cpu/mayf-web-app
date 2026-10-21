# Functional test status — 21 October 2026

This is an evidence log, not certification that the entire application works. Earlier QA_AUDIT.md PASS labels do not establish live end-to-end functionality.

## Verified in the Cloudflare branch preview

- Genuine Google sign-in for the owner-confirmed backup administrator grants Administrator access. Verified-email checks apply on both client and server; an explicit ADMIN_AUTHORIZED_EMAILS override can revoke default email access.
- The CMS successfully created a clearly labelled QA resource, saved edits and retained them after full reloads. Archive, restore, publish and hide worked through the authenticated UI. Public slug lookup returned the published resource and rejected hidden/archived access. The QA record remains in the recoverable archive and was not permanently purged.
- Branding settings returned a successful Firestore save confirmation through the authenticated UI. This was a save of the existing configuration, not a test of every branding field.
- The category hierarchy loads 19 records. Critical security settings correctly show read-only mode for this ordinary administrator. Category mutation edge cases are tested locally, not yet exercised against live curriculum.
- Public catalogue pagination loads 20 records, then the remaining five. Class 5 filtering shows three records. Search and a Pythagoras detail page with KaTeX rendering were observed. Formula Deck displays 26 formulas; its Class 5 filter displays two.
- The deployed dashboard distinguishes unconnected AI/revenue reporting from actual measured values. Preview health reports Firebase configured and aligned with the web project; Gemini, Turnstile and App Check are not configured.
- Health, settings, layout, ads, broadcasts, annual-pass configuration and AI configuration endpoints returned JSON. Anonymous admin requests return JSON 401. A configuration response does not prove the integration behind it works.

## Repair implementation and local validation

72 regression tests, TypeScript and the production Vite build pass for the 21 October repair batch. The preceding commit passed four workerd API checks; the new Worker runtime check remains unverified because automatic approval review blocked its execution. External-service tests use fixtures where applicable; they do not validate real payments or media delivery.

- Express runs in the Worker via the Node HTTP server adapter. Firestore storage uses authenticated HTTPS REST rather than unsupported native gRPC. Runtime service-account JSON is parsed safely and diagnostics expose only configuration presence.
- Real Firebase tokens are cryptographically verified. Forged/development tokens fail closed in production. Actual Firebase Auth records feed student/admin lists; mutation errors propagate and unrelated custom claims are preserved. No real student account was disabled, deleted or charged during testing.
- Catalogue/category operations read durable state and atomically commit changes before reporting success. Failed writes/validation roll back in-memory changes. An initialization marker prevents seed resurrection; a conditional shared revision protects catalogue-wide invariants across competing isolates.
- Public catalogue, search, autocomplete and slug lookup share the persisted source. Hidden, draft and archived records are excluded. Premium file locations are omitted unless verified access allows them; durable paid-order entitlement delivery remains incomplete.
- New-resource visibility now agrees with its published/draft status. New forms no longer invent Drive IDs or attach an unrelated sample PDF. Duplicate save submissions are prevented. Student onboarding no longer opens over admin pages.
- Category counts and legacy display-name references respect class mappings. Renames preserve stable IDs; reassignment handles ID-linked records. Regressions cover same-named Class 8/Class 10 categories and protected deletion.
- Settings/layout/ads/broadcast routes refresh persisted state and surface storage failures. These are not yet conflict-safe multi-document transactions.
- Dashboard cards no longer claim fabricated conversion, AI success rates, revenue, uptime percentages or infrastructure guarantees. The admin content background was corrected for readable headings.
- Root error recovery renders independently of navigation/auth providers. Reloading after stale deployment chunks restores current assets.

## 21 October continuation batch

- Resumed from GitHub head `7fe28ff`, which already contains the admin contrast fix. Existing live CMS evidence above belongs to the preceding session and was not repeated in this new browser.
- Extracted the existing conditional Firestore repository for reuse with a separate coupon revision marker. Coupon/promotion CRUD now reads durable state and buffers success until commit; conflicts and failed writes reject and roll back. Empty/deleted offers stay deleted across fresh instances. Production no longer starts with invented coupon use or published demo promotions.
- Checkout and coupon quotes rebuild canonical line items from the persisted catalogue. Client-supplied price, title, annual-pass flag and gross amount cannot override a resource. Hidden/unknown/free products, duplicate digital purchases, invalid quantities and unsupported currencies are rejected. Pass enablement and promotion dates affect the price. Existing USD pass pricing remains the server-set $29; other resources are INR only.
- Coupon validation uses the verified session identity, enforces actual product scope, rejects malformed configuration and prevents INR discounts from applying to USD orders. Callback and webhook paths record redemption before setting a previously unpaid order paid. The subsequent commerce repair now places this transition and entitlement grant in one conditional atomic commit.
- Ordinary resource orders no longer grant an Annual Pass. Individual paid-resource entitlement delivery remains incomplete and must be verified before checkout rollout.
- Eleven new regression tests cover cart tampering, scope/currency validation, coupon/promotion restart persistence, rollback and production defaults. Tests use a Firestore fixture; they are not live Firebase acceptance evidence.
- After owner-assisted sign-in, actual Administrator access was confirmed for the backup account. QA_DISABLED_20261021 was created disabled, edited and read back after full reloads. A disabled QA promotion was created and read back after a reload; the public promotions API excluded it. Both records remain disabled, not permanently deleted.
- Live testing exposed initial coupon requests using a stale hard-coded development token. Commit 896f308 replaces cached prop tokens with current Firebase ID tokens obtained for every coupon/promotion request, including the simulator. Local tests/build pass; deployed-first-load verification is pending.
- Promotion edits can now clear a previously associated coupon. Disabled promotion creation uses a Save Draft label. The fix has a regression test.

## Commerce persistence continuation

- One revision and atomic Firestore commit now covers orders, webhook delivery records, coupons, promotions, pass grants/history and gateway/pass configuration. Payment and pass routes send success only after commit; failed writes restore the previously read state. Verified sessions and premium resource lookups refresh durable entitlement state.
- Gateway credentials use AES-GCM encryption before storage and masked API output. The key uses PAYMENT_SETTINGS_ENCRYPTION_KEY when set, otherwise the server service-account private key; retain that key during rotation or reconfigure gateway credentials. The settings collection remains server-only under the repository's default-deny client rules. Live deployed rules have not been independently audited in this session.
- Renewals add days after the existing active expiry; duplicate callback/webhook delivery does not add days or redeem coupons again. Individual paid-resource lookup now checks the buyer's persisted paid order; refunded orders do not grant access.
- Admin order ledger no longer substitutes sample orders or invented payment IDs when empty. Gateway and pass config persistence are covered locally, not yet live mutation-tested.
- Seven new regression tests exercise restart recovery, atomic rollback, duplicate webhook/callback handling, settings encryption, renewal continuity and buyer/product access scope. 72 total tests, TypeScript and the production build pass. Provider adapters and real file delivery are still pending and no real payment has been charged.

## Provider, file delivery and pricing continuation

- Razorpay and Stripe now call genuine provider APIs for configured test keys as well as live keys. API errors cannot silently create simulated checkout IDs. Stripe session creation includes success/cancel URLs and checkout redirects to its validated hosted URL. The return flow verifies the session with the backend.
- Razorpay callbacks query the provider and require captured funds for the correct order; amount/currency are compared with the stored order. Provider tests mock HTTPS; no external payment or charge was made.
- Checkout no longer prefills sample personal details or automatically assumes a demo coupon. It shows the configured added tax and effective promotional price, blocks checkout until pricing loads and sales are enabled, and no longer submits an invented Turnstile token.
- Download links now survive Worker restarts and use conditional single-use claims. Real CMS attachment bytes replace the synthetic text labelled as PDF. Approved hosts, no automatic redirects, byte limits, PDF signature checks and network binding have regression coverage. Upstream source failures do not consume a ticket. Owner-provided directly fetchable assets and real Turnstile configuration remain prerequisites for live acceptance. Configure Firestore TTL for expired downloadTickets during operational setup.
- Live review exposed the Annual Pass section's fake save label. It now loads/saves actual persisted membership settings, with separate regular/promotional price and date controls. The family-price field is retained and saved as a proposal; family checkout/profile linking remains unavailable and is labelled accordingly. Invalid membership settings are rejected.
- 72 automated tests, TypeScript and the production build pass. The payment persistence deployment at 58b8ec5 is reported successful by Cloudflare; this newest batch has not yet been live-verified.

## Still incomplete

| Area | Remaining work / acceptance check |
| --- | --- |
| Payments and annual pass | Conditional atomic persistence for orders, webhook deduplication, coupon redemption and entitlements is now implemented and passes restart/rollback fixture tests; authenticated live payment/pass acceptance is pending. Canonical catalogue/pass pricing is implemented locally; genuine test-key support and Stripe redirect/return flows are implemented; verify them with configured provider test accounts. Configure test keys; verify callbacks, retries, refunds and entitlement delivery without charging real users. Production simulations are blocked. |
| Coupons and promotions | Firestore persistence, failed-write rollback and restart recovery are implemented and tested locally. Authenticated preview create/edit/reload checks passed for a disabled QA coupon; create/reload and public exclusion passed for a disabled QA promotion. Redemption, order completion and entitlement grant now share an atomic commit. Reserving limited offers across unpaid checkouts remains pending. |
| Media and downloads | Download authorization now resolves visible published CMS attachments and stores network-bound one-use tickets in Firestore. Delivery fetches genuine bytes from approved hosts, rejects redirects/oversized files and checks the PDF header. Fixture tests pass. Owner media, real Turnstile verification and live end-to-end downloads are still required; example assets are not validated curriculum. |
| AI Teacher | Configure Gemini runtime secret/model; verify real answers, quotas, failures and access limits. |
| Turnstile / App Check | Configure intended protections and test real verification and rejection paths. |
| Drive import | Replace example IDs/adapter with an actual authorized registry, storage import and repeat-import checks. |
| Analytics, activity and audit | Remove demonstration telemetry and memory-only reporting; persist real events and accurate aggregates. |
| Configuration | Exercise field edits, reload/public read-back, failures and concurrent saves for layout, ads, broadcasts, SEO and other settings. Branding save and configuration reads alone are insufficient. |
| User administration | Live directory and guarded mutation workflows require further testing. Do not permanently delete real users for QA. |
| Frontend coverage | Finish all course/media formats, bookmark/copy/share flows, account recovery/logout, mobile/accessibility, navigation, legal content, SEO and support links. |

## Deployment status and required configuration

Changes are committed to the real GitHub repository in draft PR #5, branch fix/backend-runtime-firebase. The authenticated branch preview is used for integration tests. Main-domain rollout remains pending readiness; preview success does not establish mayf.co.in deployment.

Runtime secrets and build variables are separate, and production and preview secrets are separate. Never paste private keys into chat or commit them.

- Firebase public build configuration must match the runtime project. Google sign-in must be enabled with the intended domain authorized.
- Runtime Firebase accepts FIREBASE_SERVICE_ACCOUNT_JSON / GOOGLE_SERVICE_ACCOUNT_KEY or the documented split service-account fields. Preview Firebase is configured and has completed actual Firestore writes.
- Gemini, Turnstile, payment test-provider/webhook and Drive values must be configured as applicable. Use test resources for integration verification.

Keep this PR in draft until the open durability and demonstration-path findings are corrected and the configured preview passes the remaining acceptance checks.
