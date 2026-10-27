import { usableWhatsApp } from '../lib/settings/launchDisplay';
import React, { useState, useEffect } from 'react';
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
import {fetchContentCatalogue} from '../lib/catalogue/catalogueService';
import type {ContentItem} from '../lib/firebase/types';
import {SocialIcon} from '../components/ui/SocialIcon';
import {isRealHomepageContent} from '../lib/catalogue/homepageContent';
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

// Replace only known demo claims, including copies persisted from the original
// layout defaults. Owner-written custom text and financial terms stay intact.
const truthfulHomepageCopy = (value: string | undefined, fallback: string): string => {
  const legacyClaims: Record<string, string> = {
    'Structured Math Video Courses': 'Structured Mathematics Topics',
    'Concept-first video series covering every NCERT exemplar proof.': 'Explore chapter explanations and worked examples by topic.',
    'Exemplar & Board Diagnostic Assessments': 'Annual Pass Revision Topics',
    'Full length mock papers and timed section practice for Annual Pass holders.': 'Explore the published chapter explanations included in Annual Pass.',
    'Browse All 80+ Formulas': 'Browse Formula Deck',
    'Trending Revision Topics': 'Explore Revision Topics',
    'Most active proofs and problem sets this week across board batches.': 'Browse chapter explanations and revision topics.',
    'Most Popular Revision Handouts': 'Revision Handouts',
    'Highest rated study guides, formula cheatsheets, and question banks.': 'Explore study guides, formula sheets, and practice resources.',
    'Complete syllabus access for Class 5 to 10. Printable revision notes, formula flashcards, and unlimited AI Teacher guidance.': 'Explore Class 5 to 10 study materials, formula flashcards, and AI Teacher guidance with daily usage limits.',
  };
  return value ? (legacyClaims[value] || value).replace(/Professor Sigma/g, 'AI Teacher') : fallback;
};

export const HomePage: React.FC = () => {
  const { navigate } = useNavigation();
  const { blocks, loading } = useHomepageLayout();
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [passPrice,setPassPrice]=useState<string|null>(null);
  useEffect(()=>{fetch('/api/annual-pass/config').then(r=>r.ok?r.json():null).then(data=>{if(data?.settings?.enabled&&Number.isFinite(data.settings.salePrice))setPassPrice(new Intl.NumberFormat('en-IN',{style:'currency',currency:data.settings.currency||'INR'}).format(data.settings.salePrice));}).catch(()=>{});},[]);
  const [content,setContent]=useState<ContentItem[]>([]);
  const [contentError,setContentError]=useState('');
  const [contentLoading,setContentLoading]=useState(true);
  useEffect(()=>{let active=true;fetchContentCatalogue({sortBy:'latest'},null,20).then(result=>{if(active)setContent(result.items.filter(isRealHomepageContent));}).catch(()=>{if(active)setContentError('Published resources could not be loaded. Please retry.');}).finally(()=>{if(active)setContentLoading(false);});return()=>{active=false;};},[]);
  const renderPublishedResources=(block:HomepageBlock)=>{
    const type=block.id;
    const items=content.filter(item=>(type!=='classCategories'||selectedClass==='All'||item.classLevels.includes(selectedClass))).filter(item=>type==='freeMaterial'?item.accessType==='free':type==='premiumMaterial'?item.accessType==='paid':type==='courses'?item.contentType==='course':type==='formulaDeckCta'?item.contentType==='formulaSheet':true).slice(0,8);
    if(!content.length)return null;
    return <section key={block.id} className="space-y-4"><h2 className="font-heading text-2xl font-bold">{(block.config as any)?.title||'Published study resources'}</h2>{type==='classCategories'&&<select aria-label="Filter homepage by grade" value={selectedClass} onChange={e=>setSelectedClass(e.target.value)} className="rounded border p-2"><option>All</option>{[...new Set(content.flatMap(item=>item.classLevels))].map(grade=><option key={grade}>{grade}</option>)}</select>}{!items.length&&<p>No published resources in this section yet.</p>}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{items.map(item=><Link key={item.id} href={'/study/'+item.slug} className="rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-500"><p className="text-xs text-slate-500">{item.classLevels.join(', ')} · {item.categoryId}</p><h3 className="mt-2 text-lg font-bold">{item.title}</h3><p className="mt-2 text-sm text-slate-600">{item.shortDescription||''}</p><span className="mt-3 inline-block text-xs font-semibold">{item.accessType==='free'?'Free':'Annual Pass'} · {item.contentType}</span></Link>)}</div></section>;
  };

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
    if (config.enabled === false || config.title === 'CBSE & ICSE 2026 Examination Revision Cycle Active') return null;

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
      <section key={block.id} className="relative pt-4 pb-8 md:py-12">
        {config.showWatermark !== false && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <WatermarkGlyph glyph="∫" size="xl" className="opacity-40 -top-8 right-0" />
            <WatermarkGlyph glyph="π" size="lg" className="opacity-30 top-36 -left-6" />
          </div>
        )}

        <div className="relative w-full text-center">
          {/* Academic Kicker */}
          <div className="flex items-center justify-center gap-2 text-xs font-heading font-semibold text-[#00687A] mb-3">
            <span className="uppercase tracking-wider">
              {config.kickerText || 'CBSE & ICSE Board Aligned · Classes 5 to 10'}
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl text-[#0F172A] tracking-tight leading-[1.15] mb-4 text-balance">
            {config.headline || 'Master School Mathematics with Intuition & Absolute Clarity.'}
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg text-[#475569] leading-relaxed mb-8 w-full">
            {config.subheadline ||
              'From foundational fraction arithmetic to Class 10 board exam derivations. Explore interactive formula flashcards, step-by-step problem breakdowns, and 24/7 AI Teacher doubt clearance.'}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-3">
            <Link className="w-full sm:w-auto" href={config.primaryButtonLink || '/study-material'}>
              <Button size="lg" variant="primary" className="w-full sm:w-auto font-bold shadow-md">
                <span>{config.primaryButtonText || 'Explore Class 5–10 Syllabus'}</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>

            <Link className="w-full sm:w-auto" href={config.secondaryButtonLink || '/ai-teacher'}>
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
          <div className="mt-8 pt-6 border-t border-[#E2E8F0] flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-[#64748B]">
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              <span>School Mathematics Revision</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              <span>Formulas & Worked Examples</span>
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

    return renderPublishedResources(block);
  };
  // 5. Trending Block
  const renderTrending = (block: HomepageBlock<TrendingBlockConfig>) => {

    return renderPublishedResources(block);
  };
  // 6. Free Material Block
  const renderFreeMaterial = (block: HomepageBlock<FreeMaterialBlockConfig>) => {

    return renderPublishedResources(block);
  };
  // 7. Formula Deck CTA Block
  const renderFormulaDeckCta = (block: HomepageBlock<FormulaDeckCtaBlockConfig>) => {

    return renderPublishedResources(block);
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
              "AI Teacher, your personal AI Math Tutor, doesn't just hand you the answer—he guides your thinking step-by-step, highlights the exact CBSE/ICSE formulas needed, and tests your conceptual understanding."}
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

    return renderPublishedResources(block);
  };
  // 10. Courses Block
  const renderCourses = (block: HomepageBlock<CoursesBlockConfig>) => {

    return renderPublishedResources(block);
  };
  // 11. Premium Material Block
  const renderPremiumMaterial = (block: HomepageBlock<PremiumMaterialBlockConfig>) => {

    return renderPublishedResources(block);
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
          {truthfulHomepageCopy(config.subtitle, 'Explore Class 5 to 10 study materials, formula flashcards, and AI Teacher guidance with daily usage limits.')}
        </p>

        <div className="inline-flex items-baseline gap-1 font-mono tabular-nums text-4xl sm:text-5xl font-extrabold text-[#0037B0] mb-2">
          <span>{passPrice || 'View current pricing'}</span>
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

    return renderPublishedResources(block);
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
            target="_self"
            rel="noopener noreferrer"
            className="group p-4 rounded-lg border border-[#E2E8F0] hover:border-[#0284C7] bg-[#F8FAFC] hover:bg-white transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#0284C7]/10 text-[#0284C7] flex items-center justify-center font-bold">
                <SocialIcon name="telegram" />
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
            target="_self"
            rel="noopener noreferrer"
            className="group p-4 rounded-lg border border-[#E2E8F0] hover:border-[#DC2626] bg-[#F8FAFC] hover:bg-white transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center font-bold">
                <SocialIcon name="youtube" />
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
            href={usableWhatsApp(config.whatsappUrl) || undefined}
            aria-disabled={!usableWhatsApp(config.whatsappUrl)}
            target="_self"
            rel="noopener noreferrer"
            className="group p-4 rounded-lg border border-[#E2E8F0] hover:border-[#16A34A] bg-[#F8FAFC] hover:bg-white transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center font-bold">
                <SocialIcon name="whatsapp" />
              </div>
              <div>
                <div className="font-heading font-bold text-sm text-[#0F172A] group-hover:text-[#16A34A] transition-colors">
                  WhatsApp Community
                </div>
                <div className="text-xs text-[#64748B]">{usableWhatsApp(config.whatsappUrl) ? 'Board Exam Alert Broadcasts' : 'Community link coming soon'}</div>
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

        }}
      />
      <div className="space-y-12 md:space-y-20">
        {/* Authoritative Admin Promotional Banner for Homepage */}
        <PromotionalBanner placement="homepage" />

        {/* Controlled Predefined Performant Blocks */}
        {contentLoading&&<p role="status">Loading published resources…</p>}
        {contentError&&<p role="alert">{contentError}</p>}
        {!contentLoading&&!contentError&&!content.length&&<p>No study resources have been published yet.</p>}
        {blocks.map((block) => renderBlock(block))}


      </div>
    </SharedLayout>
  );
};
