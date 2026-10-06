/**
 * Route definitions and parameter types for Maths at Your Fingertips (MAYF).
 */

export type AppRoute =
  | '/'
  | '/study-material'
  | '/study/:slug'
  | '/formula-deck'
  | '/formula/:slug'
  | '/ai-teacher'
  | '/annual-pass'
  | '/checkout'
  | '/login'
  | '/dashboard'
  | '/dashboard/purchases'
  | '/dashboard/downloads'
  | '/dashboard/saved'
  | '/dashboard/ai-history'
  | '/search'
  | '/privacy'
  | '/terms'
  | '/refund-policy';

export interface RouteMatch {
  route: AppRoute | 'not-found';
  path: string;
  params: Record<string, string>;
  searchParams: URLSearchParams;
}

export function matchCurrentPath(pathname: string): RouteMatch {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');

  // Exact static routes
  const staticRoutes: AppRoute[] = [
    '/',
    '/study-material',
    '/formula-deck',
    '/ai-teacher',
    '/annual-pass',
    '/checkout',
    '/login',
    '/dashboard',
    '/dashboard/purchases',
    '/dashboard/downloads',
    '/dashboard/saved',
    '/dashboard/ai-history',
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

  return {
    route: 'not-found',
    path: cleanPath,
    params: {},
    searchParams,
  };
}
