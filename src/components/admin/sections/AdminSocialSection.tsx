import React from 'react';
import {
  Share2,
  Smartphone,
  ExternalLink,
  Copy,
  TrendingUp,
  Globe,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const AdminSocialSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
          Social Sharing & In-App Browser Analytics
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Sharing and in-app browser usage can be monitored here once authenticated measurement is implemented. Counts are currently not measured.
        </p>
      </div>

      {/* Top Channel Distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[10px] font-heading font-bold text-slate-500 uppercase tracking-wider">
            Total Shares (30 Days)
          </span>
          <div className="mt-2 text-2xl font-heading font-extrabold text-slate-900">
            Not measured
          </div>
          <p className="text-[11px] text-emerald-600 mt-1">Share-event telemetry not yet available</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[10px] font-heading font-bold text-slate-500 uppercase tracking-wider">
            WhatsApp Clicks
          </span>
          <div className="mt-2 text-2xl font-heading font-extrabold text-[#128C7E]">
            Not measured
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Target-specific attribution unavailable</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[10px] font-heading font-bold text-slate-500 uppercase tracking-wider">
            In-App Browser Visits
          </span>
          <div className="mt-2 text-2xl font-heading font-extrabold text-blue-700">
            Not measured
          </div>
          <p className="text-[11px] text-blue-600 mt-1">In-app browser visits not tracked</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[10px] font-heading font-bold text-slate-500 uppercase tracking-wider">
            Android Chrome Intents
          </span>
          <div className="mt-2 text-2xl font-heading font-extrabold text-amber-700">
            Not measured
          </div>
          <p className="text-[11px] text-slate-500 mt-1">External intent launches not tracked</p>
        </div>
      </div>

      {/* In-App Browser Detection Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span>Detected In-App Browser Platforms</span>
          </h3>
          <p role="status" className="text-xs text-slate-600">No verified per-platform visitor counts are available. The list below shows categories, not measured distribution.</p>

          <div className="space-y-3 text-xs">
            {[
              { app: 'Instagram (iOS & Android)', pct: 0, count: 'Not measured', color: 'bg-pink-500' },
              { app: 'Facebook & Messenger', pct: 0, count: 'Not measured', color: 'bg-blue-600' },
              { app: 'X (Twitter)', pct: 0, count: 'Not measured', color: 'bg-slate-900' },
              { app: 'TikTok & ByteDance', pct: 0, count: 'Not measured', color: 'bg-black' },
              { app: 'Telegram & Other WebViews', pct: 0, count: 'Not measured', color: 'bg-sky-500' },
            ].map((item) => (
              <div key={item.app} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800">{item.app}</span>
                  <span className="font-mono text-slate-500">{item.count} ({item.pct}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Conversion Safeguards */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Policy & Architecture Safeguards</span>
          </h3>

          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
              <span className="font-bold text-slate-800">No Universal Forced Redirects</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Adheres strictly to mobile application sandbox security policies. Never makes claims of universally forcing Safari or Chrome.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
              <span className="font-bold text-slate-800">Loop Prevention Guarantee</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Users are never trapped in reload loops. The canonical HTTPS URL is preserved and pages remain 100% interactive.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
              <span className="font-bold text-slate-800">Session Dismissal Storage</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                When a user taps ✕, banner dismissal is retained in <code className="text-blue-700">sessionStorage</code> to prevent repetitive prompts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
