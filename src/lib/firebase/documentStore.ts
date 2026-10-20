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
  collection(collectionId: string) {
    if (!collectionId || collectionId.includes('/')) throw new Error('Invalid collection ID');
    return { doc: (documentId: string) => {
      if (!documentId || documentId.includes('/')) throw new Error('Invalid document ID');
      const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(this.projectId)}/databases/(default)/documents/${encodeURIComponent(collectionId)}/${encodeURIComponent(documentId)}`;
      const request = async (method: string, data?: Record<string, unknown>) => fetch(url, {
        method,
        headers: { Authorization: `Bearer ${await this.accessToken()}`, 'Content-Type': 'application/json' },
        ...(data === undefined ? {} : { body: JSON.stringify({ fields: encodeFields(data) }) }),
        signal: AbortSignal.timeout(10000),
      });
      return {
        get: async () => {
          const response = await request('GET');
          if (response.status === 404) return { exists: false, data: () => undefined };
          if (!response.ok) throw new Error(`Firestore read failed (${response.status})`);
          const data = await response.json() as { fields?: Record<string, Value> };
          return { exists: true, data: () => decodeFields(data.fields || {}) };
        },
        set: async (data: Record<string, any>) => {
          const response = await request('PATCH', data);
          if (!response.ok) throw new Error(`Firestore write failed (${response.status})`);
        },
      };
    }};
  }
}
