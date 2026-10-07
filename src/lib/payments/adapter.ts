/**
 * Provider-Independent Payment Adapter Interface
 * Maths at Your Fingertips (mayf.co.in)
 */

import {
  PaymentProvider,
  StoredOrder,
  ProviderOrderResult,
  VerifyPaymentRequest,
  WebhookVerificationResult,
} from './types';

export interface PaymentAdapterConfig {
  keyId: string;
  secretKey?: string;
  webhookSecret?: string;
  testMode?: boolean;
}

export interface PaymentProviderAdapter {
  readonly provider: PaymentProvider;

  /**
   * Initializes or updates credentials
   */
  configure(config: PaymentAdapterConfig): void;

  /**
   * Generates gateway-level order / checkout session
   */
  createOrder(order: StoredOrder): Promise<ProviderOrderResult>;

  /**
   * Cryptographically verifies payment signature returned by client
   */
  verifyPaymentSignature(req: VerifyPaymentRequest): Promise<{
    valid: boolean;
    providerPaymentId: string;
    error?: string;
  }>;

  /**
   * Validates authoritative incoming webhook signature and parses payload
   */
  verifyWebhook(
    headers: Record<string, string | string[] | undefined>,
    rawPayload: string | Buffer | Record<string, unknown>
  ): Promise<WebhookVerificationResult>;
}
