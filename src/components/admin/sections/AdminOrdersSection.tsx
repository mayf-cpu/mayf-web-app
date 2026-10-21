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

export const AdminOrdersSection: React.FC = () => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getOrders().then(setOrders).catch(() => setError('Unable to load the order ledger.')).finally(() => setLoading(false));
  }, []);

  const exportLedger = () => {
    const escape = (value: unknown) => {
      let text = String(value ?? '');
      if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    };
    const rows = [['Order', 'Customer email', 'Plan', 'Amount', 'Currency', 'Gateway', 'Status', 'Date', 'Payment ID'], ...orders.map(order => [order.orderNumber, order.customerEmail, order.planName, order.amount, order.currency, order.gateway, order.status, order.createdAt, order.paymentId])];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(row => row.map(escape).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `MAYF-orders-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
            Commercial Orders & Invoicing Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically verified webhook payments processed via Razorpay and Stripe.
          </p>
        </div>

        <Button size="sm" variant="outline" onClick={exportLedger} disabled={loading || Boolean(error)} className="gap-1.5 shadow-2xs">
          <Download className="w-3.5 h-3.5" />
          <span>Export Financial Ledger</span>
        </Button>
      </div>

      {error && <p role="alert" className="text-red-700">{error}</p>}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>{loading ? 'Loading…' : orders.length} Orders</span>
          <span className="font-mono text-[11px] text-emerald-700">Server payment ledger</span>
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
              {!loading && !orders.length && <tr><td colSpan={7} className="px-5 py-6 text-center text-slate-500">No orders have been recorded.</td></tr>}
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-mono font-bold text-slate-900">{ord.orderNumber}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{ord.paymentId}</div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 font-mono text-[11px]">{ord.customerEmail}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">{ord.planName}</td>
                  <td className="px-4 py-3.5 font-heading font-extrabold text-slate-900">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: ord.currency || 'INR' }).format(ord.amount)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 uppercase font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {ord.gateway}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      {ord.status.toUpperCase()}
                    </span>
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
    </div>
  );
};
