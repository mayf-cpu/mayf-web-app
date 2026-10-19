# MAYF Work Mode: first improvement batch

Base: 8025493f8ad357a2ed72d6bf1d6b741f8cf10c0d
Local branch: improve/mayf-ui-admin-work

## Changes
- Everyday admin navigation, search across all 19 sections, and all-tools toggle. Section registry, routes and content components retained.
- Mobile menu backdrop, Escape dismissal, focus restoration on dismissal, expanded state, and hidden off-screen controls.
- Removed hardcoded account fallback and replaced technical header badges with readable labels.
- Student navigation occupies a separate desktop header row to reduce crowding.
- Header price reads the existing annual-pass API; unavailable prices show a generic Annual Pass link. Product schema uses configured pricing.
- Fixed Vite/esbuild peer dependency conflict and added dependency lockfile.
- Failed Firebase verification now rejects access; removed acceptance of unverified JWT claims. Genuine verified roles and development behavior otherwise retained.

## Validation
- Production Vite build passes (existing large Firebase bundle warning remains).
- TypeScript compilation passes.
- Authentication regression: 3 tests pass, covering forged privileged payload rejection, verified student/admin roles, and production development-token rejection.
- Git whitespace validation passes.
- No live payment, Firebase login, protected download, Drive sync, or browser visual checks completed.

## Remaining audit findings and work
- EntitlementService stores settings and entitlement records in memory and seeds demonstration data. Persistence requires follow-up before production readiness can be claimed.
- Full student redesign, broader module refactoring, integration regression, and visual QA remain outstanding.
- GitHub branch creation access has been restored. This batch is being submitted on improve/mayf-ui-admin as a draft PR; no merge or production deployment is included.
- Correct Firebase configuration is required: invalid verification no longer silently succeeds.

## Commands
npm ci --ignore-scripts
npm run build
npx tsc --noEmit
node --import tsx --test scripts/auth-regression.test.ts

## Second batch: payment verification and mobile header
- Callback verification now requires the authenticated order owner and binds all supplied gateway/session identifiers to the stored provider and order.
- Razorpay webhook deduplication uses the documented event header, with a stable payload hash fallback; event keys are scoped to the provider.
- Paid webhooks must match the order's amount and currency. Missing orders remain retryable instead of being silently consumed; webhook routes return 503 for processing failures.
- Stripe signatures enforce a five-minute timestamp tolerance and accept any valid v1 signature during rotation. Unpaid completed checkout sessions remain pending; delayed payment events are supported.
- Repaired Stripe admin simulator payload/signature formatting and paise rounding in the Razorpay simulator. Both simulator tools remain available.
- Reduced admin header crowding on narrow screens without removing controls.
- Added `npm test`, including 13 payment regressions alongside the existing 3 authentication regressions. These are isolated local tests using fixtures/mocks, not live gateway tests.

### Production blockers confirmed by code review
- Payment/entitlement state remains in memory; it can be lost on restart and does not reconcile across server instances.
- Gateway adapters still contain demo credential defaults and permissive simulated-payment behavior; checkout falls back to a sandbox modal. Real test-key API flows and fail-closed production setup need a separate correction before release.
- Download file endpoint currently synthesizes text rather than serving the actual registered PDF bytes. Drive content delivery needs verification against the intended storage source.
- Browser QA is unavailable in this environment. No production credentials were used, no charge was made, and no deployment was performed.

### Provider references
- https://razorpay.com/docs/webhooks/validate-test/
- https://docs.stripe.com/webhooks

Second-batch validation: all 16 tests, TypeScript check, production build, and whitespace check passed. The existing large Firebase bundle warning remains.
