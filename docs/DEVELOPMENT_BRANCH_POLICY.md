# MAYF branch and release workflow

## Active branches
- `develop/mayf`: ongoing fixes and feature work. Prefer grouped commits on this branch over a new pull request per fix.
- `staging/consolidated-mayf-2026-10-21`: frozen integration candidate (PR #77), based on the existing staging and deployment-safety history. Only validated changes are promoted here.
- `main`: production baseline. Do not merge to or deploy from main until release acceptance and explicit deployment approval.

## Existing pull requests
PR #5 is the backend baseline; PRs #71-#74 contain integrated staging and deployment changes; PRs #75-#76 contain audit fixes ported to PR #77. Do NOT indiscriminately bulk-merge or bulk-close older stacked PRs: several branches diverge, and some carry independent tests. Preserve all branches until unique code and tests are compared against the candidate. PR #77 is not by itself proof all historical PRs were safely merged.

## Promotion gates
1. Confirm the exact commit SHA and branch being tested.
2. Require clean dependency installation, TypeScript check, regression suite and production build.
3. Review all historical PR diffs for any missing unique code/tests.
4. Deploy to isolated non-production staging with separate Firebase, R2 and payment test credentials; verify the hostname guard and secret preflight.
5. Run authenticated CMS, imports, PDF download, payment/webhook/refund and audit acceptance checks with test accounts/data; test no production writes.
6. Record results, unresolved limitations and rollback instructions.
7. Only after approvals, prepare an explicit reviewed release PR to `main`; do not merge automatically.

## Rules
- Existing features must not be removed without approval.
- No real payments, destructive production mutations or production deployment during staging verification.
- Do not treat queued CI as passed.
- Do not close older PRs merely to reduce the displayed count.
- For bugs found during staging, fix on `develop/mayf`, test, then promote reviewed commits to staging.

## Known outstanding issue
Administrator Firebase Auth role changes and Firestore audit persistence are separate transactions, so an audit failure after a role change requires operator reconciliation. Not all non-CMS audit writes are durable yet.
