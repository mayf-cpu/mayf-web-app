import React, { useEffect, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { Link, useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { NotificationBellDropdown } from '../notifications/NotificationBellDropdown';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
  const { currentRoute } = useNavigation();
  const { user } = useAuth();
  const { settings } = useSiteSettings();

  const [passPrice, setPassPrice] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/annual-pass/config', { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        const config = data?.settings;
        if (data?.success && config?.enabled && typeof config.salePrice === 'number' && Number.isFinite(config.salePrice) && config.salePrice >= 0) {
          setPassPrice(new Intl.NumberFormat('en-IN', { style: 'currency', currency: config.currency || 'INR', maximumFractionDigits: 2 }).format(config.salePrice));
        }
      })
      .catch(() => { /* Keep the pass link usable when pricing is unavailable. */ });
    return () => controller.abort();
  }, []);

  const siteName = settings?.brand?.siteName || 'Maths at Your Fingertips';
  const logoUrl = settings?.brand?.logoUrl;
  const wordmarkGlyph = settings?.brand?.wordmarkGlyph || 'Σ';
  const primaryColor = settings?.colors?.primaryColor || '#1D4ED8';

  const navLinks = [
    { label: 'Study Material', href: '/study-material' },
    { label: 'Formula Deck', href: '/formula-deck' },
    { label: 'Courses', href: '/courses' },
    { label: 'AI Teacher', href: '/ai-teacher' },
    { label: 'Annual Pass', href: '/annual-pass' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
      {/* Universal Top Bar Contract: Exactly 3 Zones on one row */}
      <div className="max-w-[1140px] mx-auto px-3 sm:px-6 min-h-16 py-2 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        
        {/* Zone 1: Single text element wordmark with responsive truncation */}
        <Link
          href="/"
          className="flex items-center gap-2 sm:gap-2.5 shrink min-w-0 group focus:outline-none py-1"
          title={`${siteName} Home`}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={siteName}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-contain shrink-0"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-white font-heading font-extrabold text-base sm:text-lg shadow-xs transition-colors shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              {wordmarkGlyph}
            </div>
          )}
          <span className="font-heading font-extrabold text-base sm:text-lg tracking-tight text-[#0F172A] group-hover:text-[#1D4ED8] transition-colors truncate max-w-[125px] min-[390px]:max-w-[170px] sm:max-w-none">
            {siteName}
          </span>
        </Link>

        {/* Zone 2: 4–6 text navigation links with subtle hover underlines */}
        <nav
          className="hidden md:flex order-last w-full justify-center border-t border-slate-100 pt-2 items-center gap-6 lg:gap-8 text-sm font-medium text-[#475569]"
          aria-label="Main Navigation"
        >
          {navLinks.map((link) => {
            const isActive = currentRoute.path === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative py-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-[#1D4ED8] font-semibold'
                    : 'hover:text-[#0F172A]'
                }`}
              >
                {link.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1D4ED8] rounded-full"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Primary actions with accessible touch targets (>= 40px) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <Link
            href="/search"
            className="w-10 h-10 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer"
            title="Search formulas and chapters"
            aria-label="Search"
          >
            <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </Link>

          {/* Internal Student Notification Bell Dropdown */}
          <NotificationBellDropdown />

          {user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 sm:gap-2 pl-1.5 pr-2.5 sm:pr-3 py-1 min-h-[38px] rounded-lg border border-[#E2E8F0] hover:border-[#CBD5E1] bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] transition-colors"
              title="Open Student Dashboard"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-blue-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center font-bold text-xs">
                  {user.displayName.charAt(0)}
                </div>
              )}
              <span className="hidden sm:inline max-w-[90px] truncate">{user.displayName}</span>
            </Link>
          ) : (
            <Link href="/login">
              <Button size="sm" variant="outline" className="hidden sm:inline-flex min-h-[36px]">
                Log In
              </Button>
            </Link>
          )}

          <Link href="/annual-pass">
            <Button size="sm" variant="accent" className="font-bold min-h-[38px] px-2.5 sm:px-3 text-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              <span>
                {passPrice ? `Pass ${passPrice}` : 'Annual Pass'}
              </span>
            </Button>
          </Link>
        </div>

      </div>
    </header>
  );
};
