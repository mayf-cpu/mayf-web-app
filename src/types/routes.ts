import { isAdminPath, getAdminSectionFromPath } from '../config/adminConfig';

/**
 * Route definitions and parameter types for Maths at Your Fingertips (MAYF).
 */

export type AppRoute =
  | '/'
  | '/study-material'
  | '/study/:slug'
  | '/formula-deck'
  | '/formula/:slug'
  | '/courses'
  | '/course/:slug'
  | '/ai-teacher'
  | '/annual-pass'
  | '/checkout'
  | '/login'
  | '/dashboard'
  | '/dashboard/profile'
  | '/dashboard/membership'
  | '/dashboard/annual-pass'
  | '/dashboard/activity'
  | '/dashboard/recently-viewed'
  | '/dashboard/saved'
  | '/dashboard/purchases'
  | '/dashboard/downloads'
  | '/dashboard/ai-history'
  | '/dashboard/courses'
  | '/dashboard/notifications'
  | '/search'
  | '/privacy'
  | '/terms'
  | '/refund-policy'
  | '/admin-portal';

export interface RouteMatch {
  route: AppRoute | 'not-found';
  path: string;
  params: Record<string, string>;
  searchParams: URLSearchParams;
}

export function matchCurrentPath(pathname: string): RouteMatch {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');

  // Secret Admin Portal Entry Path (Configured via ADMIN_ENTRY_PATH env var)
  if (isAdminPath(cleanPath)) {
    const section = getAdminSectionFromPath(cleanPath);
    return {
      route: '/admin-portal',
      path: cleanPath,
      params: { section },
      searchParams,
    };
  }

  // Exact static routes (Public routes ONLY - no admin paths)
  const staticRoutes: AppRoute[] = [
    '/',
    '/study-material',
    '/formula-deck',
    '/courses',
    '/ai-teacher',
    '/annual-pass',
    '/checkout',
    '/login',
    '/dashboard',
    '/dashboard/profile',
    '/dashboard/membership',
    '/dashboard/annual-pass',
    '/dashboard/activity',
    '/dashboard/recently-viewed',
    '/dashboard/saved',
    '/dashboard/purchases',
    '/dashboard/downloads',
    '/dashboard/ai-history',
    '/dashboard/courses',
    '/dashboard/notifications',
    '/search',
    '/privacy',
    '/terms',
    '/refund-policy',
  ];

  if (staticRoutes.includes(cleanPath as AppRoute)) {
    return {
      route: cleanPath as AppRoute,
      path: cleanPath,
      params: {},
      searchParams,
    };
  }

  // Dynamic /study/:slug
  const studyMatch = cleanPath.match(/^\/study\/([^/]+)$/);
  if (studyMatch) {
    return {
      route: '/study/:slug',
      path: cleanPath,
      params: { slug: decodeURIComponent(studyMatch[1]) },
      searchParams,
    };
  }

  // Dynamic /formula/:slug
  const formulaMatch = cleanPath.match(/^\/formula\/([^/]+)$/);
  if (formulaMatch) {
    return {
      route: '/formula/:slug',
      path: cleanPath,
      params: { slug: decodeURIComponent(formulaMatch[1]) },
      searchParams,
    };
  }

  // Dynamic /course/:slug
  const courseMatch = cleanPath.match(/^\/course\/([^/]+)$/);
  if (courseMatch) {
    return {
      route: '/course/:slug',
      path: cleanPath,
      params: { slug: decodeURIComponent(courseMatch[1]) },
      searchParams,
    };
  }

  return {
    route: 'not-found',
    path: cleanPath,
    params: {},
    searchParams,
  };
}
