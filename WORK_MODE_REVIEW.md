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
