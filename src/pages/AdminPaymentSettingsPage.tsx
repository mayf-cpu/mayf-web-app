/**
 * Admin Payment Gateway & Authoritative Order Ledger
 * Maths at Your Fingertips (mayf.co.in)
 *
 * Implements:
 * - Provider-independent gateway settings (Razorpay Primary India, Stripe Secondary International)
 * - Secret security: NEVER displays stored plaintext secrets after saving
 * - Authoritative Order Registry with all 6 statuses: created, pending, paid, failed, refunded, cancelled
 * - Webhook Idempotency inspection ledger
 * - Interactive Webhook Simulator for testing signature & idempotency
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CreditCard,
  Lock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  DollarSign,
  Activity,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Award,
  UserPlus,
  Plus,
  Trash2,
  History,
  Calendar,
  Clock,
  Sparkles,
  X,
  Search,
  CheckSquare,
  Square,
  AlertTriangle,
  Tag,
  Percent,
} from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { Link } from '../context/NavigationContext';
import {
  MaskedPaymentGatewaySettings,
  StoredOrder,
  WebhookEventLog,
  AnnualPassSettings,
  Entitlement,
  EntitlementHistoryLog,
} from '../lib/payments/types';
import { CouponsManagementTab } from '../components/admin/CouponsManagementTab';
import { PromotionsManagementTab } from '../components/admin/PromotionsManagementTab';

export const AdminPaymentSettingsPage: React.FC = () => {
  const { user, firebaseUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'settings' | 'orders' | 'annual-pass' | 'coupons' | 'promotions' | 'idempotency' | 'simulator'>('settings');
  const [authToken, setAuthToken] = useState('admin-dev-session');

  useEffect(() => {
    async function loadToken() {
      if (firebaseUser) {
        try {
          const t = await firebaseUser.getIdToken();
          setAuthToken(t);
        } catch {}
      }
    }
    loadToken();
  }, [firebaseUser]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Annual Pass & Entitlements State
  const [passSettings, setPassSettings] = useState<AnnualPassSettings | null>(null);
  const [passEnabled, setPassEnabled] = useState(true);
  const [passName, setPassName] = useState('Maths at Your Fingertips All-Class Annual Pass');
  const [regularPrice, setRegularPrice] = useState(1999);
  const [salePrice, setSalePrice] = useState(999);
  const [durationDays, setDurationDays] = useState(365);
  const [passDescription, setPassDescription] = useState('');
  const [passBenefits, setPassBenefits] = useState<string[]>([]);
  const [newBenefit, setNewBenefit] = useState('');
  const [passEligibleContent, setPassEligibleContent] = useState<string[]>([]);
  const [newEligibleContent, setNewEligibleContent] = useState('');
  const [promotionalStartDate, setPromotionalStartDate] = useState('');
  const [promotionalEndDate, setPromotionalEndDate] = useState('');

  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [entitlementHistory, setEntitlementHistory] = useState<EntitlementHistoryLog[]>([]);
  const [passSearchQuery, setPassSearchQuery] = useState('');
  const [passStatusFilter, setPassStatusFilter] = useState<'all' | 'active' | 'expired' | 'revoked'>('all');

  // Modals
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantDuration, setGrantDuration] = useState(365);
  const [grantNotes, setGrantNotes] = useState('');

  const [showExtendModal, setShowExtendModal] = useState(false);
  const [targetExtendUserId, setTargetExtendUserId] = useState('');
  const [extendDays, setExtendDays] = useState(30);
  const [extendReason, setExtendReason] = useState('');

  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [targetRevokeUserId, setTargetRevokeUserId] = useState('');
  const [revokeReason, setRevokeReason] = useState('');

  // Settings State
  const [settings, setSettings] = useState<MaskedPaymentGatewaySettings | null>(null);
  const [activeProvider, setActiveProvider] = useState<'razorpay' | 'stripe' | 'auto'>('razorpay');
  const [testMode, setTestMode] = useState(true);
  const [taxRatePercentage, setTaxRatePercentage] = useState<number>(18);
  const [allowCouponDiscounts, setAllowCouponDiscounts] = useState(true);

  // Editable Form Inputs (Secrets start blank to ensure never showing raw secrets)
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  const [razorpayWebhookSecret, setRazorpayWebhookSecret] = useState('');

  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('');

  // Orders State
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [ordersSummary, setOrdersSummary] = useState<any>(null);
  const [orderFilter, setOrderFilter] = useState<string>('all');

  // Idempotency Logs State
  const [webhookLogs, setWebhookLogs] = useState<WebhookEventLog[]>([]);

  // Webhook Simulator State
  const [simProvider, setSimProvider] = useState<'razorpay' | 'stripe'>('razorpay');
  const [simOrderId, setSimOrderId] = useState<string>('');
  const [simEventType, setSimEventType] = useState<string>('payment.captured');
  const [simDuplicate, setSimDuplicate] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Helper to fetch data
  const fetchData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const token = firebaseUser ? await firebaseUser.getIdToken() : 'admin-dev-session';
      const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // 1. Fetch Settings
      const settingsRes = await fetch('/api/admin/payments/settings', { headers: authHeaders });
      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        if (sData.success && sData.settings) {
          setSettings(sData.settings);
          setActiveProvider(sData.settings.activeProvider || 'razorpay');
          setTestMode(Boolean(sData.settings.testMode));
          setTaxRatePercentage(sData.settings.taxRatePercentage ?? 18);
          setAllowCouponDiscounts(Boolean(sData.settings.allowCouponDiscounts));
          setRazorpayKeyId(sData.settings.razorpayKeyId || '');
          setStripePublishableKey(sData.settings.stripePublishableKey || '');
          // Keep secret input fields empty so they never display stored values
          setRazorpayKeySecret('');
          setRazorpayWebhookSecret('');
          setStripeSecretKey('');
          setStripeWebhookSecret('');
        }
      }

      // 2. Fetch Orders
      const ordersRes = await fetch('/api/admin/payments/orders', { headers: authHeaders });
      if (ordersRes.ok) {
        const oData = await ordersRes.json();
        if (oData.success) {
          setOrders(oData.orders || []);
          setOrdersSummary(oData.summary);
          if (oData.orders && oData.orders.length > 0 && !simOrderId) {
            setSimOrderId(oData.orders[0].orderId);
          }
        }
      }

      // 3. Fetch Webhook Logs
      const logsRes = await fetch('/api/admin/payments/webhook-logs', { headers: authHeaders });
      if (logsRes.ok) {
        const lData = await logsRes.json();
        if (lData.success) {
          setWebhookLogs(lData.logs || []);
        }
      }

      // 4. Fetch Annual Pass Settings
      const apRes = await fetch('/api/admin/annual-pass/settings', { headers: authHeaders });
      if (apRes.ok) {
        const apData = await apRes.json();
        if (apData.success && apData.settings) {
          setPassSettings(apData.settings);
          setPassEnabled(Boolean(apData.settings.enabled));
          setPassName(apData.settings.name || '');
          setRegularPrice(apData.settings.regularPrice ?? 1999);
          setSalePrice(apData.settings.salePrice ?? 999);
          setDurationDays(apData.settings.durationDays ?? 365);
          setPassDescription(apData.settings.description || '');
          setPassBenefits(apData.settings.benefits || []);
          setPassEligibleContent(apData.settings.eligibleContent || []);
          setPromotionalStartDate(apData.settings.promotionalStartDate || '');
          setPromotionalEndDate(apData.settings.promotionalEndDate || '');
        }
      }

      // 5. Fetch Entitlements
      const entRes = await fetch('/api/admin/annual-pass/entitlements', { headers: authHeaders });
      if (entRes.ok) {
        const entData = await entRes.json();
        if (entData.success) {
          setEntitlements(entData.entitlements || []);
        }
      }

      // 6. Fetch Entitlement History
      const histRes = await fetch('/api/admin/annual-pass/history', { headers: authHeaders });
      if (histRes.ok) {
        const hData = await histRes.json();
        if (hData.success) {
          setEntitlementHistory(hData.history || []);
        }
      }
    } catch (err: any) {
      console.error('Error fetching admin payment info:', err);
      setErrorMessage(err.message || 'Failed to load payment admin configuration');
    } finally {
      setLoading(false);
    }
  };

  // Annual Pass Handlers
  const handleSaveAnnualPassSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setActionSuccessMsg('');

    try {
      const token = firebaseUser ? await firebaseUser.getIdToken() : 'admin-dev-session';
      const res = await fetch('/api/admin/annual-pass/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enabled: passEnabled,
          name: passName.trim(),
          regularPrice: Number(regularPrice),
          salePrice: Number(salePrice),
          durationDays: Number(durationDays),
          description: passDescription.trim(),
          benefits: passBenefits,
          eligibleContent: passEligibleContent,
          promotionalStartDate: promotionalStartDate || null,
          promotionalEndDate: promotionalEndDate || null,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update Annual Pass settings');
      }

      setPassSettings(data.settings);
      setActionSuccessMsg('Annual Pass configuration successfully saved and synchronized!');
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save Annual Pass settings');
    } finally {
      setSaving(false);
    }
  };

  const handleGrantPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantUserId.trim()) {
      setErrorMessage('Student User ID is required.');
      return;
    }
    setSaving(true);
    setErrorMessage('');

    try {
      const token = firebaseUser ? await firebaseUser.getIdToken() : 'admin-dev-session';
      const res = await fetch('/api/admin/annual-pass/grant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: grantUserId.trim(),
          durationDays: Number(grantDuration) || 365,
          notes: grantNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to grant Annual Pass');
      }

      setShowGrantModal(false);
      setGrantUserId('');
      setGrantNotes('');
      setActionSuccessMsg(data.message || 'Annual Pass successfully granted!');
      setTimeout(() => setActionSuccessMsg(''), 4000);
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to grant pass');
    } finally {
      setSaving(false);
    }
  };

  const handleExtendPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetExtendUserId) return;
    setSaving(true);
    setErrorMessage('');

    try {
      const token = firebaseUser ? await firebaseUser.getIdToken() : 'admin-dev-session';
      const res = await fetch('/api/admin/annual-pass/extend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: targetExtendUserId,
          daysToAdd: Number(extendDays),
          reason: extendReason.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to extend Annual Pass');
      }

      setShowExtendModal(false);
      setTargetExtendUserId('');
      setExtendReason('');
      setActionSuccessMsg(data.message || 'Annual Pass extended successfully!');
      setTimeout(() => setActionSuccessMsg(''), 4000);
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to extend pass');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRevokeUserId) return;
    setSaving(true);
    setErrorMessage('');

    try {
      const token = firebaseUser ? await firebaseUser.getIdToken() : 'admin-dev-session';
      const res = await fetch('/api/admin/annual-pass/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: targetRevokeUserId,
          reason: revokeReason.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to revoke Annual Pass');
      }

      setShowRevokeModal(false);
      setTargetRevokeUserId('');
      setRevokeReason('');
      setActionSuccessMsg(data.message || 'Annual Pass revoked successfully. Premium access stopped immediately.');
      setTimeout(() => setActionSuccessMsg(''), 4000);
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to revoke pass');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBenefit = () => {
    if (newBenefit.trim()) {
      setPassBenefits((prev) => [...prev, newBenefit.trim()]);
      setNewBenefit('');
    }
  };

  const handleRemoveBenefit = (idx: number) => {
    setPassBenefits((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddEligibleContent = () => {
    if (newEligibleContent.trim() && !passEligibleContent.includes(newEligibleContent.trim())) {
      setPassEligibleContent((prev) => [...prev, newEligibleContent.trim()]);
      setNewEligibleContent('');
    }
  };

  const handleRemoveEligibleContent = (tag: string) => {
    setPassEligibleContent((prev) => prev.filter((t) => t !== tag));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopyUrl = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(key);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      const token = firebaseUser ? await firebaseUser.getIdToken() : 'admin-dev-session';

      // Build payload: only send secrets if user typed a new value
      const payload: Record<string, any> = {
        activeProvider,
        testMode,
        taxRatePercentage: Number(taxRatePercentage),
        allowCouponDiscounts,
        razorpayKeyId: razorpayKeyId.trim(),
        stripePublishableKey: stripePublishableKey.trim(),
      };

      if (razorpayKeySecret.trim()) {
        payload.razorpayKeySecret = razorpayKeySecret.trim();
      }
      if (razorpayWebhookSecret.trim()) {
        payload.razorpayWebhookSecret = razorpayWebhookSecret.trim();
      }
      if (stripeSecretKey.trim()) {
        payload.stripeSecretKey = stripeSecretKey.trim();
      }
      if (stripeWebhookSecret.trim()) {
        payload.stripeWebhookSecret = stripeWebhookSecret.trim();
      }

      const res = await fetch('/api/admin/payments/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update payment settings');
      }

      // Update local state with the returned masked configuration
      setSettings(data.settings);
      // Explicitly clear sensitive input fields immediately so secrets are never displayed
      setRazorpayKeySecret('');
      setRazorpayWebhookSecret('');
      setStripeSecretKey('');
      setStripeWebhookSecret('');

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleRunSimulator = async () => {
    if (!simOrderId) {
      setErrorMessage('Please select an order to simulate');
      return;
    }

    setSimulating(true);
    setSimResult(null);

    try {
      const token = firebaseUser ? await firebaseUser.getIdToken() : 'admin-dev-session';
      const res = await fetch('/api/admin/payments/simulate-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider: simProvider,
          eventType: simEventType,
          orderId: simOrderId,
          simulateDuplicate: simDuplicate,
        }),
      });

      const data = await res.json();
      setSimResult(data);

      // Refresh orders and idempotency logs to show update
      fetchData();
    } catch (err: any) {
      setSimResult({ success: false, error: err.message || 'Simulation execution failed' });
    } finally {
      setSimulating(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'all') return true;
    return o.status === orderFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#ECFDF5] text-[#059669]">paid</span>;
      case 'created':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EFF6FF] text-[#1D4ED8]">created</span>;
      case 'pending':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#FEF3C7] text-[#D97706]">pending</span>;
      case 'failed':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#FEF2F2] text-[#DC2626]">failed</span>;
      case 'refunded':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F3E8FF] text-[#7E22CE]">refunded</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F1F5F9] text-[#64748B]">cancelled</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F1F5F9] text-[#475569]">{status}</span>;
    }
  };

  return (
    <SharedLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <Link href="/dashboard" className="hover:text-[#1D4ED8] transition-colors">
            Student Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
          <Link href="/admin/import" className="hover:text-[#1D4ED8] transition-colors">
            Admin Suite
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span className="font-semibold text-[#0F172A]">Payment Layer & Gateway Settings</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-heading font-semibold text-[#00687A] uppercase tracking-wider">
                Enterprise FinTech Architecture
              </span>
              <span className="text-[10px] bg-[#EFF6FF] text-[#1D4ED8] font-bold px-2 py-0.5 rounded border border-[#BFDBFE]">
                Provider-Independent
              </span>
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F172A] tracking-tight">
              Payment Gateway & Orders Control Center
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              Primary India Gateway (Razorpay) & Secondary Global Gateway (Stripe). Authoritative server verification, masked secret keys, and webhook idempotency.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchData}
              isLoading={loading}
              className="text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              <span>Refresh Ledger</span>
            </Button>
            <Link href="/checkout">
              <Button size="sm" variant="accent" className="text-xs font-bold">
                <span>View Student Checkout</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Security Pledge Banner */}
        <div className="p-3.5 bg-gradient-to-r from-[#F0FDF4] to-[#ECFDF5] border border-[#86EFAC] rounded-xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs text-[#065F46]">
            <span className="font-bold">Strict Security & Zero Card Storage Policy:</span>
            <p>
              In accordance with PCI-DSS & RBI digital tokenization mandates, credit/debit card numbers are never stored in the database. Stored gateway secret keys are kept strictly in server-side memory and are <strong>never rendered or displayed in plaintext to the browser</strong> after saving.
            </p>
          </div>
        </div>

        {/* Notification Messages */}
        {errorMessage && (
          <div className="p-4 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] flex items-center gap-3 text-xs sm:text-sm text-[#B91C1C]">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-4 rounded-lg bg-[#ECFDF5] border border-[#6EE7B7] flex items-center gap-3 text-xs sm:text-sm text-[#047857]">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Gateway settings successfully updated and cryptographically configured. Stored secrets remain masked.</span>
          </div>
        )}

        {actionSuccessMsg && (
          <div className="p-4 rounded-lg bg-[#EFF6FF] border border-[#93C5FD] flex items-center gap-3 text-xs sm:text-sm text-[#1D4ED8]">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E2E8F0] gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2.5 px-4 text-xs font-heading font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'border-[#00687A] text-[#00687A]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Gateway Credentials</span>
          </button>

          <button
            onClick={() => setActiveTab('annual-pass')}
            className={`py-2.5 px-4 text-xs font-heading font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'annual-pass'
                ? 'border-[#00687A] text-[#00687A]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Annual Pass & Entitlements ({entitlements.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`py-2.5 px-4 text-xs font-heading font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'coupons'
                ? 'border-[#00687A] text-[#00687A]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Coupons Engine</span>
          </button>

          <button
            onClick={() => setActiveTab('promotions')}
            className={`py-2.5 px-4 text-xs font-heading font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'promotions'
                ? 'border-[#00687A] text-[#00687A]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Promotional Banners</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2.5 px-4 text-xs font-heading font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'border-[#00687A] text-[#00687A]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Authoritative Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('idempotency')}
            className={`py-2.5 px-4 text-xs font-heading font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'idempotency'
                ? 'border-[#00687A] text-[#00687A]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Webhook Idempotency Logs ({webhookLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`py-2.5 px-4 text-xs font-heading font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'simulator'
                ? 'border-[#00687A] text-[#00687A]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Webhook Simulator & Idempotency Tester</span>
          </button>
        </div>

        {/* TAB: ANNUAL PASS CONTROL */}
        {activeTab === 'annual-pass' && (
          <div className="space-y-8">
            {/* Top KPI Metrics Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
                <span className="text-[11px] font-heading font-semibold text-[#64748B] block uppercase tracking-wider">
                  Pass Pricing Tier
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-mono text-2xl font-extrabold text-[#00687A]">₹{salePrice}</span>
                  <span className="font-mono text-xs text-[#94A3B8] line-through">₹{regularPrice}</span>
                </div>
                <span className="text-[11px] text-[#059669] font-medium block mt-0.5">
                  Default {durationDays} days duration
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
                <span className="text-[11px] font-heading font-semibold text-[#64748B] block uppercase tracking-wider">
                  Purchasing State
                </span>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-3 h-3 rounded-full ${passEnabled ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
                  <span className="font-heading font-bold text-base text-[#0F172A]">
                    {passEnabled ? 'Active in Catalog' : 'Disabled'}
                  </span>
                </div>
                <span className="text-[11px] text-[#64748B] block mt-1">
                  {promotionalStartDate && promotionalEndDate ? `Promo: ${promotionalStartDate} to ${promotionalEndDate}` : 'Open enrollment'}
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
                <span className="text-[11px] font-heading font-semibold text-[#64748B] block uppercase tracking-wider">
                  Active Student Passes
                </span>
                <span className="font-mono text-2xl font-extrabold text-[#1D4ED8] block mt-1">
                  {entitlements.filter((e) => e.status === 'active').length}
                </span>
                <span className="text-[11px] text-[#64748B] block mt-0.5">
                  Full premium access active
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
                <span className="text-[11px] font-heading font-semibold text-[#64748B] block uppercase tracking-wider">
                  Expired / Revoked
                </span>
                <div className="flex items-center gap-3 mt-1 font-mono text-xl font-bold">
                  <span className="text-[#D97706]">{entitlements.filter((e) => e.status === 'expired').length} exp</span>
                  <span className="text-[#DC2626]">{entitlements.filter((e) => e.status === 'revoked').length} rev</span>
                </div>
                <span className="text-[11px] text-[#64748B] block mt-0.5">
                  Order histories preserved
                </span>
              </div>
            </div>

            {/* 1. CONFIGURATION SECTION */}
            <form onSubmit={handleSaveAnnualPassSettings} className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F1F5F9] gap-4">
                <div>
                  <h2 className="font-heading font-bold text-lg text-[#0F172A] flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-[#00687A]" />
                    <span>Annual Pass Configuration Settings</span>
                  </h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Configure pricing, duration, syllabus benefits, and promotional campaign dates.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer bg-[#F8FAFC] border border-[#CBD5E1] px-3 py-1.5 rounded-lg">
                    <input
                      type="checkbox"
                      checked={passEnabled}
                      onChange={(e) => setPassEnabled(e.target.checked)}
                      className="rounded text-[#00687A] focus:ring-[#00687A]"
                    />
                    <span>Pass Purchasing Enabled</span>
                  </label>
                  <Button type="submit" size="sm" variant="primary" isLoading={saving} className="text-xs font-bold">
                    <span>Save Pass Settings</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-heading font-semibold text-[#475569] mb-1">
                    Pass Name
                  </label>
                  <input
                    type="text"
                    required
                    value={passName}
                    onChange={(e) => setPassName(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-heading font-semibold text-[#475569] mb-1">
                    Regular Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={regularPrice}
                    onChange={(e) => setRegularPrice(Number(e.target.value))}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs sm:text-sm font-mono font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-heading font-semibold text-[#475569] mb-1">
                    Sale Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs sm:text-sm font-mono font-bold text-[#059669] focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-heading font-semibold text-[#475569] mb-1">
                    Default Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs sm:text-sm font-mono font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                  <span className="text-[10px] text-[#64748B]">Default: 365 days (1 academic year)</span>
                </div>

                <div>
                  <label className="block text-xs font-heading font-semibold text-[#475569] mb-1">
                    Promotional Start Date
                  </label>
                  <input
                    type="date"
                    value={promotionalStartDate}
                    onChange={(e) => setPromotionalStartDate(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-heading font-semibold text-[#475569] mb-1">
                    Promotional End Date
                  </label>
                  <input
                    type="date"
                    value={promotionalEndDate}
                    onChange={(e) => setPromotionalEndDate(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-heading font-semibold text-[#475569] mb-1">
                    Pass Description
                  </label>
                  <textarea
                    rows={2}
                    value={passDescription}
                    onChange={(e) => setPassDescription(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                </div>
              </div>

              {/* Eligible Content Tags */}
              <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
                <label className="block text-xs font-heading font-semibold text-[#475569]">
                  Eligible Content Scope & Syllabus Modules
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  {passEligibleContent.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEligibleContent(tag)}
                        className="hover:text-[#DC2626] cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="Add scope (e.g. Class 10)..."
                      value={newEligibleContent}
                      onChange={(e) => setNewEligibleContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddEligibleContent();
                        }
                      }}
                      className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1 text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#00687A]"
                    />
                    <button
                      type="button"
                      onClick={handleAddEligibleContent}
                      className="px-2 py-1 bg-[#F1F5F9] text-[#334155] rounded-lg text-xs font-bold hover:bg-[#E2E8F0] cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Benefits List */}
              <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
                <label className="block text-xs font-heading font-semibold text-[#475569]">
                  Configured Pass Benefits (Rendered on Marketing & Dashboard Cards)
                </label>
                <div className="space-y-2">
                  {passBenefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0] text-xs">
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0" strokeWidth={3} />
                        <span className="text-[#0F172A]">{benefit}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(idx)}
                        className="text-[#94A3B8] hover:text-[#DC2626] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Type a benefit and press enter or click Add..."
                      value={newBenefit}
                      onChange={(e) => setNewBenefit(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddBenefit();
                        }
                      }}
                      className="flex-1 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#00687A]"
                    />
                    <button
                      type="button"
                      onClick={handleAddBenefit}
                      className="px-3 py-1.5 bg-[#00687A] text-white rounded-lg text-xs font-semibold hover:bg-[#005260] cursor-pointer"
                    >
                      + Add Benefit
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* 2. ENTITLEMENTS MANAGER */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden space-y-0">
              <div className="p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading font-bold text-base text-[#0F172A] flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#1D4ED8]" />
                    <span>Student Entitlements Registry</span>
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Authoritatively controls student access to premium chapters, cheatsheets, and AI Teacher.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="accent"
                    onClick={() => {
                      setGrantUserId('');
                      setGrantDuration(durationDays || 365);
                      setGrantNotes('');
                      setShowGrantModal(true);
                    }}
                    className="text-xs font-bold"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1" />
                    <span>Grant Annual Pass</span>
                  </Button>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="text"
                    placeholder="Search by student UID, order ID, or notes..."
                    value={passSearchQuery}
                    onChange={(e) => setPassSearchQuery(e.target.value)}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#00687A]"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[#64748B] font-medium">Status:</span>
                  {(['all', 'active', 'expired', 'revoked'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setPassStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer capitalize ${
                        passStatusFilter === st
                          ? 'bg-[#00687A] text-white'
                          : 'bg-white border border-[#CBD5E1] text-[#475569] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Entitlements Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Student User ID</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Starts At</th>
                      <th className="py-2.5 px-4">Expires At</th>
                      <th className="py-2.5 px-4">Granted By</th>
                      <th className="py-2.5 px-4">Notes / Order</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {entitlements
                      .filter((e) => {
                        if (passStatusFilter !== 'all' && e.status !== passStatusFilter) return false;
                        if (!passSearchQuery.trim()) return true;
                        const q = passSearchQuery.toLowerCase();
                        return (
                          e.userId.toLowerCase().includes(q) ||
                          (e.orderId && e.orderId.toLowerCase().includes(q)) ||
                          (e.notes && e.notes.toLowerCase().includes(q))
                        );
                      })
                      .map((ent) => {
                        const nowMs = Date.now();
                        const expMs = new Date(ent.expiresAt).getTime();
                        const isExpiredByTime = expMs <= nowMs;
                        const daysLeft = Math.max(0, Math.ceil((expMs - nowMs) / (24 * 60 * 60 * 1000)));

                        return (
                          <tr key={ent.id} className="hover:bg-[#F8FAFC]">
                            <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">{ent.userId}</td>
                            <td className="py-3 px-4">
                              <span className="font-mono text-[11px] bg-[#EFF6FF] text-[#1D4ED8] px-2 py-0.5 rounded font-semibold border border-[#BFDBFE]">
                                {ent.type}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {ent.status === 'active' && !isExpiredByTime && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                                  Active ({daysLeft}d left)
                                </span>
                              )}
                              {(ent.status === 'expired' || (ent.status === 'active' && isExpiredByTime)) && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                                  Expired (Orders Kept)
                                </span>
                              )}
                              {ent.status === 'revoked' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                                  Revoked
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[#64748B]">
                              {new Date(ent.startsAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 font-semibold text-[#0F172A]">
                              {new Date(ent.expiresAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <span className="capitalize font-medium text-[#475569]">{ent.grantedBy}</span>
                            </td>
                            <td className="py-3 px-4 text-[#64748B] max-w-[200px] truncate" title={ent.notes || ent.orderId}>
                              {ent.notes || ent.orderId || '—'}
                            </td>
                            <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setTargetExtendUserId(ent.userId);
                                  setExtendDays(30);
                                  setExtendReason('');
                                  setShowExtendModal(true);
                                }}
                                className="px-2.5 py-1 bg-[#EFF6FF] text-[#1D4ED8] hover:bg-[#DBEAFE] font-semibold rounded text-[11px] cursor-pointer"
                              >
                                Extend
                              </button>
                              {ent.status !== 'revoked' && (
                                <button
                                  onClick={() => {
                                    setTargetRevokeUserId(ent.userId);
                                    setRevokeReason('');
                                    setShowRevokeModal(true);
                                  }}
                                  className="px-2.5 py-1 bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2] font-semibold rounded text-[11px] cursor-pointer"
                                >
                                  Revoke
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. AUDIT HISTORY LOG */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
              <div className="p-4 border-b border-[#E2E8F0] font-heading font-bold text-sm text-[#0F172A] flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#00687A]" />
                  <span>Entitlement Audit History Log ({entitlementHistory.length})</span>
                </span>
                <span className="text-xs text-[#64748B] font-normal">All grants, extensions, revocations, and expirations</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold">
                    <tr>
                      <th className="py-2 px-4">Timestamp</th>
                      <th className="py-2 px-4">Student UID</th>
                      <th className="py-2 px-4">Action</th>
                      <th className="py-2 px-4">Actor</th>
                      <th className="py-2 px-4">Previous Expiry</th>
                      <th className="py-2 px-4">New Expiry</th>
                      <th className="py-2 px-4">Reason / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {entitlementHistory.map((hist) => (
                      <tr key={hist.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-2.5 px-4 text-[#64748B]">
                          {new Date(hist.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-semibold text-[#0F172A]">
                          {hist.userId}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              hist.action === 'created' || hist.action === 'granted'
                                ? 'bg-[#ECFDF5] text-[#059669]'
                                : hist.action === 'extended'
                                ? 'bg-[#EFF6FF] text-[#1D4ED8]'
                                : hist.action === 'expired'
                                ? 'bg-[#FEF3C7] text-[#D97706]'
                                : 'bg-[#FEF2F2] text-[#DC2626]'
                            }`}
                          >
                            {hist.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-[#475569]">
                          {hist.actor} {hist.actorId ? `(${hist.actorId})` : ''}
                        </td>
                        <td className="py-2.5 px-4 text-[#64748B]">
                          {hist.previousExpiresAt ? new Date(hist.previousExpiresAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-[#0F172A]">
                          {hist.newExpiresAt ? new Date(hist.newExpiresAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-[#334155]">{hist.reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MODAL: GRANT PASS */}
            {showGrantModal && (
              <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                    <h3 className="font-heading font-bold text-base text-[#0F172A] flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-[#00687A]" />
                      <span>Grant Annual Pass to Student</span>
                    </h3>
                    <button onClick={() => setShowGrantModal(false)} className="text-[#94A3B8] hover:text-[#0F172A]">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleGrantPass} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-heading font-semibold text-[#475569] mb-1">
                        Student User ID (UID)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. mayf-student-1002 or user-abc"
                        value={grantUserId}
                        onChange={(e) => setGrantUserId(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                      />
                    </div>

                    <div>
                      <label className="block font-heading font-semibold text-[#475569] mb-1">
                        Duration (Days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={grantDuration}
                        onChange={(e) => setGrantDuration(Number(e.target.value))}
                        className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                      />
                      <span className="text-[11px] text-[#64748B]">Default configured duration is {durationDays} days.</span>
                    </div>

                    <div>
                      <label className="block font-heading font-semibold text-[#475569] mb-1">
                        Admin Reason / Scholarship Note
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Merit Scholarship Award 2026"
                        value={grantNotes}
                        onChange={(e) => setGrantNotes(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowGrantModal(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="accent" size="sm" isLoading={saving} className="font-bold">
                        Confirm & Grant Pass
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL: EXTEND PASS */}
            {showExtendModal && (
              <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                    <h3 className="font-heading font-bold text-base text-[#0F172A] flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#1D4ED8]" />
                      <span>Extend Annual Pass Validity</span>
                    </h3>
                    <button onClick={() => setShowExtendModal(false)} className="text-[#94A3B8] hover:text-[#0F172A]">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleExtendPass} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-heading font-semibold text-[#475569] mb-1">
                        Target Student
                      </label>
                      <input
                        type="text"
                        disabled
                        value={targetExtendUserId}
                        className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg px-3 py-2 font-mono text-xs text-[#475569] cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block font-heading font-semibold text-[#475569] mb-1">
                        Days to Add
                      </label>
                      <div className="flex gap-2 mb-2">
                        {[30, 90, 180, 365].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setExtendDays(d)}
                            className={`flex-1 py-1 rounded text-xs font-bold border transition-colors cursor-pointer ${
                              extendDays === d
                                ? 'bg-[#EFF6FF] border-[#1D4ED8] text-[#1D4ED8]'
                                : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#475569]'
                            }`}
                          >
                            +{d}d
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min="1"
                        required
                        value={extendDays}
                        onChange={(e) => setExtendDays(Number(e.target.value))}
                        className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                      />
                    </div>

                    <div>
                      <label className="block font-heading font-semibold text-[#475569] mb-1">
                        Reason for Extension
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Board exam delay / courtesy extension"
                        value={extendReason}
                        onChange={(e) => setExtendReason(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowExtendModal(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" size="sm" isLoading={saving} className="font-bold">
                        Confirm Extension
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL: REVOKE PASS */}
            {showRevokeModal && (
              <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                    <h3 className="font-heading font-bold text-base text-[#DC2626] flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
                      <span>Revoke Annual Pass Access</span>
                    </h3>
                    <button onClick={() => setShowRevokeModal(false)} className="text-[#94A3B8] hover:text-[#0F172A]">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleRevokePass} className="space-y-4 text-xs">
                    <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-[#991B1B] text-xs">
                      <strong>Immediate Termination Notice:</strong> Revoking will stop the student's premium access immediately. Their past orders and payment records will remain permanently in the ledger.
                    </div>

                    <div>
                      <label className="block font-heading font-semibold text-[#475569] mb-1">
                        Student User ID
                      </label>
                      <input
                        type="text"
                        disabled
                        value={targetRevokeUserId}
                        className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg px-3 py-2 font-mono text-xs text-[#475569] cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block font-heading font-semibold text-[#475569] mb-1">
                        Revocation Reason
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Refund processed / Account terms violation"
                        value={revokeReason}
                        onChange={(e) => setRevokeReason(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowRevokeModal(false)}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        isLoading={saving}
                        className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold"
                      >
                        Confirm Revoke
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: COUPONS ENGINE */}
        {activeTab === 'coupons' && (
          <CouponsManagementTab authHeaders={{ Authorization: `Bearer ${authToken}` }} />
        )}

        {/* TAB: PROMOTIONAL BANNERS */}
        {activeTab === 'promotions' && (
          <PromotionsManagementTab authHeaders={{ Authorization: `Bearer ${authToken}` }} />
        )}

        {/* TAB 1: GATEWAY SETTINGS */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            
            {/* General Gateway Policy */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
              <h2 className="font-heading font-bold text-base text-[#0F172A] pb-2 border-b border-[#F1F5F9] flex items-center justify-between">
                <span>Core Gateway Orchestration</span>
                <span className="text-xs text-[#64748B] font-normal">Provider-independent adapter layer</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-heading font-semibold text-[#475569] mb-1">
                    Active Default Provider
                  </label>
                  <select
                    value={activeProvider}
                    onChange={(e) => setActiveProvider(e.target.value as any)}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-md px-3 py-2 text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  >
                    <option value="razorpay">Razorpay (India Primary - INR, UPI, Cards, NetBanking)</option>
                    <option value="stripe">Stripe (International Secondary - Global Cards, USD)</option>
                    <option value="auto">Auto / Hybrid (Razorpay for INR, Stripe for USD/Other)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-heading font-semibold text-[#475569] mb-1">
                    Environment Mode
                  </label>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-2 text-xs text-[#334155] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={testMode}
                        onChange={(e) => setTestMode(e.target.checked)}
                        className="rounded text-[#00687A]"
                      />
                      <span>Sandbox / Test Mode (Safe for demo orders)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-heading font-semibold text-[#475569] mb-1">
                    GST / Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="28"
                    value={taxRatePercentage}
                    onChange={(e) => setTaxRatePercentage(Number(e.target.value))}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-md px-3 py-2 text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                  <span className="text-[11px] text-[#64748B] mt-0.5 block">
                    Calculated server-side during order creation
                  </span>
                </div>
              </div>
            </div>

            {/* Razorpay Gateway (Primary India) */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#002970] text-white flex items-center justify-center font-bold text-xs">
                    RZP
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[#0F172A]">
                      Razorpay Gateway (Primary India Provider)
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      UPI (Google Pay, PhonePe, Paytm, BHIM), NetBanking, Debit/Credit Cards & Wallets
                    </p>
                  </div>
                </div>
                {settings?.hasRazorpayKeySecret ? (
                  <span className="text-[11px] font-semibold bg-[#ECFDF5] text-[#059669] px-2.5 py-1 rounded-md border border-[#A7F3D0] flex items-center gap-1.5 self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Secret Key Configured (Masked)</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold bg-[#FEF3C7] text-[#D97706] px-2.5 py-1 rounded-md border border-[#FDE68A] self-start sm:self-auto">
                    Secret Key Required
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading font-semibold text-[#475569] mb-1">
                    Razorpay Key ID
                  </label>
                  <input
                    type="text"
                    value={razorpayKeyId}
                    onChange={(e) => setRazorpayKeyId(e.target.value)}
                    placeholder="rzp_test_... or rzp_live_..."
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-md px-3 py-2 text-xs sm:text-sm font-mono text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                  <span className="text-[11px] text-[#64748B] mt-0.5 block">
                    Public client identifier (safe for frontend checkout modal)
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-heading font-semibold text-[#475569]">
                      Razorpay Key Secret
                    </label>
                    {settings?.maskedRazorpayKeySecret && (
                      <span className="text-[10px] text-[#00687A] font-mono">
                        Saved: {settings.maskedRazorpayKeySecret}
                      </span>
                    )}
                  </div>
                  <input
                    type="password"
                    value={razorpayKeySecret}
                    onChange={(e) => setRazorpayKeySecret(e.target.value)}
                    placeholder={
                      settings?.hasRazorpayKeySecret
                        ? '•••••••••••••••• (Leave blank to keep existing stored secret)'
                        : 'Enter Razorpay Key Secret'
                    }
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-md px-3 py-2 text-xs sm:text-sm font-mono text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                  <span className="text-[11px] text-[#64748B] mt-0.5 block">
                    HMAC signature secret. Stored server-side only; never rendered to screen.
                  </span>
                </div>
              </div>

              {/* Webhook Configuration for Razorpay */}
              <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-heading font-bold text-[#0F172A]">
                    Razorpay Webhook Endpoint (Copy into Razorpay Dashboard)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#334155] bg-white px-2.5 py-1 rounded border border-[#CBD5E1] select-all">
                      {settings?.webhookUrls.razorpay || '/api/payments/webhook/razorpay'}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() =>
                        handleCopyUrl(
                          settings?.webhookUrls.razorpay || `${window.location.origin}/api/payments/webhook/razorpay`,
                          'razorpay'
                        )
                      }
                      className="text-xs h-7"
                    >
                      {copiedUrl === 'razorpay' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#10B981] mr-1" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-heading font-semibold text-[#475569]">
                      Razorpay Webhook Secret (HMAC SHA-256)
                    </label>
                    {settings?.maskedRazorpayWebhookSecret && (
                      <span className="text-[10px] text-[#00687A] font-mono">
                        Saved: {settings.maskedRazorpayWebhookSecret}
                      </span>
                    )}
                  </div>
                  <input
                    type="password"
                    value={razorpayWebhookSecret}
                    onChange={(e) => setRazorpayWebhookSecret(e.target.value)}
                    placeholder={
                      settings?.hasRazorpayWebhookSecret
                        ? '•••••••••••••••• (Leave blank to keep existing secret)'
                        : 'Enter Razorpay Webhook Secret'
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-md px-3 py-2 text-xs sm:text-sm font-mono text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                  <span className="text-[11px] text-[#64748B] mt-0.5 block">
                    Used to cryptographically verify <code className="text-[#00687A]">x-razorpay-signature</code> headers.
                  </span>
                </div>
              </div>
            </div>

            {/* Stripe Gateway (Secondary International) */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#635BFF] text-white flex items-center justify-center font-bold text-xs">
                    STP
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[#0F172A]">
                      Stripe Gateway (Secondary International Provider)
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      International cards, multi-currency support (USD, EUR, GBP)
                    </p>
                  </div>
                </div>
                {settings?.hasStripeSecretKey ? (
                  <span className="text-[11px] font-semibold bg-[#ECFDF5] text-[#059669] px-2.5 py-1 rounded-md border border-[#A7F3D0] flex items-center gap-1.5 self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Secret Key Configured (Masked)</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold bg-[#FEF3C7] text-[#D97706] px-2.5 py-1 rounded-md border border-[#FDE68A] self-start sm:self-auto">
                    Secret Key Optional
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading font-semibold text-[#475569] mb-1">
                    Stripe Publishable Key
                  </label>
                  <input
                    type="text"
                    value={stripePublishableKey}
                    onChange={(e) => setStripePublishableKey(e.target.value)}
                    placeholder="pk_test_... or pk_live_..."
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-md px-3 py-2 text-xs sm:text-sm font-mono text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                  <span className="text-[11px] text-[#64748B] mt-0.5 block">
                    Client publishable key for Stripe.js / Elements
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-heading font-semibold text-[#475569]">
                      Stripe Secret Key
                    </label>
                    {settings?.maskedStripeSecretKey && (
                      <span className="text-[10px] text-[#00687A] font-mono">
                        Saved: {settings.maskedStripeSecretKey}
                      </span>
                    )}
                  </div>
                  <input
                    type="password"
                    value={stripeSecretKey}
                    onChange={(e) => setStripeSecretKey(e.target.value)}
                    placeholder={
                      settings?.hasStripeSecretKey
                        ? '•••••••••••••••• (Leave blank to keep existing stored secret)'
                        : 'sk_test_... or sk_live_...'
                    }
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-md px-3 py-2 text-xs sm:text-sm font-mono text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                  <span className="text-[11px] text-[#64748B] mt-0.5 block">
                    Secret API key for checkout sessions. Stored server-side only.
                  </span>
                </div>
              </div>

              {/* Webhook Configuration for Stripe */}
              <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-heading font-bold text-[#0F172A]">
                    Stripe Webhook Endpoint (Copy into Stripe Dashboard)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#334155] bg-white px-2.5 py-1 rounded border border-[#CBD5E1] select-all">
                      {settings?.webhookUrls.stripe || '/api/payments/webhook/stripe'}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() =>
                        handleCopyUrl(
                          settings?.webhookUrls.stripe || `${window.location.origin}/api/payments/webhook/stripe`,
                          'stripe'
                        )
                      }
                      className="text-xs h-7"
                    >
                      {copiedUrl === 'stripe' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#10B981] mr-1" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-heading font-semibold text-[#475569]">
                      Stripe Webhook Signing Secret (whsec_...)
                    </label>
                    {settings?.maskedStripeWebhookSecret && (
                      <span className="text-[10px] text-[#00687A] font-mono">
                        Saved: {settings.maskedStripeWebhookSecret}
                      </span>
                    )}
                  </div>
                  <input
                    type="password"
                    value={stripeWebhookSecret}
                    onChange={(e) => setStripeWebhookSecret(e.target.value)}
                    placeholder={
                      settings?.hasStripeWebhookSecret
                        ? '•••••••••••••••• (Leave blank to keep existing secret)'
                        : 'whsec_...'
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-md px-3 py-2 text-xs sm:text-sm font-mono text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                  <span className="text-[11px] text-[#64748B] mt-0.5 block">
                    Validates <code className="text-[#00687A]">stripe-signature</code> timestamped HMAC.
                  </span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="submit"
                variant="accent"
                size="lg"
                isLoading={saving}
                className="font-bold text-sm shadow-md"
              >
                <Lock className="w-4 h-4 mr-1.5" />
                <span>Save Payment Settings (Securely Mask Secrets)</span>
              </Button>
            </div>
          </form>
        )}

        {/* TAB 2: AUTHORITATIVE ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            
            {/* Metrics Overview */}
            {ordersSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] shadow-xs">
                  <span className="text-xs text-[#64748B] font-medium block">Total Orders</span>
                  <span className="text-2xl font-bold font-heading text-[#0F172A]">
                    {ordersSummary.totalOrders}
                  </span>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] shadow-xs">
                  <span className="text-xs text-[#059669] font-medium block">Paid Orders</span>
                  <span className="text-2xl font-bold font-heading text-[#059669]">
                    {ordersSummary.paidOrders}
                  </span>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] shadow-xs">
                  <span className="text-xs text-[#D97706] font-medium block">Pending / Created</span>
                  <span className="text-2xl font-bold font-heading text-[#D97706]">
                    {ordersSummary.pendingOrders}
                  </span>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] shadow-xs">
                  <span className="text-xs text-[#00687A] font-medium block">Gross INR Revenue</span>
                  <span className="text-2xl font-bold font-mono text-[#00687A]">
                    ₹{ordersSummary.totalGrossRevenueINR?.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Orders Table Container */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
              <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-bold text-base text-[#0F172A]">
                    Authoritative Order Records
                  </h3>
                  <span className="text-xs text-[#64748B]">({filteredOrders.length} orders)</span>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                  {['all', 'paid', 'created', 'pending', 'failed', 'refunded', 'cancelled'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderFilter(st)}
                      className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                        orderFilter === st
                          ? 'bg-[#00687A] text-white font-bold'
                          : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Order ID</th>
                      <th className="py-2.5 px-4">User ID</th>
                      <th className="py-2.5 px-4">Provider</th>
                      <th className="py-2.5 px-4">Gross / Net</th>
                      <th className="py-2.5 px-4">Gateway Identifiers</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Timestamps</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-[#94A3B8]">
                          No orders found matching filter "{orderFilter}".
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => {
                        const netPayable = (ord.grossAmount - ord.discount) + (ord.tax || 0);
                        return (
                          <tr key={ord.orderId} className="hover:bg-[#F8FAFC]">
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-[#0F172A] block">
                                {ord.orderId}
                              </span>
                              <span className="text-[11px] text-[#64748B] line-clamp-1">
                                {ord.items?.[0]?.title || 'Annual Pass'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono text-[#475569] block">
                                {ord.userId}
                              </span>
                              {ord.customerDetails?.name && (
                                <span className="text-[11px] text-[#00687A]">
                                  {ord.customerDetails.name}
                                </span>
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
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-[#0F172A] block">
                                {ord.currency === 'USD' ? '$' : '₹'}{netPayable}
                              </span>
                              {ord.discount > 0 && (
                                <span className="text-[10px] text-[#059669] block">
                                  coupon: -{ord.currency === 'USD' ? '$' : '₹'}{ord.discount} ({ord.coupon || 'DISC'})
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px]">
                              <span className="text-[#64748B] block truncate max-w-[150px]" title={ord.providerOrderId}>
                                ord: {ord.providerOrderId || '—'}
                              </span>
                              {ord.providerPaymentId && (
                                <span className="text-[#059669] block truncate max-w-[150px]" title={ord.providerPaymentId}>
                                  pay: {ord.providerPaymentId}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {getStatusBadge(ord.status)}
                            </td>
                            <td className="py-3 px-4 text-[#64748B] text-[11px]">
                              <div>Created: {new Date(ord.createdAt).toLocaleDateString()}</div>
                              {ord.paidAt && (
                                <div className="text-[#059669]">
                                  Paid: {new Date(ord.paidAt).toLocaleTimeString()}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WEBHOOK IDEMPOTENCY LOGS */}
        {activeTab === 'idempotency' && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden space-y-4 p-6">
            <div className="pb-3 border-b border-[#F1F5F9]">
              <h3 className="font-heading font-bold text-base text-[#0F172A]">
                Authoritative Webhook Idempotency Registry
              </h3>
              <p className="text-xs text-[#64748B]">
                Every incoming webhook event ID is recorded cryptographically. Duplicate network replays from gateways are identified and safely ignored without double-crediting orders.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Event ID (Idempotency Key)</th>
                    <th className="py-2.5 px-4">Gateway</th>
                    <th className="py-2.5 px-4">Event Type</th>
                    <th className="py-2.5 px-4">Target Order</th>
                    <th className="py-2.5 px-4">Idempotency Outcome</th>
                    <th className="py-2.5 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {webhookLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#94A3B8]">
                        No webhook deliveries recorded in this session yet.
                      </td>
                    </tr>
                  ) : (
                    webhookLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">
                          {log.id}
                        </td>
                        <td className="py-3 px-4 font-semibold uppercase text-[#475569]">
                          {log.provider}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#00687A]">
                          {log.eventType}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#475569]">
                          {log.orderId || '—'}
                        </td>
                        <td className="py-3 px-4">
                          {log.status === 'processed' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ECFDF5] text-[#059669]">
                              ✓ Processed Authoritatively
                            </span>
                          ) : log.status === 'duplicate_ignored' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#D97706]">
                              ⚠ Duplicate Ignored (Idempotent)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF2F2] text-[#DC2626]">
                              {log.status}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#64748B]">
                          {new Date(log.processedAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: WEBHOOK SIMULATOR & TESTER */}
        {activeTab === 'simulator' && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-6">
            <div>
              <h3 className="font-heading font-bold text-base text-[#0F172A]">
                Authoritative Webhook Simulator & Idempotency Tester
              </h3>
              <p className="text-xs text-[#64748B]">
                Test the cryptographic HMAC webhook verification, status transition to <code className="text-[#00687A]">paid</code>, and duplicate delivery prevention directly in this testing harness.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-heading font-semibold text-[#475569] mb-1">
                    Select Target Order
                  </label>
                  <select
                    value={simOrderId}
                    onChange={(e) => setSimOrderId(e.target.value)}
                    className="w-full bg-white border border-[#CBD5E1] rounded-md px-3 py-2 text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  >
                    {orders.map((o) => (
                      <option key={o.orderId} value={o.orderId}>
                        {o.orderId} · {o.provider} · ₹{o.grossAmount - o.discount} ({o.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-heading font-semibold text-[#475569] mb-1">
                      Provider Adapter
                    </label>
                    <select
                      value={simProvider}
                      onChange={(e) => setSimProvider(e.target.value as any)}
                      className="w-full bg-white border border-[#CBD5E1] rounded-md px-3 py-2 text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                    >
                      <option value="razorpay">Razorpay</option>
                      <option value="stripe">Stripe</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-semibold text-[#475569] mb-1">
                      Webhook Event Type
                    </label>
                    <select
                      value={simEventType}
                      onChange={(e) => setSimEventType(e.target.value)}
                      className="w-full bg-white border border-[#CBD5E1] rounded-md px-3 py-2 text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                    >
                      <option value="payment.captured">payment.captured (Razorpay)</option>
                      <option value="order.paid">order.paid (Razorpay)</option>
                      <option value="payment.failed">payment.failed (Razorpay)</option>
                      <option value="checkout.session.completed">checkout.session.completed (Stripe)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 text-xs text-[#334155] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simDuplicate}
                      onChange={(e) => setSimDuplicate(e.target.checked)}
                      className="rounded text-[#00687A]"
                    />
                    <span className="font-semibold text-[#B45309]">
                      Simulate Duplicate Webhook Delivery (Tests Idempotency Cache)
                    </span>
                  </label>
                  <p className="text-[11px] text-[#64748B] mt-1 pl-5">
                    When checked, re-sends the same event ID to verify that the server returns HTTP 200 without executing duplicate entitlement grants.
                  </p>
                </div>

                <Button
                  onClick={handleRunSimulator}
                  isLoading={simulating}
                  variant="accent"
                  className="font-bold text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  <span>Execute Webhook Test</span>
                </Button>
              </div>

              {/* Simulation Result Output */}
              <div className="space-y-2">
                <span className="text-xs font-heading font-semibold text-[#475569] block">
                  Authoritative Server Execution Outcome
                </span>
                <div className="p-4 rounded-lg bg-white border border-[#CBD5E1] font-mono text-xs min-h-[160px] overflow-auto">
                  {simResult ? (
                    <pre className="text-[#0F172A] whitespace-pre-wrap">
                      {JSON.stringify(simResult, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-[#94A3B8]">
                      Click "Execute Webhook Test" to simulate cryptographic verification and view server response.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </SharedLayout>
  );
};
