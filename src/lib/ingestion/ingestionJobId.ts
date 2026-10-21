import crypto from 'node:crypto';

/** Stable, Firestore-safe ID so parallel workers cannot create duplicate jobs for one content item. */
export function ingestionJobIdForContent(contentId: string): string {
  if (typeof contentId !== 'string' || !contentId.trim() || contentId.length > 512) {
    throw new Error('Invalid import content ID');
  }
  return 'job-' + crypto.createHash('sha256').update(contentId.trim()).digest('hex');
}
