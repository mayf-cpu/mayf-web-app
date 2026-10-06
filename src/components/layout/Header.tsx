import React from 'react';
import { Search, Sparkles, User, ShieldCheck } from 'lucide-react';
import { Link, useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
  const { currentRoute } = useNavigation();
  const { user } = useAuth();

  const navLinks = [
    { label: 'Study Material', href: '/study-material' },
    { label: 'Formula Deck', href: '/formula-deck' },
    { label: 'AI Teacher', href: '/ai-teacher' },
    { label: 'Annual Pass', href: '/annual-pass' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
      {/* Universal Top Bar Contract: Exactly 3 Zones on one row */}
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Zone 1: Single text element wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0 group focus:outline-none"
          title="Maths at Your Fingertips Home"
        >
          <div className="w-9 h-9 rounded-lg bg-[#1D4ED8] flex items-center justify-center text-white font-heading font-extrabold text-lg shadow-xs group-hover:bg-[#1E40AF] transition-colors">
            Σ
          </div>
          <span className="font-heading font-extrabold text-lg tracking-tight text-[#0F172A] group-hover:text-[#1D4ED8] transition-colors whitespace-nowrap">
            Maths at Your Fingertips
          </span>
        </Link>

        {/* Zone 2: 4–6 text navigation links with subtle hover underlines */}
        <nav
          className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-[#475569]"
          aria-label="Main Navigation"
        >
          {navLinks.map((link) => {
            const isActive = currentRoute.path === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative py-1 transition-colors whitespace-nowrap ${
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

        {/* Zone 3: 1–2 primary actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/search"
            className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors"
            title="Search formulas and chapters"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </Link>

          {user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:border-[#CBD5E1] bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] transition-colors"
              title="Open Student Dashboard"
            >
              <div className="w-6 h-6 rounded-full bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center font-bold">
                {user.displayName.charAt(0)}
              </div>
              <span className="hidden sm:inline max-w-[90px] truncate">{user.displayName}</span>
            </Link>
          ) : (
            <Link href="/login">
              <Button size="sm" variant="outline" className="hidden sm:inline-flex">
                Log In
              </Button>
            </Link>
          )}

          <Link href="/annual-pass">
            <Button size="sm" variant="accent" className="font-bold">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              <span>Pass ₹999</span>
            </Button>
          </Link>
        </div>

      </div>
    </header>
  );
};
