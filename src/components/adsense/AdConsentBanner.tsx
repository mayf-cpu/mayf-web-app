import React from 'react';
import { ShieldCheck, Info, X, Check, Lock } from 'lucide-react';
import { useAdSense } from '../../context/AdSenseContext';
import { Link } from '../../context/NavigationContext';

export const AdConsentBanner: React.FC = () => {
  const { config, consentAcknowledged, acknowledgeConsent } = useAdSense();

  if (!config.adsenseEnabled || !config.consent.bannerEnabled || consentAcknowledged) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Student Privacy and Advertising Notice"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-4 shadow-2xl space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-heading font-extrabold text-xs text-slate-900 leading-tight">
                Student Privacy & Non-Personalized Advertising
              </h4>
              <span className="text-[10px] font-mono text-emerald-700">
                COPPA & DPDP Act Child-Protected Mode Active
              </span>
            </div>
          </div>

          <button
            onClick={acknowledgeConsent}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            aria-label="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-600 leading-relaxed">
          Because Maths at Your Fingertips serves school students, all advertisements are strictly non-personalized
          and contextually selected. We do not use behavioral tracking cookies, profiling, or targeted minor data.
        </p>

        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100 text-xs">
          <Link
            href="/privacy"
            className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline"
          >
            Privacy Policy
          </Link>

          <button
            onClick={acknowledgeConsent}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-xs rounded-lg shadow-xs cursor-pointer transition-colors"
          >
            Got it, thanks
          </button>
        </div>
      </div>
    </div>
  );
};
