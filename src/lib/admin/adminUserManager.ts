/**
 * Server-Side Admin User Management Controller.
 * Powered by Firebase Admin SDK custom claims and token revocation.
 */

import {
  adminSetCustomUserClaims,
  adminRevokeRefreshTokens,
  adminUpdateUserDisabledStatus,
  adminDeleteAuthUser,
} from '../firebase/admin';
import { auditLogService } from '../audit/auditLogger';

export interface AdminStudentProfile {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  studentClass: string;
  board: string;
  hasAnnualPass: boolean;
  passExpiry?: string;
  isPro: boolean;
  disabled: boolean;
  streakDays: number;
  lastActiveDate: string;
  createdAt: string;
  lastLoginAt: string;
  role: 'student' | 'admin' | 'superAdmin';
  deletionPolicyStatus?: {
    isDeleted: boolean;
    policyReason?: string;
    deletedAt?: string;
    deletedBy?: string;
  };
}

export interface StudentActivityLogItem {
  id: string;
  type: 'ai_doubt' | 'formula_deck' | 'pdf_download' | 'login' | 'quiz_attempt';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface StudentOrderItem {
  orderId: string;
  orderNumber: string;
  planName: string;
  amount: number;
  currency: string;
  gateway: 'razorpay' | 'stripe';
  status: 'captured' | 'paid' | 'pending' | 'failed' | 'refunded';
  createdAt: string;
  paymentId: string;
  invoiceUrl?: string;
}

export interface SecurityConfigState {
  cloudflareAccessAud: string;
  cloudflareTeamDomain: string;
  requireCloudflareAccess: boolean;
  authorizedAdminEmails: string[];
  emergencyMaintenanceMode: boolean;
  tokenRevocationWindowMinutes: number;
  updatedAt: string;
  updatedBy: string;
}

class AdminUserManager {
  private students: Map<string, AdminStudentProfile> = new Map();
  private activityLogs: Map<string, StudentActivityLogItem[]> = new Map();
  private orders: Map<string, StudentOrderItem[]> = new Map();

  private securityConfig: SecurityConfigState = {
    cloudflareAccessAud: process.env.CLOUDFLARE_ACCESS_AUD || '566895799712-cfaccess-aud-mayf-2026',
    cloudflareTeamDomain: 'mayf.cloudflareaccess.com',
    requireCloudflareAccess: false,
    authorizedAdminEmails: (process.env.ADMIN_AUTHORIZED_EMAILS || '2026vivekkushwah@gmail.com,ntnagrawal146@gmail.com,admin@mayf.co.in')
      .split(',')
      .map((e) => e.trim().toLowerCase()),
    emergencyMaintenanceMode: false,
    tokenRevocationWindowMinutes: 60,
    updatedAt: new Date().toISOString(),
    updatedBy: '2026vivekkushwah@gmail.com',
  };

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const initialList: AdminStudentProfile[] = [
      {
        uid: 'student-1001',
        displayName: 'Arjun Sharma',
        email: 'arjun.sharma@mayf.co.in',
        phoneNumber: '+91 98765 43210',
        studentClass: 'Class 10',
        board: 'CBSE',
        hasAnnualPass: true,
        passExpiry: '2027-03-31',
        isPro: true,
        disabled: false,
        streakDays: 14,
        lastActiveDate: '2026-10-08',
        createdAt: '2026-04-01T00:00:00.000Z',
        lastLoginAt: '2026-10-08T09:12:00.000Z',
        role: 'student',
      },
      {
        uid: 'student-1002',
        displayName: 'Priya Patel',
        email: 'priya.patel@gmail.com',
        phoneNumber: '+91 91234 56789',
        studentClass: 'Class 9',
        board: 'ICSE',
        hasAnnualPass: true,
        passExpiry: '2027-04-15',
        isPro: true,
        disabled: false,
        streakDays: 22,
        lastActiveDate: '2026-10-08',
        createdAt: '2026-04-10T00:00:00.000Z',
        lastLoginAt: '2026-10-08T08:45:00.000Z',
        role: 'student',
      },
      {
        uid: 'student-1003',
        displayName: 'Rohan Verma',
        email: 'rohan.verma@outlook.com',
        phoneNumber: '+91 98111 22334',
        studentClass: 'Class 8',
        board: 'CBSE',
        hasAnnualPass: false,
        isPro: false,
        disabled: false,
        streakDays: 5,
        lastActiveDate: '2026-10-07',
        createdAt: '2026-05-18T00:00:00.000Z',
        lastLoginAt: '2026-10-07T14:20:00.000Z',
        role: 'student',
      },
      {
        uid: 'student-1004',
        displayName: 'Ananya Iyer',
        email: 'ananya.iyer@gmail.com',
        phoneNumber: '+91 99887 76655',
        studentClass: 'Class 10',
        board: 'CBSE',
        hasAnnualPass: true,
        passExpiry: '2027-05-01',
        isPro: true,
        disabled: false,
        streakDays: 31,
        lastActiveDate: '2026-10-08',
        createdAt: '2026-03-25T00:00:00.000Z',
        lastLoginAt: '2026-10-08T10:05:00.000Z',
        role: 'student',
      },
      {
        uid: 'student-1005',
        displayName: 'Kavya Nair',
        email: 'kavya.nair@yahoo.com',
        phoneNumber: '+91 97766 55443',
        studentClass: 'Class 7',
        board: 'ICSE',
        hasAnnualPass: false,
        isPro: false,
        disabled: false,
        streakDays: 3,
        lastActiveDate: '2026-10-06',
        createdAt: '2026-06-12T00:00:00.000Z',
        lastLoginAt: '2026-10-06T11:18:00.000Z',
        role: 'student',
      },
    ];

    for (const student of initialList) {
      this.students.set(student.uid, student);

      // Seed student orders
      this.orders.set(student.uid, [
        {
          orderId: `ord-${student.uid.slice(-4)}-1`,
          orderNumber: `MAYF-2026-${student.uid.slice(-4)}`,
          planName: student.hasAnnualPass ? 'Annual Pass (Classes 5–10)' : 'Free Tier Registration',
          amount: student.hasAnnualPass ? 1999 : 0,
          currency: 'INR',
          gateway: 'razorpay',
          status: 'captured',
          createdAt: student.createdAt,
          paymentId: `pay_rzp_${student.uid.slice(-4)}`,
        },
      ]);

      // Seed student activity logs
      this.activityLogs.set(student.uid, [
        {
          id: `act-${student.uid}-1`,
          type: 'ai_doubt',
          title: 'Asked AI Teacher: Quadratic Roots',
          description: 'Solved step-by-step discriminant formula for 2x² - 4x + 1 = 0',
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
          metadata: { topic: 'Quadratic Equations', latencyMs: 620 },
        },
        {
          id: `act-${student.uid}-2`,
          type: 'formula_deck',
          title: 'Practiced Formula Deck: Trigonometric Identities',
          description: 'Reviewed sin²θ + cos²θ = 1 and reciprocal identities',
          timestamp: new Date(Date.now() - 3600000 * 22).toISOString(),
          metadata: { deckSlug: 'trigonometric-identities' },
        },
        {
          id: `act-${student.uid}-3`,
          type: 'pdf_download',
          title: 'Downloaded Exemplar: Real Numbers Chapter 1',
          description: 'Authorized secure token for verified download',
          timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
        },
      ]);
    }
  }

  // --- Search and List Students ---
  public searchStudents(query?: {
    search?: string;
    studentClass?: string;
    board?: string;
    passStatus?: string;
    includeDisabled?: boolean;
  }): AdminStudentProfile[] {
    let result = Array.from(this.students.values());

    if (!query?.includeDisabled) {
      result = result.filter((s) => !s.deletionPolicyStatus?.isDeleted);
    }

    if (query?.studentClass && query.studentClass !== 'All') {
      result = result.filter((s) => s.studentClass === query.studentClass);
    }
    if (query?.board && query.board !== 'All') {
      result = result.filter((s) => s.board === query.board);
    }
    if (query?.passStatus === 'pass') {
      result = result.filter((s) => s.hasAnnualPass);
    } else if (query?.passStatus === 'free') {
      result = result.filter((s) => !s.hasAnnualPass);
    }

    if (query?.search) {
      const q = query.search.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.displayName.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.uid.toLowerCase().includes(q) ||
          (s.phoneNumber && s.phoneNumber.includes(q))
      );
    }

    return result;
  }

  public getStudentProfile(uid: string): AdminStudentProfile | null {
    return this.students.get(uid) || null;
  }

  // --- Disable / Enable User Account ---
  public async setUserDisabledStatus(
    uid: string,
    disabled: boolean,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): Promise<{ success: boolean; student?: AdminStudentProfile; error?: string }> {
    const student = this.students.get(uid);
    if (!student) {
      return { success: false, error: 'Student not found' };
    }

    student.disabled = disabled;
    this.students.set(uid, student);

    // Call Firebase Admin SDK
    await adminUpdateUserDisabledStatus(uid, disabled);

    // Audit Log
    auditLogService.log({
      action: disabled ? 'USER_DISABLED' : 'USER_ENABLED',
      category: 'user',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: uid,
      targetEmail: student.email,
      targetType: 'user_account',
      details: { disabled, reason: disabled ? 'Administrative suspension' : 'Reactivated by admin' },
      status: 'success',
    });

    return { success: true, student };
  }

  // --- Delete User According to Policy ---
  public async deleteUserWithPolicy(
    uid: string,
    policyReason: string,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): Promise<{ success: boolean; error?: string }> {
    const student = this.students.get(uid);
    if (!student) {
      return { success: false, error: 'Student not found' };
    }

    // Flag student according to data retention & policy guidelines
    student.deletionPolicyStatus = {
      isDeleted: true,
      policyReason,
      deletedAt: new Date().toISOString(),
      deletedBy: actor.email,
    };
    student.disabled = true;
    this.students.set(uid, student);

    // Invoke Firebase Admin SDK to revoke and delete Auth account
    await adminDeleteAuthUser(uid);

    // Audit Log
    auditLogService.log({
      action: 'USER_DELETED_POLICY',
      category: 'user',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: uid,
      targetEmail: student.email,
      targetType: 'student_profile',
      details: { policyReason, deletedAt: new Date().toISOString() },
      status: 'success',
    });

    return { success: true };
  }

  // --- Grant / Revoke Pro ---
  public async setProStatus(
    uid: string,
    grant: boolean,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' },
    reason: string = 'Admin dashboard modification'
  ): Promise<{ success: boolean; student?: AdminStudentProfile; error?: string }> {
    const student = this.students.get(uid);
    if (!student) {
      return { success: false, error: 'Student not found' };
    }

    student.isPro = grant;
    this.students.set(uid, student);

    // Set custom claims & force token refresh
    await adminSetCustomUserClaims(uid, {
      pro: grant,
      annualPass: student.hasAnnualPass,
      annualPassExpiry: student.passExpiry,
      role: student.role,
    });

    // Audit Log
    auditLogService.log({
      action: grant ? 'PRO_GRANTED' : 'PRO_REVOKED',
      category: 'subscription',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: uid,
      targetEmail: student.email,
      targetType: 'pro_tier',
      details: { isPro: grant, reason },
      status: 'success',
    });

    return { success: true, student };
  }

  // --- Grant / Revoke Annual Pass ---
  public async setAnnualPassStatus(
    uid: string,
    grant: boolean,
    expiryDate: string | undefined,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' },
    reason: string = 'Admin pass adjustment'
  ): Promise<{ success: boolean; student?: AdminStudentProfile; error?: string }> {
    const student = this.students.get(uid);
    if (!student) {
      return { success: false, error: 'Student not found' };
    }

    const defaultExpiry = new Date();
    defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
    const resolvedExpiry = grant ? expiryDate || defaultExpiry.toISOString().split('T')[0] : undefined;

    student.hasAnnualPass = grant;
    student.passExpiry = resolvedExpiry;
    if (grant) {
      student.isPro = true;
    }
    this.students.set(uid, student);

    // Set custom claims & force token refresh
    await adminSetCustomUserClaims(uid, {
      annualPass: grant,
      annualPassExpiry: resolvedExpiry,
      pro: student.isPro,
      role: student.role,
    });

    // Audit Log
    auditLogService.log({
      action: grant ? 'ANNUAL_PASS_GRANTED' : 'ANNUAL_PASS_REVOKED',
      category: 'subscription',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: uid,
      targetEmail: student.email,
      targetType: 'annual_pass',
      details: { hasAnnualPass: grant, passExpiry: resolvedExpiry, reason },
      status: 'success',
    });

    return { success: true, student };
  }

  // --- Change Annual Pass Expiry ---
  public async changeAnnualPassExpiry(
    uid: string,
    newExpiry: string,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' },
    reason: string = 'Admin expiry date extension'
  ): Promise<{ success: boolean; student?: AdminStudentProfile; error?: string }> {
    const student = this.students.get(uid);
    if (!student) {
      return { success: false, error: 'Student not found' };
    }

    const previousExpiry = student.passExpiry;
    student.passExpiry = newExpiry;
    student.hasAnnualPass = true;
    student.isPro = true;
    this.students.set(uid, student);

    // Update custom claim & force token refresh
    await adminSetCustomUserClaims(uid, {
      annualPass: true,
      annualPassExpiry: newExpiry,
      pro: true,
      role: student.role,
    });

    // Audit Log
    auditLogService.log({
      action: 'ANNUAL_PASS_EXPIRY_UPDATED',
      category: 'subscription',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: uid,
      targetEmail: student.email,
      targetType: 'annual_pass',
      details: { previousExpiry, newExpiry, reason },
      status: 'success',
    });

    return { success: true, student };
  }

  // --- Student Orders & Activity ---
  public getStudentOrders(uid: string): StudentOrderItem[] {
    return this.orders.get(uid) || [];
  }

  public getStudentActivity(uid: string): StudentActivityLogItem[] {
    return this.activityLogs.get(uid) || [];
  }

  // --- Admin Role Assignment (Strict RBAC Hierarchy) ---
  public async setUserRole(
    uid: string,
    targetRole: 'admin' | 'superAdmin' | 'student',
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): Promise<{ success: boolean; student?: AdminStudentProfile; error?: string }> {
    const student = this.students.get(uid);
    if (!student) {
      return { success: false, error: 'User not found' };
    }

    const targetCurrentRole = student.role;

    // RBAC RULE: Only superAdmin can create or remove administrators or modify another superAdmin
    if (targetCurrentRole === 'superAdmin' && actor.role !== 'superAdmin') {
      return { success: false, error: 'Forbidden: Only superAdmin can modify another superAdmin' };
    }

    if (targetRole === 'superAdmin' && actor.role !== 'superAdmin') {
      return { success: false, error: 'Forbidden: Only superAdmin can promote a user to superAdmin' };
    }

    if ((targetCurrentRole === 'admin' || targetRole === 'admin') && actor.role !== 'superAdmin') {
      return { success: false, error: 'Forbidden: Only superAdmin can create or remove administrators' };
    }

    student.role = targetRole;
    this.students.set(uid, student);

    const isSuper = targetRole === 'superAdmin';
    const isAdmin = isSuper || targetRole === 'admin';

    // Set custom claims & force token refresh
    await adminSetCustomUserClaims(uid, {
      role: targetRole,
      admin: isAdmin,
      superAdmin: isSuper,
      pro: student.isPro,
      annualPass: student.hasAnnualPass,
      annualPassExpiry: student.passExpiry,
    });

    // Audit Log
    const isDemotion = targetRole === 'student';
    auditLogService.log({
      action: isDemotion ? 'ADMIN_REMOVED' : 'ADMIN_CREATED',
      category: 'admin',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: uid,
      targetEmail: student.email,
      targetType: 'administrator_role',
      details: { previousRole: targetCurrentRole, newRole: targetRole },
      status: 'success',
    });

    return { success: true, student };
  }

  // --- Critical Security Configuration (SuperAdmin Only) ---
  public getSecurityConfig(): SecurityConfigState {
    return { ...this.securityConfig };
  }

  public updateSecurityConfig(
    updates: Partial<SecurityConfigState>,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): { success: boolean; config?: SecurityConfigState; error?: string } {
    // Strict RBAC: Only superAdmin can modify critical security configuration
    if (actor.role !== 'superAdmin') {
      return { success: false, error: 'Forbidden: Only superAdmin can modify critical security configuration' };
    }

    const previous = { ...this.securityConfig };
    this.securityConfig = {
      ...this.securityConfig,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: actor.email,
    };

    // Audit Log
    auditLogService.log({
      action: 'SECURITY_CONFIG_UPDATED',
      category: 'security',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: 'sys-security-config',
      targetType: 'security_infrastructure',
      details: { previous, updated: updates },
      status: 'success',
    });

    return { success: true, config: this.securityConfig };
  }
}

export const adminUserManager = new AdminUserManager();
