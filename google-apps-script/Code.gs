/**
 * =========================================================================
 * Maths at Your Fingertips (MAYF) - Content Registry Ingestion Trigger
 * =========================================================================
 * 
 * Google Apps Script for automated editorial staging ingestion into production.
 * 
 * WORKFLOW:
 * 1. AI-generated and teacher content is staged in defined Google Drive folders.
 * 2. Editors fill metadata in the Content Registry Google Sheet.
 * 3. When an editor sets 'status' (Col 22) to 'Approved', this script:
 *    - Captures the row metadata.
 *    - Sends an authenticated payload to the MAYF server-side import webhook.
 *    - Server transfers files from Google Drive to Production Cloud Storage.
 *    - Updates the sheet with:
 *        - status -> 'Imported'
 *        - firestore_id -> generated or updated Firestore document ID
 *        - import_status -> 'SUCCESS' or 'FAILED'
 *        - import_error -> clear human-readable error if failed
 *        - last_imported_at -> UTC timestamp
 * 
 * INSTALLATION:
 * 1. In your Google Sheet, open Extensions > Apps Script.
 * 2. Paste this entire code into Code.gs.
 * 3. Update MAYF_WEBHOOK_URL and INGESTION_WEBHOOK_SECRET in Properties Service
 *    or edit the constants below.
 * 4. Run `setupInstallableTrigger()` once from the toolbar to enable edit detection.
 */

// Production or Staging Webhook Configuration
const CONFIG = {
  // Replace with your live app domain (e.g., https://mayf.co.in or your Cloud Run / AI Studio dev URL)
  WEBHOOK_URL: 'https://mayf.co.in/api/ingestion/webhook',
  
  // Must match INGESTION_WEBHOOK_SECRET in your .env configuration
  WEBHOOK_SECRET: 'mayf_ingest_secret_change_in_production_2026',
  
  SHEET_NAME: 'Content Registry',
  STATUS_COLUMN_INDEX: 22, // Column V: 'status'
  HEADER_ROW: 1,
};

// 30 Column Mapping Dictionary (1-indexed)
const COL = {
  CONTENT_ID: 1,              // A
  TITLE: 2,                   // B
  SLUG: 3,                    // C
  SHORT_DESCRIPTION: 4,       // D
  DESCRIPTION: 5,             // E
  CLASS: 6,                   // F
  CATEGORY: 7,                // G
  SUBCATEGORY: 8,             // H
  TOPIC: 9,                   // I
  CONTENT_TYPE: 10,           // J
  ACCESS_TYPE: 11,            // K
  PRICE: 12,                  // L
  CURRENCY: 13,               // M
  ANNUAL_PASS_INCLUDED: 14,   // N
  DOWNLOAD_ALLOWED: 15,       // O
  DRIVE_FILE_ID: 16,          // P
  THUMBNAIL_DRIVE_FILE_ID: 17,// Q
  EMBED_URL: 18,              // R
  TAGS: 19,                   // S
  SEO_TITLE: 20,              // T
  SEO_DESCRIPTION: 21,        // U
  STATUS: 22,                 // V (Draft | Review | Approved | Rejected | Imported)
  VISIBILITY: 23,             // W (Visible | Hidden)
  FEATURED: 24,               // X
  SORT_ORDER: 25,             // Y
  PUBLISH_DATE: 26,           // Z
  FIRESTORE_ID: 27,           // AA (Updated by server)
  IMPORT_STATUS: 28,          // AB (Updated by server)
  IMPORT_ERROR: 29,           // AC (Updated by server)
  LAST_IMPORTED_AT: 30,       // AD (Updated by server)
};

/**
 * Creates custom menu when Google Sheet is opened.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('MAYF Content Ingestion')
    .addItem('Sync All Approved Rows Now', 'syncAllApprovedRows')
    .addItem('Test Webhook Connection', 'testWebhookConnection')
    .addSeparator()
    .addItem('Setup Sheet Columns Template', 'setupSheetTemplate')
    .addItem('Install Automatic Edit Trigger', 'setupInstallableTrigger')
    .addToUi();
}

/**
 * Installable trigger detecting when 'status' column is set to 'Approved'.
 * Note: Installable edit triggers have full network permissions (UrlFetchApp).
 */
function onEditTrigger(e) {
  if (!e || !e.range) return;

  const sheet = e.range.getSheet();
  if (sheet.getName() !== CONFIG.SHEET_NAME) return;

  const row = e.range.getRow();
  const col = e.range.getColumn();

  // Check if edited cell is the 'status' column and row is below header
  if (col === CONFIG.STATUS_COLUMN_INDEX && row > CONFIG.HEADER_ROW) {
    const newValue = String(e.value || '').trim();
    if (newValue === 'Approved') {
      ingestSingleRow(sheet, row);
    }
  }
}

/**
 * Ingests a single row by sending its metadata to the secure server endpoint.
 */
function ingestSingleRow(sheet, rowNumber) {
  const rowData = sheet.getRange(rowNumber, 1, 1, 30).getValues()[0];
  const contentId = String(rowData[COL.CONTENT_ID - 1] || '').trim();

  if (!contentId) {
    sheet.getRange(rowNumber, COL.IMPORT_ERROR).setValue('Missing content_id in Column A');
    sheet.getRange(rowNumber, COL.IMPORT_STATUS).setValue('FAILED');
    return;
  }

  // Set visual feedback
  sheet.getRange(rowNumber, COL.IMPORT_STATUS).setValue('IMPORTING...');
  SpreadsheetApp.flush();

  const payloadItem = {
    content_id: contentId,
    title: String(rowData[COL.TITLE - 1] || ''),
    slug: String(rowData[COL.SLUG - 1] || ''),
    short_description: String(rowData[COL.SHORT_DESCRIPTION - 1] || ''),
    description: String(rowData[COL.DESCRIPTION - 1] || ''),
    class: String(rowData[COL.CLASS - 1] || 'Class 10'),
    category: String(rowData[COL.CATEGORY - 1] || 'Algebra'),
    subcategory: String(rowData[COL.SUBCATEGORY - 1] || ''),
    topic: String(rowData[COL.TOPIC - 1] || ''),
    content_type: String(rowData[COL.CONTENT_TYPE - 1] || 'pdf'),
    access_type: String(rowData[COL.ACCESS_TYPE - 1] || 'free').toLowerCase(),
    price: Number(rowData[COL.PRICE - 1] || 0),
    currency: String(rowData[COL.CURRENCY - 1] || 'INR'),
    annual_pass_included: Boolean(rowData[COL.ANNUAL_PASS_INCLUDED - 1] !== false),
    download_allowed: Boolean(rowData[COL.DOWNLOAD_ALLOWED - 1] !== false),
    drive_file_id: String(rowData[COL.DRIVE_FILE_ID - 1] || '').trim(),
    thumbnail_drive_file_id: String(rowData[COL.THUMBNAIL_DRIVE_FILE_ID - 1] || '').trim(),
    embed_url: String(rowData[COL.EMBED_URL - 1] || '').trim(),
    tags: String(rowData[COL.TAGS - 1] || ''),
    seo_title: String(rowData[COL.SEO_TITLE - 1] || ''),
    seo_description: String(rowData[COL.SEO_DESCRIPTION - 1] || ''),
    status: 'Approved',
    visibility: String(rowData[COL.VISIBILITY - 1] || 'Visible'),
    featured: Boolean(rowData[COL.FEATURED - 1]),
    sort_order: Number(rowData[COL.SORT_ORDER - 1] || 100),
    publish_date: rowData[COL.PUBLISH_DATE - 1] ? new Date(rowData[COL.PUBLISH_DATE - 1]).toISOString() : new Date().toISOString(),
    firestore_id: String(rowData[COL.FIRESTORE_ID - 1] || ''),
  };

  try {
    const response = sendWebhookPayload([payloadItem]);
    if (response && response.results && response.results.length > 0) {
      const result = response.results[0];

      if (result.status === 'Imported') {
        // Successful import
        sheet.getRange(rowNumber, COL.STATUS).setValue('Imported');
        sheet.getRange(rowNumber, COL.FIRESTORE_ID).setValue(result.firestore_id || '');
        sheet.getRange(rowNumber, COL.IMPORT_STATUS).setValue('SUCCESS');
        sheet.getRange(rowNumber, COL.IMPORT_ERROR).setValue('');
        sheet.getRange(rowNumber, COL.LAST_IMPORTED_AT).setValue(result.last_imported_at || new Date().toISOString());
      } else {
        // Failed import
        sheet.getRange(rowNumber, COL.IMPORT_STATUS).setValue('FAILED');
        sheet.getRange(rowNumber, COL.IMPORT_ERROR).setValue(result.import_error || 'Server rejected file');
        sheet.getRange(rowNumber, COL.LAST_IMPORTED_AT).setValue(new Date().toISOString());
      }
    }
  } catch (err) {
    sheet.getRange(rowNumber, COL.IMPORT_STATUS).setValue('FAILED');
    sheet.getRange(rowNumber, COL.IMPORT_ERROR).setValue(err.toString());
  }
}

/**
 * Syncs all rows where status is 'Approved'.
 */
function syncAllApprovedRows() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    SpreadsheetApp.getUi().alert(`Sheet named "${CONFIG.SHEET_NAME}" not found.`);
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= CONFIG.HEADER_ROW) {
    SpreadsheetApp.getUi().alert('No data rows found in sheet.');
    return;
  }

  const statusValues = sheet.getRange(CONFIG.HEADER_ROW + 1, COL.STATUS, lastRow - CONFIG.HEADER_ROW, 1).getValues();
  let approvedCount = 0;

  for (let i = 0; i < statusValues.length; i++) {
    if (statusValues[i][0] === 'Approved') {
      const rowNum = i + CONFIG.HEADER_ROW + 1;
      ingestSingleRow(sheet, rowNum);
      approvedCount++;
    }
  }

  SpreadsheetApp.getUi().alert(`Sync completed. Processed ${approvedCount} approved rows.`);
}

/**
 * Sends authenticated webhook POST to the MAYF server.
 */
function sendWebhookPayload(items) {
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + CONFIG.WEBHOOK_SECRET,
    },
    payload: JSON.stringify({
      action: 'import_approved',
      timestamp: new Date().toISOString(),
      items: items,
    }),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(CONFIG.WEBHOOK_URL, options);
  const responseCode = response.getResponseCode();
  const responseBody = response.getContentText();

  if (responseCode !== 200) {
    throw new Error('HTTP ' + responseCode + ': ' + responseBody);
  }

  return JSON.parse(responseBody);
}

/**
 * Tests connection with the MAYF server endpoint.
 */
function testWebhookConnection() {
  const ui = SpreadsheetApp.getUi();
  try {
    const testItem = {
      content_id: 'MAYF-TEST-PING-' + Date.now(),
      title: 'Connection Ping Test',
      class: 'Class 10',
      category: 'Algebra',
      content_type: 'pdf',
      access_type: 'free',
      status: 'Approved',
      visibility: 'Hidden',
    };

    const res = sendWebhookPayload([testItem]);
    ui.alert('Connection Successful!', `MAYF server responded:\n${res.message || JSON.stringify(res)}`, ui.ButtonSet.OK);
  } catch (err) {
    ui.alert('Connection Failed', `Error connecting to ${CONFIG.WEBHOOK_URL}:\n${err.toString()}`, ui.ButtonSet.OK);
  }
}

/**
 * Programmatically builds the 30 header columns with data validation dropdowns.
 */
function setupSheetTemplate() {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(CONFIG.SHEET_NAME);
  }

  const headers = [
    'content_id', 'title', 'slug', 'short_description', 'description',
    'class', 'category', 'subcategory', 'topic', 'content_type',
    'access_type', 'price', 'currency', 'annual_pass_included', 'download_allowed',
    'drive_file_id', 'thumbnail_drive_file_id', 'embed_url', 'tags', 'seo_title',
    'seo_description', 'status', 'visibility', 'featured', 'sort_order',
    'publish_date', 'firestore_id', 'import_status', 'import_error', 'last_imported_at'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setBackground('#1D4ED8').setFontColor('#FFFFFF').setFontWeight('bold');

  // Status column dropdown validation (Col 22)
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Draft', 'Review', 'Approved', 'Rejected', 'Imported'], true)
    .build();
  sheet.getRange(2, COL.STATUS, 500, 1).setDataValidation(statusRule);

  // Visibility column dropdown validation (Col 23)
  const visibilityRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Visible', 'Hidden'], true)
    .build();
  sheet.getRange(2, COL.VISIBILITY, 500, 1).setDataValidation(visibilityRule);

  // Access Type validation (Col 11)
  const accessRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['free', 'paid'], true)
    .build();
  sheet.getRange(2, COL.ACCESS_TYPE, 500, 1).setDataValidation(accessRule);

  sheet.setFrozenRows(1);
  SpreadsheetApp.getUi().alert('Content Registry Template initialized with all 30 columns and dropdowns.');
}

/**
 * Sets up the installable onEdit trigger with proper permissions.
 */
function setupInstallableTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'onEditTrigger') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger('onEditTrigger')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();

  SpreadsheetApp.getUi().alert('Installable Edit Trigger Installed!\nSetting any row status to "Approved" will automatically ingest it into MAYF production storage.');
}
