/** Imported file metadata must never silently override admin publication controls. */
export function importPublicationPolicy(previous: Record<string, any>, exists: boolean, requestedVisible: boolean) {
  const restricted = exists && (previous.isDeleted === true ||
    previous.status === 'archived' || previous.status === 'hidden' ||
    previous.status === 'draft' || previous.visible === false);
  const publish = requestedVisible && !restricted;
  return {
    status: restricted && typeof previous.status === 'string' ? previous.status : (publish ? 'published' : 'hidden'),
    isDeleted: previous.isDeleted === true,
    visibilityStatus: publish ? 'Visible' : (previous.visibilityStatus === 'Archived' ? 'Archived' : 'Hidden'),
    visible: publish,
  };
}
