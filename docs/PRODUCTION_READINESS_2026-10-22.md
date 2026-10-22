# MAYF production-readiness review — 22 October 2026

Release scope: Razorpay INR Annual Pass, published study resources and the existing admin/student tools. The user explicitly deferred Stripe. Its adapter remains in source; customer checkout and internal service routing reject it for this release. No production deployment or commerce flag change has occurred.

## Automated evidence

The reconciled candidate includes the other chat's changes through c3b6bcf: staging Firebase/Cloudflare isolation checks, registry source validation, authenticated import routes, webhook secrets, truthful import/social settings and staging workflow registration. These changes were preserved before applying this review's fixes.

Local checks: 257 application tests pass, including 198 actual Express HTTP checks over registered admin/student routes with anonymous and forged sessions. TypeScript and production frontend build pass. Exact-commit CI, including the eight rules emulator scenarios and Worker smoke, must pass before promotion; its run is recorded on PR #77 after completion.

| Module | Automated coverage exercised | Live acceptance still required |
|---|---|---|
| Authentication, roles, sessions | Token/role rejection, account/session isolation, scoped history, configured Firebase CSP origin and injection rejection | Google sign-in, logout, admin/student switching in the deployed candidate |
| CMS, categories, layout, SEO, offers | Persistence, publication/visibility filtering, conditional writes, category relationships, query/search, settings validation | Create/edit/hide/restore/reload through staging admin and public pages |
| Student purchases and receipts | Owner-only transaction receipt, real amount/tax/currency/date, paid/refunded eligibility, rejection of corrupt or unrelated orders | Delayed webhook order appears for the correct account; receipt agrees with provider |
| PDF catalogue and downloads | Published downloadable CMS projection; R2 byte limits/PDF integrity, private authorization, single-use token races and access rechecks | Real Drive PDF import, R2 object retrieval, Turnstile, download/render and revoked access |
| AI Teacher | Durable quotas, owned history/rating and measured/error states | Real Gemini answer, limits and history across a deployed restart |
| Razorpay, renewals, coupons, refunds | Mock provider API validation, real HMAC validation, durable/idempotent settlement and refunds, reservation/renewal conflicts | Real sandbox charge/refund, delayed/duplicate signed webhooks, concurrency and reconciliation |
| Security/admin audit | SuperAdmin-only maintenance schema, atomic setting/audit save, cold reload, failed-write and stale-revision rejection | Toggle maintenance in staging; confirm checkout pauses while admin and webhooks remain available |
| Private API perimeter | 198 real HTTP authentication/cache checks, cross-site mutation rejection | Authenticated role-specific browser workflows against isolated services |
| Stripe | Explicitly rejected by release policy; saved Stripe defaults cannot reroute INR purchases | Deferred by user; does not block this release scope |

## Issues repaired in this review

- Maintenance previously returned an in-memory success without durable enforcement. It now saves the setting and audit record in one conditional commit; public checkout availability and order creation read the persisted value. The security editor reports load/save failures and does not show invented defaults as saved configuration.
- Early storage failures could precede security/private-cache headers. Initialization now runs after those protections, and the complete registered private API surface is exercised over HTTP.
- The content policy omitted Firebase's configured authentication helper origin. It now allows the exact validated production/custom or isolated staging auth origin and Google authentication resources. No arbitrary origin or directive can be injected. Reference: https://firebase.google.com/docs/auth/web/redirect-best-practices.
- The active student purchase screen showed a fictional paid fallback after empty or failed history loads, retained account data across delayed responses, and downloaded a text file labelled PDF with sample tax identifiers and amounts. It now clears account state, cancels old requests, distinguishes loading/empty/failure, and downloads a truthful payment receipt from the owned saved order. A merchant GST tax invoice is not fabricated.
- Student downloads used static sample IDs and invented file sizes/page counts. Cards now come from the published CMS PDF catalogue with pagination, retry/empty states and current IDs for the existing secure download flow. Unknown size/page data and membership expiry/pricing are not invented.
- Audit CSV export now includes the current Firebase authorization header, validates the response and displays download errors. Failed audit reads are no longer silently replaced with an empty successful history.

## Concrete live-test blockers

Cloudflare currently presents its sign-in page in the available browser. No authenticated hosting session was available to inspect or deploy the integrated staging Worker. The local host is not reachable from that browser, so the newly built UI has not received desktop/mobile visual acceptance. The attempted official local browser download returned invalid/truncated archives; no local browser test is counted as passed.

An authenticated Cloudflare session is needed to verify the isolated Worker, R2 and secrets metadata and continue staging deployment. Separate staging Firebase/service-account, Drive registry/folder access, Turnstile and Gemini configuration, a test student/admin, and Razorpay test keys/webhooks must then be verified on that candidate. Existing account secrets must be entered through provider/secure interfaces, never committed or pasted into chat.

Production remains blocked until the applicable live checks above pass. Passing automated checks does not certify those external workflows. Keep checkout, coupon checkout, admin refunds and simulation off until their individual acceptance gates are met. Preserve a rollback version and record the final SHA and deployment result.
