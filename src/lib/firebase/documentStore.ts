/** Minimal Firestore document operations over HTTPS, usable by Node and Workers. */
type Value = Record<string, unknown>;
export function encodeValue(value: unknown): Value {
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number' && Number.isFinite(value)) return Number.isInteger(value)
    ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  if (value && typeof value === 'object') return { mapValue: { fields: encodeFields(value as Record<string, unknown>) } };
  throw new Error('Unsupported Firestore document value');
}
function encodeFields(data: Record<string, unknown>): Record<string, Value> {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined).map(([k, v]) => [k, encodeValue(v)]));
}
export function decodeValue(value: any): any {
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in value) return decodeFields(value.mapValue.fields || {});
  throw new Error('Unsupported Firestore value type');
}
function decodeFields(fields: Record<string, Value>): Record<string, any> {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, decodeValue(v)]));
}
export class FirestoreDocumentStore {
  constructor(private projectId: string, private accessToken: () => Promise<string>) {}
  private get baseUrl() { return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(this.projectId)}/databases/(default)/documents`; }
  async list(collectionId: string): Promise<{ id: string; data: Record<string, any>; updateTime: string }[]> {
    if (!collectionId || collectionId.includes('/')) throw new Error('Invalid collection ID');
    const documents: { id: string; data: Record<string, any>; updateTime: string }[] = [];
    let pageToken = '';
    do {
      const query = new URLSearchParams({ pageSize: '300' });
      if (pageToken) query.set('pageToken', pageToken);
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(collectionId)}?${query}`, {
        headers: { Authorization: `Bearer ${await this.accessToken()}` }, signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error(`Firestore list failed (${response.status})`);
      const page = await response.json() as any;
      for (const doc of page.documents || []) documents.push({ id: decodeURIComponent(doc.name.split('/').pop()), data: decodeFields(doc.fields || {}), updateTime: doc.updateTime });
      pageToken = page.nextPageToken || '';
    } while (pageToken);
    return documents;
  }
  /** Server-side equality query; never fetch every student's documents for access checks. */
  async queryEqual(collectionId: string, field: string, value: string): Promise<{ id: string; data: Record<string, any>; updateTime: string }[]> {
    if (!collectionId || collectionId.includes('/') || !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field) ||
        !value?.trim()) throw new Error('Invalid Firestore query');
    const response = await fetch(this.baseUrl + ':runQuery', {
      method: 'POST',
      headers: { Authorization: `Bearer ${await this.accessToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ structuredQuery: {
        from: [{ collectionId }],
        where: { fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: { stringValue: value } } },
      } }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`Firestore query failed (${response.status})`);
    const results = await response.json() as any[];
    return results.filter(row => row.document).map(row => ({
      id: decodeURIComponent(row.document.name.split('/').pop()),
      data: decodeFields(row.document.fields || {}),
      updateTime: row.document.updateTime,
    }));
  }
  async commit(changes: { collection: string; id: string; data?: Record<string, any>; updateTime?: string; updateMask?: string[] }[]): Promise<void> {
    if (!changes.length) return;
    if (changes.length > 450) throw new Error('Too many catalogue changes in one operation');
    const writes = changes.map(change => {
      if (!change.collection || !change.id || change.collection.includes('/') || change.id.includes('/')) throw new Error('Invalid document path');
      const name = `projects/${this.projectId}/databases/(default)/documents/${change.collection}/${change.id}`;
      return {
        ...(change.data === undefined ? { delete: name } : { update: { name, fields: encodeFields(change.data) } }),
        ...(change.data !== undefined && change.updateMask ? { updateMask: { fieldPaths: change.updateMask } } : {}),
        currentDocument: change.updateTime ? { updateTime: change.updateTime } : { exists: false },
      };
    });
    const response = await fetch(`${this.baseUrl}:commit`, {
      method: 'POST', headers: { Authorization: `Bearer ${await this.accessToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ writes }), signal: AbortSignal.timeout(10000),
    });
    if (response.status === 409 || response.status === 412) throw new Error('Another administrator changed this data. Refresh and retry.');
    if (!response.ok) throw new Error(`Firestore commit failed (${response.status})`);
  }

  collection(collectionId: string) {
    if (!collectionId || collectionId.includes('/')) throw new Error('Invalid collection ID');
    return { doc: (documentId: string) => {
      if (!documentId || documentId.includes('/')) throw new Error('Invalid document ID');
      const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(this.projectId)}/databases/(default)/documents/${encodeURIComponent(collectionId)}/${encodeURIComponent(documentId)}`;
      const request = async (method: string, data?: Record<string, unknown>, precondition?: { updateTime?: string; exists?: boolean }) => fetch(url + (precondition ? '?' + new URLSearchParams(precondition.updateTime ? { 'currentDocument.updateTime': precondition.updateTime } : { 'currentDocument.exists': String(precondition.exists ?? false) }) : ''), {
        method,
        headers: { Authorization: `Bearer ${await this.accessToken()}`, 'Content-Type': 'application/json' },
        ...(data === undefined ? {} : { body: JSON.stringify({ fields: encodeFields(data) }) }),
        signal: AbortSignal.timeout(10000),
      });
      return {
        get: async () => {
          const response = await request('GET');
          if (response.status === 404) return { exists: false, updateTime: undefined as string | undefined, data: () => undefined };
          if (!response.ok) throw new Error(`Firestore read failed (${response.status})`);
          const data = await response.json() as { fields?: Record<string, Value>; updateTime?: string };
          return { exists: true, updateTime: data.updateTime, data: () => decodeFields(data.fields || {}) };
        },
        set: async (data: Record<string, any>, precondition?: { updateTime?: string; exists?: boolean }) => {
          const response = await request('PATCH', data, precondition);
          if (!response.ok) throw new Error(`Firestore write failed (${response.status})`);
        },
      };
    }};
  }
}
