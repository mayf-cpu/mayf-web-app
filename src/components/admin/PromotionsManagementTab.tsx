import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  Tag,
  Flame,
  ExternalLink,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { PromotionalBlock } from '../../lib/coupons/types';

interface PromotionsManagementTabProps {
  authHeaders: Record<string, string>;
}

export const PromotionsManagementTab: React.FC<PromotionsManagementTabProps> = ({ authHeaders }) => {
  const [promotions, setPromotions] = useState<PromotionalBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal / Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [promoId, setPromoId] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badgeText, setBadgeText] = useState('BOARD REVISION OFFER');
  const [couponCode, setCouponCode] = useState('BOARD2026');
  const [publishHomepage, setPublishHomepage] = useState(true);
  const [publishCatalogue, setPublishCatalogue] = useState(true);
  const [ctaText, setCtaText] = useState('Claim ₹100 Discount');
  const [ctaLink, setCtaLink] = useState('/checkout?coupon=BOARD2026');
  const [bannerStyle, setBannerStyle] = useState<'gradient' | 'urgent' | 'accent' | 'minimal'>('gradient');
  const [enabled, setEnabled] = useState(true);
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const fetchPromotions = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/promotions', { headers: authHeaders });
      const data = await res.json();
      if (data.success) {
        setPromotions(data.promotions || []);
      } else {
        setErrorMsg(data.error || 'Failed to fetch promotional blocks');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error fetching promotions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setPromoId('');
    setTitle('Class 5–10 Board Exam Special: Save ₹100 on the Annual Pass');
    setSubtitle('Unlock unlimited 24/7 Professor Sigma AI Teacher doubts and all solved board derivations. Use code BOARD2026 at checkout.');
    setBadgeText('BOARD REVISION OFFER');
    setCouponCode('BOARD2026');
    setPublishHomepage(true);
    setPublishCatalogue(true);
    setCtaText('Claim ₹100 Discount');
    setCtaLink('/checkout?coupon=BOARD2026');
    setBannerStyle('gradient');
    setEnabled(true);
    setStartsAt(new Date().toISOString().slice(0, 10));
    setExpiresAt('');
    setModalOpen(true);
  };

  const handleOpenEdit = (p: PromotionalBlock) => {
    setIsEditing(true);
    setPromoId(p.id);
    setTitle(p.title);
    setSubtitle(p.subtitle || '');
    setBadgeText(p.badgeText || '');
    setCouponCode(p.couponCode || '');
    setPublishHomepage(p.targetPlacements.includes('homepage'));
    setPublishCatalogue(p.targetPlacements.includes('catalogue'));
    setCtaText(p.ctaText || 'Claim Offer');
    setCtaLink(p.ctaLink || '/checkout');
    setBannerStyle(p.bannerStyle || 'gradient');
    setEnabled(p.enabled);
    setStartsAt(p.startsAt ? p.startsAt.slice(0, 10) : '');
    setExpiresAt(p.expiresAt ? p.expiresAt.slice(0, 10) : '');
    setModalOpen(true);
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Banner title is required.');
      return;
    }

    const placements: ('homepage' | 'catalogue')[] = [];
    if (publishHomepage) placements.push('homepage');
    if (publishCatalogue) placements.push('catalogue');

    if (placements.length === 0) {
      setErrorMsg('Please select at least one publishing placement (Homepage or Catalogue).');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    try {
      const payload: Partial<PromotionalBlock> = {
        id: promoId || undefined,
        title: title.trim(),
        subtitle: subtitle.trim(),
        badgeText: badgeText.trim(),
        couponCode: couponCode ? couponCode.trim().toUpperCase() : undefined,
        targetPlacements: placements,
        ctaText: ctaText.trim(),
        ctaLink: ctaLink.trim(),
        bannerStyle,
        enabled,
        startsAt: startsAt || null,
        expiresAt: expiresAt || null,
      };

      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Promotional block "${data.promotion.title}" saved.`);
        setTimeout(() => setSuccessMsg(''), 4000);
        setModalOpen(false);
        fetchPromotions();
      } else {
        setErrorMsg(data.error || 'Failed to save promotional block');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving promotional block');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePromo = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/promotions/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Promotional banner deleted.');
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchPromotions();
      } else {
        setErrorMsg(data.error || 'Failed to delete banner');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error deleting banner');
    }
  };

  return (
    <div className="space-y-8">
      {/* Alerts */}
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

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-heading font-semibold text-[#00687A] mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Multi-Placement Campaign Manager</span>
          </div>
          <h2 className="font-heading font-bold text-xl text-[#0F172A]">
            Promotional Banners & Blocks
          </h2>
          <p className="text-xs text-[#64748B] mt-1 max-w-2xl">
            Design and publish promotional announcement blocks to the Homepage, the Study Material Catalogue, or both.
            Promotions can highlight active coupons, exam specials, or merit discounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchPromotions}
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
            <span>Create Promotional Block</span>
          </Button>
        </div>
      </div>

      {/* Promotions List */}
      <div className="space-y-6">
        {loading && promotions.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center text-xs text-[#64748B]">
            Loading promotional banners from server...
          </div>
        ) : promotions.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-[#94A3B8] mx-auto" />
            <h3 className="font-heading font-bold text-sm text-[#0F172A]">No Promotional Blocks Configured</h3>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              Publish promotional cards to high-traffic touchpoints like the Homepage and public Catalogue to announce discounts and coupon codes.
            </p>
            <Button size="sm" variant="primary" onClick={handleOpenCreate} className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Create First Promotion</span>
            </Button>
          </div>
        ) : (
          promotions.map((p) => {
            const now = new Date();
            const isExpired = p.expiresAt && now > new Date(`${p.expiresAt}T23:59:59`);
            const isNotStarted = p.startsAt && now < new Date(p.startsAt);

            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-4 hover:border-[#00687A]/40 transition-colors"
              >
                {/* Meta Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-sm text-[#0F172A]">
                      {p.title}
                    </span>
                    {p.enabled && !isExpired ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                        Published
                      </span>
                    ) : !p.enabled ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading font-semibold bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                        Draft / Paused
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading font-semibold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
                        Expired
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 text-xs text-[#00687A] hover:bg-[#E0F2FE] rounded flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeletePromo(p.id)}
                      className="p-1.5 text-xs text-[#DC2626] hover:bg-[#FEE2E2] rounded flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* Banner Attributes Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-[#64748B] block uppercase tracking-wider font-heading font-semibold">
                      Placements
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.targetPlacements.map((plc) => (
                        <span
                          key={plc}
                          className="px-2 py-0.5 rounded-full text-[10px] font-heading font-semibold bg-[#E0F2FE] text-[#0369A1] capitalize"
                        >
                          {plc}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#64748B] block uppercase tracking-wider font-heading font-semibold">
                      Featured Coupon
                    </span>
                    <span className="font-mono font-bold text-[#0F172A] mt-1 inline-block">
                      {p.couponCode || 'None'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#64748B] block uppercase tracking-wider font-heading font-semibold">
                      Visual Style
                    </span>
                    <span className="font-heading font-semibold text-[#0F172A] capitalize mt-1 inline-block">
                      {p.bannerStyle}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#64748B] block uppercase tracking-wider font-heading font-semibold">
                      Schedule
                    </span>
                    <span className="text-[#475569] mt-1 inline-block">
                      {p.startsAt ? p.startsAt.slice(0, 10) : 'Immediate'} →{' '}
                      {p.expiresAt ? p.expiresAt.slice(0, 10) : 'Indefinite'}
                    </span>
                  </div>
                </div>

                {/* Live Banner Preview in Admin */}
                <div className="pt-2">
                  <span className="text-[10px] font-heading font-bold text-[#64748B] uppercase tracking-wider block mb-2">
                    Live Student View Preview:
                  </span>
                  <div
                    className={`rounded-xl p-5 text-xs transition-all ${
                      p.bannerStyle === 'gradient'
                        ? 'bg-gradient-to-r from-[#00687A] via-[#0284C7] to-[#1D4ED8] text-white border border-blue-400/20'
                        : p.bannerStyle === 'urgent'
                        ? 'bg-gradient-to-r from-[#9A3412] via-[#C2410C] to-[#DC2626] text-white border border-orange-400/30'
                        : p.bannerStyle === 'accent'
                        ? 'bg-[#0B1528] text-white border border-cyan-500/30'
                        : 'bg-[#F0FDF4] text-[#14532D] border border-[#86EFAC]'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 max-w-2xl">
                        {p.badgeText && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-wider bg-white/20 backdrop-blur-sm">
                            <Sparkles className="w-3 h-3 text-[#FDE047]" />
                            <span>{p.badgeText}</span>
                          </div>
                        )}
                        <h4
                          className={`font-heading font-extrabold text-base ${
                            p.bannerStyle === 'minimal' ? 'text-[#0F172A]' : 'text-white'
                          }`}
                        >
                          {p.title}
                        </h4>
                        {p.subtitle && (
                          <p
                            className={`text-xs ${
                              p.bannerStyle === 'minimal' ? 'text-[#334155]' : 'text-white/85'
                            }`}
                          >
                            {p.subtitle}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {p.couponCode && (
                          <div
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-xs ${
                              p.bannerStyle === 'minimal'
                                ? 'bg-white border border-[#CBD5E1] text-[#0F172A]'
                                : 'bg-white/15 text-white border border-white/30 backdrop-blur-sm'
                            }`}
                          >
                            <Tag className="w-3 h-3 opacity-80" />
                            <span>{p.couponCode}</span>
                          </div>
                        )}
                        <div
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-heading font-bold text-xs ${
                            p.bannerStyle === 'minimal'
                              ? 'bg-[#00687A] text-white'
                              : 'bg-white text-[#0F172A]'
                          }`}
                        >
                          <span>{p.ctaText || 'Claim Offer'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT PROMOTIONAL BLOCK MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#E0F2FE] text-[#00687A] rounded-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-[#0F172A]">
                    {isEditing ? 'Edit Promotional Block' : 'Create Promotional Block'}
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Publish high-impact announcement banners on the Homepage or Catalogue.
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

            <form onSubmit={handleSavePromo} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block font-heading font-semibold text-[#475569] mb-1">
                  Banner Headline *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. CBSE & ICSE Board Exam Special: Save ₹100 on Annual Pass"
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block font-heading font-semibold text-[#475569] mb-1">
                  Subtitle / Context
                </label>
                <textarea
                  rows={2}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Unlock 24/7 Professor Sigma AI Teacher doubt clearance and all solved exemplar derivations."
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                />
              </div>

              {/* Row 1: Badge Text & Coupon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-heading font-semibold text-[#475569] mb-1">
                    Badge / Tag Label
                  </label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="e.g. BOARD REVISION SPECIAL"
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs uppercase focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                </div>

                <div>
                  <label className="block font-heading font-semibold text-[#475569] mb-1">
                    Associated Coupon Code
                  </label>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. BOARD2026"
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                </div>
              </div>

              {/* Row 2: Target Placements */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <label className="block font-heading font-semibold text-[#475569] mb-2">
                  Target Placements *
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[#0F172A]">
                    <input
                      type="checkbox"
                      checked={publishHomepage}
                      onChange={(e) => setPublishHomepage(e.target.checked)}
                      className="rounded border-[#CBD5E1] text-[#00687A] focus:ring-[#00687A] w-4 h-4 cursor-pointer"
                    />
                    <span>Homepage (mayf.co.in)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[#0F172A]">
                    <input
                      type="checkbox"
                      checked={publishCatalogue}
                      onChange={(e) => setPublishCatalogue(e.target.checked)}
                      className="rounded border-[#CBD5E1] text-[#00687A] focus:ring-[#00687A] w-4 h-4 cursor-pointer"
                    />
                    <span>Catalogue (/study-material)</span>
                  </label>
                </div>
              </div>

              {/* Row 3: Banner Style & Active State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-heading font-semibold text-[#475569] mb-1">
                    Visual Styling Theme
                  </label>
                  <select
                    value={bannerStyle}
                    onChange={(e) => setBannerStyle(e.target.value as any)}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  >
                    <option value="gradient">Gradient (Cyan & Royal Blue)</option>
                    <option value="urgent">Urgent (Warm Amber & Crimson)</option>
                    <option value="accent">Accent (Deep Navy & Cyan Glow)</option>
                    <option value="minimal">Minimal (Clean Border Card)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-heading font-semibold text-[#475569] mb-1">
                    Publishing Status
                  </label>
                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-[#0F172A]">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setEnabled(e.target.checked)}
                        className="rounded border-[#CBD5E1] text-[#00687A] focus:ring-[#00687A] w-4 h-4 cursor-pointer"
                      />
                      <span>Active & Displaying to Students</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Row 4: CTA Button */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-heading font-semibold text-[#475569] mb-1">
                    CTA Button Label
                  </label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="e.g. Claim ₹100 Discount"
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                </div>

                <div>
                  <label className="block font-heading font-semibold text-[#475569] mb-1">
                    CTA Destination Link
                  </label>
                  <input
                    type="text"
                    value={ctaLink}
                    onChange={(e) => setCtaLink(e.target.value)}
                    placeholder="e.g. /checkout?coupon=BOARD2026"
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                </div>
              </div>

              {/* Row 5: Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-heading font-semibold text-[#475569] mb-1">
                    Starts At (Date)
                  </label>
                  <input
                    type="date"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                </div>

                <div>
                  <label className="block font-heading font-semibold text-[#475569] mb-1">
                    Expires At (Date)
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#00687A]"
                  />
                </div>
              </div>

              {/* Live Preview in Modal */}
              <div className="pt-2">
                <span className="text-[10px] font-heading font-bold text-[#64748B] uppercase tracking-wider block mb-2">
                  Preview:
                </span>
                <div
                  className={`rounded-xl p-4 text-xs ${
                    bannerStyle === 'gradient'
                      ? 'bg-gradient-to-r from-[#00687A] via-[#0284C7] to-[#1D4ED8] text-white'
                      : bannerStyle === 'urgent'
                      ? 'bg-gradient-to-r from-[#9A3412] via-[#C2410C] to-[#DC2626] text-white'
                      : bannerStyle === 'accent'
                      ? 'bg-[#0B1528] text-white border border-cyan-500/30'
                      : 'bg-[#F0FDF4] text-[#14532D] border border-[#86EFAC]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      {badgeText && (
                        <div className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/20 mb-1">
                          {badgeText}
                        </div>
                      )}
                      <div className="font-bold text-sm">{title || 'Promotion Title'}</div>
                      <div className="text-[11px] opacity-90">{subtitle}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {couponCode && (
                        <div className="px-2.5 py-1 rounded bg-white/20 font-mono text-[11px] font-bold">
                          {couponCode}
                        </div>
                      )}
                      <div className="px-3 py-1.5 rounded bg-white text-[#0F172A] font-bold text-xs">
                        {ctaText || 'Claim'}
                      </div>
                    </div>
                  </div>
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
                  {saving ? 'Saving...' : isEditing ? 'Update Block' : 'Publish Block'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
