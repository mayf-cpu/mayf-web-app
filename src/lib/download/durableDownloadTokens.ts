/** Durable short-lived download authorization in Cloudflare R2.
 * Per-token conditional writes prevent concurrent single-use redemption.
 */
export interface TokenObject {
  text(): Promise<string>;
}
export interface TokenBucket {
  put(key: string, value: string, options?: { onlyIf?: { etagDoesNotMatch?: string; etagMatches?: string }; customMetadata?: Record<string,string> }): Promise<unknown>;
  get(key: string): Promise<(TokenObject & { etag?: string }) | null>;
  delete(key: string): Promise<void>;
}
export type StoredDownloadToken = {
  contentId: string; fileName: string; accessType: 'free' | 'paid'; uid: string | null;
  clientIpHash: string; expiresAt: number;
};
let bucket: TokenBucket | null = null;
export function configureDownloadTokenBucket(value: TokenBucket | null) { bucket = value; }
export function downloadTokenStoreReady(): boolean { return bucket !== null; }
function key(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error('Invalid download token');
  return 'download-tokens/' + token;
}
export async function createDownloadToken(token: string, record: StoredDownloadToken): Promise<void> {
  if (!bucket) throw new Error('Download token storage unavailable');
  if (!Number.isFinite(record.expiresAt) || record.expiresAt <= Date.now()) throw new Error('Invalid expiration');
  // Token IDs are random and collision-resistant; conditional create avoids overwrites.
  await bucket.put(key(token), JSON.stringify(record), { onlyIf: { etagDoesNotMatch: '*' } });
}
export async function readDownloadToken(token: string): Promise<StoredDownloadToken | null> {
  if (!bucket) return null;
  const stored = await bucket.get(key(token));
  if (!stored) return null;
  const record = JSON.parse(await stored.text()) as StoredDownloadToken;
  if (!record || !Number.isFinite(record.expiresAt) || record.expiresAt <= Date.now()) return null;
  return record;
}
