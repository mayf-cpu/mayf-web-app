import React from 'react';
import {useClassification} from '../../lib/cms/useClassification';
import {CONTENT_GRADES,SUBJECT_TOPICS,toggleContentGrade} from '../../lib/cms/contentClassification';
type Classification={classLevels?:string[];categoryId?:string;subcategoryId?:string};
export function ContentClassificationFields({value,onChange}:{value:Classification;onChange:(patch:Classification)=>void}){
 const {settings,error}=useClassification();
 const grades=Array.from(new Set([...settings.grades,...(value.classLevels||[])]));
 const categories=Object.keys(settings.subjects);
 if(value.categoryId&&!categories.includes(value.categoryId))categories.push(value.categoryId);
 const topics=[...(settings.subjects[value.categoryId||'']||[])];
 if(value.subcategoryId&&!topics.includes(value.subcategoryId))topics.push(value.subcategoryId);
 const field='w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600';
 return <div className="space-y-4">
  {error&&<p role="alert">{error}</p>}<fieldset className="space-y-2"><legend className="font-semibold text-slate-700">Target grade levels</legend>
   <p className="text-xs text-slate-500">Select every applicable class. Grades do not change the subject or subcategory.</p>
   <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{grades.map(grade=><label key={grade} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3"><input type="checkbox" checked={value.classLevels?.includes(grade)||false} onChange={()=>onChange({classLevels:toggleContentGrade(value.classLevels||[],grade)})} className="h-4 w-4 accent-blue-700"/>{grade}</label>)}</div>
  </fieldset>
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="space-y-1.5"><label htmlFor="content-subject" className="font-semibold text-slate-700">Subject category</label><select id="content-subject" value={value.categoryId||''} onChange={e=>onChange({categoryId:e.target.value,subcategoryId:''})} className={field}><option value="">Select subject category</option>{categories.map(category=><option key={category}>{category}</option>)}</select></div>
  <div className="space-y-1.5"><label htmlFor="content-subcategory" className="font-semibold text-slate-700">Subcategory</label><select id="content-subcategory" value={value.subcategoryId||''} disabled={!value.categoryId} onChange={e=>onChange({subcategoryId:e.target.value})} className={field}><option value="">{value.categoryId?'Select subcategory (optional)':'Select a subject first'}</option>{topics.map(topic=><option key={topic}>{topic}</option>)}</select></div></div>
 </div>;
}
