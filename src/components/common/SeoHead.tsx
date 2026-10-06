import React, { useEffect } from 'react';

export interface SeoMetadataProps {
  title: string;
  description: string;
  canonicalUrl: string;
  ogType?: 'website' | 'article' | 'video.other';
  ogImage?: string;
  structuredData?: Record<string, unknown>;
}

export const SeoHead: React.FC<SeoMetadataProps> = ({
  title,
  description,
  canonicalUrl,
  ogType = 'website',
  ogImage = 'https://mayf.co.in/assets/og_image.png',
  structuredData,
}) => {
  useEffect(() => {
    // 1. Page Title
    document.title = `${title} | Maths at Your Fingertips`;

    // 2. Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // 3. Canonical Tag
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', canonicalUrl);

    // 4. OpenGraph Tags
    const setOgMeta = (property: string, content: string) => {
      let og = document.querySelector(`meta[property="${property}"]`);
      if (!og) {
        og = document.createElement('meta');
        og.setAttribute('property', property);
        document.head.appendChild(og);
      }
      og.setAttribute('content', content);
    };

    setOgMeta('og:title', `${title} | Maths at Your Fingertips`);
    setOgMeta('og:description', description);
    setOgMeta('og:url', canonicalUrl);
    setOgMeta('og:type', ogType);
    setOgMeta('og:image', ogImage);

    // 5. Schema.org JSON-LD Structured Data
    if (structuredData) {
      const scriptId = 'mayf-schema-structured-data';
      let jsonLd = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!jsonLd) {
        jsonLd = document.createElement('script');
        jsonLd.id = scriptId;
        jsonLd.type = 'application/ld+json';
        document.head.appendChild(jsonLd);
      }
      jsonLd.textContent = JSON.stringify(structuredData);
    }
  }, [title, description, canonicalUrl, ogType, ogImage, structuredData]);

  return null;
};
