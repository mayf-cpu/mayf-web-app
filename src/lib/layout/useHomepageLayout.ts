/**
 * Client-side React hook to fetch and cache public Homepage Block Layout.
 * 
 * Features:
 * - Instant rendering from in-memory / sessionStorage cache
 * - Background stale-while-revalidate (SWR) refresh
 * - Fallback to canonical DEFAULT_HOMEPAGE_BLOCKS if offline
 */

import { useState, useEffect } from 'react';
import { HomepageBlock, DEFAULT_HOMEPAGE_BLOCKS } from './homepageLayoutTypes';

interface HomepageLayoutState {
  blocks: HomepageBlock[];
  loading: boolean;
  error: string | null;
  updatedAt: string;
}

const CACHE_KEY = 'mayf_public_homepage_layout_v1';
const CACHE_TIME_KEY = 'mayf_public_homepage_layout_time_v1';
const CLIENT_CACHE_TTL_MS = 1000 * 60 * 3; // 3 minutes

export function useHomepageLayout(): HomepageLayoutState {
  const [state, setState] = useState<HomepageLayoutState>(() => {
    // 1. Try to load from sessionStorage cache immediately for 0ms layout shift
    if (typeof window !== 'undefined') {
      try {
        const cachedRaw = sessionStorage.getItem(CACHE_KEY);
        const cachedTime = sessionStorage.getItem(CACHE_TIME_KEY);
        if (cachedRaw && cachedTime) {
          const parsed = JSON.parse(cachedRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return {
              blocks: parsed,
              loading: false,
              error: null,
              updatedAt: new Date(Number(cachedTime)).toISOString(),
            };
          }
        }
      } catch {
        // ignore cache read failure
      }
    }

    // 2. Default fallback
    return {
      blocks: DEFAULT_HOMEPAGE_BLOCKS.filter((b) => b.enabled),
      loading: true,
      error: null,
      updatedAt: '2026-04-01T00:00:00Z',
    };
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchLayout() {
      try {
        const res = await fetch('/api/homepage/layout');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (isMounted && data.success && Array.isArray(data.blocks)) {
          setState({
            blocks: data.blocks,
            loading: false,
            error: null,
            updatedAt: data.updatedAt || new Date().toISOString(),
          });

          // Save to client cache
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(data.blocks));
            sessionStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
          } catch {
            // storage quota or private mode
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: err?.message || 'Failed to load live layout',
          }));
        }
      }
    }

    fetchLayout();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
