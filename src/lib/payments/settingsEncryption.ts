import crypto from 'node:crypto';
import type { PaymentGatewaySettings } from './types';

const secretFields = ['razorpayKeySecret', 'razorpayWebhookSecret', 'stripeSecretKey', 'stripeWebhookSecret'] as const;
function encryptionKey(): Buffer {
  let account: any = {};
  try { account = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'); } catch { /* validated elsewhere */ }
  const material = process.env.PAYMENT_SETTINGS_ENCRYPTION_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY || account.private_key;
  if (!material && process.env.NODE_ENV === 'production') throw new Error('Payment secret encryption is not configured.');
  return crypto.createHash('sha256').update('mayf:payment-settings:v1\0').update(material || 'local-development-only').digest();
}
/** Credentials are encrypted before persistence and never included in public settings. */
export function sealGatewaySettings(settings: PaymentGatewaySettings): Record<string, any> {
  const publicSettings: Record<string, any> = { ...settings };
  const secrets = Object.fromEntries(secretFields.map(field => { const value = publicSettings[field]; delete publicSettings[field]; return [field, value || '']; }));
  if (!Object.values(secrets).some(Boolean)) return publicSettings;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(secrets), 'utf8'), cipher.final()]);
  return { ...publicSettings, encryptedCredentials: { v: 1, iv: iv.toString('base64'), ciphertext: ciphertext.toString('base64'), tag: cipher.getAuthTag().toString('base64') } };
}
export function openGatewaySettings(data: Record<string, any>): PaymentGatewaySettings {
  const { encryptedCredentials, ...settings } = data;
  // Do not accept plaintext credentials in storage documents.
  for (const field of secretFields) delete settings[field];
  if (!encryptedCredentials) return settings as PaymentGatewaySettings;
  if (encryptedCredentials.v !== 1) throw new Error('Unsupported payment settings version.');
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(encryptedCredentials.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(encryptedCredentials.tag, 'base64'));
    const decoded = Buffer.concat([decipher.update(Buffer.from(encryptedCredentials.ciphertext, 'base64')), decipher.final()]);
    const secrets = JSON.parse(decoded.toString('utf8'));
    return { ...settings, ...Object.fromEntries(secretFields.map(field => [field, secrets[field] || ''])) } as PaymentGatewaySettings;
  } catch { throw new Error('Payment credentials cannot be decrypted. Restore the configured encryption key or reconfigure gateway credentials.'); }
}
