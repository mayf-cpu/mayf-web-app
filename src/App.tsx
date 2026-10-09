/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { AuthProvider } from './context/AuthContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import { AdSenseProvider } from './context/AdSenseContext';
import { BroadcastProvider } from './context/BroadcastContext';
import { AdConsentBanner } from './components/adsense/AdConsentBanner';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSpinner } from './components/ui/LoadingState';

// Critical LCP path: Keep HomePage in primary bundle for sub-second FCP/LCP
import { HomePage } from './pages/HomePage';

// Route-level code splitting with dynamic imports for non-critical paths
const StudyMaterialPage = lazy(() => import('./pages/StudyMaterialPage').then((m) => ({ default: m.StudyMaterialPage })));
const StudyChapterPage = lazy(() => import('./pages/StudyChapterPage').then((m) => ({ default: m.StudyChapterPage })));
const FormulaDeckPage = lazy(() => import('./pages/FormulaDeckPage').then((m) => ({ default: m.FormulaDeckPage })));
const FormulaDetailPage = lazy(() => import('./pages/FormulaDetailPage').then((m) => ({ default: m.FormulaDetailPage })));
const CoursesCatalogPage = lazy(() => import('./pages/CoursesCatalogPage').then((m) => ({ default: m.CoursesCatalogPage })));
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage').then((m) => ({ default: m.CourseDetailPage })));
const AiTeacherPage = lazy(() => import('./pages/AiTeacherPage').then((m) => ({ default: m.AiTeacherPage })));
const AnnualPassPage = lazy(() => import('./pages/AnnualPassPage').then((m) => ({ default: m.AnnualPassPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardOverviewPage = lazy(() => import('./pages/DashboardOverviewPage').then((m) => ({ default: m.DashboardOverviewPage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then((m) => ({ default: m.SearchPage })));
const AdminPortalPage = lazy(() => import('./pages/AdminPortalPage').then((m) => ({ default: m.AdminPortalPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then((m) => ({ default: m.TermsPage })));
const RefundPolicyPage = lazy(() => import('./pages/RefundPolicyPage').then((m) => ({ default: m.RefundPolicyPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

function AppRouter() {
  const { currentRoute } = useNavigation();

  switch (currentRoute.route) {
    case '/':
      return <HomePage />;
    case '/study-material':
      return <StudyMaterialPage />;
    case '/study/:slug':
      return <StudyChapterPage />;
    case '/formula-deck':
      return <FormulaDeckPage />;
    case '/formula/:slug':
      return <FormulaDetailPage />;
    case '/courses':
      return <CoursesCatalogPage />;
    case '/course/:slug':
      return <CourseDetailPage />;
    case '/ai-teacher':
      return <AiTeacherPage />;
    case '/annual-pass':
      return <AnnualPassPage />;
    case '/checkout':
      return <CheckoutPage />;
    case '/login':
      return <LoginPage />;
    case '/dashboard':
    case '/dashboard/profile':
    case '/dashboard/membership':
    case '/dashboard/annual-pass':
    case '/dashboard/activity':
    case '/dashboard/recently-viewed':
    case '/dashboard/saved':
    case '/dashboard/purchases':
    case '/dashboard/downloads':
    case '/dashboard/ai-history':
    case '/dashboard/courses':
    case '/dashboard/notifications':
      return <DashboardOverviewPage />;
    case '/search':
      return <SearchPage />;
    case '/admin-portal':
      return <AdminPortalPage />;
    case '/privacy':
      return <PrivacyPage />;
    case '/terms':
      return <TermsPage />;
    case '/refund-policy':
      return <RefundPolicyPage />;
    case 'not-found':
    default:
      return <NotFoundPage />;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SiteSettingsProvider>
          <AdSenseProvider>
            <BroadcastProvider>
              <NavigationProvider>
                <Suspense fallback={<LoadingSpinner message="Loading Maths at Your Fingertips..." />}>
                  <AppRouter />
                  <AdConsentBanner />
                  <OnboardingWizard />
                </Suspense>
              </NavigationProvider>
            </BroadcastProvider>
          </AdSenseProvider>
        </SiteSettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
