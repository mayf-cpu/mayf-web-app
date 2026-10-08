/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense } from 'react';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { AuthProvider } from './context/AuthContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSpinner } from './components/ui/LoadingState';

// Page imports
import { HomePage } from './pages/HomePage';
import { StudyMaterialPage } from './pages/StudyMaterialPage';
import { StudyChapterPage } from './pages/StudyChapterPage';
import { FormulaDeckPage } from './pages/FormulaDeckPage';
import { FormulaDetailPage } from './pages/FormulaDetailPage';
import { CoursesCatalogPage } from './pages/CoursesCatalogPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { AiTeacherPage } from './pages/AiTeacherPage';
import { AnnualPassPage } from './pages/AnnualPassPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardOverviewPage } from './pages/DashboardOverviewPage';
import { DashboardPurchasesPage } from './pages/DashboardPurchasesPage';
import { DashboardDownloadsPage } from './pages/DashboardDownloadsPage';
import { DashboardSavedPage } from './pages/DashboardSavedPage';
import { DashboardAiHistoryPage } from './pages/DashboardAiHistoryPage';
import { SearchPage } from './pages/SearchPage';
import { AdminPortalPage } from './pages/AdminPortalPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { RefundPolicyPage } from './pages/RefundPolicyPage';
import { NotFoundPage } from './pages/NotFoundPage';

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
          <NavigationProvider>
            <Suspense fallback={<LoadingSpinner message="Loading Maths at Your Fingertips..." />}>
              <AppRouter />
            </Suspense>
          </NavigationProvider>
        </SiteSettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
