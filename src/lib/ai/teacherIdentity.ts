export const TEACHER_NAMES=['Aarav','Arjun','Rohan','Vikram','Ananya','Priya','Kavya','Meera'] as const;
export function safeTeacherName(value:unknown):string{return TEACHER_NAMES.includes(value as any)?String(value):'Ananya';}
export function sessionTeacherName(storage?:Pick<Storage,'getItem'|'setItem'>,random= Math.random):string{
 try{const saved=storage?.getItem('mayf_teacher_name');if(TEACHER_NAMES.includes(saved as any))return saved!;}catch{}
 const name=TEACHER_NAMES[Math.min(TEACHER_NAMES.length-1,Math.floor(random()*TEACHER_NAMES.length))];
 try{storage?.setItem('mayf_teacher_name',name);}catch{}
 return name;
}
