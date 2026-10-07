import React, { Suspense, lazy } from 'react';
import { ContentItem } from '../../lib/firebase/types';
import { LoadingSpinner } from '../ui/LoadingState';

// Lazy-load all heavy viewers
const PdfViewer = lazy(() => import('./PdfViewer').then((m) => ({ default: m.PdfViewer })));
const MultiImageViewer = lazy(() => import('./MultiImageViewer').then((m) => ({ default: m.MultiImageViewer })));
const SingleImageViewer = lazy(() => import('./SingleImageViewer').then((m) => ({ default: m.SingleImageViewer })));
const VideoViewer = lazy(() => import('./VideoViewer').then((m) => ({ default: m.VideoViewer })));
const YouTubeEmbedViewer = lazy(() => import('./YouTubeEmbedViewer').then((m) => ({ default: m.YouTubeEmbedViewer })));
const FacebookEmbedViewer = lazy(() => import('./FacebookEmbedViewer').then((m) => ({ default: m.FacebookEmbedViewer })));
const TestPaperViewer = lazy(() => import('./TestPaperViewer').then((m) => ({ default: m.TestPaperViewer })));
const CourseViewer = lazy(() => import('./CourseViewer').then((m) => ({ default: m.CourseViewer })));

interface ViewerContainerProps {
  item: ContentItem;
}

export const ViewerContainer: React.FC<ViewerContainerProps> = ({ item }) => {
  const primaryFile = item.files?.[0];

  return (
    <Suspense fallback={<LoadingSpinner message="Preparing responsive mathematics viewer..." />}>
      {(() => {
        switch (item.contentType) {
          case 'pdf':
          case 'worksheet':
            return (
              <PdfViewer
                pdfUrl={primaryFile?.url || 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf'}
                title={item.title}
                fileName={`${item.slug}.pdf`}
                downloadAllowed={item.downloadAllowed}
                contentId={item.id}
                accessType={item.accessType}
              />
            );

          case 'multiImage':
            return (
              <MultiImageViewer
                files={item.files || []}
                title={item.title}
              />
            );

          case 'singleImage':
            return (
              <SingleImageViewer
                imageUrl={primaryFile?.url || item.thumbnail || ''}
                title={item.title}
                downloadAllowed={item.downloadAllowed}
                contentId={item.id}
                accessType={item.accessType}
              />
            );

          case 'youtube':
            return (
              <YouTubeEmbedViewer
                embedUrl={item.embedUrl || 'https://www.youtube.com/embed/ZBalWWHY9kE'}
                title={item.title}
                thumbnail={item.thumbnail}
              />
            );

          case 'facebook':
          case 'reel':
            return (
              <FacebookEmbedViewer
                embedUrl={item.embedUrl || ''}
                title={item.title}
                thumbnail={item.thumbnail}
              />
            );

          case 'video':
            return (
              <VideoViewer
                videoUrl={item.embedUrl || primaryFile?.url || ''}
                title={item.title}
                thumbnail={item.thumbnail}
              />
            );

          case 'testPaper':
            return (
              <TestPaperViewer
                title={item.title}
                classLevel={item.classLevels.join(', ')}
                downloadUrl={primaryFile?.url}
                contentId={item.id}
                accessType={item.accessType}
              />
            );

          case 'course':
          default:
            return (
              <CourseViewer
                title={item.title}
                description={item.description}
                classLevel={item.classLevels.join(', ')}
              />
            );
        }
      })()}
    </Suspense>
  );
};
