import type {FirestoreDocumentStore} from './documentStore';
const grades=['All','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10'];
export async function readStudentProfile(db:FirestoreDocumentStore,uid:string) {
 const snap=await db.collection('users').doc(uid).get();if(!snap.exists)return null;
 const data=snap.data()!;
 return Object.fromEntries(['uid','email','displayName','photoURL','studentClass','board','phoneNumber','streakDays','lastActiveDate','createdAt','updatedAt','lastLoginAt'].filter(k=>data[k]!==undefined).map(k=>[k,k==='uid'?uid:data[k]]));
}
export async function saveStudentGrade(db:FirestoreDocumentStore,uid:string,input:Record<string,unknown>,identity:{email?:string}={}) {
 if(!input||Object.keys(input).length!==1||!grades.includes(input.studentClass as string))throw Error('Select a grade from Class 5 to Class 10.');
 for(let attempt=0;attempt<3;attempt++){
 const snap=await db.collection('users').doc(uid).get();
 const updatedAt=new Date().toISOString();
 // Patch only these fields: login metadata may change concurrently, and legacy
 // fields must retain their original Firestore types. Missing browser-created
 // profiles are initialized here using only the verified session identity.
 try {await db.commit([{collection:'users',id:uid,
  ...(snap.exists ? {updateTime:snap.updateTime,updateMask:['studentClass','updatedAt']} : {}),
  data:{...(!snap.exists ? {uid,email:identity.email || '',displayName:'Student',board:'CBSE',createdAt:updatedAt} : {}),studentClass:input.studentClass,updatedAt}}]);}catch(error){
  if(attempt<2 && error instanceof Error && error.message.includes('Another administrator changed'))continue;
  throw error;
 }
 return {studentClass:input.studentClass,updatedAt};
 }
 throw Error('Profile changed while saving. Please retry.');
}
