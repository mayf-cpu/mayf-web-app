import type {ContentItem} from '../firebase/types';
import {SEED_CONTENT_ITEMS} from './seedContent';
/** Hide untouched starter records without deleting or hiding owner-edited content. */
export function isRealHomepageContent(item:ContentItem){
 const seed=SEED_CONTENT_ITEMS.find(sample=>sample.id===item.id);
 return !seed||item.title!==seed.title||item.description!==seed.description;
}
