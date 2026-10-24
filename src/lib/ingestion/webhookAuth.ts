import { timingSafeEqual } from 'node:crypto';

/**
 * External Apps Script import bearer authentication. A publicly documented
 * example must never become an active credential when the secret is missing.
 */
export function verifyWebhookSecret(authHeader: string | undefined): boolean {
  const secret = process.env.INGESTION_WEBHOOK_SECRET;
  if (!secret || secret.length < 32 || secret.trim() !== secret ||
      secret.includes('change_in_production')) return false;
  const match = /^Bearer ([^\s]+)$/i.exec(authHeader || '');
  if (!match) return false;
  const expected = Buffer.from(secret, 'utf8');
  const provided = Buffer.from(match[1], 'utf8');
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}
