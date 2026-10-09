import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, ZoomIn, ZoomOut, Image as ImageIcon } from 'lucide-react';
import { ContentFileAttachment } from '../../lib/firebase/types';
import { Button } from '../ui/Button';

interface MultiImageViewerProps {
  files: ContentFileAttachment[];
  title: string;
}

export const MultiImageViewer: React.FC<MultiImageViewerProps> = ({ files, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!files || files.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-[#E2E8F0] text-xs text-[#64748B]">
        No slide images attached to this guide.
      </div>
    );
  }

  const currentFile = files[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < files.length - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : files.length - 1));
  };

  return (
    <div
      className={`bg-white rounded-xl border border-[#E2E8F0] shadow-md overflow-hidden flex flex-col ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-none' : 'w-full'
      }`}
    >
      {/* Top Slide Navigation Toolbar */}
      <div className="bg-[#0F172A] text-white px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[#57DFFE]" />
          <span className="font-heading font-semibold">{title}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono tabular-nums text-white/80">
            Slide {currentIndex + 1} of {files.length}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoomLevel((z) => Math.max(80, z - 20))}
              className="p-1 hover:text-[#57DFFE] cursor-pointer"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px]">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(180, z + 20))}
              className="p-1 hover:text-[#57DFFE] cursor-pointer"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 hover:text-[#57DFFE] cursor-pointer"
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Slide Viewer Canvas */}
      <div className="relative bg-[#1E293B] aspect-[16/10] sm:aspect-[16/9] flex items-center justify-center overflow-hidden">
        <div
          className="transition-transform duration-200 w-full h-full flex items-center justify-center p-4"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          <img
            src={currentFile.url}
            alt={`${title} - Step ${currentIndex + 1}`}
            width={1200}
            height={750}
            loading="lazy"
            decoding="async"
            className="max-w-full max-h-full object-contain rounded shadow-lg"
          />
        </div>

        {/* Previous / Next Arrow Overlays */}
        <button
          onClick={handlePrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-[#1D4ED8] text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-[#1D4ED8] text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Slide Thumbnails Rail */}
      <div className="p-3 bg-[#FAFBFD] border-t border-[#E2E8F0] flex items-center gap-2 overflow-x-auto">
        {files.map((file, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-16 h-12 rounded border-2 overflow-hidden shrink-0 transition-all cursor-pointer ${
              currentIndex === idx
                ? 'border-[#1D4ED8] ring-2 ring-[#1D4ED8]/30 scale-105'
                : 'border-[#CBD5E1] opacity-70 hover:opacity-100'
            }`}
          >
            <img
              src={file.url}
              alt={`Thumb ${idx + 1}`}
              width={64}
              height={48}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};
