import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readStudentProfile,saveStudentGrade} from '../src/lib/firebase/studentProfile';
test('grade survives a fresh profile read without changing unrelated profile fields',async()=>{
 let row:any={uid:'owner',email:'owner@example.test',displayName:'Student',studentClass:'Class 10',board:'CBSE',admin:true};
 const db:any={collection:(name:string)=>{assert.equal(name,'users');return {doc:(uid:string)=>{assert.equal(uid,'owner');return {get:async()=>({exists:true,updateTime:'revision',data:()=>row})};}};},commit:async(changes:any[])=>{assert.equal(changes[0].id,'owner');assert.equal(changes[0].updateTime,'revision');row=changes[0].data;}};
 await saveStudentGrade(db,'owner',{studentClass:'Class 7'});
 const profile=await readStudentProfile(db,'owner');assert.equal(profile?.studentClass,'Class 7');assert.equal(profile?.displayName,'Student');assert.equal(profile?.admin,undefined);assert.equal(row.admin,true);
});
test('failed durable saves reject and extra fields cannot change another student or roles',async()=>{
 const db:any={collection:()=>({doc:()=>({get:async()=>({exists:true,updateTime:'revision',data:()=>({studentClass:'Class 10'})})})}),commit:async()=>{throw Error('storage failure');}};
 await assert.rejects(saveStudentGrade(db,'owner',{studentClass:'Class 7'}),/storage failure/);
 for(const input of [{studentClass:'Class 11'},{studentClass:'Class 7',uid:'other'},{studentClass:'Class 7',admin:true}])await assert.rejects(saveStudentGrade(db,'owner',input),/Select a grade/);
});
