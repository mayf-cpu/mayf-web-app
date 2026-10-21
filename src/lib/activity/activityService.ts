import { ActivityCache } from './activityCache';
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
const listeners = new Map<ActivityListener, string | null>();

// In-memory cache per session
const cache = new ActivityCache();
export function setActivityUser(userId: string | null) { cache.switchTo(userId); }

/**
 * Notify in-app subscribers without Firestore round-trips
 */
function notifyListeners() {
  const current = [...cache.activities];
  listeners.forEach((owner, listener) => {
    if (owner !== cache.owner) return;
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
export function subscribeToActivity(listener: ActivityListener, userId: string | null = cache.owner): () => void {
  listeners.set(listener, userId);
  // Send current immediately
  listener(cache.owner === userId ? [...cache.activities] : []);
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
      if (!log || typeof log.id !== 'string' || log.id.startsWith('act-sample-')) return false;
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
  cache.switchTo(userId);
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
  cache.activities = [newLog, ...cache.activities.filter((a) => a.id !== id)].slice(0, MAX_STORED_EVENTS);
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
      localStorage.setItem(getStorageKey(userId), JSON.stringify(cache.activities));
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
  cache.switchTo(userId);
  cache.recentlyViewed = [
    item,
    ...cache.recentlyViewed.filter((r) => r.slug !== item.slug || r.type !== item.type),
  ].slice(0, RECENT_VIEWED_LIMIT);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(getRecentlyViewedKey(userId), JSON.stringify(cache.recentlyViewed));
    } catch {
      // Ignore quota warnings
    }
  }
}

/**
 * Retrieve recently viewed items for user
 */
export function getRecentlyViewed(userId?: string): RecentlyViewedItem[] {
  cache.switchTo(userId || null);
  if (cache.recentlyViewed.length > 0) {
    return cache.recentlyViewed;
  }

  if (typeof window !== 'undefined' && userId) {
    try {
      const stored = localStorage.getItem(getRecentlyViewedKey(userId));
      if (stored) {
        cache.recentlyViewed = JSON.parse(stored);
        return cache.recentlyViewed;
      }
    } catch {
      // Return fallback
    }
  }

  return [];
}

/**
 * Load user activities with cost-disciplined single query (No expensive persistent realtime listener)
 */
export async function loadUserActivities(userId: string): Promise<ActivityLog[]> {
  cache.switchTo(userId);
  // 1. Try local storage first for instant load
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(getStorageKey(userId));
      if (stored) {
        const parsed = JSON.parse(stored);
        const filtered = filterRetentionWindow(Array.isArray(parsed) ? parsed.filter(item => item.userId === userId) : []);
        cache.activities = filtered;
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
    if (cache.owner !== userId) return [];
    {
      const firestoreLogs: ActivityLog[] = [];
      snapshot.forEach((docSnap) => {
        firestoreLogs.push(docSnap.data() as ActivityLog);
      });

      const filtered = filterRetentionWindow(firestoreLogs);
      cache.apply(userId, filtered);
      notifyListeners();

      if (typeof window !== 'undefined') {
        localStorage.setItem(getStorageKey(userId), JSON.stringify(filtered));
      }
      return filtered;
    }
  } catch (err) {
    console.debug('[ActivityService] Firestore fetch skipped (using local cache):', err);
  }

  return cache.owner === userId ? [...cache.activities] : [];
}

/**
 * Persist new log to Firestore and enforce retention capping (max 50, <= 30 days)
 */
async function persistToFirestoreWithPruning(userId: string, newLog: ActivityLog) {
  try {
    // 1. Write the new document
    const docRef = doc(db, 'activityLogs', newLog.id);
    await setDoc(docRef, JSON.parse(JSON.stringify(newLog)));

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
  if (cache.owner === userId) { cache.activities = []; cache.recentlyViewed = []; }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(getStorageKey(userId));
    localStorage.removeItem(getRecentlyViewedKey(userId));
  }
  notifyListeners();
}

/** Compatibility helper: new accounts have an empty activity history. */
export function getSampleActivities(_userId: string): ActivityLog[] { return []; }
