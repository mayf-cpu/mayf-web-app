import React,{useEffect,useState} from 'react';
import {useAuth} from '../../context/AuthContext';
import type {StudentClass} from '../../lib/firebase/types';
export function GradeSelector({label}:{label:string}) {
 const {user,updateClass}=useAuth();
 const [grade,setGrade]=useState<StudentClass>(user?.studentClass||'Class 5');
 const [saving,setSaving]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState('');
 useEffect(()=>{setGrade(user?.studentClass||'Class 5');},[user?.uid,user?.studentClass]);
 const save=async()=>{setSaving(true);setMessage('');setError('');try{await updateClass(grade);setMessage('Grade saved.');}catch(e){setError(e instanceof Error?e.message:'Grade could not be saved.');}finally{setSaving(false);}};
 return <div className="flex flex-wrap items-center gap-2"><select aria-label={label} value={grade} disabled={saving} onChange={e=>{setGrade(e.target.value as StudentClass);setMessage('');setError('');}} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">{(['Class 5','Class 6','Class 7','Class 8','Class 9','Class 10'] as StudentClass[]).map(c=><option key={c}>{c}</option>)}</select><button type="button" onClick={save} disabled={saving||!user||grade===user.studentClass} className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{saving?'Saving…':'Save grade'}</button>{message&&<span role="status">{message}</span>}{error&&<span role="alert" className="text-red-700">{error}</span>}</div>;
}
