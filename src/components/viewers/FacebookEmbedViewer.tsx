import React, { useState, useRef, useEffect } from 'react';
import { Play, Share2 } from 'lucide-react';

interface FacebookEmbedViewerProps {
  embedUrl: string;
  title: string;
  thumbnail?: string;
}

export const FacebookEmbedViewer: React.FC<FacebookEmbedViewerProps> = ({
  embedUrl,
  title,
  thumbnail,
}) => {
  const [isActivated, setIsActivated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const defaultThumbnail =
    thumbnail || 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=800&auto=format&fit=crop&q=80';

  return (
    <div
      ref={containerRef}
      className="relative max-w-md mx-auto aspect-[9/16] sm:aspect-[4/5] rounded-xl overflow-hidden bg-[#0F172A] border border-[#E2E8F0] shadow-md group"
    >
      {!isActivated ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={defaultThumbnail}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          <div className="absolute top-4 left-4 right-4 z-10 text-white">
            <span className="text-[11px] font-heading font-bold text-[#57DFFE] uppercase tracking-wider block mb-1">
              Micro Reel / Facebook Video
            </span>
            <h3 className="font-heading font-bold text-sm line-clamp-2">{title}</h3>
          </div>

          {/* Play Facade Button */}
          <button
            onClick={() => setIsActivated(true)}
            className="relative z-10 w-16 h-16 rounded-full bg-[#1877F2] hover:bg-[#166FE5] text-white flex items-center justify-center shadow-lg transition-transform transform group-hover:scale-110 active:scale-95 cursor-pointer ring-4 ring-white/20"
            aria-label="Load Facebook Video"
          >
            <Play className="w-8 h-8 fill-white ml-1" />
          </button>

          <div className="absolute bottom-3 text-center w-full z-10 text-[10px] text-white/80">
            Click to load social player (Privacy preserved)
          </div>
        </div>
      ) : (
        <iframe
          src={embedUrl}
          title={title}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0"
        />
      )}
    </div>
  );
};
