import React, { useState, useEffect, useRef } from 'react';
import {
  Share2,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  X as CloseIcon,
} from 'lucide-react';
import { trackShare } from '../../lib/analytics/analyticsService';

export interface ShareProps {
  url?: string;
  canonicalUrl?: string;
  title: string;
  description?: string;
  className?: string;
  variant?: 'button' | 'compact' | 'inline' | 'icon-only';
  buttonText?: string;
  buttonSize?: 'xs' | 'sm' | 'md';
  align?: 'left' | 'right';
}

export const ShareButton: React.FC<ShareProps> = ({
  url,
  canonicalUrl,
  title,
  description,
  className = '',
  variant = 'button',
  buttonText = 'Share',
  buttonSize = 'sm',
  align = 'right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check Web Share API capability
  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setHasNativeShare(true);
    }
  }, []);

  // Determine canonical URL dynamically if not supplied
  const resolveCanonicalUrl = (): string => {
    if (canonicalUrl) return canonicalUrl;
    if (url) return url;
    if (typeof document !== 'undefined') {
      const canonicalTag = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (canonicalTag?.href) return canonicalTag.href;
    }
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return 'https://mayf.co.in';
  };

  const shareUrl = resolveCanonicalUrl();
  const shareTitle = title || (typeof document !== 'undefined' ? document.title : 'Maths at Your Fingertips');
  const shareDescription =
    description ||
    (typeof document !== 'undefined'
      ? document.querySelector('meta[name="description"]')?.getAttribute('content') || ''
      : '');

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleCopyLink = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for restricted clipboard
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      trackShare({
        method: 'clipboard',
        content_type: 'general',
        item_title: shareTitle,
      });
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const handleNativeShare = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: shareTitle,
        text: shareDescription ? `${shareTitle}\n${shareDescription}` : shareTitle,
        url: shareUrl,
      });
      trackShare({
        method: 'web_share',
        content_type: 'general',
        item_title: shareTitle,
      });
      setIsOpen(false);
    } catch (err: any) {
      // AbortError is normal when user cancels dialog
      if (err?.name !== 'AbortError') {
        console.warn('Native share failed:', err);
      }
    }
  };

  // Pre-formatted share targets
  const shareTargets = [
    {
      name: 'WhatsApp',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.031 2C6.511 2 2.025 6.486 2.025 12.006c0 1.956.564 3.782 1.541 5.326L2 22l4.825-1.527a9.96 9.96 0 0 0 5.206 1.458h.004c5.517 0 10.003-4.486 10.003-10.006 0-2.674-1.042-5.187-2.935-7.078A9.943 9.943 0 0 0 12.031 2zm5.836 14.167c-.244.686-1.42 1.309-1.968 1.393-.505.076-1.164.108-3.754-.962-3.31-1.368-5.44-4.733-5.606-4.954-.162-.22-1.332-1.774-1.332-3.383 0-1.61.841-2.402 1.141-2.727.3-.325.656-.407.874-.407.218 0 .437.002.628.012.202.01.472-.077.738.56.273.654.928 2.26.101 2.443.082.183.137.397.027.616-.11.22-.164.356-.328.549-.164.192-.345.428-.492.574-.164.163-.335.34-.144.667.191.327.85 1.4 1.824 2.268 1.252 1.116 2.308 1.462 2.635 1.625.328.164.519.137.71-.082.192-.22.82-1.117 1.039-1.5.218-.382.436-.327.737-.218.3.11 1.912.902 2.239 1.066.328.163.546.245.628.382.082.136.082.791-.162 1.477z" />
        </svg>
      ),
      color: 'hover:bg-emerald-50 text-[#128C7E] hover:border-emerald-200',
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(
        `${shareTitle}\n${shareDescription ? shareDescription + '\n' : ''}${shareUrl}`
      )}`,
    },
    {
      name: 'Facebook',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      color: 'hover:bg-blue-50 text-[#1877F2] hover:border-blue-200',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'Telegram',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
        </svg>
      ),
      color: 'hover:bg-sky-50 text-[#0088cc] hover:border-sky-200',
      href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(
        `${shareTitle}${shareDescription ? ' — ' + shareDescription : ''}`
      )}`,
    },
    {
      name: 'X (Twitter)',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      color: 'hover:bg-slate-100 text-[#0F172A] hover:border-slate-300',
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(
        `${shareTitle}${shareDescription ? ' — ' + shareDescription : ''}`
      )}`,
    },
  ];

  const handleSocialClick = (methodName: string) => {
    const methodMap: Record<string, 'whatsapp' | 'telegram' | 'twitter' | 'web_share'> = {
      WhatsApp: 'whatsapp',
      Telegram: 'telegram',
      'X (Twitter)': 'twitter',
    };
    const method = methodMap[methodName] || 'web_share';
    trackShare({
      method,
      content_type: 'general',
      item_title: shareTitle,
    });
  };

  // Inline mode: directly renders horizontal share icons
  if (variant === 'inline') {
    return (
      <div className={`flex items-center flex-wrap gap-2 ${className}`}>
        <span className="text-xs font-heading font-semibold text-[#64748B] flex items-center gap-1.5 mr-1">
          <Share2 className="w-3.5 h-3.5 text-[#1D4ED8]" />
          <span>Share:</span>
        </span>

        {/* Copy Link Button */}
        <button
          onClick={handleCopyLink}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
            copied
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
              : 'bg-white text-[#0F172A] border-[#CBD5E1] hover:bg-[#F8FAFC]'
          }`}
          title="Copy canonical link to clipboard"
          aria-label="Copy canonical link to clipboard"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Copy Link'}</span>
        </button>

        {/* Web Share API if supported */}
        {hasNativeShare && (
          <button
            onClick={handleNativeShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A] hover:bg-[#F8FAFC] text-xs font-semibold transition-all cursor-pointer"
            title="Open native device share menu"
            aria-label="Open native device share menu"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#1D4ED8]" />
            <span>Device</span>
          </button>
        )}

        {/* Social channels */}
        {shareTargets.map((item) => (
          <a
            key={item.name}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleSocialClick(item.name)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-semibold transition-all ${item.color}`}
            title={`Share on ${item.name}`}
            aria-label={`Share on ${item.name}`}
          >
            {item.icon}
            <span className="hidden sm:inline">{item.name}</span>
          </a>
        ))}
      </div>
    );
  }

  // Size styling
  const sizeClasses = {
    xs: 'px-2 py-1 text-[11px] gap-1',
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
  }[buttonSize];

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      {variant === 'icon-only' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          title={`Share "${shareTitle}"`}
          aria-label={`Share "${shareTitle}"`}
          className="p-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] border border-transparent hover:border-[#CBD5E1] transition-all cursor-pointer"
        >
          <Share2 className="w-4 h-4 text-[#1D4ED8]" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          className={`inline-flex items-center font-heading font-semibold rounded-lg border transition-all cursor-pointer ${
            isOpen
              ? 'bg-[#EFF6FF] border-[#1D4ED8] text-[#1D4ED8] shadow-xs'
              : 'bg-white hover:bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] shadow-2xs'
          } ${sizeClasses}`}
        >
          <Share2 className="w-3.5 h-3.5 text-[#1D4ED8]" />
          <span>{buttonText}</span>
        </button>
      )}

      {/* Share Popover / Dropdown Menu */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Share Options"
          className={`absolute z-50 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border border-[#CBD5E1] p-3 text-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-150 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-[#1D4ED8]" />
              <span className="font-heading font-bold text-xs text-[#0F172A]">
                Share Canonical Resource
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-[#94A3B8] hover:text-[#0F172A] rounded-md hover:bg-[#F1F5F9] cursor-pointer"
              aria-label="Close share menu"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Canonical Resource Info Card */}
          <div className="bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0] space-y-1">
            <p className="font-heading font-bold text-xs text-[#0F172A] line-clamp-1">
              {shareTitle}
            </p>
            {shareDescription && (
              <p className="text-[11px] text-[#64748B] line-clamp-2 leading-relaxed">
                {shareDescription}
              </p>
            )}
            <div className="pt-1 text-[10px] font-mono text-[#00687A] truncate">
              {shareUrl}
            </div>
          </div>

          {/* Quick Copy Link Box */}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-2.5 py-1.5 bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg text-[11px] font-mono text-[#334155] select-all focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className={`shrink-0 px-3 py-1.5 rounded-lg font-heading font-semibold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                copied
                  ? 'bg-[#10B981] text-white shadow-xs'
                  : 'bg-[#1D4ED8] hover:bg-[#1E40AF] text-white'
              }`}
              title="Copy shareable link"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Native Web Share Option (When Available) */}
          {hasNativeShare && (
            <button
              onClick={handleNativeShare}
              className="w-full text-left px-3 py-2 rounded-lg bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] text-[#1D4ED8] flex items-center justify-between font-heading font-semibold cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                <span>Share via Device Apps (System Share)</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#1D4ED8]" />
            </button>
          )}

          {/* Direct Social Channels */}
          <div className="space-y-1 pt-1">
            <span className="block text-[10px] font-heading font-semibold uppercase tracking-wider text-[#64748B] px-1">
              Social Platforms
            </span>

            <div className="grid grid-cols-2 gap-1.5">
              {shareTargets.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    handleSocialClick(item.name);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border border-[#E2E8F0] font-medium text-xs transition-all ${item.color}`}
                >
                  {item.icon}
                  <span className="truncate">{item.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <div className="text-[10px] text-[#94A3B8] text-center pt-1 border-t border-[#F1F5F9]">
            Direct canonical link with OpenGraph preview
          </div>
        </div>
      )}
    </div>
  );
};
