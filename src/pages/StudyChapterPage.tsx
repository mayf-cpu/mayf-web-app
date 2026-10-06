import React from 'react';
import { ArrowLeft, BookOpen, Download, Bot, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { Link, useNavigation } from '../context/NavigationContext';
import { INITIAL_CHAPTERS, INITIAL_FORMULAS, INITIAL_SOLVED_PROBLEMS } from '../data/curriculumData';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { FormulaCard } from '../components/ui/FormulaCard';
import { StepProblemCard } from '../components/ui/StepProblemCard';
import { WatermarkGlyph } from '../components/ui/WatermarkGlyph';

export const StudyChapterPage: React.FC = () => {
  const { currentRoute, goBack } = useNavigation();
  const slug = currentRoute.params.slug;

  const chapter = INITIAL_CHAPTERS.find((c) => c.slug === slug) || INITIAL_CHAPTERS[0];

  const relevantFormulas = INITIAL_FORMULAS.filter((f) =>
    f.category === chapter.category || f.applicableClasses.includes(chapter.classLevel)
  );

  const relevantProblems = INITIAL_SOLVED_PROBLEMS.filter(
    (p) => p.chapterSlug === chapter.slug || p.classLevel === chapter.classLevel
  );

  return (
    <SharedLayout>
      <div className="space-y-10">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-3 text-xs text-[#64748B]">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-1.5 font-medium text-[#1D4ED8] hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Syllabus</span>
          </button>

          <div className="flex items-center gap-2">
            <span>{chapter.classLevel}</span>
            <span aria-hidden="true">/</span>
            <span>{chapter.category}</span>
          </div>
        </div>

        {/* Chapter Hero Banner */}
        <div className="relative bg-white rounded-xl border border-[#E2E8F0] p-6 sm:p-8 shadow-[0_4px_14px_-2px_rgba(29,78,216,0.05)] overflow-hidden">
          <WatermarkGlyph glyph="x²" size="xl" className="opacity-40 -top-8 right-2" />

          <div className="max-w-2xl relative z-10 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#1D4ED8] bg-[#EFF6FF] px-2.5 py-1 rounded">
                {chapter.classLevel}
              </span>
              <span className="text-xs font-semibold text-[#00687A] bg-[#ECFEFF] px-2.5 py-1 rounded">
                {chapter.category}
              </span>
              {chapter.isFreePreview ? (
                <Badge variant="free">FREE PREVIEW</Badge>
              ) : (
                <Badge variant="pro">PRO CHAPTER</Badge>
              )}
            </div>

            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-[#0F172A] tracking-tight">
              {chapter.title}
            </h1>

            <p className="text-sm md:text-base text-[#475569] leading-relaxed">
              {chapter.description}
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Link href={`/ai-teacher?topic=${encodeURIComponent(chapter.title)}`}>
                <Button size="md" variant="secondary" className="gap-2">
                  <Bot className="w-4 h-4 text-[#06B6D4]" />
                  <span>Ask AI Tutor about this Chapter</span>
                </Button>
              </Link>

              <Link href="/dashboard/downloads">
                <Button size="md" variant="outline" className="gap-2">
                  <Download className="w-4 h-4 text-[#64748B]" />
                  <span>Download Revision PDF Notes</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Learning Outcomes & Key Theorems */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Learning Outcomes */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-heading font-bold text-[#00687A] uppercase tracking-wider mb-4">
              <CheckCircle2 className="w-4 h-4 text-[#06B6D4]" />
              <span>Target Learning Competencies</span>
            </div>
            <ul className="space-y-3">
              {chapter.learningOutcomes.map((outcome, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#334155]">
                  <span className="w-5 h-5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Key Theorems */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-heading font-bold text-[#00687A] uppercase tracking-wider mb-4">
              <FileText className="w-4 h-4 text-[#06B6D4]" />
              <span>Key Theorems & Axioms</span>
            </div>
            <div className="space-y-3">
              {chapter.keyTheorems.map((theorem, idx) => (
                <div key={idx} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
                  <div className="font-heading font-semibold text-xs sm:text-sm text-[#0F172A]">
                    {theorem}
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">
                    Essential for board examination proof questions.
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Solved Problems Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-heading font-semibold text-[#00687A] uppercase tracking-wider mb-1">
                Worked Solutions
              </div>
              <h2 className="font-heading font-bold text-2xl text-[#0F172A]">
                Step-by-Step Solved Exemplars
              </h2>
            </div>
            <span className="text-xs text-[#64748B] tabular-nums font-medium">
              {relevantProblems.length} available
            </span>
          </div>

          <div className="space-y-6">
            {relevantProblems.map((prob) => (
              <StepProblemCard key={prob.id} problem={prob} defaultExpanded={true} />
            ))}
          </div>
        </section>

        {/* Formulas in this chapter */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-heading font-semibold text-[#00687A] uppercase tracking-wider mb-1">
                Formula Repository
              </div>
              <h2 className="font-heading font-bold text-2xl text-[#0F172A]">
                Formulas Used in this Unit
              </h2>
            </div>
            <Link href="/formula-deck">
              <Button size="sm" variant="outline">
                All Formulas
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relevantFormulas.slice(0, 4).map((f) => (
              <FormulaCard key={f.id} formula={f} />
            ))}
          </div>
        </section>

      </div>
    </SharedLayout>
  );
};
