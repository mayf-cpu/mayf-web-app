import test from 'node:test';
import assert from 'node:assert/strict';
import {addClassification,defaultClassification} from '../src/lib/cms/classificationSettings';
import {toggleContentGrade} from '../src/lib/cms/contentClassification';
import {protectedDrivePlayer} from '../src/lib/media/protectedDriveVideo';
import {publicContent} from '../src/lib/catalogue/catalogueAccess';
import {downloadableCmsPdfFile} from '../src/lib/download/cmsDownloadResolver';
test('custom grades and subject-specific topics persist in configuration without changing existing choices',()=>{
 const defaults=defaultClassification();let next=addClassification(defaults,{kind:'grade',name:'Class 12'});
 next=addClassification(next,{kind:'subcategory',subject:'Algebra',name:'Matrices'});
 assert.ok(next.grades.includes('Class 12'));assert.ok(next.subjects.Algebra.includes('Matrices'));assert.ok(!next.subjects.Geometry.includes('Matrices'));assert.deepEqual(defaults,defaultClassification());
 assert.deepEqual(toggleContentGrade(['Class 12'],'Class 7'),['Class 12','Class 7']);
 assert.deepEqual(addClassification(next,{kind:'grade',name:'class 12'}),next);
 for(const name of ['','<script>','__proto__','a'.repeat(81)])assert.throws(()=>addClassification(next,{kind:'grade',name}));
 assert.throws(()=>addClassification(next,{kind:'subcategory',subject:'Missing',name:'Topic'}));
});
test('old automatically enabled PDF downloads require new explicit owner permission',()=>{
 const item={id:'test',contentType:'pdf',visible:true,status:'published',accessType:'free',downloadAllowed:true,files:[{url:'r2://mayf-study-materials/pdf/test.pdf'}]};
 assert.equal(downloadableCmsPdfFile(item),null);assert.equal(publicContent(item).downloadAllowed,false);
});

