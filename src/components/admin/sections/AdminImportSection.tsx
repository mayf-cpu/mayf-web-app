import React, { useState } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Cloud,
  Layers,
  ArrowRight,
  Database,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { adminService } from '../../../services/adminService';

export const AdminImportSection: React.FC = () => {
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleTriggerSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncStatus(null);
    setSyncError(null);
    try {
      const res = await fetch('/api/admin/ingest/sync', {
        method: 'POST',
        headers: await adminService.getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok || data.success !== true) {
        throw new Error(data.error || 'The import service could not synchronize approved jobs.');
      }
      const processed = Number(data.totalProcessed);
      if (!Number.isFinite(processed) || processed < 0) {
        throw new Error('Import service returned an invalid processing count.');
      }
      setSyncStatus('Import sync completed. ' + processed + ' existing approved/pending jobs processed. Check the import jobs list for individual results.');
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Import sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
            Curriculum Ingestion & Drive / Sheets Pipeline
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Process registered approved/pending import jobs. New Google Sheets edits arrive through the separately configured authenticated webhook.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={handleTriggerSync}
          disabled={syncing}
          className="gap-1.5 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Syncing Pipeline...' : 'Trigger Sync Now'}</span>
        </Button>
      </div>

      {syncStatus && (
        <div role="status" className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncStatus}</span>
        </div>
      )}
      {syncError && (
        <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>Sync failed: {syncError}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Google Sheets Master Registry ID (reference only)</span>
        </h3>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Spreadsheet ID:</label>
          <input
            type="text"
            value={spreadsheetId}
            onChange={(e) => setSpreadsheetId(e.target.value)}
            placeholder="Enter your registry sheet ID for reference"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
          />
          <p className="text-[11px] text-slate-500">
            This reference field is not connected to the server and is not saved. The button above processes existing registered import jobs; use the authenticated Apps Script webhook to submit new rows.
          </p>
        </div>
      </div>
    </div>
  );
};
