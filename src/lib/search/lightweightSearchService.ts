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

import { SearchService, SearchQuery, SearchResultItem } from './searchInterface';
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

    const response = await fetch(`/api/catalogue?${new URLSearchParams({ search: rawQuery, classLevel: params.classLevel || 'All', categoryId: params.categoryId || 'All', pageSize: String(Math.min(20, maxLimit)) })}`);
    const catalogue = await response.json();
    if (!response.ok) throw new Error(catalogue.error || 'Search unavailable');
    const results: { item: SearchResultItem; score: number }[] = catalogue.items.map((item: any) => ({
      score: 15, item: { id: item.id, title: item.title, slug: item.slug, type: 'chapter', snippet: item.shortDescription || '', classLevel: item.classLevels?.[0], category: item.categoryId, accessType: item.accessType, url: `/study/${item.slug}` },
    }));

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

    const response = await fetch(`/api/catalogue?search=${encodeURIComponent(clean)}&pageSize=20`);
    const data = await response.json();
    if (!response.ok) return [];
    const items = data.items || [];
    const suggestions = new Set<string>();

    for (const item of items) {
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
      for (const item of items) {
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
