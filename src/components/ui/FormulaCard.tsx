import React, { useState, useMemo } from 'react';
import { Bookmark, Check, Copy, ArrowRight, ArrowUpRight, Tag, BookOpen } from 'lucide-react';
import katex from 'katex';
import { FormulaItem } from '../../lib/firebase/types';
import { Badge } from './Badge';
import { WatermarkGlyph } from './WatermarkGlyph';
import { Link, useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';

export interface FormulaCardProps {
  formula: FormulaItem;
  showDetailsLink?: boolean;
  openInNewTab?: boolean;
}

export const FormulaCard: React.FC<FormulaCardProps> = ({
  formula,
  showDetailsLink = true,
  openInNewTab = false,
}) => {
  const { savedItemIds, toggleSavedItem } = useAuth();
  const { navigate } = useNavigation();
  const [copied, setCopied] = useState(false);
  const isSaved = savedItemIds.includes(formula.id);
  const targetUrl = `/formula/${formula.slug}`;

  const renderedLatex = useMemo(() => {
    if (!formula.latexFormula) return null;
    try {
      return katex.renderToString(formula.latexFormula, {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return null;
    }
  }, [formula.latexFormula]);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(formula.plainTextFormula);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSavedItem(formula.id);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Navigate unless clicking interactive sub-buttons
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    if (openInNewTab) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } else {
      navigate(targetUrl);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative group bg-white rounded-xl border border-slate-200/90 shadow-[0_4px_14px_-2px_rgba(29,78,216,0.04)] hover:shadow-[0_10px_24px_-4px_rgba(29,78,216,0.12)] hover:border-blue-300 transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer"
    >
      {/* Authoritative Inner Left Accent Border */}
      <div className="absolute top-0 left-0 bottom-0 w-[4px] bg-[#06B6D4] group-hover:bg-[#1D4ED8] transition-colors" aria-hidden="true" />

      {/* Ambient Math Watermark Glyph */}
      <WatermarkGlyph
        glyph={(formula.watermarkGlyph as any) || 'π'}
        className="group-hover:text-[#1D4ED8]/[0.08] transition-colors"
      />

      <div className="p-5 pl-6 relative z-10">
        {/* Top bar with category and action pills */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500">
            <span className="font-bold text-[#00687A] bg-[#ECFEFF] px-2 py-0.5 rounded text-[11px]">
              {formula.category}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-[11px] font-medium text-slate-600">
              {formula.applicableClasses.join(', ')}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {formula.isProOnly ? <Badge variant="pro" /> : <Badge variant="free" />}

            <button
              onClick={handleBookmark}
              title={isSaved ? 'Remove from favorites' : 'Add to favorites'}
              aria-label={isSaved ? 'Remove from favorites' : 'Add to favorites'}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                isSaved
                  ? 'text-[#FF6B4A] bg-[#FFF1EE]'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Formula Title */}
        <h3 className="font-heading font-bold text-base text-slate-900 mb-2 group-hover:text-blue-700 transition-colors leading-snug">
          <Link
            href={targetUrl}
            openInNewTab={openInNewTab}
            className="hover:underline focus:outline-hidden"
          >
            {formula.title}
          </Link>
        </h3>

        {/* Mathematical Typesetting centered in soft blue-tinted container */}
        <div className="bg-[#F0F9FF] border border-[#BAE6FD]/70 rounded-lg p-3 my-3 flex items-center justify-between gap-3 group-hover:border-blue-300 transition-colors">
          <div className="overflow-x-auto py-1 max-w-[calc(100%-2.5rem)] scrollbar-none">
            {renderedLatex ? (
              <div
                className="text-blue-900 font-medium text-sm sm:text-base whitespace-nowrap"
                dangerouslySetInnerHTML={{ __html: renderedLatex }}
              />
            ) : (
              <div className="font-mono tabular-nums text-blue-900 font-bold text-sm sm:text-base tracking-wide whitespace-nowrap">
                {formula.plainTextFormula}
              </div>
            )}
          </div>

          <button
            onClick={handleCopy}
            title="Copy formula expression"
            className="p-1.5 rounded-md text-sky-700 hover:bg-white hover:shadow-2xs transition-all shrink-0 cursor-pointer"
            aria-label="Copy formula"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Concise Concept Note */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
          {formula.explanation}
        </p>

        {/* Variables & Worked Example Indicator */}
        <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 mb-2">
          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
            {formula.variables?.length || 0} variables
          </span>
          {formula.exampleProblem && (
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              Worked exemplar
            </span>
          )}
        </div>

        {/* Mnemonic Hint if present */}
        {formula.mnemonicHint && (
          <div className="mt-2 text-[11px] text-teal-800 bg-teal-50/80 border border-teal-100 rounded-md px-2.5 py-1 flex items-center gap-1.5">
            <span className="font-bold shrink-0">Memory tip:</span>
            <span className="truncate">{formula.mnemonicHint}</span>
          </div>
        )}
      </div>

      {showDetailsLink && (
        <div className="border-t border-slate-100 px-6 py-2.5 bg-slate-50/70 flex items-center justify-between text-xs font-semibold text-blue-700 group-hover:bg-blue-50/40 transition-colors">
          <span className="inline-flex items-center gap-1.5 group-hover:translate-x-0.5 transition-transform">
            <span>{openInNewTab ? 'Explore in new tab' : 'Explore formula document & derivation'}</span>
            {openInNewTab ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-blue-600">
            /formula/{formula.slug}
          </span>
        </div>
      )}
    </div>
  );
};
