import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { AdminSection, getAdminUrl, isAuthorizedAdminEmail } from '../config/adminConfig';
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

import { Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SeoHead } from '../components/common/SeoHead';
import { LoadingSpinner } from '../components/ui/LoadingState';

export const AdminPortalPage: React.FC = () => {
  const { firebaseUser, user, entitlements, signInWithGoogle, logout, loading: authLoading } = useAuth();
  const { currentRoute, navigate } = useNavigation();
  const [authenticating, setAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Determine which section is currently active
  const activeSection: AdminSection = (currentRoute.params?.section as AdminSection) || 'dashboard';

  // Extract email of authenticated user
  const userEmail = (firebaseUser?.email || (firebaseUser ? user?.email : '') || '').toLowerCase();

  // Check admin authorization via Firebase custom claims or assigned admin email list
  const isAssignedAdmin =
    Boolean(entitlements.isAdmin || entitlements.isSuperAdmin) ||
    isAuthorizedAdminEmail(userEmail);

  // Handle section navigation
  const handleSelectSection = (section: AdminSection) => {
    navigate(getAdminUrl(section));
  };

  const handleAdminGoogleSignIn = async () => {
    setAuthenticating(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication could not be completed.');
    } finally {
      setAuthenticating(false);
    }
  };

  // 1. Initial authentication loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7F9FB] flex items-center justify-center p-6">
        <LoadingSpinner message="Verifying administrative access..." />
      </div>
    );
  }

  // 2. Secret Path Entry: Direct Google Sign-In for Unauthenticated Users
  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-[#F7F9FB] flex flex-col justify-between text-[#191C1E] antialiased">
        <SeoHead
          title="Administrative Gateway"
          description="Protected administration portal"
          noindex={true}
        />
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur px-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Maths at Your Fingertips</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-xs font-mono text-slate-500">Administrator Access</span>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h1 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight pt-2">
                Administrator Portal
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Sign in with your authorized administrator Google account to access management tools.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <button
                type="button"
                onClick={handleAdminGoogleSignIn}
                disabled={authenticating}
                className="w-full py-3.5 px-4 flex items-center justify-center gap-3 bg-white border border-slate-300 rounded-xl font-semibold text-sm text-slate-800 hover:bg-slate-50 active:bg-slate-100 transition-all shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{authenticating ? 'Signing in with Google...' : 'Sign in with Google'}</span>
              </button>

              {authError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{authError}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400">
                Restricted access: Only pre-assigned administrator accounts are allowed. Non-admin accounts will receive a 404 error.
              </p>
            </div>
          </div>
        </main>

        <footer className="h-12 border-t border-slate-200 text-center flex items-center justify-center text-[11px] text-slate-400">
          <span>© {new Date().getFullYear()} Maths at Your Fingertips (mayf.co.in)</span>
        </footer>
      </div>
    );
  }

  // 3. User is authenticated with Google BUT NOT an assigned administrator: Throw 404 Error!
  if (!isAssignedAdmin) {
    return (
      <div className="min-h-screen bg-[#F7F9FB] flex flex-col justify-between text-[#191C1E] antialiased">
        <SeoHead
          title="Page Not Found (404)"
          description="The requested page could not be found."
          noindex={true}
        />
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur px-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Maths at Your Fingertips</span>
          </button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] font-heading font-extrabold text-4xl flex items-center justify-center mx-auto shadow-xs">
            404
          </div>

          <div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F172A] tracking-tight">
              Page Not Found
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-2 leading-relaxed">
              The path <code className="font-mono text-[#0037B0] bg-[#F1F5F9] px-1.5 py-0.5 rounded">{currentRoute.path}</code> does not exist or has been moved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
            <Button
              size="md"
              variant="primary"
              onClick={() => navigate('/')}
              className="gap-2 w-full sm:w-auto"
            >
              <span>Return to Home</span>
            </Button>
            <Button
              size="md"
              variant="outline"
              onClick={() => navigate('/search')}
              className="gap-2 w-full sm:w-auto"
            >
              <span>Search Syllabus</span>
            </Button>
          </div>

          {/* Switch Account Option */}
          <div className="pt-6 border-t border-slate-200/80 w-full text-center">
            <p className="text-[11px] text-slate-400">
              Signed in as <span className="font-mono font-medium text-slate-600">{userEmail}</span>
            </p>
            <button
              onClick={() => logout()}
              className="mt-1.5 text-[11px] text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer"
            >
              Not your administrator account? Switch Account
            </button>
          </div>
        </main>

        <footer className="h-12 border-t border-slate-200 text-center flex items-center justify-center text-[11px] text-slate-400">
          <span>© {new Date().getFullYear()} mayf.co.in</span>
        </footer>
      </div>
    );
  }

  // 4. Authorized Administrator: Render administration console with all 19 sections
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
        title="System Administration"
        description="Protected administration portal"
        noindex={true}
      />
      <AdminLayout currentSection={activeSection} onSelectSection={handleSelectSection}>
        {renderCurrentSection()}
      </AdminLayout>
    </>
  );
};
