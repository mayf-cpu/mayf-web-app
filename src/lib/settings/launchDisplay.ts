import type { SiteSettings } from './siteSettingsTypes';

/** Remove only known starter contact values; retain real owner configuration. */
export function usableWhatsApp(value?: string): string {
  return value && !/^https:\/\/(chat\.whatsapp\.com\/mayf-math-prep|wa\.me\/919876543210)\/?$/i.test(value) ? value : '';
}
export function launchDisplaySettings(settings: SiteSettings): SiteSettings {
  return { ...settings,
    social: { ...settings.social, whatsapp: usableWhatsApp(settings.social.whatsapp) },
    contact: { ...settings.contact,
      supportPhone: settings.contact.supportPhone.replace(/\D/g, '') === '919876543210' ? '' : settings.contact.supportPhone,
      whatsappSupport: usableWhatsApp(settings.contact.whatsappSupport),
    },
  };
}

const legacyPassCopy: Record<string, string> = {
  '80+ Formula Flashcards with step derivations': 'Formula flashcards with worked derivations',
  '80+ Interactive Formula Flashcards with rigorous step-by-step derivations': 'Interactive formula flashcards with worked derivations',
  'Complete, unrestricted access to the entire Class 5–10 mathematics curriculum.': 'Access to the published Class 5–10 learning resources included in your plan.',
  'Complete, unrestricted digital access to all Class 5–10 chapters, formulas, exemplar solutions, high-resolution PDF cheatsheets, and 24/7 Professor Sigma AI Teacher.': 'Explore published Class 5–10 chapters, formulas, printable resources, and Professor Sigma AI Teacher with daily usage limits.',
  'All 50+ Chapters across Class 5, 6, 7, 8, 9 & 10': 'Published chapters across Classes 5–10',
  'All 50+ Chapters across Class 5, 6, 7, 8, 9 & 10 (CBSE & ICSE)': 'Published Class 5–10 resources for CBSE and ICSE revision',
  'Unlimited 24/7 AI Teacher Doubt Resolutions': 'AI Teacher guidance with daily usage limits',
  'Unlimited 24/7 Multimodal AI Teacher (Professor Sigma) doubts': 'Multimodal AI Teacher guidance with daily usage limits',
  '10-Year NCERT Exemplar & Board Exam Past Paper Step Breakdowns': 'Published worked examples and revision explanations',
};
export function passDisplayCopy(value: string): string { return legacyPassCopy[value] || value; }
