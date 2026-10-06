import { StudentClass } from '../firebase/types';

export interface SearchQuery {
  query: string;
  classLevel?: StudentClass;
  categoryId?: string;
  limit?: number;
}

export interface SearchResultItem {
  id: string;
  title: string;
  slug: string;
  type: 'chapter' | 'formula' | 'content';
  snippet: string;
  classLevel?: string;
  category?: string;
  accessType: 'free' | 'paid';
  url: string;
}

/**
 * Universal Search Service Interface.
 * Allows transparent migration to Firestore Enterprise Full-Text Search,
 * Algolia, or Elasticsearch without rewriting UI components.
 */
export interface SearchService {
  search(params: SearchQuery): Promise<SearchResultItem[]>;
  autocomplete(prefix: string, maxResults?: number): Promise<string[]>;
}
