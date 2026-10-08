/**
 * Authoritative Server-Side Content CMS Manager.
 * 
 * Supports:
 * - All 12 curriculum content formats:
 *   pdf, course, testPaper, worksheet, formulaSheet, video, reel,
 *   youtube, facebook, singleImage, multiImage, other.
 * 
 * - Safe deletion:
 *   Prefer soft-delete/archive first rather than permanently deleting files.
 *   Retains file assets in Cloud Storage and preserves historical Drive references.
 *   Allows instant restoration or optional hard purge.
 * 
 * - Full CMS lifecycle:
 *   create, edit, preview, publish, hide, unhide, unpublish,
 *   soft-delete, restore, permanent purge, duplicate, feature, reorder.
 * 
 * - Audit logging for all content lifecycle changes.
 */

import { ContentItem, StudentClass, ContentType, ContentAccessType } from '../firebase/types';
import { SEED_CONTENT_ITEMS } from '../catalogue/catalogueService';
import { INGESTION_JOBS_STORE } from '../ingestion/ingestionService';
import { paymentService } from '../payments/paymentService';
import { auditLogService } from '../audit/auditLogger';

export interface CmsContentItem extends ContentItem {
  status: 'published' | 'draft' | 'hidden' | 'archived';
  sourceDriveId: string;
  importStatus: 'imported' | 'pending' | 'direct' | 'syncing' | 'failed';
  lastSync: string;
  visibilityStatus: 'Visible' | 'Hidden' | 'Archived';
  accessLabel: string;
  views: number;
  downloads: number;
  sales: {
    orderCount: number;
    revenue: number;
  };
  isDeleted: boolean;
  deletedAt?: string;
  archivedReason?: string;
  archivedBy?: string;
  restoredAt?: string;
  difficulty?: 'Foundation' | 'Standard' | 'Exemplar / Board';
  // Extra fields for rich multi-format preview
  equations?: { title: string; latex: string; explanation: string }[];
  modules?: { id: string; title: string; duration: string; lessonsCount: number }[];
  questionsCount?: number;
  totalMarks?: number;
  durationMinutes?: number;
  galleryImages?: string[];
}

export interface ContentFilterQuery {
  search?: string;
  classLevel?: string;
  contentType?: string;
  accessType?: string;
  visibility?: string;
  tab?: 'active' | 'archived';
  sortBy?: 'sortOrder' | 'latest' | 'views' | 'downloads' | 'sales' | 'alpha';
}

class ContentCmsManager {
  private itemsStore: Map<string, CmsContentItem> = new Map();
  private initialized = false;

  constructor() {
    this.initializeStore();
  }

  private initializeStore(): void {
    if (this.initialized) return;

    // 1. Seed items from SEED_CONTENT_ITEMS
    SEED_CONTENT_ITEMS.forEach((seed, index) => {
      // Find matching ingestion job if any
      const matchingJob = INGESTION_JOBS_STORE.find(
        (j) => j.content_id === seed.id || j.sourceRowMetadata.slug === seed.slug
      );

      const sourceDriveId =
        matchingJob?.sourceDriveFileId ||
        (seed as any).sourceDriveFileId ||
        `1dr_${seed.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}driveId`;

      const importStatus = matchingJob?.status === 'imported' ? 'imported' : index % 3 === 0 ? 'imported' : 'direct';
      const lastSync = matchingJob?.updatedAt || seed.updatedAt || '2026-04-01T10:05:22Z';
      const isVisible = seed.visible !== false;

      // Calculate sales metrics
      const mockSalesCount = seed.accessType === 'paid' ? 45 + (index * 23) : 0;
      const mockRevenue = mockSalesCount * (seed.price || 499);

      const item: CmsContentItem = {
        ...seed,
        status: isVisible ? 'published' : 'hidden',
        sourceDriveId,
        importStatus,
        lastSync,
        visibilityStatus: isVisible ? 'Visible' : 'Hidden',
        accessLabel: seed.accessType === 'free' ? 'Free' : seed.annualPassIncluded ? 'Annual Pass' : `₹${seed.price || 499}`,
        views: seed.viewCount || (index + 1) * 820,
        downloads: seed.downloadCount || (index + 1) * 310,
        sales: {
          orderCount: mockSalesCount,
          revenue: mockRevenue,
        },
        isDeleted: false,
        sortOrder: seed.sortOrder ?? index + 1,
        difficulty: (seed as any).difficulty || 'Standard',
        // Enrich format-specific fields for preview
        equations: seed.contentType === 'formulaSheet' ? [
          { title: 'Sridharacharya Formula', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', explanation: 'Roots of ax² + bx + c = 0' },
          { title: 'Discriminant Condition', latex: '\\Delta = b^2 - 4ac \\ge 0 \\implies \\text{Real roots}', explanation: 'Nature of roots indicator' },
          { title: 'Sum & Product of Roots', latex: '\\alpha + \\beta = -\\frac{b}{a}, \\quad \\alpha\\beta = \\frac{c}{a}', explanation: 'Vieta formulas for quadratics' },
        ] : undefined,
        modules: seed.contentType === 'course' ? [
          { id: 'm-1', title: 'Unit 1: Fundamental Theorem of Arithmetic', duration: '45 mins', lessonsCount: 4 },
          { id: 'm-2', title: 'Unit 2: Proofs of Irrationality (√2, √3, √5)', duration: '60 mins', lessonsCount: 5 },
          { id: 'm-3', title: 'Unit 3: Decimal Expansions & Rational Denominators', duration: '35 mins', lessonsCount: 3 },
        ] : undefined,
        questionsCount: seed.contentType === 'testPaper' ? 38 : seed.contentType === 'worksheet' ? 25 : undefined,
        totalMarks: seed.contentType === 'testPaper' ? 80 : seed.contentType === 'worksheet' ? 50 : undefined,
        durationMinutes: seed.contentType === 'testPaper' ? 180 : seed.contentType === 'worksheet' ? 60 : undefined,
        galleryImages: seed.contentType === 'multiImage' ? [
          'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=800&auto=format&fit=crop&q=80',
        ] : undefined,
      };

      this.itemsStore.set(item.id, item);
    });

    // 2. Add an initial soft-deleted/archived item to demonstrate safe deletion restoration capability
    const archivedItem: CmsContentItem = {
      id: 'cnt-archived-legacy-notes-2025',
      title: 'Legacy 2025 Class 10 Trigonometric Identities Notes (Soft-Deleted)',
      slug: 'legacy-2025-class-10-trigonometric-identities-notes',
      shortDescription: 'Archived draft from previous curriculum cycle. Retained safely for historical records.',
      description: 'Contains older syllabus proofs prior to the updated 2026 NCERT rationalization.',
      classLevels: ['Class 10'],
      categoryId: 'Trigonometry',
      subcategoryId: 'Identities',
      topic: 'Identities',
      contentType: 'pdf',
      thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
      sourceDriveId: '1dr_archived_99xLegacyDrive2025',
      importStatus: 'imported',
      lastSync: '2026-01-15T08:00:00Z',
      accessType: 'free',
      accessLabel: 'Free',
      price: 0,
      currency: 'INR',
      annualPassIncluded: true,
      downloadAllowed: true,
      visible: false,
      visibilityStatus: 'Archived',
      status: 'archived',
      featured: false,
      sortOrder: 99,
      views: 1420,
      downloads: 410,
      viewCount: 1420,
      downloadCount: 410,
      sales: { orderCount: 0, revenue: 0 },
      isDeleted: true,
      deletedAt: '2026-03-20T14:30:00Z',
      archivedReason: 'Replaced by 2026 edition (SAFE ARCHIVE: original Drive files untouched).',
      archivedBy: '2026vivekkushwah@gmail.com',
      createdAt: '2025-11-10T00:00:00Z',
      updatedAt: '2026-03-20T14:30:00Z',
      publishedAt: '2025-11-10T12:00:00Z',
    };
    this.itemsStore.set(archivedItem.id, archivedItem);

    this.initialized = true;
  }

  /**
   * Recalculates real order/sales counts from authoritative PaymentService
   */
  private refreshSalesMetrics(): void {
    const orders = paymentService.getAllOrders().filter((o) => o.status === 'paid');
    
    // Map of contentId -> { orderCount, revenue }
    const salesMap = new Map<string, { orderCount: number; revenue: number }>();

    orders.forEach((o) => {
      o.items.forEach((item) => {
        if (item.contentItemId) {
          const current = salesMap.get(item.contentItemId) || { orderCount: 0, revenue: 0 };
          current.orderCount += item.quantity || 1;
          current.revenue += (item.unitPrice || 0) * (item.quantity || 1);
          salesMap.set(item.contentItemId, current);
        }
      });
    });

    salesMap.forEach((sales, contentId) => {
      const item = this.itemsStore.get(contentId);
      if (item) {
        item.sales = sales;
      }
    });
  }

  /**
   * Get filtered content items
   */
  public getItems(filters: ContentFilterQuery = {}): {
    items: CmsContentItem[];
    counts: {
      total: number;
      active: number;
      archived: number;
      published: number;
      draft: number;
      hidden: number;
    };
  } {
    this.refreshSalesMetrics();
    const all = Array.from(this.itemsStore.values());

    const activeItems = all.filter((i) => !i.isDeleted);
    const archivedItems = all.filter((i) => i.isDeleted);

    const counts = {
      total: all.length,
      active: activeItems.length,
      archived: archivedItems.length,
      published: activeItems.filter((i) => i.status === 'published' && i.visible).length,
      draft: activeItems.filter((i) => i.status === 'draft').length,
      hidden: activeItems.filter((i) => !i.visible && i.status !== 'archived').length,
    };

    let target = filters.tab === 'archived' ? archivedItems : activeItems;

    // Search query
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      target = target.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.slug.toLowerCase().includes(q) ||
          i.sourceDriveId?.toLowerCase().includes(q) ||
          i.categoryId.toLowerCase().includes(q) ||
          (i.topic && i.topic.toLowerCase().includes(q)) ||
          i.contentType.toLowerCase().includes(q) ||
          (i.tags && i.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    // Filter by class level
    if (filters.classLevel && filters.classLevel !== 'All') {
      target = target.filter((i) => i.classLevels.includes(filters.classLevel as StudentClass));
    }

    // Filter by format / contentType
    if (filters.contentType && filters.contentType !== 'All') {
      target = target.filter((i) => i.contentType === filters.contentType);
    }

    // Filter by access type
    if (filters.accessType && filters.accessType !== 'All') {
      target = target.filter((i) => i.accessType === filters.accessType);
    }

    // Filter by visibility
    if (filters.visibility && filters.visibility !== 'All') {
      if (filters.visibility === 'Visible') {
        target = target.filter((i) => i.visible);
      } else if (filters.visibility === 'Hidden') {
        target = target.filter((i) => !i.visible);
      }
    }

    // Sorting
    const sortBy = filters.sortBy || 'sortOrder';
    target.sort((a, b) => {
      switch (sortBy) {
        case 'sortOrder':
          return (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
        case 'latest':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'views':
          return b.views - a.views;
        case 'downloads':
          return b.downloads - a.downloads;
        case 'sales':
          return b.sales.revenue - a.sales.revenue;
        case 'alpha':
          return a.title.localeCompare(b.title);
        default:
          return (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
      }
    });

    return {
      items: target,
      counts,
    };
  }

  /**
   * Get single item
   */
  public getItem(id: string): CmsContentItem | null {
    return this.itemsStore.get(id) || null;
  }

  /**
   * CREATE CONTENT ITEM
   */
  public createItem(
    payload: Partial<CmsContentItem>,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): CmsContentItem {
    const timestamp = new Date().toISOString();
    const title = payload.title?.trim() || 'Untitled Curriculum Resource';
    const slug =
      payload.slug?.trim() ||
      title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const id = payload.id?.trim() || `cnt-${payload.contentType || 'pdf'}-${slug}-${Date.now().toString().slice(-4)}`;

    const maxSort = Math.max(0, ...Array.from(this.itemsStore.values()).map((i) => i.sortOrder || 0));

    const newItem: CmsContentItem = {
      id,
      title,
      slug,
      shortDescription: payload.shortDescription || '',
      description: payload.description || '',
      classLevels: payload.classLevels && payload.classLevels.length > 0 ? payload.classLevels : ['Class 10'],
      categoryId: payload.categoryId || 'General Mathematics',
      subcategoryId: payload.subcategoryId || '',
      topic: payload.topic || '',
      contentType: (payload.contentType as ContentType) || 'pdf',
      thumbnail: payload.thumbnail || 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
      files: payload.files || (payload.contentType === 'pdf' ? [
        {
          name: `${slug}.pdf`,
          url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
          sizeBytes: 1540000,
          mimeType: 'application/pdf',
        },
      ] : []),
      embedUrl: payload.embedUrl || '',
      source: payload.source || 'MAYF Production Curriculum',
      accessType: payload.accessType || 'free',
      accessLabel: payload.accessType === 'free' ? 'Free' : payload.annualPassIncluded ? 'Annual Pass' : `₹${payload.price || 499}`,
      price: payload.price ? Number(payload.price) : 0,
      currency: 'INR',
      annualPassIncluded: payload.annualPassIncluded !== false,
      downloadAllowed: payload.downloadAllowed !== false,
      visible: payload.visible !== false,
      visibilityStatus: payload.visible !== false ? 'Visible' : 'Hidden',
      status: payload.status || (payload.visible !== false ? 'published' : 'draft'),
      featured: Boolean(payload.featured),
      trending: false,
      tags: payload.tags || [],
      searchTerms: [title.toLowerCase(), (payload.topic || '').toLowerCase()].filter(Boolean),
      seoTitle: payload.seoTitle || `${title} | Maths at Your Fingertips`,
      seoDescription: payload.seoDescription || payload.shortDescription || '',
      sortOrder: payload.sortOrder ?? maxSort + 1,
      sourceDriveId: payload.sourceDriveId || `1dr_native_${Date.now().toString().slice(-8)}`,
      importStatus: payload.importStatus || 'direct',
      lastSync: timestamp,
      views: 0,
      downloads: 0,
      viewCount: 0,
      downloadCount: 0,
      sales: { orderCount: 0, revenue: 0 },
      isDeleted: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      publishedAt: payload.visible !== false ? timestamp : undefined,
      difficulty: payload.difficulty || 'Standard',
      equations: payload.equations,
      modules: payload.modules,
      questionsCount: payload.questionsCount,
      totalMarks: payload.totalMarks,
      durationMinutes: payload.durationMinutes,
      galleryImages: payload.galleryImages,
    };

    this.itemsStore.set(id, newItem);

    // Audit log
    auditLogService.log({
      action: 'CONTENT_CREATED',
      category: 'content',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: id,
      targetType: 'curriculum_content',
      details: { title, contentType: newItem.contentType, accessType: newItem.accessType },
      status: 'success',
    });

    return newItem;
  }

  /**
   * EDIT CONTENT ITEM
   */
  public updateItem(
    id: string,
    payload: Partial<CmsContentItem>,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): CmsContentItem {
    const existing = this.itemsStore.get(id);
    if (!existing) {
      throw new Error(`Content item with ID "${id}" not found.`);
    }

    const timestamp = new Date().toISOString();
    const updated: CmsContentItem = {
      ...existing,
      ...payload,
      id, // Preserve id
      updatedAt: timestamp,
      accessLabel:
        (payload.accessType ?? existing.accessType) === 'free'
          ? 'Free'
          : (payload.annualPassIncluded ?? existing.annualPassIncluded)
          ? 'Annual Pass'
          : `₹${payload.price ?? existing.price ?? 499}`,
      visibilityStatus: (payload.visible ?? existing.visible) ? 'Visible' : 'Hidden',
    };

    this.itemsStore.set(id, updated);

    // Audit log
    auditLogService.log({
      action: 'CONTENT_UPDATED',
      category: 'content',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: id,
      targetType: 'curriculum_content',
      details: { title: updated.title, changes: Object.keys(payload) },
      status: 'success',
    });

    return updated;
  }

  /**
   * PUBLISH CONTENT ITEM
   */
  public publishItem(
    id: string,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): CmsContentItem {
    const existing = this.itemsStore.get(id);
    if (!existing) throw new Error(`Content item "${id}" not found.`);

    const timestamp = new Date().toISOString();
    existing.visible = true;
    existing.status = 'published';
    existing.visibilityStatus = 'Visible';
    existing.publishedAt = existing.publishedAt || timestamp;
    existing.updatedAt = timestamp;

    this.itemsStore.set(id, existing);

    auditLogService.log({
      action: 'CONTENT_PUBLISHED',
      category: 'content',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: id,
      targetType: 'curriculum_content',
      details: { title: existing.title, publishedAt: existing.publishedAt },
      status: 'success',
    });

    return existing;
  }

  /**
   * HIDE CONTENT ITEM
   */
  public hideItem(
    id: string,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): CmsContentItem {
    const existing = this.itemsStore.get(id);
    if (!existing) throw new Error(`Content item "${id}" not found.`);

    existing.visible = false;
    existing.visibilityStatus = 'Hidden';
    existing.updatedAt = new Date().toISOString();

    this.itemsStore.set(id, existing);

    auditLogService.log({
      action: 'CONTENT_HIDDEN',
      category: 'content',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: id,
      targetType: 'curriculum_content',
      details: { title: existing.title },
      status: 'success',
    });

    return existing;
  }

  /**
   * UNHIDE CONTENT ITEM
   */
  public unhideItem(
    id: string,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): CmsContentItem {
    const existing = this.itemsStore.get(id);
    if (!existing) throw new Error(`Content item "${id}" not found.`);

    existing.visible = true;
    existing.visibilityStatus = 'Visible';
    existing.status = 'published';
    existing.updatedAt = new Date().toISOString();

    this.itemsStore.set(id, existing);

    auditLogService.log({
      action: 'CONTENT_UNHIDDEN',
      category: 'content',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: id,
      targetType: 'curriculum_content',
      details: { title: existing.title },
      status: 'success',
    });

    return existing;
  }

  /**
   * UNPUBLISH CONTENT ITEM (Revert to Draft)
   */
  public unpublishItem(
    id: string,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): CmsContentItem {
    const existing = this.itemsStore.get(id);
    if (!existing) throw new Error(`Content item "${id}" not found.`);

    existing.visible = false;
    existing.status = 'draft';
    existing.visibilityStatus = 'Hidden';
    existing.updatedAt = new Date().toISOString();

    this.itemsStore.set(id, existing);

    auditLogService.log({
      action: 'CONTENT_UNPUBLISHED',
      category: 'content',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: id,
      targetType: 'curriculum_content',
      details: { title: existing.title },
      status: 'success',
    });

    return existing;
  }

  /**
   * SAFE DELETION: Soft-Delete / Archive Content Item
   * Preserves files and metadata. Hides from catalogue immediately.
   */
  public softDeleteItem(
    id: string,
    reason: string,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): CmsContentItem {
    const existing = this.itemsStore.get(id);
    if (!existing) throw new Error(`Content item "${id}" not found.`);

    const timestamp = new Date().toISOString();
    existing.isDeleted = true;
    existing.status = 'archived';
    existing.visible = false;
    existing.visibilityStatus = 'Archived';
    existing.deletedAt = timestamp;
    existing.archivedReason = reason || 'Soft-deleted by administrator to safe archive';
    existing.archivedBy = actor.email;
    existing.updatedAt = timestamp;

    this.itemsStore.set(id, existing);

    // Audit logs for both CONTENT_ARCHIVED and CONTENT_DELETED
    auditLogService.log({
      action: 'CONTENT_ARCHIVED',
      category: 'content',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: id,
      targetType: 'curriculum_content',
      details: {
        title: existing.title,
        reason: existing.archivedReason,
        safeDeletionPolicy: true,
        filesPreserved: true,
      },
      status: 'success',
    });

    auditLogService.log({
      action: 'CONTENT_DELETED',
      category: 'content',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: id,
      targetType: 'curriculum_content',
      details: {
        title: existing.title,
        safeArchive: true,
        reason: existing.archivedReason,
      },
      status: 'success',
    });

    return existing;
  }

  /**
   * RESTORE FROM SAFE ARCHIVE
   */
  public restoreItem(
    id: string,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): CmsContentItem {
    const existing = this.itemsStore.get(id);
    if (!existing) throw new Error(`Content item "${id}" not found.`);

    const timestamp = new Date().toISOString();
    existing.isDeleted = false;
    existing.status = 'draft'; // restored as draft for safety
    existing.visible = false;
    existing.visibilityStatus = 'Hidden';
    existing.restoredAt = timestamp;
    existing.deletedAt = undefined;
    existing.archivedReason = undefined;
    existing.updatedAt = timestamp;

    this.itemsStore.set(id, existing);

    auditLogService.log({
      action: 'CONTENT_RESTORED',
      category: 'content',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: id,
      targetType: 'curriculum_content',
      details: { title: existing.title, restoredAt: timestamp },
      status: 'success',
    });

    return existing;
  }

  /**
   * PERMANENT HARD PURGE (Only executed from Archive tab upon explicit confirmation)
   */
  public purgeItem(
    id: string,
    reason: string,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): { success: boolean; id: string; title: string } {
    const existing = this.itemsStore.get(id);
    if (!existing) throw new Error(`Content item "${id}" not found.`);

    const title = existing.title;
    this.itemsStore.delete(id);

    auditLogService.log({
      action: 'CONTENT_DELETED',
      category: 'content',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: id,
      targetType: 'curriculum_content',
      details: {
        title,
        permanentPurge: true,
        reason: reason || 'Permanently purged from archive',
      },
      status: 'success',
    });

    return { success: true, id, title };
  }

  /**
   * DUPLICATE CONTENT ITEM
   */
  public duplicateItem(
    id: string,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): CmsContentItem {
    const original = this.itemsStore.get(id);
    if (!original) throw new Error(`Source content item "${id}" not found.`);

    const timestamp = new Date().toISOString();
    const suffix = Date.now().toString().slice(-4);
    const newTitle = `${original.title} (Copy)`;
    const newSlug = `${original.slug}-copy-${suffix}`;
    const newId = `cnt-${original.contentType}-${newSlug}`;

    const maxSort = Math.max(0, ...Array.from(this.itemsStore.values()).map((i) => i.sortOrder || 0));

    const clone: CmsContentItem = {
      ...original,
      id: newId,
      title: newTitle,
      slug: newSlug,
      status: 'draft',
      visible: false,
      visibilityStatus: 'Hidden',
      sortOrder: maxSort + 1,
      sourceDriveId: original.sourceDriveId ? `${original.sourceDriveId}_copy` : `1dr_copy_${suffix}`,
      importStatus: 'direct',
      lastSync: timestamp,
      views: 0,
      downloads: 0,
      sales: { orderCount: 0, revenue: 0 },
      isDeleted: false,
      deletedAt: undefined,
      archivedReason: undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
      publishedAt: undefined,
    };

    this.itemsStore.set(newId, clone);

    auditLogService.log({
      action: 'CONTENT_DUPLICATED',
      category: 'content',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: newId,
      targetType: 'curriculum_content',
      details: { originalId: id, originalTitle: original.title, newTitle },
      status: 'success',
    });

    return clone;
  }

  /**
   * FEATURE TOGGLE
   */
  public toggleFeature(
    id: string,
    featured: boolean,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): CmsContentItem {
    const existing = this.itemsStore.get(id);
    if (!existing) throw new Error(`Content item "${id}" not found.`);

    existing.featured = featured;
    existing.updatedAt = new Date().toISOString();
    this.itemsStore.set(id, existing);

    auditLogService.log({
      action: 'CONTENT_UPDATED',
      category: 'content',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: id,
      targetType: 'curriculum_content',
      details: { title: existing.title, featured },
      status: 'success',
    });

    return existing;
  }

  /**
   * REORDER CONTENT ITEMS
   */
  public reorderItems(
    orderMapping: { id: string; sortOrder: number }[],
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): { success: boolean; updatedCount: number } {
    let updatedCount = 0;
    const now = new Date().toISOString();

    orderMapping.forEach(({ id, sortOrder }) => {
      const item = this.itemsStore.get(id);
      if (item) {
        item.sortOrder = sortOrder;
        item.updatedAt = now;
        this.itemsStore.set(id, item);
        updatedCount++;
      }
    });

    auditLogService.log({
      action: 'CONTENT_REORDERED',
      category: 'content',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: 'catalogue_reorder_batch',
      targetType: 'curriculum_content',
      details: { updatedCount, items: orderMapping },
      status: 'success',
    });

    return { success: true, updatedCount };
  }

  /**
   * COUNT CONTENT ITEMS LINKED TO A CATEGORY
   */
  public countItemsWithCategory(categoryIdentifier: string): number {
    const term = categoryIdentifier.toLowerCase().trim();
    let count = 0;
    for (const item of this.itemsStore.values()) {
      if (
        item.categoryId?.toLowerCase() === term ||
        item.subcategoryId?.toLowerCase() === term ||
        item.topic?.toLowerCase() === term ||
        item.id === categoryIdentifier
      ) {
        count++;
      }
    }
    return count;
  }

  /**
   * REASSIGN CATEGORY ACROSS ALL LINKED CONTENT ITEMS
   */
  public reassignCategory(
    oldCategoryTerm: string,
    newCategoryName: string,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): { reassignedCount: number } {
    const oldTerm = oldCategoryTerm.toLowerCase().trim();
    let reassignedCount = 0;
    const now = new Date().toISOString();

    for (const item of this.itemsStore.values()) {
      let modified = false;
      if (item.categoryId?.toLowerCase() === oldTerm) {
        item.categoryId = newCategoryName;
        modified = true;
      }
      if (item.subcategoryId?.toLowerCase() === oldTerm) {
        item.subcategoryId = newCategoryName;
        modified = true;
      }
      if (item.topic?.toLowerCase() === oldTerm) {
        item.topic = newCategoryName;
        modified = true;
      }

      if (modified) {
        item.updatedAt = now;
        this.itemsStore.set(item.id, item);
        reassignedCount++;
      }
    }

    auditLogService.log({
      action: 'CONTENT_UPDATED',
      category: 'content',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: 'category_reassign_batch',
      targetType: 'curriculum_content',
      details: { oldCategory: oldCategoryTerm, newCategory: newCategoryName, reassignedCount },
      status: 'success',
    });

    return { reassignedCount };
  }
}

export const contentCmsManager = new ContentCmsManager();
