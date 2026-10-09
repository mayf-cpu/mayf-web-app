import React, { useState } from 'react';

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  aspectRatio?: string; // e.g., '16/9', '4/3', '1/1'
  priority?: boolean; // When true, sets loading="eager" & fetchPriority="high" for LCP
  webpSrc?: string;
  avifSrc?: string;
  sizes?: string;
  fallbackIcon?: React.ReactNode;
  containerClassName?: string;
}

/**
 * Next/Image equivalent high-performance image component for Vite & React.
 * Guarantees zero Cumulative Layout Shift (CLS), lazy-loads non-critical images,
 * supports modern WebP/AVIF formats, and accelerates Largest Contentful Paint (LCP).
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  aspectRatio = '16/9',
  priority = false,
  webpSrc,
  avifSrc,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  fallbackIcon,
  className = '',
  containerClassName = '',
  style,
  ...rest
}) => {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // If both width and height are provided as numbers, calculate aspect ratio
  const computedAspectRatio =
    width && height && typeof width === 'number' && typeof height === 'number'
      ? `${width} / ${height}`
      : aspectRatio;

  return (
    <div
      className={`relative overflow-hidden bg-slate-100 ${containerClassName}`}
      style={{
        aspectRatio: computedAspectRatio,
        ...style,
      }}
    >
      {!hasError ? (
        <picture>
          {avifSrc && <source srcSet={avifSrc} type="image/avif" sizes={sizes} />}
          {webpSrc && <source srcSet={webpSrc} type="image/webp" sizes={sizes} />}
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            onLoad={() => setLoaded(true)}
            onError={() => setHasError(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              loaded ? 'opacity-100' : 'opacity-0'
            } ${className}`}
            {...rest}
          />
        </picture>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-4 text-center">
          {fallbackIcon || (
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs">
              MAYF
            </div>
          )}
          <span className="text-[11px] text-slate-400 mt-1.5 font-medium line-clamp-1">{alt}</span>
        </div>
      )}

      {/* Low-cost placeholder skeleton during image decode */}
      {!loaded && !hasError && (
        <div
          className="absolute inset-0 bg-slate-200/60 animate-pulse pointer-events-none"
          aria-hidden="true"
        />
      )}
    </div>
  );
};
