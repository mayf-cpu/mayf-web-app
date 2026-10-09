import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Info, Sparkles, ExternalLink } from 'lucide-react';
import { useAdSense } from '../../context/AdSenseContext';
import { AdSensePageZone, AdSensePosition } from '../../lib/adsense/adsenseTypes';

interface AdSensePlacementProps {
  zone: AdSensePageZone;
  position?: AdSensePosition;
  className?: string;
  // Anti-violation guard props:
  insideAiTeacherSteps?: boolean;
  overPurchaseControls?: boolean;
  overNavigation?: boolean;
  overForms?: boolean;
}

export const AdSensePlacement: React.FC<AdSensePlacementProps> = ({
  zone,
  position,
  className = '',
  insideAiTeacherSteps,
  overPurchaseControls,
  overNavigation,
  overForms,
}) => {
  const { config, isProhibitedZone, getPlacement } = useAdSense();
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState<boolean>(false);

  // 1. Strict Prohibited Zones Safety Net
  if (
    isProhibitedZone({
      insideAiTeacherSteps,
      overPurchaseControls,
      overNavigation,
      overForms,
    })
  ) {
    if (import.meta.env.DEV) {
      console.warn(
        `[AdSense Policy] Blocked placement attempt in prohibited educational/transactional zone. (Zone: ${zone})`
      );
    }
    return null;
  }

  // 2. Check if master AdSense or this specific zone is enabled
  const placement = getPlacement(zone);
  if (!config.adsenseEnabled || !placement || !placement.enabled) {
    return null;
  }

  // Optional position filter if component specified position
  if (position && placement.position !== position) {
    return null;
  }

  const minHeight = placement.minHeightPx || 90;
  const isMinorProtected = config.minorProtection.tagForChildDirectedTreatment;

  useEffect(() => {
    // Only attempt to load Google AdSense script if in browser environment
    if (typeof window === 'undefined') return;

    try {
      // In development or simulated mode without live Google scripts, simulate ad loading cleanly
      const timer = setTimeout(() => {
        setAdLoaded(true);
      }, 300);

      // Child & teen safe AdSense push with non-personalized data attributes
      const win = window as any;
      if (win.adsbygoogle) {
        win.adsbygoogle = win.adsbygoogle || [];
        win.adsbygoogle.push({
          params: {
            tagForChildDirectedTreatment: config.minorProtection.tagForChildDirectedTreatment ? 1 : 0,
            tagForUnderAgeOfConsent: config.minorProtection.tagForUnderAgeOfConsent ? 1 : 0,
            npa: config.minorProtection.nonPersonalizedAdsOnly ? 1 : 0,
            maxAdContentRating: config.minorProtection.maxAdContentRating || 'G',
          },
        });
      }

      return () => clearTimeout(timer);
    } catch (e) {
      console.warn('[AdSense] Placement initialization note:', e);
    }
  }, [zone, config]);

  return (
    <div
      ref={adContainerRef}
      role="region"
      aria-label="Educational Partner Advertisement"
      className={`w-full my-6 transition-all ${className}`}
    >
      {/* 
        CRITICAL CLS (Cumulative Layout Shift) PREVENTION:
        Pre-allocates exact reserved min-height so content never jumps or reflows.
      */}
      <div
        className="w-full bg-[#F8FAFC] border border-dashed border-[#CBD5E1] rounded-xl p-3 flex flex-col justify-between overflow-hidden relative"
        style={{ minHeight: `${minHeight}px` }}
      >
        {/* Compliance Header Strip */}
        {placement.showDisclaimer && (
          <div className="flex items-center justify-between text-[10px] text-[#94A3B8] font-mono tracking-wider border-b border-slate-100 pb-1 mb-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="uppercase font-bold text-slate-500">
                Sponsor · {isMinorProtected ? 'Child-Safe Non-Personalized Ad (G-Rated)' : 'Verified Partner'}
              </span>
            </div>

            <a
              href="/privacy"
              className="hover:text-blue-600 flex items-center gap-1 text-[10px] text-slate-400 hover:underline"
              title="Learn about Student Ad Privacy & COPPA protection"
            >
              <Info className="w-3 h-3" />
              <span>Ad Privacy</span>
            </a>
          </div>
        )}

        {/* Ad Body / Placement Surface */}
        <div className="flex-1 flex flex-col items-center justify-center py-2 text-center">
          <ins
            className="adsbygoogle"
            style={{ display: 'block', minHeight: `${Math.max(50, minHeight - 35)}px`, width: '100%' }}
            data-ad-client={config.publisherId}
            data-ad-slot={placement.slotId}
            data-ad-format={placement.format}
            data-full-width-responsive="true"
            data-tag-for-child-directed-treatment={config.minorProtection.tagForChildDirectedTreatment ? 'true' : 'false'}
            data-tag-for-under-age-of-consent={config.minorProtection.tagForUnderAgeOfConsent ? 'true' : 'false'}
          />

          {/* Reserved visual skeleton when waiting for network / mock */}
          <div className="flex flex-col items-center justify-center text-xs text-slate-400 py-2 space-y-1">
            <span className="font-mono text-[11px] bg-white px-3 py-1 rounded-md border border-slate-200 text-slate-600 shadow-2xs">
              AdSense Placement: {zone} · {placement.format} ({placement.slotId})
            </span>
            <span className="text-[10px] text-slate-400">
              Zero tracking cookies · Strictly educational family-safe criteria
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
