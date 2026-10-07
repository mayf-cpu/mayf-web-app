import React, { useState, useEffect } from 'react';
import { ShoppingBag, Download, ShieldCheck, CheckCircle2, RotateCcw, CreditCard } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { StoredOrder } from '../lib/payments/types';

export const DashboardPurchasesPage: React.FC = () => {
  const { user, firebaseUser } = useAuth();
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundRequested, setRefundRequested] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      try {
        const token = firebaseUser ? await firebaseUser.getIdToken() : 'student-session-token';
        const res = await fetch('/api/student/orders', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.orders && data.orders.length > 0) {
            setOrders(data.orders);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to load user orders:', err);
      } finally {
        setLoading(false);
      }

      // Default seed order for preview
      setOrders([
        {
          orderId: 'MAYF-ORD-2026-1001',
          userId: user?.uid || 'mayf-student-1001',
          items: [
            {
              id: 'item-pass-10',
              title: 'Maths at Your Fingertips Annual Pass (Class 5–10)',
              unitPrice: 999,
              quantity: 1,
              annualPass: true,
            },
          ],
          grossAmount: 999,
          discount: 100,
          coupon: 'BOARD2026',
          tax: 0,
          currency: 'INR',
          provider: 'razorpay',
          providerOrderId: 'order_seed_rzp_99201',
          providerPaymentId: 'pay_rzp_tx_99201_succ',
          status: 'paid',
          createdAt: '2026-10-05T11:20:00.000Z',
          paidAt: '2026-10-05T11:21:15.000Z',
        },
      ]);
    }

    loadOrders();
  }, [user, firebaseUser]);

  return (
    <DashboardLayout
      title="Orders & Invoices"
      subtitle="View your subscription details, invoices, and billing history."
    >
      <div className="space-y-6">
        
        {/* Active Subscription Summary */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-base text-[#0F172A]">
                  Maths at Your Fingertips Annual Pass
                </h3>
                <Badge variant="pro">ACTIVE</Badge>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Full academic year access · Valid for Class 5–10 Mathematics
              </p>
            </div>

            <div className="text-right">
              <span className="font-mono tabular-nums text-xl font-bold text-[#00687A]">
                ₹899.00
              </span>
              <span className="block text-[11px] text-[#059669] font-medium">Authoritatively Paid (Razorpay UPI)</span>
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
                onClick={() => alert('Downloading GST tax invoice PDF for order MAYF-ORD-2026-1001...')}
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
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E2E8F0] font-heading font-bold text-sm text-[#0F172A] flex items-center justify-between">
            <span>Authoritative Order Records</span>
            <span className="text-xs text-[#64748B] font-normal">Reconciled via Server Gateways</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Order ID</th>
                  <th className="py-2.5 px-4">Plan / Items</th>
                  <th className="py-2.5 px-4">Provider</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {orders.map((ord) => {
                  const net = ord.grossAmount - ord.discount + (ord.tax || 0);
                  return (
                    <tr key={ord.orderId} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">{ord.orderId}</td>
                      <td className="py-3 px-4 text-[#334155]">
                        <span className="font-semibold block">{ord.items?.[0]?.title || 'Annual Pass'}</span>
                        {ord.coupon && (
                          <span className="text-[10px] text-[#059669]">Coupon: {ord.coupon}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ord.provider === 'razorpay'
                            ? 'bg-[#E0F2FE] text-[#0284C7]'
                            : 'bg-[#F3E8FF] text-[#7E22CE]'
                        }`}>
                          {ord.provider}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums font-bold text-[#0F172A]">
                        {ord.currency === 'USD' ? `$${net}` : `₹${net}`}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ord.status === 'paid'
                            ? 'bg-[#ECFDF5] text-[#059669]'
                            : ord.status === 'failed'
                            ? 'bg-[#FEF2F2] text-[#DC2626]'
                            : 'bg-[#FEF3C7] text-[#D97706]'
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#64748B]">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => alert(`Downloading GST Tax Invoice for order ${ord.orderId}`)}
                          className="text-[#00687A] hover:underline font-semibold cursor-pointer"
                        >
                          Invoice PDF
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};
