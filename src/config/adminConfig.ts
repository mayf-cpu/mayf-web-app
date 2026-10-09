/**
 * Administration System Configuration & Constants
 *
 * DEFENCE IN DEPTH ARCHITECTURAL PRINCIPLE:
 * - The administrator URL is an additional barrier (obscurity as one layer),
 *   but NEVER the sole security mechanism.
 * - Authorization strictly enforces:
 *   1. Cloudflare Access edge verification headers (when protected at edge).
 *   2. Firebase Google Authentication.
 *   3. Firebase custom claims: admin=true / superAdmin=true.
 *   4. Independent server-side verification on EVERY admin API call.
 *   5. Response header: X-Robots-Tag: noindex, nofollow.
 *   6. robots.txt exclusion for crawlers.
 *   7. Unauthorized users receive 404 Not Found without leaking admin existence.
 *   8. Path is omitted from all public navigation, footer, sitemap, APIs, and metadata.
 */

export const DEFAULT_ADMIN_ENTRY_PATH = '/mgmt-sec-k92a';

/**
 * Authoritative default administrator emails (case-insensitive)
 * Includes system owner and configured administrators
 */
export const DEFAULT_AUTHORIZED_ADMIN_EMAILS: string[] = [
  'sachin.itig@gmail.com',
  '2026vivekkushwah@gmail.com',
  'admin@mayf.co.in',
];

/**
 * Returns all authorized admin emails from environment variables and built-in defaults
 */
export function getAuthorizedAdminEmails(): string[] {
  let envList = '';
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    envList = (import.meta.env.VITE_ADMIN_AUTHORIZED_EMAILS as string) || '';
  }
  if (!envList && typeof process !== 'undefined' && process.env) {
    envList = process.env.ADMIN_AUTHORIZED_EMAILS || process.env.VITE_ADMIN_AUTHORIZED_EMAILS || '';
  }

  const parsed = envList
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const merged = new Set([
    ...DEFAULT_AUTHORIZED_ADMIN_EMAILS.map((e) => e.toLowerCase()),
    ...parsed,
  ]);

  return Array.from(merged);
}

/**
 * Checks if a given email is in the authorized admin list
 */
export function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  const authorized = getAuthorizedAdminEmails();
  return authorized.includes(clean);
}

export type AdminSection =
  | 'dashboard'
  | 'content'
  | 'categories'
  | 'students'
  | 'admins'
  | 'ai-activity'
  | 'orders'
  | 'annual-pass'
  | 'coupons'
  | 'notifications'
  | 'social'
  | 'ads'
  | 'layout'
  | 'branding'
  | 'seo'
  | 'payments'
  | 'import'
  | 'analytics'
  | 'settings';

export interface AdminSectionMeta {
  id: AdminSection;
  title: string;
  category: 'Overview' | 'Academics' | 'Commercial' | 'Engagement' | 'Platform';
  description: string;
  iconName: string;
}

export const ADMIN_SECTIONS: AdminSectionMeta[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    category: 'Overview',
    description: 'System health, key performance metrics, and activity highlights',
    iconName: 'LayoutDashboard',
  },
  {
    id: 'content',
    title: 'Content',
    category: 'Academics',
    description: 'Manage study materials, formula sheets, mock papers, and class levels',
    iconName: 'BookOpen',
  },
  {
    id: 'categories',
    title: 'Categories',
    category: 'Academics',
    description: 'Mathematics curriculum categories, subtopics, and class mappings',
    iconName: 'Layers',
  },
  {
    id: 'students',
    title: 'Students',
    category: 'Academics',
    description: 'Directory of registered students, streaks, grade levels, and activity',
    iconName: 'GraduationCap',
  },
  {
    id: 'admins',
    title: 'Admins',
    category: 'Platform',
    description: 'Administrator directory, superAdmin roles, custom claims, and audit logs',
    iconName: 'ShieldAlert',
  },
  {
    id: 'ai-activity',
    title: 'AI Activity',
    category: 'Academics',
    description: 'AI Teacher doubts answered, token metrics, latency, and question review',
    iconName: 'Sparkles',
  },
  {
    id: 'orders',
    title: 'Orders',
    category: 'Commercial',
    description: 'Razorpay & Stripe transactions, order IDs, refunds, and revenue ledger',
    iconName: 'Receipt',
  },
  {
    id: 'annual-pass',
    title: 'Annual Pass',
    category: 'Commercial',
    description: 'Pass subscriptions, pricing tiers, renewal tracking, and entitlements',
    iconName: 'CreditCard',
  },
  {
    id: 'coupons',
    title: 'Coupons',
    category: 'Commercial',
    description: 'Server-side validated promotional discount codes, limits, and schedules',
    iconName: 'Tag',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    category: 'Engagement',
    description: 'In-app announcements, exam alerts, and student notification broadcaster',
    iconName: 'Bell',
  },
  {
    id: 'social',
    title: 'Social',
    category: 'Engagement',
    description: 'Share metrics, in-app browser detection analytics, and referral traffic',
    iconName: 'Share2',
  },
  {
    id: 'ads',
    title: 'Ads',
    category: 'Engagement',
    description: 'Promotional banners, seasonal campaigns, and homepage marketing blocks',
    iconName: 'Megaphone',
  },
  {
    id: 'layout',
    title: 'Layout',
    category: 'Platform',
    description: 'Header navigation items, footer structure, and homepage section order',
    iconName: 'Sliders',
  },
  {
    id: 'branding',
    title: 'Branding',
    category: 'Platform',
    description: 'Logo wordmark (Σ Maths at Your Fingertips), color palette, and styling',
    iconName: 'Palette',
  },
  {
    id: 'seo',
    title: 'SEO',
    category: 'Platform',
    description: 'OpenGraph tags, JSON-LD structured data, robots directives, and canonical URLs',
    iconName: 'Globe',
  },
  {
    id: 'payments',
    title: 'Payments',
    category: 'Commercial',
    description: 'Payment gateway credentials, webhook secrets, and signature auditing',
    iconName: 'Wallet',
  },
  {
    id: 'import',
    title: 'Import',
    category: 'Academics',
    description: 'Google Drive & Google Sheets automated curriculum ingestion sync',
    iconName: 'FileSpreadsheet',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    category: 'Overview',
    description: 'Traffic trends, popular formulas, chapter retention, and conversion funnel',
    iconName: 'BarChart3',
  },
  {
    id: 'settings',
    title: 'Settings',
    category: 'Platform',
    description: 'Environment variables, Cloudflare Access status, security, and maintenance mode',
    iconName: 'Settings',
  },
];

/**
 * Resolves the secret admin entry path from environment or default configuration
 */
export function getAdminEntryPath(): string {
  // Check client-side Vite env
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ADMIN_ENTRY_PATH) {
    return import.meta.env.VITE_ADMIN_ENTRY_PATH as string;
  }
  // Check Node environment
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.ADMIN_ENTRY_PATH) return process.env.ADMIN_ENTRY_PATH;
    if (process.env.VITE_ADMIN_ENTRY_PATH) return process.env.VITE_ADMIN_ENTRY_PATH;
  }
  return DEFAULT_ADMIN_ENTRY_PATH;
}

/**
 * Validates if the given pathname begins with the configured secret admin entry path
 */
export function isAdminPath(pathname: string): boolean {
  const adminBase = getAdminEntryPath();
  const clean = pathname.replace(/\/+$/, '') || '/';
  return clean === adminBase || clean.startsWith(`${adminBase}/`);
}

/**
 * Extracts the requested section from the admin path
 */
export function getAdminSectionFromPath(pathname: string): AdminSection {
  const adminBase = getAdminEntryPath();
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === adminBase) {
    return 'dashboard';
  }
  const sub = clean.slice(adminBase.length).replace(/^\/+/, '');
  const sectionId = sub.split('/')[0] as AdminSection;
  const match = ADMIN_SECTIONS.find((s) => s.id === sectionId);
  return match ? match.id : 'dashboard';
}

/**
 * Constructs an internal admin URL for a section
 */
export function getAdminUrl(section?: AdminSection): string {
  const base = getAdminEntryPath();
  if (!section || section === 'dashboard') {
    return base;
  }
  return `${base}/${section}`;
}
