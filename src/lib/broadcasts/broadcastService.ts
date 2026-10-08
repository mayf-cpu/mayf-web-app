/**
 * Authoritative Server-Side Notification & Broadcast Management Service.
 * 
 * Invariants:
 * - Internal website notifications first (no browser push notification dependencies).
 * - Persisted to Firestore `/siteSettings/broadcasts` with in-memory caching.
 * - Deep sanitization: pure plaintext stripping for titles, messages, and links.
 * - Time-window and audience-aware filtering.
 */

import {
  BroadcastItem,
  SEED_BROADCASTS,
  BroadcastCategory,
  BroadcastAudience,
} from './broadcastTypes';
import { sanitizePlainText, sanitizeUrl } from '../security/sanitizer';
import { getAdminFirestore } from '../firebase/admin';
import { auditLogService } from '../audit/auditLogger';

class BroadcastService {
  private broadcastsStore: Map<string, BroadcastItem> = new Map();
  private cacheTimestamp: number = 0;

  constructor() {
    this.initStore();
  }

  private async initStore(): Promise<void> {
    // Seed initial broadcasts into store
    SEED_BROADCASTS.forEach((b) => this.broadcastsStore.set(b.id, { ...b }));

    try {
      const db = getAdminFirestore();
      if (!db) return;

      const docRef = db.collection('siteSettings').doc('broadcasts');
      const snap = await docRef.get();

      if (snap.exists) {
        const data = snap.data();
        if (data && Array.isArray(data.items)) {
          this.broadcastsStore.clear();
          data.items.forEach((item: BroadcastItem) => {
            this.broadcastsStore.set(item.id, item);
          });
          this.cacheTimestamp = Date.now();
        }
      } else {
        await docRef.set({
          items: Array.from(this.broadcastsStore.values()),
          updatedAt: new Date().toISOString(),
        });
        this.cacheTimestamp = Date.now();
      }
    } catch (e: any) {
      console.warn('[BroadcastService] Firestore sync note, using authoritative memory cache:', e?.message || e);
    }
  }

  private async persistToFirestore(): Promise<void> {
    try {
      const db = getAdminFirestore();
      if (db) {
        const items = Array.from(this.broadcastsStore.values());
        await db.collection('siteSettings').doc('broadcasts').set({
          items,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (e: any) {
      console.warn('[BroadcastService] Firestore persistence note:', e?.message || e);
    }
  }

  /**
   * Retrieves all broadcasts for admin management (including inactive & expired)
   */
  public getAllBroadcasts(): BroadcastItem[] {
    return Array.from(this.broadcastsStore.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Retrieves active, unexpired broadcasts tailored to the requesting user's audience
   */
  public getActiveBroadcastsForUser(params: {
    hasAnnualPass?: boolean;
    isPro?: boolean;
    email?: string;
  }): BroadcastItem[] {
    const now = Date.now();
    const all = Array.from(this.broadcastsStore.values());

    return all.filter((b) => {
      // 1. Must be active
      if (!b.isActive) return false;

      // 2. Start time must have passed
      const startMs = new Date(b.startTime).getTime();
      if (!isNaN(startMs) && now < startMs) return false;

      // 3. End time (if set) must not be expired
      if (b.endTime) {
        const endMs = new Date(b.endTime).getTime();
        if (!isNaN(endMs) && now > endMs) return false;
      }

      // 4. Audience targeting
      switch (b.audience) {
        case 'all':
          return true;
        case 'free_users':
          return !params.hasAnnualPass && !params.isPro;
        case 'pro_users':
          return Boolean(params.isPro);
        case 'annual_pass':
          return Boolean(params.hasAnnualPass);
        case 'selected_users':
          if (!params.email) return false;
          const emails = b.selectedUserEmails || [];
          return emails.some((e) => e.trim().toLowerCase() === params.email?.trim().toLowerCase());
        default:
          return true;
      }
    });
  }

  /**
   * Creates a new broadcast with strict sanitization
   */
  public async createBroadcast(
    input: {
      category: BroadcastCategory;
      title: string;
      message: string;
      link?: string;
      linkText?: string;
      imageUrl?: string;
      audience: BroadcastAudience;
      selectedUserEmails?: string[];
      startTime?: string;
      endTime?: string;
      isActive?: boolean;
      priority?: 'normal' | 'high' | 'urgent';
      dismissible?: boolean;
    },
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): Promise<BroadcastItem> {
    const title = sanitizePlainText(input.title, 150);
    const message = sanitizePlainText(input.message, 600);

    if (!title) throw new Error('Broadcast title is required.');
    if (!message) throw new Error('Broadcast message is required.');

    const timestamp = new Date().toISOString();
    const id = `bc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const validCategories: BroadcastCategory[] = [
      'site_announcement',
      'dashboard_notification',
      'promotional_notification',
      'maintenance_message',
    ];
    const category = validCategories.includes(input.category) ? input.category : 'site_announcement';

    const validAudiences: BroadcastAudience[] = [
      'all',
      'free_users',
      'pro_users',
      'annual_pass',
      'selected_users',
    ];
    const audience = validAudiences.includes(input.audience) ? input.audience : 'all';

    const selectedEmails = Array.isArray(input.selectedUserEmails)
      ? input.selectedUserEmails.map((e) => sanitizePlainText(e, 80).toLowerCase()).filter(Boolean)
      : [];

    const item: BroadcastItem = {
      id,
      category,
      title,
      message,
      link: sanitizeUrl(input.link),
      linkText: sanitizePlainText(input.linkText || 'Learn More', 40),
      imageUrl: sanitizeUrl(input.imageUrl),
      audience,
      selectedUserEmails: selectedEmails,
      startTime: input.startTime || timestamp,
      endTime: input.endTime || undefined,
      isActive: input.isActive ?? true,
      priority: input.priority || 'normal',
      dismissible: input.dismissible ?? true,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: actor.email,
      metrics: {
        impressions: 0,
        clicks: 0,
        dismissals: 0,
      },
    };

    this.broadcastsStore.set(id, item);
    await this.persistToFirestore();

    auditLogService.log({
      action: 'BROADCAST_CREATED',
      category: 'admin',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: id,
      targetType: 'broadcast_notification',
      details: { title, category, audience },
      status: 'success',
    });

    return item;
  }

  /**
   * Updates an existing broadcast
   */
  public async updateBroadcast(
    id: string,
    patch: Partial<BroadcastItem>,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): Promise<BroadcastItem> {
    const existing = this.broadcastsStore.get(id);
    if (!existing) {
      throw new Error(`Broadcast with ID "${id}" not found.`);
    }

    const timestamp = new Date().toISOString();

    const updated: BroadcastItem = {
      ...existing,
      category: patch.category || existing.category,
      title: patch.title !== undefined ? sanitizePlainText(patch.title, 150) : existing.title,
      message: patch.message !== undefined ? sanitizePlainText(patch.message, 600) : existing.message,
      link: patch.link !== undefined ? sanitizeUrl(patch.link) : existing.link,
      linkText: patch.linkText !== undefined ? sanitizePlainText(patch.linkText, 40) : existing.linkText,
      imageUrl: patch.imageUrl !== undefined ? sanitizeUrl(patch.imageUrl) : existing.imageUrl,
      audience: patch.audience || existing.audience,
      selectedUserEmails: Array.isArray(patch.selectedUserEmails)
        ? patch.selectedUserEmails.map((e) => sanitizePlainText(e, 80).toLowerCase()).filter(Boolean)
        : existing.selectedUserEmails,
      startTime: patch.startTime || existing.startTime,
      endTime: patch.endTime !== undefined ? patch.endTime : existing.endTime,
      isActive: patch.isActive !== undefined ? patch.isActive : existing.isActive,
      priority: patch.priority || existing.priority,
      dismissible: patch.dismissible !== undefined ? patch.dismissible : existing.dismissible,
      updatedAt: timestamp,
    };

    this.broadcastsStore.set(id, updated);
    await this.persistToFirestore();

    auditLogService.log({
      action: 'BROADCAST_UPDATED',
      category: 'admin',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: id,
      targetType: 'broadcast_notification',
      details: { title: updated.title, isActive: updated.isActive },
      status: 'success',
    });

    return updated;
  }

  /**
   * Deletes a broadcast
   */
  public async deleteBroadcast(
    id: string,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): Promise<boolean> {
    const existing = this.broadcastsStore.get(id);
    if (!existing) return false;

    this.broadcastsStore.delete(id);
    await this.persistToFirestore();

    auditLogService.log({
      action: 'BROADCAST_DELETED',
      category: 'admin',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: id,
      targetType: 'broadcast_notification',
      details: { title: existing.title },
      status: 'success',
    });

    return true;
  }
}

export const broadcastService = new BroadcastService();
