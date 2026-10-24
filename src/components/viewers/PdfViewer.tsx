import React, { useState, useEffect, useCallback } from 'react';
import { Download, Maximize2, Minimize2, ZoomIn, ZoomOut, Printer, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { TurnstileModal } from '../ui/TurnstileModal';
import { savePdfBlob } from '../../lib/download/downloadClient';

interface PdfViewerProps {
  pdfUrl: string;
  title: string;
  fileName?: string;
  downloadAllowed?: boolean;
  contentId?: string;
  accessType?: 'free' | 'paid';
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  pdfUrl,
  title,
  fileName = 'MAYF_Document.pdf',
  downloadAllowed = true,
  contentId,
  accessType = 'free',
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isTurnstileOpen, setIsTurnstileOpen] = useState(false);
  const [preview, setPreview] = useState<{ source: string; url: string; blob: Blob } | null>(null);
  const [previewRequested, setPreviewRequested] = useState(false);
  const privatePdf = pdfUrl.startsWith('r2://');
  const displayUrl = preview?.source === pdfUrl ? preview.url : privatePdf ? '' : pdfUrl;
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);
  const showAuthorizedPdf = useCallback((pdf: Blob) => {
    setPreview({ source: pdfUrl, url: URL.createObjectURL(pdf), blob: pdf });
  }, [pdfUrl]);

  const handleDownload = () => {
    if (preview?.source === pdfUrl) { savePdfBlob(preview.blob, fileName); return; }
    setPreviewRequested(false);
    setIsTurnstileOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className={`bg-white rounded-xl border border-[#E2E8F0] shadow-md overflow-hidden transition-all duration-300 flex flex-col ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-none' : 'w-full h-[650px] sm:h-[750px]'
      }`}
    >
      {/* Top PDF Toolbar */}
      <div className="bg-[#0F172A] text-white px-4 py-2.5 flex items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center gap-2 truncate">
          <FileText className="w-4 h-4 text-[#57DFFE] shrink-0" />
          <span className="font-heading font-semibold truncate max-w-xs sm:max-w-md">{title}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 bg-white/10 px-2 py-1 rounded">
            <button
              onClick={() => setZoomLevel((z) => Math.max(60, z - 15))}
              className="hover:text-[#57DFFE] cursor-pointer"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono tabular-nums px-1.5 text-[11px]">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(160, z + 15))}
              className="hover:text-[#57DFFE] cursor-pointer"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handlePrint}
            disabled={!displayUrl}
            className="p-1.5 rounded hover:bg-white/10 text-white cursor-pointer transition-colors"
            title="Print Document"
            aria-label="Print Document"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          {downloadAllowed && (
            <Button size="sm" variant="secondary" onClick={handleDownload} className="text-xs h-7 py-0 px-2.5">
              <Download className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Save PDF</span>
            </Button>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded hover:bg-white/10 text-white cursor-pointer transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* PDF Viewport Frame */}
      <div className="flex-1 bg-[#475569]/10 overflow-auto flex items-center justify-center p-2 sm:p-4">
        <div
          className="w-full h-full bg-white shadow-lg transition-transform duration-200 rounded"
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
        >
          {displayUrl ? <iframe
            src={`${displayUrl}#toolbar=0&navpanes=0`}
            title={title}
            className="w-full h-full rounded border-0"
          /> : <div className="h-full flex flex-col items-center justify-center p-6 text-center gap-4">
            <FileText className="w-10 h-10 text-blue-600" />
            <p className="text-sm text-slate-700">{privatePdf && downloadAllowed ? 'Complete a security check to open this PDF.' : 'A PDF preview is not available yet.'}</p>
            {privatePdf && downloadAllowed && contentId && <Button onClick={() => { setPreviewRequested(true); setIsTurnstileOpen(true); }}>Open secure PDF</Button>}
          </div>}
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-[#FAFBFD] border-t border-[#E2E8F0] px-4 py-2 text-[11px] text-[#64748B] flex items-center justify-between">
        <span>PDF document</span>
        <span>Scroll to read all pages</span>
      </div>

      {/* Cloudflare Turnstile Secure Download Modal */}
      {isTurnstileOpen && (
        <TurnstileModal
          isOpen={isTurnstileOpen}
          onClose={() => setIsTurnstileOpen(false)}
          contentId={contentId || fileName.replace(/\.[^/.]+$/, '')}
          title={title}
          accessType={accessType}
          fallbackFileName={fileName}
          onPdfReady={previewRequested ? showAuthorizedPdf : undefined}
        />
      )}
    </div>
  );
};
