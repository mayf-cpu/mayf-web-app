import React, { useEffect } from 'react';

export interface BreadcrumbItem {
  name: string;
  item: string; // Relative path or absolute URL
}

export interface SeoMetadataProps {
  title: string;
  description: string;
  canonicalUrl?: string; // If omitted, defaults to canonical clean URL
  ogType?: 'website' | 'article' | 'video.other';
  ogImage?: string;
  noindex?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export const SeoHead: React.FC<SeoMetadataProps> = ({
  title,
  description,
  canonicalUrl,
  ogType = 'website',
  ogImage = 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&auto=format&fit=crop&q=80',
  noindex = false,
  breadcrumbs,
  structuredData,
}) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const origin = window.location.origin;

    // 1. Resolve full clean branded title (avoid duplicating brand name)
    const formattedTitle =
      title.includes('Maths at Your Fingertips') || title.includes('MAYF')
        ? title
        : `${title} | Maths at Your Fingertips`;
    document.title = formattedTitle;

    // 2. Canonical URL Resolution (Strict normalization, strip ephemeral query params)
    let fullCanonical = canonicalUrl;
    if (!fullCanonical) {
      fullCanonical = `${origin}${window.location.pathname}`;
    } else if (!fullCanonical.startsWith('http')) {
      fullCanonical = `${origin}${fullCanonical.startsWith('/') ? fullCanonical : `/${fullCanonical}`}`;
    }

    // Helper to safely set or update <meta> tags
    const setMetaTag = (attrName: string, attrVal: string, content: string) => {
      let meta = document.querySelector(`meta[${attrName}="${attrVal}"]`) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attrName, attrVal);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // 3. Meta Description
    setMetaTag('name', 'description', description);

    // 4. Robots Directives (Strict indexing control)
    if (noindex) {
      setMetaTag('name', 'robots', 'noindex, nofollow');
      setMetaTag('name', 'googlebot', 'noindex, nofollow');
    } else {
      setMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
      setMetaTag('name', 'googlebot', 'index, follow');
    }

    // 5. Canonical Link Tag
    let canonicalTag = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', fullCanonical);

    // 6. OpenGraph Metadata
    setMetaTag('property', 'og:title', formattedTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', fullCanonical);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:site_name', 'Maths at Your Fingertips');
    setMetaTag('property', 'og:locale', 'en_IN');

    // 7. Twitter / X Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', formattedTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', ogImage);
    setMetaTag('name', 'twitter:site', '@MAYF_Math');

    // 8. BreadcrumbList Schema.org JSON-LD
    const breadcrumbScriptId = 'mayf-schema-breadcrumbs';
    let breadcrumbScript = document.getElementById(breadcrumbScriptId) as HTMLScriptElement | null;
    if (breadcrumbs && breadcrumbs.length > 0) {
      if (!breadcrumbScript) {
        breadcrumbScript = document.createElement('script');
        breadcrumbScript.id = breadcrumbScriptId;
        breadcrumbScript.type = 'application/ld+json';
        document.head.appendChild(breadcrumbScript);
      }

      const breadcrumbData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: crumb.name,
          item: crumb.item.startsWith('http')
            ? crumb.item
            : `${origin}${crumb.item.startsWith('/') ? crumb.item : `/${crumb.item}`}`,
        })),
      };

      breadcrumbScript.textContent = JSON.stringify(breadcrumbData);
    } else if (breadcrumbScript) {
      breadcrumbScript.remove();
    }

    // 9. Custom Structured Data Schema.org JSON-LD
    const mainScriptId = 'mayf-schema-structured-data';
    let mainScript = document.getElementById(mainScriptId) as HTMLScriptElement | null;
    if (structuredData) {
      if (!mainScript) {
        mainScript = document.createElement('script');
        mainScript.id = mainScriptId;
        mainScript.type = 'application/ld+json';
        document.head.appendChild(mainScript);
      }
      mainScript.textContent = JSON.stringify(structuredData);
    } else if (mainScript) {
      mainScript.remove();
    }

    return () => {
      // Cleanup on unmount or navigation
      const bc = document.getElementById(breadcrumbScriptId);
      if (bc) bc.remove();
      const ms = document.getElementById(mainScriptId);
      if (ms) ms.remove();
    };
  }, [title, description, canonicalUrl, ogType, ogImage, noindex, breadcrumbs, structuredData]);

  return null;
};
