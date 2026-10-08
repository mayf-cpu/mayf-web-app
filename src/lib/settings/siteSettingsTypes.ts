/**
 * Canonical Site Settings Types and Defaults.
 * 
 * Required configurable settings:
 * - logo (URL or path)
 * - alternative logo (inverted / dark mode / secondary logo)
 * - favicon
 * - site name
 * - short name
 * - tagline
 * - footer text
 * - primary color
 * - secondary color
 * - accent color
 * - social links
 * - contact/support links
 * - controlled editable text for standard homepage sections
 */

export interface BrandIdentitySettings {
  logoUrl: string;
  altLogoUrl: string;
  faviconUrl: string;
  siteName: string;
  shortName: string;
  tagline: string;
  footerText: string;
  copyrightText: string;
  wordmarkGlyph: string;
}

export interface ThemeColorsSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface SocialLinksSettings {
  youtube: string;
  telegram: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  twitter: string;
  linkedin: string;
}

export interface ContactSupportSettings {
  supportEmail: string;
  supportPhone: string;
  whatsappSupport: string;
  helpDeskUrl: string;
  grievanceEmail: string;
  operatingHours: string;
}

export interface ControlledHomepageCopySettings {
  heroHeadline: string;
  heroSubheadline: string;
  heroKicker: string;
  searchPlaceholder: string;
  trendingTitle: string;
  trendingSubtitle: string;
  categoriesTitle: string;
  categoriesSubtitle: string;
  freeMaterialTitle: string;
  freeMaterialSubtitle: string;
  premiumMaterialTitle: string;
  premiumMaterialSubtitle: string;
  formulaDeckTitle: string;
  formulaDeckSubtitle: string;
  aiTeacherHeadline: string;
  aiTeacherSubheadline: string;
  coursesTitle: string;
  coursesSubtitle: string;
  annualPassTitle: string;
  annualPassSubtitle: string;
  annualPassGuarantee: string;
  socialJoinTitle: string;
  socialJoinSubtitle: string;
}

export interface SiteSettings {
  brand: BrandIdentitySettings;
  colors: ThemeColorsSettings;
  social: SocialLinksSettings;
  contact: ContactSupportSettings;
  homepageCopy: ControlledHomepageCopySettings;
  version: number;
  updatedAt: string;
  updatedBy: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  brand: {
    logoUrl: '',
    altLogoUrl: '',
    faviconUrl: '/favicon.ico',
    siteName: 'Maths at Your Fingertips',
    shortName: 'MAYF',
    tagline: 'The authoritative digital math companion for Class 5–10 students.',
    footerText: 'Authoritative mathematical learning companion specifically crafted for Class 5 to 10 school students across CBSE and ICSE boards.',
    copyrightText: 'Maths at Your Fingertips (mayf.co.in). All rights reserved.',
    wordmarkGlyph: 'Σ',
  },
  colors: {
    primaryColor: '#1D4ED8',
    secondaryColor: '#0037B0',
    accentColor: '#06B6D4',
  },
  social: {
    youtube: 'https://youtube.com/@MathsAtYourFingertips',
    telegram: 'https://t.me/mayf_mathematics',
    whatsapp: 'https://chat.whatsapp.com/mayf-math-prep',
    instagram: 'https://instagram.com/mayf_math',
    facebook: 'https://facebook.com/mayfmath',
    twitter: 'https://x.com/mayf_math',
    linkedin: '',
  },
  contact: {
    supportEmail: 'support@mayf.co.in',
    supportPhone: '+91 98765 43210',
    whatsappSupport: 'https://wa.me/919876543210',
    helpDeskUrl: '/study-material',
    grievanceEmail: 'grievance@mayf.co.in',
    operatingHours: 'Monday to Saturday, 9:00 AM – 7:00 PM IST',
  },
  homepageCopy: {
    heroHeadline: 'Master School Mathematics with Intuition & Absolute Clarity.',
    heroSubheadline: 'From foundational fraction arithmetic to Class 10 board exam derivations. Explore interactive formula flashcards, step-by-step problem breakdowns, and 24/7 AI Teacher doubt clearance.',
    heroKicker: 'CBSE & ICSE Board Aligned · Classes 5 to 10 · Zero Rote Learning',
    searchPlaceholder: 'Search theorems, formulas, chapters (e.g. "Quadratic", "Pythagoras", "BPT")...',
    trendingTitle: 'Trending Revision Topics',
    trendingSubtitle: 'Most active proofs and problem sets this week across board batches.',
    categoriesTitle: 'Select Your Standard',
    categoriesSubtitle: 'Curated chapter maps, formula collections, and board exam tips for each grade.',
    freeMaterialTitle: 'Free Study Materials & Revision Guides',
    freeMaterialSubtitle: 'Accessible 100% free without sign-in or payment.',
    premiumMaterialTitle: 'Exemplar & Board Diagnostic Assessments',
    premiumMaterialSubtitle: 'Full length mock papers and timed section practice for Annual Pass holders.',
    formulaDeckTitle: 'Authoritative Formula Deck',
    formulaDeckSubtitle: 'Every formula verified with variable definitions, units, and mnemonics.',
    aiTeacherHeadline: 'Stuck on a Math Problem at 10 PM?',
    aiTeacherSubheadline: 'Professor Sigma, your personal AI Math Tutor, guides your thinking step-by-step, highlights the exact CBSE/ICSE formulas needed, and tests your conceptual understanding.',
    coursesTitle: 'Structured Math Video Courses',
    coursesSubtitle: 'Concept-first video series covering every NCERT exemplar proof.',
    annualPassTitle: 'Maths at Your Fingertips Annual Pass',
    annualPassSubtitle: 'Complete syllabus access for Class 5 to 10. Printable revision notes, formula flashcards, and unlimited AI Teacher guidance.',
    annualPassGuarantee: '100% Money-Back Guarantee within 7 days. No questions asked.',
    socialJoinTitle: 'Join Our Student Mathematics Community',
    socialJoinSubtitle: 'Daily morning formulas, board exam alert discussions, and live doubt groups.',
  },
  version: 1,
  updatedAt: '2026-04-01T00:00:00Z',
  updatedBy: 'system_default',
};
