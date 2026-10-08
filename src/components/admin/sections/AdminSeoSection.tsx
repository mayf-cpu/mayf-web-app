import React, { useState } from 'react';
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  FileCode,
  ShieldCheck,
  Save,
  Search,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { getAdminEntryPath } from '../../../config/adminConfig';

export const AdminSeoSection: React.FC = () => {
  const adminPath = getAdminEntryPath();
  const [canonicalDomain, setCanonicalDomain] = useState('https://mayf.co.in');
  const [defaultTitle, setDefaultTitle] = useState('Maths at Your Fingertips | Class 5–10 CBSE & ICSE Math');
  const [defaultDesc, setDefaultDesc] = useState(
    'The authoritative digital math companion for Class 5–10 students. Master formulas, chapter materials, and get step-by-step guidance from the AI Teacher.'
  );
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
            Search Engine Optimization & Indexing Directives
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage global canonical domain, Schema.org JSON-LD structured data, and robots crawl directives.
          </p>
        </div>

        <Button size="sm" variant="primary" onClick={handleSave} className="gap-1.5 shadow-xs">
          <Save className="w-3.5 h-3.5" />
          <span>{saved ? 'Saved SEO!' : 'Save SEO Configuration'}</span>
        </Button>
      </div>

      {/* Admin Exclusion & Robots Notice */}
      <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>ROBOTS & CRAWLER SECURITY ENFORCEMENT</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Admin responses strictly return <code className="text-blue-300 font-mono">X-Robots-Tag: noindex, nofollow</code>.
          The administrator entry path (<code className="text-emerald-300 font-mono">{adminPath}</code>) is automatically excluded from search indexing and crawler discovery.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Global Metadata */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <span>Canonical & Metadata Settings</span>
          </h3>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Canonical Domain:</label>
            <input
              type="text"
              value={canonicalDomain}
              onChange={(e) => setCanonicalDomain(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Default Page Title:</label>
            <input
              type="text"
              value={defaultTitle}
              onChange={(e) => setDefaultTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Default Meta Description:</label>
            <textarea
              rows={3}
              value={defaultDesc}
              onChange={(e) => setDefaultDesc(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white"
            />
          </div>
        </div>

        {/* Live Robots.txt Preview */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-slate-600" />
            <span>Active robots.txt Directives</span>
          </h3>

          <pre className="p-4 rounded-xl bg-slate-900 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
{`User-agent: *
Disallow: ${adminPath}/
Disallow: /api/admin/
Disallow: /*?*preview_iab=

# Public Indexable Resources
Allow: /
Allow: /study-material
Allow: /study/
Allow: /formula-deck
Allow: /formula/
Allow: /courses
Allow: /course/
Allow: /ai-teacher
Allow: /annual-pass

Sitemap: https://mayf.co.in/sitemap.xml`}
          </pre>

          <p className="text-[11px] text-slate-500">
            Served dynamically via Express server handler in <code className="font-mono text-slate-700">server.ts</code>.
          </p>
        </div>
      </div>
    </div>
  );
};
