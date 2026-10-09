import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Percent,
  Search,
  RefreshCw,
  ShoppingBag,
  Award,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CouponItem, CouponDiscountType, CouponScope } from '../../lib/coupons/types';

interface CouponsManagementTabProps {
  authHeaders: Record<string, string>;
}

export const CouponsManagementTab: React.FC<CouponsManagementTabProps> = ({ authHeaders }) => {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState<string>('all_scopes');

  // Modal / Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<CouponDiscountType>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(100);
  const [enabled, setEnabled] = useState(true);
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<CouponScope>('all');
  const [selectedProductIdsInput, setSelectedProductIdsInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minimumCartAmount, setMinimumCartAmount] = useState<string>('');
  const [maximumDiscountAmount, setMaximumDiscountAmount] = useState<string>('');
  const [usageLimit, setUsageLimit] = useState<string>('');
  const [perUserLimit, setPerUserLimit] = useState<number>(1);

  // Live Test Coupon State
  const [testCode, setTestCode] = useState('');
  const [testCartGross, setTestCartGross] = useState<number>(999);
  const [testHasAnnualPass, setTestHasAnnualPass] = useState(true);
  const [testTesting, setTestTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const fetchCoupons = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/coupons', { headers: authHeaders });
      const data = await res.json();
      if (data.success) {
        setCoupons(data.coupons || []);
      } else {
        setErrorMsg(data.error || 'Failed to fetch coupons');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error fetching coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setCode('');
    setDiscountType('fixed');
    setDiscountValue(100);
    setEnabled(true);
    setDescription('');
    setScope('annual_pass_only');
    setSelectedProductIdsInput('');
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate('');
    setMinimumCartAmount('');
    setMaximumDiscountAmount('');
    setUsageLimit('1000');
    setPerUserLimit(1);
    setModalOpen(true);
  };

  const handleOpenEdit = (c: CouponItem) => {
    setIsEditing(true);
    setCode(c.code);
    setDiscountType(c.discountType);
    setDiscountValue(c.discountValue);
    setEnabled(c.enabled);
    setDescription(c.description || '');
    setScope(c.scope);
    setSelectedProductIdsInput((c.selectedProductIds || []).join(', '));
    setStartDate(c.startDate ? c.startDate.slice(0, 10) : '');
    setEndDate(c.endDate ? c.endDate.slice(0, 10) : '');
    setMinimumCartAmount(c.minimumCartAmount != null ? String(c.minimumCartAmount) : '');
    setMaximumDiscountAmount(c.maximumDiscountAmount != null ? String(c.maximumDiscountAmount) : '');
    setUsageLimit(c.usageLimit != null ? String(c.usageLimit) : '');
    setPerUserLimit(c.perUserLimit ?? 1);
    setModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMsg('Coupon code is required.');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const selectedIds = selectedProductIdsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        enabled,
        description: description.trim(),
        scope,
        selectedProductIds: selectedIds,
        startDate: startDate ? startDate : null,
        endDate: endDate ? endDate : null,
        minimumCartAmount: minimumCartAmount ? Number(minimumCartAmount) : null,
        maximumDiscountAmount: maximumDiscountAmount ? Number(maximumDiscountAmount) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        perUserLimit: Number(perUserLimit) || 1,
      };

      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Coupon "${data.coupon.code}" successfully saved.`);
        setTimeout(() => setSuccessMsg(''), 4000);
        setModalOpen(false);
        fetchCoupons();
      } else {
        setErrorMsg(data.error || 'Failed to save coupon');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async (codeToDelete: string) => {
    try {
      const res = await fetch(`/api/admin/coupons/${codeToDelete}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Coupon "${codeToDelete}" deleted.`);
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchCoupons();
      } else {
        setErrorMsg(data.error || 'Failed to delete coupon');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error deleting coupon');
    }
  };

  const handleTestCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testCode.trim()) return;
    setTestTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: testCode.trim().toUpperCase(),
          cartGrossAmount: testCartGross,
          currency: 'INR',
          items: [
            {
              id: testHasAnnualPass ? 'item-annual-pass' : 'ch-real-numbers',
              title: testHasAnnualPass ? 'All-Class Annual Pass' : 'Chapter: Real Numbers',
              unitPrice: testCartGross,
              quantity: 1,
              annualPass: testHasAnnualPass,
            },
          ],
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTestTesting(false);
    }
  };

  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesScope = scopeFilter === 'all_scopes' || c.scope === scopeFilter;
    return matchesSearch && matchesScope;
  });

  return (
    <div className="space-y-8">
      {/* Alert Messages */}
      {errorMsg && (
        <div className="p-4 rounded-lg bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-between text-xs text-[#991B1B]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="p-1 hover:bg-black/5 rounded cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-between text-xs text-[#065F46]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#10B981]" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="p-1 hover:bg-black/5 rounded cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-heading font-semibold text-[#00687A] mb-1">
            <Tag className="w-4 h-4" />
            <span>Authoritative Promotion Rules</span>
          </div>
          <h2 className="font-heading font-bold text-xl text-[#0F172A]">
            Coupon Engine & Discount Rules
          </h2>
          <p className="text-xs text-[#64748B] mt-1 max-w-2xl">
            Configure fixed or percentage discounts with strict server validation. Enforce start/end dates,
            minimum cart totals, maximum discount caps, per-student limits, and product scopes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchCoupons}
            disabled={loading}
            className="text-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handleOpenCreate}
            className="text-xs font-bold cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Create Coupon</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search coupon code or description..."
            className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#00687A]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-heading font-semibold text-[#64748B] whitespace-nowrap">
            Scope:
          </label>
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#00687A]"
          >
            <option value="all_scopes">All Scopes</option>
            <option value="all">All Products</option>
            <option value="annual_pass_only">Annual Pass Only</option>
            <option value="selected_products">Selected Products</option>
          </select>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-heading font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Scope</th>
                <th className="py-3 px-4">Constraints</th>
                <th className="py-3 px-4">Redemptions</th>
                <th className="py-3 px-4">Validity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {loading && coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#64748B]">
                    Loading coupons from server...
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#64748B]">
                    No coupons match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((c) => {
                  const now = new Date();
                  const isExpired = c.endDate && now > new Date(`${c.endDate}T23:59:59`);
                  const isNotStarted = c.startDate && now < new Date(c.startDate);

                  return (
                    <tr key={c.code} className="hover:bg-[#F8FAFC] transition-colors">
                      {/* Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#0F172A] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
                            {c.code}
                          </span>
                        </div>
                        {c.description && (
                          <div className="text-[11px] text-[#64748B] mt-0.5 max-w-xs truncate">
                            {c.description}
                          </div>
                        )}
                      </td>

                      {/* Discount Value */}
                      <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                        {c.discountType === 'fixed' ? (
                          <span className="text-[#059669] font-mono text-sm">
                            ₹{c.discountValue} OFF
                          </span>
                        ) : (
                          <div>
                            <span className="text-[#059669] font-mono text-sm">
                              {c.discountValue}% OFF
                            </span>
                            {c.maximumDiscountAmount && (
                              <div className="text-[10px] text-[#64748B]">
                                Cap: ₹{c.maximumDiscountAmount}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Scope */}
                      <td className="py-3.5 px-4">
                        {c.scope === 'annual_pass_only' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-heading font-semibold bg-[#E0F2FE] text-[#0369A1]">
                            <Award className="w-3 h-3" />
                            <span>Annual Pass Only</span>
                          </span>
                        ) : c.scope === 'selected_products' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-heading font-semibold bg-[#FEF3C7] text-[#92400E]">
                            <ShoppingBag className="w-3 h-3" />
                            <span>{c.selectedProductIds?.length || 0} Products</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-heading font-semibold bg-[#F1F5F9] text-[#475569]">
                            <span>All Products</span>
                          </span>
                        )}
                      </td>

                      {/* Constraints */}
                      <td className="py-3.5 px-4 text-[11px] text-[#475569] space-y-0.5">
                        {c.minimumCartAmount ? (
                          <div>Min Cart: <strong className="font-mono">₹{c.minimumCartAmount}</strong></div>
                        ) : (
                          <div className="text-[#94A3B8]">No min cart</div>
                        )}
                        <div>Per-user: <strong className="font-mono">{c.perUserLimit || 1}x</strong></div>
                      </td>

                      {/* Redemptions */}
                      <td className="py-3.5 px-4 text-[11px]">
                        <div className="font-mono font-bold text-[#0F172A]">
                          {c.timesUsed}{' '}
                          <span className="text-[#94A3B8] font-normal">
                            / {c.usageLimit ?? '∞'}
                          </span>
                        </div>
                        {c.usageLimit && c.timesUsed >= c.usageLimit && (
                          <span className="text-[10px] text-[#DC2626] font-semibold block">
                            Limit Reached
                          </span>
                        )}
                      </td>

                      {/* Validity */}
                      <td className="py-3.5 px-4 text-[11px] text-[#475569]">
                        {c.startDate || c.endDate ? (
                          <div>
                            <div>{c.startDate ? c.startDate.slice(0, 10) : 'Any'}</div>
                            <div className="text-[#94A3B8]">to {c.endDate ? c.endDate.slice(0, 10) : 'Ongoing'}</div>
                          </div>
                        ) : (
                          <span className="text-[#059669]">Indefinite</span>
                        )}
                        {isExpired && (
                          <span className="text-[10px] text-[#DC2626] font-semibold block">
                            Expired
                          </span>
                        )}
                        {isNotStarted && (
                          <span className="text-[10px] text-[#D97706] font-semibold block">
                            Starts Soon
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {c.enabled && !isExpired ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                            Active
                          </span>
                        ) : !c.enabled ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading font-semibold bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                            Paused
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading font-semibold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
                            Expired
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setTestCode(c.code);
                              // Scroll down to tester
                              const el = document.getElementById('coupon-tester-section');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            title="Test this coupon in simulator"
                            className="p-1 text-[#00687A] hover:bg-[#E0F2FE] rounded transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(c)}
                            title="Edit coupon"
                            className="p-1 text-[#475569] hover:bg-[#F1F5F9] rounded transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(c.code)}
                            title="Delete coupon"
                            className="p-1 text-[#DC2626] hover:bg-[#FEE2E2] rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Coupon Validation Simulator */}
      <div id="coupon-tester-section" className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-heading font-semibold text-[#00687A] mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Trust Verification</span>
            </div>
            <h3 className="font-heading font-bold text-base text-[#0F172A]">
              Live Server-Side Coupon Simulator
            </h3>
            <p className="text-xs text-[#64748B]">
              Simulate exact checkout calculations. Verify date windows, cart minimums, and product constraints directly against the server authority.
            </p>
          </div>
        </div>

        <form onSubmit={handleTestCoupon} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-heading font-semibold text-[#475569] mb-1">
              Coupon Code
            </label>
            <input
              type="text"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
              placeholder="e.g. BOARD2026"
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#00687A]"
            />
          </div>

          <div>
            <label className="block text-xs font-heading font-semibold text-[#475569] mb-1">
              Cart Gross (₹)
            </label>
            <input
              type="number"
              value={testCartGross}
              onChange={(e) => setTestCartGross(Number(e.target.value))}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#00687A]"
            />
          </div>

          <div>
            <label className="block text-xs font-heading font-semibold text-[#475569] mb-1">
              Cart Content
            </label>
            <select
              value={testHasAnnualPass ? 'pass' : 'other'}
              onChange={(e) => setTestHasAnnualPass(e.target.value === 'pass')}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#00687A]"
            >
              <option value="pass">Includes Annual Pass (₹{testCartGross})</option>
              <option value="other">Selected Subject Chapters Only</option>
            </select>
          </div>

          <div>
            <Button
              type="submit"
              size="md"
              variant="secondary"
              disabled={testTesting || !testCode.trim()}
              className="w-full text-xs font-bold cursor-pointer"
            >
              {testTesting ? 'Validating on Server...' : 'Test Server Calculation'}
            </Button>
          </div>
        </form>

        {testResult && (
          <div
            className={`p-4 rounded-xl border transition-all ${
              testResult.valid
                ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#14532D]'
                : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-bold text-sm flex items-center gap-1.5">
                  {testResult.valid ? (
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[#DC2626]" />
                  )}
                  <span>
                    {testResult.valid
                      ? `Valid Coupon: ${testResult.code}`
                      : `Validation Failed`}
                  </span>
                </div>
                <div className="text-xs mt-1">
                  {testResult.valid ? testResult.message : testResult.error || testResult.message}
                </div>

                {testResult.valid && (
                  <div className="mt-3 grid grid-cols-3 gap-4 pt-3 border-t border-[#86EFAC]/40 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-[#166534] font-sans block">Cart Gross:</span>
                      <strong>₹{testCartGross}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#166534] font-sans block">Server Discount:</span>
                      <strong className="text-[#15803D]">-₹{testResult.discountAmount}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#166534] font-sans block">Net Authoritative:</span>
                      <strong className="text-[#00687A] text-sm">₹{testResult.netAmount}</strong>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setTestResult(null)}
                className="p-1 hover:bg-black/5 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#E0F2FE] text-[#00687A] rounded-lg">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-[#0F172A]">
                    {isEditing ? `Edit Coupon: ${code}` : 'Create New Promotional Coupon'}
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Authoritative rules evaluated strictly on the backend.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-[#64748B] hover:text-[#0F172A] rounded-lg hover:bg-[#F1F5F9] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
              {/* Row 1: Code & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-heading font-semibold text-[#475569] mb-1">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    disabled={isEditing}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. BOARD2026"
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 font-mono font-bold text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#00687A] disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block font-heading font-semibold text-[#475569] mb-1">
                    Status
                  </label>
                  <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-[#0F172A]">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setEnabled(e.target.checked)}
                        className="rounded border-[#CBD5E1] text-[#00687A] focus:ring-[#00687A] w-4 h-4 cursor-pointer"
                      />
                      <span>Active (Accepting redemptions)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-heading font-semibold text-[#475569] mb-1">
                  Public Description / Promotion Banner Note
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Flat ₹100 off on All-Class Annual Pass for Board Exam Prep"
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                />
              </div>

              {/* Row 2: Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div>
                  <label className="block font-heading font-semibold text-[#475569] mb-1">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as CouponDiscountType)}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  >
                    <option value="fixed">Fixed Rupee (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-heading font-semibold text-[#475569] mb-1">
                    {discountType === 'fixed' ? 'Discount Amount (₹)' : 'Discount Rate (%)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={discountType === 'percentage' ? 100 : 5000}
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                </div>

                <div>
                  <label className="block font-heading font-semibold text-[#475569] mb-1">
                    Maximum Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Optional (e.g. 250)"
                    value={maximumDiscountAmount}
                    onChange={(e) => setMaximumDiscountAmount(e.target.value)}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                  <span className="text-[10px] text-[#64748B] mt-0.5 block">
                    Capping limit for percentage discounts
                  </span>
                </div>
              </div>

              {/* Row 3: Product Scope */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                <div>
                  <label className="block font-heading font-semibold text-[#475569] mb-1">
                    Eligible Product Scope
                  </label>
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value as CouponScope)}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  >
                    <option value="annual_pass_only">Annual Pass Only (Exclusive to Annual Tuition)</option>
                    <option value="all">All Products (Passes, Courses, Notes, Test Papers)</option>
                    <option value="selected_products">Selected Specific Products</option>
                  </select>
                </div>

                {scope === 'selected_products' && (
                  <div>
                    <label className="block font-heading font-semibold text-[#475569] mb-1">
                      Selected Product IDs (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={selectedProductIdsInput}
                      onChange={(e) => setSelectedProductIdsInput(e.target.value)}
                      placeholder="e.g. ch-real-numbers, ch-polynomials, test-paper-10-board"
                      className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                    />
                  </div>
                )}
              </div>

              {/* Row 4: Minimum Cart & Usage Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-heading font-semibold text-[#475569] mb-1">
                    Minimum Cart Total (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 500"
                    value={minimumCartAmount}
                    onChange={(e) => setMinimumCartAmount(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                </div>

                <div>
                  <label className="block font-heading font-semibold text-[#475569] mb-1">
                    Total Global Usage Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                </div>

                <div>
                  <label className="block font-heading font-semibold text-[#475569] mb-1">
                    Per-Student Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={perUserLimit}
                    onChange={(e) => setPerUserLimit(Number(e.target.value))}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                  <span className="text-[10px] text-[#64748B] mt-0.5 block">
                    Max redemptions per user account
                  </span>
                </div>
              </div>

              {/* Row 5: Start & End Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-heading font-semibold text-[#475569] mb-1">
                    Start Date (Valid from)
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                </div>

                <div>
                  <label className="block font-heading font-semibold text-[#475569] mb-1">
                    End Date (Expires on)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  className="text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving}
                  className="text-xs font-bold cursor-pointer"
                >
                  {saving ? 'Saving...' : isEditing ? 'Update Coupon' : 'Create Coupon'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
