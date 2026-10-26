export const TEACHER_NAMES=['Aarav','Arjun','Rohan','Vikram','Ananya','Priya','Kavya','Meera'] as const;
export function teacherDisplayName(value:unknown):string{
 const name=safeTeacherName(value);
 return `${name} ${['Aarav','Arjun','Rohan','Vikram'].includes(name)?'Sir':"Ma'am"}`;
}
export function teacherWelcome(value:unknown):string{
 return `Hi, I'm ${teacherDisplayName(value)}. Please type your question or upload an image of it. I'll do my best to provide the correct answer with a step-by-step solution.`;
}
export function safeTeacherName(value:unknown):string{return TEACHER_NAMES.includes(value as any)?String(value):'Ananya';}
export function sessionTeacherName(storage?:Pick<Storage,'getItem'|'setItem'>,random= Math.random):string{
 try{const saved=storage?.getItem('mayf_teacher_name');if(TEACHER_NAMES.includes(saved as any))return saved!;}catch{}
 const name=TEACHER_NAMES[Math.min(TEACHER_NAMES.length-1,Math.floor(random()*TEACHER_NAMES.length))];
 try{storage?.setItem('mayf_teacher_name',name);}catch{}
 return name;
}
