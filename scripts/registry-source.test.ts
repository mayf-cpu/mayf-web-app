import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { readRegistrySheet, writeRegistryResult } from '../src/lib/ingestion/registrySource';

test('real Google Sheets source reads records and preserves Approved-only semantics', async () => {
 const originalFetch = globalThis.fetch;
 let calls = 0;
 globalThis.fetch = (async (input: any, options: any) => {
   calls++;
   assert.ok(String(input).startsWith('https://sheets.googleapis.com/v4/spreadsheets/'));
   assert.equal(options.redirect,'manual');
   return { ok: true, json: async () => ({ values: [
     ['content_id','title','status','visibility','content_type','access_type','drive_file_id'],
     ['M-1','Chapter One','Approved','Visible','pdf','free','drive123'],
     ['M-2','Chapter Two','Draft','Hidden','pdf','paid','drive456']
   ] }) } as any;
 }) as typeof fetch;
 try {
   const result = await readRegistrySheet({ spreadsheetId:'TEST_SHEET_123456', tabName:'Content Registry' }, async () => 'fake-scoped-token');
   assert.equal(calls,1);
   assert.equal(result.rows.length,2);
   assert.equal(result.rows[0].row.status,'Approved');
   assert.equal(result.rows[1].row.status,'Draft');
   assert.equal(result.rows[0].sheetRow,2);
 } finally { globalThis.fetch=originalFetch; }
});

test('sheet writeback records truthful success/failure and refuses API errors', async () => {
 const originalFetch=globalThis.fetch;
 let sent:any;
 globalThis.fetch = (async (_input:any, options:any) => {
   sent=JSON.parse(options.body);
   assert.equal(options.redirect,'manual');
   return { ok:true } as any;
 }) as typeof fetch;
 const config={spreadsheetId:'TEST_SHEET_123456',tabName:'Content Registry'};
 const headers=['content_id','status','firestore_id','import_status','import_error','last_imported_at'];
 try {
   await writeRegistryResult(config,2,headers,{success:false,error:'Drive access denied'},'fake-token');
   assert.ok(sent.data.some((item:any)=>item.range.endsWith('B2') && item.values[0][0]==='Approved'));
   assert.ok(sent.data.some((item:any)=>item.range.endsWith('D2') && item.values[0][0]==='FAILED'));
   assert.ok(sent.data.some((item:any)=>item.range.endsWith('E2') && item.values[0][0]==='Drive access denied'));
   globalThis.fetch = (async () => ({ok:false,status:403} as any)) as typeof fetch;
   await assert.rejects(()=>writeRegistryResult(config,2,headers,{success:true,firestore_id:'ID'},'fake-token'),/status update failed/);
 } finally {globalThis.fetch=originalFetch;}
});

test('admin Sheets configuration and sync APIs require authorization and do not use fake jobs', () => {
 const source=readFileSync(new URL('../server.ts',import.meta.url),'utf8');
 const service=readFileSync(new URL('../src/lib/ingestion/ingestionService.ts',import.meta.url),'utf8');
 assert.match(source, /app\.get\('\/api\/admin\/ingest\/config', requireAuth, requireAdmin/);
 assert.match(source, /app\.put\('\/api\/admin\/ingest\/config', requireAuth, requireAdmin/);
 assert.match(service, /readRegistrySheet\(source\)/);
 assert.match(service, /\.filter\(item => item\.row\.status === 'Approved'\)\.slice\(0, 5\)/);
 assert.match(service, /await writeRegistryResult\(/);
});
