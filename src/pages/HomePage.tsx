import React, { useState } from 'react';
import { ArrowRight, Sparkles, BookOpen, Layers, Bot, CheckCircle2, ShieldCheck, Flame } from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { FormulaCard } from '../components/ui/FormulaCard';
import { StepProblemCard } from '../components/ui/StepProblemCard';
import { WatermarkGlyph } from '../components/ui/WatermarkGlyph';
import { Link, useNavigation } from '../context/NavigationContext';
import { INITIAL_FORMULAS, INITIAL_CHAPTERS, INITIAL_SOLVED_PROBLEMS } from '../data/curriculumData';
import { StudentClass } from '../lib/firebase/types';

export const HomePage: React.FC = () => {
  const { navigate } = useNavigation();
  const [selectedClass, setSelectedClass] = useState<StudentClass>('Class 10');

  const classes: StudentClass[] = [
    'Class 5',
    'Class 6',
    'Class 7',
    'Class 8',
    'Class 9',
    'Class 10',
  ];

  const featuredFormulas = INITIAL_FORMULAS.slice(0, 3);
  const sampleProblem = INITIAL_SOLVED_PROBLEMS[0];
  const chaptersForClass = INITIAL_CHAPTERS.filter((c) => c.classLevel === selectedClass || selectedClass === 'Class 10').slice(0, 4);

  return (
    <SharedLayout>
      <div className="space-y-16 md:space-y-24">
        
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-4 pb-8 md:py-12">
          {/* Subtle math watermark decoration */}
          <WatermarkGlyph glyph="∫" size="xl" className="opacity-40 -top-8 right-0" />
          <WatermarkGlyph glyph="π" size="lg" className="opacity-30 top-36 -left-6" />

          <div className="max-w-3xl">
            {/* Academic Kicker (No pill sandwich) */}
            <div className="flex items-center gap-2 text-xs font-heading font-semibold text-[#00687A] mb-3">
              <span className="uppercase tracking-wider">CBSE & ICSE Board Aligned</span>
              <span aria-hidden="true">·</span>
              <span>Classes 5 to 10</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#EA580C] flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>Zero Rote Learning</span>
              </span>
            </div>

            {/* Headline with Plus Jakarta Sans */}
            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl text-[#0F172A] tracking-tight leading-[1.15] mb-4 text-balance">
              Master School Mathematics with Intuition & Absolute Clarity.
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-[#475569] leading-relaxed mb-8 max-w-2xl">
              From foundational fraction arithmetic to Class 10 board exam derivations. Explore interactive formula flashcards, step-by-step problem breakdowns, and 24/7 AI Teacher doubt clearance.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link href="/study-material">
                <Button size="lg" variant="primary" className="w-full sm:w-auto font-bold shadow-md">
                  <span>Explore Class 5–10 Syllabus</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>

              <Link href="/ai-teacher">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto font-semibold">
                  <Bot className="w-4 h-4 mr-1 text-[#06B6D4]" />
                  <span>Ask AI Teacher a Doubt</span>
                </Button>
              </Link>
            </div>

            {/* Adjacent Proof Point */}
            <div className="mt-8 pt-6 border-t border-[#E2E8F0] flex flex-wrap items-center gap-6 text-xs text-[#64748B]">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span>100% NCERT & Exemplar Coverage</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span>Verified Formulas with Proofs</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span>Instant Step-by-Step Hints</span>
              </div>
            </div>
          </div>
        </section>

        {/* GRADE / CLASS SELECTOR STRIP */}
        <section className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-[0_4px_14px_-2px_rgba(29,78,216,0.05)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-heading font-bold text-xl text-[#0F172A]">
                Select Your Standard
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B]">
                Curated chapter maps, formula collections, and board exam tips for each grade.
              </p>
            </div>

            {/* Segmented Class Selector */}
            <div className="flex flex-wrap items-center gap-1.5 bg-[#F1F5F9] p-1.5 rounded-lg">
              {classes.map((cls) => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-3 py-1.5 rounded-md text-xs font-heading font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    selectedClass === cls
                      ? 'bg-white text-[#1D4ED8] shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Chapters Grid for Selected Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {chaptersForClass.map((chap) => (
              <Link
                key={chap.id}
                href={`/study/${chap.slug}`}
                className="group bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] hover:border-[#1D4ED8]/40 rounded-lg p-4 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-2">
                    <span className="font-semibold text-[#00687A]">{chap.category}</span>
                    <span>{chap.formulaCount} Formulas</span>
                  </div>
                  <h3 className="font-heading font-bold text-sm text-[#0F172A] group-hover:text-[#1D4ED8] transition-colors mb-2 line-clamp-2">
                    {chap.title}
                  </h3>
                  <p className="text-xs text-[#64748B] line-clamp-2 mb-3">
                    {chap.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-[#EDF2F7] flex items-center justify-between text-xs font-semibold text-[#1D4ED8]">
                  <span>{chap.isFreePreview ? 'Free Preview' : 'Pro Chapter'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-5 text-center">
            <Link
              href={`/study-material?class=${encodeURIComponent(selectedClass)}`}
              className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-[#1D4ED8] hover:underline"
            >
              <span>View full curriculum for {selectedClass}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        {/* FEATURED FORMULA DECK PREVIEW */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="text-xs font-heading font-semibold text-[#00687A] uppercase tracking-wider mb-1">
                Visual Mathematical Memory
              </div>
              <h2 className="font-heading font-bold text-2xl text-[#0F172A]">
                Authoritative Formula Deck
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B]">
                Every formula verified with variable definitions, units, and mnemonics.
              </p>
            </div>
            <Link href="/formula-deck">
              <Button variant="outline" size="sm">
                <span>Browse All 80+ Formulas</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredFormulas.map((f) => (
              <FormulaCard key={f.id} formula={f} />
            ))}
          </div>
        </section>

        {/* STEP-BY-STEP WORKED EXAMPLE BREAKDOWN */}
        <section className="space-y-4">
          <div className="max-w-xl">
            <div className="text-xs font-heading font-semibold text-[#00687A] uppercase tracking-wider mb-1">
              Pedagogical Method
            </div>
            <h2 className="font-heading font-bold text-2xl text-[#0F172A]">
              Step-by-Step Problem Breakdown
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Never skip algebraic steps. Reveal each stage as you work on paper.
            </p>
          </div>

          <StepProblemCard problem={sampleProblem} defaultExpanded={true} />
        </section>

        {/* AI TEACHER TEASER BANNER */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0037B0] to-[#1D4ED8] rounded-xl p-6 sm:p-8 md:p-10 text-white shadow-lg">
          <WatermarkGlyph glyph="Σ" size="xl" className="opacity-10 text-white right-0 -top-6" />

          <div className="max-w-2xl relative z-10 space-y-4">
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-heading font-semibold text-[#CFFAFE]">
              <Sparkles className="w-3.5 h-3.5 text-[#57DFFE]" />
              <span>Powered by Gemini & Firebase AI Logic</span>
            </div>

            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white">
              Stuck on a Math Problem at 10 PM?
            </h2>

            <p className="text-sm sm:text-base text-[#CAD3FF] leading-relaxed">
              Professor Sigma, your personal AI Math Tutor, doesn't just hand you the answer—he guides your thinking step-by-step, highlights the exact CBSE/ICSE formulas needed, and tests your conceptual understanding.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Link href="/ai-teacher">
                <Button size="lg" variant="accent" className="font-bold">
                  <span>Start Free AI Doubt Session</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/formula-deck">
                <Button size="lg" variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border-white/20">
                  <span>Explore Formula Deck First</span>
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ANNUAL PASS TRUST & PRICING PREVIEW */}
        <section className="bg-white rounded-lg border border-[#E2E8F0] p-6 sm:p-8 text-center max-w-2xl mx-auto shadow-[0_4px_14px_-2px_rgba(29,78,216,0.05)]">
          <Badge variant="pro" size="md" className="mb-3">
            ALL-IN-ONE BOARD PASS
          </Badge>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#0F172A] mb-2">
            Maths at Your Fingertips Annual Pass
          </h2>
          <p className="text-sm text-[#64748B] mb-6">
            Complete syllabus access for Class 5 to 10. Printable revision notes, formula flashcards, and unlimited AI Teacher guidance.
          </p>

          <div className="inline-flex items-baseline gap-1 font-mono tabular-nums text-4xl sm:text-5xl font-extrabold text-[#0037B0] mb-2">
            <span>₹999</span>
            <span className="text-xs font-sans text-[#64748B] font-semibold">/ entire academic year</span>
          </div>

          <div className="text-xs text-[#059669] font-semibold mb-6 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>100% Money-Back Guarantee within 7 days. No questions asked.</span>
          </div>

          <Link href="/annual-pass">
            <Button size="lg" variant="accent" className="w-full sm:w-auto font-bold px-8">
              Unlock All Chapters & Formulas
            </Button>
          </Link>
        </section>

      </div>
    </SharedLayout>
  );
};
