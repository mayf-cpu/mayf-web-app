# Google Apps Script Content Registry Setup Guide

This guide describes how to configure the Google Sheet **Content Registry** and **Google Drive** editorial staging area for **Maths at Your Fingertips (mayf.co.in)**.

---

## 1. Architectural Overview

```
[ AI / Teacher Generation ]
           │
           ▼
[ Google Drive Staging Folders ]
 (Holds drafts, videos, PDFs, diagrams)
           │
           ▼
[ Google Sheets "Content Registry" ]
 (Author adds metadata, reviews, sets status -> 'Approved')
           │
           │ (Installable onEdit trigger)
           ▼
[ Google Apps Script (Code.gs) ]
           │
           │ (Authenticated POST to /api/ingestion/webhook)
           │ Bearer <INGESTION_WEBHOOK_SECRET>
           ▼
[ MAYF Server-Side Pipeline ]
 ├─ Authenticates request
 ├─ Retrieves file from Google Drive via Google Drive API
 ├─ Copies to Firebase / Google Cloud Storage production bucket
 ├─ Generates optimized thumbnails
 ├─ Idempotently upserts Firestore /contentItems document
 └─ Records audit log in /importJobs
           │
           ▼ (Webhook Response)
[ Google Sheets Content Registry Updated ]
 ├─ status -> 'Imported'
 ├─ firestore_id -> 'cnt-pdf-...'
 ├─ import_status -> 'SUCCESS'
 └─ last_imported_at -> timestamp
```

### Critical Security Rule
> **Google Drive is NEVER used as the permanent delivery source for paid study material.**
> Approved files are transferred into production Cloud Storage. The original Google Drive File ID is stored privately for auditing and traceability only.

---

## 2. Google Sheet Content Registry Columns

Create a sheet titled **`Content Registry`** with these exact 30 columns:

| Column | Name | Type / Values | Description |
|---|---|---|---|
| A | `content_id` | String | Unique slugified identifier (e.g. `MAYF-C10-ALG-001`) |
| B | `title` | String | Resource title |
| C | `slug` | String | SEO friendly URL slug (`/study/[slug]`) |
| D | `short_description` | String | 1-2 sentence overview for cards |
| E | `description` | String | Detailed curriculum description |
| F | `class` | String | `Class 5`, `Class 6`, ..., `Class 10` |
| G | `category` | String | `Number System`, `Algebra`, `Geometry`, `Trigonometry`, etc. |
| H | `subcategory` | String | Subtopic within category |
| I | `topic` | String | Granular topic name |
| J | `content_type` | Enum | `pdf`, `course`, `testPaper`, `worksheet`, `multiImage`, `singleImage`, `video`, `youtube`, `facebook` |
| K | `access_type` | Enum | `free` or `paid` |
| L | `price` | Number | Price in INR for paid item (0 for free) |
| M | `currency` | String | `INR` |
| N | `annual_pass_included` | Boolean | `TRUE` / `FALSE` |
| O | `download_allowed` | Boolean | `TRUE` / `FALSE` |
| P | `drive_file_id` | String | Google Drive File ID from staging folder |
| Q | `thumbnail_drive_file_id` | String | Optional Drive File ID for custom thumbnail |
| R | `embed_url` | String | For YouTube, Facebook reels, or video URLs |
| S | `tags` | String | Comma separated tags |
| T | `seo_title` | String | Custom title for search engines |
| U | `seo_description` | String | Meta description |
| V | **`status`** | Enum | **`Draft`**, **`Review`**, **`Approved`**, **`Rejected`**, **`Imported`** |
| W | **`visibility`** | Enum | **`Visible`** (public catalogue) or **`Hidden`** (internal storage only) |
| X | `featured` | Boolean | `TRUE` / `FALSE` |
| Y | `sort_order` | Number | Numeric sort order |
| Z | `publish_date` | Date/ISO | Scheduled publication timestamp |
| AA | `firestore_id` | Output | Generated or updated Firestore document ID |
| AB | `import_status` | Output | `SUCCESS` / `FAILED` / `IMPORTING` |
| AC | `import_error` | Output | Human-readable error description if failed |
| AD | `last_imported_at` | Output | UTC timestamp when last imported |

---

## 3. Step-by-Step Google Apps Script Setup

1. Open your Google Sheet.
2. Go to **Extensions > Apps Script**.
3. Replace the contents of `Code.gs` with the provided code from `/google-apps-script/Code.gs`.
4. In `Code.gs`, configure the constants:
   ```javascript
   const CONFIG = {
     WEBHOOK_URL: 'https://mayf.co.in/api/ingestion/webhook', // Or your development/staging URL
     WEBHOOK_SECRET: 'YOUR_SECRET_TOKEN',                    // Must match INGESTION_WEBHOOK_SECRET
     SHEET_NAME: 'Content Registry',
     STATUS_COLUMN_INDEX: 22,
     HEADER_ROW: 1,
   };
   ```
5. Click **Save** (disk icon).
6. In the function dropdown, select **`setupSheetTemplate`** and click **Run**.
   - This sets up all 30 header columns with styling and data validation dropdowns for Status and Visibility.
7. Next, select **`setupInstallableTrigger`** and click **Run**.
   - Grant the requested permissions for `SpreadsheetApp` and `UrlFetchApp`.
   - This creates an installable trigger that detects whenever an editor changes Column V to **`Approved`**.

---

## 4. Usage Workflow

1. Upload the student PDF, diagram, or test paper to your designated Google Drive folder.
2. Copy the Drive file ID from the file URL (e.g. `drive.google.com/file/d/1dr_ABCXYZ.../view` -> `1dr_ABCXYZ...`).
3. Add a new row to the **Content Registry** sheet with metadata and set `status` to `Review`.
4. Once reviewed, change `status` to **`Approved`**.
5. The Apps Script trigger fires automatically:
   - Sets `import_status` to `IMPORTING...`.
   - Calls MAYF's secure import endpoint.
   - Copies file to production Firebase Storage.
   - Updates `status` to **`Imported`**, writes `firestore_id`, and sets `import_status` to `SUCCESS`.
6. If an error occurs (e.g. Drive file permissions), the script sets `import_status` to `FAILED` and writes the exact cause in `import_error`.
7. You can monitor and retry imports anytime on the **Admin → Import & Sync** dashboard!
