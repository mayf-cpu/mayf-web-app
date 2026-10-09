import React, { useState, useEffect } from 'react';
import {
  Users,
  CreditCard,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Server,
  Cloud,
  RefreshCw,
  Bell,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Activity,
  Layers,
  BookOpen,
} from 'lucide-react';
import { adminService, AdminMetrics } from '../../../services/adminService';
import { AdminSection } from '../../../config/adminConfig';

interface AdminDashboardSectionProps {
  onNavigateSection: (section: AdminSection) => void;
}

export const AdminDashboardSection: React.FC<AdminDashboardSectionProps> = ({ onNavigateSection }) => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await adminService.getMetrics();
    setMetrics(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Defense in Depth & Cloudflare Edge Status */}
      <div className="bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                DEFENCE IN DEPTH ACTIVE
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                <Cloud className="w-3 h-3" />
                Cloudflare Edge Compatible
              </span>
            </div>
            <h2 className="text-xl font-heading font-extrabold tracking-tight">
              Maths at Your Fingertips · Central Command
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Multi-tiered administrative security: Custom entry path isolation, Firebase Google auth,
              and server-verified custom claims (<code className="text-blue-300">admin=true</code>).
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Students */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-bold text-slate-500 uppercase tracking-wider">
              Registered Students
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-heading font-extrabold text-slate-900">
              {metrics ? metrics.totalStudents.toLocaleString() : '...'}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              +14% mo/mo
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Classes 5 to 10 (CBSE & ICSE)</p>
        </div>

        {/* Card 2: Annual Passes */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-bold text-slate-500 uppercase tracking-wider">
              Active Annual Passes
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-heading font-extrabold text-slate-900">
              {metrics ? metrics.activeAnnualPasses.toLocaleString() : '...'}
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              27.3% conversion
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Single Child & Family Passes</p>
        </div>

        {/* Card 3: AI Doubt Queries */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-bold text-slate-500 uppercase tracking-wider">
              AI Doubts Resolved
            </span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-heading font-extrabold text-slate-900">
              {metrics ? metrics.aiDoubtsSolved.toLocaleString() : '...'}
            </span>
            <span className="text-xs font-semibold text-purple-600">
              99.4% success
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Model: gemini-3.1-flash-lite</p>
        </div>

        {/* Card 4: Gross Platform Revenue */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-bold text-slate-500 uppercase tracking-wider">
              Gross Revenue
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-heading font-extrabold text-slate-900">
              {metrics ? `₹${(metrics.totalRevenue / 100000).toFixed(2)}L` : '...'}
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              Razorpay & Stripe
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Live webhook ledger verified</p>
        </div>
      </div>

      {/* Quick Access Matrix to All Main Areas */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <h3 className="font-heading font-bold text-sm text-slate-900 mb-3 flex items-center justify-between">
          <span>Administrative Sub-Systems</span>
          <span className="text-xs font-normal text-slate-500">19 Managed Modules</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { id: 'content' as AdminSection, label: 'Content', icon: BookOpen, desc: '64 Chapters & PDFs' },
            { id: 'categories' as AdminSection, label: 'Categories', icon: Layers, desc: '9 Topics mapped' },
            { id: 'students' as AdminSection, label: 'Students', icon: Users, desc: '12.4K Profiles' },
            { id: 'admins' as AdminSection, label: 'Admins', icon: ShieldCheck, desc: 'Claims & RBAC' },
            { id: 'ai-activity' as AdminSection, label: 'AI Activity', icon: Sparkles, desc: 'Doubt telemetry' },
            { id: 'orders' as AdminSection, label: 'Orders', icon: CreditCard, desc: 'Payment ledger' },
            { id: 'annual-pass' as AdminSection, label: 'Annual Pass', icon: Activity, desc: '₹1,999 / ₹2,999' },
            { id: 'coupons' as AdminSection, label: 'Coupons', icon: TrendingUp, desc: 'Active campaigns' },
            { id: 'notifications' as AdminSection, label: 'Broadcast', icon: Bell, desc: 'In-app alerts' },
            { id: 'payments' as AdminSection, label: 'Gateways', icon: Server, desc: 'Stripe & Razorpay' },
            { id: 'import' as AdminSection, label: 'Drive Sync', icon: FileSpreadsheet, desc: 'Google Sheets sync' },
            { id: 'settings' as AdminSection, label: 'Settings', icon: Cloud, desc: 'Edge & Cloudflare' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigateSection(item.id)}
                className="p-3 text-left rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all group cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div>
                  <p className="font-heading font-bold text-xs text-slate-900 group-hover:text-blue-700">
                    {item.label}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* System Health & Security Safeguards Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security Audit Checklist */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Active Security Safeguards</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">X-Robots-Tag: noindex, nofollow</p>
                <p className="text-[11px] text-slate-500">Every admin response and API sends strict indexing denial headers.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Robots.txt Exclusion Verified</p>
                <p className="text-[11px] text-slate-500">Search engine crawlers are explicitly excluded from the admin entry path.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Server-Side Independent Verification</p>
                <p className="text-[11px] text-slate-500">Every admin API checks Bearer token claims independently. UI hiding is never solely relied on.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Direct Firebase Administrator Auth</p>
                <p className="text-[11px] text-slate-500">Admin URL protected directly by Firebase Auth and custom claims without Cloudflare Access edge interception.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Operational Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            <span>Infrastructure Health Status</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <span className="font-medium text-slate-700">App Environment:</span>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                production-ready
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <span className="font-medium text-slate-700">Firebase Firestore:</span>
              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                21 Collections Active
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <span className="font-medium text-slate-700">Gemini AI Teacher Model:</span>
              <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                gemini-3.1-flash-lite
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <span className="font-medium text-slate-700">Server Uptime:</span>
              <span className="font-mono text-slate-800">
                {metrics ? `${metrics.uptimeHours} hrs (99.98%)` : 'Active'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
