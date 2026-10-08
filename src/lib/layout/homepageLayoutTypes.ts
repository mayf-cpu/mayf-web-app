/**
 * Types and canonical configurations for Controlled Homepage Block Manager.
 * 
 * Strict predefined performant blocks:
 * 1. Hero
 * 2. Global Search
 * 3. Trending
 * 4. Latest
 * 5. Popular
 * 6. Class Categories
 * 7. Free Material
 * 8. Premium Material
 * 9. Formula Deck CTA
 * 10. AI Teacher CTA
 * 11. Courses
 * 12. Annual Pass CTA
 * 13. Social Join
 * 14. AdSense
 * 15. Custom Announcement
 */

export type HomepageBlockId =
  | 'hero'
  | 'globalSearch'
  | 'trending'
  | 'latest'
  | 'popular'
  | 'classCategories'
  | 'freeMaterial'
  | 'premiumMaterial'
  | 'formulaDeckCta'
  | 'aiTeacherCta'
  | 'courses'
  | 'annualPassCta'
  | 'socialJoin'
  | 'adsense'
  | 'customAnnouncement';

export interface BaseBlockConfig {
  [key: string]: any;
}

export interface HeroBlockConfig extends BaseBlockConfig {
  headline: string;
  subheadline: string;
  kickerText: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  showWatermark: boolean;
}

export interface GlobalSearchBlockConfig extends BaseBlockConfig {
  placeholder: string;
  showQuickPills: boolean;
  quickTags: string[];
}

export interface TrendingBlockConfig extends BaseBlockConfig {
  title: string;
  subtitle: string;
  maxItems: number;
}

export interface LatestBlockConfig extends BaseBlockConfig {
  title: string;
  subtitle: string;
  maxItems: number;
}

export interface PopularBlockConfig extends BaseBlockConfig {
  title: string;
  subtitle: string;
  maxItems: number;
}

export interface ClassCategoriesBlockConfig extends BaseBlockConfig {
  title: string;
  subtitle: string;
  defaultClass: string;
  availableClasses: string[];
}

export interface FreeMaterialBlockConfig extends BaseBlockConfig {
  title: string;
  subtitle: string;
  maxItems: number;
  highlightDownloads: boolean;
}

export interface PremiumMaterialBlockConfig extends BaseBlockConfig {
  title: string;
  subtitle: string;
  maxItems: number;
  showPricingBadge: boolean;
}

export interface FormulaDeckCtaBlockConfig extends BaseBlockConfig {
  title: string;
  subtitle: string;
  viewAllText: string;
  sampleCount: number;
}

export interface AiTeacherCtaBlockConfig extends BaseBlockConfig {
  headline: string;
  subheadline: string;
  badgeText: string;
  primaryButtonText: string;
  secondaryButtonText: string;
}

export interface CoursesBlockConfig extends BaseBlockConfig {
  title: string;
  subtitle: string;
  maxItems: number;
}

export interface AnnualPassCtaBlockConfig extends BaseBlockConfig {
  badgeText: string;
  title: string;
  subtitle: string;
  priceFormatted: string;
  periodText: string;
  guaranteeText: string;
  buttonText: string;
}

export interface SocialJoinBlockConfig extends BaseBlockConfig {
  title: string;
  subtitle: string;
  telegramUrl: string;
  youtubeUrl: string;
  whatsappUrl: string;
}

export interface AdSenseBlockConfig extends BaseBlockConfig {
  adSlotId: string;
  format: 'auto' | 'horizontal' | 'rectangle';
  showDisclaimer: boolean;
  minHeightPx: number;
}

export interface CustomAnnouncementBlockConfig extends BaseBlockConfig {
  enabled: boolean;
  title: string;
  message: string;
  linkText?: string;
  linkUrl?: string;
  variant: 'info' | 'warning' | 'promo' | 'exam';
}

export interface HomepageBlock<T = BaseBlockConfig> {
  id: HomepageBlockId;
  name: string;
  description: string;
  enabled: boolean;
  order: number;
  config: T;
  updatedAt?: string;
}

export interface HomepageLayoutConfig {
  version: number;
  updatedAt: string;
  updatedBy?: string;
  blocks: HomepageBlock[];
}

/**
 * Authoritative Canonical Default Layout (15 Predefined Blocks)
 */
export const DEFAULT_HOMEPAGE_BLOCKS: HomepageBlock[] = [
  {
    id: 'customAnnouncement',
    name: 'Custom Announcement',
    description: 'Prominent banner for urgent curriculum updates, exams, or news',
    enabled: true,
    order: 1,
    config: {
      enabled: true,
      title: 'CBSE & ICSE 2026 Examination Revision Cycle Active',
      message: 'Download the rationalized Class 10 NCERT formula cheatsheets and exemplar proofs.',
      linkText: 'Explore Handbook',
      linkUrl: '/study-material',
      variant: 'info',
    } as CustomAnnouncementBlockConfig,
  },
  {
    id: 'hero',
    name: 'Hero',
    description: 'Academic hero section with headline, descriptions, and primary CTA buttons',
    enabled: true,
    order: 2,
    config: {
      headline: 'Master School Mathematics with Intuition & Absolute Clarity.',
      subheadline: 'From foundational fraction arithmetic to Class 10 board exam derivations. Explore interactive formula flashcards, step-by-step problem breakdowns, and 24/7 AI Teacher doubt clearance.',
      kickerText: 'CBSE & ICSE Board Aligned · Classes 5 to 10 · Zero Rote Learning',
      primaryButtonText: 'Explore Class 5–10 Syllabus',
      primaryButtonLink: '/study-material',
      secondaryButtonText: 'Ask AI Teacher a Doubt',
      secondaryButtonLink: '/ai-teacher',
      showWatermark: true,
    } as HeroBlockConfig,
  },
  {
    id: 'globalSearch',
    name: 'Global Search',
    description: 'Instant keyword search bar for topics, theorems, and chapters',
    enabled: true,
    order: 3,
    config: {
      placeholder: 'Search theorems, formulas, chapters (e.g. "Quadratic", "Pythagoras", "BPT")...',
      showQuickPills: true,
      quickTags: ['Real Numbers', 'Quadratic Equations', 'Trigonometry', 'Circles', 'Pythagoras', 'Arithmetic Progressions'],
    } as GlobalSearchBlockConfig,
  },
  {
    id: 'classCategories',
    name: 'Class Categories',
    description: 'Standard grade selector strip (Classes 5 to 10) and chapter maps',
    enabled: true,
    order: 4,
    config: {
      title: 'Select Your Standard',
      subtitle: 'Curated chapter maps, formula collections, and board exam tips for each grade.',
      defaultClass: 'Class 10',
      availableClasses: ['Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
    } as ClassCategoriesBlockConfig,
  },
  {
    id: 'trending',
    name: 'Trending',
    description: 'Curated high-velocity curriculum items among students',
    enabled: true,
    order: 5,
    config: {
      title: 'Trending Revision Topics',
      subtitle: 'Most active proofs and problem sets this week across board batches.',
      maxItems: 4,
    } as TrendingBlockConfig,
  },
  {
    id: 'freeMaterial',
    name: 'Free Material',
    description: '100% free study resources accessible without login',
    enabled: true,
    order: 6,
    config: {
      title: 'Free Study Materials & Revision Guides',
      subtitle: 'Accessible 100% free without sign-in or payment.',
      maxItems: 4,
      highlightDownloads: true,
    } as FreeMaterialBlockConfig,
  },
  {
    id: 'formulaDeckCta',
    name: 'Formula Deck CTA',
    description: 'Authoritative visual formula flashcards and KaTeX expressions',
    enabled: true,
    order: 7,
    config: {
      title: 'Authoritative Formula Deck',
      subtitle: 'Every formula verified with variable definitions, units, and mnemonics.',
      viewAllText: 'Browse All 80+ Formulas',
      sampleCount: 3,
    } as FormulaDeckCtaBlockConfig,
  },
  {
    id: 'aiTeacherCta',
    name: 'AI Teacher CTA',
    description: 'Professor Sigma 24/7 personal math doubt clearance banner',
    enabled: true,
    order: 8,
    config: {
      headline: 'Stuck on a Math Problem at 10 PM?',
      subheadline: 'Professor Sigma, your personal AI Math Tutor, guides your thinking step-by-step, highlights the exact CBSE/ICSE formulas needed, and tests your conceptual understanding.',
      badgeText: 'Powered by Gemini & Firebase AI Logic',
      primaryButtonText: 'Start Free AI Doubt Session',
      secondaryButtonText: 'Explore Formula Deck First',
    } as AiTeacherCtaBlockConfig,
  },
  {
    id: 'popular',
    name: 'Popular',
    description: 'Most downloaded and viewed mathematics resources',
    enabled: true,
    order: 9,
    config: {
      title: 'Most Popular Revision Handouts',
      subtitle: 'Highest rated study guides, formula cheatsheets, and question banks.',
      maxItems: 4,
    } as PopularBlockConfig,
  },
  {
    id: 'courses',
    name: 'Courses',
    description: 'Modular structured curriculum video masterclasses',
    enabled: true,
    order: 10,
    config: {
      title: 'Structured Math Video Courses',
      subtitle: 'Concept-first video series covering every NCERT exemplar proof.',
      maxItems: 3,
    } as CoursesBlockConfig,
  },
  {
    id: 'premiumMaterial',
    name: 'Premium Material',
    description: 'Pro diagnostic assessments, board mock papers, and pass material',
    enabled: true,
    order: 11,
    config: {
      title: 'Exemplar & Board Diagnostic Assessments',
      subtitle: 'Full length mock papers and timed section practice for Annual Pass holders.',
      maxItems: 4,
      showPricingBadge: true,
    } as PremiumMaterialBlockConfig,
  },
  {
    id: 'annualPassCta',
    name: 'Annual Pass CTA',
    description: 'All-in-one annual pass pricing and 100% money back guarantee block',
    enabled: true,
    order: 12,
    config: {
      badgeText: 'ALL-IN-ONE BOARD PASS',
      title: 'Maths at Your Fingertips Annual Pass',
      subtitle: 'Complete syllabus access for Class 5 to 10. Printable revision notes, formula flashcards, and unlimited AI Teacher guidance.',
      priceFormatted: '₹999',
      periodText: '/ entire academic year',
      guaranteeText: '100% Money-Back Guarantee within 7 days. No questions asked.',
      buttonText: 'Unlock All Chapters & Formulas',
    } as AnnualPassCtaBlockConfig,
  },
  {
    id: 'latest',
    name: 'Latest',
    description: 'Recently published chapters and updated test papers',
    enabled: true,
    order: 13,
    config: {
      title: 'Newly Added Curriculum Resources',
      subtitle: 'Latest updates added to our mathematical repository.',
      maxItems: 4,
    } as LatestBlockConfig,
  },
  {
    id: 'socialJoin',
    name: 'Social Join',
    description: 'Telegram, YouTube, and WhatsApp student community channels',
    enabled: true,
    order: 14,
    config: {
      title: 'Join Our Student Mathematics Community',
      subtitle: 'Daily morning formulas, board exam alert discussions, and live doubt groups.',
      telegramUrl: 'https://t.me/mayf_mathematics',
      youtubeUrl: 'https://youtube.com/@MathsAtYourFingertips',
      whatsappUrl: 'https://chat.whatsapp.com/mayf-math-prep',
    } as SocialJoinBlockConfig,
  },
  {
    id: 'adsense',
    name: 'AdSense',
    description: 'Compliant responsive advertising slot',
    enabled: false, // disabled by default, admin can enable
    order: 15,
    config: {
      adSlotId: 'ca-pub-mayf-homepage-banner-01',
      format: 'horizontal',
      showDisclaimer: true,
      minHeightPx: 90,
    } as AdSenseBlockConfig,
  },
];
