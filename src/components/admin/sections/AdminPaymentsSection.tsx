import React, { useEffect, useState } from 'react';
import { RefreshCw, Save } from 'lucide-react';
import { Button } from '../../ui/Button';
import { adminService } from '../../../services/adminService';
import { requestGatewaySettings } from '../../../lib/payments/adminSettingsClient';
import type { MaskedPaymentGatewaySettings, PaymentGatewaySettings } from '../../../lib/payments/types';

type SecretField = 'razorpayKeySecret' | 'razorpayWebhookSecret' | 'stripeSecretKey' | 'stripeWebhookSecret';
const emptySecrets = (): Record<SecretField, string> => ({ razorpayKeySecret: '', razorpayWebhookSecret: '', stripeSecretKey: '', stripeWebhookSecret: '' });

export const AdminPaymentsSection: React.FC = () => {
  const [settings, setSettings] = useState<MaskedPaymentGatewaySettings | null>(null);
  const [secrets, setSecrets] = useState(emptySecrets);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setBusy(true); setNotice(''); setError('');
    try {
      setSettings(await requestGatewaySettings(await adminService.getAuthHeaders()));
      setSecrets(emptySecrets());
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  useEffect(() => { void load(); }, []);

  const save = async () => {
    if (!settings || busy) return;
    setBusy(true); setNotice(''); setError('');
    try {
      const update: Partial<PaymentGatewaySettings> = {
        activeProvider: settings.activeProvider, testMode: settings.testMode,
        razorpayKeyId: settings.razorpayKeyId, stripePublishableKey: settings.stripePublishableKey,
        ...secrets,
      };
      setSettings(await requestGatewaySettings(await adminService.getAuthHeaders(), update));
      setSecrets(emptySecrets());
      setNotice('Payment settings durably saved. Checkout release controls are unchanged.');
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  const secretInput = (field: SecretField, label: string, configured: boolean) => (
    <label className="block space-y-1 text-xs" key={field}>
      <span className="font-semibold text-slate-700">{label} — {configured ? 'Configured' : 'Not configured'}</span>
      <input type="password" autoComplete="new-password" value={secrets[field]} disabled={busy}
        onChange={e => setSecrets(previous => ({ ...previous, [field]: e.target.value }))}
        placeholder={configured ? 'Leave blank to keep existing secret' : 'Enter secret'}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
    </label>
  );

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-xl font-heading font-extrabold text-slate-900">Payment Gateways & Webhook Security</h2>
        <p className="text-xs text-slate-500 mt-1">Stored secrets stay on the server. Blank secret fields keep existing values.</p></div>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => void load()} disabled={busy}><RefreshCw className="w-4 h-4" />Refresh settings</Button>
        <Button size="sm" variant="primary" onClick={() => void save()} disabled={busy || !settings}><Save className="w-4 h-4" />{busy ? 'Working…' : 'Save Gateway Settings'}</Button>
      </div>
    </div>
    {error && <p role="alert" className="p-3 bg-red-50 text-red-800 rounded-lg">{error}</p>}
    {notice && <p role="status" className="p-3 bg-emerald-50 text-emerald-800 rounded-lg">{notice}</p>}
    {!settings ? <p>{busy ? 'Loading stored gateway configuration…' : 'Configuration unavailable. Refresh to retry.'}</p> : <>
      <div className="flex flex-wrap gap-6 p-4 bg-slate-50 rounded-xl">
        <label className="text-sm">Preferred provider <select value={settings.activeProvider} disabled={busy} onChange={e => setSettings({ ...settings, activeProvider: e.target.value as MaskedPaymentGatewaySettings['activeProvider'] })} className="ml-2 border rounded p-1">
          <option value="razorpay">Razorpay</option><option value="auto">Automatic</option><option value="stripe" disabled>Stripe (setup deferred)</option>
        </select></label>
        <label className="text-sm flex gap-2 items-center"><input type="checkbox" checked={settings.testMode} disabled={busy} onChange={e => setSettings({ ...settings, testMode: e.target.checked })} />Test mode</label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="p-5 border rounded-xl space-y-4"><h3 className="font-bold">Razorpay</h3>
          <p className="text-xs">{settings.razorpayKeyId && settings.hasRazorpayKeySecret && settings.hasRazorpayWebhookSecret ? 'Credentials configured; payment acceptance still requires sandbox testing.' : 'Configuration incomplete. Sandbox acceptance cannot start yet.'}</p>
          <label className="block text-xs space-y-1"><span>Razorpay Key ID</span><input type="text" value={settings.razorpayKeyId || ''} disabled={busy} onChange={e => setSettings({ ...settings, razorpayKeyId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></label>
          {secretInput('razorpayKeySecret', 'Razorpay Key Secret', settings.hasRazorpayKeySecret)}
          {secretInput('razorpayWebhookSecret', 'Razorpay Webhook Secret', settings.hasRazorpayWebhookSecret)}
          <p className="text-xs break-all">Webhook URL: {settings.webhookUrls.razorpay}</p>
        </section>
        <section className="p-5 border rounded-xl space-y-4"><h3 className="font-bold">Stripe</h3><p className="text-xs">Setup deferred. Customer checkout option remains disabled.</p>
          <label className="block text-xs space-y-1"><span>Stripe Publishable Key</span><input type="text" value={settings.stripePublishableKey || ''} disabled={busy} onChange={e => setSettings({ ...settings, stripePublishableKey: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></label>
          {secretInput('stripeSecretKey', 'Stripe Secret Key', settings.hasStripeSecretKey)}
          {secretInput('stripeWebhookSecret', 'Stripe Webhook Secret', settings.hasStripeWebhookSecret)}
          <p className="text-xs break-all">Webhook URL: {settings.webhookUrls.stripe}</p>
        </section>
      </div>
    </>}
  </div>;
};
