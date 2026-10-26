import {useSiteSettings} from '../../context/SiteSettingsContext';
import React from 'react';
import { BookOpen, Layers, Bot, User } from 'lucide-react';
import { Link, useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';

export const MobileNav: React.FC = () => {
  const {settings}=useSiteSettings();
  const { currentRoute } = useNavigation();
  const { user } = useAuth();

  const navItems = [
    {
      label: 'Learn',
      href: '/study-material',
      icon: BookOpen,
      isActive: currentRoute.path.startsWith('/study'),
    },
    {
      label: 'Formulas',
      href: '/formula-deck',
      icon: Layers,
      isActive: currentRoute.path.startsWith('/formula'),
    },
    {
      label: 'AI Teacher',
      href: '/ai-teacher',
      icon: Bot,
      isActive: currentRoute.path === '/ai-teacher',
    },
    {
      label: user ? 'Dashboard' : 'Account',
      href: user ? '/dashboard' : '/login',
      icon: User,
      isActive: currentRoute.path.startsWith('/dashboard') || currentRoute.path === '/login',
    },
  ];

  return (
    <nav
      style={{backgroundColor:settings.colors.primaryColor}} className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-[#E2E8F0] px-4 pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="h-full max-w-md mx-auto grid grid-cols-4 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center min-h-[48px] w-full py-1 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
              aria-label={item.label}
            >
              <div
                className={`flex items-center justify-center px-3.5 py-1 rounded-full transition-all duration-200 ${
                  item.isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={item.isActive ? 2.4 : 1.8} />
              </div>
              <span
                className={`text-[10px] mt-0.5 font-heading tracking-tight ${
                  item.isActive
                    ? 'font-bold text-white'
                    : 'font-medium text-white'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
