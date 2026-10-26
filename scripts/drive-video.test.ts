import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {driveVideo,contentDriveVideo} from '../src/lib/media/driveVideo';
import {publicContent} from '../src/lib/catalogue/catalogueAccess';
import {DriveVideoViewer} from '../src/components/viewers/DriveVideoViewer';
import {copyDriveFileToProductionStorage} from '../src/lib/ingestion/driveStorageAdapter';
const id='1_example-drive-video-id';
test('Drive IDs and supported file links become players without accepting arbitrary iframe hosts',()=>{
 for(const source of [id,`https://drive.google.com/file/d/${id}/view`,`https://drive.google.com/open?id=${id}`,`https://drive.google.com/file/d/${id}/preview`])assert.equal(driveVideo(source)?.previewUrl,`https://drive.google.com/file/d/${id}/preview`);
 assert.match(driveVideo(`https://drive.google.com/file/d/${id}/view?resourcekey=key_123`)!.previewUrl,/resourcekey=key_123/);
 for(const source of ['javascript:alert(1)',`https://drive.google.com.attacker.test/file/d/${id}/view`,`https://user@drive.google.com/file/d/${id}/view`])assert.equal(driveVideo(source),null);
 assert.equal(contentDriveVideo({contentType:'pdf',sourceDriveId:id}),null);
 assert.equal(contentDriveVideo({contentType:'video',sourceDriveId:id,embedUrl:'https://cdn.example.test/movie.mp4'}),null);
});
test('Facebook-labelled Drive videos use Drive and paid projections still hide playback sources',()=>{
 const item={id:'video-test',contentType:'facebook',sourceDriveId:id,accessType:'paid',files:[]};
 assert.equal(contentDriveVideo(item)?.id,id);
 const locked=publicContent(item);assert.equal(locked.embedUrl,'');assert.equal(locked.sourceDriveId,undefined);
 const unlocked=publicContent(item,true);assert.equal(unlocked.embedUrl,'');assert.equal(unlocked.protectedDriveVideo,true);assert.equal(unlocked.sourceDriveId,undefined);
 assert.equal(publicContent({...item,accessType:'free'}).embedUrl,'');
});
test('Drive video facade is landscape, waits for Play, and includes access/processing guidance',()=>{
 const html=renderToStaticMarkup(React.createElement(DriveVideoViewer,{contentId:id,title:'Landscape lesson'}));
 assert.match(html,/aspect-video/);assert.match(html,/Play video/);assert.doesNotMatch(html,/href=|drive.google.com/);assert.doesNotMatch(html,/<iframe/);
});
