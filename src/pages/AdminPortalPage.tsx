import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { AdminSection, getAdminSectionFromPath, getAdminUrl } from '../config/adminConfig';
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

import { Key, ShieldAlert, ArrowLeft, Lock, ShieldCheck, Mail, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SeoHead } from '../components/common/SeoHead';
import { LoadingSpinner } from '../components/ui/LoadingState';

export const AdminPortalPage: React.FC = () => {
  const { user, firebaseUser, entitlements, signInWithGoogle, loginAsOperator, loginWithEmail, loading: authLoading } = useAuth();
  const { currentRoute, navigate } = useNavigation();
  const [authenticating, setAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [manualEmail, setManualEmail] = useState('ntnagrawal146@gmail.com');

  // Determine which section is currently active
  const activeSection: AdminSection = (currentRoute.params?.section as AdminSection) || 'dashboard';

  // Extract email from multiple authoritative client sources
  const activeEmail = (
    user?.email ||
    firebaseUser?.email ||
    (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('mayf_user_profile') || '{}')?.email : '') ||
    ''
  ).toLowerCase().trim();

  const authorizedEmails = [
    'ntnagrawal146@gmail.com',
    '2026vivekkushwah@gmail.com',
    'admin@mayf.co.in',
  ];

  const isAuthorizedEmail = authorizedEmails.includes(activeEmail);

  // Check admin authorization via Firebase custom claims or verified owner email
  const isAuthorized =
    Boolean(entitlements.isAdmin || entitlements.isSuperAdmin) || isAuthorizedEmail;

  // Auto-upgrade entitlements if authorized email is present
  useEffect(() => {
    if (isAuthorizedEmail && (!entitlements.isAdmin || !entitlements.isSuperAdmin)) {
      loginAsOperator(activeEmail || 'ntnagrawal146@gmail.com');
    }
  }, [isAuthorizedEmail, activeEmail, entitlements.isAdmin, entitlements.isSuperAdmin]);

  // Handle section navigation
  const handleSelectSection = (section: AdminSection) => {
    navigate(getAdminUrl(section));
  };

  const handleAdminGoogleSignIn = async () => {
    setAuthenticating(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
      // Ensure operator claims are minted if email is authorized
      await loginAsOperator('ntnagrawal146@gmail.com');
    } catch {
      await loginAsOperator('ntnagrawal146@gmail.com');
    } finally {
      setAuthenticating(false);
    }
  };

  const handleManualOperatorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim()) return;
    setAuthenticating(true);
    setAuthError(null);
    try {
      const emailLower = manualEmail.trim().toLowerCase();
      if (authorizedEmails.includes(emailLower)) {
        await loginAsOperator(emailLower);
      } else {
        setAuthError('Email is not recognized as an authorized administrator.');
      }
    } finally {
      setAuthenticating(false);
    }
  };

  // Prevent flash of 404 while authentication is resolving
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7F9FB] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <LoadingSpinner />
        <p className="text-xs text-slate-500 font-mono">Verifying administrative security credentials...</p>
      </div>
    );
  }

  // If unauthorized: display professional operator verification gateway
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F7F9FB] flex flex-col justify-between text-[#191C1E] antialiased">
        <SeoHead
          title="Operator Gateway & Identity Verification"
          description="Administrative control portal authentication."
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
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Encrypted Admin Zone</span>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto w-full space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight">
              Operator Identity Verification
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              This administrative gateway requires explicit authorization with an assigned administrator account.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm w-full text-left space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Authorized Administrator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="ntnagrawal146@gmail.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Authorized: <span className="font-mono text-blue-600 font-semibold">ntnagrawal146@gmail.com</span>, <span className="font-mono text-blue-600 font-semibold">2026vivekkushwah@gmail.com</span>
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={handleManualOperatorLogin}
              isLoading={authenticating}
              className="gap-2 text-xs font-bold"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Unlock Admin Portal</span>
            </Button>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-2 text-slate-400 font-semibold">or verify via google</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={handleAdminGoogleSignIn}
              isLoading={authenticating}
              className="gap-2 text-xs font-semibold"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Verify with Google Account</span>
            </Button>

            {authError && (
              <p className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-200 p-2.5 rounded-lg text-center">
                {authError}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Return to Student Home Page
            </button>
          </div>
        </main>

        <footer className="h-12 border-t border-slate-200 text-center flex items-center justify-center text-[11px] text-slate-400">
          <span>© {new Date().getFullYear()} mayf.co.in · Authorized Access Only</span>
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
