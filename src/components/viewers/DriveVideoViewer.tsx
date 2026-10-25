import React,{useState,useEffect} from 'react';
import {driveVideo} from '../../lib/media/driveVideo';
export function DriveVideoViewer({url,title}:{url:string;title:string}){
 const video=driveVideo(url);const [active,setActive]=useState(false);
 useEffect(()=>setActive(false),[url]);
 if(!video)return <p role="status">Add a valid Google Drive video link or file ID.</p>;
 return <div className="space-y-3"><div className="aspect-video min-h-[200px] overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
 {active?<iframe src={video.previewUrl} title={title} allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" className="h-full w-full border-0"/>:<button type="button" onClick={()=>setActive(true)} className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-white"><span className="text-lg font-semibold">Play video</span><span className="text-sm">{title}</span></button>}
 </div><p className="text-xs text-slate-500">If Drive shows a processing or access message, <a href={video.viewUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 underline">open this video in Google Drive</a>. The file owner controls its sharing permissions.</p></div>;
}
