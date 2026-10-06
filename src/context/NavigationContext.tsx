import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { RouteMatch, matchCurrentPath } from '../types/routes';

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
 * Reusable accessible Link component that triggers client-side routing
 */
export function Link({
  href,
  children,
  className = '',
  title,
  onClick,
  'aria-label': ariaLabel,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  'aria-label'?: string;
}) {
  const { navigate } = useNavigation();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }
    if (!e.defaultPrevented && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && href.startsWith('/')) {
      e.preventDefault();
      navigate(href);
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      title={title}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
}
