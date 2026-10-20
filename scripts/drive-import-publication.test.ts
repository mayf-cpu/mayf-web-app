import assert from 'node:assert/strict';
import { test } from 'node:test';
import { importPublicationPolicy } from '../src/lib/ingestion/importPublicationPolicy';

test('first imported visible PDF can publish and hidden PDF stays hidden', () => {
  assert.equal(importPublicationPolicy({}, false, true).status, 'published');
  assert.equal(importPublicationPolicy({}, false, false).visible, false);
});
test('Drive re-import does not restore archived or deleted CMS content', () => {
  const archived = importPublicationPolicy({status:'archived',isDeleted:true,visibilityStatus:'Archived'}, true, true);
  assert.deepEqual(archived,{status:'archived',isDeleted:true,visibilityStatus:'Archived',visible:false});
});
test('Drive re-import preserves admin hidden and draft states', () => {
  assert.equal(importPublicationPolicy({status:'hidden',visible:false},true,true).status,'hidden');
  assert.equal(importPublicationPolicy({status:'draft',visible:false},true,true).status,'draft');
  assert.equal(importPublicationPolicy({status:'published',visible:false},true,true).visible,false);
});
