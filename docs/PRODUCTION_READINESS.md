# Production release status

Status: **Not ready to deploy to mayf.co.in.** Production deployment is authorized after the outstanding issues and acceptance checks are resolved. Keep PR #5 in draft until then.

## Verified in the release branch

- 99 application tests pass; TypeScript and the production frontend build pass.
- Eight Firestore emulator security scenarios pass on Java 21 / emulator 1.22.0.
- Production dependency audit reports zero vulnerabilities after pinning the transitive gRPC dependency to patched 1.14.6. Firebase emulator tests pass with that version.
- GitHub release checks passed at 760064c. They run clean install, TypeScript, application tests, rules emulator and frontend build. The next commit adds the production dependency audit gate and authentication fixes and needs its own observed CI result.
- Earlier live preview checks cover CMS/offer persistence, Annual Pass settings, SEO edit/read-back/restore and sharing-menu visibility. Newer authenticated flows still need acceptance after the browser session reset.

## Release blockers

| Blocker | Required result |
| --- | --- |
| Active Firebase security rules | Deploy the hardened rules to the intended project and verify actual owner/admin/browser access. Repository rules and emulator success do not change deployed rules. This workspace currently has no Firebase CLI login or deployment credentials. |
| Private media and downloads | Inspect bucket IAM and any legacy public/token URLs; validate real curriculum files, private access and genuine Turnstile challenges. |
| Commerce | Verify configured provider test checkout, signed callbacks/webhooks, duplicate delivery, real entitlement grants and failure recovery without charging real users. Implement provider refunds/refund reconciliation and limited-offer reservations. |
| AI Teacher | Verify configured Gemini responses, owner-only history/feedback, daily quotas and intended App Check enforcement with real accounts. |
| Drive import | Connect an authorized curriculum registry and verify Drive/Sheets/Storage permissions, actual imports and source write-back. Finish grouped/folder import requirements. |
| Account administration | Live-test logout/account switching, claims, inspector histories and isolated activity/favorites. Security-settings controls still need durable, effective enforcement. Family checkout and cloud bookmark synchronization remain open requirements. |
| Full frontend acceptance | Finish formats, mobile/accessibility, navigation, legal/support/contact content and configuration save/read-back. Preserve existing requested features. |
| Branch consolidation | Compare the outstanding stacked PRs with PR #5 before release so another chat's work is retained. Merge one reviewed release path; do not merge conflicting stacks blindly. |

## Deployment order

1. Finish and test the remaining code and operational configuration.
2. Deploy verified Firebase rules/indexes to the confirmed target project and complete authenticated preview acceptance.
3. Require a successful CI run for the exact release commit, review the combined diff, then merge the release PR.
4. Observe the production Cloudflare deployment for that exact commit and run production smoke checks. Recover through the normal previous deployment/revert path if acceptance fails.

Never put runtime secrets or private service-account keys in repository files or chat. Configure them through the existing service's secret controls.
