import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Cloud,
  Key,
  Server,
  Lock,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Download,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { getAdminEntryPath } from '../../../config/adminConfig';

export const AdminSettingsSection: React.FC = () => {
  const currentPath = getAdminEntryPath();
  const [cloudflareAud, setCloudflareAud] = useState('');
  const [cloudflareTeamDomain, setCloudflareTeamDomain] = useState('mayf.cloudflareaccess.com');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
            System Settings & Edge Security Infrastructure
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Defense-in-depth configuration: Cloudflare Access edge verification, secret path management, and audit logs.
          </p>
        </div>

        <Button size="sm" variant="primary" onClick={handleSave} className="gap-1.5 shadow-xs">
          <Save className="w-3.5 h-3.5" />
          <span>{saved ? 'Settings Saved!' : 'Save Security Settings'}</span>
        </Button>
      </div>

      {/* Cloudflare Access Edge Protection Integration */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-slate-900">
                Cloudflare Access Edge Protection
              </h3>
              <p className="text-xs text-slate-500">
                Zero Trust application policy guarding the secret administrator path at Cloudflare&apos;s edge network.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            EDGE COMPATIBLE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Cloudflare Access AUD (Audience Tag):</label>
            <input
              type="text"
              placeholder="e.g. 566895799712-cfaccess-aud-mayf..."
              value={cloudflareAud}
              onChange={(e) => setCloudflareAud(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Team Domain:</label>
            <input
              type="text"
              value={cloudflareTeamDomain}
              onChange={(e) => setCloudflareTeamDomain(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
            />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-1">
          <span className="font-bold text-slate-800">Edge Header Inspection:</span>
          <p className="text-[11px] text-slate-500">
            Server inspects <code className="font-mono text-slate-700">Cf-Access-Jwt-Assertion</code> and <code className="font-mono text-slate-700">Cf-Access-Authenticated-User-Email</code>.
            If edge rejection occurs, unauthorized visitors receive a 404 Not Found without disclosing administrative routes.
          </p>
        </div>
      </div>

      {/* Secret Path Information (Visible Only to Verified Admins Inside this Page) */}
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
          <span className="text-slate-500 text-[11px]">Set via <code className="font-mono">ADMIN_ENTRY_PATH</code> env var</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          This path is never published in sitemaps, headers, footers, public navigation, or client metadata.
          Should an unauthorized person guess this path, the application strictly returns a standard 404 Not Found.
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
            checked={maintenanceMode}
            onChange={(e) => setMaintenanceMode(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );
};
