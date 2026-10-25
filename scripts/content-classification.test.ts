import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {CONTENT_GRADES,SUBJECT_TOPICS,toggleContentGrade} from '../src/lib/cms/contentClassification';
import {ContentClassificationFields} from '../src/components/admin/ContentClassificationFields';
import {prepareContentMetadata} from '../src/lib/cms/contentForm';
import {contentCmsManager} from '../src/lib/cms/contentManager';
import {filterCatalogue} from '../src/lib/catalogue/catalogueQuery';
test('multiple grades survive content creation and match each grade independently of subject',()=>{
 const classLevels=toggleContentGrade(['Class 5'],'Class 8');
 const item=contentCmsManager.createItem(prepareContentMetadata({title:'Multi-grade independent subject',slug:'multi-grade-independent-subject',classLevels:classLevels as any,categoryId:'Algebra',subcategoryId:'Polynomials',contentType:'video' as const,visible:true},true),{uid:'operator',email:'operator@example.test',role:'admin'});
 const stored=contentCmsManager.getItem(item.id)!;assert.deepEqual(stored.classLevels,['Class 5','Class 8']);assert.equal(stored.categoryId,'Algebra');assert.equal(stored.subcategoryId,'Polynomials');
 for(const grade of stored.classLevels)assert.equal(filterCatalogue([stored],{classLevel:grade as any,categoryId:'Algebra'},null,20).items.length,1);
 assert.deepEqual(toggleContentGrade(classLevels,'Class 5'),['Class 8']);
});
test('classification form offers all grades as checkboxes and only the chosen subjects topics',()=>{
 const html=renderToStaticMarkup(React.createElement(ContentClassificationFields,{value:{classLevels:['Class 6','Class 9'],categoryId:'Geometry',subcategoryId:'Circles'},onChange:()=>{}}));
 assert.equal((html.match(/type="checkbox"/g)||[]).length,CONTENT_GRADES.length);
 assert.equal((html.match(/checked=""/g)||[]).length,2);
 assert.match(html,/Subject category/);assert.match(html,/Subcategory/);assert.match(html,/>Circles</);assert.doesNotMatch(html,/>Polynomials</);
 for(const category of Object.keys(SUBJECT_TOPICS))assert.ok(html.includes('>'+category+'<'));
});
test('editing legacy category values preserves them instead of silently reclassifying content',()=>{
 const html=renderToStaticMarkup(React.createElement(ContentClassificationFields,{value:{classLevels:['Class 7'],categoryId:'Legacy subject',subcategoryId:'Legacy topic'},onChange:()=>{}}));
 assert.match(html,/selected="">Legacy subject/);assert.match(html,/selected="">Legacy topic/);
});
