import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {youtubeVideo} from '../src/lib/media/youtube';
import {YouTubeEmbedViewer} from '../src/components/viewers/YouTubeEmbedViewer';
const id='M7lc1UVf-VE';
test('watch, share, Shorts, mobile, live and existing embed links select the same real video',()=>{
 for(const url of [`https://www.youtube.com/watch?v=${id}&feature=share`,`https://youtu.be/${id}?si=sharing`,`https://youtube.com/shorts/${id}`,`https://m.youtube.com/watch?v=${id}`,`https://www.youtube.com/live/${id}`,`https://www.youtube.com/embed/${id}`,`https://www.youtube-nocookie.com/embed/${id}`,`www.youtube.com/watch?v=${id}`,id]){
  const video=youtubeVideo(url)!;assert.equal(video.id,id);assert.match(video.embedUrl,new RegExp('^https://www.youtube-nocookie.com/embed/'+id));assert.doesNotMatch(video.embedUrl,/autoplay|feature|sharing/);
 }
});
test('start/end times survive normalization and autoplay is only requested explicitly',()=>{
 const video=youtubeVideo(`https://youtu.be/${id}?t=1m30s&end=120&autoplay=1&origin=https://attacker.test`)!;
 const url=new URL(video.embedUrl);assert.equal(url.searchParams.get('start'),'90');assert.equal(url.searchParams.get('end'),'120');assert.equal(url.searchParams.get('autoplay'),null);assert.equal(url.searchParams.get('origin'),null);
 assert.equal(new URL(youtubeVideo(`https://youtube.com/watch?v=${id}`,true)!.embedUrl).searchParams.get('autoplay'),'1');
});
test('untrusted hosts, credentials, invalid ids and non-video links cannot become iframe sources',()=>{
 for(const value of ['',`https://youtube.com.attacker.test/watch?v=${id}`,`https://youtube.com@attacker.test/watch?v=${id}`,`javascript:alert(1)`,`https://youtube.com:444/embed/${id}`,`https://youtube.com/channel/${id}`,'https://youtu.be/too-short','<iframe src="https://youtube.com/embed/'+id+'"></iframe>'])assert.equal(youtubeVideo(value),null);
});
test('viewer starts with a playable facade and no iframe; missing content never shows an unrelated default video',()=>{
 const html=renderToStaticMarkup(React.createElement(YouTubeEmbedViewer,{embedUrl:`https://youtu.be/${id}`,title:'Real lesson'}));
 assert.match(html,/Play YouTube Video/);assert.doesNotMatch(html,/<iframe/);assert.match(html,/Watch on YouTube/);
 const missing=renderToStaticMarkup(React.createElement(YouTubeEmbedViewer,{embedUrl:'',title:'Missing lesson'}));assert.match(missing,/valid YouTube video link/);assert.doesNotMatch(missing,/iframe|ZBalWWHY9kE/);
});
