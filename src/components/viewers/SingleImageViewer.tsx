import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, Download, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { TurnstileModal } from '../ui/TurnstileModal';

interface SingleImageViewerProps {
  imageUrl: string;
  title: string;
  downloadAllowed?: boolean;
  contentId?: string;
  accessType?: 'free' | 'paid';
}

export const SingleImageViewer: React.FC<SingleImageViewerProps> = ({
  imageUrl,
  title,
  downloadAllowed = true,
  contentId = 'cnt-single-image-trig-chart',
  accessType = 'free',
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTurnstileOpen, setIsTurnstileOpen] = useState(false);

  return (
    <div
      className={`bg-white rounded-xl border border-[#E2E8F0] shadow-md overflow-hidden flex flex-col ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-none' : 'w-full'
      }`}
    >
      {/* Header bar */}
      <div className="bg-[#0F172A] text-white px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[#57DFFE]" />
          <span className="font-heading font-semibold">{title}</span>
        </div>

        <div className="flex items-center gap-2">
          {downloadAllowed && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsTurnstileOpen(true)}
              className="text-xs h-7 py-0 px-2.5"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Save Image</span>
            </Button>
          )}

          <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded">
            <button
              onClick={() => setZoomLevel((z) => Math.max(70, z - 15))}
              className="hover:text-[#57DFFE] cursor-pointer"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] px-1">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
              className="hover:text-[#57DFFE] cursor-pointer"
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

      {/* Main Image Frame */}
      <div className="relative bg-[#1E293B] aspect-[16/10] sm:aspect-[16/9] flex items-center justify-center overflow-auto p-4">
        <img
          src={imageUrl}
          alt={title}
          width={1200}
          height={750}
          loading="lazy"
          decoding="async"
          className="max-w-full max-h-full object-contain rounded transition-transform duration-200 shadow-lg"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        />
      </div>

      <div className="bg-[#FAFBFD] border-t border-[#E2E8F0] px-4 py-2 text-[11px] text-[#64748B] flex items-center justify-between">
        <span>High-Resolution Mathematical Reference</span>
        <span>Click zoom controls for deep inspection</span>
      </div>

      {/* Cloudflare Turnstile Secure Download Modal */}
      {isTurnstileOpen && (
        <TurnstileModal
          isOpen={isTurnstileOpen}
          onClose={() => setIsTurnstileOpen(false)}
          contentId={contentId}
          title={title}
          accessType={accessType}
          fallbackFileName="MAYF_Reference_Image.png"
        />
      )}
    </div>
  );
};
