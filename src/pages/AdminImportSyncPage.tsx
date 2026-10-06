import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  FileSpreadsheet,
  HardDrive,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  Search,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  Code,
  BookOpen,
  Filter,
  X,
  Play
} from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { IngestionJobRecord, ImportJobStatus, ContentRegistryRow } from '../lib/ingestion/types';
import { SeoHead } from '../components/common/SeoHead';

export const AdminImportSyncPage: React.FC = () => {
  const [jobs, setJobs] = useState<IngestionJobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ImportJobStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);

  // Modals state
  const [selectedErrorJob, setSelectedErrorJob] = useState<IngestionJobRecord | null>(null);
  const [selectedMetaJob, setSelectedMetaJob] = useState<IngestionJobRecord | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/admin/ingest/jobs');
      const data = await res.json();
      if (data.jobs) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error('Failed to fetch ingestion jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const showNotification = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  // Trigger manual sync
  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/admin/ingest/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message || 'Synchronized with Content Registry successfully!');
        await fetchJobs();
      }
    } catch (err) {
      showNotification('Sync failed. Please check server logs.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Retry single job
  const handleRetryJob = async (jobId: string) => {
    setRetryingJobId(jobId);
    try {
      const res = await fetch('/api/admin/ingest/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Job successfully retried. New status: ${data.job?.status}`);
        await fetchJobs();
        if (selectedErrorJob && selectedErrorJob.id === jobId) {
          setSelectedErrorJob(null);
        }
      } else {
        showNotification(`Retry failed: ${data.error}`);
      }
    } catch (err: any) {
      showNotification(`Retry exception: ${err.message}`);
    } finally {
      setRetryingJobId(null);
    }
  };

  // Simulate approving a pending row to demonstrate real ingestion
  const handleSimulateApproval = async (contentId: string) => {
    try {
      const res = await fetch('/api/admin/ingest/simulate-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_id: contentId }),
      });
      const data = await res.json();
      showNotification(data.message);
      await fetchJobs();
    } catch (err: any) {
      showNotification(`Failed: ${err.message}`);
    }
  };

  // Filtered jobs
  const filteredJobs = jobs.filter((job) => {
    const matchesTab = activeTab === 'all' || job.status === activeTab;
    const matchesSearch =
      !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.content_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const counts = {
    all: jobs.length,
    pending: jobs.filter((j) => j.status === 'pending').length,
    approved: jobs.filter((j) => j.status === 'approved').length,
    importing: jobs.filter((j) => j.status === 'importing').length,
    imported: jobs.filter((j) => j.status === 'imported').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
  };

  const copyAppsScriptCode = () => {
    const code = `/**
 * MAYF Google Apps Script Webhook Snippet
 * Paste into Extensions > Apps Script in your Content Registry Sheet.
 */
function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== 'Content Registry') return;
  if (e.range.getColumn() === 22 && e.value === 'Approved') { // Column V
    const row = e.range.getRow();
    const rowValues = sheet.getRange(row, 1, 1, 30).getValues()[0];
    const payload = [{
      content_id: rowValues[0],
      title: rowValues[1],
      slug: rowValues[2],
      short_description: rowValues[3],
      class: rowValues[5],
      category: rowValues[6],
      content_type: rowValues[9],
      access_type: rowValues[10],
      drive_file_id: rowValues[15],
      status: 'Approved',
      visibility: rowValues[22] || 'Visible'
    }];
    UrlFetchApp.fetch('https://mayf.co.in/api/ingestion/webhook', {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer mayf_ingest_secret_change_in_production_2026' },
      payload: JSON.stringify({ action: 'import_approved', items: payload })
    });
  }
}`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <SharedLayout>
      <SeoHead
        title="Admin Content Ingestion & Editorial Staging | MAYF"
        description="Secure content ingestion pipeline syncing Google Drive and Google Sheets with production Cloud Storage."
        canonicalUrl="https://mayf.co.in/admin/import-sync"
      />

      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Toast Feedback */}
        {feedbackNotice && (
          <div className="fixed top-5 right-5 z-50 bg-[#0F172A] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-[#334155] animate-in fade-in slide-in-from-top-2 text-xs font-medium">
            <Sparkles className="w-4 h-4 text-[#57DFFE]" />
            <span>{feedbackNotice}</span>
          </div>
        )}

        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-heading font-semibold text-[#1D4ED8] mb-1">
              <span>Admin Management</span>
              <span aria-hidden="true">·</span>
              <span>Editorial Staging Pipeline</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#059669] font-bold">Cloud Storage Transfer</span>
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F172A] tracking-tight">
              Content Import & Staging Sync
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl leading-relaxed">
              Google Drive & Sheets act as the editorial staging area. Approved study material is automatically copied into production Cloud Storage without exposing Drive links to students.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSetupModal(true)}
              className="text-xs gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#00687A]" />
              <span>Apps Script Guide</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSyncNow}
              isLoading={isSyncing}
              className="text-xs gap-1.5 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync Registry Now</span>
            </Button>
          </div>
        </div>

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { key: 'all', label: 'All Jobs', count: counts.all, color: 'text-[#0F172A]', bg: 'bg-white', border: 'border-[#E2E8F0]' },
            { key: 'pending', label: 'Pending Review', count: counts.pending, color: 'text-[#475569]', bg: 'bg-white', border: 'border-[#E2E8F0]' },
            { key: 'approved', label: 'Approved (Queued)', count: counts.approved, color: 'text-[#1D4ED8]', bg: 'bg-[#EFF6FF]/60', border: 'border-[#BFDBFE]' },
            { key: 'importing', label: 'Importing Transfer', count: counts.importing, color: 'text-[#0284C7]', bg: 'bg-[#F0F9FF]', border: 'border-[#BAE6FD]' },
            { key: 'imported', label: 'Imported (Live)', count: counts.imported, color: 'text-[#059669]', bg: 'bg-[#ECFDF5]', border: 'border-[#A7F3D0]' },
            { key: 'failed', label: 'Failed (Action Req)', count: counts.failed, color: 'text-[#DC2626]', bg: 'bg-[#FEF2F2]', border: 'border-[#FECACA]' },
          ].map((stat) => (
            <button
              key={stat.key}
              onClick={() => setActiveTab(stat.key as any)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${stat.bg} ${stat.border} ${
                activeTab === stat.key ? 'ring-2 ring-[#1D4ED8] shadow-sm' : 'hover:shadow-xs'
              }`}
            >
              <div className="text-[11px] font-heading font-semibold text-[#64748B] truncate">{stat.label}</div>
              <div className={`text-xl sm:text-2xl font-bold font-mono tabular-nums mt-1 ${stat.color}`}>
                {stat.count}
              </div>
            </button>
          ))}
        </div>

        {/* Security & Pipeline Architecture Notice Banner */}
        <div className="bg-[#FAFBFD] border border-[#E2E8F0] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#475569]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center shrink-0">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <span className="font-heading font-bold text-[#0F172A] block">Production Storage Isolation Guaranteed</span>
              <span>Paid study files are downloaded from Google Drive and served exclusively from Google Cloud Storage via verified Firebase session claims.</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] bg-white px-2.5 py-1 rounded border border-[#CBD5E1]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Webhook: /api/ingestion/webhook</span>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            {(['all', 'pending', 'approved', 'importing', 'imported', 'failed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg font-heading font-semibold capitalize transition-colors shrink-0 cursor-pointer ${
                  activeTab === tab
                    ? 'bg-[#1D4ED8] text-white shadow-xs'
                    : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {tab} ({counts[tab]})
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by ID, Title, or Topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
            />
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-xs text-[#64748B] space-y-2">
              <div className="w-7 h-7 rounded-full border-2 border-[#1D4ED8] border-t-transparent animate-spin mx-auto" />
              <p>Loading Content Registry records...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="py-16 text-center text-[#64748B] space-y-3">
              <FileSpreadsheet className="w-8 h-8 mx-auto text-[#94A3B8]" />
              <p className="text-sm font-heading font-semibold text-[#0F172A]">No ingestion records match this filter</p>
              <p className="text-xs text-[#64748B]">Try selecting "All Jobs" or clear search keywords.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-heading font-semibold">
                  <tr>
                    <th className="px-4 py-3">Content ID & Topic</th>
                    <th className="px-4 py-3">Format & Tier</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Visibility</th>
                    <th className="px-4 py-3">Staging Drive Source</th>
                    <th className="px-4 py-3">Production Destination</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-[#FAFBFD] transition-colors">
                      {/* Content ID & Title */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="font-mono text-[11px] font-bold text-[#1D4ED8] bg-[#EFF6FF] px-1.5 py-0.5 rounded w-fit mb-1">
                          {job.content_id}
                        </div>
                        <div className="font-heading font-bold text-[#0F172A] line-clamp-1">{job.title}</div>
                        <div className="text-[11px] text-[#64748B]">
                          {job.classLevel} · {job.category}
                        </div>
                      </td>

                      {/* Format & Tier */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-mono uppercase font-bold text-[10px] text-[#00687A] bg-[#ECFEFF] px-1.5 py-0.5 rounded w-fit mb-1">
                          {job.contentType}
                        </div>
                        {job.accessType === 'free' ? (
                          <span className="text-[10px] font-bold text-[#059669]">FREE PUBLIC</span>
                        ) : (
                          <span className="text-[10px] font-bold text-[#EA580C]">ANNUAL PASS</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {job.status === 'imported' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Imported</span>
                          </span>
                        )}
                        {job.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            <Clock className="w-3 h-3 text-blue-600" />
                            <span>Approved (Ready)</span>
                          </span>
                        )}
                        {job.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>In Review</span>
                          </span>
                        )}
                        {job.status === 'importing' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                            <RefreshCw className="w-3 h-3 text-sky-600 animate-spin" />
                            <span>Importing</span>
                          </span>
                        )}
                        {job.status === 'failed' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            <AlertCircle className="w-3 h-3 text-red-600" />
                            <span>Import Failed</span>
                          </span>
                        )}
                      </td>

                      {/* Visibility */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {job.visibility === 'Visible' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#059669] font-semibold">
                            <Eye className="w-3.5 h-3.5 text-[#059669]" />
                            <span>Visible</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#64748B] font-semibold">
                            <EyeOff className="w-3.5 h-3.5 text-[#94A3B8]" />
                            <span>Hidden</span>
                          </span>
                        )}
                      </td>

                      {/* Drive Staging ID */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {job.sourceDriveFileId ? (
                          <div className="font-mono text-[11px] text-[#475569] flex items-center gap-1">
                            <span>{job.sourceDriveFileId.slice(0, 10)}...</span>
                            <span className="text-[10px] text-[#94A3B8]">(Private)</span>
                          </div>
                        ) : (
                          <span className="text-[#94A3B8]">—</span>
                        )}
                      </td>

                      {/* Production Destination */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {job.firestoreDocId ? (
                          <div>
                            <div className="font-mono text-[11px] text-[#0F172A] font-semibold">
                              /contentItems/{job.firestoreDocId}
                            </div>
                            <div className="text-[10px] text-[#059669] font-mono">
                              Cloud Storage Copied ✓
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#94A3B8] italic">Pending ingest</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {job.status === 'failed' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRetryJob(job.id)}
                                isLoading={retryingJobId === job.id}
                                className="h-7 text-xs px-2 text-[#DC2626] border-[#FECACA] hover:bg-[#FEF2F2]"
                              >
                                Retry
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedErrorJob(job)}
                                className="h-7 text-xs px-2"
                              >
                                View Error
                              </Button>
                            </>
                          )}

                          {job.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleSimulateApproval(job.content_id)}
                              className="h-7 text-xs px-2.5 gap-1"
                            >
                              <Play className="w-3 h-3 fill-white" />
                              <span>Import Now</span>
                            </Button>
                          )}

                          {job.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSimulateApproval(job.content_id)}
                              className="h-7 text-xs px-2"
                              title="Mark Approved & Ingest"
                            >
                              Approve
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedMetaJob(job)}
                            className="h-7 text-xs px-2"
                            title="View all 30 Google Sheet row columns"
                          >
                            Metadata
                          </Button>

                          {job.status === 'imported' && (
                            <a
                              href={`/study/${job.sourceRowMetadata.slug || job.firestoreDocId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-[#1D4ED8] hover:bg-[#EFF6FF] rounded inline-flex items-center"
                              title="View Published Resource"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* =========================================================================
            MODAL 1: VIEW ERROR DETAILS
        ========================================================================= */}
        {selectedErrorJob && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full border border-[#E2E8F0] shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-600 font-heading font-bold text-base">
                  <ShieldAlert className="w-5 h-5" />
                  <span>Ingestion Error Diagnostics</span>
                </div>
                <button
                  onClick={() => setSelectedErrorJob(null)}
                  className="p-1 rounded-lg hover:bg-[#F1F5F9] text-[#64748B]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs space-y-1.5">
                <span className="font-heading font-bold text-red-900 block">Item: {selectedErrorJob.title}</span>
                <span className="font-mono text-red-700 block">ID: {selectedErrorJob.content_id}</span>
                <p className="text-red-800 leading-relaxed font-medium">{selectedErrorJob.errorMessage}</p>
              </div>

              {selectedErrorJob.errorStack && (
                <div>
                  <span className="text-[11px] font-heading font-bold text-[#64748B] block mb-1 uppercase">Stack Trace</span>
                  <pre className="bg-[#0F172A] text-[#E2E8F0] p-3 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed max-h-48">
                    {selectedErrorJob.errorStack}
                  </pre>
                </div>
              )}

              <div className="text-xs text-[#475569] bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] space-y-1">
                <span className="font-heading font-bold text-[#0F172A] block">Recommended Resolution:</span>
                <p>1. Open Google Drive folder where file <code className="font-mono text-[11px]">{selectedErrorJob.sourceDriveFileId}</code> is stored.</p>
                <p>2. Verify service account <code className="font-mono text-[11px]">mayf-drive-ingestion@mayf-edtech.iam.gserviceaccount.com</code> has Viewer rights.</p>
                <p>3. Once resolved, click "Retry Import" below.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedErrorJob(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleRetryJob(selectedErrorJob.id)}
                  isLoading={retryingJobId === selectedErrorJob.id}
                >
                  Retry Import Now
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 2: VIEW SOURCE METADATA (ALL 30 COLUMNS)
        ========================================================================= */}
        {selectedMetaJob && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] border border-[#E2E8F0] shadow-2xl flex flex-col overflow-hidden">
              <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-base text-[#0F172A]">
                    Source Content Registry Metadata
                  </h3>
                  <p className="text-xs text-[#64748B] font-mono">{selectedMetaJob.content_id}</p>
                </div>
                <button
                  onClick={() => setSelectedMetaJob(null)}
                  className="p-1 rounded-lg hover:bg-[#F1F5F9] text-[#64748B]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {Object.entries(selectedMetaJob.sourceRowMetadata).map(([key, value]) => (
                    <div key={key} className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                      <span className="font-mono text-[11px] font-bold text-[#1D4ED8] block mb-0.5">
                        {key}
                      </span>
                      <span className="text-[#0F172A] break-words">
                        {typeof value === 'boolean' ? (value ? 'TRUE' : 'FALSE') : String(value || '—')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-[#FAFBFD] border-t border-[#E2E8F0] flex justify-end">
                <Button size="sm" variant="outline" onClick={() => setSelectedMetaJob(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 3: GOOGLE APPS SCRIPT SETUP GUIDE
        ========================================================================= */}
        {showSetupModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] border border-[#E2E8F0] shadow-2xl flex flex-col overflow-hidden">
              <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#1D4ED8]" />
                  <h3 className="font-heading font-bold text-base text-[#0F172A]">
                    Google Sheets & Apps Script Setup Guide
                  </h3>
                </div>
                <button
                  onClick={() => setShowSetupModal(false)}
                  className="p-1 rounded-lg hover:bg-[#F1F5F9] text-[#64748B]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#334155] leading-relaxed">
                <div>
                  <h4 className="font-heading font-bold text-sm text-[#0F172A] mb-1">
                    Step 1: Open Google Sheet & Apps Script Editor
                  </h4>
                  <p>In your Content Registry spreadsheet, click <strong>Extensions → Apps Script</strong>.</p>
                </div>

                <div>
                  <h4 className="font-heading font-bold text-sm text-[#0F172A] mb-1">
                    Step 2: Copy the Automated Trigger Script
                  </h4>
                  <p className="mb-2">This script automatically catches the <strong>Approved</strong> edit state and posts metadata to the server.</p>
                  <div className="relative">
                    <pre className="bg-[#0F172A] text-[#E2E8F0] p-4 rounded-xl font-mono text-[11px] overflow-x-auto max-h-44">
                      {`// Full implementation available at /google-apps-script/Code.gs
const CONFIG = {
  WEBHOOK_URL: 'https://mayf.co.in/api/ingestion/webhook',
  WEBHOOK_SECRET: 'mayf_ingest_secret_change_in_production_2026',
  SHEET_NAME: 'Content Registry',
  STATUS_COLUMN_INDEX: 22,
};`}
                    </pre>
                    <button
                      onClick={copyAppsScriptCode}
                      className="absolute top-2 right-2 px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-heading font-bold text-sm text-[#0F172A] mb-1">
                    Step 3: Run the One-Click Sheet Template Function
                  </h4>
                  <p>Select <code className="font-mono bg-[#F1F5F9] px-1 py-0.5 rounded">setupSheetTemplate</code> and click <strong>Run</strong>. This will automatically format all 30 columns and dropdown validations.</p>
                </div>

                <div>
                  <h4 className="font-heading font-bold text-sm text-[#0F172A] mb-1">
                    Step 4: Install the Edit Trigger
                  </h4>
                  <p>Select <code className="font-mono bg-[#F1F5F9] px-1 py-0.5 rounded">setupInstallableTrigger</code> and click <strong>Run</strong>. Accept the prompt for network permissions.</p>
                </div>
              </div>

              <div className="p-4 bg-[#FAFBFD] border-t border-[#E2E8F0] flex justify-between items-center">
                <span className="text-[11px] text-[#64748B] font-mono">
                  Full reference: docs/GOOGLE_APPS_SCRIPT_SETUP.md
                </span>
                <Button size="sm" variant="primary" onClick={() => setShowSetupModal(false)}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </SharedLayout>
  );
};
