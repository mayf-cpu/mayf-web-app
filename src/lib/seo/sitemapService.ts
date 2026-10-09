/**
 * Authoritative Server-Side XML Sitemap and Robots.txt Generator.
 * 
 * Technical SEO Invariants:
 * - Public pages only (study materials, formula pages, courses, categories, public hubs).
 * - Excludes private/sensitive paths: dashboard, checkout, account/login, admin, private APIs, payment callbacks, download URLs.
 * - Strict slug deduplication: never generates duplicate URLs for the same educational material.
 * - Meaningful canonical URL resolution.
 * - XML Schema 0.9 compliance with <loc>, <lastmod>, <changefreq>, <priority>.
 */

import { contentCmsManager } from '../cms/contentManager';
import { categoryManager } from '../categories/categoryManager';
import { FORMULA_DECK_ITEMS } from '../../data/formulaDeckData';
import { STUDENT_COURSES } from '../../data/coursesData';
import { INITIAL_CHAPTERS } from '../../data/curriculumData';

export interface SitemapUrlEntry {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

class SitemapService {
  /**
   * Generates full XML sitemap containing all published public URLs
   */
  public generateSitemapXml(baseUrl: string): string {
    const origin = baseUrl.replace(/\/+$/, '');
    const now = new Date().toISOString().split('T')[0];

    const entriesMap = new Map<string, SitemapUrlEntry>();

    const addEntry = (path: string, changefreq: SitemapUrlEntry['changefreq'], priority: number, lastmod?: string) => {
      // Normalize path
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      const url = `${origin}${cleanPath}`;
      if (!entriesMap.has(url)) {
        entriesMap.set(url, {
          loc: url,
          lastmod: lastmod || now,
          changefreq,
          priority: Math.round(priority * 10) / 10,
        });
      }
    };

    // 1. Core Public Hubs
    addEntry('/', 'daily', 1.0);
    addEntry('/study-material', 'daily', 0.9);
    addEntry('/formula-deck', 'daily', 0.9);
    addEntry('/courses', 'weekly', 0.8);
    addEntry('/ai-teacher', 'weekly', 0.8);
    addEntry('/annual-pass', 'weekly', 0.8);
    addEntry('/privacy', 'monthly', 0.3);
    addEntry('/terms', 'monthly', 0.3);
    addEntry('/refund-policy', 'monthly', 0.3);

    // 2. Public Study Material Chapters (Deduplicated by slug)
    const seenStudySlugs = new Set<string>();

    // From CMS Content Manager
    try {
      const cmsItems = contentCmsManager.getItems({ tab: 'active' }).items;
      cmsItems.forEach((item) => {
        if (
          item.status === 'published' &&
          item.visible &&
          !item.isDeleted &&
          item.slug &&
          !seenStudySlugs.has(item.slug)
        ) {
          seenStudySlugs.add(item.slug);
          const lastmod = item.updatedAt ? item.updatedAt.split('T')[0] : now;
          addEntry(`/study/${encodeURIComponent(item.slug)}`, 'weekly', 0.8, lastmod);
        }
      });
    } catch (e) {
      console.warn('[SitemapService] CMS content lookup note:', e);
    }

    // From Initial Chapters Data (fallback / seed catalog)
    INITIAL_CHAPTERS.forEach((chapter) => {
      if (chapter.slug && !seenStudySlugs.has(chapter.slug)) {
        seenStudySlugs.add(chapter.slug);
        addEntry(`/study/${encodeURIComponent(chapter.slug)}`, 'weekly', 0.8);
      }
    });

    // 3. Public Formula Pages (Deduplicated by slug)
    const seenFormulaSlugs = new Set<string>();
    FORMULA_DECK_ITEMS.forEach((formula) => {
      if (formula.slug && !seenFormulaSlugs.has(formula.slug)) {
        seenFormulaSlugs.add(formula.slug);
        addEntry(`/formula/${encodeURIComponent(formula.slug)}`, 'monthly', 0.7);
      }
    });

    // 4. Public Courses (Deduplicated by slug)
    const seenCourseSlugs = new Set<string>();
    STUDENT_COURSES.forEach((course) => {
      if (course.slug && !seenCourseSlugs.has(course.slug)) {
        seenCourseSlugs.add(course.slug);
        addEntry(`/course/${encodeURIComponent(course.slug)}`, 'weekly', 0.8);
      }
    });

    // 5. Public Category Landing URLs
    try {
      const categories = categoryManager.getAllFlat(false);
      categories.forEach((cat) => {
        if (!cat.disabled && cat.slug) {
          addEntry(`/study-material?category=${encodeURIComponent(cat.slug)}`, 'weekly', 0.6);
        }
      });
    } catch (e) {
      console.warn('[SitemapService] Category lookup note:', e);
    }

    // Build XML response
    const xmlLines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ];

    entriesMap.forEach((entry) => {
      xmlLines.push('  <url>');
      xmlLines.push(`    <loc>${this.escapeXml(entry.loc)}</loc>`);
      if (entry.lastmod) {
        xmlLines.push(`    <lastmod>${entry.lastmod}</lastmod>`);
      }
      if (entry.changefreq) {
        xmlLines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
      }
      if (entry.priority !== undefined) {
        xmlLines.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
      }
      xmlLines.push('  </url>');
    });

    xmlLines.push('</urlset>');
    return xmlLines.join('\n');
  }

  /**
   * Generates strict robots.txt directives
   * Excludes dashboard, checkout, account/login, admin, private APIs, payment callbacks, download URLs
   */
  public generateRobotsTxt(baseUrl: string, adminEntryPath: string = '/admin-portal'): string {
    const origin = baseUrl.replace(/\/+$/, '');
    const cleanAdmin = adminEntryPath.startsWith('/') ? adminEntryPath : `/${adminEntryPath}`;

    return [
      '# Robots.txt for Maths at Your Fingertips (mayf.co.in)',
      '# Disallow private user states, authentication, checkout flows, and administration portals',
      'User-agent: *',
      '',
      '# Excluded: Dashboard & User Profiles',
      'Disallow: /dashboard',
      'Disallow: /dashboard/',
      '',
      '# Excluded: Checkout & Payment Gateways',
      'Disallow: /checkout',
      'Disallow: /checkout/',
      'Disallow: /payment/callback/',
      '',
      '# Excluded: Account Credentials & Sign-In',
      'Disallow: /login',
      'Disallow: /login/',
      'Disallow: /account/',
      'Disallow: /profile/',
      '',
      '# Excluded: Administration & CMS Entrypoints',
      'Disallow: /admin',
      'Disallow: /admin/',
      'Disallow: /admin-portal',
      'Disallow: /admin-portal/',
      'Disallow: /mgmt-sec/',
      '',
      '# Excluded: Private API & Webhook Endpoints',
      'Disallow: /api/',
      'Disallow: /api/admin/',
      'Disallow: /api/ai/',
      'Disallow: /api/payments/',
      'Disallow: /api/razorpay/',
      'Disallow: /api/stripe/',
      'Disallow: /api/webhooks/',
      '',
      '# Excluded: Temporary & Signed Download Links',
      'Disallow: /api/download/',
      'Disallow: /download/',
      'Disallow: /api/storage/',
      '',
      '# Excluded: Ephemeral Query Parameters & Session Tokens',
      'Disallow: /*?*preview_iab=',
      'Disallow: /*?*session_id=',
      'Disallow: /*?*token=',
      'Disallow: /*?*auth=',
      '',
      '# Allowed: Canonical Public Resources',
      'Allow: /',
      'Allow: /study-material',
      'Allow: /study/',
      'Allow: /formula-deck',
      'Allow: /formula/',
      'Allow: /courses',
      'Allow: /course/',
      'Allow: /ai-teacher',
      'Allow: /annual-pass',
      'Allow: /privacy',
      'Allow: /terms',
      'Allow: /refund-policy',
      '',
      `# Authoritative XML Sitemap`,
      `Sitemap: ${origin}/sitemap.xml`,
      '',
    ].join('\n');
  }

  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }
}

export const sitemapService = new SitemapService();
