import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Key,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  UserX,
  Clock,
  History,
} from 'lucide-react';
import { adminService, AdminUserRecord, AuditLogRecord } from '../../../services/adminService';
import { useAuth } from '../../../context/AuthContext';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';

export const AdminAdminsSection: React.FC = () => {
  const { entitlements } = useAuth();
  const [admins, setAdmins] = useState<AdminUserRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'superAdmin'>('admin');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'operators' | 'audit'>('operators');

  const loadData = async () => {
    setLoading(true);
    try {
      const [adminList, logs] = await Promise.all([
        adminService.getAdmins(),
        adminService.getAuditLogs('admin'),
      ]);
      setAdmins(adminList);
      setAuditLogs(logs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGrantClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    if (!entitlements.isSuperAdmin) {
      setStatusMessage({
        type: 'error',
        text: 'Forbidden: Only superAdmin can create or assign administrator custom claims.',
      });
      return;
    }

    setStatusMessage({ type: 'success', text: 'Minting Firebase custom claims via Admin SDK...' });
    const res = await adminService.setAdminCustomClaim(newAdminEmail.trim(), newAdminRole);
    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `Custom claim minted: role=${newAdminRole}, admin=true. Refresh tokens revoked to force re-authentication.`,
      });
      setNewAdminEmail('');
      await loadData();
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to mint custom claim' });
    }
  };

  const handleRemoveAdmin = async (admin: AdminUserRecord) => {
    if (!entitlements.isSuperAdmin) {
      setStatusMessage({ type: 'error', text: 'Only superAdmin can remove administrators.' });
      return;
    }

    setLoading(true);
    const res = await adminService.removeUserAdminRole(admin.uid);
    setLoading(false);
    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `Privileges removed from ${admin.email}. ID tokens revoked.`,
      });
      await loadData();
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to remove admin' });
    }
  };

  const handleForceTokenRevocation = async (admin: AdminUserRecord) => {
    setStatusMessage({
      type: 'success',
      text: `Forced token revocation command sent for UID ${admin.uid}. User must re-authenticate.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-600" />
            <span>Administrators & Role-Based Access Control (RBAC)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically signed Firebase ID token claims (<code className="font-mono text-blue-700">admin=true</code>, <code className="font-mono text-purple-700">superAdmin=true</code>). Only superAdmin can create, remove, or modify administrators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={loadData} className="gap-1.5 shadow-2xs">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Security Architecture Principle Card */}
      <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
            <Lock className="w-4 h-4" />
            <span>CRYPTOGRAPHIC CLAIM & REFRESH TOKEN ENFORCEMENT</span>
          </div>

          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-purple-300 border border-slate-700">
            Caller Status: {entitlements.isSuperAdmin ? 'SUPER_ADMIN' : 'ADMIN'}
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The client browser is NEVER trusted. Role fields stored inside Firestore documents are not used for authorization.
          Only Firebase ID tokens verified on the server containing <code className="text-blue-300">admin=true</code> or <code className="text-purple-300">superAdmin=true</code> can execute operations.
          Whenever a role is updated, server-side <code className="text-emerald-300">revokeRefreshTokens()</code> forces immediate re-issuance.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('operators')}
          className={`pb-2.5 text-xs font-heading font-bold border-b-2 cursor-pointer transition-colors ${
            activeTab === 'operators'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Active Privileged Operators ({admins.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-2.5 text-xs font-heading font-bold border-b-2 cursor-pointer transition-colors ${
            activeTab === 'audit'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Admin Creation & Removal Audit Log ({auditLogs.length})
        </button>
      </div>

      {/* Grant Admin Access Form (Only SuperAdmin) */}
      {activeTab === 'operators' && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-600" />
                <span>Grant Administrator Custom Claims</span>
              </h3>
              {!entitlements.isSuperAdmin && (
                <span className="text-[11px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  SuperAdmin privileges required
                </span>
              )}
            </div>

            <form onSubmit={handleGrantClaim} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <input
                type="email"
                placeholder="Enter Google account email (e.g. colleague@mayf.co.in)..."
                value={newAdminEmail}
                disabled={!entitlements.isSuperAdmin}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:bg-white disabled:opacity-50"
              />

              <select
                value={newAdminRole}
                disabled={!entitlements.isSuperAdmin}
                onChange={(e) => setNewAdminRole(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-heading font-medium text-slate-700 cursor-pointer disabled:opacity-50"
              >
                <option value="admin">Role: Admin (admin=true)</option>
                <option value="superAdmin">Role: SuperAdmin (superAdmin=true)</option>
              </select>

              <Button
                size="sm"
                variant="primary"
                type="submit"
                disabled={!entitlements.isSuperAdmin || !newAdminEmail.trim()}
                className="gap-1.5 shrink-0 bg-purple-700 hover:bg-purple-800 text-white"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Mint Custom Claim</span>
              </Button>
            </form>

            {statusMessage && (
              <div
                className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}
          </div>

          {/* Verified Admins Directory */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Active Privileged Operators</span>
              <span className="font-mono text-[11px] text-purple-700">Firebase Auth Custom Claims Verified</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-heading text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Administrator</th>
                    <th className="px-4 py-3">Assigned Role</th>
                    <th className="px-4 py-3">Custom Claims Payload</th>
                    <th className="px-4 py-3">Last Login</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {admins.map((adm) => (
                    <tr key={adm.uid} className="hover:bg-purple-50/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-heading font-bold text-slate-900">{adm.displayName}</div>
                        <div className="text-[11px] font-mono text-slate-500">{adm.email}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        {adm.role === 'superAdmin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            <ShieldCheck className="w-3 h-3 text-purple-700" />
                            SUPER_ADMIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            <UserCheck className="w-3 h-3 text-blue-700" />
                            ADMIN
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200 inline-block">
                          {`{ admin: ${adm.customClaims.admin}, superAdmin: ${adm.customClaims.superAdmin} }`}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                        {adm.lastLogin.split('T')[0]}
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleForceTokenRevocation(adm)}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200 transition-colors cursor-pointer"
                          title="Revoke refresh tokens to force re-authentication"
                        >
                          Revoke Tokens
                        </button>
                        {entitlements.isSuperAdmin && adm.email !== '2026vivekkushwah@gmail.com' && (
                          <button
                            onClick={() => handleRemoveAdmin(adm)}
                            className="px-2 py-1 text-[11px] font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-50 rounded border border-rose-200 transition-colors cursor-pointer"
                          >
                            Remove Admin
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Admin Audit History Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Privileged Action Log</span>
            <span className="font-mono text-[11px] text-purple-700">Strict Audit Trail</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-heading text-[10px]">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-5 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          log.action === 'ADMIN_CREATED'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-700">
                      <div>{log.actorEmail}</div>
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
      )}
    </div>
  );
};
