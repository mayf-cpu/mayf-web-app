import assert from 'node:assert/strict';
import { test } from 'node:test';
import { auditLogService } from '../src/lib/audit/auditLogger';
import { DocumentStateRepository } from '../src/lib/firebase/documentStateRepository';

test('audit starts without fabricated historical records', () => {
  auditLogService.importState([]);
  assert.deepEqual(auditLogService.getLogs(), []);
});
test('catalogue audit commits atomically with content state', async () => {
  const content = { items:[{id:'item-a',title:'Original'}],
    exportState(){return this.items;}, importState(items:any[]){this.items=items;} };
  const docs=new Map<string,any>([['contentItems/item-a',{id:'item-a',title:'Original'}]]);
  let commitCalls=0;
  const db:any={
    collection(name:string){return {doc(id:string){return {async get(){return {exists:docs.has(name+'/'+id),data:()=>docs.get(name+'/'+id)};}}}};},
    async list(name:string){return [...docs.entries()].filter(([key])=>key.startsWith(name+'/')).map(([key,data])=>({id:key.split('/')[1],data,updateTime:'version-a'}));},
    async commit(changes:any[]){commitCalls++;assert.ok(changes.some(c=>c.collection==='contentItems'));assert.ok(changes.some(c=>c.collection==='adminAuditLogs'));for(const ch of changes){if(ch.data)docs.set(ch.collection+'/'+ch.id,ch.data);else docs.delete(ch.collection+'/'+ch.id);}}
  };
  auditLogService.importState([]);
  const repo=new DocumentStateRepository([{collection:'contentItems',state:content},{collection:'adminAuditLogs',state:auditLogService}],()=>db,'auditTestMarker');
  await repo.run(()=>{
    content.items=[{id:'item-a',title:'Updated'}];
    auditLogService.log({action:'CONTENT_UPDATED',category:'content',actorUid:'admin',
      actorEmail:'admin@example.test',actorRole:'admin',targetId:'item-a',targetType:'content',
      details:{},status:'success'});
  },true);
  assert.equal(commitCalls,1);
  auditLogService.importState([]);
  await repo.run(()=>assert.equal(auditLogService.getLogs().length,1));
  auditLogService.importState([]);
});
