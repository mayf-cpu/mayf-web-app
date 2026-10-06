import React, { useState } from 'react';
import { ShoppingBag, Download, ShieldCheck, CheckCircle2, RotateCcw } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { SAMPLE_PURCHASES } from '../data/curriculumData';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';

export const DashboardPurchasesPage: React.FC = () => {
  const { user } = useAuth();
  const [refundRequested, setRefundRequested] = useState(false);

  return (
    <DashboardLayout
      title="Orders & Invoices"
      subtitle="View your subscription details, invoices, and billing history."
    >
      <div className="space-y-6">
        
        {/* Active Subscription Summary */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-base text-[#0F172A]">
                  Maths at Your Fingertips Annual Pass
                </h3>
                <Badge variant="pro">ACTIVE</Badge>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Full academic year access · Valid until March 31, 2027
              </p>
            </div>

            <div className="text-right">
              <span className="font-mono tabular-nums text-xl font-bold text-[#0037B0]">
                ₹999.00
              </span>
              <span className="block text-[11px] text-[#059669] font-medium">Paid in full (UPI)</span>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-[#64748B]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              <span>Covered under 7-day money-back guarantee</span>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => alert('Downloading GST invoice PDF for order MAYF-ORD-2026-8841...')}
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                <span>GST Tax Invoice</span>
              </Button>

              {!refundRequested ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm('Are you sure you wish to request a refund? Our support team will process this within 24 hours.')) {
                      setRefundRequested(true);
                    }
                  }}
                  className="text-[#DC2626] hover:bg-[#FEF2F2]"
                >
                  Request 7-Day Refund
                </Button>
              ) : (
                <span className="text-[#DC2626] font-semibold text-xs py-1">
                  Refund requested · Ticket #REF-9921
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Transaction History Table */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E2E8F0] font-heading font-bold text-sm text-[#0F172A]">
            Transaction Records
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Order ID</th>
                  <th className="py-2.5 px-4">Plan Description</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {SAMPLE_PURCHASES.map((p) => (
                  <tr key={p.orderId} className="hover:bg-[#F8FAFC]/50">
                    <td className="py-3 px-4 font-mono font-medium text-[#0F172A]">{p.orderId}</td>
                    <td className="py-3 px-4 text-[#334155]">{p.planName}</td>
                    <td className="py-3 px-4 text-[#64748B] font-mono">{p.purchaseDate}</td>
                    <td className="py-3 px-4 font-mono tabular-nums font-semibold text-[#0037B0]">
                      ₹{p.amountInr}.00
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded font-semibold uppercase text-[10px]">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => alert(`Downloading Invoice for ${p.orderId}`)}
                        className="text-[#1D4ED8] hover:underline font-semibold cursor-pointer"
                      >
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};
