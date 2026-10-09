import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  GraduationCap,
  ShieldAlert,
  Sparkles,
  Receipt,
  CreditCard,
  Tag,
  Bell,
  Share2,
  Megaphone,
  Sliders,
  Palette,
  Globe,
  Wallet,
  FileSpreadsheet,
  BarChart3,
  Settings,
  ShieldCheck,
  Cloud,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { AdminSection, ADMIN_SECTIONS, getAdminUrl } from '../../config/adminConfig';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';

interface AdminLayoutProps {
  currentSection: AdminSection;
  onSelectSection: (section: AdminSection) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentSection,
  onSelectSection,
  children,
}) => {
  const { user, entitlements, logout } = useAuth();
  const { navigate } = useNavigation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Group sections by category
  const categories = ['Overview', 'Academics', 'Commercial', 'Engagement', 'Platform'] as const;

  const getSectionIcon = (id: AdminSection) => {
    switch (id) {
      case 'dashboard':
        return <LayoutDashboard className="w-4 h-4" />;
      case 'content':
        return <BookOpen className="w-4 h-4" />;
      case 'categories':
        return <Layers className="w-4 h-4" />;
      case 'students':
        return <GraduationCap className="w-4 h-4" />;
      case 'admins':
        return <ShieldAlert className="w-4 h-4" />;
      case 'ai-activity':
        return <Sparkles className="w-4 h-4" />;
      case 'orders':
        return <Receipt className="w-4 h-4" />;
      case 'annual-pass':
        return <CreditCard className="w-4 h-4" />;
      case 'coupons':
        return <Tag className="w-4 h-4" />;
      case 'notifications':
        return <Bell className="w-4 h-4" />;
      case 'social':
        return <Share2 className="w-4 h-4" />;
      case 'ads':
        return <Megaphone className="w-4 h-4" />;
      case 'layout':
        return <Sliders className="w-4 h-4" />;
      case 'branding':
        return <Palette className="w-4 h-4" />;
      case 'seo':
        return <Globe className="w-4 h-4" />;
      case 'payments':
        return <Wallet className="w-4 h-4" />;
      case 'import':
        return <FileSpreadsheet className="w-4 h-4" />;
      case 'analytics':
        return <BarChart3 className="w-4 h-4" />;
      case 'settings':
        return <Settings className="w-4 h-4" />;
      default:
        return <LayoutDashboard className="w-4 h-4" />;
    }
  };

  const handleSelect = (sec: AdminSection) => {
    onSelectSection(sec);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Authoritative Header */}
      <header className="sticky top-0 z-40 bg-[#1E293B]/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Toggle admin navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-heading font-extrabold text-base shadow-xs">
              Σ
            </div>
            <div>
              <span className="font-heading font-bold text-sm tracking-tight text-white block">
                MAYF Admin Console
              </span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Defence in Depth · RBAC Active
              </span>
            </div>
          </div>
        </div>

        {/* Top Badges & Operator Profile */}
        <div className="flex items-center gap-3">
          {/* Direct Google OAuth Tag */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Direct Google OAuth</span>
          </div>

          {/* Admin Role Claim Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-900/50 border border-purple-700/60 text-[11px] font-mono font-bold text-purple-300">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>{entitlements.isSuperAdmin ? 'superAdmin=true' : 'admin=true'}</span>
          </div>

          {/* User Email & Exit */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800 text-xs">
            <span className="font-mono text-slate-300 text-[11px] truncate max-w-[160px]">
              {user?.email || 'sachin.itig@gmail.com'}
            </span>
          </div>

          <button
            onClick={() => navigate('/')}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="View Public Learning Site"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Sidebar for Desktop */}
        <aside
          className={`fixed md:sticky top-16 z-30 h-[calc(100vh-4rem)] w-64 bg-[#1E293B] border-r border-slate-800 flex flex-col justify-between overflow-y-auto transition-transform duration-200 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="p-3 space-y-4">
            {categories.map((cat) => {
              const catSections = ADMIN_SECTIONS.filter((s) => s.category === cat);
              return (
                <div key={cat} className="space-y-1">
                  <div className="px-3 py-1 text-[10px] font-heading font-extrabold uppercase tracking-wider text-slate-400">
                    {cat}
                  </div>
                  {catSections.map((sec) => {
                    const isActive = currentSection === sec.id;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => handleSelect(sec.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-heading font-medium transition-colors text-left cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                        }`}
                      >
                        <span className={isActive ? 'text-white' : 'text-slate-400'}>
                          {getSectionIcon(sec.id)}
                        </span>
                        <span className="truncate">{sec.title}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-800 space-y-2">
            <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/80 text-[10px] font-mono text-slate-400 space-y-0.5">
              <div className="text-emerald-400 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Protected Admin Endpoint</span>
              </div>
              <div className="truncate text-slate-500">X-Robots-Tag: noindex</div>
            </div>

            <button
              onClick={() => logout().then(() => navigate('/'))}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-950/40 border border-rose-900/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out of Console</span>
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-[#0B1120]">
          <div className="max-w-[1240px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
