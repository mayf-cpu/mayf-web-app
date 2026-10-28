import type {ContentRegistryRow} from './types';

export const REGISTRY_FORMATS = ['pdf','course','testPaper','worksheet','formulaSheet','video','reel','youtube','facebook','singleImage','multiImage','other'];
export const EDITORIAL_TEXT_FIELDS = ['title','short_description','description','topic','tags','seo_title','seo_description'] as const;

/** A new editorial approval column takes precedence over all legacy status cells. */
export function normalizeRegistryRow(input: Record<string, any>): ContentRegistryRow {
 const row={...input};
 for(const field of ['annual_pass_included','download_allowed','download_permission_confirmed','featured']) {
  if(row[field]!==undefined&&row[field]!=='') row[field]=row[field]===true||/^(true|yes|1)$/i.test(String(row[field]));
 }
 const grades=[row.class,...Array.from({length:6},(_,i)=>row['grade_'+(i+1)])].filter(Boolean).flatMap(v=>String(v).split(',').map(s=>s.trim())).filter(Boolean);
 row.class=[...new Set(grades)].join(', ');
 if(Object.hasOwn(row,'approval_status')) {
  const approval=String(row.approval_status||'Pending').trim();
  if(!['Pending','Approved','Rejected'].includes(approval))throw new Error('Approval must be Pending, Approved or Rejected.');
  row.approval_status=approval;
  row.status=approval==='Approved'&&row.import_status!=='SUCCESS'?'Approved':approval==='Rejected'?'Rejected':approval==='Approved'?'Imported':'Review';
 }
 return row as ContentRegistryRow;
}

export function requireApprovedRegistryRow(row:ContentRegistryRow){
 if(row.status!=='Approved'||(row.approval_status!==undefined&&row.approval_status!=='Approved'))throw new Error('Only explicitly Approved rows can be imported.');
 if(!row.title?.trim()||row.title.length>300)throw new Error('A title of 1–300 characters is required.');
 if(!REGISTRY_FORMATS.includes(row.content_type))throw new Error('Unsupported content format.');
 if(!['free','paid'].includes(row.access_type))throw new Error('Access type must be free or paid.');
 if(!['Visible','Hidden'].includes(row.visibility))throw new Error('Visibility must be Visible or Hidden.');
 if(!row.class?.trim()||!row.category?.trim())throw new Error('At least one grade and a subject category are required.');
 if(row.price!==undefined&&(!Number.isFinite(Number(row.price))||Number(row.price)<0))throw new Error('Price must be a non-negative number.');
 if(row.sort_order!==undefined&&(!Number.isFinite(Number(row.sort_order))||Number(row.sort_order)<0))throw new Error('Sort order must be a non-negative number.');
}

export function validateRegeneratedText(value:unknown):Record<string,string>{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('AI returned an invalid revision.');
 const result:Record<string,string>={};
 for(const field of EDITORIAL_TEXT_FIELDS){
  const text=(value as Record<string,unknown>)[field];
  if(typeof text!=='string'||text.length>(field==='description'?20000:field==='title'?300:2000))throw new Error('AI returned invalid '+field+'.');
  result[field]=text;
 }
 if(!result.title.trim()||!result.description.trim())throw new Error('AI returned an empty revision.');
 return result;
}
