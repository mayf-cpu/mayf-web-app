/**
 * Complete Firestore Domain Models for Maths at Your Fingertips (MAYF).
 * Strict type definitions covering all 21 collections.
 */

export type StudentClass = 'Class 5' | 'Class 6' | 'Class 7' | 'Class 8' | 'Class 9' | 'Class 10';
export type BoardType = 'CBSE' | 'ICSE' | 'State Board';
export type UserRole = 'student' | 'admin' | 'superAdmin';

/**
 * Access Control Custom Claims (Stored in Firebase Auth token, NOT trusted from client payload)
 */
export interface AuthCustomClaims {
  role: UserRole;
  pro?: boolean;
  annualPass?: boolean;
  annualPassExpiry?: string;
}

/**
 * 1. User Profile Document (/users/{uid})
 * Profile data is strictly segregated from authorization claims.
 */
export interface UserProfileDoc {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  studentClass: StudentClass;
  board: BoardType;
  phoneNumber?: string;
  streakDays: number;
  lastActiveDate: string;
  createdAt: string;
  lastLoginAt?: string;
  updatedAt: string;
}

/**
 * 2. Content Item Collection (/contentItems/{contentId})
 */
export type ContentType =
  | 'pdf'
  | 'multiImage'
  | 'singleImage'
  | 'video'
  | 'reel'
  | 'youtube'
  | 'facebook'
  | 'testPaper'
  | 'worksheet'
  | 'formulaSheet'
  | 'course'
  | 'other';

export type ContentAccessType = 'free' | 'paid';

export interface ContentFileAttachment {
  name: string;
  url: string;
  sizeBytes: number;
  mimeType: string;
}

export interface ContentItem {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  classLevels: StudentClass[];
  categoryId: string;
  subcategoryId?: string;
  topic?: string;
  contentType: ContentType;
  thumbnail?: string;
  files?: ContentFileAttachment[];
  embedUrl?: string;
  source?: string;
  accessType: ContentAccessType;
  price?: number;
  currency?: 'INR' | string;
  annualPassIncluded?: boolean;
  downloadAllowed?: boolean;
  visible: boolean;
  featured?: boolean;
  trending?: boolean;
  tags?: string[];
  searchTerms?: string[];
  seoTitle?: string;
  seoDescription?: string;
  socialImage?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  viewCount: number;
  downloadCount: number;
}

/**
 * 3. Category Collection (/categories/{categoryId})
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  subcategories?: { id: string; name: string; slug: string }[];
}

/**
 * 4. Orders Collection (/orders/{orderId})
 */
export type OrderStatus = 'created' | 'pending' | 'completed' | 'failed' | 'refunded';

export interface OrderItem {
  contentItemId?: string;
  annualPass?: boolean;
  title: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  amount: number;
  currency: 'INR';
  items: OrderItem[];
  couponCode?: string;
  discountAmount?: number;
  paymentGatewayTransactionId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 5. Payments Collection (/payments/{paymentId})
 */
export type PaymentStatus = 'authorized' | 'captured' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  gateway: 'razorpay' | 'stripe' | 'test';
  gatewayTransactionId: string;
  status: PaymentStatus;
  amount: number;
  currency: 'INR';
  createdAt: string;
}

/**
 * 6. Entitlements Collection (/entitlements/{entitlementId})
 */
export interface Entitlement {
  id: string;
  userId: string;
  contentItemId: string;
  grantedBy: 'direct_purchase' | 'annual_pass' | 'admin_grant';
  validUntil?: string;
  createdAt: string;
}

/**
 * 7. Annual Passes Collection (/annualPasses/{passId})
 */
export interface AnnualPass {
  id: string;
  userId: string;
  status: 'active' | 'expired' | 'cancelled' | 'refunded';
  startDate: string;
  endDate: string;
  orderId: string;
  academicYear: string;
  createdAt: string;
}

/**
 * 8. Coupons Collection (/coupons/{couponId})
 */
export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses?: number;
  usedCount: number;
  validUntil?: string;
  active: boolean;
}

/**
 * 9. Promotions Collection (/promotions/{promoId})
 */
export interface Promotion {
  id: string;
  title: string;
  bannerText: string;
  ctaUrl?: string;
  active: boolean;
  startsAt?: string;
  endsAt?: string;
}

/**
 * 10. AI Teacher Doubt Sessions (/aiTeacherSessions/{sessionId})
 */
export interface AiChatMessage {
  id: string;
  sender: 'student' | 'ai_teacher';
  text: string;
  timestamp: string;
  suggestedFormulas?: string[];
  stepHints?: string[];
}

export interface AiTeacherSession {
  id: string;
  userId: string;
  title: string;
  studentClass: StudentClass;
  chapterTopic?: string;
  messages: AiChatMessage[];
  lastUpdated: string;
  createdAt: string;
}

/**
 * 11. Activity Logs (/activityLogs/{logId})
 * Only useful product events stored with retention capping.
 */
export type ActivityEventType =
  | 'content_view'
  | 'download'
  | 'save'
  | 'unsave'
  | 'ai_question'
  | 'purchase'
  | 'course_open'
  | 'formula_view';

export interface ActivityLog {
  id: string;
  userId: string;
  eventType: ActivityEventType;
  title: string;
  targetId?: string;
  targetSlug?: string;
  targetType?: 'formula' | 'chapter' | 'download' | 'course' | 'ai_doubt' | 'membership' | 'general';
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface RecentlyViewedItem {
  id: string;
  title: string;
  type: 'formula' | 'chapter' | 'course';
  slug: string;
  category?: string;
  classLevel?: StudentClass;
  viewedAt: string;
}

export interface StudentCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  targetClass: StudentClass;
  totalChapters: number;
  completedChapters: number;
  totalFormulas: number;
  level: 'Foundation' | 'Standard' | 'Board Exemplar';
  topics: string[];
  bannerGradient: string;
}

/**
 * 12. Saved Items (/savedItems/{savedId})
 */
export interface SavedItem {
  id: string;
  userId: string;
  contentItemId: string;
  itemType: 'formula' | 'chapter' | 'content';
  title: string;
  slug: string;
  classLevel?: StudentClass;
  createdAt: string;
}

/**
 * 13. Notifications (/notifications/{notificationId})
 */
export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  linkUrl?: string;
  createdAt: string;
}

/**
 * 14. Broadcasts (/broadcasts/{broadcastId})
 */
export interface Broadcast {
  id: string;
  title: string;
  content: string;
  priority: 'normal' | 'urgent';
  active: boolean;
  createdAt: string;
}

/**
 * 15. Social Links (/socialLinks/{linkId})
 */
export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  title: string;
  sortOrder: number;
}

/**
 * 16. Site Settings (/siteSettings/{settingId})
 */
export interface SiteSettings {
  id: string;
  annualPassPriceInr: number;
  supportEmail: string;
  supportPhone?: string;
  maintenanceMode: boolean;
  updatedAt: string;
}

/**
 * 17. Home Blocks (/homeBlocks/{blockId})
 */
export interface HomeBlock {
  id: string;
  type: string;
  title: string;
  sortOrder: number;
  visible: boolean;
  config?: Record<string, unknown>;
}

/**
 * 18. Ad Placements (/adPlacements/{placementId})
 */
export interface AdPlacement {
  id: string;
  slot: string;
  active: boolean;
  bannerUrl?: string;
  targetUrl?: string;
}

/**
 * 19. SEO Settings (/seoSettings/{seoId})
 */
export interface SeoSettings {
  id: string;
  routePath: string;
  title: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
}

/**
 * 20. Import Jobs (/importJobs/{jobId})
 */
export interface ImportJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  itemCount: number;
  errorLog?: string[];
  createdAt: string;
}

/**
 * 21. Analytics Rollups (/analyticsRollups/{rollupId})
 */
export interface AnalyticsRollup {
  id: string;
  date: string;
  activeUsers: number;
  totalOrders: number;
  revenueInr: number;
  aiDoubtsResolved: number;
}

/**
 * Pedagogical Study & Formula Helper Types (Preserved for backwards-compatibility)
 */
export type FormulaCategory =
  | 'Arithmetic'
  | 'Fractions'
  | 'Algebra'
  | 'Geometry'
  | 'Mensuration'
  | 'Coordinate Geometry'
  | 'Statistics'
  | 'Probability'
  | 'Trigonometry';

export type MathSubjectCategory =
  | 'Number System'
  | 'Algebra'
  | 'Geometry'
  | 'Coordinate Geometry'
  | 'Trigonometry'
  | 'Mensuration'
  | 'Statistics & Probability'
  | 'Commercial Math'
  | 'Arithmetic'
  | 'Fractions'
  | 'Statistics'
  | 'Probability';

export interface StudyChapter {
  id: string;
  slug: string;
  title: string;
  classLevel: StudentClass;
  category: MathSubjectCategory;
  orderIndex: number;
  description: string;
  formulaCount: number;
  solvedProblemsCount: number;
  isFreePreview: boolean;
  learningOutcomes: string[];
  keyTheorems: string[];
  downloadableNotesUrl?: string;
}

export interface FormulaItem {
  id: string;
  slug: string;
  title: string;
  category: FormulaCategory | MathSubjectCategory;
  applicableClasses: StudentClass[];
  latexFormula: string;
  plainTextFormula: string;
  variables: { symbol: string; meaning: string; unit?: string }[];
  explanation: string;
  diagramType?: string;
  diagramCaption?: string;
  example?: string;
  exampleProblem: {
    question: string;
    stepByStepSolution: string[];
    answer: string;
    alternativeMethod?: string;
  };
  relatedFormulaSlugs?: string[];
  tags?: string[];
  mnemonicHint?: string;
  isProOnly: boolean;
  watermarkGlyph: string;
  seo?: {
    title: string;
    description: string;
    keywords?: string[];
  };
}

export interface SolvedProblemStep {
  stepNumber: number;
  heading: string;
  mathExpression: string;
  explanation: string;
}

export interface SolvedProblem {
  id: string;
  chapterSlug: string;
  title: string;
  classLevel: StudentClass;
  difficulty: 'Foundation' | 'Standard' | 'Exemplar / Board';
  question: string;
  steps: SolvedProblemStep[];
  finalAnswer: string;
  keyFormulaUsed: string;
}

export interface PurchaseRecord {
  orderId: string;
  userId: string;
  planName: string;
  amountInr: number;
  currency: 'INR';
  purchaseDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'refunded';
  invoicePdfUrl?: string;
}
