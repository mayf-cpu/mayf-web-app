import React, { useState, useEffect } from 'react';
import { Play, ExternalLink } from 'lucide-react';
import { youtubeVideo } from '../../lib/media/youtube';

interface YouTubeEmbedViewerProps {
  embedUrl: string;
  title: string;
  thumbnail?: string;
}

export const YouTubeEmbedViewer: React.FC<YouTubeEmbedViewerProps> = ({
  embedUrl,
  title,
  thumbnail,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const video = youtubeVideo(embedUrl, true);
  const fallbackThumbnail = video ? `https://img.youtube.com/vi/${video.id}/hqdefault.jpg` : '';
  useEffect(() => { setIsPlaying(false); }, [embedUrl]);

  if (!video) return <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700" role="status">A valid YouTube video link has not been added to this resource yet.</div>;


  return (
    <div className="min-w-0"><div
      className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#0F172A] border border-[#E2E8F0] shadow-md group"
    >
      {!isPlaying ? (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Lazy loaded thumbnail facade */}
          <img
            src={thumbnail || fallbackThumbnail}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {/* Contrast scrim for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Video Title Overlay */}
          <div className="absolute top-4 left-4 right-4 z-10 text-white">
            <span className="text-[11px] font-heading font-bold text-[#57DFFE] uppercase tracking-wider block mb-1">
              YouTube Video Breakdown
            </span>
            <h3 className="font-heading font-bold text-sm sm:text-base line-clamp-2 text-shadow-sm">
              {title}
            </h3>
          </div>

          {/* Interactive Play Button (Facade: zero network iframe overhead until click) */}
          <button
            onClick={() => setIsPlaying(true)}
            className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white flex items-center justify-center shadow-lg transition-all duration-200 transform group-hover:scale-110 active:scale-95 cursor-pointer ring-4 ring-white/20"
            aria-label="Play YouTube Video"
          >
            <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white ml-1" />
          </button>

          {/* Zero-Tracking & Performance Indicator */}
          <div className="absolute bottom-3 right-4 z-10 text-[10px] text-white/75 bg-black/50 backdrop-blur-xs px-2 py-1 rounded">
            Click to play
          </div>
        </div>
      ) : (
        <iframe
          src={video.embedUrl}
          referrerPolicy="strict-origin-when-cross-origin"
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0"
        />
      )}
    </div><a href={video.watchUrl} target="_self" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline">Watch on YouTube <ExternalLink className="h-3.5 w-3.5" /></a></div>
  );
};
