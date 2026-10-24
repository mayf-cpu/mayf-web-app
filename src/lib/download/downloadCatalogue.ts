export interface DownloadCard {
  id: string; title: string; classLevel: string; fileSize: string; pages?: number; category: string; description: string;
}
/** Published CMS records supply IDs; never invent downloadable sample resources. */
export function downloadCards(items: unknown): DownloadCard[] {
  if (!Array.isArray(items)) throw new Error('Invalid download catalogue response');
  return items.filter(item => item && typeof item.id === 'string' && typeof item.title === 'string' &&
    item.visible === true && item.status === 'published' && !item.isDeleted && item.contentType === 'pdf' &&
    item.downloadAllowed === true).map(item => ({ id: item.id, title: item.title,
      classLevel: Array.isArray(item.classLevels) ? item.classLevels.filter((value: unknown) => typeof value === 'string').join(', ') : '',
      fileSize: 'PDF', category: typeof item.categoryId === 'string' ? item.categoryId : 'Study material',
      description: typeof item.shortDescription === 'string' ? item.shortDescription : '' }));
}
