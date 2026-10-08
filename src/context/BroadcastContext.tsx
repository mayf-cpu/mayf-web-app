import React, { createContext, useContext, useState, useEffect } from 'react';
import { BroadcastItem, BroadcastCategory } from '../lib/broadcasts/broadcastTypes';
import { useAuth } from './AuthContext';

interface BroadcastContextType {
  activeBroadcasts: BroadcastItem[];
  siteAnnouncements: BroadcastItem[];
  maintenanceMessages: BroadcastItem[];
  dashboardNotifications: BroadcastItem[];
  promotionalNotifications: BroadcastItem[];
  unreadDashboardCount: number;
  dismissBroadcast: (id: string) => void;
  isDismissed: (id: string) => boolean;
  refreshBroadcasts: () => Promise<void>;
  loading: boolean;
}

const BroadcastContext = createContext<BroadcastContextType>({
  activeBroadcasts: [],
  siteAnnouncements: [],
  maintenanceMessages: [],
  dashboardNotifications: [],
  promotionalNotifications: [],
  unreadDashboardCount: 0,
  dismissBroadcast: () => {},
  isDismissed: () => false,
  refreshBroadcasts: async () => {},
  loading: false,
});

const DISMISSED_STORAGE_KEY = 'mayf_dismissed_broadcasts_v1';

export const BroadcastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, firebaseUser } = useAuth();
  const [activeBroadcasts, setActiveBroadcasts] = useState<BroadcastItem[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(DISMISSED_STORAGE_KEY);
        if (stored) {
          return new Set(JSON.parse(stored));
        }
      } catch {
        // ignore
      }
    }
    return new Set();
  });
  const [loading, setLoading] = useState(false);

  const fetchActiveBroadcasts = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          if (token) headers['Authorization'] = `Bearer ${token}`;
        } catch {
          // ignore
        }
      }

      const res = await fetch('/api/broadcasts/active', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
          setActiveBroadcasts(data.items);
        }
      }
    } catch (e) {
      console.warn('[BroadcastContext] Failed to fetch active broadcasts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveBroadcasts();
  }, [user]);

  const dismissBroadcast = (id: string) => {
    setDismissedIds((prev) => {
      const updated = new Set(prev);
      updated.add(id);
      try {
        localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(updated)));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const isDismissed = (id: string) => dismissedIds.has(id);

  // Derived filtered categories (only non-dismissed for prominent banners)
  const siteAnnouncements = activeBroadcasts.filter(
    (b) => b.category === 'site_announcement' && !isDismissed(b.id)
  );

  const maintenanceMessages = activeBroadcasts.filter(
    (b) => b.category === 'maintenance_message' && !isDismissed(b.id)
  );

  const promotionalNotifications = activeBroadcasts.filter(
    (b) => b.category === 'promotional_notification' && !isDismissed(b.id)
  );

  const dashboardNotifications = activeBroadcasts.filter(
    (b) => b.category === 'dashboard_notification'
  );

  const unreadDashboardCount = dashboardNotifications.filter((b) => !isDismissed(b.id)).length;

  return (
    <BroadcastContext.Provider
      value={{
        activeBroadcasts,
        siteAnnouncements,
        maintenanceMessages,
        dashboardNotifications,
        promotionalNotifications,
        unreadDashboardCount,
        dismissBroadcast,
        isDismissed,
        refreshBroadcasts: fetchActiveBroadcasts,
        loading,
      }}
    >
      {children}
    </BroadcastContext.Provider>
  );
};

export function useBroadcasts(): BroadcastContextType {
  return useContext(BroadcastContext);
}
