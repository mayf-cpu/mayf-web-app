type Storage = { getItem(key: string): string | null; setItem(key: string, value: string): void };
export const bookmarkKey = (uid?: string | null) => uid ? `mayf_bookmarks_user_${encodeURIComponent(uid)}` : 'mayf_bookmarks_guest';
export function readBookmarks(storage: Storage, uid?: string | null): string[] {
  try {
    const items = JSON.parse(storage.getItem(bookmarkKey(uid)) || '[]');
    return Array.isArray(items) ? [...new Set(items.filter(item => typeof item === 'string' && item.length > 0 && item.length <= 200))].slice(0, 500) as string[] : [];
  } catch { return []; }
}
export function writeBookmarks(storage: Storage, items: string[], uid?: string | null) {
  storage.setItem(bookmarkKey(uid), JSON.stringify(items));
}
