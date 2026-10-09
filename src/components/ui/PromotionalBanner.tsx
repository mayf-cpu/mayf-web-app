import React, { useState, useEffect } from 'react';
import { Tag, Sparkles, Flame, ArrowRight, Copy, Check, X, Percent } from 'lucide-react';
import { PromotionalBlock } from '../../lib/coupons/types';

interface PromotionalBannerProps {
  placement: 'homepage' | 'catalogue';
  className?: string;
}

export const PromotionalBanner: React.FC<PromotionalBannerProps> = ({ placement, className = '' }) => {
  const [promotions, setPromotions] = useState<PromotionalBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const stored = sessionStorage.getItem(`mayf_dismissed_promos_${placement}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let isMounted = true;
    async function loadPromos() {
      try {
        const res = await fetch(`/api/promotions?placement=${placement}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && isMounted) {
            setPromotions(data.promotions || []);
          }
        }
      } catch (err) {
        console.warn(`[MAYF Promos] Could not fetch promotions for ${placement}:`, err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadPromos();
    return () => {
      isMounted = false;
    };
  }, [placement]);

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      sessionStorage.setItem(`mayf_dismissed_promos_${placement}`, JSON.stringify(updated));
    } catch (err) {
      console.warn('[PromotionalBanner] Failed to persist dismissed promotions in sessionStorage:', err);
    }
  };

  const visiblePromotions = promotions.filter((p) => !dismissedIds.includes(p.id));

  if (loading || visiblePromotions.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {visiblePromotions.map((promo) => {
        const isUrgent = promo.bannerStyle === 'urgent';
        const isAccent = promo.bannerStyle === 'accent';
        const isMinimal = promo.bannerStyle === 'minimal';
        const isGradient = promo.bannerStyle === 'gradient' || (!isUrgent && !isAccent && !isMinimal);

        return (
          <div
            key={promo.id}
            className={`relative rounded-xl overflow-hidden p-5 sm:p-6 transition-all shadow-sm ${
              isGradient
                ? 'bg-gradient-to-r from-[#00687A] via-[#0284C7] to-[#1D4ED8] text-white border border-blue-400/20'
                : isUrgent
                ? 'bg-gradient-to-r from-[#9A3412] via-[#C2410C] to-[#DC2626] text-white border border-orange-400/30'
                : isAccent
                ? 'bg-[#0B1528] text-white border border-cyan-500/30 shadow-cyan-950/20'
                : 'bg-[#F0FDF4] text-[#14532D] border border-[#86EFAC]'
            }`}
          >
            {/* Dismiss Button */}
            <button
              onClick={(e) => handleDismiss(e, promo.id)}
              aria-label="Dismiss banner"
              className={`absolute top-3 right-3 p-1 rounded-full transition-colors cursor-pointer ${
                isMinimal
                  ? 'text-[#14532D]/60 hover:text-[#14532D] hover:bg-black/5'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-6 sm:pr-8">
              {/* Content Block */}
              <div className="space-y-2 max-w-2xl">
                {promo.badgeText && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-wider bg-white/20 backdrop-blur-sm">
                    {isUrgent ? (
                      <Flame className="w-3 h-3 text-[#FDE047] fill-current" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-[#FDE047]" />
                    )}
                    <span>{promo.badgeText}</span>
                  </div>
                )}

                <h3
                  className={`font-heading font-extrabold text-base sm:text-lg tracking-tight leading-snug ${
                    isMinimal ? 'text-[#0F172A]' : 'text-white'
                  }`}
                >
                  {promo.title}
                </h3>

                {promo.subtitle && (
                  <p
                    className={`text-xs sm:text-sm leading-relaxed ${
                      isMinimal ? 'text-[#334155]' : 'text-white/85'
                    }`}
                  >
                    {promo.subtitle}
                  </p>
                )}
              </div>

              {/* Action / Coupon Pill Block */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 pt-2 md:pt-0">
                {promo.couponCode && (
                  <div
                    onClick={(e) => handleCopyCode(e, promo.couponCode!)}
                    title="Click to copy coupon code"
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all border ${
                      isMinimal
                        ? 'bg-white border-[#CBD5E1] text-[#0F172A] hover:border-[#00687A]'
                        : 'bg-white/15 hover:bg-white/25 border-white/30 text-white backdrop-blur-sm'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5 shrink-0 opacity-80" />
                    <span>{promo.couponCode}</span>
                    <span
                      className="ml-1 p-0.5 rounded hover:bg-white/20 transition-colors inline-flex items-center"
                    >
                      {copiedCode === promo.couponCode ? (
                        <Check className="w-3.5 h-3.5 text-[#4ADE80]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 opacity-80" />
                      )}
                    </span>
                    {copiedCode === promo.couponCode && (
                      <span className="text-[10px] text-[#4ADE80] font-sans font-semibold">
                        Copied!
                      </span>
                    )}
                  </div>
                )}

                <a
                  href={promo.ctaLink}
                  className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-heading font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap ${
                    isMinimal
                      ? 'bg-[#00687A] text-white hover:bg-[#005261]'
                      : 'bg-white text-[#0F172A] hover:bg-[#F8FAFC] shadow-black/10'
                  }`}
                >
                  <span>{promo.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
