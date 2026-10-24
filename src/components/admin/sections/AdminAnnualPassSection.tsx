import React, { useEffect, useState } from 'react';
import { Button } from '../../ui/Button';
import { adminService } from '../../../services/adminService';
import type { AnnualPassSettings } from '../../../lib/payments/types';

export const AdminAnnualPassSection: React.FC = () => {
  const [settings, setSettings] = useState<AnnualPassSettings | null>(null);
  const [familyPrice, setFamilyPrice] = useState('2999');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/admin/annual-pass/settings', { headers: await adminService.getAuthHeaders() });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load membership settings.');
      setSettings(data.settings);
      setFamilyPrice(String(data.settings.familyPrice ?? 2999));
    } catch (error: any) { setError(error.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const save = async () => {
    if (!settings || saving) return;
    setSaving(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/admin/annual-pass/settings', {
        method: 'POST', headers: await adminService.getAuthHeaders(),
        body: JSON.stringify({ ...settings, familyPrice: Number(familyPrice) }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Membership settings were not saved.');
      setSettings(data.settings); setMessage('Membership settings saved.');
    } catch (error: any) { setError(error.message); }
    finally { setSaving(false); }
  };
  const patch = (update: Partial<AnnualPassSettings>) => setSettings(current => current ? { ...current, ...update } : current);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="text-xl font-heading font-extrabold text-slate-900">Annual Pass Configuration</h2><p className="text-sm text-slate-600">Manage the membership price, promotional dates and access duration.</p></div>
        <div className="flex gap-2"><Button onClick={load} disabled={loading || saving} variant="outline">Refresh</Button><Button onClick={save} disabled={loading || !settings} isLoading={saving}>Update Pass Pricing</Button></div>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
      {loading && <p>Loading membership settings…</p>}
      {settings && <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 text-slate-900">
          <h3 className="font-bold text-lg">Single Child Annual Pass</h3>
          <label className="flex items-center gap-2"><input type="checkbox" checked={settings.enabled} onChange={event => patch({ enabled: event.target.checked })} />Accept new Annual Pass purchases</label>
          <label className="block text-sm">Pass name<input className="mt-1 block w-full rounded border p-2" value={settings.name} onChange={event => patch({ name: event.target.value })} /></label>
          <label className="block text-sm">Regular price (INR)<input type="number" min="1" step="0.01" className="mt-1 block w-full rounded border p-2" value={settings.regularPrice} onChange={event => patch({ regularPrice: Number(event.target.value) })} /></label>
          <label className="block text-sm">Promotional price (INR)<input type="number" min="1" step="0.01" className="mt-1 block w-full rounded border p-2" value={settings.salePrice} onChange={event => patch({ salePrice: Number(event.target.value) })} /></label>
          <p className="text-xs text-slate-600">Checkout uses the promotional price during the dates below, and the regular price outside that period. Configured tax is added at checkout.</p>
          <label className="block text-sm">Access duration (days)<input type="number" min="1" max="3650" className="mt-1 block w-full rounded border p-2" value={settings.durationDays} onChange={event => patch({ durationDays: Number(event.target.value) })} /></label>
          <label className="block text-sm">Promotion starts<input type="date" className="mt-1 block w-full rounded border p-2" value={settings.promotionalStartDate || ''} onChange={event => patch({ promotionalStartDate: event.target.value || null })} /></label>
          <label className="block text-sm">Promotion ends<input type="date" className="mt-1 block w-full rounded border p-2" value={settings.promotionalEndDate || ''} onChange={event => patch({ promotionalEndDate: event.target.value || null })} /></label>
        </section>
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 text-slate-900">
          <h3 className="font-bold text-lg">Family Multi-Child Annual Pass</h3>
          <p className="text-sm text-slate-600">You can save a proposed family price. Family checkout and linked child profiles are not available yet.</p>
          <label className="block text-sm">Proposed family price (INR)<input type="number" min="1" step="0.01" className="mt-1 block w-full rounded border p-2" value={familyPrice} onChange={event => setFamilyPrice(event.target.value)} /></label>
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Saving this price does not sell or activate a family membership.</p>
        </section>
      </div>}
    </div>
  );
};
