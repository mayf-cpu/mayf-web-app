import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ShieldCheck,
  CreditCard,
  Key,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  Lock,
} from 'lucide-react';
import { Button } from '../../ui/Button';

export const AdminPaymentsSection: React.FC = () => {
  const [razorpayKeyId, setRazorpayKeyId] = useState('rzp_test_sec_789456123');
  const [razorpayWebhookSecret, setRazorpayWebhookSecret] = useState('whsec_rzp_mock_live_active');
  const [stripePublishableKey, setStripePublishableKey] = useState('pk_test_51MzAbcDefGhiJklMnoPqr');
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('whsec_stripe_mock_live_active');
  const [activeGateway, setActiveGateway] = useState<'razorpay' | 'stripe'>('razorpay');
  const [mode, setMode] = useState<'test' | 'live'>('test');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
            Payment Gateways & Webhook Security
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographic HMAC-SHA256 signature verification for Razorpay (India) & Stripe (Global).
          </p>
        </div>

        <Button size="sm" variant="primary" onClick={handleSave} className="gap-1.5 shadow-xs">
          <Save className="w-3.5 h-3.5" />
          <span>{saved ? 'Credentials Saved!' : 'Save Gateway Settings'}</span>
        </Button>
      </div>

      {/* Gateway Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Razorpay Card */}
        <div className={`p-5 rounded-xl border transition-all ${activeGateway === 'razorpay' ? 'bg-white border-blue-600 shadow-md ring-1 ring-blue-600' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                R
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-slate-900">Razorpay</h3>
                <span className="text-[10px] text-slate-500">Primary Gateway · UPI, Netbanking, Cards</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
              ACTIVE
            </span>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Razorpay Key ID:</label>
              <input
                type="text"
                value={razorpayKeyId}
                onChange={(e) => setRazorpayKeyId(e.target.value)}
                className="w-full px-3 py-1.5 font-mono text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Webhook Secret (HMAC-SHA256):</label>
              <input
                type="password"
                value={razorpayWebhookSecret}
                onChange={(e) => setRazorpayWebhookSecret(e.target.value)}
                className="w-full px-3 py-1.5 font-mono text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Stripe Card */}
        <div className={`p-5 rounded-xl border transition-all ${activeGateway === 'stripe' ? 'bg-white border-blue-600 shadow-md ring-1 ring-blue-600' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                S
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-slate-900">Stripe</h3>
                <span className="text-[10px] text-slate-500">Secondary / International Cards</span>
              </div>
            </div>
            <button
              onClick={() => setActiveGateway(activeGateway === 'razorpay' ? 'stripe' : 'razorpay')}
              className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              Toggle Active
            </button>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Stripe Publishable Key:</label>
              <input
                type="text"
                value={stripePublishableKey}
                onChange={(e) => setStripePublishableKey(e.target.value)}
                className="w-full px-3 py-1.5 font-mono text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Stripe Webhook Secret:</label>
              <input
                type="password"
                value={stripeWebhookSecret}
                onChange={(e) => setStripeWebhookSecret(e.target.value)}
                className="w-full px-3 py-1.5 font-mono text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
