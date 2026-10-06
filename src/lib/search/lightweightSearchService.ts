/**
 * Lightweight Firestore & In-Memory Search Engine.
 * 
 * Features:
 * - Normalized search terms array search
 * - Prefix matching for instant autocomplete
 * - Multi-attribute ranking (title > category > tags > body)
 * - ClassLevel and category filtering
 * - Implements the pluggable SearchService interface
 */

import {
  collection,
  query,
  where,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/client';
import { SearchService, SearchQuery, SearchResultItem } from './searchInterface';
import { SEED_CONTENT_ITEMS } from '../catalogue/catalogueService';
import { INITIAL_FORMULAS, INITIAL_CHAPTERS } from '../../data/curriculumData';

/**
 * Normalizes user queries and text strings into clean tokens
 */
export function normalizeSearchTerm(term: string): string {
  return term
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ');
}

export class LightweightSearchService implements SearchService {
  /**
   * Search across content items, formulas, and chapters
   */
  async search(params: SearchQuery): Promise<SearchResultItem[]> {
    const rawQuery = params.query.trim();
    if (!rawQuery) return [];

    const normalized = normalizeSearchTerm(rawQuery);
    const tokens = normalized.split(' ').filter((t) => t.length > 1);
    const maxLimit = params.limit || 15;

    // 1. Try Firestore `searchTerms` array-contains query if live
    try {
      const q = query(
        collection(db, 'contentItems'),
        where('visible', '==', true),
        where('searchTerms', 'array-contains', normalized),
        limit(maxLimit)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title,
            slug: data.slug,
            type: data.contentType === 'formulaSheet' ? 'formula' : 'chapter',
            snippet: data.shortDescription || data.description || '',
            classLevel: data.classLevels?.[0],
            category: data.categoryId,
            accessType: data.accessType || 'free',
            url: data.contentType === 'formulaSheet' ? `/formula/${data.slug}` : `/study/${data.slug}`,
          };
        });
      }
    } catch {
      // Degrade to indexed local token matching
    }

    // 2. Comprehensive in-memory matching with weighted ranking
    const results: { item: SearchResultItem; score: number }[] = [];

    // Search formulas
    for (const f of INITIAL_FORMULAS) {
      if (params.classLevel && !f.applicableClasses.includes(params.classLevel)) {
        continue;
      }
      if (params.categoryId && f.category !== params.categoryId) {
        continue;
      }

      let score = 0;
      const titleLower = f.title.toLowerCase();
      const formulaLower = f.plainTextFormula.toLowerCase();
      const explanationLower = f.explanation.toLowerCase();
      const categoryLower = f.category.toLowerCase();

      if (titleLower.includes(normalized)) score += 10;
      if (formulaLower.includes(normalized)) score += 8;
      if (categoryLower.includes(normalized)) score += 5;
      if (explanationLower.includes(normalized)) score += 2;

      for (const token of tokens) {
        if (titleLower.includes(token)) score += 3;
        if (formulaLower.includes(token)) score += 2;
        if (explanationLower.includes(token)) score += 1;
      }

      if (score > 0) {
        results.push({
          score,
          item: {
            id: f.id,
            title: f.title,
            slug: f.slug,
            type: 'formula',
            snippet: f.explanation,
            classLevel: f.applicableClasses.join(', '),
            category: f.category,
            accessType: f.isProOnly ? 'paid' : 'free',
            url: `/formula/${f.slug}`,
          },
        });
      }
    }

    // Search chapters
    for (const ch of INITIAL_CHAPTERS) {
      if (params.classLevel && ch.classLevel !== params.classLevel) {
        continue;
      }
      if (params.categoryId && ch.category !== params.categoryId) {
        continue;
      }

      let score = 0;
      const titleLower = ch.title.toLowerCase();
      const descLower = ch.description.toLowerCase();
      const categoryLower = ch.category.toLowerCase();

      if (titleLower.includes(normalized)) score += 10;
      if (categoryLower.includes(normalized)) score += 5;
      if (descLower.includes(normalized)) score += 2;

      for (const token of tokens) {
        if (titleLower.includes(token)) score += 3;
        if (descLower.includes(token)) score += 1;
      }

      if (score > 0) {
        results.push({
          score,
          item: {
            id: ch.id,
            title: ch.title,
            slug: ch.slug,
            type: 'chapter',
            snippet: ch.description,
            classLevel: ch.classLevel,
            category: ch.category,
            accessType: ch.isFreePreview ? 'free' : 'paid',
            url: `/study/${ch.slug}`,
          },
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, maxLimit).map((r) => r.item);
  }

  /**
   * Fast prefix autocomplete
   */
  async autocomplete(prefix: string, maxResults: number = 6): Promise<string[]> {
    const clean = prefix.toLowerCase().trim();
    if (clean.length < 2) return [];

    const suggestions = new Set<string>();

    for (const item of SEED_CONTENT_ITEMS) {
      if (item.title.toLowerCase().startsWith(clean)) {
        suggestions.add(item.title);
      }
      for (const tag of item.tags || []) {
        if (tag.toLowerCase().startsWith(clean)) {
          suggestions.add(tag);
        }
      }
      if (suggestions.size >= maxResults) break;
    }

    // Fallback to substring if prefix matches are fewer than 3
    if (suggestions.size < 3) {
      for (const item of SEED_CONTENT_ITEMS) {
        if (item.title.toLowerCase().includes(clean)) {
          suggestions.add(item.title);
        }
        if (suggestions.size >= maxResults) break;
      }
    }

    return Array.from(suggestions).slice(0, maxResults);
  }
}

// Export default singleton instance of SearchService
export const searchService: SearchService = new LightweightSearchService();
