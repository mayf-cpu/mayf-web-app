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
} from 'lucide-react';
import { adminService, AdminUserRecord } from '../../../services/adminService';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';

export const AdminAdminsSection: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUserRecord[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'superAdmin'>('admin');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    adminService.getAdmins().then(setAdmins);
  }, []);

  const handleGrantClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    setStatusMessage('Granting Firebase custom claim on server...');
    const res = await adminService.setAdminCustomClaim(newAdminEmail.trim(), newAdminRole);
    if (res.success) {
      setStatusMessage(`Custom claim successfully minted for ${newAdminEmail}.`);
      setNewAdminEmail('');
      const updated = await adminService.getAdmins();
      setAdmins(updated);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
          Administrators & Role-Based Access Control (RBAC)
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Admin privileges are strictly determined by cryptographically signed Firebase ID token custom claims (<code className="font-mono text-blue-700">admin=true</code> or <code className="font-mono text-purple-700">superAdmin=true</code>).
        </p>
      </div>

      {/* Security Architecture Principle Card */}
      <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
          <Lock className="w-4 h-4" />
          <span>CRYPTOGRAPHIC CLAIM ENFORCEMENT</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The client browser is NEVER trusted. Role fields stored inside Firestore documents are not used for authorization.
          Only Firebase ID tokens containing verified <code className="text-blue-300">admin=true</code> or <code className="text-purple-300">superAdmin=true</code> claims can execute administrative operations.
        </p>
      </div>

      {/* Grant Admin Access Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <h3 className="font-heading font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-blue-600" />
          <span>Grant Administrator Custom Claims</span>
        </h3>

        <form onSubmit={handleGrantClaim} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <input
            type="email"
            placeholder="Enter Google account email (e.g. colleague@mayf.co.in)..."
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />

          <select
            value={newAdminRole}
            onChange={(e) => setNewAdminRole(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-heading font-medium text-slate-700 cursor-pointer"
          >
            <option value="admin">Role: Admin (admin=true)</option>
            <option value="superAdmin">Role: SuperAdmin (superAdmin=true)</option>
          </select>

          <Button size="sm" variant="primary" type="submit" className="gap-1.5 shrink-0">
            <Key className="w-3.5 h-3.5" />
            <span>Mint Custom Claim</span>
          </Button>
        </form>

        {statusMessage && (
          <div className="mt-3 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-medium text-blue-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Verified Admins Directory */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>Active Privileged Operators</span>
          <span className="font-mono text-[11px] text-blue-700">Firebase Auth Claims Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-heading text-[10px]">
              <tr>
                <th className="px-5 py-3">Administrator</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Custom Claims Payload</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-5 py-3 text-right">RBAC Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {admins.map((adm) => (
                <tr key={adm.uid} className="hover:bg-blue-50/20 transition-colors">
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
                  <td className="px-5 py-3.5 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified Token</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
