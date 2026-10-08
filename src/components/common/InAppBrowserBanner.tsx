import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  HelpCircle,
  X,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { detectInAppBrowser, InAppBrowserInfo } from '../../lib/browser/inAppBrowserDetector';

interface InAppBrowserBannerProps {
  className?: string;
}

export const InAppBrowserBanner: React.FC<InAppBrowserBannerProps> = ({ className = '' }) => {
  const [browserInfo, setBrowserInfo] = useState<InAppBrowserInfo | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if dismissed in current session
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem('mayf_iab_banner_dismissed') === '1';
      if (dismissed) {
        setIsDismissed(true);
      }
    }

    // Detect environment
    const info = detectInAppBrowser();
    setBrowserInfo(info);
  }, []);

  // Do not show if not in in-app browser or user dismissed
  if (!browserInfo || !browserInfo.isLikelyInAppBrowser || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mayf_iab_banner_dismissed', '1');
    }
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(browserInfo.canonicalUrl);
      } else {
        const input = document.createElement('input');
        input.value = browserInfo.canonicalUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.warn('Failed to copy canonical URL:', err);
    }
  };

  const handleOpenInBrowserClick = (e: React.MouseEvent) => {
    // On Android, if intent url exists, standard anchor navigation executes
    // On iOS or if intent doesn't launch, we do NOT force loop redirects
    // We provide a fallback notice or toggle instructions
    if (!browserInfo.androidChromeIntentUrl) {
      e.preventDefault();
      // On iOS, direct external opening from WKWebView is sandboxed by iOS
      setShowInstructions(true);
    }
  };

  return (
    <aside
      aria-label="In-app browser recommendation banner"
      className={`bg-linear-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] text-white border-b border-slate-700/60 shadow-md transition-all duration-200 ${className}`}
    >
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 py-2.5 sm:py-3">
        {/* Main Banner Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Message Area */}
          <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 shrink-0 mt-0.5 sm:mt-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-slate-100 leading-snug">
                For the best Maths at Your Fingertips experience, open this page in your browser.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span className="font-mono text-blue-300">
                  Detected: {browserInfo.appName}
                </span>
                <span aria-hidden="true">·</span>
                <span>Normal page access is uninterrupted</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap w-full md:w-auto justify-end">
            {/* Open in Browser (Where technically supported) */}
            {browserInfo.androidChromeIntentUrl ? (
              <a
                href={browserInfo.androidChromeIntentUrl}
                onClick={handleOpenInBrowserClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="Launch Google Chrome via Android Intent"
              >
                <span>Open in Browser</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="View how to open in your device browser"
              >
                <span>Open in Browser</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Copy Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-600 text-slate-200'
              }`}
              title="Copy canonical HTTPS page link"
              aria-label="Copy canonical link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>

            {/* Instructions Menu Toggle */}
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              aria-expanded={showInstructions}
              title="Show instructions to open in external browser"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Instructions</span>
              {showInstructions ? (
                <ChevronUp className="w-3 h-3 ml-0.5" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-0.5" />
              )}
            </button>

            {/* Dismiss Banner Button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ml-1"
              aria-label="Dismiss in-app browser banner"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expandable Instructions Menu */}
        {showInstructions && (
          <div className="mt-3 pt-3 border-t border-slate-700/80 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="bg-slate-800/90 rounded-xl p-3.5 sm:p-4 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-bold text-xs sm:text-sm text-blue-300 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-400" />
                  <span>{browserInfo.instructions.title}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowInstructions(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Close instructions
                </button>
              </div>

              {/* Step by step guide */}
              <ol className="space-y-1.5 pl-4 list-decimal text-xs text-slate-200">
                {browserInfo.instructions.steps.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>

              {/* Honest Security Sandbox Note */}
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/50 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">
                  Why can&apos;t this page open automatically?
                </p>
                <p className="leading-relaxed">
                  Mobile application security and privacy policies (especially inside Instagram, Facebook, and iOS)
                  strictly prevent websites from forcing another app to launch an external browser without user permission.
                  {browserInfo.instructions.note}
                </p>
                <div className="pt-1 font-mono text-[10px] text-blue-400 truncate">
                  Canonical URL: {browserInfo.canonicalUrl}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
