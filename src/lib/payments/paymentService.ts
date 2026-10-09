/**
 * Provider-Independent Payment Service
 * Maths at Your Fingertips (mayf.co.in)
 *
 * Implements:
 * - Provider abstraction (Razorpay as primary India, Stripe as secondary International)
 * - Server-side order creation
 * - Cryptographic payment signature verification
 * - Authoritative webhook processing with strict idempotency
 * - Zero storage of card/CVV data (PCI DSS compliant)
 * - Entitlement gating (Annual Pass granted ONLY upon verified server confirmation)
 * - Masked admin secrets protection (never exposes plaintext secrets after save)
 */

import crypto from 'crypto';
import {
  PaymentProvider,
  PaymentStatus,
  StoredOrder,
  CreateOrderRequest,
  ProviderOrderResult,
  VerifyPaymentRequest,
  WebhookEventLog,
  PaymentGatewaySettings,
  MaskedPaymentGatewaySettings,
} from './types';
import { RazorpayAdapter } from './adapters/razorpayAdapter';
import { StripeAdapter } from './adapters/stripeAdapter';
import { couponService } from '../coupons/couponService';

export class PaymentService {
  private razorpayAdapter: RazorpayAdapter;
  private stripeAdapter: StripeAdapter;

  // Stored Orders (In-memory authoritative store synced across runtime)
  private ordersStore: Map<string, StoredOrder> = new Map();

  // Webhook Idempotency Store: eventId -> WebhookEventLog
  private processedWebhookEvents: Map<string, WebhookEventLog> = new Map();

  // Payment Gateway Settings (Configurable by admin, secrets kept strictly server-side)
  private settings: PaymentGatewaySettings;

  constructor() {
    this.razorpayAdapter = new RazorpayAdapter();
    this.stripeAdapter = new StripeAdapter();

    this.settings = {
      activeProvider: 'razorpay',
      testMode: process.env.APP_ENV !== 'production',
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mayf2026demo',
      razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || 'rzp_sec_sandbox_k98a7sd6f',
      razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_whsec_mayf_prod_992',
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_mayf2026intl',
      stripeSecretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_sandbox_intlk98a7',
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_stripe_mayf_prod_881',
      taxRatePercentage: 18, // 18% GST standard educational rate in India (or 0% exempt)
      allowCouponDiscounts: true,
    };

    this.seedInitialOrders();
  }

  /**
   * Seed realistic orders to display in Student Dashboard and Admin Payment Ledger
   */
  private seedInitialOrders(): void {
    const seed1: StoredOrder = {
      orderId: 'MAYF-ORD-2026-1001',
      userId: 'mayf-student-1001',
      items: [
        {
          id: 'item-pass-10',
          title: 'Maths at Your Fingertips Annual Pass (Class 5–10)',
          unitPrice: 999,
          quantity: 1,
          annualPass: true,
          description: '1-Year Unlimited Access to All Formula Decks, Chapter Materials, & AI Teacher',
        },
      ],
      grossAmount: 999,
      discount: 100,
      coupon: 'BOARD2026',
      tax: 0,
      currency: 'INR',
      provider: 'razorpay',
      providerOrderId: 'order_seed_rzp_99201',
      providerPaymentId: 'pay_rzp_tx_99201_succ',
      status: 'paid',
      createdAt: '2026-10-05T11:20:00.000Z',
      paidAt: '2026-10-05T11:21:15.000Z',
      customerDetails: {
        name: 'Arjun Sharma',
        email: 'parent.sharma@gmail.com',
        phone: '+91 98765 43210',
        studentClass: 'Class 10',
      },
      notes: { channel: 'web_checkout' },
    };

    const seed2: StoredOrder = {
      orderId: 'MAYF-ORD-2026-1002',
      userId: 'mayf-student-demo-guest',
      items: [
        {
          id: 'item-pass-int',
          title: 'International Student Math Companion Pass (USD)',
          unitPrice: 29,
          quantity: 1,
          annualPass: true,
          description: 'Global Curriculum Math Deck & AI Doubt Solver',
        },
      ],
      grossAmount: 29,
      discount: 0,
      currency: 'USD',
      provider: 'stripe',
      providerOrderId: 'cs_test_seed_stripe_882',
      providerPaymentId: 'pi_test_seed_stripe_882',
      status: 'paid',
      createdAt: '2026-10-06T15:40:00.000Z',
      paidAt: '2026-10-06T15:42:10.000Z',
      customerDetails: {
        name: 'Sara Chen',
        email: 'sara.chen@example.com',
      },
    };

    this.ordersStore.set(seed1.orderId, seed1);
    this.ordersStore.set(seed2.orderId, seed2);

    // Seed idempotency log for initial orders
    this.processedWebhookEvents.set('rzp_evt_seed_99201', {
      id: 'rzp_evt_seed_99201',
      provider: 'razorpay',
      eventType: 'payment.captured',
      providerOrderId: 'order_seed_rzp_99201',
      providerPaymentId: 'pay_rzp_tx_99201_succ',
      orderId: 'MAYF-ORD-2026-1001',
      status: 'processed',
      receivedAt: '2026-10-05T11:21:14.000Z',
      processedAt: '2026-10-05T11:21:15.000Z',
      message: 'Initial webhook processed and reconciled authoritatively.',
    });
  }

  /**
   * Resolves the appropriate provider adapter based on currency or request
   */
  private getAdapter(provider?: PaymentProvider, currency?: string) {
    if (provider === 'stripe') return this.stripeAdapter;
    if (provider === 'razorpay') return this.razorpayAdapter;

    // Auto routing: default to Razorpay for INR, Stripe for USD/EUR/GBP
    if (currency && currency.toUpperCase() !== 'INR') {
      return this.stripeAdapter;
    }
    return this.settings.activeProvider === 'stripe' ? this.stripeAdapter : this.razorpayAdapter;
  }

  /**
   * STEP 1: Server Creates Order
   * Computes verified pricing, discounts, tax, and registers the order in status 'created'
   */
  async createOrder(req: CreateOrderRequest): Promise<{
    order: StoredOrder;
    providerResult: ProviderOrderResult;
  }> {
    const { userId, items, grossAmount, coupon, currency = 'INR', preferredProvider, customerDetails } = req;

    // Calculate coupon discount securely on server (never trust client-calculated discounts)
    let discount = 0;
    let validatedCoupon = coupon ? coupon.trim().toUpperCase() : undefined;
    if (this.settings.allowCouponDiscounts && validatedCoupon) {
      const val = couponService.validateCoupon({
        code: validatedCoupon,
        userId,
        cartGrossAmount: grossAmount,
        currency,
        items,
      });
      if (val.valid) {
        discount = val.discountAmount;
        validatedCoupon = val.code;
      } else {
        // If client provided an invalid/expired coupon, do not apply discount
        validatedCoupon = undefined;
      }
    }
    // Cap discount to gross amount
    discount = Math.min(discount, grossAmount);

    // Calculate tax if applicable
    let tax = 0;
    if (this.settings.taxRatePercentage > 0) {
      // Net taxable value
      const taxableAmount = grossAmount - discount;
      tax = Math.round((taxableAmount * this.settings.taxRatePercentage) / 100);
    }

    // Determine target provider adapter
    const adapter = this.getAdapter(preferredProvider, currency);
    const providerType = adapter.provider;

    // Generate authoritative internal Order ID: MAYF-ORD-YYYYMMDD-XXXX
    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const orderId = `MAYF-ORD-${dateStamp}-${randomHex}`;

    // Build internal order document strictly conforming to user requirements
    const newOrder: StoredOrder = {
      orderId,
      userId,
      items: items.length > 0 ? items : [
        {
          id: 'item-annual-pass',
          title: 'Maths at Your Fingertips Annual Pass (Class 5–10)',
          unitPrice: grossAmount,
          quantity: 1,
          annualPass: true,
          description: 'Complete digital access to formula deck, chapters, & AI teacher',
        },
      ],
      grossAmount,
      discount,
      coupon: coupon ? coupon.trim().toUpperCase() : undefined,
      tax,
      currency: currency.toUpperCase(),
      provider: providerType,
      providerOrderId: '', // will be populated from adapter result
      providerPaymentId: undefined,
      status: 'created',
      createdAt: new Date().toISOString(),
      paidAt: null,
      customerDetails,
    };

    // Call adapter to generate gateway order / checkout session
    const providerResult = await adapter.createOrder(newOrder);
    newOrder.providerOrderId = providerResult.providerOrderId;

    // Persist in orders store
    this.ordersStore.set(orderId, newOrder);

    return {
      order: newOrder,
      providerResult,
    };
  }

  /**
   * STEP 2 & 3: Client Submits Payment Identifiers -> Server Verifies Signature
   * Never marks order paid or grants entitlement until cryptographic signature is verified!
   */
  async verifyPaymentSignature(req: VerifyPaymentRequest): Promise<{
    success: boolean;
    order?: StoredOrder;
    entitlementGranted?: boolean;
    error?: string;
  }> {
    const order = this.ordersStore.get(req.orderId);
    if (!order) {
      return {
        success: false,
        error: `Order with ID "${req.orderId}" not found in authoritative order registry.`,
      };
    }

    // Ownership check: Prevent payment verification spoofing across different user accounts
    if (req.userId && order.userId !== req.userId) {
      return {
        success: false,
        error: 'Unauthorized: Payment order does not belong to the authenticated student account.',
      };
    }

    // Gateway order ID consistency check
    if (order.providerOrderId && req.providerOrderId && order.providerOrderId !== req.providerOrderId) {
      return {
        success: false,
        error: 'Payment verification failed: Provider order ID mismatch.',
      };
    }

    if (order.status === 'paid') {
      return {
        success: true,
        order,
        entitlementGranted: true,
      };
    }

    const adapter = this.getAdapter(req.provider || order.provider);
    const verification = await adapter.verifyPaymentSignature(req);

    if (!verification.valid) {
      order.status = 'failed';
      order.providerPaymentId = req.providerPaymentId;
      return {
        success: false,
        order,
        entitlementGranted: false,
        error: verification.error || 'Payment signature could not be verified by server adapter.',
      };
    }

    // Cryptographic verification succeeded!
    order.status = 'paid';
    order.providerPaymentId = verification.providerPaymentId;
    order.paidAt = new Date().toISOString();

    if (order.coupon) {
      couponService.recordCouponRedemption(order.coupon, order.userId);
    }

    return {
      success: true,
      order,
      entitlementGranted: true,
    };
  }

  /**
   * STEP 4: Trusted Webhook Confirms Payment Authoritatively
   * Enforces webhook idempotency to prevent duplicate executions.
   */
  async handleWebhook(
    provider: PaymentProvider,
    headers: Record<string, string | string[] | undefined>,
    rawBody: string | Buffer | Record<string, unknown>
  ): Promise<{
    success: boolean;
    status: 'processed' | 'duplicate_ignored' | 'signature_invalid' | 'failed';
    message: string;
    orderId?: string;
  }> {
    const adapter = provider === 'stripe' ? this.stripeAdapter : this.razorpayAdapter;
    const webhookResult = await adapter.verifyWebhook(headers, rawBody);

    if (!webhookResult.isValid) {
      return {
        success: false,
        status: 'signature_invalid',
        message: webhookResult.error || 'Webhook cryptographic signature verification failed',
      };
    }

    const eventId = webhookResult.eventId;

    // Idempotency check: if already processed, return immediately
    if (this.processedWebhookEvents.has(eventId)) {
      const existing = this.processedWebhookEvents.get(eventId)!;
      return {
        success: true,
        status: 'duplicate_ignored',
        message: `Webhook event "${eventId}" was already processed at ${existing.processedAt}. Idempotently ignored.`,
        orderId: existing.orderId,
      };
    }

    // Find corresponding order by providerOrderId or orderId in metadata
    let targetOrder: StoredOrder | undefined;
    if (webhookResult.providerOrderId) {
      for (const order of this.ordersStore.values()) {
        if (order.providerOrderId === webhookResult.providerOrderId) {
          targetOrder = order;
          break;
        }
      }
    }

    if (!targetOrder && webhookResult.metadata?.orderId) {
      targetOrder = this.ordersStore.get(webhookResult.metadata.orderId as string);
    }

    const now = new Date().toISOString();

    if (targetOrder) {
      if (webhookResult.status === 'paid') {
        targetOrder.status = 'paid';
        targetOrder.providerPaymentId = webhookResult.providerPaymentId || targetOrder.providerPaymentId;
        if (!targetOrder.paidAt) {
          targetOrder.paidAt = now;
        }
      } else if (webhookResult.status === 'failed') {
        if (targetOrder.status !== 'paid') {
          targetOrder.status = 'failed';
        }
      }

      // Record in idempotency log
      this.processedWebhookEvents.set(eventId, {
        id: eventId,
        provider,
        eventType: webhookResult.eventType,
        providerOrderId: webhookResult.providerOrderId,
        providerPaymentId: webhookResult.providerPaymentId,
        orderId: targetOrder.orderId,
        status: 'processed',
        receivedAt: now,
        processedAt: now,
        message: `Successfully processed event "${webhookResult.eventType}" for order ${targetOrder.orderId}. Status: ${targetOrder.status}`,
      });

      return {
        success: true,
        status: 'processed',
        message: `Processed webhook "${webhookResult.eventType}" for order ${targetOrder.orderId}.`,
        orderId: targetOrder.orderId,
      };
    } else {
      // Order not found, but log webhook record
      this.processedWebhookEvents.set(eventId, {
        id: eventId,
        provider,
        eventType: webhookResult.eventType,
        providerOrderId: webhookResult.providerOrderId,
        providerPaymentId: webhookResult.providerPaymentId,
        status: 'processed',
        receivedAt: now,
        processedAt: now,
        message: `Webhook "${webhookResult.eventType}" processed but no matching order found for providerOrderId: ${webhookResult.providerOrderId}.`,
      });

      return {
        success: true,
        status: 'processed',
        message: `Processed event "${webhookResult.eventType}", no local order matched.`,
      };
    }
  }

  /**
   * Helper to mask secret keys (e.g., "rzp_sec_••••••••••••92ab")
   */
  private maskSecret(val?: string): string {
    if (!val || val.length < 6) return '••••••••';
    const start = val.slice(0, 4);
    const end = val.slice(-4);
    return `${start}••••••••••••${end}`;
  }

  /**
   * Admin Payment Settings: Returns safe masked view
   * NEVER returns plaintext secrets to frontend!
   */
  getMaskedSettings(): MaskedPaymentGatewaySettings {
    const host = process.env.PUBLIC_APP_URL || 'https://mayf.co.in';

    return {
      activeProvider: this.settings.activeProvider,
      testMode: this.settings.testMode,
      razorpayKeyId: this.settings.razorpayKeyId,
      hasRazorpayKeySecret: Boolean(this.settings.razorpayKeySecret),
      maskedRazorpayKeySecret: this.maskSecret(this.settings.razorpayKeySecret),
      hasRazorpayWebhookSecret: Boolean(this.settings.razorpayWebhookSecret),
      maskedRazorpayWebhookSecret: this.maskSecret(this.settings.razorpayWebhookSecret),
      stripePublishableKey: this.settings.stripePublishableKey,
      hasStripeSecretKey: Boolean(this.settings.stripeSecretKey),
      maskedStripeSecretKey: this.maskSecret(this.settings.stripeSecretKey),
      hasStripeWebhookSecret: Boolean(this.settings.stripeWebhookSecret),
      maskedStripeWebhookSecret: this.maskSecret(this.settings.stripeWebhookSecret),
      taxRatePercentage: this.settings.taxRatePercentage,
      allowCouponDiscounts: this.settings.allowCouponDiscounts,
      webhookUrls: {
        razorpay: `${host}/api/payments/webhook/razorpay`,
        stripe: `${host}/api/payments/webhook/stripe`,
      },
    };
  }

  /**
   * Admin Payment Settings: Updates configuration securely
   * If a secret field is empty or contains masked bullets, leaves the existing stored secret untouched!
   */
  updateSettings(updates: Partial<PaymentGatewaySettings>): MaskedPaymentGatewaySettings {
    if (updates.activeProvider) this.settings.activeProvider = updates.activeProvider;
    if (updates.testMode !== undefined) this.settings.testMode = updates.testMode;
    if (updates.razorpayKeyId) this.settings.razorpayKeyId = updates.razorpayKeyId;
    if (updates.stripePublishableKey) this.settings.stripePublishableKey = updates.stripePublishableKey;
    if (updates.taxRatePercentage !== undefined) this.settings.taxRatePercentage = Number(updates.taxRatePercentage);
    if (updates.allowCouponDiscounts !== undefined) this.settings.allowCouponDiscounts = Boolean(updates.allowCouponDiscounts);

    // Only update secrets if client provided a non-empty, unmasked new secret
    if (updates.razorpayKeySecret && !updates.razorpayKeySecret.includes('••••')) {
      this.settings.razorpayKeySecret = updates.razorpayKeySecret.trim();
    }
    if (updates.razorpayWebhookSecret && !updates.razorpayWebhookSecret.includes('••••')) {
      this.settings.razorpayWebhookSecret = updates.razorpayWebhookSecret.trim();
    }
    if (updates.stripeSecretKey && !updates.stripeSecretKey.includes('••••')) {
      this.settings.stripeSecretKey = updates.stripeSecretKey.trim();
    }
    if (updates.stripeWebhookSecret && !updates.stripeWebhookSecret.includes('••••')) {
      this.settings.stripeWebhookSecret = updates.stripeWebhookSecret.trim();
    }

    // Propagate to adapters
    this.razorpayAdapter.configure({
      keyId: this.settings.razorpayKeyId,
      secretKey: this.settings.razorpayKeySecret,
      webhookSecret: this.settings.razorpayWebhookSecret,
      testMode: this.settings.testMode,
    });

    this.stripeAdapter.configure({
      keyId: this.settings.stripePublishableKey,
      secretKey: this.settings.stripeSecretKey,
      webhookSecret: this.settings.stripeWebhookSecret,
      testMode: this.settings.testMode,
    });

    return this.getMaskedSettings();
  }

  /**
   * Get all stored orders for admin audit or user querying
   */
  getAllOrders(): StoredOrder[] {
    return Array.from(this.ordersStore.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Get orders for a specific user
   */
  getUserOrders(userId: string): StoredOrder[] {
    return this.getAllOrders().filter((o) => o.userId === userId);
  }

  /**
   * Get order by orderId
   */
  getOrder(orderId: string): StoredOrder | undefined {
    return this.ordersStore.get(orderId);
  }

  /**
   * Get webhook idempotency audit logs
   */
  getWebhookLogs(): WebhookEventLog[] {
    return Array.from(this.processedWebhookEvents.values()).sort(
      (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );
  }

  /**
   * Admin Simulation Tool: Test Webhook and Idempotency
   */
  async simulateWebhook(params: {
    provider: PaymentProvider;
    eventType: string;
    orderId: string;
    simulateDuplicate?: boolean;
  }): Promise<{
    success: boolean;
    status: string;
    eventId: string;
    message: string;
    order?: StoredOrder;
  }> {
    const targetOrder = this.ordersStore.get(params.orderId);
    if (!targetOrder) {
      throw new Error(`Order ${params.orderId} not found`);
    }

    const eventId = params.simulateDuplicate
      ? 'rzp_evt_test_duplicate_id'
      : `evt_sim_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    const rawPayload = {
      event_id: eventId,
      event: params.eventType || 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_sim_${Date.now().toString(36)}`,
            order_id: targetOrder.providerOrderId,
            amount: Math.round(targetOrder.grossAmount - targetOrder.discount + (targetOrder.tax || 0)) * 100,
            currency: targetOrder.currency,
          },
        },
      },
    };

    // Generate valid HMAC signature with the webhook secret
    const secret = params.provider === 'stripe'
      ? (this.settings.stripeWebhookSecret || 'whsec_stripe_mayf_prod_881')
      : (this.settings.razorpayWebhookSecret || 'rzp_whsec_mayf_prod_992');

    const rawBodyString = JSON.stringify(rawPayload);
    const signature = crypto.createHmac('sha256', secret).update(rawBodyString).digest('hex');

    const headers: Record<string, string> = params.provider === 'stripe'
      ? { 'stripe-signature': `t=${Math.floor(Date.now() / 1000)},v1=${signature}` }
      : { 'x-razorpay-signature': signature };

    const outcome = await this.handleWebhook(params.provider, headers, rawBodyString);

    return {
      success: outcome.success,
      status: outcome.status,
      eventId,
      message: outcome.message,
      order: this.ordersStore.get(params.orderId),
    };
  }
}

// Global Singleton Instance
export const paymentService = new PaymentService();
