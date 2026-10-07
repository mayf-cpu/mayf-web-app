/**
 * Student Notifications Service with Real-Time Listener
 * Maths at Your Fingertips (mayf.co.in)
 *
 * Implements:
 * - Real-time snapshot listener on user's notifications (lightweight, single query limited to 20 docs)
 * - Clean unsubscribe to protect Firestore read quota
 * - Mark as read / mark all as read
 * - Sensible educational notifications for students
 */

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  setDoc,
  getDocs,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/client';
import { NotificationItem } from '../firebase/types';

export function getStarterNotifications(userId: string): NotificationItem[] {
  const now = Date.now();
  return [
    {
      id: 'notif-welcome',
      userId,
      title: 'Welcome to Maths at Your Fingertips!',
      message: 'Your Google-verified student profile is active. Browse standard syllabus formulas freely or track your revision in this dashboard.',
      read: false,
      linkUrl: '/formula-deck',
      createdAt: new Date(now - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-formula-deck',
      userId,
      title: '9 New Formula Categories Published',
      message: 'Explore updated interactive formulas for Arithmetic, Geometry, Trigonometry, and Mensuration with KaTeX rendering.',
      read: false,
      linkUrl: '/formula-deck',
      createdAt: new Date(now - 3 * 3600 * 1000).toISOString(),
    },
    {
      id: 'notif-ai-teacher',
      userId,
      title: 'AI Teacher Professor Sigma Ready',
      message: 'Ask any doubt from Classes 5–10 using typed math, camera photo, or screenshot for instant step-by-step guidance.',
      read: true,
      linkUrl: '/ai-teacher',
      createdAt: new Date(now - 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'notif-annual-pass',
      userId,
      title: 'Annual Pass 2026–2027 Active',
      message: 'All downloads, full-syllabus cheatsheets, and unlimited AI sessions are unlocked for your grade level.',
      read: true,
      linkUrl: '/annual-pass',
      createdAt: new Date(now - 48 * 3600 * 1000).toISOString(),
    },
  ];
}

/**
 * Hook up real-time listener for current user notifications
 */
export function subscribeToStudentNotifications(
  userId: string,
  onUpdate: (notifications: NotificationItem[]) => void
): Unsubscribe {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  // Check local cache first
  const cacheKey = `mayf_notifs_${userId}`;
  let currentNotifs: NotificationItem[] = [];
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        currentNotifs = JSON.parse(stored);
        onUpdate(currentNotifs);
      } else {
        currentNotifs = getStarterNotifications(userId);
        onUpdate(currentNotifs);
      }
    } catch {
      currentNotifs = getStarterNotifications(userId);
      onUpdate(currentNotifs);
    }
  }

  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: NotificationItem[] = [];
          snapshot.forEach((d) => items.push(d.data() as NotificationItem));
          currentNotifs = items;
          if (typeof window !== 'undefined') {
            localStorage.setItem(cacheKey, JSON.stringify(items));
          }
          onUpdate(items);
        } else {
          // If no notifications yet, push starters to local state and update
          onUpdate(currentNotifs);
        }
      },
      (error) => {
        console.debug('[NotificationService] Realtime listener note (using local cache):', error.message);
        onUpdate(currentNotifs);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.debug('[NotificationService] Fallback to cached notifications:', err);
    onUpdate(currentNotifs);
    return () => {};
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(userId: string, notifId: string): Promise<void> {
  const cacheKey = `mayf_notifs_${userId}`;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const parsed: NotificationItem[] = JSON.parse(stored);
        const updated = parsed.map((n) => (n.id === notifId ? { ...n, read: true } : n));
        localStorage.setItem(cacheKey, JSON.stringify(updated));
      }
    } catch {
      // Ignore
    }
  }

  try {
    const ref = doc(db, 'notifications', notifId);
    await updateDoc(ref, { read: true });
  } catch {
    // Non-fatal
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const cacheKey = `mayf_notifs_${userId}`;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const parsed: NotificationItem[] = JSON.parse(stored);
        const updated = parsed.map((n) => ({ ...n, read: true }));
        localStorage.setItem(cacheKey, JSON.stringify(updated));
      }
    } catch {
      // Ignore
    }
  }

  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.docs.forEach((d) => {
        batch.update(d.ref, { read: true });
      });
      await batch.commit();
    }
  } catch {
    // Non-fatal
  }
}
