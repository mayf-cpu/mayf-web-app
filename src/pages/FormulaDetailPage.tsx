import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  Bookmark,
  Sparkles,
  Share2,
  ChevronLeft,
  ChevronRight,
  Bot,
  Tag,
  BookOpen,
  HelpCircle,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import katex from 'katex';
import { SharedLayout } from '../components/layout/SharedLayout';
import { Link, useNavigation } from '../context/NavigationContext';
import { FORMULA_DECK_ITEMS } from '../data/formulaDeckData';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { WatermarkGlyph } from '../components/ui/WatermarkGlyph';
import { FormulaDiagram } from '../components/ui/FormulaDiagram';
import { FormulaSeo } from '../components/common/FormulaSeo';
import { ShareButton } from '../components/ui/ShareButton';
import { useAuth } from '../context/AuthContext';
import { logProductEvent } from '../lib/activity/activityService';

export const FormulaDetailPage: React.FC = () => {
  const { currentRoute, navigate, goBack } = useNavigation();
  const { user, savedItemIds, toggleSavedItem } = useAuth();

  const [copiedFormula, setCopiedFormula] = useState(false);

  const slug = currentRoute.params.slug;
  const currentIndex = FORMULA_DECK_ITEMS.findIndex((f) => f.slug === slug);
  const formula = currentIndex !== -1 ? FORMULA_DECK_ITEMS[currentIndex] : FORMULA_DECK_ITEMS[0];

  const prevFormula = currentIndex > 0 ? FORMULA_DECK_ITEMS[currentIndex - 1] : FORMULA_DECK_ITEMS[FORMULA_DECK_ITEMS.length - 1];
  const nextFormula = currentIndex < FORMULA_DECK_ITEMS.length - 1 ? FORMULA_DECK_ITEMS[currentIndex + 1] : FORMULA_DECK_ITEMS[0];

  const isSaved = savedItemIds.includes(formula.id);

  // Render Display LaTeX with KaTeX
  const displayLatexHtml = useMemo(() => {
    if (!formula.latexFormula) return null;
    try {
      return katex.renderToString(formula.latexFormula, {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return null;
    }
  }, [formula.latexFormula]);

  // Log formula_view product event
  useEffect(() => {
    if (formula) {
      logProductEvent({
        userId: user?.uid || 'anonymous-student',
        eventType: 'formula_view',
        title: `Viewed Formula: ${formula.title}`,
        targetId: formula.id,
        targetSlug: formula.slug,
        targetType: 'formula',
        metadata: {
          category: formula.category,
          classLevel: formula.applicableClasses[0],
        },
      });
    }
  }, [formula?.id, user?.uid]);

  const handleToggleBookmark = () => {
    const nextSaved = !isSaved;
    toggleSavedItem(formula.id);
    logProductEvent({
      userId: user?.uid || 'anonymous-student',
      eventType: nextSaved ? 'save' : 'unsave',
      title: `${nextSaved ? 'Saved' : 'Unsaved'} formula: ${formula.title}`,
      targetId: formula.id,
      targetSlug: formula.slug,
      targetType: 'formula',
      metadata: { category: formula.category },
    });
  };

  // Touch handlers for mobile swipe navigation
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 60;

    if (distance > minSwipeDistance) {
      // Swiped Left -> Go to Next formula
      navigate(`/formula/${nextFormula.slug}`);
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Go to Previous formula
      navigate(`/formula/${prevFormula.slug}`);
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Keyboard navigation (Left / Right Arrow)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is focused on an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'ArrowRight') {
        navigate(`/formula/${nextFormula.slug}`);
      } else if (e.key === 'ArrowLeft') {
        navigate(`/formula/${prevFormula.slug}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextFormula.slug, prevFormula.slug, navigate]);

  // Copy Formula Expression
  const handleCopyFormula = () => {
    navigator.clipboard.writeText(formula.plainTextFormula);
    setCopiedFormula(true);
    setTimeout(() => setCopiedFormula(false), 2000);
  };

  // Related formulas resolution
  const relatedFormulas = useMemo(() => {
    if (!formula.relatedFormulaSlugs || formula.relatedFormulaSlugs.length === 0) {
      return FORMULA_DECK_ITEMS.filter((f) => f.category === formula.category && f.id !== formula.id).slice(0, 3);
    }
    return FORMULA_DECK_ITEMS.filter((f) => formula.relatedFormulaSlugs?.includes(f.slug) || formula.relatedFormulaSlugs?.includes(f.id));
  }, [formula]);

  return (
    <SharedLayout>
      {/* Injects dynamic SEO Title, Meta Description, OpenGraph, Canonical, and JSON-LD schema */}
      <FormulaSeo formula={formula} />

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="space-y-8 max-w-4xl mx-auto"
      >
        
        {/* Navigation Breadcrumb Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <Link
            href="/formula-deck"
            className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to Formula Deck</span>
          </Link>

          <div className="flex items-center gap-2 text-slate-600">
            <span className="font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
              {formula.category}
            </span>
            <span aria-hidden="true">·</span>
            <span>{formula.applicableClasses.join(', ')}</span>
          </div>
        </div>

        {/* Previous / Next Quick Jump Ribbon */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-2 sm:p-3 shadow-2xs text-xs">
          <Link
            href={`/formula/${prevFormula.slug}`}
            className="inline-flex items-center gap-2 font-medium text-slate-700 hover:text-blue-700 transition-colors py-1 px-2 rounded-lg hover:bg-slate-50 group"
          >
            <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:-translate-x-0.5" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Previous</span>
              <span className="font-semibold truncate max-w-[140px] sm:max-w-[220px] block">
                {prevFormula.title}
              </span>
            </div>
          </Link>

          <span className="text-slate-300 hidden md:inline">|</span>

          <Link
            href={`/formula/${nextFormula.slug}`}
            className="inline-flex items-center gap-2 font-medium text-slate-700 hover:text-blue-700 transition-colors py-1 px-2 rounded-lg hover:bg-slate-50 text-right group"
          >
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Next</span>
              <span className="font-semibold truncate max-w-[140px] sm:max-w-[220px] block">
                {nextFormula.title}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Formula Document Hero Showcase Card */}
        <div className="relative bg-white rounded-2xl border border-slate-200/90 shadow-md overflow-hidden">
          {/* Inner Accent Cyan Border */}
          <div className="absolute top-0 left-0 bottom-0 w-[5px] bg-[#06B6D4]" aria-hidden="true" />
          <WatermarkGlyph glyph={(formula.watermarkGlyph as any) || 'π'} size="xl" className="opacity-25 -top-10 right-2" />

          <div className="p-6 sm:p-8 pl-8 relative z-10 space-y-6">
            
            {/* Top metadata & Action bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-md border border-blue-200">
                  {formula.category}
                </span>
                {formula.isProOnly ? <Badge variant="pro" /> : <Badge variant="free" />}
                <span className="text-xs text-slate-500 font-mono">
                  {window?.location?.pathname || `/formula/${formula.slug}`}
                </span>
              </div>

              {/* Action buttons: Bookmark, Copy, Share */}
              <div className="flex items-center gap-2">
                {/* Bookmark / Favourite */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleToggleBookmark}
                  className={`gap-1.5 cursor-pointer ${isSaved ? 'border-amber-300 bg-amber-50 text-amber-900' : ''}`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-500 text-amber-500' : ''}`} />
                  <span>{isSaved ? 'Saved in Deck' : 'Bookmark'}</span>
                </Button>

                {/* Copy Formula text */}
                <Button size="sm" variant="secondary" onClick={handleCopyFormula} className="gap-1.5 cursor-pointer">
                  {copiedFormula ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFormula ? 'Copied!' : 'Copy Formula'}</span>
                </Button>

                {/* Reusable Share Component */}
                <ShareButton
                  canonicalUrl={`https://mayf.co.in/formula/${formula.slug}`}
                  title={`${formula.title} (${formula.plainTextFormula})`}
                  description={formula.explanation}
                  buttonText="Share"
                  buttonSize="sm"
                />
              </div>
            </div>

            {/* Document Title & Target Class levels */}
            <div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-slate-900 tracking-tight">
                {formula.title}
              </h1>
              <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm text-slate-600">
                <span className="font-semibold text-slate-900">Class Levels:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {formula.applicableClasses.map((cls) => (
                    <span key={cls} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium text-xs">
                      {cls}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Mathematical Typesetting Box with KaTeX */}
            <div className="bg-gradient-to-b from-sky-50 to-blue-50/70 border-2 border-sky-200/90 rounded-xl p-6 sm:p-8 text-center my-4 relative shadow-inner">
              <div className="text-[11px] font-heading font-bold text-sky-800 uppercase tracking-widest mb-3">
                Standard Mathematical Expression
              </div>

              {displayLatexHtml ? (
                <div
                  className="text-blue-900 text-2xl sm:text-3xl md:text-4xl font-medium tracking-wide py-2 overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: displayLatexHtml }}
                />
              ) : (
                <div className="font-mono tabular-nums text-2xl sm:text-3xl md:text-4xl font-bold text-blue-900 tracking-wider py-2 overflow-x-auto">
                  {formula.plainTextFormula}
                </div>
              )}

              <div className="text-[11px] text-slate-500 font-mono mt-3">
                ASCII/Plaintext: {formula.plainTextFormula}
              </div>
            </div>

            {/* Plain-Language Explanation */}
            <div className="space-y-2">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Plain-Language Conceptual Overview
              </h3>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                {formula.explanation}
              </p>
            </div>

            {/* Visual Diagram / Illustration Component */}
            {formula.diagramType && (
              <div className="space-y-2 pt-2">
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Visual Diagram & Illustration
                </h3>
                <FormulaDiagram
                  type={formula.diagramType}
                  caption={formula.diagramCaption}
                />
              </div>
            )}

            {/* Mnemonic Memory Tip */}
            {formula.mnemonicHint && (
              <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-heading font-bold text-xs text-cyan-900 uppercase tracking-wider">
                    Memory Mnemonic for Exam Recall
                  </div>
                  <p className="text-xs sm:text-sm text-cyan-800 mt-0.5 leading-relaxed">
                    {formula.mnemonicHint}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Variables Specification Table */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-base text-slate-900">
              Variables & Physical Quantities
            </h3>
            <span className="text-xs text-slate-500">
              {formula.variables.length} defined parameters
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-heading font-semibold">
                <tr>
                  <th className="py-3 px-4">Symbol</th>
                  <th className="py-3 px-4">Mathematical Meaning</th>
                  <th className="py-3 px-4">Standard Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formula.variables.map((v, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-800 tabular-nums">
                      {v.symbol}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{v.meaning}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                      {v.unit || 'dimensionless / arbitrary'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Introductory Example */}
        {formula.example && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 className="font-heading font-bold text-base text-slate-900">
              Introductory Numerical Example
            </h3>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
              {formula.example}
            </div>
          </div>
        )}

        {/* Full Worked Exam Application (Exemplar) */}
        {formula.exampleProblem && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Worked Exam Application</span>
              </h3>
              <span className="text-xs text-blue-700 font-bold bg-blue-50 px-2.5 py-1 rounded">
                NCERT Exemplar
              </span>
            </div>

            {/* Problem Question Statement */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-900 font-medium leading-relaxed">
              {formula.exampleProblem.question}
            </div>

            {/* Step-by-Step Derivation & Solution */}
            <div className="space-y-3 pt-1">
              <div className="text-xs font-heading font-bold text-teal-800 uppercase tracking-wider">
                Step-by-Step Mathematical Derivation:
              </div>
              <div className="space-y-2.5 pl-4 border-l-2 border-cyan-500">
                {formula.exampleProblem.stepByStepSolution.map((step, i) => (
                  <div key={i} className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <span className="font-bold text-slate-900 mr-2">{i + 1}.</span>
                    {step}
                  </div>
                ))}
              </div>
            </div>

            {/* Final Answer */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs sm:text-sm font-mono font-bold text-emerald-900">
              Final Answer: {formula.exampleProblem.answer}
            </div>

            {/* Verification / Alternative Method where useful */}
            {formula.exampleProblem.alternativeMethod && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block">Verification / Alternative Method:</span>
                <p>{formula.exampleProblem.alternativeMethod}</p>
              </div>
            )}
          </div>
        )}

        {/* Tags Section */}
        {formula.tags && formula.tags.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-heading font-bold text-slate-700 uppercase">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Curriculum Indexing Tags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {formula.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  className="bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Formulas Grid */}
        {relatedFormulas.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Related Mathematical Formulas
              </h3>
              <Link href="/formula-deck" className="text-xs text-blue-700 font-semibold hover:underline">
                View All in Deck →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedFormulas.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/formula/${rel.slug}`}
                  className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-bold text-teal-700">{rel.category}</span>
                      <span>{rel.applicableClasses.join(', ')}</span>
                    </div>
                    <h4 className="font-heading font-bold text-sm text-slate-900 group-hover:text-blue-700 transition-colors">
                      {rel.title}
                    </h4>
                    <p className="font-mono text-xs text-blue-800 bg-sky-50 rounded px-2 py-1 my-2 truncate">
                      {rel.plainTextFormula}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-700 group-hover:underline inline-flex items-center gap-1 mt-2">
                    <span>Study this formula</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* AI Teacher Assistant CTA */}
        <div className="p-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-md">
          <div className="space-y-1 max-w-xl">
            <div className="font-heading font-bold text-base text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-cyan-300" />
              <span>Need help applying {formula.title}?</span>
            </div>
            <p className="text-xs text-blue-100/90 leading-relaxed">
              Ask our dedicated AI Teacher Professor Sigma to walk you through customized practice problems, verify your steps, or upload a photo of your textbook question.
            </p>
          </div>

          <Link href={`/ai-teacher?topic=${encodeURIComponent(formula.title)}`}>
            <Button variant="primary" size="md" className="shrink-0 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold border-none shadow-sm">
              Ask AI Teacher Now
            </Button>
          </Link>
        </div>

      </div>
    </SharedLayout>
  );
};
