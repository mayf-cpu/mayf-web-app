import test from 'node:test';
import assert from 'node:assert/strict';
import {isRealHomepageContent} from '../src/lib/catalogue/homepageContent';
import {SEED_CONTENT_ITEMS} from '../src/lib/catalogue/seedContent';
test('untouched starter records are excluded without hiding owner-edited or newly published resources',()=>{
 const seed=SEED_CONTENT_ITEMS[0];
 assert.equal(isRealHomepageContent({...seed}),false);
 assert.equal(isRealHomepageContent({...seed,title:'Owner lesson'}),true);
 assert.equal(isRealHomepageContent({...seed,description:'Owner revised explanation'}),true);
 assert.equal(isRealHomepageContent({...seed,id:'owner-upload-123'}),true);
});
