import React, { useEffect, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { Link, useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { NotificationBellDropdown } from '../notifications/NotificationBellDropdown';
import { BrandLogo } from '../ui/BrandLogo';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
  const { currentRoute, navigate } = useNavigation();
  const { user } = useAuth();
  const { settings } = useSiteSettings();

  const [search,setSearch]=useState('');
  const menuColor=settings?.colors?.primaryColor||'#1D4ED8';
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

  const configuredName = settings?.brand?.siteName?.trim();
  const siteName = configuredName && /\p{L}/u.test(configuredName) ? configuredName : 'Maths at Your Fingertips';
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
        
        {/* Zone 1: Logo-only home link; the accessible name remains available. */}
        <Link
          href="/"
          className="flex items-center gap-2 sm:gap-2.5 shrink min-w-0 group focus:outline-none py-1"
          title={`${siteName} Home`}
          aria-label={`${siteName} Home`}
        >
          <BrandLogo className="h-11 w-auto max-w-[120px] sm:h-12 sm:max-w-[220px] object-contain shrink-0" />
        </Link>

        {/* Zone 2: 4–6 text navigation links with subtle hover underlines */}
        <nav
          style={{backgroundColor:menuColor}} className="hidden md:flex order-last w-full justify-center rounded-lg px-4 py-1 items-center gap-6 lg:gap-8 text-sm font-medium text-white"
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
                    ? 'text-white font-bold'
                    : 'text-white hover:underline'
                }`}
              >
                {link.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"
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
            className="lg:hidden w-10 h-10 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer"
            title="Search formulas and chapters"
            aria-label="Search"
          >
            <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </Link>

          <form role="search" onSubmit={event=>{event.preventDefault();navigate('/study-material?q='+encodeURIComponent(search.trim()));}} className="hidden lg:flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden"><input aria-label="Search study resources" placeholder="Search study resources…" value={search} onChange={event=>setSearch(event.target.value)} className="w-44 xl:w-60 px-3 py-2 text-sm outline-none"/><button aria-label="Submit search" className="p-3 text-slate-700"><Search className="h-4 w-4"/></button></form>
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
      <details style={{backgroundColor:menuColor}} className="md:hidden px-3 text-white">
        <summary className="min-h-11 flex items-center cursor-pointer font-semibold text-sm text-white">Browse learning tools</summary>
        <nav aria-label="Mobile learning navigation" className="grid grid-cols-2 gap-2 pb-3">
          {navLinks.map(link => <Link key={link.href} href={link.href} className="min-h-11 rounded-lg bg-white/10 px-3 py-3 text-sm text-white">{link.label}</Link>)}
          <Link href={user ? '/dashboard' : '/login'} className="min-h-11 rounded-lg bg-white/10 px-3 py-3 text-sm text-white">{user ? 'My dashboard' : 'Log In'}</Link>
        </nav>
      </details>
    </header>
  );
};
