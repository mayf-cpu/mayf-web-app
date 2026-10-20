import type { ContentItem, StudentClass } from '../firebase/types';
import type { QueryDocumentSnapshot } from 'firebase/firestore';
import type { CatalogueFilters, PaginatedResult } from './catalogueService';
export function filterCatalogue(
  records: ContentItem[],
  filters: CatalogueFilters & { search?: string },
  cursor: QueryDocumentSnapshot | null,
  pageSize: number
): PaginatedResult<ContentItem> {
  let filtered = records.filter((item) => item.visible && !(item as any).isDeleted && (!(item as any).status || (item as any).status === 'published'));

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
    filtered = filtered.filter((i) => (i as any).difficulty === filters.difficulty);
  }

  if (filters.featuredOnly) filtered = filtered.filter(item => item.featured);
  if (filters.search?.trim()) {
    const words = filters.search.toLowerCase().trim().split(/\s+/);
    filtered = filtered.filter(item => words.every(word => [item.title, item.shortDescription, item.categoryId, ...(item.tags || [])].join(' ').toLowerCase().includes(word)));
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
