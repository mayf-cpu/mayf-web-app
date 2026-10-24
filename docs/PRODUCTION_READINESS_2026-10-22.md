# MAYF production readiness — updated 24 October 2026

Production has not been merged or deployed. PR #77 is the integrated release candidate for `mayf-cpu/mayf-web-app`. Stripe is deferred. Checkout, admin refunds, coupons and simulation remain disabled in the normal staging and production configurations.

## Verified acceptance

- Real Google administrator sign-in and authenticated student/admin reads on isolated Worker `staging-acceptance-mayf`.
- Real Algebra Basics PDF imported from the separate staging registry into private R2; repeat import processed zero rows. Hide/restore and class filters passed. Owner completed Turnstile; preview and downloaded bytes matched SHA-256 `2627f39c45a3554cd3cb521c72f1499b50ab95447a634ccc79f6d2da1c993915`.
- Real AI text answers, image equation extraction/solution, owned history and Helpful feedback persisted after reload. An earlier provider request failed; broad provider reliability is not certified.
- Real Razorpay sandbox payment captured INR 1,179 and signed webhook settlement produced the owned paid order and matching downloaded receipt. Full sandbox refund remained pending until genuine signed settlement, then persisted REFUNDED/completed and removed paid access. See `PAYMENT_ACCEPTANCE_2026-10-24.md` for exact references. No live funds were used.
- An actual rollback to a known disabled-commerce staging version passed read-only health, checkout and anonymous-access smoke checks; the current candidate was restored. Run 40100671203.
- Browser layout acceptance at a 320px iframe width covered home, study library, formula deck, Annual Pass, checkout, AI, purchases and admin. No page-wide horizontal overflow was observed. Public learning navigation and admin sidebar worked. This is browser viewport testing, not physical phone/camera testing.
- Private production bucket `mayf-study-materials` created. The accepted real PDF was copied from the isolated staging bucket and independently read back with exact size/hash validation in run 40105575719. It remains private.

## Latest corrections

Catalogue HTTP failures must show unavailable/retry rather than an invented empty inventory. Concurrent Firestore collection reads share a pending OAuth token request. Production gateway settings use separate Firestore collections from staging, preventing encrypted sandbox settings from being loaded with a fresh production Firebase key. Existing staging settings and payment acceptance records are preserved.

Launch display suppresses exact bundled fake contact/community details and unsupported starter formula/coverage claims while retaining owner custom text and financial terms. Homepage video lesson counts and unsupported timed-assessment claims now describe study topics and chapters. Course completion displays verified counts only. AI daily exhaustion reports its actual limit/reset rather than suggesting an immediate retry.

## Release evidence

Run 40107135536 at candidate e8f0fa72e6f1a990cf5bf480bfd52cc90f2324d5 passed 307 application tests, eight Firestore rules scenarios, TypeScript, production dependency audit, frontend build, Worker compilation and staging resource gates. It deployed version f2920373-49c5-4096-b68f-ea9eff27bf80 with all commerce flags false. Subsequent source changes require their own successful CI. Prior run 40105575719 verified the production PDF copy. The updated rules scenarios also deny raw client access to production gateway settings and its revision marker through the existing deny-by-default rules.

## Production blockers and deliberate limits

Read-only Cloudflare metadata confirmed Worker `mayf` and domain mappings `mayf.co.in` / `www.mayf.co.in`. Three required production Worker secrets were absent:

- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `GEMINI_API_KEY`
- `TURNSTILE_SECRET_KEY`

These must be supplied directly through provider secret controls. Encrypted staging secrets cannot be read back and are not extracted. The existing Firebase project `maths-at-your-fingertips` is owner-approved for this development launch; production gateway credentials are now separate. Confirm the Turnstile widget permits both production hostnames and uses the matching secret.

The guarded manual production workflow is prepared: reviewed main SHA, private PDF integrity, resource/secret-name preflight, full checks, rollback version capture, post-deploy HTTP acceptance and automatic rollback on failure. Production deployment cannot proceed until required runtime secrets are configured. The R2 binding is declared in reviewed production configuration and will be installed by deployment.

Live Razorpay keys and the production signed webhook require separate configuration and acceptance before enabling commerce. Provider replay/delay, renewal and failure paths have automated signature/idempotency/concurrency coverage but have not all been exercised with real provider events. Physical camera and free-user quota exhaustion are not live-certified. App Check remains unconfigured. Do not claim these checks passed or enable their gated features implicitly.

Catalogue cleanup completed through the existing recoverable archive: all 25 bundled entries with synthetic Drive IDs and the old temporary QA resource were archived. The active catalogue showed 1 published resource, Algebra Basics, and 27 archived resources (including the previously archived item). Underlying files were preserved; nothing was purged. A failed read is never evidence of an empty catalogue.
