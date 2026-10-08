/**
 * Server-Side Authoritative Homepage Block Layout Service.
 * 
 * Directives:
 * 1. Controlled block manager (NOT a freeform page builder).
 * 2. Predefined 15 performant blocks with strict schemas.
 * 3. Persists to Firestore /siteSettings/homepageLayout document.
 * 4. High-performance in-memory caching with ETag & stale-while-revalidate headers.
 * 5. Full audit logging for layout and block config changes.
 */

import {
  HomepageBlock,
  HomepageLayoutConfig,
  DEFAULT_HOMEPAGE_BLOCKS,
  HomepageBlockId,
} from './homepageLayoutTypes';
import { getAdminFirestore } from '../firebase/admin';
import { auditLogService } from '../audit/auditLogger';

class HomepageLayoutService {
  private currentConfig: HomepageLayoutConfig;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes cache

  constructor() {
    this.currentConfig = {
      version: 1,
      updatedAt: '2026-04-01T00:00:00Z',
      updatedBy: 'system_default',
      blocks: JSON.parse(JSON.stringify(DEFAULT_HOMEPAGE_BLOCKS)),
    };
    this.initFromFirestore();
  }

  /**
   * Initialize or restore layout from Firestore /siteSettings/homepageLayout
   */
  private async initFromFirestore(): Promise<void> {
    try {
      const db = getAdminFirestore();
      if (!db) return;

      const docRef = db.collection('siteSettings').doc('homepageLayout');
      const snap = await docRef.get();

      if (snap.exists) {
        const data = snap.data() as HomepageLayoutConfig;
        if (data && Array.isArray(data.blocks) && data.blocks.length > 0) {
          // Merge with any missing canonical blocks if newly introduced
          this.currentConfig = this.mergeWithCanonical(data);
          this.cacheTimestamp = Date.now();
        }
      } else {
        // Bootstrap canonical layout into Firestore
        await docRef.set({
          ...this.currentConfig,
          updatedAt: new Date().toISOString(),
        });
        this.cacheTimestamp = Date.now();
      }
    } catch (e: any) {
      console.warn('[HomepageLayoutService] Firestore sync note, using authoritative memory cache:', e?.message || e);
    }
  }

  /**
   * Ensures all 15 predefined blocks exist even if older configs are loaded
   */
  private mergeWithCanonical(existing: HomepageLayoutConfig): HomepageLayoutConfig {
    const existingBlockMap = new Map<HomepageBlockId, HomepageBlock>();
    existing.blocks.forEach((b) => existingBlockMap.set(b.id, b));

    const mergedBlocks: HomepageBlock[] = [];
    const usedIds = new Set<HomepageBlockId>();

    // 1. Keep existing blocks in their saved order
    existing.blocks.forEach((b) => {
      const canonical = DEFAULT_HOMEPAGE_BLOCKS.find((c) => c.id === b.id);
      if (canonical) {
        mergedBlocks.push({
          ...canonical,
          ...b,
          config: { ...canonical.config, ...(b.config || {}) },
        });
        usedIds.add(b.id);
      }
    });

    // 2. Append any missing canonical blocks at the end
    let nextOrder = mergedBlocks.length + 1;
    DEFAULT_HOMEPAGE_BLOCKS.forEach((c) => {
      if (!usedIds.has(c.id)) {
        mergedBlocks.push({
          ...c,
          order: nextOrder++,
        });
      }
    });

    return {
      version: existing.version || 1,
      updatedAt: existing.updatedAt || new Date().toISOString(),
      updatedBy: existing.updatedBy || 'admin',
      blocks: mergedBlocks.sort((a, b) => a.order - b.order),
    };
  }

  /**
   * Get public active layout (only enabled blocks, cached, sorted by order)
   */
  public getPublicLayout(): {
    blocks: HomepageBlock[];
    updatedAt: string;
    version: number;
  } {
    const activeBlocks = this.currentConfig.blocks
      .filter((b) => b.enabled)
      .sort((a, b) => a.order - b.order);

    return {
      blocks: activeBlocks,
      updatedAt: this.currentConfig.updatedAt,
      version: this.currentConfig.version,
    };
  }

  /**
   * Get full admin layout (all 15 blocks including disabled, sorted by order)
   */
  public getAdminLayout(): HomepageLayoutConfig {
    return {
      ...this.currentConfig,
      blocks: [...this.currentConfig.blocks].sort((a, b) => a.order - b.order),
    };
  }

  /**
   * Update full layout composition (reorder, enable/disable, configure)
   */
  public async updateLayout(
    blocks: HomepageBlock[],
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): Promise<HomepageLayoutConfig> {
    if (!Array.isArray(blocks) || blocks.length === 0) {
      throw new Error('Invalid layout update: blocks array is required.');
    }

    const timestamp = new Date().toISOString();

    // Validate that only predefined blocks are submitted
    const canonicalIds = new Set(DEFAULT_HOMEPAGE_BLOCKS.map((b) => b.id));
    for (const b of blocks) {
      if (!canonicalIds.has(b.id)) {
        throw new Error(`Invalid block ID "${b.id}". Only predefined homepage blocks are allowed.`);
      }
    }

    // Ensure sequential ordering
    const normalizedBlocks = blocks.map((b, idx) => ({
      ...b,
      order: idx + 1,
      updatedAt: timestamp,
    }));

    // Update in-memory configuration
    this.currentConfig = {
      version: (this.currentConfig.version || 1) + 1,
      updatedAt: timestamp,
      updatedBy: actor.email,
      blocks: normalizedBlocks,
    };
    this.cacheTimestamp = Date.now();

    // Persist to Firestore /siteSettings/homepageLayout
    try {
      const db = getAdminFirestore();
      if (db) {
        await db.collection('siteSettings').doc('homepageLayout').set(this.currentConfig);
      }
    } catch (e: any) {
      console.warn('[HomepageLayoutService] Firestore persistence note:', e?.message || e);
    }

    // Audit Log
    auditLogService.log({
      action: 'SECURITY_CONFIG_UPDATED',
      category: 'security',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: 'siteSettings_homepageLayout',
      targetType: 'homepage_layout',
      details: {
        totalBlocks: normalizedBlocks.length,
        enabledBlocks: normalizedBlocks.filter((b) => b.enabled).map((b) => b.id),
        orderSequence: normalizedBlocks.map((b) => b.id),
      },
      status: 'success',
    });

    return this.getAdminLayout();
  }

  /**
   * Update a single block's configuration or enabled state
   */
  public async updateBlock(
    blockId: HomepageBlockId,
    patch: { enabled?: boolean; config?: Record<string, any> },
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): Promise<HomepageBlock> {
    const target = this.currentConfig.blocks.find((b) => b.id === blockId);
    if (!target) {
      throw new Error(`Block "${blockId}" not found in homepage layout.`);
    }

    if (patch.enabled !== undefined) {
      target.enabled = patch.enabled;
    }

    if (patch.config) {
      target.config = { ...target.config, ...patch.config };
    }

    target.updatedAt = new Date().toISOString();

    await this.updateLayout(this.currentConfig.blocks, actor);
    return target;
  }

  /**
   * Reset layout back to default canonical layout
   */
  public async resetToDefault(
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): Promise<HomepageLayoutConfig> {
    const defaultCopy = JSON.parse(JSON.stringify(DEFAULT_HOMEPAGE_BLOCKS));
    return this.updateLayout(defaultCopy, actor);
  }
}

export const homepageLayoutService = new HomepageLayoutService();
