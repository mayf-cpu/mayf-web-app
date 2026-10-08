/**
 * Authoritative Coupon & Promotional Block Types
 * Maths at Your Fingertips (mayf.co.in)
 */

export type CouponDiscountType = 'fixed' | 'percentage';
export type CouponScope = 'all' | 'annual_pass_only' | 'selected_products';

export interface CouponItem {
  code: string; // Stored uppercase
  discountType: CouponDiscountType;
  discountValue: number; // ₹ amount for 'fixed', % for 'percentage'
  enabled: boolean;
  description: string;

  // Constraints & Rules
  startDate?: string | null;
  endDate?: string | null;
  minimumCartAmount?: number | null;
  maximumDiscountAmount?: number | null; // Capping for percentage discounts
  usageLimit?: number | null; // Global total uses allowed
  perUserLimit?: number | null; // Max redemptions per student UID

  // Product Scope
  scope: CouponScope;
  selectedProductIds?: string[];

  // Usage Tracking
  timesUsed: number;
  userUsageMap: Record<string, number>;

  createdAt: string;
  updatedAt: string;
}

export interface CouponValidationRequest {
  code: string;
  userId?: string;
  cartGrossAmount: number;
  currency?: string;
  items?: Array<{
    id?: string;
    title?: string;
    annualPass?: boolean;
    unitPrice?: number;
    price?: number;
    quantity?: number;
  }>;
}

export interface CouponValidationResult {
  valid: boolean;
  code?: string;
  discountType?: CouponDiscountType;
  discountValue?: number;
  discountAmount: number; // Server-computed authoritative discount
  netAmount: number; // cartGrossAmount - discountAmount
  message: string;
  coupon?: Omit<CouponItem, 'userUsageMap'>;
  error?: string;
}

export interface PromotionalBlock {
  id: string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  couponCode?: string;
  targetPlacements: ('homepage' | 'catalogue')[];
  ctaText: string;
  ctaLink: string;
  bannerStyle: 'gradient' | 'urgent' | 'accent' | 'minimal';
  enabled: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
