import React, { useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  BookOpen,
  Layers,
  Bot,
  CheckCircle2,
  ShieldCheck,
  Flame,
  Search,
  Gift,
  Crown,
  Sigma,
  Video,
  CreditCard,
  Share2,
  Clock,
  TrendingUp,
  Download,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  PlayCircle,
  FolderTree,
} from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { FormulaCard } from '../components/ui/FormulaCard';
import { StepProblemCard } from '../components/ui/StepProblemCard';
import { WatermarkGlyph } from '../components/ui/WatermarkGlyph';
import { Link, useNavigation } from '../context/NavigationContext';
import { INITIAL_FORMULAS, INITIAL_CHAPTERS, INITIAL_SOLVED_PROBLEMS } from '../data/curriculumData';
import { StudentClass } from '../lib/firebase/types';
import { PromotionalBanner } from '../components/ui/PromotionalBanner';
import { ShareButton } from '../components/ui/ShareButton';
import { SeoHead } from '../components/common/SeoHead';
import { AdSensePlacement } from '../components/adsense/AdSensePlacement';
import { useHomepageLayout } from '../lib/layout/useHomepageLayout';
import {
  HomepageBlock,
  HeroBlockConfig,
  GlobalSearchBlockConfig,
  TrendingBlockConfig,
  LatestBlockConfig,
  PopularBlockConfig,
  ClassCategoriesBlockConfig,
  FreeMaterialBlockConfig,
  PremiumMaterialBlockConfig,
  FormulaDeckCtaBlockConfig,
  AiTeacherCtaBlockConfig,
  CoursesBlockConfig,
  AnnualPassCtaBlockConfig,
  SocialJoinBlockConfig,
  AdSenseBlockConfig,
  CustomAnnouncementBlockConfig,
} from '../lib/layout/homepageLayoutTypes';

export const HomePage: React.FC = () => {
  const { navigate } = useNavigation();
  const { blocks, loading } = useHomepageLayout();
  const [selectedClass, setSelectedClass] = useState<StudentClass>('Class 10');
  const [searchQuery, setSearchQuery] = useState('');

  const featuredFormulas = INITIAL_FORMULAS.slice(0, 3);
  const sampleProblem = INITIAL_SOLVED_PROBLEMS[0];
  const chaptersForClass = INITIAL_CHAPTERS.filter(
    (c) => c.classLevel === selectedClass || selectedClass === 'Class 10'
  ).slice(0, 4);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/study-material?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/study-material');
    }
  };

  // -------------------------------------------------------------
  // Predefined Performant Block Renderers (15 Strict Canonical Blocks)
  // -------------------------------------------------------------

  // 1. Custom Announcement Block
  const renderCustomAnnouncement = (block: HomepageBlock<CustomAnnouncementBlockConfig>) => {
    const config = block.config || {};
    if (config.enabled === false) return null;

    const variantStyles = {
      info: 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]',
      warning: 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]',
      promo: 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]',
      exam: 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]',
    };
    const style = variantStyles[config.variant] || variantStyles.info;

    return (
      <div
        key={block.id}
        className={`border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-xs ${style}`}
      >
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-white/60 text-current mt-0.5 shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs uppercase font-heading font-bold tracking-wider opacity-80 mb-0.5">
              {config.variant === 'exam' ? 'Exam Alert' : 'Curriculum Notice'}
            </div>
            <h3 className="font-heading font-bold text-sm sm:text-base leading-snug">
              {config.title || 'Announcement'}
            </h3>
            {config.message && (
              <p className="text-xs sm:text-sm opacity-90 mt-1 leading-relaxed">
                {config.message}
              </p>
            )}
          </div>
        </div>

        {config.linkUrl && (
          <Link
            href={config.linkUrl}
            className="inline-flex items-center gap-1.5 text-xs font-heading font-bold px-3 py-1.5 rounded-lg bg-white text-slate-800 shadow-xs hover:bg-slate-50 transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <span>{config.linkText || 'Learn More'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    );
  };

  // 2. Hero Block
  const renderHero = (block: HomepageBlock<HeroBlockConfig>) => {
    const config = block.config || {};
    return (
      <section key={block.id} className="relative overflow-hidden pt-4 pb-8 md:py-12">
        {config.showWatermark !== false && (
          <>
            <WatermarkGlyph glyph="∫" size="xl" className="opacity-40 -top-8 right-0" />
            <WatermarkGlyph glyph="π" size="lg" className="opacity-30 top-36 -left-6" />
          </>
        )}

        <div className="max-w-3xl">
          {/* Academic Kicker */}
          <div className="flex items-center gap-2 text-xs font-heading font-semibold text-[#00687A] mb-3">
            <span className="uppercase tracking-wider">
              {config.kickerText || 'CBSE & ICSE Board Aligned · Classes 5 to 10'}
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl text-[#0F172A] tracking-tight leading-[1.15] mb-4 text-balance">
            {config.headline || 'Master School Mathematics with Intuition & Absolute Clarity.'}
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg text-[#475569] leading-relaxed mb-8 max-w-2xl">
            {config.subheadline ||
              'From foundational fraction arithmetic to Class 10 board exam derivations. Explore interactive formula flashcards, step-by-step problem breakdowns, and 24/7 AI Teacher doubt clearance.'}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link href={config.primaryButtonLink || '/study-material'}>
              <Button size="lg" variant="primary" className="w-full sm:w-auto font-bold shadow-md">
                <span>{config.primaryButtonText || 'Explore Class 5–10 Syllabus'}</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>

            <Link href={config.secondaryButtonLink || '/ai-teacher'}>
              <Button size="lg" variant="secondary" className="w-full sm:w-auto font-semibold">
                <Bot className="w-4 h-4 mr-1 text-[#06B6D4]" />
                <span>{config.secondaryButtonText || 'Ask AI Teacher a Doubt'}</span>
              </Button>
            </Link>

            <ShareButton
              canonicalUrl="https://mayf.co.in"
              title="Maths at Your Fingertips | School Mathematics (Classes 5 to 10)"
              description="Master school mathematics with visual intuition, formula flashcards, step derivations, and AI teacher support."
              buttonText="Share Platform"
              buttonSize="md"
            />
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
    );
  };

  // 3. Global Search Block
  const renderGlobalSearch = (block: HomepageBlock<GlobalSearchBlockConfig>) => {
    const config = block.config || {};
    const quickTags = config.quickTags || [
      'Real Numbers',
      'Quadratic Equations',
      'Trigonometry',
      'Circles',
      'Pythagoras',
    ];

    return (
      <section
        key={block.id}
        className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)]"
      >
        <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto space-y-3">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 absolute left-3.5 text-[#94A3B8] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                config.placeholder ||
                'Search theorems, formulas, chapters (e.g. "Quadratic", "Pythagoras", "BPT")...'
              }
              className="w-full pl-11 pr-28 py-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 sm:right-2 px-3.5 sm:px-4 py-2 min-h-[38px] bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-heading font-bold rounded-md transition-colors cursor-pointer flex items-center justify-center"
            >
              Search
            </button>
          </div>

          {config.showQuickPills !== false && quickTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#64748B]">
              <span className="font-semibold text-[#0F172A]">Popular searches:</span>
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => navigate(`/study-material?q=${encodeURIComponent(tag)}`)}
                  className="px-3 py-1.5 min-h-[34px] bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] rounded-md text-xs font-medium transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </form>
      </section>
    );
  };

  // 4. Class Categories Block
  const renderClassCategories = (block: HomepageBlock<ClassCategoriesBlockConfig>) => {
    const config = block.config || {};
    const availableClasses: StudentClass[] = (config.availableClasses as StudentClass[]) || [
      'Class 5',
      'Class 6',
      'Class 7',
      'Class 8',
      'Class 9',
      'Class 10',
    ];

    return (
      <section
        key={block.id}
        className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-[0_4px_14px_-2px_rgba(29,78,216,0.05)]"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-heading font-bold text-xl text-[#0F172A]">
              {config.title || 'Select Your Standard'}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              {config.subtitle ||
                'Curated chapter maps, formula collections, and board exam tips for each grade.'}
            </p>
          </div>

          {/* Segmented Class Selector */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#F1F5F9] p-1.5 rounded-lg">
            {availableClasses.map((cls) => (
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
                <p className="text-xs text-[#64748B] line-clamp-2 mb-3">{chap.description}</p>
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
            className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-[#1D4ED8] hover:underline cursor-pointer"
          >
            <span>View full curriculum for {selectedClass}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    );
  };

  // 5. Trending Block
  const renderTrending = (block: HomepageBlock<TrendingBlockConfig>) => {
    const config = block.config || {};
    const maxItems = config.maxItems || 4;
    const trendingList = INITIAL_CHAPTERS.slice(0, maxItems);

    return (
      <section key={block.id} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#EA580C] uppercase tracking-wider mb-1">
              <Flame className="w-4 h-4 fill-current" />
              <span>High Engagement Topics</span>
            </div>
            <h2 className="font-heading font-bold text-2xl text-[#0F172A]">
              {config.title || 'Trending Revision Topics'}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              {config.subtitle || 'Most active proofs and problem sets this week across board batches.'}
            </p>
          </div>
          <Link href="/study-material" className="self-start sm:self-auto">
            <Button variant="outline" size="sm" className="min-h-[36px]">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trendingList.map((item, idx) => (
            <Link
              key={item.id}
              href={`/study/${item.slug}`}
              className="bg-white border border-[#E2E8F0] hover:border-[#EA580C]/50 rounded-lg p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-2">
                  <span className="font-mono font-bold text-[#EA580C]">#{idx + 1} Trending</span>
                  <span>{item.classLevel}</span>
                </div>
                <h3 className="font-heading font-bold text-sm text-[#0F172A] mb-1.5 line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-[#64748B] line-clamp-2 mb-3">{item.description}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] text-xs font-semibold text-[#EA580C]">
                <span>Explore Topic</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    );
  };

  // 6. Free Material Block
  const renderFreeMaterial = (block: HomepageBlock<FreeMaterialBlockConfig>) => {
    const config = block.config || {};
    const maxItems = config.maxItems || 4;
    const freeChapters = INITIAL_CHAPTERS.filter((c) => c.isFreePreview).slice(0, maxItems);

    return (
      <section
        key={block.id}
        className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#10B981] uppercase tracking-wider mb-1">
              <Gift className="w-4 h-4" />
              <span>100% Free Access</span>
            </div>
            <h2 className="font-heading font-bold text-2xl text-[#0F172A]">
              {config.title || 'Free Study Materials & Revision Guides'}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              {config.subtitle || 'Accessible 100% free without sign-in or payment.'}
            </p>
          </div>
          <Link href="/study-material" className="self-start sm:self-auto">
            <Button variant="outline" size="sm" className="bg-white min-h-[36px]">
              <span>View Free Library</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {freeChapters.map((item) => (
            <Link
              key={item.id}
              href={`/study/${item.slug}`}
              className="bg-white border border-[#CBD5E1] hover:border-[#10B981] rounded-lg p-4 transition-all shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                    FREE
                  </span>
                  <span className="text-[#64748B]">{item.classLevel}</span>
                </div>
                <h3 className="font-heading font-bold text-sm text-[#0F172A] mb-1 line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-[#64748B] line-clamp-2 mb-3">{item.description}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] text-xs font-semibold text-emerald-700">
                <span className="flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" />
                  <span>Free Download</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    );
  };

  // 7. Formula Deck CTA Block
  const renderFormulaDeckCta = (block: HomepageBlock<FormulaDeckCtaBlockConfig>) => {
    const config = block.config || {};
    const sampleCount = config.sampleCount || 3;
    const displayFormulas = INITIAL_FORMULAS.slice(0, sampleCount);

    return (
      <section key={block.id} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="text-xs font-heading font-semibold text-[#00687A] uppercase tracking-wider mb-1">
              Visual Mathematical Memory
            </div>
            <h2 className="font-heading font-bold text-2xl text-[#0F172A]">
              {config.title || 'Authoritative Formula Deck'}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              {config.subtitle ||
                'Every formula verified with variable definitions, units, and mnemonics.'}
            </p>
          </div>
          <Link href="/formula-deck">
            <Button variant="outline" size="sm">
              <span>{config.viewAllText || 'Browse All 80+ Formulas'}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayFormulas.map((f) => (
            <FormulaCard key={f.id} formula={f} />
          ))}
        </div>
      </section>
    );
  };

  // 8. AI Teacher CTA Block
  const renderAiTeacherCta = (block: HomepageBlock<AiTeacherCtaBlockConfig>) => {
    const config = block.config || {};

    return (
      <section
        key={block.id}
        className="relative overflow-hidden bg-gradient-to-br from-[#0037B0] to-[#1D4ED8] rounded-xl p-6 sm:p-8 md:p-10 text-white shadow-lg"
      >
        <WatermarkGlyph glyph="Σ" size="xl" className="opacity-10 text-white right-0 -top-6" />

        <div className="max-w-2xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-heading font-semibold text-[#CFFAFE]">
            <Sparkles className="w-3.5 h-3.5 text-[#57DFFE]" />
            <span>{config.badgeText || 'Powered by Gemini & Firebase AI Logic'}</span>
          </div>

          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white">
            {config.headline || 'Stuck on a Math Problem at 10 PM?'}
          </h2>

          <p className="text-sm sm:text-base text-[#CAD3FF] leading-relaxed">
            {config.subheadline ||
              "Professor Sigma, your personal AI Math Tutor, doesn't just hand you the answer—he guides your thinking step-by-step, highlights the exact CBSE/ICSE formulas needed, and tests your conceptual understanding."}
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link href="/ai-teacher">
              <Button size="lg" variant="accent" className="font-bold">
                <span>{config.primaryButtonText || 'Start Free AI Doubt Session'}</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
            <Link href="/formula-deck">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white/10 text-white hover:bg-white/20 border-white/20"
              >
                <span>{config.secondaryButtonText || 'Explore Formula Deck First'}</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  };

  // 9. Popular Block
  const renderPopular = (block: HomepageBlock<PopularBlockConfig>) => {
    const config = block.config || {};
    const maxItems = config.maxItems || 4;
    const popularChapters = INITIAL_CHAPTERS.slice(1, maxItems + 1);

    return (
      <section key={block.id} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#1D4ED8] uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Community Favorites</span>
            </div>
            <h2 className="font-heading font-bold text-2xl text-[#0F172A]">
              {config.title || 'Most Popular Revision Handouts'}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              {config.subtitle ||
                'Highest rated study guides, formula cheatsheets, and question banks.'}
            </p>
          </div>
          <Link href="/study-material" className="self-start sm:self-auto">
            <Button variant="outline" size="sm" className="min-h-[36px]">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularChapters.map((chap, idx) => (
            <Link
              key={chap.id}
              href={`/study/${chap.slug}`}
              className="bg-white border border-[#E2E8F0] hover:border-[#1D4ED8] rounded-lg p-4 transition-all shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-2">
                  <span className="font-bold text-[#1D4ED8]">{chap.classLevel}</span>
                  <span>{1200 + idx * 340} students saved</span>
                </div>
                <h3 className="font-heading font-bold text-sm text-[#0F172A] mb-1 line-clamp-1">
                  {chap.title}
                </h3>
                <p className="text-xs text-[#64748B] line-clamp-2 mb-3">{chap.description}</p>
              </div>
              <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs font-semibold text-[#1D4ED8]">
                <span>Open Handout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    );
  };

  // 10. Courses Block
  const renderCourses = (block: HomepageBlock<CoursesBlockConfig>) => {
    const config = block.config || {};
    const courses = [
      {
        id: 'course-1',
        title: 'Class 10 Trigonometry Complete Visual Proofs',
        desc: 'Derive identities with right-triangle geometry. Never memorize blindly.',
        lessons: '12 Master Video Lessons',
        badge: 'Board High-Yield',
      },
      {
        id: 'course-2',
        title: 'Class 9 Real Numbers & Euclid Geometry Foundation',
        desc: 'Axioms, postulates, rationalization, and surds step-by-step masterclass.',
        lessons: '8 Master Video Lessons',
        badge: 'Core Foundation',
      },
      {
        id: 'course-3',
        title: 'Class 8 Algebraic Identities & Factorisation',
        desc: 'Geometric area proofs for (a+b)², (a-b)², and split-the-middle-term drills.',
        lessons: '10 Master Video Lessons',
        badge: 'High-Scoring',
      },
    ];

    return (
      <section key={block.id} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#7C3AED] uppercase tracking-wider mb-1">
              <Video className="w-4 h-4" />
              <span>Video Masterclasses</span>
            </div>
            <h2 className="font-heading font-bold text-2xl text-[#0F172A]">
              {config.title || 'Structured Math Video Courses'}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              {config.subtitle ||
                'Concept-first video series covering every NCERT exemplar proof.'}
            </p>
          </div>
          <Link href="/courses" className="self-start sm:self-auto">
            <Button variant="outline" size="sm" className="min-h-[36px]">
              <span>View All Courses</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {courses.map((crs) => (
            <div
              key={crs.id}
              className="bg-white border border-[#E2E8F0] hover:border-[#7C3AED]/40 rounded-xl p-5 shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="px-2.5 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[11px]">
                    {crs.badge}
                  </span>
                  <span className="text-[#64748B] flex items-center gap-1">
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>{crs.lessons}</span>
                  </span>
                </div>
                <h3 className="font-heading font-bold text-base text-[#0F172A] mb-2 leading-snug">
                  {crs.title}
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed mb-4">{crs.desc}</p>
              </div>

              <Link href="/study-material">
                <Button size="sm" variant="outline" className="w-full font-semibold border-purple-200 text-purple-700 hover:bg-purple-50">
                  <span>Start Video Series</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>
    );
  };

  // 11. Premium Material Block
  const renderPremiumMaterial = (block: HomepageBlock<PremiumMaterialBlockConfig>) => {
    const config = block.config || {};
    const premiumItems = INITIAL_CHAPTERS.filter((c) => !c.isFreePreview).slice(0, 4);

    return (
      <section
        key={block.id}
        className="bg-gradient-to-br from-amber-50/50 via-white to-amber-50/20 rounded-xl border border-amber-200/80 p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-amber-700 uppercase tracking-wider mb-1">
              <Crown className="w-4 h-4 fill-amber-500 text-amber-600" />
              <span>Pro Curriculum Assets</span>
            </div>
            <h2 className="font-heading font-bold text-2xl text-[#0F172A]">
              {config.title || 'Exemplar & Board Diagnostic Assessments'}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              {config.subtitle ||
                'Full length mock papers and timed section practice for Annual Pass holders.'}
            </p>
          </div>
          <Link href="/annual-pass" className="self-start sm:self-auto">
            <Button size="sm" variant="primary" className="bg-amber-600 hover:bg-amber-700 text-white min-h-[36px]">
              <span>Unlock Pass</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {premiumItems.map((item) => (
            <Link
              key={item.id}
              href={`/study/${item.slug}`}
              className="bg-white border border-amber-200 hover:border-amber-400 rounded-lg p-4 transition-all shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    <span>ANNUAL PASS</span>
                  </span>
                  <span className="text-[#64748B]">{item.classLevel}</span>
                </div>
                <h3 className="font-heading font-bold text-sm text-[#0F172A] mb-1 line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-[#64748B] line-clamp-2 mb-3">{item.description}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-amber-100 text-xs font-semibold text-amber-700">
                <span>View Assessment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    );
  };

  // 12. Annual Pass CTA Block
  const renderAnnualPassCta = (block: HomepageBlock<AnnualPassCtaBlockConfig>) => {
    const config = block.config || {};

    return (
      <section
        key={block.id}
        className="bg-white rounded-lg border border-[#E2E8F0] p-6 sm:p-8 text-center max-w-2xl mx-auto shadow-[0_4px_14px_-2px_rgba(29,78,216,0.05)]"
      >
        <Badge variant="pro" size="md" className="mb-3">
          {config.badgeText || 'ALL-IN-ONE BOARD PASS'}
        </Badge>
        <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#0F172A] mb-2">
          {config.title || 'Maths at Your Fingertips Annual Pass'}
        </h2>
        <p className="text-sm text-[#64748B] mb-6">
          {config.subtitle ||
            'Complete syllabus access for Class 5 to 10. Printable revision notes, formula flashcards, and unlimited AI Teacher guidance.'}
        </p>

        <div className="inline-flex items-baseline gap-1 font-mono tabular-nums text-4xl sm:text-5xl font-extrabold text-[#0037B0] mb-2">
          <span>{config.priceFormatted || '₹999'}</span>
          <span className="text-xs font-sans text-[#64748B] font-semibold">
            {config.periodText || '/ entire academic year'}
          </span>
        </div>

        <div className="text-xs text-[#059669] font-semibold mb-6 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4" />
          <span>
            {config.guaranteeText ||
              '100% Money-Back Guarantee within 7 days. No questions asked.'}
          </span>
        </div>

        <Link href="/annual-pass">
          <Button size="lg" variant="accent" className="w-full sm:w-auto font-bold px-8">
            {config.buttonText || 'Unlock All Chapters & Formulas'}
          </Button>
        </Link>
      </section>
    );
  };

  // 13. Latest Block
  const renderLatest = (block: HomepageBlock<LatestBlockConfig>) => {
    const config = block.config || {};
    const maxItems = config.maxItems || 4;
    const latestItems = INITIAL_CHAPTERS.slice(-maxItems);

    return (
      <section key={block.id} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#00687A] uppercase tracking-wider mb-1">
              <Clock className="w-4 h-4" />
              <span>Fresh Additions</span>
            </div>
            <h2 className="font-heading font-bold text-2xl text-[#0F172A]">
              {config.title || 'Newly Added Curriculum Resources'}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              {config.subtitle || 'Latest updates added to our mathematical repository.'}
            </p>
          </div>
          <Link href="/study-material" className="self-start sm:self-auto">
            <Button variant="outline" size="sm" className="min-h-[36px]">
              <span>View Repository</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {latestItems.map((item) => (
            <Link
              key={item.id}
              href={`/study/${item.slug}`}
              className="bg-white border border-[#E2E8F0] hover:border-[#00687A] rounded-lg p-4 transition-all shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-2">
                  <span className="px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-800 font-bold text-[10px]">
                    NEW
                  </span>
                  <span>{item.classLevel}</span>
                </div>
                <h3 className="font-heading font-bold text-sm text-[#0F172A] mb-1 line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-[#64748B] line-clamp-2 mb-3">{item.description}</p>
              </div>
              <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs font-semibold text-[#00687A]">
                <span>Read Notes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    );
  };

  // 14. Social Join Block
  const renderSocialJoin = (block: HomepageBlock<SocialJoinBlockConfig>) => {
    const config = block.config || {};

    return (
      <section
        key={block.id}
        className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-5"
      >
        <div className="max-w-2xl">
          <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#1D4ED8] uppercase tracking-wider mb-1">
            <Share2 className="w-4 h-4" />
            <span>Connect & Study Together</span>
          </div>
          <h2 className="font-heading font-bold text-2xl text-[#0F172A]">
            {config.title || 'Join Our Student Mathematics Community'}
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            {config.subtitle ||
              'Daily morning formulas, board exam alert discussions, and live doubt groups.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Telegram */}
          <a
            href={config.telegramUrl || 'https://t.me/mayf_mathematics'}
            target="_blank"
            rel="noopener noreferrer"
            className="group p-4 rounded-lg border border-[#E2E8F0] hover:border-[#0284C7] bg-[#F8FAFC] hover:bg-white transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#0284C7]/10 text-[#0284C7] flex items-center justify-center font-bold">
                TG
              </div>
              <div>
                <div className="font-heading font-bold text-sm text-[#0F172A] group-hover:text-[#0284C7] transition-colors">
                  Telegram Channel
                </div>
                <div className="text-xs text-[#64748B]">Daily Formula Quizzes</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0284C7] transition-colors" />
          </a>

          {/* YouTube */}
          <a
            href={config.youtubeUrl || 'https://youtube.com/@MathsAtYourFingertips'}
            target="_blank"
            rel="noopener noreferrer"
            className="group p-4 rounded-lg border border-[#E2E8F0] hover:border-[#DC2626] bg-[#F8FAFC] hover:bg-white transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center font-bold">
                YT
              </div>
              <div>
                <div className="font-heading font-bold text-sm text-[#0F172A] group-hover:text-[#DC2626] transition-colors">
                  YouTube Lectures
                </div>
                <div className="text-xs text-[#64748B]">Animated NCERT Derivations</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-[#94A3B8] group-hover:text-[#DC2626] transition-colors" />
          </a>

          {/* WhatsApp */}
          <a
            href={config.whatsappUrl || 'https://chat.whatsapp.com/mayf-math-prep'}
            target="_blank"
            rel="noopener noreferrer"
            className="group p-4 rounded-lg border border-[#E2E8F0] hover:border-[#16A34A] bg-[#F8FAFC] hover:bg-white transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center font-bold">
                WA
              </div>
              <div>
                <div className="font-heading font-bold text-sm text-[#0F172A] group-hover:text-[#16A34A] transition-colors">
                  WhatsApp Community
                </div>
                <div className="text-xs text-[#64748B]">Board Exam Alert Broadcasts</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-[#94A3B8] group-hover:text-[#16A34A] transition-colors" />
          </a>
        </div>
      </section>
    );
  };

  // 15. AdSense Block
  const renderAdSense = (block: HomepageBlock<AdSenseBlockConfig>) => {
    return <AdSensePlacement key={block.id} zone="homepage" />;
  };

  // Dispatcher map for all 15 blocks
  const renderBlock = (block: HomepageBlock) => {
    if (!block.enabled) return null;

    switch (block.id) {
      case 'customAnnouncement':
        return renderCustomAnnouncement(block as HomepageBlock<CustomAnnouncementBlockConfig>);
      case 'hero':
        return renderHero(block as HomepageBlock<HeroBlockConfig>);
      case 'globalSearch':
        return renderGlobalSearch(block as HomepageBlock<GlobalSearchBlockConfig>);
      case 'classCategories':
        return renderClassCategories(block as HomepageBlock<ClassCategoriesBlockConfig>);
      case 'trending':
        return renderTrending(block as HomepageBlock<TrendingBlockConfig>);
      case 'freeMaterial':
        return renderFreeMaterial(block as HomepageBlock<FreeMaterialBlockConfig>);
      case 'formulaDeckCta':
        return renderFormulaDeckCta(block as HomepageBlock<FormulaDeckCtaBlockConfig>);
      case 'aiTeacherCta':
        return renderAiTeacherCta(block as HomepageBlock<AiTeacherCtaBlockConfig>);
      case 'popular':
        return renderPopular(block as HomepageBlock<PopularBlockConfig>);
      case 'courses':
        return renderCourses(block as HomepageBlock<CoursesBlockConfig>);
      case 'premiumMaterial':
        return renderPremiumMaterial(block as HomepageBlock<PremiumMaterialBlockConfig>);
      case 'annualPassCta':
        return renderAnnualPassCta(block as HomepageBlock<AnnualPassCtaBlockConfig>);
      case 'latest':
        return renderLatest(block as HomepageBlock<LatestBlockConfig>);
      case 'socialJoin':
        return renderSocialJoin(block as HomepageBlock<SocialJoinBlockConfig>);
      case 'adsense':
        return renderAdSense(block as HomepageBlock<AdSenseBlockConfig>);
      default:
        return null;
    }
  };

  return (
    <SharedLayout>
      <SeoHead
        title="Maths at Your Fingertips | Class 5–10 CBSE & ICSE Math"
        description="The authoritative digital math companion for Class 5–10 students. Master formulas, chapter materials, and get step-by-step guidance from the AI Teacher."
        canonicalUrl="/"
        ogType="website"
        breadcrumbs={[{ name: 'Home', item: '/' }]}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'EducationalOrganization',
          name: 'Maths at Your Fingertips',
          url: 'https://mayf.co.in',
          description: 'The authoritative digital math companion for Class 5–10 students.',
          offers: {
            '@type': 'Offer',
            price: '999',
            priceCurrency: 'INR',
            name: 'Annual Pass',
          },
        }}
      />
      <div className="space-y-12 md:space-y-20">
        {/* Authoritative Admin Promotional Banner for Homepage */}
        <PromotionalBanner placement="homepage" />

        {/* Controlled Predefined Performant Blocks */}
        {blocks.map((block) => renderBlock(block))}

        {/* Always included pedagogical worked problem anchor */}
        <section className="space-y-4 pt-4 border-t border-[#E2E8F0]">
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
      </div>
    </SharedLayout>
  );
};
