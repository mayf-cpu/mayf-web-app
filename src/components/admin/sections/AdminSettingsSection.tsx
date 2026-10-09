import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  ShieldAlert,
  Cloud,
  Key,
  Server,
  Lock,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Download,
  RefreshCw,
  Clock,
  ListFilter,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { getAdminEntryPath } from '../../../config/adminConfig';
import { useAuth } from '../../../context/AuthContext';
import { adminService, AuditLogRecord, SecurityConfigRecord } from '../../../services/adminService';

export const AdminSettingsSection: React.FC = () => {
  const { entitlements } = useAuth();
  const currentPath = getAdminEntryPath();

  const [activeTab, setActiveTab] = useState<'security' | 'audit'>('security');
  const [config, setConfig] = useState<SecurityConfigRecord>({
    cloudflareAccessAud: '566895799712-cfaccess-aud-mayf-2026',
    cloudflareTeamDomain: 'mayf.cloudflareaccess.com',
    requireCloudflareAccess: false,
    authorizedAdminEmails: ['2026vivekkushwah@gmail.com', 'admin@mayf.co.in'],
    emergencyMaintenanceMode: false,
    tokenRevocationWindowMinutes: 60,
    updatedAt: new Date().toISOString(),
    updatedBy: '2026vivekkushwah@gmail.com',
  });

  const [auditCategory, setAuditCategory] = useState<string>('all');
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [secConfig, logs] = await Promise.all([
        adminService.getSecurityConfig(),
        adminService.getAuditLogs(auditCategory),
      ]);
      setConfig(secConfig);
      setAuditLogs(logs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [auditCategory]);

  const handleSaveSecurity = async () => {
    if (!entitlements.isSuperAdmin) {
      alert('Only superAdmin can modify critical security configuration.');
      return;
    }

    setLoading(true);
    setSavedMessage(null);
    const res = await adminService.updateSecurityConfig(config);
    setLoading(false);

    if (res.success) {
      setSavedMessage('Critical security settings saved and recorded in audit log.');
      setTimeout(() => setSavedMessage(null), 3000);
      const logs = await adminService.getAuditLogs('security');
      setAuditLogs(logs);
    } else {
      alert(res.error || 'Failed to update security configuration.');
    }
  };

  const handleExportAuditCsv = () => {
    const url = `/api/admin/audit-logs/export${auditCategory !== 'all' ? `?category=${auditCategory}` : ''}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `mayf-audit-logs-${auditCategory}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>Security Configuration & Audit Infrastructure</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict defence in depth: edge protection, token revocation policies, and comprehensive compliance audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'security' && (
            <Button
              size="sm"
              variant="primary"
              disabled={loading || !entitlements.isSuperAdmin}
              onClick={handleSaveSecurity}
              className="gap-1.5 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving...' : 'Save Security Settings'}</span>
            </Button>
          )}

          {activeTab === 'audit' && (
            <Button size="sm" variant="outline" onClick={handleExportAuditCsv} className="gap-1.5 shadow-xs">
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit CSV</span>
            </Button>
          )}

          <Button size="sm" variant="secondary" onClick={loadData} className="gap-1.5 shadow-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {savedMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-2.5 text-xs font-heading font-bold border-b-2 cursor-pointer transition-colors ${
            activeTab === 'security'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Critical Security Configuration
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-2.5 text-xs font-heading font-bold border-b-2 cursor-pointer transition-colors ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          System Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: SECURITY CONFIGURATION */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* RBAC Warning if not superAdmin */}
          {!entitlements.isSuperAdmin && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Read-Only Mode:</strong> Only superAdmin can modify critical security configuration. Standard admins can inspect settings but cannot commit changes.
              </span>
            </div>
          )}

          {/* Authentication & Access Security Architecture */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900">
                    Administrator Authentication Architecture
                  </h3>
                  <p className="text-xs text-slate-500">
                    Direct Google OAuth Authentication with strict email allowlist and instant 404 error response for unauthorized users.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                DIRECT GOOGLE AUTH
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-900">Zero Trust Disabled:</span>
              <p className="text-[11px] text-slate-500">
                Admin login page is directly accessible via the secret path using direct Google sign-in. Any user not in the assigned administrator list receives an immediate 404 Not Found response.
              </p>
            </div>
          </div>

          {/* Secret Path Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>Active Administrator Entry Path Configuration</span>
            </h3>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-700">Resolved Path:</span>
              <code className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                {currentPath}
              </code>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500 text-[11px]">Configured via <code className="font-mono">ADMIN_ENTRY_PATH</code></span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              This path is excluded from sitemaps, robots.txt, public navigation, and client metadata.
              Unauthorized visitors strictly receive an indistinguishable 404 Not Found error.
            </p>
          </div>

          {/* Emergency Maintenance Mode */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="font-heading font-bold text-sm text-slate-900">
                Emergency Maintenance Mode
              </h4>
              <p className="text-xs text-slate-500">
                Temporarily pauses student checkouts and displays polite maintenance notices while keeping admin tools accessible.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.emergencyMaintenanceMode}
                disabled={!entitlements.isSuperAdmin}
                onChange={(e) => setConfig({ ...config, emergencyMaintenanceMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
            </label>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOG EXPLORER */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Category Filter Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-700">Filter Category:</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all', label: 'All Operations' },
                { id: 'admin', label: 'Admin Creation / Removal' },
                { id: 'subscription', label: 'Pro & Pass Changes' },
                { id: 'content', label: 'Content Deletion' },
                { id: 'refund', label: 'Refund Changes' },
                { id: 'security', label: 'Security Config' },
                { id: 'user', label: 'User Lifecycle' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setAuditCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    auditCategory === c.id
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>{auditLogs.length} Audit Events Logged</span>
              <span className="font-mono text-[11px] text-emerald-700">Tamper-Evident Trail</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-heading text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Operator</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-5 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            log.action.includes('ADMIN')
                              ? 'bg-purple-100 text-purple-800'
                              : log.action.includes('PRO') || log.action.includes('PASS')
                              ? 'bg-blue-100 text-blue-800'
                              : log.action.includes('DELETED')
                              ? 'bg-rose-100 text-rose-800'
                              : log.action.includes('REFUND')
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[10px] uppercase text-slate-500">
                        {log.category}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-700">
                        <div className="font-semibold">{log.actorEmail}</div>
                        <div className="text-[10px] text-slate-400">{log.actorRole}</div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-700">
                        {log.targetEmail || log.targetId}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-mono text-[11px]">
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
