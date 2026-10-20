# Functional test status — 20 October 2026

## Current repair pass

Live preview read checks: catalogue returns 20 first-page records, Class 5 filter returns 3, and Pythagoras search returns 2. Health, site settings, homepage layout, AdSense configuration, broadcasts, annual-pass configuration and AI configuration return JSON 200; anonymous admin content returns JSON 401. These response checks do not prove every feature behind those configuration endpoints works.

Browser: public catalogue loads, Load More appends the remaining five resources, and Class 5 filtering displays the three matching resources. The testing browser reached the Google account chooser and password step, but authenticated testing remains blocked by credential approval review. No live admin writes were performed. Fixed the catalogue search field searching only loaded items: it now queries all records with the search filter and ignores superseded responses.


Second repair batch: actual Firebase Auth pagination now feeds student/admin lists; account operations fetch current records, preserve unrelated claims and surface Firebase failures. The add-admin endpoint now actually writes Firebase claims. Ordinary admins cannot modify administrator accounts. Async API rejections now reach JSON error middleware. Removed sample student-list and dashboard-metric fallbacks from these client methods. Five additional local regression tests pass (34 total). Authenticated live account mutations remain untested; no real users were disabled or deleted during tests.


- Owner confirms real administrator sign-in now succeeds. The testing browser has no shared administrator session. Authenticated live write/read-back tests remain pending.
- Fixed the origin shield rejecting same-origin state changes on the configured Cloudflare preview host; unrelated workers.dev origins remain rejected.
- Content/category JSON routes now load Firestore records per operation and atomically commit changes before responding. Conditional writes reject concurrent edits; failed operations restore the previous server state. An initialization marker prevents deleted records from reappearing as seed data.
- Public catalogue, slug lookup, search and autocomplete now use the same persisted content as the admin panel. Draft, hidden and archived records are excluded; premium file locations are omitted from public responses.
- Settings, homepage layout, AdSense and broadcasts reload from Firestore on relevant requests and surface read/write failures. Settings/layout/AdSense caches update only after successful writes. These are not yet conflict-safe multi-document transactions.
- Removed invented initial CMS sales/view/download totals and the unrelated sample PDF automatically attached to newly created content.
- Added regression checks for persistence across fresh repositories, failed-write rollback, validation rollback, public visibility/filter/pagination and Firestore pagination/conflict rejection.
- This repair pass does not complete payment/entitlement persistence, genuine download delivery, Drive integration, analytics. AI and Turnstile are unconfigured according to the last preview health response. Those features must not be described as tested or functional.

The sections below retain the earlier audit context; current repair notes above supersede overlapping catalogue/settings observations.


This is an evidence log, not a statement that the entire application works. Earlier QA_AUDIT.md PASS labels do not establish live end-to-end functionality.

## Earlier executed checks

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
