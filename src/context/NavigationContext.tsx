import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { RouteMatch, matchCurrentPath } from '../types/routes';
import { trackPageView } from '../lib/analytics/analyticsService';

interface NavigationContextType {
  currentRoute: RouteMatch;
  navigate: (to: string, options?: { replace?: boolean }) => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentRoute, setCurrentRoute] = useState<RouteMatch>(() => {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
    return matchCurrentPath(pathname);
  });

  const updatePath = useCallback((pathname: string) => {
    setCurrentRoute(matchCurrentPath(pathname));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    if (typeof window === 'undefined') return;

    if (options?.replace) {
      window.history.replaceState({}, '', to);
    } else {
      window.history.pushState({}, '', to);
    }
    updatePath(to.split('?')[0]);
  }, [updatePath]);

  const goBack = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      updatePath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [updatePath]);

  // Authoritative GA4 / Firebase Analytics page_view tracking
  useEffect(() => {
    const timer = setTimeout(() => {
      const pageTitle = typeof document !== 'undefined' ? document.title : currentRoute.path;
      trackPageView(pageTitle, currentRoute.path);
    }, 120);
    return () => clearTimeout(timer);
  }, [currentRoute.path]);

  return (
    <NavigationContext.Provider value={{ currentRoute, navigate, goBack }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

/**
 * Selective route prefetcher for near-zero navigation latency
 */
export function prefetchRoute(to: string) {
  if (typeof window === 'undefined' || !to.startsWith('/')) return;
  const path = to.split('?')[0];

  try {
    if (path === '/study-material') {
      import('../pages/StudyMaterialPage');
    } else if (path.startsWith('/study/')) {
      import('../pages/StudyChapterPage');
    } else if (path === '/formula-deck') {
      import('../pages/FormulaDeckPage');
    } else if (path.startsWith('/formula/')) {
      import('../pages/FormulaDetailPage');
    } else if (path === '/courses') {
      import('../pages/CoursesCatalogPage');
    } else if (path.startsWith('/course/')) {
      import('../pages/CourseDetailPage');
    } else if (path === '/ai-teacher') {
      import('../pages/AiTeacherPage');
    } else if (path === '/annual-pass') {
      import('../pages/AnnualPassPage');
    } else if (path === '/checkout') {
      import('../pages/CheckoutPage');
    } else if (path === '/search') {
      import('../pages/SearchPage');
    } else if (path.startsWith('/dashboard')) {
      import('../pages/DashboardOverviewPage');
    }
  } catch {
    // ignore prefetch errors
  }
}

/**
 * Reusable accessible Link component that triggers client-side routing
 * with intelligent prefetch and keyboard accessibility.
 */
export function Link({
  href,
  children,
  className = '',
  title,
  onClick,
  target,
  rel,
  openInNewTab,
  'aria-label': ariaLabel,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  target?: string;
  rel?: string;
  openInNewTab?: boolean;
  'aria-label'?: string;
}) {
  const { navigate } = useNavigation();

  const isBlank = target === '_blank' || openInNewTab === true;
  const computedTarget = isBlank ? '_blank' : target;
  const computedRel = isBlank ? (rel || 'noopener noreferrer') : rel;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }
    // Only perform SPA routing if NOT opening in a new tab and no modifier keys pressed
    if (
      !isBlank &&
      !e.defaultPrevented &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.shiftKey &&
      !e.altKey &&
      href.startsWith('/')
    ) {
      e.preventDefault();
      navigate(href);
    }
  };

  const handleMouseEnter = () => {
    if (!isBlank && href.startsWith('/')) {
      prefetchRoute(href);
    }
  };

  return (
    <a
      href={href}
      target={computedTarget}
      rel={computedRel}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleMouseEnter}
      className={className}
      title={title}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
}
