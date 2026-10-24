import crypto from 'node:crypto';
import { getAdminFirestore } from '../firebase/admin';
import type { FirestoreDocumentStore } from '../firebase/documentStore';
import type { AnalyticsEventType, DashboardAnalyticsData } from './analyticsTypes';

const publicEvents = new Set(['page_view', 'content_view', 'formula_view', 'checkout_started', 'share']);
const dayKey = (time: number) => new Date(time + 330 * 60000).toISOString().slice(0, 10);
type Bucket = { day: string; views: number; contentViews: number; checkoutStarts: number; downloads: number; shares: number; channels?: Record<string, number>; content: Record<string, { id: string; title: string; classLevel: string; category: string; views: number; downloads: number; shares: number }>; updatedAt: string };
const empty = (day: string): Bucket => ({ day, views: 0, contentViews: 0, checkoutStarts: 0, downloads: 0, shares: 0, content: {}, updatedAt: '' });
const text = (value: unknown, fallback: string) => typeof value === 'string' ? value.replace(/[\u0000-\u001f]/g, '').slice(0, 120) : fallback;

/** Daily counters contain no identity or freeform search/homework text. Client events never control revenue. */
export class AggregateMetricsService {
  constructor(private getStore: () => FirestoreDocumentStore | null = getAdminFirestore, private clock = Date.now) {}
  async recordEvent(eventType: AnalyticsEventType, params: Record<string, unknown> = {}, trusted = false): Promise<boolean> {
    if (!publicEvents.has(eventType) && !(trusted && eventType === 'content_download')) return false;
    const db = this.getStore();
    if (!db) throw new Error('Analytics storage is not configured.');
    const now = this.clock(); const day = dayKey(now);
    const doc = db.collection('analyticsDaily').doc(day);
    for (let attempt = 0; attempt < 5; attempt++) {
      const snapshot = await doc.get();
      const bucket = (snapshot.data() || empty(day)) as Bucket;
      if (eventType === 'page_view' || eventType === 'formula_view') bucket.views++;
      if (eventType === 'content_view') bucket.contentViews++;
      if (eventType === 'checkout_started') bucket.checkoutStarts++;
      if (eventType === 'content_download') bucket.downloads++;
      if (eventType === 'share') {
        bucket.shares++;
        const method = ['whatsapp', 'telegram', 'clipboard', 'web_share', 'twitter'].includes(String(params.method)) ? String(params.method) : 'other';
        bucket.channels ||= {}; bucket.channels[method] = (bucket.channels[method] || 0) + 1;
      }
      const id = text(params.content_id || params.item_id, '');
      if (id && ['content_view', 'content_download', 'share'].includes(eventType)) {
        const key = crypto.createHash('sha256').update(id).digest('hex');
        // Keep each daily document bounded below Firestore's size limit.
        if (bucket.content[key] || Object.keys(bucket.content).length < 200) {
          const item = bucket.content[key] ||= { id, title: text(params.title || params.item_title, id), classLevel: text(params.class_level, 'Unspecified'), category: text(params.category, 'Unspecified'), views: 0, downloads: 0, shares: 0 };
          if (eventType === 'content_view') item.views++;
          if (eventType === 'content_download') item.downloads++;
          if (eventType === 'share') item.shares++;
        }
      }
      bucket.updatedAt = new Date(now).toISOString();
      try {
        await doc.set(bucket, snapshot.exists ? { updateTime: snapshot.updateTime } : { exists: false });
        return true;
      } catch (error: any) {
        if (!/409|412|concurrent|conflict/i.test(error.message)) throw error;
      }
    }
    throw new Error('Analytics changed concurrently. Retry shortly.');
  }

  async getDashboardMetrics(timeframe: 'today' | '7d' | '30d' | 'all' = '30d'): Promise<DashboardAnalyticsData> {
    if (!['today', '7d', '30d', 'all'].includes(timeframe)) throw new Error('Invalid analytics timeframe.');
    const start = performance.now(); const db = this.getStore();
    if (!db) throw new Error('Analytics storage is not configured.');
    const now = this.clock(); const today = dayKey(now); const month = today.slice(0, 7);
    const since = timeframe === 'all' ? '' : dayKey(now - (timeframe === 'today' ? 0 : timeframe === '7d' ? 6 : 29) * 86400000);
    const inRange = (day: string) => /^\d{4}-\d{2}-\d{2}$/.test(day) && day >= since && day <= today;
    const [dailyDocs, orderDocs, passDocs, aiDocs] = await Promise.all(['analyticsDaily', 'paymentOrders', 'paymentEntitlements', 'aiTeacherSessions'].map(collection => db.list(collection)));
    const daily = dailyDocs.map(doc => doc.data as Bucket).filter(bucket => inRange(bucket.day));
    const sum = (key: 'views' | 'contentViews' | 'checkoutStarts' | 'downloads') => daily.reduce((n, row) => n + row[key], 0);
    const current = daily.find(row => row.day === today) || empty(today);
    const orders = orderDocs.map(doc => doc.data);
    const date = (value: any) => Number.isFinite(Date.parse(value)) ? dayKey(Date.parse(value)) : '';
    const selectedOrders = orders.filter(order => inRange(date(order.createdAt)));
    const paid = orders.filter(order => order.status === 'paid' && inRange(date(order.paidAt || order.createdAt)));
    const inr = paid.filter(order => order.currency === 'INR');
    const amount = (order: any) => Math.max(0, Number(order.grossAmount) - Number(order.discount || 0) + Number(order.tax || 0));
    const revenue = inr.reduce((n, order) => n + amount(order), 0);
    const ai = aiDocs.map(doc => doc.data).filter(row => row.responseStatus === 'success' && inRange(date(row.timestamp)));
    const content = new Map<string, any>();
    for (const bucket of daily) for (const item of Object.values(bucket.content)) {
      const old = content.get(item.id);
      content.set(item.id, old ? { ...item, views: old.views + item.views, downloads: old.downloads + item.downloads, shares: old.shares + item.shares } : { ...item });
    }
    const byClass: Record<string, number> = Object.create(null); const byCategory: Record<string, number> = Object.create(null);
    for (const row of ai) {
      const grade = text(row.studentClass, 'Unspecified'); const category = text(row.chapterTopic, 'Unspecified');
      byClass[grade] = (byClass[grade] || 0) + 1; byCategory[category] = (byCategory[category] || 0) + 1;
    }
    const views = sum('views'); const checkouts = sum('checkoutStarts');
    const rate = (n: number, d: number) => d ? Math.round(n / d * 1000) / 10 : 0;
    const latency = ai.filter(row => typeof row.latencyMs === 'number');
    return {
      timeframe, lastUpdated: new Date(now).toISOString(),
      social: { totalShares: daily.reduce((n, row) => n + row.shares, 0), byChannel: daily.reduce((totals, row) => { for (const [channel, count] of Object.entries(row.channels || {})) totals[channel] = (totals[channel] || 0) + count; return totals; }, {} as Record<string, number>) },
      architecture: { engine: 'pre_aggregated_rollups', queryTimeMs: Math.round((performance.now() - start) * 100) / 100, scannedRecords: dailyDocs.length + orderDocs.length + passDocs.length + aiDocs.length, privacyEnforced: true },
      summary: {
        totalUsers: null, newUsersToday: null, userGrowthPct: null, activeUsers: { dau: null, wau: null, mau: null, currentActiveSessions: null },
        traffic: { totalPageViews: views, pageViewsToday: current.views, uniqueVisitors: null, dailyTrend: daily.map(row => ({ date: row.day, views: row.views, downloads: row.downloads, aiQuestions: ai.filter(item => date(item.timestamp) === row.day).length, revenue: inr.filter(order => date(order.paidAt || order.createdAt) === row.day).reduce((n, order) => n + amount(order), 0) })).sort((a, b) => a.date.localeCompare(b.date)) },
        downloads: { total: sum('downloads'), today: current.downloads, byFormat: [] },
        aiUsage: { totalQuestions: ai.length, questionsToday: ai.filter(row => date(row.timestamp) === today).length, avgResponseTimeMs: latency.length ? Math.round(latency.reduce((n, row) => n + row.latencyMs, 0) / latency.length) : 0, byClass, byCategory },
        orders: { totalOrders: selectedOrders.length, completedOrders: paid.length, pendingOrders: selectedOrders.filter(order => ['created', 'pending'].includes(order.status)).length, averageOrderValue: inr.length ? Math.round(revenue / inr.length) : 0 },
        revenue: { totalRevenue: revenue, revenueToday: inr.filter(order => date(order.paidAt || order.createdAt) === today).reduce((n, order) => n + amount(order), 0), revenueThisMonth: orders.filter(order => order.status === 'paid' && order.currency === 'INR' && date(order.paidAt || order.createdAt).startsWith(month)).reduce((n, order) => n + amount(order), 0), currency: 'INR', byCurrency: paid.reduce((totals, order) => { totals[order.currency] = (totals[order.currency] || 0) + amount(order); return totals; }, {} as Record<string, number>) },
        annualPassSubscriptions: { activePasses: passDocs.filter(doc => doc.data.status === 'active' && Date.parse(doc.data.startsAt) <= now && Date.parse(doc.data.expiresAt) > now).length, newPassesThisMonth: passDocs.filter(doc => date(doc.data.createdAt).startsWith(month)).length, renewalRate: null },
        conversion: { visitors: views, contentViews: sum('contentViews'), checkoutStarts: checkouts, purchases: paid.length, overallConversionRate: rate(paid.length, views), checkoutCompletionRate: rate(paid.length, checkouts) },
      },
      popularContent: [...content.values()].sort((a, b) => b.views - a.views).slice(0, 20), topCategories: [], topClasses: [], searchTrends: [],
    };
  }
}
export const aggregateMetricsService = new AggregateMetricsService();
