import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AdSenseSettings,
  DEFAULT_ADSENSE_SETTINGS,
  AdSensePageZone,
  PlacementConfig,
} from '../lib/adsense/adsenseTypes';

interface AdSenseContextType {
  config: AdSenseSettings;
  loading: boolean;
  consentAcknowledged: boolean;
  acknowledgeConsent: () => void;
  getPlacement: (zone: AdSensePageZone) => PlacementConfig | null;
  refreshConfig: () => Promise<void>;
  isProhibitedZone: (zoneCheck: {
    insideAiTeacherSteps?: boolean;
    overPurchaseControls?: boolean;
    overNavigation?: boolean;
    overForms?: boolean;
  }) => boolean;
}

const AdSenseContext = createContext<AdSenseContextType>({
  config: DEFAULT_ADSENSE_SETTINGS,
  loading: false,
  consentAcknowledged: false,
  acknowledgeConsent: () => {},
  getPlacement: () => null,
  refreshConfig: async () => {},
  isProhibitedZone: () => false,
});

const CONSENT_STORAGE_KEY = 'mayf_ad_privacy_consent_v1';
const CONFIG_CACHE_KEY = 'mayf_adsense_config_cache_v1';

export const AdSenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AdSenseSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(CONFIG_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.publisherId) return parsed;
        }
      } catch {
        // ignore
      }
    }
    return DEFAULT_ADSENSE_SETTINGS;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [consentAcknowledged, setConsentAcknowledged] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(CONSENT_STORAGE_KEY) === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/adsense/config');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.config) {
          setConfig(data.config);
          try {
            sessionStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(data.config));
          } catch {
            // ignore
          }
        }
      }
    } catch (e) {
      console.warn('[AdSense] Failed to fetch live ad config, using defaults:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const acknowledgeConsent = () => {
    setConsentAcknowledged(true);
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
  };

  const getPlacement = (zone: AdSensePageZone): PlacementConfig | null => {
    if (!config.adsenseEnabled) return null;
    const placement = config.placements[zone];
    if (!placement || !placement.enabled) return null;
    return placement;
  };

  /**
   * Strictly enforces prohibited zones:
   * 1. Inside individual AI Teacher solution steps
   * 2. Over purchase controls
   * 3. Over navigation
   * 4. Over forms
   */
  const isProhibitedZone = (zoneCheck: {
    insideAiTeacherSteps?: boolean;
    overPurchaseControls?: boolean;
    overNavigation?: boolean;
    overForms?: boolean;
  }): boolean => {
    return Boolean(
      zoneCheck.insideAiTeacherSteps ||
      zoneCheck.overPurchaseControls ||
      zoneCheck.overNavigation ||
      zoneCheck.overForms
    );
  };

  return (
    <AdSenseContext.Provider
      value={{
        config,
        loading,
        consentAcknowledged,
        acknowledgeConsent,
        getPlacement,
        refreshConfig: fetchConfig,
        isProhibitedZone,
      }}
    >
      {children}
    </AdSenseContext.Provider>
  );
};

export function useAdSense(): AdSenseContextType {
  return useContext(AdSenseContext);
}
