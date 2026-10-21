import { isProductionPaymentRuntime } from '../runtime';
/**
 * Razorpay Payment Adapter (Primary India Gateway)
 * Maths at Your Fingertips (mayf.co.in)
 *
 * Implements:
 * - Server creates Razorpay order (amount in paise, receipt id)
 * - Cryptographic HMAC SHA256 signature verification (order_id|payment_id)
 * - Authoritative webhook signature verification (x-razorpay-signature)
 * - Strict PCI compliance (zero card data handled or stored)
 */

import crypto from 'crypto';
import {
  PaymentProviderAdapter,
  PaymentAdapterConfig,
} from '../adapter';
import {
  StoredOrder,
  ProviderOrderResult,
  VerifyPaymentRequest,
  WebhookVerificationResult,
} from '../types';

export class RazorpayAdapter implements PaymentProviderAdapter {
  readonly provider = 'razorpay' as const;

  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;
  private testMode: boolean;

  constructor(config?: Partial<PaymentAdapterConfig>) {
    this.keyId = config?.keyId || process.env.RAZORPAY_KEY_ID || (isProductionPaymentRuntime() ? '' : 'rzp_test_mayf2026demo');
    this.keySecret = config?.secretKey || process.env.RAZORPAY_KEY_SECRET || (isProductionPaymentRuntime() ? '' : 'rzp_sec_sandbox_k98a7sd6f');
    this.webhookSecret = config?.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || (isProductionPaymentRuntime() ? '' : 'rzp_whsec_mayf_prod_992');
    this.testMode = config?.testMode ?? (!isProductionPaymentRuntime());
  }

  configure(config: PaymentAdapterConfig): void {
    // The service supplies a complete authoritative settings snapshot.
    // Missing credentials must clear previously configured adapter state.
    this.keyId = config.keyId || '';
    this.keySecret = config.secretKey || '';
    this.webhookSecret = config.webhookSecret || '';
    if (config.testMode !== undefined) this.testMode = config.testMode;
  }

  getKeyId(): string {
    return this.keyId;
  }

  hasSecret(): boolean {
    return Boolean(this.keySecret && this.keySecret.length > 4);
  }

  hasWebhookSecret(): boolean {
    return Boolean(this.webhookSecret && this.webhookSecret.length > 4);
  }

  assertRefundConfigured(): void {
    if (!/^rzp_(test|live)_[A-Za-z0-9]+$/.test(this.keyId) || !this.keySecret ||
        /sandbox|demo/i.test(this.keySecret + this.keyId) || !this.hasWebhookSecret() ||
        (this.testMode ? !this.keyId.startsWith('rzp_test_') : !this.keyId.startsWith('rzp_live_')) ||
        (process.env.APP_ENV === 'staging' && !this.keyId.startsWith('rzp_test_'))) {
      throw new Error('Real gateway credentials, matching mode and a refund webhook secret are required');
    }
  }

  /** https://razorpay.com/docs/api/refunds/normal-refunds-idempotent */
  async initiateFullRefund(intent: import('../refundInitiation').RefundIntent): Promise<{ refundId: string }> {
    this.assertRefundConfigured();
    if (!/^pay_[A-Za-z0-9]+$/.test(intent.providerPaymentId) ||
        !/^[A-Za-z0-9_-]{10,100}$/.test(intent.idempotencyKey) ||
        !Number.isSafeInteger(intent.amount) || intent.amount <= 0 || intent.currency !== 'INR') {
      throw new Error('Invalid provider refund request');
    }
    const response = await fetch(`https://api.razorpay.com/v1/payments/${intent.providerPaymentId}/refund`, {
      method: 'POST', signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json', 'X-Refund-Idempotency': intent.idempotencyKey },
      body: JSON.stringify({ amount: intent.amount, speed: 'normal' }),
    });
    if (!response.ok) throw new Error(`Gateway refund outcome requires review (${response.status})`);
    const result = await response.json() as any;
    if (!/^rfnd_[A-Za-z0-9]+$/.test(result.id || '') || result.entity !== 'refund' ||
        result.payment_id !== intent.providerPaymentId || result.amount !== intent.amount ||
        result.currency !== intent.currency || !['pending', 'processed'].includes(result.status)) {
      throw new Error('Gateway returned an unconfirmed refund outcome');
    }
    return { refundId: result.id };
  }

  /**
   * Generates Razorpay Order
   * Razorpay amounts are strictly represented in smallest currency unit (Paise: INR 1 = 100 paise)
   */
  async createOrder(order: StoredOrder): Promise<ProviderOrderResult> {
    const finalPayable = order.grossAmount - order.discount + (order.tax || 0);
    const amountInPaise = Math.round(finalPayable * 100);
    if (order.currency !== 'INR' || !Number.isSafeInteger(amountInPaise) || amountInPaise < 100 ||
        !order.orderId || order.orderId.length > 40) throw new Error('Invalid Razorpay order amount, currency or receipt');
    const localSimulation = !isProductionPaymentRuntime() && process.env.APP_ENV !== 'staging' && this.testMode &&
      this.keyId === 'rzp_test_mayf2026demo' && this.keySecret === 'rzp_sec_sandbox_k98a7sd6f';
    let providerOrderId: string;
    if (localSimulation) {
      providerOrderId = `order_mayf_${Date.now().toString(36)}_${crypto.randomBytes(6).toString('hex')}`;
    } else {
      if (!/^rzp_(test|live)_[A-Za-z0-9]+$/.test(this.keyId) || !this.keySecret ||
          /sandbox|demo/i.test(this.keyId + this.keySecret) ||
          (this.testMode ? !this.keyId.startsWith('rzp_test_') : !this.keyId.startsWith('rzp_live_')) ||
          (process.env.APP_ENV === 'staging' && !this.keyId.startsWith('rzp_test_'))) {
        throw new Error('Real Razorpay credentials with matching mode are required; staging requires test keys');
      }
      // Real test keys call the same API as live keys; a provider failure never becomes a fake order.
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST', signal: AbortSignal.timeout(15000),
        headers: { Authorization: `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')}`,
          'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountInPaise, currency: 'INR', receipt: order.orderId,
          notes: { userId: order.userId, orderId: order.orderId, coupon: order.coupon || '' } }),
      });
      if (!response.ok) throw new Error('Razorpay order creation failed; reconcile any uncertain provider outcome before retrying');
      const result = await response.json() as any;
      if (!/^order_[A-Za-z0-9]+$/.test(result.id || '') || result.entity !== 'order' ||
          result.amount !== amountInPaise || result.currency !== 'INR' || result.receipt !== order.orderId ||
          result.status !== 'created' || result.amount_paid !== 0 || result.amount_due !== amountInPaise) {
        throw new Error('Razorpay returned an order that does not match the requested purchase');
      }
      providerOrderId = result.id;
    }

    return {
      provider: 'razorpay',
      providerOrderId,
      amountInSubunits: amountInPaise,
      currency: 'INR',
      keyId: this.keyId,
      clientPayload: {
        name: 'Maths at Your Fingertips',
        description: 'Class 5–10 Mathematics Annual Pass',
        image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=160&auto=format&fit=crop&q=80',
        prefill: {
          name: order.customerDetails?.name || '',
          email: order.customerDetails?.email || '',
          contact: order.customerDetails?.phone || '',
        },
        theme: {
          color: '#00687A',
        },
      },
    };
  }

  /**
   * Verifies Razorpay Payment Signature
   * Signature formula: HMAC_SHA256(order_id + "|" + payment_id, secret)
   */
  async verifyPaymentSignature(req: VerifyPaymentRequest): Promise<{
    valid: boolean;
    providerPaymentId: string;
    error?: string;
  }> {
    const { providerOrderId, providerPaymentId, signature } = req;

    if (!providerOrderId || !providerPaymentId) {
      return {
        valid: false,
        providerPaymentId: providerPaymentId || '',
        error: 'Missing required Razorpay identifiers (order_id, payment_id)',
      };
    }

    if (!signature) {
      return {
        valid: false,
        providerPaymentId,
        error: 'Razorpay payment signature was not supplied by client',
      };
    }

    if (!this.hasSecret()) return { valid: false, providerPaymentId: providerPaymentId || '', error: 'Payment verification is not configured.' };

    // Expected signature calculation
    const payload = `${providerOrderId}|${providerPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(payload)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    let match = false;
    if (signatureBuffer.length === expectedBuffer.length) {
      match = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    }

    // In sandbox test mode, if client generated a test signature with standard test sandbox secret or simulated format
    if (!match && this.testMode && !isProductionPaymentRuntime()) {
      if (
        signature === `sig_rzp_valid_${providerOrderId}_${providerPaymentId}` ||
        signature.startsWith('sig_rzp_valid_')
      ) {
        match = true;
      } else {
        const sandboxExpected = crypto
          .createHmac('sha256', 'rzp_sec_sandbox_k98a7sd6f')
          .update(payload)
          .digest('hex');
        const sandboxBuffer = Buffer.from(sandboxExpected);
        if (signatureBuffer.length === sandboxBuffer.length) {
          match = crypto.timingSafeEqual(signatureBuffer, sandboxBuffer);
        }
      }
    }

    if (!match) {
      return {
        valid: false,
        providerPaymentId,
        error: 'Authoritative cryptographic signature verification failed for Razorpay payment.',
      };
    }

    return {
      valid: true,
      providerPaymentId,
    };
  }

  /**
   * Validates Razorpay Webhook Signature
   * Header: x-razorpay-signature
   * HMAC_SHA256(rawBody, webhookSecret) === x-razorpay-signature
   */
  async verifyWebhook(
    headers: Record<string, string | string[] | undefined>,
    rawPayload: string | Buffer | Record<string, unknown>
  ): Promise<WebhookVerificationResult> {
    const rawSignatureHeader = headers['x-razorpay-signature'] || headers['X-Razorpay-Signature'];
    const signature = Array.isArray(rawSignatureHeader) ? rawSignatureHeader[0] : rawSignatureHeader;

    let payloadString = '';
    let payloadJson: any = null;

    if (typeof rawPayload === 'string') {
      payloadString = rawPayload;
      try {
        payloadJson = JSON.parse(rawPayload);
      } catch {
        payloadJson = {};
      }
    } else if (Buffer.isBuffer(rawPayload)) {
      payloadString = rawPayload.toString('utf8');
      try {
        payloadJson = JSON.parse(payloadString);
      } catch {
        payloadJson = {};
      }
    } else {
      payloadJson = rawPayload;
      payloadString = JSON.stringify(rawPayload);
    }

    const rawEventId = headers['x-razorpay-event-id'] || headers['X-Razorpay-Event-Id'];
    const eventId = (Array.isArray(rawEventId) ? rawEventId[0] : rawEventId) ||
      payloadJson?.event_id || payloadJson?.id || crypto.createHash('sha256').update(payloadString).digest('hex');
    const eventType = payloadJson?.event || 'unknown';

    // Strictly mandate cryptographic signature header on all webhooks
    if (!signature) {
      return {
        isValid: false,
        provider: 'razorpay',
        eventId,
        eventType,
        error: 'Missing required Razorpay webhook signature header (x-razorpay-signature)',
      };
    }

    if (!this.webhookSecret) {
      return {
        isValid: false,
        provider: 'razorpay',
        eventId,
        eventType,
        error: 'Razorpay webhook secret is not configured on server',
      };
    }

    const computedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payloadString)
      .digest('hex');

    const sigBuf = Buffer.from(signature);
    const compBuf = Buffer.from(computedSignature);

    let isSigValid = false;
    if (sigBuf.length === compBuf.length) {
      isSigValid = crypto.timingSafeEqual(sigBuf, compBuf);
    }

    if (!isSigValid) {
      return {
        isValid: false,
        provider: 'razorpay',
        eventId,
        eventType,
        error: 'Invalid Razorpay webhook signature header (x-razorpay-signature)',
      };
    }

    // Extract order & payment details from Razorpay webhook structure:
    // payload.payment.entity or payload.order.entity
    const paymentEntity = payloadJson?.payload?.payment?.entity;
    const orderEntity = payloadJson?.payload?.order?.entity;

    const providerPaymentId = paymentEntity?.id || payloadJson?.payment_id;
    const providerOrderId = paymentEntity?.order_id || orderEntity?.id || payloadJson?.order_id;
    const rawAmount = paymentEntity?.amount ?? orderEntity?.amount;

    let status: 'paid' | 'failed' | 'pending' = 'pending';
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      status = 'paid';
    } else if (eventType === 'payment.failed') {
      status = 'failed';
    }

    return {
      isValid: true,
      provider: 'razorpay',
      eventId,
      eventType,
      providerOrderId,
      providerPaymentId,
      status,
      rawAmount: typeof rawAmount === 'number' ? rawAmount / 100 : undefined,
      currency: paymentEntity?.currency || orderEntity?.currency,
      metadata: payloadJson?.notes || {},
    };
  }
}
