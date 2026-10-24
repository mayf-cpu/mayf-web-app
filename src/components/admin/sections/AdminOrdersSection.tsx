import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Download,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  ExternalLink,
} from 'lucide-react';
import { adminService, OrderRecord } from '../../../services/adminService';
import { Button } from '../../ui/Button';

const safeCsvCell = (input: string | number | undefined): string => {
  const value = String(input ?? '');
  const safe = /^[\s]*[=+\-@]/.test(value) ? "'" + value : value;
  return '"' + safe.replace(/"/g, '""') + '"';
};
export const AdminOrdersSection: React.FC = () => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Awaited<ReturnType<typeof adminService.getPaymentWebhookEvents>>>([]);
  const [auditError, setAuditError] = useState('');
  const [selected, setSelected] = useState<OrderRecord | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const refresh = async () => {
    setLoading(true);
    await Promise.all([
      adminService.getOrders().then(items => { setOrders(items); setError(''); })
        .catch(err => setError(err?.message || 'Payment ledger could not be loaded.')),
      adminService.getPaymentWebhookEvents().then(items => { setEvents(items); setAuditError(''); })
        .catch(err => setAuditError(err?.message || 'Webhook audit could not be loaded.')),
    ]);
    setLoading(false);
  };
  useEffect(() => {
    void refresh();
  }, []);
  const submitRefund = async () => {
    if (!selected || busy || !reason.trim()) return;
    setBusy(true); setNotice('');
    const result = await adminService.processRefund(selected.id, selected.amount, reason.trim());
    setNotice(result.success
      ? result.refundStatus === 'completed' ? 'Refund confirmed by the provider webhook.'
        : result.refundStatus === 'awaiting_webhook' ? 'Refund submitted; awaiting verified provider confirmation.'
        : 'Refund outcome requires reconciliation. Do not send another refund before checking the gateway.'
      : result.error || 'Refund outcome is unknown. Refresh and reconcile before retrying.');
    setSelected(null); setReason('');
    await refresh(); setBusy(false);
  };
  const exportLedger = () => {
    if (!orders.length || error) return;
    const columns = ['Order Number', 'Customer Email', 'Plan', 'Amount', 'Currency', 'Gateway', 'Status', 'Refund Request', 'Created At', 'Payment ID'];
    const rows = orders.map(order => [order.orderNumber, order.customerEmail, order.planName, order.amount, order.currency, order.gateway, order.status, order.refundRequestStatus, order.createdAt, order.paymentId].map(safeCsvCell).join(','));
    const csv = [columns.map(safeCsvCell).join(','), ...rows].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'mayf_orders_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
            Commercial Orders & Invoicing Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Actual payment orders from the Firestore ledger. Pending and refunded orders are displayed separately.
          </p>
        </div>

        <Button size="sm" variant="outline" onClick={() => void refresh()} disabled={loading || busy}>Refresh ledger & webhook audit</Button>
        <Button size="sm" variant="outline" onClick={exportLedger} disabled={loading || !orders.length || Boolean(error)} className="gap-1.5 shadow-2xs">
          <Download className="w-3.5 h-3.5" />
          <span>Export Financial Ledger</span>
        </Button>
      </div>

      {error && <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">{error}</p>}
      {notice && <p role="status" className="rounded-xl border p-4 text-sm">{notice}</p>}
      {selected && <section aria-label="Review full refund" className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-3">
        <h3 className="font-bold">Review full refund</h3>
        <p>{selected.orderNumber} · {selected.customerEmail} · {selected.currency} {selected.amount.toFixed(2)}</p>
        <p>The server checks that this is the latest paid pass. Access changes only after verified provider confirmation.</p>
        <label className="block">Refund reason <input aria-label="Refund reason" maxLength={500} value={reason} disabled={busy} onChange={e => setReason(e.target.value)} className="block border rounded p-2 w-full" /></label>
        <Button onClick={() => void submitRefund()} disabled={busy || !reason.trim()}>Submit full refund</Button>
        <Button variant="outline" disabled={busy} onClick={() => setSelected(null)}>Cancel refund</Button>
      </section>}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>{orders.length} Recorded Orders</span>
          <span className="font-mono text-[11px] text-emerald-700">Durable Firestore Ledger</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-heading text-[10px]">
              <tr>
                <th className="px-5 py-3">Order Number</th>
                <th className="px-4 py-3">Customer Email</th>
                <th className="px-4 py-3">Purchased Plan</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Gateway</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading && <tr><td colSpan={7} className="px-5 py-8">Loading payment ledger…</td></tr>}
              {!loading && !error && orders.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-500">No recorded orders yet.</td></tr>}
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-mono font-bold text-slate-900">{ord.orderNumber}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{ord.paymentId}</div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 font-mono text-[11px]">{ord.customerEmail}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">{ord.planName}</td>
                  <td className="px-4 py-3.5 font-heading font-extrabold text-slate-900">
                    {ord.currency === 'INR' ? '₹' : ord.currency === 'USD' ? '$' : ord.currency + ' '}{ord.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 uppercase font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {ord.gateway}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={ord.status === "paid" ? "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200" : "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200"}>
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      {ord.status.toUpperCase()}
                    </span>
                    {ord.refundRequestStatus && <div className="mt-1 text-[11px] text-amber-800">Refund: {ord.refundRequestStatus.replaceAll('_', ' ')}</div>}
                    {ord.refundAvailable === true && <Button size="sm" variant="outline" disabled={busy || loading || Boolean(error)} onClick={() => { setSelected(ord); setReason(''); }}>Review full refund</Button>}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-[11px] text-slate-500">
                    {ord.createdAt.split('T')[0]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <section aria-label="Verified webhook settlements" className="bg-white border rounded-xl p-5 space-y-3">
        <h3 className="font-bold">Verified webhook settlements</h3>
        <p className="text-sm">Durable records written after signature verification and atomic settlement. Duplicate deliveries do not create another settlement.</p>
        {auditError ? <p role="alert">{auditError}</p> : loading ? <p>Loading webhook audit…</p> : events.length === 0 ? <p>No verified settlements recorded.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr><th>Outcome</th><th>Order</th><th>Event</th><th>Payment / Refund</th><th>Processed</th></tr></thead><tbody>{events.map(event => <tr key={event.provider + ':' + event.eventId}><td>{event.outcome}</td><td>{event.orderId}</td><td>{event.eventId}</td><td>{event.providerPaymentId}{event.refundId && <div>{event.refundId}</div>}</td><td>{event.processedAt}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
};
