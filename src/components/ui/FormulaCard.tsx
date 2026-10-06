import React, { useState } from 'react';
import { Bookmark, Check, Copy, ArrowRight } from 'lucide-react';
import { FormulaItem } from '../../lib/firebase/types';
import { Badge } from './Badge';
import { WatermarkGlyph } from './WatermarkGlyph';
import { Link } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';

export interface FormulaCardProps {
  formula: FormulaItem;
  showDetailsLink?: boolean;
}

export const FormulaCard: React.FC<FormulaCardProps> = ({
  formula,
  showDetailsLink = true,
}) => {
  const { savedItemIds, toggleSavedItem } = useAuth();
  const [copied, setCopied] = useState(false);
  const isSaved = savedItemIds.includes(formula.id);

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

  return (
    <div className="relative group bg-white rounded-lg border border-[#E2E8F0] shadow-[0_4px_14px_-2px_rgba(29,78,216,0.05)] hover:shadow-[0_8px_20px_-2px_rgba(29,78,216,0.1)] transition-all duration-200 overflow-hidden flex flex-col justify-between">
      {/* Authoritative Inner Left Accent Border (3px solid #06B6D4 Bright Cyan) */}
      <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-[#06B6D4]" aria-hidden="true" />

      {/* Ambient Math Watermark Glyph Anchored Top-Right */}
      <WatermarkGlyph
        glyph={(formula.watermarkGlyph as any) || 'π'}
        className="group-hover:text-[#1D4ED8]/[0.08] transition-colors"
      />

      <div className="p-5 pl-6 relative z-10">
        {/* Top bar with category and action pills */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <span className="font-semibold text-[#00687A]">{formula.category}</span>
            <span aria-hidden="true">·</span>
            <span>{formula.applicableClasses.join(', ')}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {formula.isProOnly ? <Badge variant="pro" /> : <Badge variant="free" />}

            <button
              onClick={handleBookmark}
              aria-label={isSaved ? 'Remove from saved formulas' : 'Save formula'}
              className={`p-1.5 rounded-md transition-colors ${
                isSaved
                  ? 'text-[#FF6B4A] bg-[#FFF1EE]'
                  : 'text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9]'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Formula Title */}
        <h3 className="font-heading font-bold text-base text-[#0F172A] mb-3 group-hover:text-[#1D4ED8] transition-colors">
          {formula.title}
        </h3>

        {/* Mathematical Typesetting centered in soft blue-tinted container (#F0F9FF) */}
        <div className="bg-[#F0F9FF] border border-[#E0F2FE] rounded-md p-3.5 my-3 flex items-center justify-between gap-3 group-hover:border-[#BAE6FD] transition-colors">
          <div className="font-mono tabular-nums text-[#0037B0] font-semibold text-base md:text-lg tracking-wide overflow-x-auto py-1">
            {formula.plainTextFormula}
          </div>

          <button
            onClick={handleCopy}
            title="Copy formula text"
            className="p-1.5 rounded text-[#0284C7] hover:bg-white transition-colors shrink-0"
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
        <p className="text-xs text-[#475569] line-clamp-2 leading-relaxed mb-1">
          {formula.explanation}
        </p>

        {formula.mnemonicHint && (
          <div className="mt-2 text-[11px] text-[#00687A] bg-[#ECFEFF]/60 rounded px-2 py-1 flex items-center gap-1">
            <span className="font-semibold shrink-0">Memory tip:</span>
            <span className="truncate">{formula.mnemonicHint}</span>
          </div>
        )}
      </div>

      {showDetailsLink && (
        <div className="border-t border-[#F1F5F9] px-6 py-2.5 bg-[#FAFBFD] flex items-center justify-between text-xs font-semibold text-[#1D4ED8]">
          <Link
            href={`/formula/${formula.slug}`}
            className="inline-flex items-center gap-1.5 hover:underline group-hover:translate-x-0.5 transition-transform"
          >
            <span>Step-by-step derivation & practice</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};
