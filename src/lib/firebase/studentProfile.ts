import type {FirestoreDocumentStore} from './documentStore';
const grades=['Class 5','Class 6','Class 7','Class 8','Class 9','Class 10'];
export async function readStudentProfile(db:FirestoreDocumentStore,uid:string) {
 const snap=await db.collection('users').doc(uid).get();if(!snap.exists)return null;
 const data=snap.data()!;
 return Object.fromEntries(['uid','email','displayName','photoURL','studentClass','board','phoneNumber','streakDays','lastActiveDate','createdAt','updatedAt','lastLoginAt'].filter(k=>data[k]!==undefined).map(k=>[k,k==='uid'?uid:data[k]]));
}
export async function saveStudentGrade(db:FirestoreDocumentStore,uid:string,input:Record<string,unknown>) {
 if(!input||Object.keys(input).length!==1||!grades.includes(input.studentClass as string))throw Error('Select a grade from Class 5 to Class 10.');
 const snap=await db.collection('users').doc(uid).get();if(!snap.exists)throw Error('Your profile is unavailable. Sign in again before saving.');
 const updatedAt=new Date().toISOString();
 await db.commit([{collection:'users',id:uid,updateTime:snap.updateTime,data:{...snap.data(),studentClass:input.studentClass,updatedAt}}]);
 return {studentClass:input.studentClass,updatedAt};
}
