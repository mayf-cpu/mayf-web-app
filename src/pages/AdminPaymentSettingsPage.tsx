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
} from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { Link } from '../context/NavigationContext';
import { MaskedPaymentGatewaySettings, StoredOrder, WebhookEventLog } from '../lib/payments/types';

export const AdminPaymentSettingsPage: React.FC = () => {
  const { user, firebaseUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'settings' | 'orders' | 'idempotency' | 'simulator'>('settings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

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
    } catch (err: any) {
      console.error('Error fetching admin payment info:', err);
      setErrorMessage(err.message || 'Failed to load payment admin configuration');
    } finally {
      setLoading(false);
    }
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
      alert('Please select an order to simulate');
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
