/**
 * Educational Content Catalogue Service for Maths at Your Fingertips.
 * 
 * CORE ARCHITECTURAL DIRECTIVES:
 * 1. Free study material is accessible 100% WITHOUT authentication.
 * 2. Efficient database cursor queries (never loads entire catalogue into browser memory).
 * 3. Maximum page size hard-capped at 20 documents.
 * 4. Uses Firestore cursors (startAfter) for next-page pagination.
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  getDoc,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  QueryConstraint,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/client';
import { ContentItem, StudentClass, ContentAccessType, ContentType } from '../firebase/types';
import { ParsedUserEntitlements } from '../firebase/authClaims';
import { INITIAL_CHAPTERS, INITIAL_FORMULAS } from '../../data/curriculumData';

export interface CatalogueFilters {
  classLevel?: StudentClass | 'All';
  categoryId?: string | 'All';
  accessType?: ContentAccessType | 'All';
  contentType?: ContentType | 'All';
  featuredOnly?: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: QueryDocumentSnapshot | null;
  hasMore: boolean;
  totalLoaded: number;
}

export const MAX_PAGE_SIZE = 20;

/**
 * Maps static initial curriculum data to complete ContentItem format for initial seeding/fallback
 */
export const SEED_CONTENT_ITEMS: ContentItem[] = [
  ...INITIAL_CHAPTERS.map((ch, idx) => ({
    id: ch.id,
    title: ch.title,
    slug: ch.slug,
    shortDescription: ch.description,
    description: `${ch.description}\n\nLearning Outcomes:\n${ch.learningOutcomes.join('\n')}\n\nKey Theorems:\n${ch.keyTheorems.join('\n')}`,
    classLevels: [ch.classLevel],
    categoryId: ch.category,
    topic: ch.category,
    contentType: 'course' as ContentType,
    thumbnail: `/assets/math_chapter_${idx + 1}.png`,
    accessType: (ch.isFreePreview ? 'free' : 'paid') as ContentAccessType,
    price: ch.isFreePreview ? 0 : 299,
    currency: 'INR' as const,
    annualPassIncluded: true,
    downloadAllowed: true,
    visible: true,
    featured: idx < 3,
    trending: idx === 0,
    tags: [ch.category, ch.classLevel, 'CBSE', 'ICSE'],
    searchTerms: [
      ch.title.toLowerCase(),
      ch.slug.toLowerCase(),
      ch.category.toLowerCase(),
      ch.classLevel.toLowerCase(),
      ...ch.keyTheorems.map((t) => t.toLowerCase()),
    ],
    sortOrder: ch.orderIndex,
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    publishedAt: '2026-04-01T00:00:00.000Z',
    viewCount: 1420 + idx * 85,
    downloadCount: 320 + idx * 40,
  })),
  ...INITIAL_FORMULAS.map((f, idx) => ({
    id: f.id,
    title: f.title,
    slug: f.slug,
    shortDescription: f.explanation,
    description: `${f.explanation}\n\nFormula: ${f.plainTextFormula}\n\nVariables:\n${f.variables.map((v) => `${v.symbol}: ${v.meaning}`).join('\n')}`,
    classLevels: f.applicableClasses,
    categoryId: f.category,
    topic: f.category,
    contentType: 'formulaSheet' as ContentType,
    thumbnail: `/assets/formula_${f.watermarkGlyph}.png`,
    accessType: (f.isProOnly ? 'paid' : 'free') as ContentAccessType,
    price: f.isProOnly ? 99 : 0,
    currency: 'INR' as const,
    annualPassIncluded: true,
    downloadAllowed: true,
    visible: true,
    featured: true,
    tags: ['Formula', f.category, ...f.applicableClasses],
    searchTerms: [
      f.title.toLowerCase(),
      f.slug.toLowerCase(),
      f.plainTextFormula.toLowerCase(),
      f.category.toLowerCase(),
      ...f.applicableClasses.map((c) => c.toLowerCase()),
    ],
    sortOrder: 100 + idx,
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    publishedAt: '2026-04-01T00:00:00.000Z',
    viewCount: 2310 + idx * 110,
    downloadCount: 890 + idx * 60,
  })),
];

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

    constraints.push(orderBy('sortOrder', 'asc'));

    if (cursor) {
      constraints.push(startAfter(cursor));
    }

    constraints.push(limit(pageSize));

    const contentQuery = query(collection(db, 'contentItems'), ...constraints);
    const snapshot = await getDocs(contentQuery);

    if (snapshot.empty && !cursor) {
      // Return seeded local catalog if database collection is empty
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
    console.warn('[MAYF Catalogue] Firestore query note, using offline fallback:', error);
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

  // Fallback to in-memory items
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
  // Free material rule
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

  // If user has Annual Pass or Pro or Admin
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
 * Local fallback paginator honoring the max 20 page size
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
  if (filters.accessType && filters.accessType !== 'All') {
    filtered = filtered.filter((i) => i.accessType === filters.accessType);
  }
  if (filters.contentType && filters.contentType !== 'All') {
    filtered = filtered.filter((i) => i.contentType === filters.contentType);
  }

  const items = filtered.slice(0, pageSize);
  return {
    items,
    nextCursor: null,
    hasMore: filtered.length > pageSize,
    totalLoaded: items.length,
  };
}
