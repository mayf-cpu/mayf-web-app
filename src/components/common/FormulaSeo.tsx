import React, { useEffect } from 'react';
import { FormulaItem } from '../../lib/firebase/types';

interface FormulaSeoProps {
  formula: FormulaItem;
}

export const FormulaSeo: React.FC<FormulaSeoProps> = ({ formula }) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const baseTitle = `${formula.title} – Formula, Variables & Examples | MAYF`;
    const seoTitle = formula.seo?.title || baseTitle;
    const baseDescription = `Master ${formula.title} (${formula.plainTextFormula}). Detailed variable meanings, geometric diagrams, solved NCERT exemplars for ${formula.applicableClasses.join(', ')}.`;
    const seoDesc = formula.seo?.description || baseDescription;
    const currentUrl = window.location.origin + window.location.pathname;

    // Update document title
    document.title = seoTitle;

    // Helper to update or create meta tags
    const setMetaTag = (attrName: string, attrVal: string, content: string) => {
      let meta = document.querySelector(`meta[${attrName}="${attrVal}"]`) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attrName, attrVal);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    setMetaTag('name', 'description', seoDesc);
    setMetaTag('property', 'og:title', seoTitle);
    setMetaTag('property', 'og:description', seoDesc);
    setMetaTag('property', 'og:type', 'article');
    setMetaTag('property', 'og:url', currentUrl);
    setMetaTag('property', 'og:site_name', 'Maths at Your Fingertips');
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', seoTitle);
    setMetaTag('name', 'twitter:description', seoDesc);

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = currentUrl;

    // JSON-LD Structured Data
    const scriptId = 'formula-jsonld';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      name: formula.title,
      description: formula.explanation,
      learningResourceType: 'Mathematical Formula',
      educationalLevel: formula.applicableClasses,
      about: {
        '@type': 'DefinedTerm',
        name: formula.title,
        termCode: formula.slug,
        description: formula.plainTextFormula,
        inDefinedTermSet: `Maths at Your Fingertips - ${formula.category}`,
      },
      teaches: formula.title,
      publisher: {
        '@type': 'Organization',
        name: 'Maths at Your Fingertips',
        url: window.location.origin,
      },
      keywords: formula.tags?.join(', ') || formula.category,
      url: currentUrl,
    };

    scriptTag.textContent = JSON.stringify(structuredData);

    // BreadcrumbList JSON-LD
    const breadcrumbScriptId = 'formula-breadcrumbs-jsonld';
    let breadcrumbScript = document.getElementById(breadcrumbScriptId) as HTMLScriptElement | null;
    if (!breadcrumbScript) {
      breadcrumbScript = document.createElement('script');
      breadcrumbScript.id = breadcrumbScriptId;
      breadcrumbScript.type = 'application/ld+json';
      document.head.appendChild(breadcrumbScript);
    }

    const breadcrumbsData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: window.location.origin,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Formula Deck',
          item: `${window.location.origin}/formula-deck`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: formula.category,
          item: `${window.location.origin}/formula-deck?category=${encodeURIComponent(formula.category)}`,
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: formula.title,
          item: currentUrl,
        },
      ],
    };

    breadcrumbScript.textContent = JSON.stringify(breadcrumbsData);

    return () => {
      // Revert title on unmount
      document.title = 'Maths at Your Fingertips | Class 5–10 CBSE & ICSE Math';
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
      const existingBc = document.getElementById(breadcrumbScriptId);
      if (existingBc) {
        existingBc.remove();
      }
    };
  }, [formula]);

  return null;
};
