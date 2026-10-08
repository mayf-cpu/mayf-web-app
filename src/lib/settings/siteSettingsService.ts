/**
 * Authoritative Server-Side Site Settings Service.
 * 
 * Persists to Firestore `/siteSettings/general` with in-memory caching.
 * Performs strict input validation and sanitization using `sanitizer.ts`:
 * - All text copy is stripped of any HTML tags or JavaScript expressions.
 * - All logo, favicon, and social URLs are validated against allowed schemes.
 * - Hex colors are strictly validated to prevent CSS/style injection.
 */

import {
  SiteSettings,
  DEFAULT_SITE_SETTINGS,
  BrandIdentitySettings,
  ThemeColorsSettings,
  SocialLinksSettings,
  ContactSupportSettings,
  ControlledHomepageCopySettings,
} from './siteSettingsTypes';
import {
  sanitizePlainText,
  sanitizeUrl,
  sanitizeColorHex,
  inspectSecuritySafety,
} from '../security/sanitizer';
import { getAdminFirestore } from '../firebase/admin';
import { auditLogService } from '../audit/auditLogger';
import { homepageLayoutService } from '../layout/homepageLayoutService';

class SiteSettingsService {
  private currentSettings: SiteSettings;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes cache

  constructor() {
    this.currentSettings = JSON.parse(JSON.stringify(DEFAULT_SITE_SETTINGS));
    this.initFromFirestore();
  }

  /**
   * Initializes or hydrates settings from Firestore /siteSettings/general
   */
  private async initFromFirestore(): Promise<void> {
    try {
      const db = getAdminFirestore();
      if (!db) return;

      const docRef = db.collection('siteSettings').doc('general');
      const snap = await docRef.get();

      if (snap.exists) {
        const data = snap.data() as Partial<SiteSettings>;
        if (data) {
          this.currentSettings = this.mergeWithDefaults(data);
          this.cacheTimestamp = Date.now();
        }
      } else {
        // Bootstrap canonical settings document
        await docRef.set({
          ...this.currentSettings,
          updatedAt: new Date().toISOString(),
        });
        this.cacheTimestamp = Date.now();
      }
    } catch (e: any) {
      console.warn('[SiteSettingsService] Firestore note, using authoritative memory cache:', e?.message || e);
    }
  }

  private mergeWithDefaults(saved: Partial<SiteSettings>): SiteSettings {
    return {
      brand: {
        ...DEFAULT_SITE_SETTINGS.brand,
        ...(saved.brand || {}),
      },
      colors: {
        ...DEFAULT_SITE_SETTINGS.colors,
        ...(saved.colors || {}),
      },
      social: {
        ...DEFAULT_SITE_SETTINGS.social,
        ...(saved.social || {}),
      },
      contact: {
        ...DEFAULT_SITE_SETTINGS.contact,
        ...(saved.contact || {}),
      },
      homepageCopy: {
        ...DEFAULT_SITE_SETTINGS.homepageCopy,
        ...(saved.homepageCopy || {}),
      },
      version: saved.version || 1,
      updatedAt: saved.updatedAt || new Date().toISOString(),
      updatedBy: saved.updatedBy || 'admin',
    };
  }

  /**
   * Public retrieval of site settings (cached)
   */
  public getPublicSettings(): SiteSettings {
    return {
      ...this.currentSettings,
    };
  }

  /**
   * Admin retrieval of site settings
   */
  public getAdminSettings(): SiteSettings {
    return {
      ...this.currentSettings,
    };
  }

  /**
   * Sanitizes all incoming fields and saves the updated settings.
   * Throws an error if malicious executable code is detected.
   */
  public async updateSettings(
    input: Partial<SiteSettings>,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): Promise<SiteSettings> {
    // 1. Inspect for explicit malicious script injection attempts
    const safetyCheck = inspectSecuritySafety(input);
    if (!safetyCheck.safe) {
      console.warn('[SiteSettingsService] Malicious payload rejected:', safetyCheck.violations);
      throw new Error(`Security Violation: Arbitrary executable HTML/JavaScript is prohibited. ${safetyCheck.violations.join(' ')}`);
    }

    const timestamp = new Date().toISOString();

    // 2. Deep sanitize each section
    const rawBrand: Partial<BrandIdentitySettings> = input.brand || {};
    const sanitizedBrand: BrandIdentitySettings = {
      logoUrl: sanitizeUrl(rawBrand.logoUrl),
      altLogoUrl: sanitizeUrl(rawBrand.altLogoUrl),
      faviconUrl: sanitizeUrl(rawBrand.faviconUrl) || '/favicon.ico',
      siteName: sanitizePlainText(rawBrand.siteName || DEFAULT_SITE_SETTINGS.brand.siteName, 100),
      shortName: sanitizePlainText(rawBrand.shortName || DEFAULT_SITE_SETTINGS.brand.shortName, 20),
      tagline: sanitizePlainText(rawBrand.tagline || DEFAULT_SITE_SETTINGS.brand.tagline, 300),
      footerText: sanitizePlainText(rawBrand.footerText || DEFAULT_SITE_SETTINGS.brand.footerText, 600),
      copyrightText: sanitizePlainText(rawBrand.copyrightText || DEFAULT_SITE_SETTINGS.brand.copyrightText, 200),
      wordmarkGlyph: sanitizePlainText(rawBrand.wordmarkGlyph || 'Σ', 4),
    };

    const rawColors: Partial<ThemeColorsSettings> = input.colors || {};
    const sanitizedColors: ThemeColorsSettings = {
      primaryColor: sanitizeColorHex(rawColors.primaryColor, DEFAULT_SITE_SETTINGS.colors.primaryColor),
      secondaryColor: sanitizeColorHex(rawColors.secondaryColor, DEFAULT_SITE_SETTINGS.colors.secondaryColor),
      accentColor: sanitizeColorHex(rawColors.accentColor, DEFAULT_SITE_SETTINGS.colors.accentColor),
    };

    const rawSocial: Partial<SocialLinksSettings> = input.social || {};
    const sanitizedSocial: SocialLinksSettings = {
      youtube: sanitizeUrl(rawSocial.youtube),
      telegram: sanitizeUrl(rawSocial.telegram),
      whatsapp: sanitizeUrl(rawSocial.whatsapp),
      instagram: sanitizeUrl(rawSocial.instagram),
      facebook: sanitizeUrl(rawSocial.facebook),
      twitter: sanitizeUrl(rawSocial.twitter),
      linkedin: sanitizeUrl(rawSocial.linkedin),
    };

    const rawContact: Partial<ContactSupportSettings> = input.contact || {};
    const sanitizedContact: ContactSupportSettings = {
      supportEmail: sanitizePlainText(rawContact.supportEmail || 'support@mayf.co.in', 100),
      supportPhone: sanitizePlainText(rawContact.supportPhone || '', 50),
      whatsappSupport: sanitizeUrl(rawContact.whatsappSupport),
      helpDeskUrl: sanitizeUrl(rawContact.helpDeskUrl) || '/study-material',
      grievanceEmail: sanitizePlainText(rawContact.grievanceEmail || 'grievance@mayf.co.in', 100),
      operatingHours: sanitizePlainText(rawContact.operatingHours || '', 120),
    };

    const rawCopy: Partial<ControlledHomepageCopySettings> = input.homepageCopy || {};
    const sanitizedCopy: ControlledHomepageCopySettings = {
      heroHeadline: sanitizePlainText(rawCopy.heroHeadline || DEFAULT_SITE_SETTINGS.homepageCopy.heroHeadline, 200),
      heroSubheadline: sanitizePlainText(rawCopy.heroSubheadline || DEFAULT_SITE_SETTINGS.homepageCopy.heroSubheadline, 500),
      heroKicker: sanitizePlainText(rawCopy.heroKicker || DEFAULT_SITE_SETTINGS.homepageCopy.heroKicker, 150),
      searchPlaceholder: sanitizePlainText(rawCopy.searchPlaceholder || DEFAULT_SITE_SETTINGS.homepageCopy.searchPlaceholder, 150),
      trendingTitle: sanitizePlainText(rawCopy.trendingTitle || DEFAULT_SITE_SETTINGS.homepageCopy.trendingTitle, 100),
      trendingSubtitle: sanitizePlainText(rawCopy.trendingSubtitle || DEFAULT_SITE_SETTINGS.homepageCopy.trendingSubtitle, 200),
      categoriesTitle: sanitizePlainText(rawCopy.categoriesTitle || DEFAULT_SITE_SETTINGS.homepageCopy.categoriesTitle, 100),
      categoriesSubtitle: sanitizePlainText(rawCopy.categoriesSubtitle || DEFAULT_SITE_SETTINGS.homepageCopy.categoriesSubtitle, 200),
      freeMaterialTitle: sanitizePlainText(rawCopy.freeMaterialTitle || DEFAULT_SITE_SETTINGS.homepageCopy.freeMaterialTitle, 100),
      freeMaterialSubtitle: sanitizePlainText(rawCopy.freeMaterialSubtitle || DEFAULT_SITE_SETTINGS.homepageCopy.freeMaterialSubtitle, 200),
      premiumMaterialTitle: sanitizePlainText(rawCopy.premiumMaterialTitle || DEFAULT_SITE_SETTINGS.homepageCopy.premiumMaterialTitle, 100),
      premiumMaterialSubtitle: sanitizePlainText(rawCopy.premiumMaterialSubtitle || DEFAULT_SITE_SETTINGS.homepageCopy.premiumMaterialSubtitle, 200),
      formulaDeckTitle: sanitizePlainText(rawCopy.formulaDeckTitle || DEFAULT_SITE_SETTINGS.homepageCopy.formulaDeckTitle, 100),
      formulaDeckSubtitle: sanitizePlainText(rawCopy.formulaDeckSubtitle || DEFAULT_SITE_SETTINGS.homepageCopy.formulaDeckSubtitle, 200),
      aiTeacherHeadline: sanitizePlainText(rawCopy.aiTeacherHeadline || DEFAULT_SITE_SETTINGS.homepageCopy.aiTeacherHeadline, 200),
      aiTeacherSubheadline: sanitizePlainText(rawCopy.aiTeacherSubheadline || DEFAULT_SITE_SETTINGS.homepageCopy.aiTeacherSubheadline, 400),
      coursesTitle: sanitizePlainText(rawCopy.coursesTitle || DEFAULT_SITE_SETTINGS.homepageCopy.coursesTitle, 100),
      coursesSubtitle: sanitizePlainText(rawCopy.coursesSubtitle || DEFAULT_SITE_SETTINGS.homepageCopy.coursesSubtitle, 200),
      annualPassTitle: sanitizePlainText(rawCopy.annualPassTitle || DEFAULT_SITE_SETTINGS.homepageCopy.annualPassTitle, 100),
      annualPassSubtitle: sanitizePlainText(rawCopy.annualPassSubtitle || DEFAULT_SITE_SETTINGS.homepageCopy.annualPassSubtitle, 300),
      annualPassGuarantee: sanitizePlainText(rawCopy.annualPassGuarantee || DEFAULT_SITE_SETTINGS.homepageCopy.annualPassGuarantee, 200),
      socialJoinTitle: sanitizePlainText(rawCopy.socialJoinTitle || DEFAULT_SITE_SETTINGS.homepageCopy.socialJoinTitle, 100),
      socialJoinSubtitle: sanitizePlainText(rawCopy.socialJoinSubtitle || DEFAULT_SITE_SETTINGS.homepageCopy.socialJoinSubtitle, 200),
    };

    const newSettings: SiteSettings = {
      brand: sanitizedBrand,
      colors: sanitizedColors,
      social: sanitizedSocial,
      contact: sanitizedContact,
      homepageCopy: sanitizedCopy,
      version: (this.currentSettings.version || 1) + 1,
      updatedAt: timestamp,
      updatedBy: actor.email,
    };

    this.currentSettings = newSettings;
    this.cacheTimestamp = Date.now();

    // Persist to Firestore /siteSettings/general
    try {
      const db = getAdminFirestore();
      if (db) {
        await db.collection('siteSettings').doc('general').set(newSettings);
      }
    } catch (e: any) {
      console.warn('[SiteSettingsService] Firestore persistence note:', e?.message || e);
    }

    // Keep homepage blocks synchronized with updated copy and social links
    this.syncWithHomepageBlocks(newSettings, actor).catch((err) => {
      console.warn('[SiteSettingsService] Homepage blocks synchronization note:', err?.message || err);
    });

    // Audit logging
    auditLogService.log({
      action: 'SECURITY_CONFIG_UPDATED',
      category: 'security',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: 'siteSettings_general',
      targetType: 'site_settings',
      details: {
        siteName: sanitizedBrand.siteName,
        primaryColor: sanitizedColors.primaryColor,
        socialChannelsConfigured: Object.keys(sanitizedSocial).filter((k) => Boolean((sanitizedSocial as any)[k])),
      },
      status: 'success',
    });

    return this.getAdminSettings();
  }

  /**
   * Syncs relevant copy & social links directly into homepage blocks so changes are immediately visible
   */
  private async syncWithHomepageBlocks(
    settings: SiteSettings,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): Promise<void> {
    try {
      const currentBlocks = homepageLayoutService.getAdminLayout().blocks;
      const copy = settings.homepageCopy;

      const updatedBlocks = currentBlocks.map((b) => {
        const cloned = { ...b, config: { ...(b.config || {}) } };
        switch (b.id) {
          case 'hero':
            cloned.config.headline = copy.heroHeadline;
            cloned.config.subheadline = copy.heroSubheadline;
            cloned.config.kickerText = copy.heroKicker;
            break;
          case 'globalSearch':
            cloned.config.placeholder = copy.searchPlaceholder;
            break;
          case 'trending':
            cloned.config.title = copy.trendingTitle;
            cloned.config.subtitle = copy.trendingSubtitle;
            break;
          case 'classCategories':
            cloned.config.title = copy.categoriesTitle;
            cloned.config.subtitle = copy.categoriesSubtitle;
            break;
          case 'freeMaterial':
            cloned.config.title = copy.freeMaterialTitle;
            cloned.config.subtitle = copy.freeMaterialSubtitle;
            break;
          case 'premiumMaterial':
            cloned.config.title = copy.premiumMaterialTitle;
            cloned.config.subtitle = copy.premiumMaterialSubtitle;
            break;
          case 'formulaDeckCta':
            cloned.config.title = copy.formulaDeckTitle;
            cloned.config.subtitle = copy.formulaDeckSubtitle;
            break;
          case 'aiTeacherCta':
            cloned.config.headline = copy.aiTeacherHeadline;
            cloned.config.subheadline = copy.aiTeacherSubheadline;
            break;
          case 'courses':
            cloned.config.title = copy.coursesTitle;
            cloned.config.subtitle = copy.coursesSubtitle;
            break;
          case 'annualPassCta':
            cloned.config.title = copy.annualPassTitle;
            cloned.config.subtitle = copy.annualPassSubtitle;
            cloned.config.guaranteeText = copy.annualPassGuarantee;
            break;
          case 'socialJoin':
            cloned.config.title = copy.socialJoinTitle;
            cloned.config.subtitle = copy.socialJoinSubtitle;
            if (settings.social.telegram) cloned.config.telegramUrl = settings.social.telegram;
            if (settings.social.youtube) cloned.config.youtubeUrl = settings.social.youtube;
            if (settings.social.whatsapp) cloned.config.whatsappUrl = settings.social.whatsapp;
            break;
        }
        return cloned;
      });

      await homepageLayoutService.updateLayout(updatedBlocks, actor);
    } catch (e: any) {
      console.warn('[SiteSettingsService] syncWithHomepageBlocks note:', e?.message || e);
    }
  }

  /**
   * Resets site settings to defaults
   */
  public async resetToDefaults(
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): Promise<SiteSettings> {
    const defaultCopy = JSON.parse(JSON.stringify(DEFAULT_SITE_SETTINGS));
    return this.updateSettings(defaultCopy, actor);
  }
}

export const siteSettingsService = new SiteSettingsService();
