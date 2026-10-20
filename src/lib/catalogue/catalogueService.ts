/**
 * Educational Content Catalogue Service for Maths at Your Fingertips.
 * 
 * CORE ARCHITECTURAL DIRECTIVES:
 * 1. Free study material is accessible 100% WITHOUT authentication.
 * 2. Efficient database cursor queries (never loads entire catalogue into browser memory).
 * 3. Maximum page size hard-capped at 20 documents.
 * 4. Uses Firestore cursors (startAfter) for next-page pagination.
 * 5. Full support for sorting: latest, popular, most viewed, A-Z.
 * 6. Multi-format content viewers: PDF, multi-image, single image, HTML5 video, YouTube, Facebook, Test Papers, Courses.
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../firebase/client';
import { ContentItem, StudentClass, ContentAccessType, ContentType } from '../firebase/types';
import { ParsedUserEntitlements } from '../firebase/authClaims';
import { INITIAL_CHAPTERS, INITIAL_FORMULAS } from '../../data/curriculumData';

export type CatalogueSortOption = 'latest' | 'popular' | 'most_viewed' | 'alpha';
export type DifficultyLevel = 'Foundation' | 'Standard' | 'Exemplar / Board';

export interface CatalogueFilters {
  classLevel?: StudentClass | 'All';
  categoryId?: string | 'All';
  subcategoryId?: string | 'All';
  accessType?: ContentAccessType | 'All';
  contentType?: ContentType | 'All';
  difficulty?: DifficultyLevel | 'All';
  featuredOnly?: boolean;
  sortBy?: CatalogueSortOption;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: QueryDocumentSnapshot | null;
  hasMore: boolean;
  totalLoaded: number;
}

export const MAX_PAGE_SIZE = 20;

/**
 * Rich, production-quality Seed Content covering all supported formats
 */
export { SEED_CONTENT_ITEMS } from './seedContent';
import { SEED_CONTENT_ITEMS } from './seedContent';

/**
 * Fetch paginated content items using Firestore queries and cursors.
 * Hard limits page size to at most 20 documents.
 */
export async function fetchContentCatalogue(
  filters: CatalogueFilters = {},
  cursor: QueryDocumentSnapshot | null = null,
  requestedPageSize: number = MAX_PAGE_SIZE
): Promise<PaginatedResult<ContentItem>> {
  const pageSize = Math.min(Math.max(1, requestedPageSize), MAX_PAGE_SIZE);

  try {
    const constraints: QueryConstraint[] = [where('visible', '==', true)];

    if (filters.classLevel && filters.classLevel !== 'All') {
      constraints.push(where('classLevels', 'array-contains', filters.classLevel));
    }

    if (filters.categoryId && filters.categoryId !== 'All') {
      constraints.push(where('categoryId', '==', filters.categoryId));
    }

    if (filters.accessType && filters.accessType !== 'All') {
      constraints.push(where('accessType', '==', filters.accessType));
    }

    if (filters.contentType && filters.contentType !== 'All') {
      constraints.push(where('contentType', '==', filters.contentType));
    }

    // Determine sorting field based on user choice
    const sortBy = filters.sortBy || 'latest';
    switch (sortBy) {
      case 'popular':
        constraints.push(orderBy('downloadCount', 'desc'));
        break;
      case 'most_viewed':
        constraints.push(orderBy('viewCount', 'desc'));
        break;
      case 'alpha':
        constraints.push(orderBy('title', 'asc'));
        break;
      case 'latest':
      default:
        constraints.push(orderBy('publishedAt', 'desc'));
        break;
    }

    if (cursor) {
      constraints.push(startAfter(cursor));
    }

    constraints.push(limit(pageSize));

    const contentQuery = query(collection(db, 'contentItems'), ...constraints);
    const snapshot = await getDocs(contentQuery);

    if (snapshot.empty && !cursor) {
      return getLocalFilteredResults(filters, cursor, pageSize);
    }

    const items: ContentItem[] = snapshot.docs.map((d) => ({
      ...(d.data() as ContentItem),
      id: d.id,
    }));

    const nextDoc = snapshot.docs.length === pageSize ? snapshot.docs[snapshot.docs.length - 1] : null;

    return {
      items,
      nextCursor: nextDoc,
      hasMore: snapshot.docs.length === pageSize,
      totalLoaded: items.length,
    };
  } catch (error) {
    console.warn('[MAYF Catalogue] Firestore query note, using offline indexed catalog:', error);
    return getLocalFilteredResults(filters, cursor, pageSize);
  }
}

/**
 * Fetch single content item by slug
 */
export async function fetchContentItemBySlug(slug: string): Promise<ContentItem | null> {
  try {
    const q = query(
      collection(db, 'contentItems'),
      where('slug', '==', slug),
      where('visible', '==', true),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { ...(d.data() as ContentItem), id: d.id };
    }
  } catch (err) {
    console.warn('[MAYF Catalogue] Fetch by slug falling back to seed items');
  }

  const found = SEED_CONTENT_ITEMS.find((item) => item.slug === slug);
  return found || null;
}

/**
 * Access Control Evaluator (IMPORTANT LOGIN RULE ENFORCEMENT)
 * - Free study material is 100% accessible WITHOUT authentication.
 * - Paid content requires authentication + Pro or Annual Pass claims.
 */
export function checkUserCanAccessItem(
  item: ContentItem,
  entitlements: ParsedUserEntitlements | null
): { canAccess: boolean; requiresAuth: boolean; reason?: string } {
  // Free material rule: 100% accessible anonymously
  if (item.accessType === 'free') {
    return { canAccess: true, requiresAuth: false };
  }

  // Paid material: Authentication is strictly required
  if (!entitlements) {
    return {
      canAccess: false,
      requiresAuth: true,
      reason: 'Please log in to access this premium study material.',
    };
  }

  if (entitlements.isAdmin || entitlements.isSuperAdmin) {
    return { canAccess: true, requiresAuth: true };
  }

  if (entitlements.hasAnnualPass && item.annualPassIncluded !== false) {
    return { canAccess: true, requiresAuth: true };
  }

  if (entitlements.isPro) {
    return { canAccess: true, requiresAuth: true };
  }

  return {
    canAccess: false,
    requiresAuth: true,
    reason: 'This premium resource requires the Maths at Your Fingertips Annual Pass.',
  };
}

/**
 * Local fallback paginator honoring the max 20 page size and sorting modes
 */
function getLocalFilteredResults(
  filters: CatalogueFilters,
  cursor: QueryDocumentSnapshot | null,
  pageSize: number
): PaginatedResult<ContentItem> {
  let filtered = SEED_CONTENT_ITEMS.filter((item) => item.visible);

  if (filters.classLevel && filters.classLevel !== 'All') {
    filtered = filtered.filter((i) => i.classLevels.includes(filters.classLevel as StudentClass));
  }
  if (filters.categoryId && filters.categoryId !== 'All') {
    filtered = filtered.filter((i) => i.categoryId === filters.categoryId);
  }
  if (filters.subcategoryId && filters.subcategoryId !== 'All') {
    filtered = filtered.filter((i) => i.subcategoryId === filters.subcategoryId);
  }
  if (filters.accessType && filters.accessType !== 'All') {
    filtered = filtered.filter((i) => i.accessType === filters.accessType);
  }
  if (filters.contentType && filters.contentType !== 'All') {
    filtered = filtered.filter((i) => i.contentType === filters.contentType);
  }
  if (filters.difficulty && filters.difficulty !== 'All') {
    filtered = filtered.filter((i) => i.difficulty === filters.difficulty);
  }

  // Sorting
  const sortBy = filters.sortBy || 'latest';
  switch (sortBy) {
    case 'popular':
      filtered.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
      break;
    case 'most_viewed':
      filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
      break;
    case 'alpha':
      filtered.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'latest':
    default:
      filtered.sort(
        (a, b) =>
          new Date(b.publishedAt || b.createdAt).getTime() -
          new Date(a.publishedAt || a.createdAt).getTime()
      );
      break;
  }

  let startIndex = 0;
  if (cursor) {
    if (typeof (cursor as any).offset === 'number') {
      startIndex = (cursor as any).offset;
    } else if ((cursor as any).id) {
      const idx = filtered.findIndex((i) => i.id === (cursor as any).id);
      if (idx !== -1) startIndex = idx + 1;
    }
  }

  const items = filtered.slice(startIndex, startIndex + pageSize);
  const nextOffset = startIndex + items.length;
  const hasMore = nextOffset < filtered.length;
  const nextCursor = hasMore ? ({ id: items[items.length - 1]?.id, offset: nextOffset } as any) : null;

  return {
    items,
    nextCursor,
    hasMore,
    totalLoaded: items.length,
  };
}
