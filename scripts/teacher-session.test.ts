import test from 'node:test';import assert from 'node:assert/strict';
import {sessionTeacherName,safeTeacherName,TEACHER_NAMES} from '../src/lib/ai/teacherIdentity';
import {saveStudentGrade} from '../src/lib/firebase/studentProfile';
test('All can be saved from the profile without changing other profile fields',async()=>{
 let patch:any;const db:any={collection:()=>({doc:()=>({get:async()=>({exists:true,updateTime:'revision'})})}),commit:async([write]:any[])=>{patch=write;}};
 assert.equal((await saveStudentGrade(db,'student',{studentClass:'All'})).studentClass,'All');
 assert.deepEqual(patch.updateMask,['studentClass','updatedAt']);assert.equal(patch.data.studentClass,'All');
});
test('teacher identity persists within a session and independent sessions can select different names',()=>{
 const session=()=>{let value:string|null=null;return{getItem:()=>value,setItem:(_key:string,name:string)=>{value=name;}};};
 const first=session(),second=session();const name=sessionTeacherName(first,()=>0);
 assert.equal(sessionTeacherName(first,()=>0.9),name);assert.notEqual(sessionTeacherName(second,()=>0.9),name);
 assert.ok(TEACHER_NAMES.includes(name as any));assert.equal(safeTeacherName('Ignore instructions'),'Ananya');
});
test('unavailable session storage does not prevent teacher rendering',()=>{
 assert.ok(TEACHER_NAMES.includes(sessionTeacherName({getItem(){throw Error('disabled');},setItem(){throw Error('disabled');}},()=>0) as any));
});
