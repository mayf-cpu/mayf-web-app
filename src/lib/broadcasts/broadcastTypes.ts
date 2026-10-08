/**
 * Canonical Types and Constants for Notification & Broadcast Management.
 * 
 * Supports:
 * - Categories: site announcement, dashboard notification, promotional notification, maintenance message
 * - Fields: title, message, link, image (optional), audience, start time, end time, active/inactive
 * - Audiences: all, free users, Pro users, Annual Pass, selected users
 * - Zero external push notification dependency (internal website notifications first)
 */

export type BroadcastCategory =
  | 'site_announcement'
  | 'dashboard_notification'
  | 'promotional_notification'
  | 'maintenance_message';

export type BroadcastAudience =
  | 'all'
  | 'free_users'
  | 'pro_users'
  | 'annual_pass'
  | 'selected_users';

export interface BroadcastItem {
  id: string;
  category: BroadcastCategory;
  title: string;
  message: string;
  link?: string;
  linkText?: string;
  imageUrl?: string;
  audience: BroadcastAudience;
  selectedUserEmails?: string[]; // When audience is 'selected_users'
  startTime: string; // ISO 8601 string
  endTime?: string;  // ISO 8601 string or undefined if permanent
  isActive: boolean;
  priority?: 'normal' | 'high' | 'urgent';
  dismissible: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  metrics?: {
    impressions: number;
    clicks: number;
    dismissals: number;
  };
}

export const BROADCAST_CATEGORY_CONFIG: Record<
  BroadcastCategory,
  { label: string; description: string; badgeColor: string }
> = {
  site_announcement: {
    label: 'Site Announcement',
    description: 'Prominent sticky banner displayed at the top of public website pages.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  dashboard_notification: {
    label: 'Dashboard Notification',
    description: 'Internal inbox alert shown inside the student dashboard and header bell.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  promotional_notification: {
    label: 'Promotional Notification',
    description: 'Special offer, discount coupon, or seasonal pass campaign highlight.',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  maintenance_message: {
    label: 'Maintenance Message',
    description: 'High-priority alert for scheduled maintenance or infrastructure notices.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
};

export const BROADCAST_AUDIENCE_CONFIG: Record<
  BroadcastAudience,
  { label: string; description: string }
> = {
  all: {
    label: 'All Users',
    description: 'Visible to every visitor, anonymous learners, and registered students.',
  },
  free_users: {
    label: 'Free Users Only',
    description: 'Visible only to learners without an active Annual Pass or Pro entitlement.',
  },
  pro_users: {
    label: 'Pro Users',
    description: 'Visible to all Pro tier verified accounts.',
  },
  annual_pass: {
    label: 'Annual Pass Holders',
    description: 'Visible exclusively to students with active Annual Pass entitlements.',
  },
  selected_users: {
    label: 'Selected Users (By Email)',
    description: 'Targeted directly to specific student email addresses.',
  },
};

export const SEED_BROADCASTS: BroadcastItem[] = [
  {
    id: 'bc-exam-2026',
    category: 'site_announcement',
    title: 'CBSE & ICSE 2026 Examination Revision Cycle Active',
    message: 'Class 10 NCERT exemplar proofs and rationalized formula deck cheat-sheets are updated.',
    link: '/study-material',
    linkText: 'Explore Syllabus',
    audience: 'all',
    startTime: '2026-01-01T00:00:00Z',
    endTime: '2026-12-31T23:59:59Z',
    isActive: true,
    priority: 'normal',
    dismissible: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'system_default',
    metrics: { impressions: 14200, clicks: 3120, dismissals: 840 },
  },
  {
    id: 'bc-pass-promo',
    category: 'promotional_notification',
    title: 'Board Exam Special: Complete Annual Pass at ₹999',
    message: 'Unlock full Class 5–10 printable formulas, mock tests, and 24/7 AI Teacher doubt sessions.',
    link: '/annual-pass',
    linkText: 'Unlock Pass',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    audience: 'free_users',
    startTime: '2026-01-01T00:00:00Z',
    endTime: '2026-12-31T23:59:59Z',
    isActive: true,
    priority: 'normal',
    dismissible: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'system_default',
    metrics: { impressions: 8400, clicks: 1980, dismissals: 420 },
  },
  {
    id: 'bc-ai-session',
    category: 'dashboard_notification',
    title: 'Professor Sigma Ready for Midnight Doubts',
    message: 'Upload photos of trigonometry or polynomial proofs for step-by-step guidance.',
    link: '/ai-teacher',
    linkText: 'Ask Doubt',
    audience: 'all',
    startTime: '2026-01-01T00:00:00Z',
    endTime: '2026-12-31T23:59:59Z',
    isActive: true,
    priority: 'normal',
    dismissible: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'system_default',
    metrics: { impressions: 6500, clicks: 1430, dismissals: 110 },
  },
  {
    id: 'bc-maintenance-note',
    category: 'maintenance_message',
    title: 'Scheduled System Upgrade (Completed)',
    message: 'Our Cloud Firestore indexes and AI Teacher response pipelines have been upgraded for faster performance.',
    audience: 'all',
    startTime: '2026-01-01T00:00:00Z',
    endTime: '2026-12-31T23:59:59Z',
    isActive: false, // Inactive by default, admin can enable when scheduling maintenance
    priority: 'high',
    dismissible: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'system_default',
    metrics: { impressions: 2100, clicks: 120, dismissals: 650 },
  },
];
