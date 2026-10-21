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

82 regression tests, TypeScript and the production Vite build pass for the 21 October repair batch. The preceding commit passed four workerd API checks; the new Worker runtime check remains unverified because automatic approval review blocked its execution. External-service tests use fixtures where applicable; they do not validate real payments or media delivery.

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
- Seven new regression tests exercise restart recovery, atomic rollback, duplicate webhook/callback handling, settings encryption, renewal continuity and buyer/product access scope. 82 total tests, TypeScript and the production build pass. Provider adapters and real file delivery are still pending and no real payment has been charged.

## Provider, file delivery and pricing continuation

- Razorpay and Stripe now call genuine provider APIs for configured test keys as well as live keys. API errors cannot silently create simulated checkout IDs. Stripe session creation includes success/cancel URLs and checkout redirects to its validated hosted URL. The return flow verifies the session with the backend.
- Razorpay callbacks query the provider and require captured funds for the correct order; amount/currency are compared with the stored order. Provider tests mock HTTPS; no external payment or charge was made.
- Checkout no longer prefills sample personal details or automatically assumes a demo coupon. It shows the configured added tax and effective promotional price, blocks checkout until pricing loads and sales are enabled, and no longer submits an invented Turnstile token.
- Download links now survive Worker restarts and use conditional single-use claims. Real CMS attachment bytes replace the synthetic text labelled as PDF. Approved hosts, no automatic redirects, byte limits, PDF signature checks and network binding have regression coverage. Upstream source failures do not consume a ticket. Owner-provided directly fetchable assets and real Turnstile configuration remain prerequisites for live acceptance. Configure Firestore TTL for expired downloadTickets during operational setup.
- Live review exposed the Annual Pass section's fake save label. It now loads/saves actual persisted membership settings, with separate regular/promotional price and date controls. The family-price field is retained and saved as a proposal; family checkout/profile linking remains unavailable and is labelled accordingly. Invalid membership settings are rejected.
- 82 automated tests, TypeScript and the production build pass. The payment persistence deployment at 58b8ec5 is reported successful by Cloudflare; this newest batch has not yet been live-verified.

## SEO, ledger export and configuration follow-through

- The deployed membership form completed a real save of the current price settings and retained the values after a full reload. The deployed order screen shows zero actual orders rather than demonstration transactions. No user was charged.
- Order CSV export is now connected to the actual ledger, uses the order currency, quotes CSV cells and guards spreadsheet formula prefixes. Request failures are surfaced instead of being treated as an empty successful ledger. Live export download still requires verification after deployment.
- SEO configuration now has persistent authenticated writes with validation and public read-back. Homepage metadata and public canonical links use this configuration; page-specific titles remain specific. Preview meta tags prohibit indexing.
- robots.txt and sitemap.xml are routed through the Worker. Sitemap generation reads current persisted CMS state and no longer restores hidden seed resources. Worker-preview robots prohibit indexing. Metadata edits and the new live routes still await deployment acceptance.
- Production Turnstile verification now rejects a missing or known test secret instead of submitting a fallback test key. Downloads remain blocked until a real secret/site-key pair is configured. The Node API regression verifies this failure path.
- 82 regression tests, TypeScript and the production build pass for the reporting/SEO batch. The earlier e34ea6b provider/delivery batch has a reported successful Cloudflare build and deployment.

## AI response integrity and history

- Missing/unavailable Gemini now returns a truthful 503 instead of a generic fabricated solved answer. Demo history is no longer exposed in production. Signed-in responses are persisted with canonical userId ownership, and history/rating endpoints require a verified owner. Anonymous sessions have no shared server history.
- AI request quotas are persisted per identity hash and IST day with conditional conflict retries; separate isolates cannot spend the same last allowance. These count requests, including upstream failures. App Check enforcement now cryptographically verifies the token instead of checking header presence.
- AI activity reads stored sessions and measured tokens/time/feedback. Fixed sample telemetry has been removed. No genuine Gemini answer was generated because the runtime key remains missing.
- 82 regression tests, TypeScript and the production build pass. Tests cover configured failure paths, anonymous history/rating denial and quota restart/concurrency behavior; live Gemini/App Check acceptance still requires configuration.

## Drive/Sheets importer continuation

- The importer now obtains scoped service-account OAuth tokens, reads real Drive metadata/content, exports supported native Google files as PDF, enforces format/size checks and uploads actual bytes into the configured bucket. It verifies the returned stored object name/size instead of inventing a URL. Missing permission/API/bucket failures are explicit.
- Registry processing atomically saves CMS content and its import job through the shared catalogue revision. Stable content IDs update the same record on repeat import. Only Approved/Imported rows may import, and Hidden resources stay private. Retrying never invents a replacement Drive ID or automatically approves a rejected row.
- The main Import section loads/saves an actual spreadsheet connection, reads real jobs and syncs up to five Approved rows per run. Successful/failed results are written back to the registry metadata using RAW values. Apps Script webhook requests require an explicitly configured secret; the old known default is never accepted.
- Private imported Storage assets can be fetched server-side for authenticated downloads. Imported image thumbnails use a visible-resource image relay with signature/size checks, without exposing the underlying storage URL.
- Six new fixture tests cover genuine bytes/upload verification, Drive permission rejection, registry parsing/write-back, CMS idempotency/visibility and webhook configuration. 82 tests, TypeScript and the production build pass. These do not prove live Drive/Sheets/Storage permission or a real import; an authorized curriculum registry source still needs to be configured.
- Connected Drive discovery found an existing social publishing queue rather than a curriculum registry with the required columns. It was left unchanged; no guide creation or publishing automation was resumed.

## Still incomplete

| Area | Remaining work / acceptance check |
| --- | --- |
| Payments and annual pass | Conditional atomic persistence for orders, webhook deduplication, coupon redemption and entitlements is now implemented and passes restart/rollback fixture tests; authenticated live payment/pass acceptance is pending. Canonical catalogue/pass pricing is implemented locally; genuine test-key support and Stripe redirect/return flows are implemented; verify them with configured provider test accounts. Configure test keys; verify callbacks, retries and entitlement delivery without charging real users. The old fake refund endpoint now rejects requests explicitly; provider refunds and refund-webhook reconciliation remain to be implemented. Production simulations are blocked. |
| Coupons and promotions | Firestore persistence, failed-write rollback and restart recovery are implemented and tested locally. Authenticated preview create/edit/reload checks passed for a disabled QA coupon; create/reload and public exclusion passed for a disabled QA promotion. Redemption, order completion and entitlement grant now share an atomic commit. Reserving limited offers across unpaid checkouts remains pending. |
| Media and downloads | Download authorization now resolves visible published CMS attachments and stores network-bound one-use tickets in Firestore. Delivery fetches genuine bytes from approved hosts, rejects redirects/oversized files and checks the PDF header. Fixture tests pass. Owner media, real Turnstile verification and live end-to-end downloads are still required; example assets are not validated curriculum. |
| AI Teacher | Genuine responses, stored owner-only history, ratings, durable quotas and enforced App Check verification are implemented. Configure Gemini runtime secret/model and verify actual answers, provider errors and access limits. |
| Turnstile / App Check | Configure intended protections and test real verification and rejection paths. |
| Drive import | Real API transfer, durable CMS/job persistence, source configuration and repeat-import fixture checks are implemented. Configure an authorized curriculum registry, required API access and service-account sharing, then verify real source files and write-back. Folder traversal, full multi-image grouping and automatic schedule wiring remain open. |
| Analytics, activity and audit | Analytics now uses durable daily event counters and verified paid orders, without demonstration figures. Concurrency, restarts, IST periods and client purchase spoofing have fixture coverage. Live dashboard acceptance, user activity and audit durability still need completion. |
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

## Durable analytics continuation

- Replaced the fabricated baseline and filesystem-only analytics with daily Firestore counters and conditional retry writes. Today/7d/30d/all use IST calendar dates. Public purchase, AI and download events cannot fabricate money or authoritative usage. Server file delivery records files served; AI figures use saved successful sessions.
- Dashboard financials come from paid orders after discount plus tax, exclude refunded/pending orders, and keep currencies separate. Current pass counts use real unexpired entitlements. Overview metrics and social sharing now read the same saved source.
- Removed invented unique-user/session/renewal figures and false O(1)/zero-scan claims. Unmeasured fields export as null, UI explains measurement scope, failed reads show errors, and JSON export remains available. Reset no longer recreates fictional data or deletes history. Public activity is rate-limited and daily content dictionaries are bounded. Full dashboard queries currently enumerate stored rollups/orders/passes/AI sessions; indexed or precomputed financial rollups will be needed as volume grows.
- Three new tests verify zero initial data, rejected client financial events, concurrent writes, restart recovery, IST midnight selection and ledger currency/status handling. 85 tests, TypeScript and the production build pass. The Worker dry-run check remains unverified following the earlier automatic approval rejection.
- Authenticated live SEO edit/save/full-reload read-back passed on the preview. The temporary QA title was restored to the original title. SEO form fields now have accessible labels.

## Audit durability continuation

- Removed fabricated security/refund/user audit records. Audit reads and CSV export load persisted server-only records; CSV cells are quoted and spreadsheet-formula prefixes are guarded. Read errors are visible, and CSV requests now carry the current Firebase token.
- Catalogue/commerce repository operations stage audit entries per asynchronous operation and append them to the same conditional atomic commit. A rejected or failed transaction does not retain a success audit. Separate Firebase Auth and settings mutations await durable audit writes; those external operations and audit storage cannot share one Firestore transaction, so a later audit failure can follow a completed external mutation.
- Download authorization/delivery audit records are persisted instead of kept in a Worker array. Administrative download history reads saved records. Configure retention/TTL appropriate to operational policy; current audit retrieval enumerates the collection before applying the display limit.
- The privileged legacy set-claims endpoint now actually updates Firebase rather than returning invented success. It validates booleans, preserves unspecified claims, updates role flags together and blocks self-demotion through this route. No live user claims were changed for QA.
- Three tests cover no initial sample audit data, fresh-service recovery, CSV handling, atomic catalogue/audit persistence, failed-write rollback and failed-response discard. 88 automated tests, TypeScript and production build pass.
- Cloudflare reports successful deployment of e9e2379 (analytics). The browser reset removed the authenticated session, so new analytics/audit UI acceptance and live CSV exports remain pending; earlier authenticated SEO save/read-back/restore was completed before that reset. Security configuration persistence/enforcement and wider student-activity integration remain open.

## Public-page follow-through

- Live guest formula favorite add/reload/read-back passed; the QA favorite was removed afterward. Share menu showed canonical public social URLs without posting to any platform. One blank page after a deployment recovered on the next reload; the cause is not established.
- Public UI testing exposed the hero's clipped share popover. Share popovers now render in a body portal, stay inside the viewport, choose space above/below the button and scroll internally. Decorative hero watermarks retain their own clipping. Live deployed visual acceptance of this fix is pending.
- Formula copy actions now await clipboard completion and show browser-blocked errors rather than prematurely reporting success. Share copy fallback checks whether the copy actually succeeded. The cloud browser did not provide copied text, so clipboard success is not certified.
- Cloudflare reports successful build/deployment of 949dba3 (durable audit batch). 88 automated tests passed for that batch; subsequent frontend fixes pass TypeScript and the production build.

## Student activity isolation

- Removed invented starter activity and recently viewed records. Old act-sample local entries are filtered out. New accounts start with an empty history.
- In-memory activity and recently viewed caches reset on account changes/sign-out. Subscribers are scoped to a user; a previous account's delayed Firestore result cannot replace current activity. Dashboard requests also check the currently displayed account before applying a response.
- Firestore activity writes strip undefined optional fields, which previously caused SDK rejection. Client activity is still reported usage, not authoritative proof of purchases or entitlement. Live cross-account/offline acceptance, retention/index configuration, and connection of administrator profile history to the durable ledger remain pending. The legacy shared local bookmark cache also requires account scoping.
- Two regression tests cover account switching/sign-out isolation, owner filtering and a delayed previous-account result. 90 automated tests, TypeScript and production build pass.
- Cloudflare reports successful deployment of 3e546f9. Live visual inspection confirms the complete sharing menu is visible above its trigger, with all channels and copy control no longer clipped. No external social post was sent.
