import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Download,
  Sparkles,
  Receipt,
  CreditCard,
  Percent,
  Layers,
  GraduationCap,
  Search,
  RefreshCw,
  FileDown,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Filter,
  DollarSign,
  Share2,
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { DashboardAnalyticsData } from '../../../lib/analytics/analyticsTypes';
import { Button } from '../../ui/Button';

export const AdminAnalyticsSection: React.FC = () => {
  const [data, setData] = useState<DashboardAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const fetchAnalytics = async (tf: 'today' | '7d' | '30d' | 'all' = timeframe) => {
    setIsRefreshing(true);
    try {
      const res = await adminService.getAnalyticsDashboard(tf);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('[AdminAnalytics] Fetch error:', err);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(timeframe);
  }, [timeframe]);

  const handleExportJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mayf_analytics_aggregates_${timeframe}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice('Exported analytics snapshot!');
    setTimeout(() => setExportNotice(null), 3000);
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw className="w-8 h-8 text-[#00687A] animate-spin" />
        <p className="text-sm font-medium text-slate-600">Loading pre-aggregated analytics...</p>
      </div>
    );
  }

  const summary = data?.summary;
  const architecture = data?.architecture;

  return (
    <div className="space-y-6">
      {/* Top Header & Architecture Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
              Executive Analytics & Performance Engine
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Zap className="w-3 h-3 text-emerald-600" />
              O(1) Aggregated Rollup
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative product analytics, conversion funnels, and academic engagement without scanning raw activity tables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium">
            {(['today', '7d', '30d', 'all'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf === 'today' ? 'Today' : tf === '7d' ? '7 Days' : tf === '30d' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchAnalytics(timeframe)}
            disabled={isRefreshing}
            className="gap-1.5 cursor-pointer text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportJson}
            className="gap-1.5 cursor-pointer text-xs"
          >
            <FileDown className="w-3.5 h-3.5" />
            Export Data
          </Button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Architecture & Privacy Guarantee Notice */}
      <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
          <div className="space-y-0.5">
            <p className="font-semibold text-slate-100">
              Zero Raw Event Scanning & Student Privacy Invariant
            </p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              All dashboard metrics resolve in{' '}
              <span className="text-emerald-400 font-mono font-bold">{architecture?.queryTimeMs || 1.2}ms</span>{' '}
              with <span className="text-emerald-400 font-mono font-bold">0 records scanned</span>. Student names, emails, and homework questions are strictly prohibited from analytics events.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 font-mono text-[11px] text-slate-300">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>Synced: {new Date(data?.lastUpdated || '').toLocaleTimeString()}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TOP SUMMARY KPI CARDS (Users, Traffic, Downloads, AI, Orders, Revenue) */}
      {/* ========================================================================= */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {/* 1. Total Users */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-medium">Total Users</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xl font-heading font-extrabold text-slate-900">
              {summary.totalUsers.toLocaleString()}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              +{summary.newUsersToday} today
            </p>
          </div>

          {/* 2. Active Users (DAU / MAU) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-medium">Active (DAU)</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xl font-heading font-extrabold text-slate-900">
              {summary.activeUsers.dau.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500">
              WAU: {summary.activeUsers.wau.toLocaleString()}
            </p>
          </div>

          {/* 3. Traffic (Page Views) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-medium">Page Views</span>
              <Eye className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xl font-heading font-extrabold text-slate-900">
              {summary.traffic.totalPageViews.toLocaleString()}
            </p>
            <p className="text-[11px] text-purple-700 font-semibold">
              +{summary.traffic.pageViewsToday.toLocaleString()} today
            </p>
          </div>

          {/* 4. Total Downloads */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-medium">Downloads</span>
              <Download className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xl font-heading font-extrabold text-slate-900">
              {summary.downloads.total.toLocaleString()}
            </p>
            <p className="text-[11px] text-emerald-700 font-semibold">
              +{summary.downloads.today} today
            </p>
          </div>

          {/* 5. AI Doubts / Usage */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-medium">AI Questions</span>
              <Sparkles className="w-4 h-4 text-[#00687A]" />
            </div>
            <p className="text-xl font-heading font-extrabold text-slate-900">
              {summary.aiUsage.totalQuestions.toLocaleString()}
            </p>
            <p className="text-[11px] text-[#00687A] font-semibold">
              +{summary.aiUsage.questionsToday} today
            </p>
          </div>

          {/* 6. Completed Orders */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-medium">Orders</span>
              <Receipt className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-xl font-heading font-extrabold text-slate-900">
              {summary.orders.completedOrders.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500">
              AOV: ₹{summary.orders.averageOrderValue}
            </p>
          </div>

          {/* 7. Total Revenue */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-medium">Revenue</span>
              <DollarSign className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-xl font-heading font-extrabold text-slate-900">
              ₹{(summary.revenue.totalRevenue / 1000).toFixed(1)}k
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold">
              +₹{(summary.revenue.revenueToday).toLocaleString()} today
            </p>
          </div>

          {/* 8. Annual Pass Subscriptions */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-medium">Annual Passes</span>
              <CreditCard className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xl font-heading font-extrabold text-slate-900">
              {summary.annualPassSubscriptions.activePasses.toLocaleString()}
            </p>
            <p className="text-[11px] text-amber-700 font-semibold">
              {summary.annualPassSubscriptions.renewalRate}% renewal
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CONVERSION FUNNEL ARCHITECTURE                                         */}
      {/* ========================================================================= */}
      {summary && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                <Percent className="w-4 h-4 text-[#00687A]" />
                <span>E-Commerce & Subscription Conversion Funnel</span>
              </h3>
              <p className="text-xs text-slate-500">
                End-to-end journey from initial public pageview to Annual Pass subscription completion.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg font-semibold border border-emerald-200">
                Overall Conversion: {summary.conversion.overallConversionRate}%
              </div>
              <div className="px-3 py-1 bg-blue-50 text-blue-800 rounded-lg font-semibold border border-blue-200">
                Checkout Completion: {summary.conversion.checkoutCompletionRate}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            {/* Stage 1: Public Traffic */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 relative">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stage 1</span>
              <p className="font-semibold text-slate-700 text-xs">Public Visitors</p>
              <p className="text-lg font-heading font-extrabold text-slate-900">
                {summary.conversion.visitors.toLocaleString()}
              </p>
              <div className="text-[11px] text-slate-500">100% of reach</div>
            </div>

            {/* Stage 2: Content Viewed */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 relative">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Stage 2</span>
              <p className="font-semibold text-slate-700 text-xs">Content Views</p>
              <p className="text-lg font-heading font-extrabold text-slate-900">
                {summary.conversion.contentViews.toLocaleString()}
              </p>
              <div className="text-[11px] text-blue-600 font-semibold">
                {Math.round((summary.conversion.contentViews / summary.conversion.visitors) * 100)}% viewed modules
              </div>
            </div>

            {/* Stage 3: Checkout Initiated */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 relative">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Stage 3</span>
              <p className="font-semibold text-slate-700 text-xs">Checkout Initiated</p>
              <p className="text-lg font-heading font-extrabold text-slate-900">
                {summary.conversion.checkoutStarts.toLocaleString()}
              </p>
              <div className="text-[11px] text-amber-600 font-semibold">
                {Math.round((summary.conversion.checkoutStarts / summary.conversion.contentViews) * 100)}% intent rate
              </div>
            </div>

            {/* Stage 4: Purchases Completed */}
            <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 space-y-1 relative">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Stage 4</span>
              <p className="font-semibold text-emerald-900 text-xs">Activated Passes</p>
              <p className="text-lg font-heading font-extrabold text-emerald-950">
                {summary.conversion.purchases.toLocaleString()}
              </p>
              <div className="text-[11px] text-emerald-700 font-semibold">
                {summary.conversion.checkoutCompletionRate}% completion
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. POPULAR CONTENT & SEARCH TRENDS (SIDE BY SIDE)                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Content */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Popular Content & Learning Modules</span>
            </h3>
            <span className="text-xs text-slate-400">Ranked by Views</span>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            {data?.popularContent.map((item, idx) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-slate-400 text-xs font-bold w-4">{idx + 1}</span>
                  <div className="truncate">
                    <p className="font-semibold text-slate-800 truncate">{item.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                      <span className="text-blue-700 font-bold">{item.classLevel}</span>
                      <span>•</span>
                      <span>{item.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 font-mono text-[11px]">
                  <span className="text-slate-700 font-semibold flex items-center gap-1" title="Views">
                    <Eye className="w-3 h-3 text-slate-400" />
                    {item.views.toLocaleString()}
                  </span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1" title="Downloads">
                    <Download className="w-3 h-3 text-emerald-500" />
                    {item.downloads.toLocaleString()}
                  </span>
                  <span className="text-purple-700 font-semibold flex items-center gap-1" title="Shares">
                    <Share2 className="w-3 h-3 text-purple-400" />
                    {item.shares}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search Trends & Keyword Discovery */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-purple-600" />
              <span>Student Search Trends & Queries</span>
            </h3>
            <span className="text-xs text-slate-400">Live Intent Signals</span>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            {data?.searchTrends.map((q, idx) => (
              <div key={q.query} className="py-2.5 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-slate-400 text-xs font-bold w-4">{idx + 1}</span>
                  <div className="truncate">
                    <p className="font-semibold text-slate-800 truncate font-mono">{q.query}</p>
                    <div className="flex items-center gap-2 text-[10px] mt-0.5">
                      {q.resultsFound ? (
                        <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Covered in catalog
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">0 results (Content Opportunity)</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
                  <span className="text-slate-600 font-bold">{q.count.toLocaleString()} searches</span>
                  {q.trend === 'up' ? (
                    <span className="text-emerald-600 font-semibold flex items-center text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded">
                      <ArrowUpRight className="w-3 h-3" /> Up
                    </span>
                  ) : q.trend === 'down' ? (
                    <span className="text-slate-400 font-semibold flex items-center text-[10px] bg-slate-50 px-1.5 py-0.5 rounded">
                      <ArrowDownRight className="w-3 h-3" /> Down
                    </span>
                  ) : (
                    <span className="text-blue-600 font-semibold text-[10px] bg-blue-50 px-1.5 py-0.5 rounded">
                      Stable
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TOP CATEGORIES, TOP CLASSES, AND AI USAGE BREAKDOWN                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Categories */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Top Mathematical Domains</span>
          </h3>

          <div className="space-y-3 text-xs">
            {data?.topCategories.map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-800">{cat.name}</span>
                  <span className="font-mono text-slate-500">{cat.percentage}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Classes */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span>Top Student Classes</span>
          </h3>

          <div className="space-y-3 text-xs">
            {data?.topClasses.map((cls) => (
              <div key={cls.classLevel} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-800">{cls.classLevel}</span>
                  <span className="font-mono text-slate-500">{cls.percentage}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${cls.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Teacher Topic Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00687A]" />
            <span>AI Doubts Topic Distribution</span>
          </h3>

          <div className="space-y-3 text-xs">
            {summary &&
              Object.entries(summary.aiUsage.byCategory).slice(0, 5).map(([topic, count]) => {
                const total = summary.aiUsage.totalQuestions || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={topic} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-800">{topic}</span>
                      <span className="font-mono text-slate-500">{count.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00687A] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, pct * 2.5)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. DOWNLOADS BY FORMAT & REVENUE STREAMS                                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Downloads By Format */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
            <Download className="w-4 h-4 text-slate-600" />
            <span>Download Formats Breakdown</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            {summary?.downloads.byFormat.map((df) => (
              <div key={df.format} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 uppercase tracking-wide text-[11px]">
                    {df.format.replace('_', ' ')}
                  </span>
                </div>
                <span className="font-mono text-slate-600 font-bold text-xs">
                  {df.count.toLocaleString()} files downloaded
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue & Subscription Performance */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Subscription & Revenue Performance</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5">
              <span className="text-slate-500 text-[11px]">This Month Revenue</span>
              <p className="font-heading font-bold text-base text-slate-900">
                ₹{summary?.revenue.revenueThisMonth.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5">
              <span className="text-slate-500 text-[11px]">New Passes (Month)</span>
              <p className="font-heading font-bold text-base text-slate-900">
                {summary?.annualPassSubscriptions.newPassesThisMonth} passes
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5">
              <span className="text-slate-500 text-[11px]">Renewal Retention Rate</span>
              <p className="font-heading font-bold text-base text-slate-900">
                {summary?.annualPassSubscriptions.renewalRate}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5">
              <span className="text-slate-500 text-[11px]">Average Order Value</span>
              <p className="font-heading font-bold text-base text-slate-900">
                ₹{summary?.orders.averageOrderValue}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
