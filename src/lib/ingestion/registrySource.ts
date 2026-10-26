import { getAdminFirestore } from '../firebase/admin';
import { DocumentStateRepository } from '../firebase/documentStateRepository';
import { getGoogleAccessToken } from '../firebase/googleAccessToken';
import type { ContentRegistryRow } from './types';
import {normalizeRegistryRow} from './editorialRegistry';

type RegistryConfig = { spreadsheetId: string; tabName: string };
let config: RegistryConfig = { spreadsheetId: '', tabName: 'Content Registry' };
const state = {
  exportState: () => [{ id: 'source', ...config }],
  importState: (items: Record<string, any>[]) => { const item = items.find(item => item.id === 'source'); config = item ? { spreadsheetId: item.spreadsheetId, tabName: item.tabName } : { spreadsheetId: '', tabName: 'Content Registry' }; },
};
const repository = new DocumentStateRepository([{ collection: 'ingestionConfiguration', state }], getAdminFirestore, 'ingestionConfigurationState');
export const registrySource = {
  read: () => repository.run(() => ({ ...config })),
  save: (input: RegistryConfig) => repository.run(() => {
    if (!/^[a-zA-Z0-9_-]{10,200}$/.test(input.spreadsheetId) || typeof input.tabName !== 'string' || !input.tabName.trim() || input.tabName.length > 100) throw new Error('Enter a valid spreadsheet ID and tab name.');
    config = { spreadsheetId: input.spreadsheetId, tabName: input.tabName.trim() }; return { ...config };
  }, true),
};
export async function readRegistrySheet(source: RegistryConfig, tokenProvider = getGoogleAccessToken) {
  if (!source.spreadsheetId) throw new Error('Save the curriculum registry spreadsheet connection first.');
  const token = await tokenProvider(['https://www.googleapis.com/auth/spreadsheets']);
  const range = `'${source.tabName.replace(/'/g, "''")}'!A:BH`;
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(source.spreadsheetId)}/values/${encodeURIComponent(range)}`, { redirect: 'manual', headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Registry spreadsheet cannot be read (${response.status}). Enable Sheets API and share it with the service account.`);
  const data = await response.json();
  const values: any[][] = data.values || [];
  const headers = (values[0] || []).map(value => String(value).trim().toLowerCase());
  // Import must never look successful if the sheet cannot record its outcome.
  // These columns also allow the next sync to skip already imported rows.
  const requiredColumns = ['content_id', 'title', 'status', 'visibility', 'content_type',
    'access_type', 'firestore_id', 'import_status', 'import_error', 'last_imported_at'];
  for (const required of requiredColumns) {
    if (headers.filter(name => name === required).length !== 1) {
      throw new Error(`Registry requires exactly one ${required} column.`);
    }
  }
  const booleanColumns = new Set(['annual_pass_included', 'download_allowed', 'featured']);
  const rows = values.slice(1).map((cells, index) => {
    const row: Record<string, any> = {};
    headers.forEach((header, column) => { const value = cells[column]; if (header && value !== undefined && value !== '') row[header] = booleanColumns.has(header) ? /^(true|yes|1)$/i.test(String(value)) : String(value).trim(); });
    // Blank approval cells remain Pending even if an AI filled legacy status=Approved.
    if(headers.includes('approval_status')&&!row.approval_status)row.approval_status='Pending';
    return { row: normalizeRegistryRow(row), sheetRow: index + 2 };
  }).filter(item => item.row.content_id);
  return { rows, headers, token };
}
export async function writeRegistryResult(source: RegistryConfig, sheetRow: number, headers: string[], outcome: { success: boolean; firestore_id?: string; error?: string }, token: string) {
  if (!Number.isSafeInteger(sheetRow) || sheetRow < 2) throw new Error('Invalid Google Sheets registry row number');
  for (const required of ['status', 'firestore_id', 'import_status', 'import_error', 'last_imported_at']) {
    if (headers.filter(name => name === required).length !== 1) throw new Error(`Cannot record import: registry requires exactly one ${required} column`);
  }
  const updates: Record<string, string> = { status: outcome.success ? 'Imported' : 'Approved', firestore_id: outcome.firestore_id || '', import_status: outcome.success ? 'SUCCESS' : 'FAILED', import_error: outcome.error || '', last_imported_at: new Date().toISOString() };
  const columnName = (index: number) => { let result = ''; for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) result = String.fromCharCode(65 + (n - 1) % 26) + result; return result; };
  const data = Object.entries(updates).filter(([name]) => headers.includes(name)).map(([name, value]) => ({ range: `'${source.tabName.replace(/'/g, "''")}'!${columnName(headers.indexOf(name))}${sheetRow}`, values: [[value]] }));
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(source.spreadsheetId)}/values:batchUpdate`, { method: 'POST', redirect: 'manual', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ valueInputOption: 'RAW', data }), signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Import is recorded, but spreadsheet status update failed (${response.status}).`);
}
