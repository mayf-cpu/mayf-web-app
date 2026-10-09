/**
 * Analytics Domain Types
 * Maths at Your Fingertips (mayf.co.in)
 * 
 * Strict Privacy Guidelines:
 * - Never track student Personally Identifiable Information (PII) such as full names, email addresses, phone numbers, or passwords.
 * - Math questions asked to AI are categorized by topic/class without storing student freeform private query text in analytics events.
 * - Aggregate internal metrics are pre-computed in O(1) rollups rather than table-scanning millions of individual rows.
 */

export type AnalyticsEventType =
  | 'page_view'
  | 'content_view'
  | 'content_download'
  | 'search'
  | 'formula_view'
  | 'ai_question'
  | 'login'
  | 'checkout_started'
  | 'purchase'
  | 'annual_pass_purchase'
  | 'coupon_applied'
  | 'share';

export interface PageViewEventData {
  page_title: string;
  page_location: string;
  page_path: string;
}

export interface ContentViewEventData {
  content_id: string;
  title: string;
  category: string;
  class_level: string;
  content_type: string;
  access_type?: 'free' | 'premium';
}

export interface ContentDownloadEventData {
  content_id: string;
  title: string;
  category: string;
  class_level: string;
  file_format: string;
}

export interface SearchEventData {
  search_term: string;
  results_count: number;
  category_filter?: string;
  class_filter?: string;
}

export interface FormulaViewEventData {
  formula_id: string;
  formula_slug: string;
  formula_title: string;
  category: string;
  class_level: string;
}

export interface AiQuestionEventData {
  math_category: string;
  class_level: string;
  has_image: boolean;
  question_length_bracket: 'short' | 'medium' | 'long';
  complexity_level?: 'foundational' | 'intermediate' | 'advanced';
}

export interface LoginEventData {
  method: 'google' | 'email' | 'phone' | 'guest';
}

export interface CheckoutStartedEventData {
  item_id: string;
  item_name: string;
  plan_type: 'single_module' | 'annual_pass' | 'course';
  price: number;
  currency: string;
}

export interface PurchaseEventData {
  transaction_id: string;
  item_id: string;
  item_name: string;
  value: number;
  currency: string;
  payment_gateway: 'razorpay' | 'stripe' | 'test';
}

export interface AnnualPassPurchaseEventData {
  pass_id: string;
  plan_duration: 'annual' | 'half_yearly' | 'lifetime';
  value: number;
  currency: string;
  promo_code?: string;
}

export interface CouponAppliedEventData {
  coupon_code: string;
  discount_amount: number;
  is_valid: boolean;
}

export interface ShareEventData {
  method: 'whatsapp' | 'telegram' | 'clipboard' | 'web_share' | 'twitter';
  content_type: 'chapter' | 'formula' | 'course' | 'general';
  item_id?: string;
  item_title?: string;
}

// -------------------------------------------------------------
// Pre-Aggregated Dashboard Metrics Data Structures
// -------------------------------------------------------------

export interface DailyDataPoint {
  date: string;
  views: number;
  downloads: number;
  aiQuestions: number;
  revenue: number;
}

export interface ContentPerformanceItem {
  id: string;
  title: string;
  classLevel: string;
  category: string;
  views: number;
  downloads: number;
  shares: number;
}

export interface CategoryMetric {
  name: string;
  count: number;
  percentage: number;
}

export interface ClassMetric {
  classLevel: string;
  studentCount: number;
  percentage: number;
}

export interface SearchTrendItem {
  query: string;
  count: number;
  resultsFound: boolean;
  trend: 'up' | 'stable' | 'down';
}

export interface ConversionFunnelMetrics {
  visitors: number;
  contentViews: number;
  checkoutStarts: number;
  purchases: number;
  overallConversionRate: number;      // (purchases / visitors) * 100
  checkoutCompletionRate: number;     // (purchases / checkoutStarts) * 100
}

export interface DashboardAnalyticsData {
  timeframe: 'today' | '7d' | '30d' | 'all';
  lastUpdated: string;
  architecture: {
    engine: 'pre_aggregated_rollups';
    queryTimeMs: number;
    scannedRecords: 0; // Demonstrates O(1) index-free retrieval
    privacyEnforced: true;
  };
  summary: {
    totalUsers: number;
    newUsersToday: number;
    userGrowthPct: number;
    activeUsers: {
      dau: number;
      wau: number;
      mau: number;
      currentActiveSessions: number;
    };
    traffic: {
      totalPageViews: number;
      pageViewsToday: number;
      uniqueVisitors: number;
      dailyTrend: DailyDataPoint[];
    };
    downloads: {
      total: number;
      today: number;
      byFormat: { format: string; count: number }[];
    };
    aiUsage: {
      totalQuestions: number;
      questionsToday: number;
      avgResponseTimeMs: number;
      byClass: Record<string, number>;
      byCategory: Record<string, number>;
    };
    orders: {
      totalOrders: number;
      completedOrders: number;
      pendingOrders: number;
      averageOrderValue: number;
    };
    revenue: {
      totalRevenue: number;
      revenueToday: number;
      revenueThisMonth: number;
      currency: string;
    };
    annualPassSubscriptions: {
      activePasses: number;
      newPassesThisMonth: number;
      renewalRate: number;
    };
    conversion: ConversionFunnelMetrics;
  };
  popularContent: ContentPerformanceItem[];
  topCategories: CategoryMetric[];
  topClasses: ClassMetric[];
  searchTrends: SearchTrendItem[];
}
