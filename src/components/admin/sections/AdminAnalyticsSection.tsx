import React, { useEffect, useState } from 'react';
import { adminService } from '../../../services/adminService';
import type { DashboardAnalyticsData } from '../../../lib/analytics/analyticsTypes';
import { Button } from '../../ui/Button';

export const AdminAnalyticsSection: React.FC = () => {
  const [data, setData] = useState<DashboardAnalyticsData | null>(null);
  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setData(null);
    adminService.getAnalyticsDashboard(timeframe).then(result => {
      if (!active) return;
      if (!result.success || !result.data) throw new Error(result.error || 'Analytics could not be loaded.');
      setData(result.data);
    }).catch(err => { if (active) setError(err.message || 'Analytics could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [timeframe, refresh]);
  const exportData = () => {
    if (!data) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `mayf-analytics-${timeframe}.json`; link.click(); URL.revokeObjectURL(url);
  };
  const s = data?.summary;
  const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
  return <section className="space-y-6">
    <div className="flex flex-wrap justify-between gap-4">
      <div><h1 className="text-xl font-bold">Analytics</h1><p className="text-sm text-slate-600">Saved activity and verified orders. Dates use India Standard Time.</p></div>
      <div className="flex flex-wrap gap-2">
        <select aria-label="Analytics period" value={timeframe} onChange={e => setTimeframe(e.target.value as typeof timeframe)} className="border rounded-lg px-3 py-2">
          <option value="today">Today</option><option value="7d">7 days</option><option value="30d">30 days</option><option value="all">All time</option>
        </select>
        <Button variant="outline" disabled={loading} onClick={() => setRefresh(v => v + 1)}>Refresh</Button>
        <Button variant="outline" disabled={!data || loading} onClick={exportData}>Export JSON</Button>
      </div>
    </div>
    {loading && <p role="status">Loading saved analytics…</p>}
    {error && <p role="alert" className="p-4 border border-red-200 bg-red-50 text-red-800 rounded-lg">{error}</p>}
    {s && <>
      <p className="text-sm p-4 rounded-lg bg-blue-50 text-blue-900">Activity counts are reported events, not unique people. User counts, live sessions, search queries and renewal rates are not measured here. Revenue below is INR only; other currencies are shown separately. AI counts include saved successful sessions. Downloads count files served by the server; a browser may cancel after delivery starts.</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['Page views', s.traffic.totalPageViews.toLocaleString()], ['Files served', s.downloads.total.toLocaleString()],
          ['Saved AI answers', s.aiUsage.totalQuestions.toLocaleString()], ['Paid orders', s.orders.completedOrders.toLocaleString()],
          ['INR revenue', money(s.revenue.totalRevenue)], ['INR average order', money(s.orders.averageOrderValue)],
          ['Pending orders', s.orders.pendingOrders.toLocaleString()], ['Active passes now', s.annualPassSubscriptions.activePasses.toLocaleString()],
        ].map(([label, value]) => <div key={label} className="bg-white border rounded-xl p-4"><p className="text-sm text-slate-600">{label}</p><p className="text-2xl font-bold mt-2">{value}</p></div>)}
      </div>
      <div className="bg-white border rounded-xl p-4 space-y-2"><h2 className="font-bold">Paid revenue by currency</h2>
        {Object.entries(s.revenue.byCurrency || {}).map(([currency, value]) => <p key={currency}>{currency}: {new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(value)}</p>)}
        {!Object.keys(s.revenue.byCurrency || {}).length && <p className="text-slate-600">No paid orders in this period.</p>}
      </div>
      <div className="bg-white border rounded-xl p-4 space-y-2"><h2 className="font-bold">Activity and orders</h2>
        <p>{s.conversion.contentViews} content views · {s.conversion.checkoutStarts} reported checkout starts · {s.conversion.purchases} verified purchases</p>
        <p className="text-sm text-slate-600">These counts describe separate events and are not a linked user conversion funnel. Paid orders use payment date; pending orders use creation date. Active passes reflect the current time.</p>
        <p className="text-sm">INR revenue this calendar month: {money(s.revenue.revenueThisMonth)} · New passes this calendar month: {s.annualPassSubscriptions.newPassesThisMonth}</p>
      </div>
      <div className="bg-white border rounded-xl p-4 overflow-x-auto"><h2 className="font-bold mb-3">Content activity</h2>
        {data.popularContent.length ? <table className="w-full text-sm text-left"><thead><tr><th className="p-2">Content</th><th className="p-2">Views</th><th className="p-2">Files served</th><th className="p-2">Shares</th></tr></thead><tbody>
          {data.popularContent.map(item => <tr key={item.id} className="border-t"><td className="p-2">{item.title}</td><td className="p-2">{item.views}</td><td className="p-2">{item.downloads}</td><td className="p-2">{item.shares}</td></tr>)}
        </tbody></table> : <p className="text-slate-600">No saved content activity in this period.</p>}
      </div>
      <p className="text-xs text-slate-500">Updated {new Date(data.lastUpdated).toLocaleString()} · {data.architecture.scannedRecords} saved records read · {data.architecture.queryTimeMs} ms</p>
    </>}
  </section>;
};
