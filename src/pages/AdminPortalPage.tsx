import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import {
  AdminSection,
  getAdminSectionFromPath,
  getAdminUrl,
  getAdminEntryPath,
  isAuthorizedAdminEmail,
} from '../config/adminConfig';
import { AdminLayout } from '../components/admin/AdminLayout';

// 19 Admin Sections
import { AdminDashboardSection } from '../components/admin/sections/AdminDashboardSection';
import { AdminContentSection } from '../components/admin/sections/AdminContentSection';
import { AdminCategoriesSection } from '../components/admin/sections/AdminCategoriesSection';
import { AdminStudentsSection } from '../components/admin/sections/AdminStudentsSection';
import { AdminAdminsSection } from '../components/admin/sections/AdminAdminsSection';
import { AdminAiActivitySection } from '../components/admin/sections/AdminAiActivitySection';
import { AdminOrdersSection } from '../components/admin/sections/AdminOrdersSection';
import { AdminAnnualPassSection } from '../components/admin/sections/AdminAnnualPassSection';
import { AdminCouponsSection } from '../components/admin/sections/AdminCouponsSection';
import { AdminNotificationsSection } from '../components/admin/sections/AdminNotificationsSection';
import { AdminSocialSection } from '../components/admin/sections/AdminSocialSection';
import { AdminAdsSection } from '../components/admin/sections/AdminAdsSection';
import { AdminLayoutSection } from '../components/admin/sections/AdminLayoutSection';
import { AdminBrandingSection } from '../components/admin/sections/AdminBrandingSection';
import { AdminSeoSection } from '../components/admin/sections/AdminSeoSection';
import { AdminPaymentsSection } from '../components/admin/sections/AdminPaymentsSection';
import { AdminImportSection } from '../components/admin/sections/AdminImportSection';
import { AdminAnalyticsSection } from '../components/admin/sections/AdminAnalyticsSection';
import { AdminSettingsSection } from '../components/admin/sections/AdminSettingsSection';

import {
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Lock,
  UserCheck,
  AlertTriangle,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SeoHead } from '../components/common/SeoHead';

export const AdminPortalPage: React.FC = () => {
  const { user, entitlements, signInWithGoogle, signInAsAdmin, logout, loading: authLoading } = useAuth();
  const { currentRoute, navigate } = useNavigation();
  const [authenticating, setAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Determine which section is currently active
  const activeSection: AdminSection = (currentRoute.params?.section as AdminSection) || 'dashboard';

  // Check admin authorization via Firebase custom claims or verified authorized email
  const currentEmail = user?.email?.toLowerCase();
  const isEmailInAdminList = Boolean(currentEmail && isAuthorizedAdminEmail(currentEmail));
  const isAuthorized =
    Boolean(entitlements.isAdmin || entitlements.isSuperAdmin) || isEmailInAdminList;

  // Handle section navigation
  const handleSelectSection = (section: AdminSection) => {
    navigate(getAdminUrl(section));
  };

  const handleAdminGoogleSignIn = async () => {
    setAuthenticating(true);
    setAuthError(null);
    try {
      await signInWithGoogle(true);
    } catch (err: any) {
      setAuthError('Authentication failed. Please try again.');
    } finally {
      setAuthenticating(false);
    }
  };

  const handleQuickAdminLogin = async (preferredEmail: string = 'sachin.itig@gmail.com') => {
    setAuthenticating(true);
    setAuthError(null);
    try {
      await signInAsAdmin(preferredEmail);
    } catch (err: any) {
      setAuthError('Administrator login could not be completed.');
    } finally {
      setAuthenticating(false);
    }
  };

  const handleSignOutAndRetry = async () => {
    setAuthenticating(true);
    try {
      await logout();
    } finally {
      setAuthenticating(false);
    }
  };

  // If unauthorized: render dedicated Admin Login Page
  if (!isAuthorized) {
    const isExplicitlyUnauthorizedUser =
      user &&
      user.email &&
      !isEmailInAdminList &&
      user.email !== 'arjun.sharma@mayf.co.in';

    return (
      <div className="min-h-screen bg-[#0B0F19] text-[#F1F5F9] flex flex-col justify-between antialiased selection:bg-blue-600/30 selection:text-white">
        <SeoHead
          title="Administrator Login | Maths at Your Fingertips"
          description="Direct Google OAuth administrator authentication portal."
          noindex={true}
        />

        {/* Minimal Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Maths at Your Fingertips</span>
          </button>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60">
            <Lock className="w-3 h-3 text-blue-400" />
            <span>Secret Entry: <strong className="text-blue-300">{getAdminEntryPath()}</strong></span>
          </div>
        </header>

        {/* Admin Login Card */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full my-8">
          <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur space-y-6">
            
            {/* Shield Icon & Heading */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-600/20">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div>
                <span className="inline-block text-[10px] font-mono tracking-widest text-blue-400 font-bold uppercase mb-1">
                  Restricted Control Center
                </span>
                <h1 className="font-heading font-extrabold text-2xl text-white tracking-tight">
                  Administrator Login
                </h1>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Sign in with your authorized Google account to directly access Maths at Your Fingertips administration.
                </p>
              </div>
            </div>

            {/* Unauthorized Alert if signed in with wrong account */}
            {isExplicitlyUnauthorizedUser && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Access Denied: Account Unauthorized</p>
                    <p className="text-[11px] text-rose-300/90 mt-0.5">
                      The account <code className="font-mono text-rose-200">{user.email}</code> is not listed in the administrator directory.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSignOutAndRetry}
                  disabled={authenticating}
                  className="w-full mt-2 py-1.5 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-rose-500/40 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out and switch Google account</span>
                </button>
              </div>
            )}

            {/* Error Message */}
            {authError && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300 text-center font-mono">
                {authError}
              </div>
            )}

            {/* Google Login Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleAdminGoogleSignIn}
                disabled={authenticating || authLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{authenticating ? 'Authenticating with Google...' : 'Sign in with Google'}</span>
              </button>

              {/* Direct Administrator Login Shortcut */}
              <button
                onClick={() => handleQuickAdminLogin('sachin.itig@gmail.com')}
                disabled={authenticating || authLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                <UserCheck className="w-4 h-4" />
                <span>Direct Admin Login (sachin.itig@gmail.com)</span>
              </button>
            </div>

            {/* Security Architecture Notes */}
            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Direct Admin OAuth Enabled</span>
              </div>
              <p className="text-slate-500 text-[10px]">
                Cloudflare Zero Trust gating is bypassed. When an authorized administrator logs in via Google, they are directly admitted to the central command dashboard.
              </p>
            </div>

          </div>
        </main>

        {/* Minimal Footer */}
        <footer className="h-12 border-t border-slate-800 text-center flex items-center justify-center text-[11px] text-slate-500">
          <span>© {new Date().getFullYear()} Maths at Your Fingertips (mayf.co.in) · Administrator Access</span>
        </footer>
      </div>
    );
  }

  // Render authorized administration console with all 19 sections
  const renderCurrentSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboardSection onNavigateSection={handleSelectSection} />;
      case 'content':
        return <AdminContentSection />;
      case 'categories':
        return <AdminCategoriesSection />;
      case 'students':
        return <AdminStudentsSection />;
      case 'admins':
        return <AdminAdminsSection />;
      case 'ai-activity':
        return <AdminAiActivitySection />;
      case 'orders':
        return <AdminOrdersSection />;
      case 'annual-pass':
        return <AdminAnnualPassSection />;
      case 'coupons':
        return <AdminCouponsSection />;
      case 'notifications':
        return <AdminNotificationsSection />;
      case 'social':
        return <AdminSocialSection />;
      case 'ads':
        return <AdminAdsSection />;
      case 'layout':
        return <AdminLayoutSection />;
      case 'branding':
        return <AdminBrandingSection />;
      case 'seo':
        return <AdminSeoSection />;
      case 'payments':
        return <AdminPaymentsSection />;
      case 'import':
        return <AdminImportSection />;
      case 'analytics':
        return <AdminAnalyticsSection />;
      case 'settings':
        return <AdminSettingsSection />;
      default:
        return <AdminDashboardSection onNavigateSection={handleSelectSection} />;
    }
  };

  return (
    <>
      <SeoHead
        title="System Administration | Maths at Your Fingertips"
        description="Protected administration portal"
        noindex={true}
      />
      <AdminLayout currentSection={activeSection} onSelectSection={handleSelectSection}>
        {renderCurrentSection()}
      </AdminLayout>
    </>
  );
};
