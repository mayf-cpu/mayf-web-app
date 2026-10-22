import React, { useEffect, useState } from 'react';
import { adminService } from '../../../services/adminService';
import { Button } from '../../ui/Button';

export const AdminImportSection: React.FC = () => {
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [tabName, setTabName] = useState('Content Registry');
  const [serviceAccountEmail, setServiceAccountEmail] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const load = async () => {
    const headers = await adminService.getAuthHeaders();
    const [configResponse, jobsResponse] = await Promise.all([fetch('/api/admin/ingest/config', { headers }), fetch('/api/admin/ingest/jobs', { headers })]);
    const config = await configResponse.json(); const history = await jobsResponse.json();
    if (!configResponse.ok || !jobsResponse.ok || !config.success || !history.success) throw new Error(config.error || history.error || 'Unable to load import configuration.');
    setSpreadsheetId(config.config.spreadsheetId); setTabName(config.config.tabName); setJobs(history.jobs || []); setServiceAccountEmail(config.serviceAccountEmail || '');
  };
  useEffect(() => { setBusy(true); void load().catch(error => setError(error.message)).finally(() => setBusy(false)); }, []);
  const run = async (action: 'save' | 'sync') => {
    setBusy(true); setError(''); setMessage('');
    try {
      const saved = await fetch('/api/admin/ingest/config', { method: 'PUT', headers: await adminService.getAuthHeaders(), body: JSON.stringify({ spreadsheetId, tabName }) });
      const config = await saved.json();
      if (!saved.ok || !config.success) throw new Error(config.error || 'Registry connection was not saved.');
      if (action === 'sync') {
        const response = await fetch('/api/admin/ingest/sync', { method: 'POST', headers: await adminService.getAuthHeaders() });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || `${result.failedCount || 0} imports failed. Inspect the import log.`);
        setMessage(`Processed ${result.totalProcessed} approved rows. Each run imports at most five rows.`);
      } else setMessage('Registry connection saved.');
      await load();
    } catch (error: any) { setError(error.message); }
    finally { setBusy(false); }
  };
  return <div className="space-y-5 text-slate-900">
    <h2 className="text-xl font-bold">Curriculum Registry & Drive Import</h2>
    <p className="text-sm text-slate-600">Read approved spreadsheet rows, copy their actual Drive files into storage and save the resource and import log together.</p>
    {error && <p role="alert" className="rounded bg-red-50 p-3 text-red-700">{error}</p>}
    {message && <p role="status" className="rounded bg-emerald-50 p-3 text-emerald-700">{message}</p>}
    <div className="space-y-4 rounded-xl border bg-white p-5">
      <label className="block text-sm">Registry spreadsheet ID<input className="mt-1 block w-full rounded border p-2" value={spreadsheetId} onChange={event => setSpreadsheetId(event.target.value)} placeholder="Paste the ID from your spreadsheet URL" /></label>
      <label className="block text-sm">Registry tab name<input className="mt-1 block w-full rounded border p-2" value={tabName} onChange={event => setTabName(event.target.value)} /></label>
      {serviceAccountEmail && <p className="text-sm">Service account: <code>{serviceAccountEmail}</code></p>}
      <p className="text-xs text-slate-600">Share the registry as Editor and source files as Viewer with the configured service account. Enable Sheets and Drive APIs. Rows require content_id, title, status, visibility, content_type and access_type columns. Only Approved rows are imported.</p>
      <div className="flex flex-wrap gap-3"><Button disabled={busy} onClick={() => run('save')}>Save Connection</Button><Button disabled={busy || !spreadsheetId} onClick={() => run('sync')}>Sync Approved Rows</Button><Button disabled={busy} variant="outline" onClick={() => { setBusy(true); void load().catch(error => setError(error.message)).finally(() => setBusy(false)); }}>Refresh Jobs</Button></div>
    </div>
    <div className="rounded-xl border bg-white">{!jobs.length && <p className="p-5 text-sm text-slate-600">No import jobs have been recorded.</p>}{jobs.map(job => <article key={job.id} className="border-b p-4 text-sm"><p className="font-semibold">{job.title}</p><p>{job.status} · {job.content_id}</p>{job.errorMessage && <p className="mt-2 text-red-700">{job.errorMessage}</p>}</article>)}</div>
  </div>;
};
