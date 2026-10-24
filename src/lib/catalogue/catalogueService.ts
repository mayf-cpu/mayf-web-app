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

import { auth } from '../firebase/client';
import type { QueryDocumentSnapshot } from 'firebase/firestore';
import { ContentItem, StudentClass, ContentAccessType, ContentType } from '../firebase/types';
import { ParsedUserEntitlements } from '../firebase/authClaims';
import { INITIAL_CHAPTERS, INITIAL_FORMULAS } from '../../data/curriculumData';

export type CatalogueSortOption = 'latest' | 'popular' | 'most_viewed' | 'alpha';
export type DifficultyLevel = 'Foundation' | 'Standard' | 'Exemplar / Board';

export interface CatalogueFilters {
  search?: string;
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
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value !== undefined) params.set(key, String(value));
  params.set('pageSize', String(Math.min(Math.max(1, requestedPageSize), MAX_PAGE_SIZE)));
  if (cursor) params.set('offset', String((cursor as any).offset || 0));
  const response = await fetch(`/api/catalogue?${params}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Unable to load study material');
  return data;
}

export async function fetchContentItemBySlug(slug: string): Promise<ContentItem | null> {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  const response = await fetch(`/api/catalogue/by-slug/${encodeURIComponent(slug)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (response.status === 404) return null;
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Unable to load this resource');
  return data.item;
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
