# Content approval registry

This workflow uses a native Google Sheet with `Content Registry`, `Field Guide`,
`Options`, `Automation` and `Revision History` tabs. The live Google Sheet link
is recorded in the delivery handoff. The connected Google Drive tools can create
and format the sheet, but cannot install Apps Script projects or grant Google
OAuth consent. Creation of the spreadsheet does not activate automation.

## Activation

1. Deploy this change to the website. It adds support for the editorial columns,
   all 12 content formats and authenticated text regeneration.
2. Open the new spreadsheet, then **Extensions > Apps Script**. Use an empty bound
   project and paste `google-apps-script/Editorial.gs` into `Code.gs`.
   Do not install the old `Code.gs` trigger on the same spreadsheet.
3. In Apps Script **Project settings > Script properties**, set
   `MAYF_WEBHOOK_URL=https://mayf.co.in/api/ingestion/webhook` and
   `MAYF_INGESTION_WEBHOOK_SECRET` to the same random 32+ character secret configured
   as `INGESTION_WEBHOOK_SECRET` on the production Worker. Never store it in a
   cell, commit, or chat. Regeneration uses the existing server Gemini credential.
4. Run `installEditorialAutomation` and complete Google's consent flow. This adds
   an installable edit trigger and a five-minute polling trigger. The timer is
   necessary because Sheets API/AI writes do not trigger `onEdit`.
5. Source Drive files need access for the website service account shown in
   **Admin > Import & Sync**. The spreadsheet itself is sent by authorized Apps
   Script and does not need new service-account sharing unless admin manual
   Sheets sync is also desired. For that optional sync, save its spreadsheet ID
   and `Content Registry` tab in Admin, and grant the service account sheet edit
   access for truthful writeback.
6. Use a disposable row to verify Pending does nothing, Rejected creates a text
   revision and returns Pending, and Approved + Visible imports/publishes only
   the reviewed version. Verify actual media and a repeated poll before bulk use.

## Editorial behavior

- `approval_status` is always Pending, Approved or Rejected. It takes precedence
  over legacy `status`. Successful imports leave approval Approved and set
  `import_status=SUCCESS`. Missing/blank editorial approval is Pending.
- Changing ordinary inputs through the UI resets approval to Pending. Select
  Approved last, after completing metadata, permissions and source files. AI/API
  writers must likewise set Pending when changing reviewed inputs, including a
  row that was already imported.
- `class` accepts comma-separated grades; six optional grade dropdown slots are
  combined with it and deduplicated. Subject/subcategory and grades are checked
  against current admin configuration when editorial rows import.
- Enter rejection feedback first, then select Rejected. The original row is
  archived before AI is called. Only title, descriptions, topic, tags and SEO
  text can be regenerated. Files, slug, classifications, prices, download
  permissions and existing publication state remain unchanged. A successful
  revision increments `revision` and returns Pending. No AI output approves itself.
- Failed imports/regenerations remain FAILED without continuous provider retries.
  Correct the cause, select Pending and then Approved/Rejected to retry.
- New Approved + Visible rows are published. Hidden rows import privately.
  Existing admin-hidden/draft/archived content is not republished by a sheet import.
  Rejecting an already published item starts a new editorial revision; it does
  not unpublish its previous approved website version.
- Long videos and image attachments copy to private R2. PDF-like formats accept
  PDF attachments. YouTube uses its validated embed URL, courses use modules JSON,
  formula sheets use equations JSON or a PDF, and other resources can be text.
  Galleries accept up to 20 comma/newline-separated Drive IDs in `drive_file_ids`.
- Downloads require both `download_allowed=TRUE` and explicit
  `download_permission_confirmed=TRUE`. Defaults remain FALSE.
- `publish_date` is a recorded timestamp, not a scheduling feature.
- Script locking prevents overlapping script executions. Snapshot comparisons
  protect text writeback from intervening manual edits. Sheets and Firestore
  are separate systems: an edit/rejection during an already-running import cannot
  atomically revoke its captured approval. An actionable error is recorded if the
  row changes in flight; review the website version before approving again.

## Verification and limits

Regression coverage exercises approval precedence, multiple grades, all format
identifiers, malformed text/metadata, AI output allowlisting, revision history,
AI failure retention, concurrent edits and repeat-poll idempotence. These are
local checks. Google trigger installation, real Gemini regeneration and an actual
approved source import require live acceptance after activation.
