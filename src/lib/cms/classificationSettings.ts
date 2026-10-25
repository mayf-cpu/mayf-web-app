import {CONTENT_GRADES,SUBJECT_TOPICS} from './contentClassification';
export type ClassificationSettings={grades:string[];subjects:Record<string,string[]>};
export function defaultClassification():ClassificationSettings{return {grades:[...CONTENT_GRADES],subjects:structuredClone(SUBJECT_TOPICS)};}
export function addClassification(current:ClassificationSettings,input:{kind?:string;name?:string;subject?:string}):ClassificationSettings{
 const name=typeof input.name==='string'?input.name.trim():'';
 if(!name||name.length>80||/[<>\x00-\x1f]/.test(name)||['__proto__','constructor','prototype'].includes(name))throw new Error('Enter a plain-text name of 1–80 characters.');
 const next=structuredClone(current);
 const add=(list:string[])=>{if(!list.some(x=>x.toLowerCase()===name.toLowerCase())){if(list.length>=100)throw new Error('Maximum 100 options per list.');list.push(name);}};
 if(input.kind==='grade')add(next.grades);
 else if(input.kind==='subject'){if(Object.keys(next.subjects).length>=100)throw new Error('Maximum 100 subjects.');if(!Object.keys(next.subjects).some(x=>x.toLowerCase()===name.toLowerCase()))next.subjects[name]=[];}
 else if(input.kind==='subcategory'&&Object.hasOwn(next.subjects,input.subject||''))add(next.subjects[input.subject!]);
 else throw new Error('Choose an existing subject for this subcategory.');
 return next;
}
