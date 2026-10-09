import React, { useState, useEffect } from 'react';
import { ArrowLeft, Share2, Check, Download, Bot, Sparkles, Lock, ExternalLink, Calendar, Eye, BookOpen } from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { Link, useNavigation } from '../context/NavigationContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { FormulaCard } from '../components/ui/FormulaCard';
import { StepProblemCard } from '../components/ui/StepProblemCard';
import { WatermarkGlyph } from '../components/ui/WatermarkGlyph';
import { LoadingSpinner } from '../components/ui/LoadingState';
import { useAuth } from '../context/AuthContext';
import { fetchContentItemBySlug, checkUserCanAccessItem, SEED_CONTENT_ITEMS } from '../lib/catalogue/catalogueService';
import { ContentItem } from '../lib/firebase/types';
import { ViewerContainer } from '../components/viewers/ViewerContainer';
import { SeoHead } from '../components/common/SeoHead';
import { ShareButton } from '../components/ui/ShareButton';
import { INITIAL_FORMULAS, INITIAL_SOLVED_PROBLEMS } from '../data/curriculumData';
import { TurnstileModal } from '../components/ui/TurnstileModal';
import { AdSensePlacement } from '../components/adsense/AdSensePlacement';
import { logProductEvent } from '../lib/activity/activityService';
import { trackContentView, trackShare } from '../lib/analytics/analyticsService';

export const StudyChapterPage: React.FC = () => {
  const { currentRoute, goBack } = useNavigation();
  const { user, entitlements } = useAuth();
  const slug = currentRoute.params.slug;

  const [contentItem, setContentItem] = useState<ContentItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTurnstileOpen, setIsTurnstileOpen] = useState(false);

  useEffect(() => {
    async function loadItem() {
      setLoading(true);
      try {
        const item = await fetchContentItemBySlug(slug);
        const resolved = item || (slug ? null : SEED_CONTENT_ITEMS[0]);
        setContentItem(resolved);
        if (resolved) {
          // GA4 / Firebase Analytics content_view
          trackContentView({
            content_id: resolved.id,
            title: resolved.title,
            category: resolved.categoryId || 'Mathematics',
            class_level: resolved.classLevels[0] || 'Class 10',
            content_type: resolved.contentType || 'chapter',
            access_type: resolved.accessType === 'free' ? 'free' : 'premium',
          });

          logProductEvent({
            userId: user?.uid || 'anonymous-student',
            eventType: 'content_view',
            title: `Studied Chapter: ${resolved.title}`,
            targetId: resolved.id,
            targetSlug: resolved.slug,
            targetType: 'chapter',
            metadata: {
              category: resolved.categoryId,
              classLevel: resolved.classLevels[0],
            },
          });
        }
      } finally {
        setLoading(false);
      }
    }
    loadItem();
  }, [slug, user?.uid]);

  if (loading) {
    return (
      <SharedLayout>
        <div className="py-24 text-center">
          <LoadingSpinner message="Loading educational resource..." size="lg" />
        </div>
      </SharedLayout>
    );
  }

  if (!contentItem) {
    return (
      <SharedLayout>
        <SeoHead
          title="Resource Not Found | Maths at Your Fingertips"
          description="The requested mathematics study module was not found in our catalogue."
          noindex={true}
        />
        <div className="max-w-md mx-auto py-20 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-[#0F172A]">Module Not Found</h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            We could not find an educational resource for{' '}
            <code className="bg-[#F1F5F9] px-1.5 py-0.5 rounded font-mono text-xs text-[#0F172A]">{slug}</code>.
            Please explore the catalogue for available modules.
          </p>
          <div className="pt-2">
            <Link href="/study-material">
              <Button variant="primary" size="md">
                Browse Public Catalogue
              </Button>
            </Link>
          </div>
        </div>
      </SharedLayout>
    );
  }

  const activeItem = contentItem;
  const accessState = checkUserCanAccessItem(activeItem, user ? entitlements : null);

  const canonicalUrl = `https://mayf.co.in/study/${activeItem.slug}`;

  const handleShare = () => {
    trackShare({
      method: typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? 'web_share' : 'clipboard',
      content_type: 'chapter',
      item_id: activeItem.id,
      item_title: activeItem.title,
    });

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      navigator.share({
        title: `${activeItem.title} - Maths at Your Fingertips`,
        text: activeItem.shortDescription,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const relevantFormulas = INITIAL_FORMULAS.filter(
    (f) =>
      f.category === activeItem.categoryId ||
      activeItem.classLevels.some((c) => f.applicableClasses.includes(c))
  );

  const relevantProblems = INITIAL_SOLVED_PROBLEMS.filter(
    (p) => activeItem.classLevels.includes(p.classLevel)
  );

  // Schema.org Structured Data for Rich Search Engine Results
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: activeItem.title,
    description: activeItem.shortDescription || activeItem.description,
    educationalLevel: activeItem.classLevels.join(', '),
    learningResourceType: activeItem.contentType,
    isAccessibleForFree: activeItem.accessType === 'free',
    inLanguage: 'en',
    publisher: {
      '@type': 'EducationalOrganization',
      name: 'Maths at Your Fingertips',
      url: 'https://mayf.co.in',
    },
    url: canonicalUrl,
  };

  return (
    <SharedLayout>
      {/* Dynamic SEO Metadata & Schema.org Structured Data */}
      <SeoHead
        title={activeItem.seoTitle || activeItem.title}
        description={activeItem.seoDescription || activeItem.shortDescription || activeItem.description || ''}
        canonicalUrl={canonicalUrl}
        ogType="article"
        ogImage={activeItem.socialImage || activeItem.thumbnail}
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Study Material', item: '/study-material' },
          { name: activeItem.categoryId || 'Curriculum', item: `/study-material?category=${encodeURIComponent(activeItem.categoryId || '')}` },
          { name: activeItem.title, item: `/study/${activeItem.slug}` },
        ]}
        structuredData={structuredData}
      />

      <div className="space-y-8 max-w-4xl mx-auto">
        
        {/* Navigation Breadcrumbs & Direct Share */}
        <div className="flex items-center justify-between gap-3 text-xs text-[#64748B]">
          <Link
            href="/study-material"
            className="inline-flex items-center gap-1.5 font-medium text-[#1D4ED8] hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Catalogue</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">{activeItem.classLevels.join(', ')}</span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="text-[#00687A] font-semibold">{activeItem.categoryId}</span>

            <ShareButton
              canonicalUrl={canonicalUrl}
              title={activeItem.title}
              description={activeItem.shortDescription || activeItem.description}
              buttonText="Share"
              buttonSize="xs"
              className="ml-2"
            />
          </div>
        </div>

        {/* Content Item Header Banner */}
        <div className="relative bg-white rounded-xl border border-[#E2E8F0] p-6 sm:p-8 shadow-[0_4px_14px_-2px_rgba(29,78,216,0.05)] overflow-hidden">
          <WatermarkGlyph glyph="x²" size="xl" className="opacity-30 -top-8 right-2" />

          <div className="max-w-2xl relative z-10 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#1D4ED8] bg-[#EFF6FF] px-2.5 py-1 rounded">
                {activeItem.classLevels.join(', ')}
              </span>
              <span className="text-xs font-semibold text-[#00687A] bg-[#ECFEFF] px-2.5 py-1 rounded">
                {activeItem.categoryId}
              </span>
              <span className="text-xs font-mono font-bold uppercase text-[#475569] bg-[#F1F5F9] px-2 py-0.5 rounded">
                {activeItem.contentType}
              </span>

              {activeItem.accessType === 'free' ? (
                <Badge variant="free">FREE ACCESS · NO LOGIN NEEDED</Badge>
              ) : accessState.canAccess ? (
                <Badge variant="pro">ANNUAL PASS UNLOCKED</Badge>
              ) : (
                <Badge variant="pro">ANNUAL PASS REQUIRED</Badge>
              )}
            </div>

            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-[#0F172A] tracking-tight">
              {activeItem.title}
            </h1>

            <p className="text-sm md:text-base text-[#475569] leading-relaxed">
              {activeItem.shortDescription || activeItem.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] pt-2 border-t border-[#F1F5F9]">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span className="font-mono tabular-nums">{activeItem.viewCount} views</span>
              </span>
              {activeItem.downloadCount > 0 && (
                <span className="flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" />
                  <span className="font-mono tabular-nums">{activeItem.downloadCount} downloads</span>
                </span>
              )}
              {activeItem.downloadAllowed && (
                <button
                  onClick={() => setIsTurnstileOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1D4ED8] font-semibold rounded-md text-xs cursor-pointer transition-colors"
                  title="Secure Cloudflare Turnstile Download"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Asset</span>
                </button>
              )}
              <span className="font-mono text-[11px] text-[#94A3B8] hidden sm:inline">
                Canonical: {canonicalUrl}
              </span>
            </div>
          </div>
        </div>

        {/* PRIMARY RESPONSIVE VIEWER CONTAINER */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-heading font-bold text-[#00687A] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>Interactive Material Stage</span>
            </div>
          </div>

          {/* Access Control Gate */}
          {accessState.canAccess ? (
            <ViewerContainer item={activeItem} />
          ) : (
            <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl p-8 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-[#EA580C] text-white flex items-center justify-center mx-auto shadow-xs">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="font-heading font-bold text-xl text-[#9A3412]">
                Unlock with Maths at Your Fingertips Annual Pass
              </h2>
              <p className="text-xs sm:text-sm text-[#C2410C] max-w-md mx-auto leading-relaxed">
                This premium resource requires the Annual Pass (₹999/year), which grants unlimited access across all Class 5–10 subjects. Free preview materials remain accessible without logging in.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Link href="/annual-pass">
                  <Button size="lg" variant="accent" className="font-bold">
                    Activate Annual Pass for ₹999
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline">
                    Sign in to Existing Account
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Ask AI Teacher shortcut */}
        <div className="p-6 bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE] border border-[#BFDBFE] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="font-heading font-bold text-base text-[#1E3A8A] flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#1D4ED8]" />
              <span>Have a doubt in this module?</span>
            </div>
            <p className="text-xs text-[#3B82F6]">
              Professor Sigma is ready 24/7 to explain any equation, theorem, or word problem step-by-step.
            </p>
          </div>
          <Link href={`/ai-teacher?topic=${encodeURIComponent(activeItem.title)}`}>
            <Button size="md" variant="primary">
              Ask AI Teacher
            </Button>
          </Link>
        </div>

        {/* Formulas in this Topic */}
        {relevantFormulas.length > 0 && (
          <section className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-xl text-[#0F172A]">
                Key Formulas Referenced
              </h2>
              <Link href="/formula-deck" className="text-xs text-[#1D4ED8] hover:underline font-semibold">
                View All Formulas →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relevantFormulas.slice(0, 4).map((f) => (
                <FormulaCard key={f.id} formula={f} />
              ))}
            </div>
          </section>
        )}

        {/* Reusable Child-Safe AdSense Placement for Content */}
        <AdSensePlacement zone="content" />

        {/* Cloudflare Turnstile Secure Download Modal */}
        {isTurnstileOpen && (
          <TurnstileModal
            isOpen={isTurnstileOpen}
            onClose={() => setIsTurnstileOpen(false)}
            contentId={activeItem.id}
            title={activeItem.title}
            classLevel={activeItem.classLevels.join(', ')}
            accessType={activeItem.accessType}
            fallbackFileName={`${activeItem.slug}.pdf`}
          />
        )}

      </div>
    </SharedLayout>
  );
};
