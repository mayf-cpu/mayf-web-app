import React from 'react';
import { BookOpen, Layers, Bot, User } from 'lucide-react';
import { Link, useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';

export const MobileNav: React.FC = () => {
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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 glass-nav border-t border-[#E2E8F0] px-4 pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="h-full max-w-md mx-auto grid grid-cols-4 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center py-1 group focus:outline-none"
            >
              <div
                className={`flex items-center justify-center px-3.5 py-1 rounded-full transition-all duration-200 ${
                  item.isActive
                    ? 'bg-[#EFF6FF] text-[#1D4ED8] ring-1 ring-[#1D4ED8]/30 shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={item.isActive ? 2.4 : 1.8} />
              </div>
              <span
                className={`text-[10px] mt-0.5 font-heading tracking-tight ${
                  item.isActive
                    ? 'font-bold text-[#1D4ED8]'
                    : 'font-medium text-[#64748B]'
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
