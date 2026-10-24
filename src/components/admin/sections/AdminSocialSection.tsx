import React, { useEffect, useState } from 'react';
import { adminService } from '../../../services/adminService';
import type { DashboardAnalyticsData } from '../../../lib/analytics/analyticsTypes';
import { Button } from '../../ui/Button';
export const AdminSocialSection: React.FC = () => {
  const [data, setData] = useState<DashboardAnalyticsData['social']>();
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setData(undefined); setError('');
    adminService.getAnalyticsDashboard('30d').then(result => {
      if (!result.success || !result.data?.social) throw new Error(result.error || 'Sharing activity is unavailable.');
      if (active) setData(result.data.social);
    }).catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);
  const labels: Record<string, string> = { whatsapp: 'WhatsApp', telegram: 'Telegram', clipboard: 'Copy link', web_share: 'Device share menu', twitter: 'X / Twitter', other: 'Other' };
  return <section className="space-y-5">
    <div className="flex justify-between gap-3"><div><h1 className="text-xl font-bold">Social sharing</h1><p className="text-sm text-slate-600">Reported sharing actions in the last 30 days, using India Standard Time.</p></div><Button variant="outline" disabled={loading} onClick={() => setRefresh(v => v + 1)}>Refresh</Button></div>
    {loading && <p role="status">Loading sharing activity…</p>}
    {error && <p role="alert" className="p-4 bg-red-50 text-red-800 rounded-lg">{error}</p>}
    {data && <><div className="border rounded-xl bg-white p-5"><p className="text-sm text-slate-600">Total reported shares</p><p className="text-3xl font-bold">{data.totalShares.toLocaleString()}</p></div>
      <div className="border rounded-xl bg-white p-5 space-y-3"><h2 className="font-bold">Channels</h2>{Object.entries(data.byChannel).map(([channel, count]) => <p key={channel}>{labels[channel] || channel}: {count.toLocaleString()}</p>)}{!data.totalShares && <p>No saved sharing actions in this period.</p>}</div></>}
    <p className="text-sm text-slate-600">Sharing actions do not confirm that a recipient opened a link. In-app browser visits and external browser launches are Not measured.</p>
  </section>;
};
