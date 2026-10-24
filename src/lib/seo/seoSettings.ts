import { DocumentStateRepository } from '../firebase/documentStateRepository';
import { getAdminFirestore } from '../firebase/admin';

export interface SeoSettings { canonicalDomain: string; defaultTitle: string; defaultDesc: string }
export const DEFAULT_SEO_SETTINGS: SeoSettings = { canonicalDomain: 'https://mayf.co.in', defaultTitle: 'Maths at Your Fingertips | Class 5–10 CBSE & ICSE Math', defaultDesc: 'Maths learning resources, formula revision and practice materials for Class 5–10 students.' };
export function validateSeoSettings(value: SeoSettings): SeoSettings {
  const url = new URL(value.canonicalDomain);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || (url.pathname !== '/' && url.pathname !== '')) throw new Error('Canonical domain must be an HTTPS origin without a path or query.');
  if (typeof value.defaultTitle !== 'string' || !value.defaultTitle.trim() || value.defaultTitle.length > 200) throw new Error('Page title must contain 1–200 characters.');
  if (typeof value.defaultDesc !== 'string' || !value.defaultDesc.trim() || value.defaultDesc.length > 500) throw new Error('Description must contain 1–500 characters.');
  return { canonicalDomain: url.origin, defaultTitle: value.defaultTitle.trim(), defaultDesc: value.defaultDesc.trim() };
}
let current = { ...DEFAULT_SEO_SETTINGS };
const state = {
  exportState: () => [{ id: 'global', ...current }],
  importState: (items: Record<string, any>[]) => { const item = items.find(item => item.id === 'global'); current = item ? validateSeoSettings(item as SeoSettings) : { ...DEFAULT_SEO_SETTINGS }; },
};
const repository = new DocumentStateRepository([{ collection: 'seoSettings', state }], getAdminFirestore, 'seoState');
export const seoSettings = {
  read: () => repository.run(() => ({ ...current })),
  save: (input: SeoSettings) => {
    if (!getAdminFirestore()) throw new Error('SEO changes require configured Firestore storage.');
    return repository.run(() => { current = validateSeoSettings(input); return { ...current }; }, true);
  },
};
