/**
 * Authoritative Annual Pass & Entitlement Service
 * Maths at Your Fingertips (mayf.co.in)
 *
 * Implements:
 * - Configurable Annual Pass settings (enabled, pricing, duration default 365 days, benefits, eligible content, promo dates)
 * - Server-side authoritative entitlement verification before serving premium resources
 * - Automatic expiry enforcement without touching the student's order history
 * - Admin capabilities: Grant, Extend, Revoke, and full audit History logging
 */

import crypto from 'crypto';
import {
  AnnualPassSettings,
  Entitlement,
  EntitlementStatus,
  EntitlementHistoryLog,
  GrantAnnualPassRequest,
  ExtendAnnualPassRequest,
  RevokeAnnualPassRequest,
} from './types';

export class EntitlementService {
  // Configurable settings
  private settings: AnnualPassSettings;

  // Stored Entitlements: entitlementId -> Entitlement
  private entitlementsStore: Map<string, Entitlement> = new Map();

  // Audit History Logs
  private historyLogs: EntitlementHistoryLog[] = [];

  constructor() {
    this.settings = {
      enabled: true,
      name: 'Maths at Your Fingertips All-Class Annual Pass',
      regularPrice: 1999,
      salePrice: 999,
      currency: 'INR',
      durationDays: 365, // Default duration: 365 days
      description:
        'Complete, unrestricted digital access to all Class 5–10 chapters, formulas, exemplar solutions, high-resolution PDF cheatsheets, and 24/7 Professor Sigma AI Teacher.',
      benefits: [
        'All 50+ Chapters across Class 5, 6, 7, 8, 9 & 10 (CBSE & ICSE)',
        '80+ Interactive Formula Flashcards with rigorous step-by-step derivations',
        'Unlimited 24/7 Multimodal AI Teacher (Professor Sigma) doubts',
        'High-resolution printable PDF Formula Cheatsheets & Geometry Theorems',
        '10-Year NCERT Exemplar & Board Exam Past Paper Step Breakdowns',
        '100% 7-Day Money-Back Guarantee',
      ],
      eligibleContent: [
        'Class 5',
        'Class 6',
        'Class 7',
        'Class 8',
        'Class 9',
        'Class 10',
        'Formula Flashcards',
        'AI Teacher Tutor',
        'Printable PDF Cheatsheets',
        'Solved Board Papers',
      ],
      promotionalStartDate: '2026-04-01',
      promotionalEndDate: '2027-03-31',
      updatedAt: new Date().toISOString(),
      updatedBy: 'system_init',
    };

    this.seedInitialEntitlements();
  }

  /**
   * Seed realistic initial entitlement for demo student
   */
  private seedInitialEntitlements(): void {
    const seedStarts = new Date('2026-04-01T00:00:00.000Z');
    const seedExpires = new Date(seedStarts.getTime() + 365 * 24 * 60 * 60 * 1000); // 365 days

    const seedEntitlement: Entitlement = {
      id: 'ent-seed-1001',
      userId: 'mayf-student-1001',
      type: 'annual_pass',
      startsAt: seedStarts.toISOString(),
      expiresAt: seedExpires.toISOString(),
      status: 'active',
      grantedBy: 'payment',
      orderId: 'MAYF-ORD-2026-1001',
      paymentId: 'pay_rzp_tx_99201_succ',
      notes: 'Initial seed Annual Pass purchase',
      createdAt: seedStarts.toISOString(),
      updatedAt: seedStarts.toISOString(),
    };

    this.entitlementsStore.set(seedEntitlement.id, seedEntitlement);

    this.historyLogs.unshift({
      id: 'hist-seed-1',
      entitlementId: seedEntitlement.id,
      userId: seedEntitlement.userId,
      action: 'created',
      actor: 'payment_webhook',
      actorId: 'MAYF-ORD-2026-1001',
      newExpiresAt: seedEntitlement.expiresAt,
      newStatus: 'active',
      reason: 'Authoritative payment verified by Razorpay gateway',
      timestamp: seedStarts.toISOString(),
    });
  }

  // --------------------------------------------------------------------------
  // Settings Management
  // --------------------------------------------------------------------------

  getSettings(): AnnualPassSettings {
    return { ...this.settings };
  }

  updateSettings(partial: Partial<AnnualPassSettings>, adminId = 'admin'): AnnualPassSettings {
    this.settings = {
      ...this.settings,
      ...partial,
      durationDays: partial.durationDays && partial.durationDays > 0 ? partial.durationDays : this.settings.durationDays,
      regularPrice: partial.regularPrice !== undefined ? Math.max(0, partial.regularPrice) : this.settings.regularPrice,
      salePrice: partial.salePrice !== undefined ? Math.max(0, partial.salePrice) : this.settings.salePrice,
      updatedAt: new Date().toISOString(),
      updatedBy: adminId,
    };
    return { ...this.settings };
  }

  // --------------------------------------------------------------------------
  // Entitlement Creation (Upon verified payment)
  // --------------------------------------------------------------------------

  /**
   * After successful payment, create an entitlement containing:
   * userId, type = annual_pass, startsAt, expiresAt, status
   */
  createOrRenewFromPayment(params: {
    userId: string;
    orderId: string;
    paymentId?: string;
    durationDays?: number;
  }): Entitlement {
    const duration = params.durationDays || this.settings.durationDays || 365;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);

    const entitlementId = `ent-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const entitlement: Entitlement = {
      id: entitlementId,
      userId: params.userId,
      type: 'annual_pass',
      startsAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'active',
      grantedBy: 'payment',
      orderId: params.orderId,
      paymentId: params.paymentId,
      notes: `Granted via authoritative payment order ${params.orderId}`,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    this.entitlementsStore.set(entitlement.id, entitlement);

    this.logHistory({
      entitlementId: entitlement.id,
      userId: params.userId,
      action: 'created',
      actor: 'payment_webhook',
      actorId: params.orderId,
      newExpiresAt: entitlement.expiresAt,
      newStatus: 'active',
      reason: `Successful payment verification for order ${params.orderId} (${duration} days)`,
    });

    return entitlement;
  }

  // --------------------------------------------------------------------------
  // Server-Side Entitlement Check & Automatic Expiry
  // --------------------------------------------------------------------------

  /**
   * Authoritatively checks if a student has an active Annual Pass right now.
   * If entitlement has reached its expiresAt timestamp, access automatically stops
   * without deleting the student's order history.
   */
  checkActiveEntitlement(userId: string): {
    active: boolean;
    entitlement?: Entitlement;
    daysRemaining: number;
    reason?: string;
  } {
    if (!userId) {
      return { active: false, daysRemaining: 0, reason: 'User ID missing' };
    }

    const nowTime = Date.now();
    // Search user entitlements for type 'annual_pass'
    const userPasses = Array.from(this.entitlementsStore.values())
      .filter((e) => e.userId === userId && e.type === 'annual_pass')
      .sort((a, b) => new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime());

    if (userPasses.length === 0) {
      return { active: false, daysRemaining: 0, reason: 'No Annual Pass found for student' };
    }

    const latestPass = userPasses[0];
    const expiryTime = new Date(latestPass.expiresAt).getTime();
    const startTime = new Date(latestPass.startsAt).getTime();

    // 1. Explicitly revoked by administrator
    if (latestPass.status === 'revoked') {
      return {
        active: false,
        entitlement: latestPass,
        daysRemaining: 0,
        reason: 'Annual Pass access has been revoked by an administrator',
      };
    }

    // 2. Expired: access automatically stops without deleting the student's order history!
    if (expiryTime <= nowTime) {
      if (latestPass.status === 'active') {
        // Automatically transition state to expired
        latestPass.status = 'expired';
        latestPass.updatedAt = new Date().toISOString();
        this.logHistory({
          entitlementId: latestPass.id,
          userId: latestPass.userId,
          action: 'expired',
          actor: 'system',
          previousExpiresAt: latestPass.expiresAt,
          previousStatus: 'active',
          newStatus: 'expired',
          reason: 'Pass reached scheduled expiry date. Access automatically stopped; order records preserved.',
        });
      }
      return {
        active: false,
        entitlement: latestPass,
        daysRemaining: 0,
        reason: `Annual Pass expired on ${new Date(latestPass.expiresAt).toLocaleDateString()}`,
      };
    }

    // 3. Not yet started
    if (startTime > nowTime) {
      return {
        active: false,
        entitlement: latestPass,
        daysRemaining: 0,
        reason: 'Annual Pass is scheduled for a future academic period',
      };
    }

    // 4. Fully Active
    const daysRemaining = Math.max(1, Math.ceil((expiryTime - nowTime) / (24 * 60 * 60 * 1000)));
    return {
      active: true,
      entitlement: latestPass,
      daysRemaining,
    };
  }

  // --------------------------------------------------------------------------
  // Admin Operations: Grant, Extend, Revoke, View History
  // --------------------------------------------------------------------------

  /**
   * Admin can: Grant Annual Pass
   */
  grantPass(req: GrantAnnualPassRequest): Entitlement {
    const duration = req.durationDays || this.settings.durationDays || 365;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);

    const entitlementId = `ent-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const entitlement: Entitlement = {
      id: entitlementId,
      userId: req.userId,
      type: 'annual_pass',
      startsAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'active',
      grantedBy: 'admin',
      notes: req.notes || `Granted by admin (${duration} days)`,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    this.entitlementsStore.set(entitlement.id, entitlement);

    this.logHistory({
      entitlementId: entitlement.id,
      userId: req.userId,
      action: 'granted',
      actor: 'admin',
      actorId: req.adminId || 'admin',
      newExpiresAt: entitlement.expiresAt,
      newStatus: 'active',
      reason: req.notes || `Administrator manually granted Annual Pass (${duration} days)`,
    });

    return entitlement;
  }

  /**
   * Admin can: Extend Annual Pass
   */
  extendPass(req: ExtendAnnualPassRequest): Entitlement {
    const userPasses = Array.from(this.entitlementsStore.values())
      .filter((e) => e.userId === req.userId && e.type === 'annual_pass')
      .sort((a, b) => new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime());

    let targetPass: Entitlement;
    const now = new Date();

    if (userPasses.length > 0) {
      targetPass = userPasses[0];
    } else {
      // Create new pass if student didn't have one
      return this.grantPass({
        userId: req.userId,
        durationDays: req.daysToAdd || 365,
        notes: `Created & extended by admin: ${req.reason || 'Manual extension'}`,
        adminId: req.adminId,
      });
    }

    const previousExpiresAt = targetPass.expiresAt;
    const previousStatus = targetPass.status;

    let newExpiryTime: number;
    if (req.newExpiresAt) {
      newExpiryTime = new Date(req.newExpiresAt).getTime();
    } else {
      const days = req.daysToAdd || 30;
      // If already expired or revoked, start from now; otherwise add to existing expiry
      const baseTime =
        targetPass.status === 'active' && new Date(targetPass.expiresAt).getTime() > now.getTime()
          ? new Date(targetPass.expiresAt).getTime()
          : now.getTime();
      newExpiryTime = baseTime + days * 24 * 60 * 60 * 1000;
    }

    targetPass.expiresAt = new Date(newExpiryTime).toISOString();
    targetPass.status = 'active'; // Reactivate if was expired
    targetPass.updatedAt = now.toISOString();
    if (req.reason) {
      targetPass.notes = `${targetPass.notes ? targetPass.notes + ' | ' : ''}Extended: ${req.reason}`;
    }

    this.logHistory({
      entitlementId: targetPass.id,
      userId: targetPass.userId,
      action: 'extended',
      actor: 'admin',
      actorId: req.adminId || 'admin',
      previousExpiresAt,
      newExpiresAt: targetPass.expiresAt,
      previousStatus,
      newStatus: 'active',
      reason: req.reason || `Administrator extended validity by ${req.daysToAdd || 'custom'} days`,
    });

    return targetPass;
  }

  /**
   * Admin can: Revoke Annual Pass
   */
  revokePass(req: RevokeAnnualPassRequest): Entitlement {
    const userPasses = Array.from(this.entitlementsStore.values())
      .filter((e) => e.userId === req.userId && e.type === 'annual_pass')
      .sort((a, b) => new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime());

    if (userPasses.length === 0) {
      throw new Error(`No Annual Pass entitlement found for student ID "${req.userId}" to revoke.`);
    }

    const targetPass = userPasses[0];
    const previousStatus = targetPass.status;
    targetPass.status = 'revoked';
    targetPass.updatedAt = new Date().toISOString();
    if (req.reason) {
      targetPass.notes = `${targetPass.notes ? targetPass.notes + ' | ' : ''}Revoked: ${req.reason}`;
    }

    this.logHistory({
      entitlementId: targetPass.id,
      userId: targetPass.userId,
      action: 'revoked',
      actor: 'admin',
      actorId: req.adminId || 'admin',
      previousStatus,
      newStatus: 'revoked',
      reason: req.reason || 'Administrator manually revoked Annual Pass access',
    });

    return targetPass;
  }

  /**
   * Admin can: View History
   */
  getHistory(userId?: string): EntitlementHistoryLog[] {
    // Run lazy check to ensure expired timestamps are recorded in history
    this.refreshAllExpiryStates();

    if (userId) {
      return this.historyLogs.filter((l) => l.userId === userId);
    }
    return [...this.historyLogs];
  }

  getAllEntitlements(): Entitlement[] {
    this.refreshAllExpiryStates();
    return Array.from(this.entitlementsStore.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getUserEntitlements(userId: string): Entitlement[] {
    this.refreshAllExpiryStates();
    return Array.from(this.entitlementsStore.values())
      .filter((e) => e.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private refreshAllExpiryStates(): void {
    const nowTime = Date.now();
    for (const entitlement of this.entitlementsStore.values()) {
      if (entitlement.status === 'active' && new Date(entitlement.expiresAt).getTime() <= nowTime) {
        entitlement.status = 'expired';
        entitlement.updatedAt = new Date().toISOString();
        this.logHistory({
          entitlementId: entitlement.id,
          userId: entitlement.userId,
          action: 'expired',
          actor: 'system',
          previousExpiresAt: entitlement.expiresAt,
          previousStatus: 'active',
          newStatus: 'expired',
          reason: 'Pass reached scheduled expiry date. Access automatically stopped; order records preserved.',
        });
      }
    }
  }

  private logHistory(entry: Omit<EntitlementHistoryLog, 'id' | 'timestamp'>): void {
    const log: EntitlementHistoryLog = {
      ...entry,
      id: `log-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      timestamp: new Date().toISOString(),
    };
    this.historyLogs.unshift(log);
    if (this.historyLogs.length > 500) {
      this.historyLogs.pop();
    }
  }
}

export const entitlementService = new EntitlementService();
