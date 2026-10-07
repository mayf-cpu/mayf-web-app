/**
 * Provider-Independent Payment Layer Types
 * Maths at Your Fingertips (mayf.co.in)
 */

export type PaymentProvider = 'razorpay' | 'stripe';

export type PaymentStatus =
  | 'created'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export interface PaymentOrderItem {
  id?: string;
  title: string;
  unitPrice: number;
  quantity: number;
  annualPass?: boolean;
  contentItemId?: string;
  description?: string;
}

export interface StoredOrder {
  orderId: string;
  userId: string;
  items: PaymentOrderItem[];
  grossAmount: number;
  discount: number;
  coupon?: string;
  tax?: number; // GST or applicable regional sales tax
  currency: 'INR' | 'USD' | string;
  provider: PaymentProvider;
  providerOrderId: string;
  providerPaymentId?: string;
  status: PaymentStatus;
  createdAt: string;
  paidAt?: string | null;
  customerDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    studentClass?: string;
  };
  notes?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface CreateOrderRequest {
  userId: string;
  items: PaymentOrderItem[];
  grossAmount: number;
  coupon?: string;
  currency?: 'INR' | 'USD' | string;
  preferredProvider?: PaymentProvider;
  customerDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    studentClass?: string;
  };
}

export interface ProviderOrderResult {
  provider: PaymentProvider;
  providerOrderId: string;
  amountInSubunits: number; // paise for INR, cents for USD
  currency: string;
  keyId: string; // Razorpay Key ID or Stripe Publishable Key
  clientPayload?: Record<string, unknown>;
}

export interface VerifyPaymentRequest {
  orderId: string;
  provider: PaymentProvider;
  providerOrderId: string;
  providerPaymentId: string;
  signature?: string; // For Razorpay
  stripeSessionId?: string; // For Stripe
}

export interface WebhookVerificationResult {
  isValid: boolean;
  provider: PaymentProvider;
  eventId: string;
  eventType: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  status?: PaymentStatus;
  rawAmount?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface WebhookEventLog {
  id: string; // Webhook event unique ID for idempotency
  provider: PaymentProvider;
  eventType: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  orderId?: string;
  status: 'processed' | 'duplicate_ignored' | 'failed' | 'signature_invalid';
  receivedAt: string;
  processedAt: string;
  message: string;
}

export interface PaymentGatewaySettings {
  activeProvider: 'razorpay' | 'stripe' | 'auto'; // 'auto' selects Razorpay for INR, Stripe for USD/others
  testMode: boolean;
  razorpayKeyId: string;
  razorpayKeySecret?: string;
  razorpayWebhookSecret?: string;
  stripePublishableKey: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  taxRatePercentage: number; // e.g. 18 for GST or 0
  allowCouponDiscounts: boolean;
}

export interface MaskedPaymentGatewaySettings {
  activeProvider: 'razorpay' | 'stripe' | 'auto';
  testMode: boolean;
  razorpayKeyId: string;
  hasRazorpayKeySecret: boolean;
  maskedRazorpayKeySecret: string;
  hasRazorpayWebhookSecret: boolean;
  maskedRazorpayWebhookSecret: string;
  stripePublishableKey: string;
  hasStripeSecretKey: boolean;
  maskedStripeSecretKey: string;
  hasStripeWebhookSecret: boolean;
  maskedStripeWebhookSecret: string;
  taxRatePercentage: number;
  allowCouponDiscounts: boolean;
  webhookUrls: {
    razorpay: string;
    stripe: string;
  };
}

export interface AnnualPassSettings {
  enabled: boolean;
  name: string;
  regularPrice: number;
  salePrice: number;
  currency: string;
  durationDays: number; // default: 365
  description: string;
  benefits: string[];
  eligibleContent: string[];
  promotionalStartDate?: string | null;
  promotionalEndDate?: string | null;
  updatedAt?: string;
  updatedBy?: string;
}

export type EntitlementStatus = 'active' | 'expired' | 'revoked';

export interface Entitlement {
  id: string;
  userId: string;
  type: 'annual_pass';
  startsAt: string;
  expiresAt: string;
  status: EntitlementStatus;
  grantedBy: 'payment' | 'admin';
  orderId?: string;
  paymentId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EntitlementHistoryLog {
  id: string;
  entitlementId: string;
  userId: string;
  action: 'created' | 'granted' | 'extended' | 'revoked' | 'expired';
  actor: 'system' | 'admin' | 'payment_webhook';
  actorId?: string;
  previousExpiresAt?: string;
  newExpiresAt?: string;
  previousStatus?: EntitlementStatus;
  newStatus?: EntitlementStatus;
  reason?: string;
  timestamp: string;
}

export interface GrantAnnualPassRequest {
  userId: string;
  durationDays?: number;
  notes?: string;
  adminId?: string;
}

export interface ExtendAnnualPassRequest {
  userId: string;
  daysToAdd?: number;
  newExpiresAt?: string;
  reason?: string;
  adminId?: string;
}

export interface RevokeAnnualPassRequest {
  userId: string;
  reason?: string;
  adminId?: string;
}
