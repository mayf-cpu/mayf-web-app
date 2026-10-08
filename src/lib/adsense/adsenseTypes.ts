/**
 * AdSense Configuration & Child-Safe Minor Protection Types.
 * 
 * Strict Minor Compliance Architecture:
 * - Target audience: School students (Classes 5 to 10, typically ages 10–16).
 * - COPPA (Children's Online Privacy Protection Act) compliance.
 * - DPDP Act 2023 (Digital Personal Data Protection Act - India) & GDPR-K compliance.
 * - Non-personalized contextual advertising only (no tracking cookies, zero behavioral profiling).
 * - TFCD (Tag For Child Directed Treatment) & TFUA (Tag For Under Age of Consent).
 * - Content rating capped at 'G' (General Audiences).
 */

export type AdSensePageZone = 'homepage' | 'catalogue' | 'search' | 'content' | 'formulaPages';

export type AdSensePosition = 'top' | 'inline' | 'bottom' | 'sidebar';

export type AdFormat = 'auto' | 'horizontal' | 'rectangle' | 'responsive';

export type AdContentRating = 'G' | 'PG';

export interface PlacementConfig {
  enabled: boolean;
  slotId: string;
  position: AdSensePosition;
  format: AdFormat;
  minHeightPx: number;
  showDisclaimer: boolean;
  notes?: string;
}

export interface MinorProtectionSettings {
  tagForChildDirectedTreatment: boolean; // TFCD: true
  tagForUnderAgeOfConsent: boolean;       // TFUA: true
  nonPersonalizedAdsOnly: boolean;         // NPA: true
  maxAdContentRating: AdContentRating;    // 'G' (General family-safe)
  restrictedDataProcessing: boolean;      // RDP: true
  disableInterestBasedAds: boolean;       // No tracking cookies
}

export interface AdSenseSettings {
  adsenseEnabled: boolean;
  publisherId: string; // e.g. "ca-pub-XXXXXXXXXXXXXXXX"
  minorProtection: MinorProtectionSettings;
  consent: {
    bannerEnabled: boolean;
    requireExplicitConsent: boolean;
    privacyPolicyUrl: string;
  };
  placements: Record<AdSensePageZone, PlacementConfig>;
  updatedAt: string;
  updatedBy: string;
  version: number;
}

export const DEFAULT_ADSENSE_SETTINGS: AdSenseSettings = {
  adsenseEnabled: false, // Default safe: disabled until admin configures valid publisher
  publisherId: 'ca-pub-9632228872030000',
  minorProtection: {
    tagForChildDirectedTreatment: true,  // Enabled by default for school minors
    tagForUnderAgeOfConsent: true,        // Enabled for teen/minor protection
    nonPersonalizedAdsOnly: true,         // Zero behavioral profiling of students
    maxAdContentRating: 'G',              // Strictly G-rated family/educational ads
    restrictedDataProcessing: true,
    disableInterestBasedAds: true,
  },
  consent: {
    bannerEnabled: true,
    requireExplicitConsent: false,
    privacyPolicyUrl: '/privacy',
  },
  placements: {
    homepage: {
      enabled: false,
      slotId: '1001-mayf-home-banner',
      position: 'bottom',
      format: 'horizontal',
      minHeightPx: 90,
      showDisclaimer: true,
      notes: 'Below curriculum blocks and above educational footer',
    },
    catalogue: {
      enabled: false,
      slotId: '1002-mayf-catalogue-banner',
      position: 'top',
      format: 'horizontal',
      minHeightPx: 90,
      showDisclaimer: true,
      notes: 'Header strip above chapter list',
    },
    search: {
      enabled: false,
      slotId: '1003-mayf-search-banner',
      position: 'bottom',
      format: 'horizontal',
      minHeightPx: 90,
      showDisclaimer: true,
      notes: 'Below verified theorem and formula search results',
    },
    content: {
      enabled: false,
      slotId: '1004-mayf-content-banner',
      position: 'bottom',
      format: 'responsive',
      minHeightPx: 120,
      showDisclaimer: true,
      notes: 'Foot of study chapter; prohibited inside worksheets or question papers',
    },
    formulaPages: {
      enabled: false,
      slotId: '1005-mayf-formula-banner',
      position: 'bottom',
      format: 'rectangle',
      minHeightPx: 250,
      showDisclaimer: true,
      notes: 'Secondary side/footer slot on formula detail views',
    },
  },
  updatedAt: '2026-04-01T00:00:00Z',
  updatedBy: 'system_default',
  version: 1,
};
