import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, Bookmark, Sparkles, HelpCircle, Bot } from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { Link, useNavigation } from '../context/NavigationContext';
import { INITIAL_FORMULAS } from '../data/curriculumData';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { WatermarkGlyph } from '../components/ui/WatermarkGlyph';
import { useAuth } from '../context/AuthContext';

export const FormulaDetailPage: React.FC = () => {
  const { currentRoute, goBack } = useNavigation();
  const { savedItemIds, toggleSavedItem } = useAuth();
  const [copied, setCopied] = useState(false);

  const slug = currentRoute.params.slug;
  const formula = INITIAL_FORMULAS.find((f) => f.slug === slug) || INITIAL_FORMULAS[0];
  const isSaved = savedItemIds.includes(formula.id);

  const handleCopy = () => {
    navigator.clipboard.writeText(formula.plainTextFormula);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SharedLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-3 text-xs text-[#64748B]">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-1.5 font-medium text-[#1D4ED8] hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Formula Deck</span>
          </button>

          <div className="flex items-center gap-2">
            <span>{formula.category}</span>
            <span aria-hidden="true">/</span>
            <span>{formula.applicableClasses.join(', ')}</span>
          </div>
        </div>

        {/* Formula Showcase Card */}
        <div className="relative bg-white rounded-xl border border-[#E2E8F0] shadow-[0_4px_14px_-2px_rgba(29,78,216,0.05)] overflow-hidden">
          {/* Inner Accent Cyan Border */}
          <div className="absolute top-0 left-0 bottom-0 w-[4px] bg-[#06B6D4]" aria-hidden="true" />
          <WatermarkGlyph glyph={(formula.watermarkGlyph as any) || 'π'} size="xl" className="opacity-30 -top-8 right-0" />

          <div className="p-6 sm:p-8 pl-8 relative z-10 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1D4ED8] bg-[#EFF6FF] px-2.5 py-1 rounded">
                  {formula.category}
                </span>
                {formula.isProOnly ? <Badge variant="pro" /> : <Badge variant="free" />}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleSavedItem(formula.id)}
                  className="gap-1.5"
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-[#FF6B4A] text-[#FF6B4A]' : ''}`} />
                  <span>{isSaved ? 'Saved in Deck' : 'Bookmark'}</span>
                </Button>

                <Button size="sm" variant="secondary" onClick={handleCopy} className="gap-1.5">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </Button>
              </div>
            </div>

            {/* Title */}
            <div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F172A]">
                {formula.title}
              </h1>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                Applicable Standards: {formula.applicableClasses.join(' · ')}
              </p>
            </div>

            {/* Large Mathematical Typesetting Box */}
            <div className="bg-[#F0F9FF] border border-[#BAE6FD] rounded-lg p-6 sm:p-8 text-center my-4">
              <div className="text-xs font-heading font-semibold text-[#0284C7] uppercase tracking-wider mb-2">
                Standard Mathematical Expression
              </div>
              <div className="font-mono tabular-nums text-2xl sm:text-3xl md:text-4xl font-bold text-[#0037B0] tracking-wider py-2 overflow-x-auto">
                {formula.plainTextFormula}
              </div>
            </div>

            {/* Conceptual Explanation */}
            <div className="prose text-sm text-[#334155] leading-relaxed">
              <h3 className="font-heading font-bold text-base text-[#0F172A] mb-2">
                Conceptual Overview
              </h3>
              <p>{formula.explanation}</p>
            </div>

            {/* Mnemonic Memory Tip */}
            {formula.mnemonicHint && (
              <div className="p-4 rounded-lg bg-[#ECFEFF] border border-[#A5F3FC] flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#06B6D4] shrink-0 mt-0.5" />
                <div>
                  <div className="font-heading font-bold text-xs text-[#00687A] uppercase tracking-wider">
                    Memory Mnemonic for Exam Recall
                  </div>
                  <p className="text-xs sm:text-sm text-[#0E7490] mt-0.5">
                    {formula.mnemonicHint}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Variables Specification Table */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-xs">
          <h3 className="font-heading font-bold text-base text-[#0F172A] mb-4">
            Variables & Physical Quantities
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-heading font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Symbol</th>
                  <th className="py-2.5 px-4">Mathematical Meaning</th>
                  <th className="py-2.5 px-4">Standard Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {formula.variables.map((v, idx) => (
                  <tr key={idx} className="hover:bg-[#F8FAFC]/50">
                    <td className="py-3 px-4 font-mono font-bold text-[#0037B0] tabular-nums">
                      {v.symbol}
                    </td>
                    <td className="py-3 px-4 text-[#334155]">{v.meaning}</td>
                    <td className="py-3 px-4 text-[#64748B] font-mono">{v.unit || 'dimensionless / arbitrary'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Worked Exemplar Application */}
        {formula.exampleProblem && (
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-[#0F172A]">
                Worked Exam Application
              </h3>
              <span className="text-xs text-[#1D4ED8] font-semibold">NCERT Exemplar</span>
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] font-medium">
              {formula.exampleProblem.question}
            </div>

            <div className="space-y-2 pt-2">
              <div className="text-xs font-heading font-bold text-[#00687A] uppercase tracking-wider">
                Step-by-Step Derivation & Solution:
              </div>
              <div className="space-y-2 pl-4 border-l-2 border-[#06B6D4]">
                {formula.exampleProblem.stepByStepSolution.map((st, i) => (
                  <div key={i} className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                    <span className="font-bold text-[#0F172A] mr-2">{i + 1}.</span>
                    {st}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-md text-xs sm:text-sm font-mono font-bold text-[#065F46]">
              Result: {formula.exampleProblem.answer}
            </div>
          </div>
        )}

        {/* AI Tutor Shortcut CTA */}
        <div className="p-6 bg-gradient-to-r from-[#EFF6FF] to-[#E0F2FE] border border-[#BFDBFE] rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="font-heading font-bold text-base text-[#1E3A8A] flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#1D4ED8]" />
              <span>Have questions about {formula.title}?</span>
            </div>
            <p className="text-xs text-[#3B82F6]">
              Ask Professor Sigma to explain this formula in simple words or generate a custom practice problem.
            </p>
          </div>

          <Link href={`/ai-teacher?topic=${encodeURIComponent(formula.title)}`}>
            <Button variant="primary" size="md">
              Ask AI Teacher Now
            </Button>
          </Link>
        </div>

      </div>
    </SharedLayout>
  );
};
