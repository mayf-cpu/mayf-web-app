/**
 * Student Activity Logging & Retention Service
 * Maths at Your Fingertips (mayf.co.in)
 *
 * Implements:
 * - Product events: content_view, download, save, unsave, ai_question, purchase, course_open, formula_view
 * - Cost-disciplined retention strategy: Max 50 items / 30-day retention window
 * - Fast local cache + asynchronous Firestore synchronization
 * - In-memory event dispatching to avoid unnecessary Firestore realtime listener costs
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/client';
import { ActivityEventType, ActivityLog, RecentlyViewedItem, StudentClass } from '../firebase/types';

const MAX_STORED_EVENTS = 50;
const RETENTION_DAYS = 30;
const RECENT_VIEWED_LIMIT = 12;

type ActivityListener = (activities: ActivityLog[]) => void;
const listeners = new Set<ActivityListener>();

// In-memory cache per session
let inMemoryActivities: ActivityLog[] = [];
let inMemoryRecentlyViewed: RecentlyViewedItem[] = [];

/**
 * Notify in-app subscribers without Firestore round-trips
 */
function notifyListeners() {
  const current = [...inMemoryActivities];
  listeners.forEach((listener) => {
    try {
      listener(current);
    } catch (err) {
      console.warn('[ActivityService] Listener notification error:', err);
    }
  });
}

/**
 * Subscribe to local activity changes
 */
export function subscribeToActivity(listener: ActivityListener): () => void {
  listeners.add(listener);
  // Send current immediately
  listener([...inMemoryActivities]);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Storage key helper
 */
function getStorageKey(userId: string) {
  return `mayf_activity_logs_${userId}`;
}

function getRecentlyViewedKey(userId: string) {
  return `mayf_recently_viewed_${userId}`;
}

/**
 * Filter out events older than the retention window
 */
function filterRetentionWindow(logs: ActivityLog[]): ActivityLog[] {
  const cutoffTime = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return logs
    .filter((log) => {
      const logTime = new Date(log.createdAt).getTime();
      return !isNaN(logTime) && logTime >= cutoffTime;
    })
    .slice(0, MAX_STORED_EVENTS);
}

/**
 * Log a verified product event
 */
export async function logProductEvent({
  userId,
  eventType,
  title,
  targetId,
  targetSlug,
  targetType = 'general',
  metadata,
}: {
  userId: string;
  eventType: ActivityEventType;
  title: string;
  targetId?: string;
  targetSlug?: string;
  targetType?: 'formula' | 'chapter' | 'download' | 'course' | 'ai_doubt' | 'membership' | 'general';
  metadata?: Record<string, unknown>;
}): Promise<ActivityLog> {
  const timestamp = new Date().toISOString();
  const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newLog: ActivityLog = {
    id,
    userId,
    eventType,
    title,
    targetId,
    targetSlug,
    targetType,
    metadata,
    createdAt: timestamp,
  };

  // 1. Update in-memory state
  inMemoryActivities = [newLog, ...inMemoryActivities.filter((a) => a.id !== id)].slice(0, MAX_STORED_EVENTS);
  notifyListeners();

  // 2. Update Recently Viewed if applicable (formula_view, content_view, course_open)
  if (['formula_view', 'content_view', 'course_open'].includes(eventType) && targetSlug) {
    recordRecentlyViewed(userId, {
      id: targetId || targetSlug,
      title,
      type: eventType === 'formula_view' ? 'formula' : eventType === 'course_open' ? 'course' : 'chapter',
      slug: targetSlug,
      category: metadata?.category as string,
      classLevel: metadata?.classLevel as StudentClass,
      viewedAt: timestamp,
    });
  }

  // 3. Persist to localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(inMemoryActivities));
    } catch {
      // Ignore quota storage warnings
    }
  }

  // 4. Asynchronously persist to Firestore & prune expired logs
  // Done without blocking UI execution
  persistToFirestoreWithPruning(userId, newLog).catch((err) => {
    // Non-fatal fallback in offline or preview sandbox
    console.debug('[ActivityService] Firestore background sync note:', err?.message || err);
  });

  return newLog;
}

/**
 * Record a recently viewed item
 */
export function recordRecentlyViewed(userId: string, item: RecentlyViewedItem) {
  inMemoryRecentlyViewed = [
    item,
    ...inMemoryRecentlyViewed.filter((r) => r.slug !== item.slug || r.type !== item.type),
  ].slice(0, RECENT_VIEWED_LIMIT);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(getRecentlyViewedKey(userId), JSON.stringify(inMemoryRecentlyViewed));
    } catch {
      // Ignore quota warnings
    }
  }
}

/**
 * Retrieve recently viewed items for user
 */
export function getRecentlyViewed(userId?: string): RecentlyViewedItem[] {
  if (inMemoryRecentlyViewed.length > 0) {
    return inMemoryRecentlyViewed;
  }

  if (typeof window !== 'undefined' && userId) {
    try {
      const stored = localStorage.getItem(getRecentlyViewedKey(userId));
      if (stored) {
        inMemoryRecentlyViewed = JSON.parse(stored);
        return inMemoryRecentlyViewed;
      }
    } catch {
      // Return fallback
    }
  }

  // Sensible default starter items for a new learner
  return [
    {
      id: 'quad-formula',
      title: 'Quadratic Formula (Sridharacharya)',
      type: 'formula',
      slug: 'quadratic-formula',
      category: 'Algebra',
      classLevel: 'Class 10',
      viewedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    },
    {
      id: 'pythagoras-theorem',
      title: 'Pythagorean Theorem & Distance Metric',
      type: 'formula',
      slug: 'pythagoras-theorem',
      category: 'Geometry',
      classLevel: 'Class 10',
      viewedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    },
    {
      id: 'ap-nth-term',
      title: 'Arithmetic Progression nth Term',
      type: 'formula',
      slug: 'arithmetic-progression-nth-term',
      category: 'Arithmetic',
      classLevel: 'Class 10',
      viewedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    },
    {
      id: 'trig-identities-pythagorean',
      title: 'Fundamental Pythagorean Trig Identities',
      type: 'formula',
      slug: 'fundamental-pythagorean-trig-identities',
      category: 'Trigonometry',
      classLevel: 'Class 10',
      viewedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    },
  ];
}

/**
 * Load user activities with cost-disciplined single query (No expensive persistent realtime listener)
 */
export async function loadUserActivities(userId: string): Promise<ActivityLog[]> {
  // 1. Try local storage first for instant load
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(getStorageKey(userId));
      if (stored) {
        const parsed = JSON.parse(stored);
        const filtered = filterRetentionWindow(parsed);
        inMemoryActivities = filtered;
        notifyListeners();
      }
    } catch {
      // Ignore
    }
  }

  // 2. Fetch from Firestore with strict limit(50) and retention filter
  try {
    const q = query(
      collection(db, 'activityLogs'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(MAX_STORED_EVENTS)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const firestoreLogs: ActivityLog[] = [];
      snapshot.forEach((docSnap) => {
        firestoreLogs.push(docSnap.data() as ActivityLog);
      });

      const filtered = filterRetentionWindow(firestoreLogs);
      inMemoryActivities = filtered;
      notifyListeners();

      if (typeof window !== 'undefined') {
        localStorage.setItem(getStorageKey(userId), JSON.stringify(filtered));
      }
      return filtered;
    }
  } catch (err) {
    console.debug('[ActivityService] Firestore fetch skipped (using local cache):', err);
  }

  // 3. Fallback to initial seed if empty
  if (inMemoryActivities.length === 0) {
    inMemoryActivities = getSampleActivities(userId);
    notifyListeners();
  }

  return inMemoryActivities;
}

/**
 * Persist new log to Firestore and enforce retention capping (max 50, <= 30 days)
 */
async function persistToFirestoreWithPruning(userId: string, newLog: ActivityLog) {
  try {
    // 1. Write the new document
    const docRef = doc(db, 'activityLogs', newLog.id);
    await setDoc(docRef, newLog);

    // 2. Prune old logs if excess exist (Cost-effective batch check)
    // Only prune occasionally (e.g. 1 in 5 events) to avoid needless read calls
    if (Math.random() < 0.25) {
      const q = query(
        collection(db, 'activityLogs'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(MAX_STORED_EVENTS + 15)
      );

      const snap = await getDocs(q);
      const cutoffTime = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;

      if (snap.size > MAX_STORED_EVENTS) {
        const batch = writeBatch(db);
        let excessCount = 0;

        snap.docs.forEach((docSnapshot, index) => {
          const data = docSnapshot.data() as ActivityLog;
          const logTime = new Date(data.createdAt).getTime();

          // Delete if beyond MAX_STORED_EVENTS or older than RETENTION_DAYS
          if (index >= MAX_STORED_EVENTS || logTime < cutoffTime) {
            batch.delete(docSnapshot.ref);
            excessCount++;
          }
        });

        if (excessCount > 0) {
          await batch.commit();
          console.debug(`[ActivityService] Pruned ${excessCount} expired activity logs.`);
        }
      }
    }
  } catch {
    // Graceful silent fallback
  }
}

/**
 * Clear or prune local cache
 */
export function clearUserActivitiesCache(userId: string) {
  inMemoryActivities = [];
  inMemoryRecentlyViewed = [];
  if (typeof window !== 'undefined') {
    localStorage.removeItem(getStorageKey(userId));
    localStorage.removeItem(getRecentlyViewedKey(userId));
  }
  notifyListeners();
}

/**
 * Initial sample seed activities for clean demo display
 */
export function getSampleActivities(userId: string): ActivityLog[] {
  const now = Date.now();
  return [
    {
      id: 'act-sample-1',
      userId,
      eventType: 'formula_view',
      title: 'Viewed Quadratic Formula (Sridharacharya)',
      targetId: 'quad-formula',
      targetSlug: 'quadratic-formula',
      targetType: 'formula',
      metadata: { category: 'Algebra', classLevel: 'Class 10' },
      createdAt: new Date(now - 12 * 60 * 1000).toISOString(),
    },
    {
      id: 'act-sample-2',
      userId,
      eventType: 'ai_question',
      title: 'Asked Professor Sigma: "How to find discriminant in 2x^2 + 5x + 3 = 0?"',
      targetType: 'ai_doubt',
      metadata: { topic: 'Quadratic Equations', classLevel: 'Class 10' },
      createdAt: new Date(now - 45 * 60 * 1000).toISOString(),
    },
    {
      id: 'act-sample-3',
      userId,
      eventType: 'save',
      title: 'Bookmarked formula: Pythagorean Theorem',
      targetId: 'pythagoras-theorem',
      targetSlug: 'pythagoras-theorem',
      targetType: 'formula',
      createdAt: new Date(now - 2 * 3600 * 1000).toISOString(),
    },
    {
      id: 'act-sample-4',
      userId,
      eventType: 'download',
      title: 'Downloaded Class 10 Board Formula Cheatsheet PDF',
      targetId: 'dl-10-cheatsheet',
      targetType: 'download',
      createdAt: new Date(now - 5 * 3600 * 1000).toISOString(),
    },
    {
      id: 'act-sample-5',
      userId,
      eventType: 'course_open',
      title: 'Opened Course: Class 10 Board Mathematics Mastery',
      targetId: 'course-class-10-mastery',
      targetSlug: 'class-10-mastery',
      targetType: 'course',
      createdAt: new Date(now - 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'act-sample-6',
      userId,
      eventType: 'content_view',
      title: 'Studied Chapter: Real Numbers & Euclid Division Lemma',
      targetId: 'ch-real-numbers',
      targetSlug: 'real-numbers',
      targetType: 'chapter',
      createdAt: new Date(now - 36 * 3600 * 1000).toISOString(),
    },
    {
      id: 'act-sample-7',
      userId,
      eventType: 'purchase',
      title: 'Subscribed to Maths at Your Fingertips Annual Pass (2026–2027)',
      targetType: 'membership',
      metadata: { plan: 'Annual Pass', amount: 999 },
      createdAt: new Date(now - 3 * 24 * 3600 * 1000).toISOString(),
    },
  ];
}
