import React, { createContext, useContext, useState, useEffect } from 'react';
import { SiteSettings, DEFAULT_SITE_SETTINGS } from '../lib/settings/siteSettingsTypes';

interface SiteSettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: DEFAULT_SITE_SETTINGS,
  loading: false,
  refreshSettings: async () => {},
});

const CACHE_KEY = 'mayf_site_settings_v1';

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.brand) {
            return parsed;
          }
        }
      } catch {
        // ignore
      }
    }
    return DEFAULT_SITE_SETTINGS;
  });

  const [loading, setLoading] = useState<boolean>(true);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/site-settings');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(data.settings));
          } catch {
            // ignore
          }
        }
      }
    } catch (e) {
      console.warn('[SiteSettings] Failed to fetch settings, using cached/defaults:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Dynamically update document colors & favicon when settings change
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (settings.colors.primaryColor) {
        root.style.setProperty('--color-primary', settings.colors.primaryColor);
      }
      if (settings.colors.secondaryColor) {
        root.style.setProperty('--color-secondary', settings.colors.secondaryColor);
      }
      if (settings.colors.accentColor) {
        root.style.setProperty('--color-accent', settings.colors.accentColor);
      }

      // Update favicon if provided
      if (settings.brand.faviconUrl) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = settings.brand.faviconUrl;
      }
    }
  }, [settings]);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export function useSiteSettings(): SiteSettingsContextType {
  return useContext(SiteSettingsContext);
}
