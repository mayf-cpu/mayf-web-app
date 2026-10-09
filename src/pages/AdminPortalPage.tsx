import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { AdminSection, getAdminUrl } from '../config/adminConfig';
import { AdminLayout } from '../components/admin/AdminLayout';
import { adminService } from '../services/adminService';

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

import { ShieldAlert, ArrowLeft, Lock, ShieldCheck, LogOut, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SeoHead } from '../components/common/SeoHead';
import { LoadingSpinner } from '../components/ui/LoadingState';

export const AdminPortalPage: React.FC = () => {
  const { user, firebaseUser, signInWithGoogle, logout, loading: authLoading } = useAuth();
  const { currentRoute, navigate } = useNavigation();

  const [verifyingServer, setVerifyingServer] = useState(false);
  const [serverAuthorized, setServerAuthorized] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);

  // Determine which section is currently active
  const activeSection: AdminSection = (currentRoute.params?.section as AdminSection) || 'dashboard';

  // Server-side verification on auth state change
  useEffect(() => {
    let isMounted = true;

    async function checkServerAuthorization() {
      const isMockStudent = !firebaseUser && (!user || user.uid === 'mayf-student-1001' || user.email === 'arjun.sharma@mayf.co.in');
      if (isMockStudent) {
        setServerAuthorized(null);
        setVerifyingServer(false);
        return;
      }

      setVerifyingServer(true);
      setAuthError(null);

      try {
        const result = await adminService.verifyAdminAccess();
        if (isMounted) {
          if (result.authorized) {
            setServerAuthorized(true);
          } else {
            setServerAuthorized(false);
            setAuthError(result.error || 'This user does not possess verified administrator custom claims.');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setServerAuthorized(false);
          setAuthError(err?.message || 'Failed to verify administrative authorization with server.');
        }
      } finally {
        if (isMounted) {
          setVerifyingServer(false);
        }
      }
    }

    if (!authLoading) {
      checkServerAuthorization();
    }

    return () => {
      isMounted = false;
    };
  }, [user, firebaseUser, authLoading]);

  // Handle section navigation
  const handleSelectSection = (section: AdminSection) => {
    navigate(getAdminUrl(section));
  };

  // Google Sign-In with Firebase Auth
  const handleAdminGoogleSignIn = async () => {
    setAuthenticating(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
      // Server-side verification will immediately trigger via the useEffect above
    } catch (err: any) {
      setAuthError(err?.message || 'Google authentication could not be completed.');
    } finally {
      setAuthenticating(false);
    }
  };

  // Sign out & switch account
  const handleSwitchAccount = async () => {
    setAuthenticating(true);
    try {
      await logout();
      setServerAuthorized(null);
      setAuthError(null);
    } finally {
      setAuthenticating(false);
    }
  };

  // 1. Loading state while Firebase auth or server ID token verification resolves
  if (authLoading || verifyingServer) {
    return (
      <div className="min-h-screen bg-[#F7F9FB] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <LoadingSpinner />
        <p className="text-xs text-slate-500 font-mono">
          {authLoading ? 'Restoring Firebase session...' : 'Verifying ID token and custom claims with server...'}
        </p>
      </div>
    );
  }

  // 2. Unauthenticated state: User must sign in with Google via Firebase Auth
  const isMockStudentUser = !firebaseUser && (!user || user.uid === 'mayf-student-1001' || user.email === 'arjun.sharma@mayf.co.in');
  if (isMockStudentUser) {
    return (
      <div className="min-h-screen bg-[#F7F9FB] flex flex-col justify-between text-[#191C1E] antialiased">
        <SeoHead
          title="Administrator Authentication Required"
          description="Protected administrative zone"
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
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight">
              Administrator Authentication
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Please sign in with your authorized administrator Google account to access central administration.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm w-full text-left space-y-4">
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
              <span className="font-bold block mb-0.5">Strict Access Enforcement:</span>
              A student or non-admin account cannot access this console. Knowing this URL alone does not grant access; every API request is verified server-side.
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleAdminGoogleSignIn}
              isLoading={authenticating}
              className="gap-2.5 text-xs font-bold py-3"
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
              <span>Sign in with Google Account</span>
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
          <span>© {new Date().getFullYear()} mayf.co.in · Authorized Administrator Access Only</span>
        </footer>
      </div>
    );
  }

  // 3. Authenticated but Unauthorized state (e.g. Student account)
  // Server-side verification returned 403 Forbidden!
  if (serverAuthorized === false) {
    const currentEmail = user?.email || firebaseUser?.email || 'Unknown account';

    return (
      <div className="min-h-screen bg-[#F7F9FB] flex flex-col justify-between text-[#191C1E] antialiased">
        <SeoHead
          title="Access Denied · Administrator Privileges Required"
          description="Unauthorized access rejected."
          noindex={true}
        />

        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur px-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Student Dashboard</span>
          </button>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>403 Forbidden</span>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto w-full space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight">
              Access Denied
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              Administrator privileges required. Knowing this secret URL does not grant access to student accounts.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm w-full text-left space-y-4">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Current Authenticated Account
              </span>
              <p className="font-mono text-xs font-bold text-slate-800 break-all">
                {currentEmail}
              </p>
              <p className="text-[11px] text-rose-600 font-medium pt-1">
                Role: <span className="font-mono uppercase font-bold">student</span> (No admin/superAdmin claims)
              </p>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Every administrative API endpoint validates cryptographic ID token claims independently on the server. If you are an authorized administrator, please sign out and sign in using your designated administrator Google account.
            </p>

            <div className="space-y-2 pt-1">
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={handleSwitchAccount}
                isLoading={authenticating}
                className="gap-2 text-xs font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out & Switch Account</span>
              </Button>

              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={() => navigate('/dashboard')}
                className="gap-2 text-xs font-semibold"
              >
                <span>Go to Student Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
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
          <span>© {new Date().getFullYear()} mayf.co.in · Access Denied for Non-Admin Accounts</span>
        </footer>
      </div>
    );
  }

  // 4. Access Granted: Verified Administrator with valid server-verified claims
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
