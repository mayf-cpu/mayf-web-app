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

import { Key, ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SeoHead } from '../components/common/SeoHead';

export const AdminPortalPage: React.FC = () => {
  const { user, entitlements, signInWithGoogle, loading: authLoading } = useAuth();
  const { currentRoute, navigate } = useNavigation();
  const [authenticating, setAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Determine which section is currently active
  const activeSection: AdminSection = (currentRoute.params?.section as AdminSection) || 'dashboard';

  // Check admin authorization via Firebase custom claims or verified owner email
  const isAuthorized =
    Boolean(entitlements.isAdmin || entitlements.isSuperAdmin) ||
    Boolean(user?.email && user.email.toLowerCase() === '2026vivekkushwah@gmail.com');

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
      setAuthError('Authentication could not be completed.');
    } finally {
      setAuthenticating(false);
    }
  };

  // If unauthorized: return standard 404 without leaking administrative details
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F7F9FB] flex flex-col justify-between text-[#191C1E] antialiased">
        <SeoHead
          title="Not Found"
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

        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-mono text-xl font-bold">
            404
          </div>

          <div className="space-y-2">
            <h1 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight">
              Page Not Found
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              The page you are looking for does not exist, has been moved, or requires explicit authorization.
            </p>
          </div>

          <div className="pt-4 flex flex-col items-center gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="w-full text-xs font-bold"
            >
              Go to Home Page
            </Button>

            {/* Operator Verification Trigger (Firebase Google Auth) */}
            <div className="pt-6 border-t border-slate-200/80 w-full text-center">
              <button
                onClick={handleAdminGoogleSignIn}
                disabled={authenticating}
                className="text-[11px] text-slate-400 hover:text-slate-700 underline font-mono cursor-pointer transition-colors"
                title="Authenticate with authorized Google administrator account"
              >
                {authenticating ? 'Verifying credentials...' : 'Operator Identity Verification'}
              </button>
            </div>

            {authError && (
              <p className="text-[11px] text-rose-600 font-mono mt-1">{authError}</p>
            )}
          </div>
        </main>

        <footer className="h-12 border-t border-slate-200 text-center flex items-center justify-center text-[11px] text-slate-400">
          <span>© {new Date().getFullYear()} mayf.co.in</span>
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
