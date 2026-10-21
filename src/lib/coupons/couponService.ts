/**
 * Authoritative Coupon Engine & Promotional Block Service
 * Maths at Your Fingertips (mayf.co.in)
 *
 * Implements:
 * - Server-side validation of fixed & percentage discounts
 * - Date constraints, minimum cart rules, maximum discount caps
 * - Usage limits & per-student redemption tracking
 * - Product scope enforcement (all products, annual pass only, selected items)
 * - Zero trust of client-computed discount claims
 * - Promotional banner manager publishable to Homepage and Catalogue
 */

import crypto from 'crypto';
import { isProductionPaymentRuntime } from '../payments/runtime';
import {
  CouponItem,
  CouponValidationRequest,
  CouponValidationResult,
  PromotionalBlock,
} from './types';

export class CouponService {
  // Stored Coupons: code -> CouponItem
  private couponsStore: Map<string, CouponItem> = new Map();

  // Stored Promotional Blocks: id -> PromotionalBlock
  private promotionsStore: Map<string, PromotionalBlock> = new Map();

  constructor() {
    if (!isProductionPaymentRuntime()) {
      this.seedInitialCoupons();
      this.seedInitialPromotions();
    }
  }

  couponState = {
    exportState: () => structuredClone([...this.couponsStore.values()].map(coupon => ({ ...coupon, id: coupon.code }))),
    importState: (items: Record<string, any>[]) => { this.couponsStore = new Map(items.map(({ id, ...coupon }) => [coupon.code, coupon as CouponItem])); },
  };
  promotionState = {
    exportState: () => structuredClone([...this.promotionsStore.values()]),
    importState: (items: Record<string, any>[]) => { this.promotionsStore = new Map(items.map(item => [item.id, item as PromotionalBlock])); },
  };

  /**
   * Seed production coupons
   */
  private seedInitialCoupons(): void {
    const defaultCoupons: CouponItem[] = [
      {
        code: 'BOARD2026',
        discountType: 'fixed',
        discountValue: 100,
        enabled: true,
        description: 'CBSE & ICSE Board Exam Revision — Flat ₹100 Off Annual Pass',
        startDate: '2026-01-01',
        endDate: '2027-04-30',
        minimumCartAmount: 500,
        maximumDiscountAmount: null,
        usageLimit: 5000,
        perUserLimit: 1,
        scope: 'annual_pass_only',
        timesUsed: 0,
        userUsageMap: {},
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        code: 'TOPPER15',
        discountType: 'percentage',
        discountValue: 15,
        enabled: true,
        description: 'Academic Merit Discount — 15% Off All Study Materials & Passes',
        startDate: '2026-01-01',
        endDate: '2027-12-31',
        minimumCartAmount: 300,
        maximumDiscountAmount: 250, // Capped at ₹250
        usageLimit: 2500,
        perUserLimit: 2,
        scope: 'all',
        timesUsed: 0,
        userUsageMap: {},
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        code: 'SCHOLARSHIP50',
        discountType: 'percentage',
        discountValue: 50,
        enabled: true,
        description: 'Special Educational Merit Scholarship — 50% Off (Max ₹500)',
        startDate: '2026-04-01',
        endDate: '2027-03-31',
        minimumCartAmount: 800,
        maximumDiscountAmount: 500,
        usageLimit: 500,
        perUserLimit: 1,
        scope: 'annual_pass_only',
        timesUsed: 0,
        userUsageMap: {},
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      },
    ];

    for (const c of defaultCoupons) {
      this.couponsStore.set(c.code.toUpperCase(), c);
    }
  }

  /**
   * Seed high-converting promotional banners
   */
  private seedInitialPromotions(): void {
    const promo1: PromotionalBlock = {
      id: 'promo-board-special',
      title: 'Class 5–10 Board Exam Special: Save ₹100 on the Annual Pass',
      subtitle: 'Unlock unlimited 24/7 Professor Sigma AI Teacher doubts and all solved board derivations. Use code BOARD2026 at checkout.',
      badgeText: 'BOARD REVISION OFFER',
      couponCode: 'BOARD2026',
      targetPlacements: ['homepage', 'catalogue'],
      ctaText: 'Claim ₹100 Discount',
      ctaLink: '/checkout?coupon=BOARD2026',
      bannerStyle: 'gradient',
      enabled: true,
      startsAt: '2026-01-01',
      expiresAt: '2027-04-30',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    this.promotionsStore.set(promo1.id, promo1);
  }

  // --------------------------------------------------------------------------
  // Coupon Validation Engine (Server-Side Authority)
  // --------------------------------------------------------------------------

  /**
   * Evaluates all coupon constraints and returns the exact authoritative discount.
   * Never trusts client-reported discount numbers.
   */
  validateCoupon(req: CouponValidationRequest): CouponValidationResult {
    const cleanCode = (req.code || '').trim().toUpperCase();
    const grossAmount = Math.max(0, req.cartGrossAmount || 0);

    if (!Number.isFinite(req.cartGrossAmount) || req.cartGrossAmount < 0) throw new Error('Invalid cart amount.');
    if (!cleanCode) {
      return {
        valid: false,
        discountAmount: 0,
        netAmount: grossAmount,
        message: 'Coupon code is required.',
        error: 'Please enter a coupon code.',
      };
    }

    if ((req.currency || 'INR').toUpperCase() !== 'INR') return { valid: false, discountAmount: 0, netAmount: grossAmount, message: 'Coupons are currently valid for INR purchases only.', error: 'Use INR checkout for this coupon.' };
    const coupon = this.couponsStore.get(cleanCode);
    if (!coupon) {
      return {
        valid: false,
        discountAmount: 0,
        netAmount: grossAmount,
        message: `Coupon "${cleanCode}" does not exist.`,
        error: `Coupon code "${cleanCode}" is invalid.`,
      };
    }

    // 1. Enabled status check
    if (!coupon.enabled) {
      return {
        valid: false,
        code: coupon.code,
        discountAmount: 0,
        netAmount: grossAmount,
        message: `Coupon "${cleanCode}" is currently inactive.`,
        error: 'This promotion is currently paused or inactive.',
      };
    }

    // 2. Date window check
    const now = new Date();
    if (coupon.startDate) {
      const start = new Date(coupon.startDate);
      if (now < start) {
        return {
          valid: false,
          code: coupon.code,
          discountAmount: 0,
          netAmount: grossAmount,
          message: `Coupon starts on ${start.toLocaleDateString()}.`,
          error: `This coupon will become valid on ${start.toLocaleDateString()}.`,
        };
      }
    }

    if (coupon.endDate) {
      const end = new Date(coupon.endDate);
      // Allow through end of the specified day
      end.setHours(23, 59, 59, 999);
      if (now > end) {
        return {
          valid: false,
          code: coupon.code,
          discountAmount: 0,
          netAmount: grossAmount,
          message: `Coupon expired on ${end.toLocaleDateString()}.`,
          error: `This promotional code expired on ${end.toLocaleDateString()}.`,
        };
      }
    }

    // 3. Global usage limit
    if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
      return {
        valid: false,
        code: coupon.code,
        discountAmount: 0,
        netAmount: grossAmount,
        message: 'Total redemptions limit reached.',
        error: 'This promotional code has reached its maximum global redemptions.',
      };
    }

    // 4. Per-user redemption limit
    if (req.userId && coupon.perUserLimit) {
      const userRedemptions = coupon.userUsageMap[req.userId] || 0;
      if (userRedemptions >= coupon.perUserLimit) {
        return {
          valid: false,
          code: coupon.code,
          discountAmount: 0,
          netAmount: grossAmount,
          message: 'User usage limit reached.',
          error: `You have already redeemed this coupon the maximum allowed times (${coupon.perUserLimit}).`,
        };
      }
    }

    // 5. Minimum cart amount requirement
    if (coupon.minimumCartAmount && grossAmount < coupon.minimumCartAmount) {
      return {
        valid: false,
        code: coupon.code,
        discountAmount: 0,
        netAmount: grossAmount,
        message: `Minimum cart amount of ₹${coupon.minimumCartAmount} required.`,
        error: `Minimum order amount of ₹${coupon.minimumCartAmount} required to use this coupon (Current: ₹${grossAmount}).`,
      };
    }

    // 6. Product scope eligibility check
    const items = req.items || [];
    let eligibleSubtotal = grossAmount;

    if (coupon.scope === 'annual_pass_only') {
      const hasAnnualPass =
        items.some(i => i.annualPass === true);

      if (!hasAnnualPass) {
        return {
          valid: false,
          code: coupon.code,
          discountAmount: 0,
          netAmount: grossAmount,
          message: 'Coupon is strictly valid for the Annual Pass only.',
          error: 'Coupon BOARD2026 can only be applied to the Maths at Your Fingertips Annual Pass.',
        };
      }

      // Compute subtotal of Annual Pass items
      if (items.length > 0) {
        const passItems = items.filter(
          i => i.annualPass === true
        );
        const calcSubtotal = passItems.reduce(
          (sum, item) => sum + (Number(item.unitPrice ?? item.price ?? 0)) * (Number(item.quantity) || 1),
          0
        );
        eligibleSubtotal = Math.min(calcSubtotal, grossAmount);
      }
    } else if (coupon.scope === 'selected_products') {
      const selectedIds = coupon.selectedProductIds || [];
      const eligibleItems = items.filter((i) => i.id && selectedIds.includes(i.id));

      if (eligibleItems.length === 0) {
        return {
          valid: false,
          code: coupon.code,
          discountAmount: 0,
          netAmount: grossAmount,
          message: 'Coupon does not apply to any items currently in your cart.',
          error: 'This promotion is restricted to selected course materials.',
        };
      }

      const calcSubtotal = eligibleItems.reduce(
        (sum, item) => sum + (Number(item.unitPrice ?? item.price ?? 0)) * (Number(item.quantity) || 1),
        0
      );
      eligibleSubtotal = Math.min(calcSubtotal, grossAmount);
    }

    // 7. Calculate authoritative discount
    let discount = 0;
    if (coupon.discountType === 'fixed') {
      discount = Math.min(coupon.discountValue, eligibleSubtotal, grossAmount);
    } else if (coupon.discountType === 'percentage') {
      let rawPct = Math.round((eligibleSubtotal * coupon.discountValue) / 100);
      if (coupon.maximumDiscountAmount && coupon.maximumDiscountAmount > 0) {
        rawPct = Math.min(rawPct, coupon.maximumDiscountAmount);
      }
      discount = Math.min(rawPct, grossAmount);
    }

    const netAmount = Math.max(0, grossAmount - discount);

    const couponSnapshot = {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      enabled: coupon.enabled,
      description: coupon.description,
      startDate: coupon.startDate,
      endDate: coupon.endDate,
      minimumCartAmount: coupon.minimumCartAmount,
      maximumDiscountAmount: coupon.maximumDiscountAmount,
      usageLimit: coupon.usageLimit,
      perUserLimit: coupon.perUserLimit,
      scope: coupon.scope,
      selectedProductIds: coupon.selectedProductIds,
      timesUsed: coupon.timesUsed,
      createdAt: coupon.createdAt,
      updatedAt: coupon.updatedAt,
    };

    return {
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: discount,
      netAmount,
      message: `Coupon "${coupon.code}" successfully applied! Saved ₹${discount}.`,
      coupon: couponSnapshot,
    };
  }

  /**
   * Records authoritative redemption upon verified payment
   */
  recordCouponRedemption(code?: string, userId?: string): void {
    if (!code) return;
    const coupon = this.couponsStore.get(code.toUpperCase());
    if (!coupon) return;

    coupon.timesUsed++;
    if (userId) {
      coupon.userUsageMap[userId] = (coupon.userUsageMap[userId] || 0) + 1;
    }
    coupon.updatedAt = new Date().toISOString();
  }

  // --------------------------------------------------------------------------
  // Admin Coupon Management
  // --------------------------------------------------------------------------

  getAllCoupons(): CouponItem[] {
    return Array.from(this.couponsStore.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getCoupon(code: string): CouponItem | undefined {
    return this.couponsStore.get(code.toUpperCase());
  }

  saveCoupon(data: Partial<CouponItem>): CouponItem {
    const rawCode = (data.code || '').trim().toUpperCase();
    if (!/^[A-Z0-9_-]{1,64}$/.test(rawCode)) {
      throw new Error('Coupon code must contain 1–64 letters, numbers, underscores or hyphens.');
    }

    const existing = this.couponsStore.get(rawCode);
    const now = new Date().toISOString();

    const updated: CouponItem = {
      code: rawCode,
      discountType: data.discountType || existing?.discountType || 'fixed',
      discountValue: Number(data.discountValue ?? existing?.discountValue ?? 100),
      enabled: data.enabled !== undefined ? Boolean(data.enabled) : existing?.enabled ?? true,
      description: data.description ?? existing?.description ?? '',
      startDate: data.startDate !== undefined ? data.startDate : existing?.startDate,
      endDate: data.endDate !== undefined ? data.endDate : existing?.endDate,
      minimumCartAmount: data.minimumCartAmount !== undefined ? (data.minimumCartAmount == null ? null : Number(data.minimumCartAmount)) : existing?.minimumCartAmount,
      maximumDiscountAmount: data.maximumDiscountAmount !== undefined ? (data.maximumDiscountAmount == null ? null : Number(data.maximumDiscountAmount)) : existing?.maximumDiscountAmount,
      usageLimit: data.usageLimit !== undefined ? (data.usageLimit == null ? null : Number(data.usageLimit)) : existing?.usageLimit,
      perUserLimit: data.perUserLimit !== undefined ? (data.perUserLimit == null ? null : Number(data.perUserLimit)) : existing?.perUserLimit ?? 1,
      scope: data.scope || existing?.scope || 'all',
      selectedProductIds: data.selectedProductIds || existing?.selectedProductIds || [],
      timesUsed: existing?.timesUsed || 0,
      userUsageMap: existing?.userUsageMap || {},
      // Admin form inputs must never override active reservations or redemption ledger.
      activeReservations: existing?.activeReservations || {},
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    if (!['fixed', 'percentage'].includes(updated.discountType) ||
        !Number.isFinite(updated.discountValue) || updated.discountValue <= 0 ||
        (updated.discountType === 'percentage' && updated.discountValue > 100)) throw new Error('Enter a valid positive discount (percentage at most 100).');
    if (!['all', 'annual_pass_only', 'selected_products'].includes(updated.scope)) throw new Error('Invalid coupon scope.');
    for (const value of [updated.minimumCartAmount, updated.maximumDiscountAmount, updated.usageLimit, updated.perUserLimit]) {
      if (value != null && (!Number.isFinite(value) || value <= 0)) throw new Error('Coupon limits must be positive numbers.');
    }
    for (const value of [updated.usageLimit, updated.perUserLimit]) {
      if (value != null && !Number.isInteger(value)) throw new Error('Redemption limits must be whole numbers.');
    }
    for (const date of [updated.startDate, updated.endDate]) {
      if (date && !Number.isFinite(Date.parse(date))) throw new Error('Invalid coupon date.');
    }
    if (updated.startDate && updated.endDate && updated.startDate > updated.endDate) throw new Error('End date must follow start date.');
    if (updated.scope === 'selected_products' && !updated.selectedProductIds?.length) throw new Error('Select at least one eligible product.');
    this.couponsStore.set(rawCode, updated);
    return updated;
  }

  deleteCoupon(code: string): boolean {
    const normalized = code.toUpperCase();
    const coupon = this.couponsStore.get(normalized);
    if (coupon && Object.values(coupon.activeReservations || {}).some(
      hold => Number.isFinite(Date.parse(hold.expiresAt)) && Date.parse(hold.expiresAt) > Date.now()
    )) throw new Error('Coupon has active checkout reservations. Disable it and retry after holds expire.');
    return this.couponsStore.delete(normalized);
  }

  // --------------------------------------------------------------------------
  // Promotional Blocks Management
  // --------------------------------------------------------------------------

  getAllPromotions(): PromotionalBlock[] {
    return Array.from(this.promotionsStore.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getPublicPromotions(placement?: 'homepage' | 'catalogue'): PromotionalBlock[] {
    const now = new Date();
    return Array.from(this.promotionsStore.values()).filter((p) => {
      if (!p.enabled) return false;
      if (placement && !p.targetPlacements.includes(placement)) return false;
      if (p.startsAt && now < new Date(p.startsAt)) return false;
      if (p.expiresAt && now > new Date(p.expiresAt)) return false;
      return true;
    });
  }

  savePromotion(data: Partial<PromotionalBlock>): PromotionalBlock {
    const id = data.id || `promo-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) throw new Error('Invalid promotion ID.');
    const existing = this.promotionsStore.get(id);
    const now = new Date().toISOString();

    const updated: PromotionalBlock = {
      id,
      title: data.title || existing?.title || 'Special Mathematics Promotion',
      subtitle: data.subtitle ?? existing?.subtitle ?? '',
      badgeText: data.badgeText ?? existing?.badgeText ?? 'LIMITED TIME OFFER',
      couponCode: data.couponCode !== undefined ? data.couponCode.trim().toUpperCase() : existing?.couponCode,
      targetPlacements: data.targetPlacements || existing?.targetPlacements || ['homepage'],
      ctaText: data.ctaText || existing?.ctaText || 'Get Offer Now',
      ctaLink: data.ctaLink || existing?.ctaLink || '/checkout',
      bannerStyle: data.bannerStyle || existing?.bannerStyle || 'gradient',
      enabled: data.enabled !== undefined ? Boolean(data.enabled) : existing?.enabled ?? true,
      startsAt: data.startsAt !== undefined ? data.startsAt : existing?.startsAt,
      expiresAt: data.expiresAt !== undefined ? data.expiresAt : existing?.expiresAt,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    if (!updated.targetPlacements.length || updated.targetPlacements.some(p => !['homepage', 'catalogue'].includes(p))) throw new Error('Choose a valid promotion placement.');
    if (!['gradient', 'urgent', 'accent', 'minimal'].includes(updated.bannerStyle)) throw new Error('Invalid banner style.');
    if (!(updated.ctaLink.startsWith('/') && !updated.ctaLink.startsWith('//') && !updated.ctaLink.includes('\\')) && !/^https:\/\//i.test(updated.ctaLink)) throw new Error('Use a site path or HTTPS link for the promotion.');
    for (const date of [updated.startsAt, updated.expiresAt]) {
      if (date && !Number.isFinite(Date.parse(date))) throw new Error('Invalid promotion date.');
    }
    if (updated.startsAt && updated.expiresAt && updated.startsAt > updated.expiresAt) throw new Error('Promotion end date must follow start date.');
    this.promotionsStore.set(id, updated);
    return updated;
  }

  deletePromotion(id: string): boolean {
    return this.promotionsStore.delete(id);
  }
}

export const couponService = new CouponService();
