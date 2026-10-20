# Functional test status — 20 October 2026

This is an evidence log, not a statement that the entire application works. Earlier QA_AUDIT.md PASS labels do not establish live end-to-end functionality.

## Executed checks

- TypeScript compilation, Vite production build and git whitespace validation pass.
- Authentication/payment/document-store regression tests pass locally. These use fixtures and mocked external services, not real money or production Firebase sessions.
- Actual Express requests reject anonymous and development admin tokens in production mode and return JSON 404s for unknown API routes.
- Cloudflare workerd/Miniflare starts the bundled Worker. Health returns JSON 200; unauthenticated admin verification and content return JSON 401; unknown API route returns JSON 404.
- Live browser: home page, search navigation, Pythagoras results after loading, and Pythagoras detail/KaTeX rendering observed. Search query links and stale result handling corrected in code; deployed fix still pending.
- Live production API was confirmed to return SPA HTML, not an API response. Backend integration is in draft PR #2, not merged.

## Feature readiness

| Area | Evidence / current limitation | Remaining acceptance check |
| --- | --- | --- |
| Admin login | Worker route works locally; production still static-only. Mock browser profiles no longer count as sessions in proposed fix. | Real Firebase Google account, matching project and authorized domain; authenticated API response. |
| Student login | Google failures now surface errors in proposed fix; demo fallback restricted to development. Email/phone were simulations, not working production providers. | Configure and test actual providers; account recovery and logout. |
| Catalogue and categories | Seed-backed public content exists; admin CMS/category stores are memory-only. | Durable CRUD, concurrent updates, reload/redeploy retention, public hide/show synchronization. |
| Formula deck | One live formula and its math rendering observed. | All links, filters, bookmarks, copy/share, mobile behavior. |
| Search | Live results observed; query-link and race fixes prepared. | Preview browser check of q links and rapid query changes. |
| Courses / media | Code includes example media and seed course structures. | Real owner-supplied lessons/files and entitlement checks for every format. |
| Payment / annual pass | Verification regressions pass. Orders, dedupe history and entitlements are memory-only; demo defaults and checkout simulations remain. | Durable transactions, provider test credentials, verified callbacks/webhooks, retries, refunds; real-money test requires owner. |
| Protected downloads | Registry and authorization code exist; file endpoint currently synthesizes text. | Real PDF/image/video delivery, signed expiring access, Turnstile and entitlement tests. |
| AI Teacher | UI exists; live inference not verified. | Gemini runtime secret/model, quota handling, error behavior and real questions. |
| Drive import | Example jobs/IDs and adapter remain; no real import verified. | Service-account permissions, actual registry, copy to storage, approved/hidden content, repeat import. |
| Branding / layout / ads / broadcasts | Firestore document operations now use HTTPS instead of the native server Firestore client. External writes unverified; service caches still need consistent refresh and failure propagation. | Credentials, durable save/read and public updates across isolates. |
| Students / administrators | Existing admin-user management contains seeded in-memory records. | List actual Firebase users; update/disable/delete/role changes with audit and rollback. |
| Analytics / activity | Demonstration metrics exist. Workers cannot use a local JSON file as durable storage. | Real event pipeline, durable aggregation, accurate empty state and access controls. |
| Legal / navigation / SEO | Pages exist; no completeness claim. | All links, metadata, sitemap, accessibility, actual policy copy and support contacts. |

## Required deployment configuration

In Cloudflare worker `mayf`, runtime variables/secrets are separate from build variables and from Preview secrets. Do not paste private keys in chat or commit them.

- Firebase build values: VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_APP_ID and the other fields listed in .env.example.
- Runtime Firebase credentials: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY; alternatively FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_KEY containing the service-account JSON.
- Firebase Authentication: Google provider enabled; mayf.co.in authorized; preview hostname authorized only if preview sign-in is needed.
- Third-party runtime values: GEMINI_API_KEY, TURNSTILE_SECRET_KEY, actual payment provider keys/webhook secrets, and Drive registry/service-account settings as applicable.
- Preview secrets must be configured independently using staging/test resources. Never test payments with live keys by default.

Do not merge the backend until the open persistence and demonstration-path findings are corrected and the configured preview passes integration tests.
