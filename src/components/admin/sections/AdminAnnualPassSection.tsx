import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Users,
  Calendar,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Edit,
  Save,
} from 'lucide-react';
import { Button } from '../../ui/Button';

export const AdminAnnualPassSection: React.FC = () => {
  const [singlePrice, setSinglePrice] = useState('1999');
  const [familyPrice, setFamilyPrice] = useState('2999');
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
            Annual Pass Tier Configuration
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure pricing tiers, multi-child family discounts, and entitlements for Classes 5 to 10.
          </p>
        </div>

        <Button size="sm" variant="primary" onClick={handleSave} className="gap-1.5 shadow-xs">
          <Save className="w-3.5 h-3.5" />
          <span>{saved ? 'Saved Changes!' : 'Update Pass Pricing'}</span>
        </Button>
      </div>

      {/* Pricing Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tier 1: Single Child */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-heading font-extrabold text-xs uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
              STANDARD TIER
            </span>
            <span className="font-mono text-xs text-slate-500">Academic Year 2026–2027</span>
          </div>

          <div>
            <h3 className="font-heading font-bold text-lg text-slate-900">
              Single Child Annual Pass
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Full access for 1 student across their enrolled grade level (Class 5–10).
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Annual Price (INR ₹):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                value={singlePrice}
                onChange={(e) => setSinglePrice(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Full formula deck with KaTeX proofs</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>24/7 AI Teacher doubt clearing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>NCERT Exemplar step-by-step worked solutions</span>
            </div>
          </div>
        </div>

        {/* Tier 2: Family Pack */}
        <div className="bg-white rounded-xl border border-blue-200 bg-linear-to-b from-blue-50/20 to-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-heading font-extrabold text-xs uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded">
              FAMILY PACK TIER
            </span>
            <span className="font-mono text-xs text-purple-600 font-bold">Best Value</span>
          </div>

          <div>
            <h3 className="font-heading font-bold text-lg text-slate-900">
              Family Multi-Child Annual Pass
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Complete access for up to 3 siblings across different grades (Classes 5 to 10).
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Annual Price (INR ₹):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                value={familyPrice}
                onChange={(e) => setFamilyPrice(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Multi-profile switcher for 2–3 siblings</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Individual streaks and AI history per child</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>High-priority AI response throughput</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
