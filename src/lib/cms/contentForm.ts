type ContentStatus = 'published' | 'draft' | 'hidden' | 'archived';
/** This form exposes visibility, so its status must agree with that control. */
export function prepareContentMetadata<T extends { visible?: boolean; status?: ContentStatus }>(item: T, isCreating: boolean): Omit<T, 'status'> & { status: ContentStatus } {
  return { ...item, status: item.visible !== false ? 'published' : isCreating ? 'draft' : 'hidden' };
}
