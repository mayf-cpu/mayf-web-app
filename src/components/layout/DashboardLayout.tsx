import React from 'react';
import { LayoutDashboard, ShoppingBag, DownloadCloud, Bookmark, History, Flame, Sparkles, FileSpreadsheet } from 'lucide-react';
import { SharedLayout } from './SharedLayout';
import { Link, useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';
import { StudentClass } from '../../lib/firebase/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  const { currentRoute } = useNavigation();
  const { user, updateClass, isAnnualPassActive } = useAuth();

  const tabs = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Purchases', href: '/dashboard/purchases', icon: ShoppingBag },
    { label: 'Downloads', href: '/dashboard/downloads', icon: DownloadCloud },
    { label: 'Saved Formulas', href: '/dashboard/saved', icon: Bookmark },
    { label: 'AI Doubt History', href: '/dashboard/ai-history', icon: History },
    { label: 'Admin Import & Sync', href: '/admin/import-sync', icon: FileSpreadsheet },
  ];

  const classes: StudentClass[] = [
    'Class 5',
    'Class 6',
    'Class 7',
    'Class 8',
    'Class 9',
    'Class 10',
  ];

  return (
    <SharedLayout>
      <div className="space-y-6">
        
        {/* Student Profile Card Header */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 sm:p-6 shadow-[0_4px_14px_-2px_rgba(29,78,216,0.05)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center font-heading font-extrabold text-xl shadow-xs shrink-0">
              {user ? user.displayName.charAt(0) : 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading font-bold text-xl text-[#0F172A]">
                  {user ? user.displayName : 'Student'}
                </h1>
                {isAnnualPassActive ? (
                  <Badge variant="pro">ANNUAL PASS ACTIVE</Badge>
                ) : (
                  <Badge variant="free">FREE ACCESS</Badge>
                )}
              </div>
              <p className="text-xs text-[#64748B] mt-1">
                {user?.email} · {user?.board || 'CBSE'} Syllabus
              </p>
            </div>
          </div>

          {/* Quick Metrics & Class Selector */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Revision Streak */}
            <div className="flex items-center gap-2 bg-[#FFF7ED] border border-[#FFEDD5] px-3 py-1.5 rounded-lg text-xs font-semibold text-[#EA580C]">
              <Flame className="w-4 h-4 fill-[#F97316] text-[#EA580C]" />
              <span>{user?.streakDays || 1} Day Streak</span>
            </div>

            {/* Current Class Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#64748B] font-medium hidden sm:inline">Active Grade:</span>
              <select
                aria-label="Active Grade Selection"
                value={user?.studentClass || 'Class 10'}
                onChange={(e) => updateClass(e.target.value as StudentClass)}
                className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-md px-2.5 py-1.5 font-heading font-semibold text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              >
                {classes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="border-b border-[#E2E8F0] overflow-x-auto scrollbar-none">
          <nav className="flex space-x-2 sm:space-x-4 min-w-max pb-1" aria-label="Dashboard Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentRoute.path === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-heading font-semibold transition-all ${
                    isActive
                      ? 'bg-[#1D4ED8] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Header Title inside tab */}
        <div>
          <h2 className="font-heading font-bold text-lg md:text-xl text-[#0F172A]">
            {title}
          </h2>
          {subtitle && <p className="text-xs md:text-sm text-[#64748B] mt-0.5">{subtitle}</p>}
        </div>

        {/* Main Tab Stage */}
        <div className="pt-2">{children}</div>

      </div>
    </SharedLayout>
  );
};
