import React, { useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShieldCheck,
  Tag,
  Star,
  Clock,
  Award,
} from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { SeoHead } from '../components/common/SeoHead';
import { ShareButton } from '../components/ui/ShareButton';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Link, useNavigation } from '../context/NavigationContext';
import { getCourseBySlug, STUDENT_COURSES } from '../data/coursesData';
import { FORMULA_DECK_ITEMS } from '../data/formulaDeckData';
import { INITIAL_CHAPTERS } from '../data/curriculumData';
import { trackContentView } from '../lib/analytics/analyticsService';

export const CourseDetailPage: React.FC = () => {
  const { currentRoute } = useNavigation();
  const slug = currentRoute.params.slug;
  const course = getCourseBySlug(slug);

  useEffect(() => {
    if (course) {
      trackContentView({
        content_id: course.id,
        title: course.title,
        category: 'Course Catalogue',
        class_level: course.targetClass,
        content_type: 'course',
        access_type: 'free',
      });
    }
  }, [course?.id]);

  if (!course) {
    return (
      <SharedLayout>
        <div className="py-20 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="font-heading font-bold text-xl text-[#0F172A]">
            Course Not Found
          </h1>
          <p className="text-xs text-[#64748B]">
            The requested course slug <code className="font-mono text-[#00687A]">"{slug}"</code> does not exist or has been relocated.
          </p>
          <div className="pt-2">
            <Link href="/courses">
              <Button size="sm" variant="primary">
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                <span>Return to Courses Catalogue</span>
              </Button>
            </Link>
          </div>
        </div>
      </SharedLayout>
    );
  }

  const canonicalUrl = `https://mayf.co.in/course/${course.slug}`;
  const pageTitle = `${course.title} (${course.targetClass})`;
  const pageDesc = course.description;

  // Find relevant formulas for this course
  const relevantFormulas = FORMULA_DECK_ITEMS.filter(
    (f) =>
      f.applicableClasses.includes(course.targetClass as any) &&
      (course.topics.some((t) => f.category.toLowerCase().includes(t.toLowerCase()) || f.title.toLowerCase().includes(t.toLowerCase())) ||
        f.tags?.some((tag) => course.topics.some((t) => tag.toLowerCase().includes(t.toLowerCase()))))
  ).slice(0, 6);

  // Find relevant chapters from curriculumData
  const relevantChapters = INITIAL_CHAPTERS.filter(
    (c) => c.classLevel === course.targetClass
  );

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    educationalLevel: course.targetClass,
    provider: {
      '@type': 'EducationalOrganization',
      name: 'Maths at Your Fingertips',
      url: 'https://mayf.co.in',
    },
    url: canonicalUrl,
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
    },
  };

  return (
    <SharedLayout>
      <SeoHead
        title={pageTitle}
        description={pageDesc}
        canonicalUrl={canonicalUrl}
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Courses', item: '/courses' },
          { name: course.title, item: `/course/${course.slug}` },
        ]}
        structuredData={structuredData}
      />

      <div className="space-y-10">
        {/* Navigation Breadcrumb & Share Strip */}
        <div className="flex items-center justify-between gap-4 text-xs">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-[#64748B] hover:text-[#0F172A] font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Courses</span>
          </Link>

          <ShareButton
            canonicalUrl={canonicalUrl}
            title={pageTitle}
            description={pageDesc}
            buttonText="Share Course"
            buttonSize="sm"
          />
        </div>

        {/* Hero Banner */}
        <div className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className={`h-3 w-full bg-gradient-to-r ${course.bannerGradient || 'from-blue-600 to-indigo-800'}`} />

          <div className="p-6 sm:p-8 md:p-10 space-y-6">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="pro">{course.targetClass}</Badge>
              <span className="text-xs font-heading font-semibold text-[#00687A] bg-[#ECFEFF] px-2.5 py-1 rounded">
                Level: {course.level}
              </span>
              <span className="text-xs font-heading font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded">
                CBSE Board Aligned
              </span>
            </div>

            <div className="space-y-3 max-w-3xl">
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-[#0F172A] tracking-tight leading-tight">
                {course.title}
              </h1>

              <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
                {course.description}
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#F1F5F9] text-xs">
              <div className="space-y-1">
                <span className="text-[#64748B] block font-medium">Curriculum Scope</span>
                <span className="font-heading font-bold text-sm text-[#0F172A] flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-[#1D4ED8]" />
                  {course.totalChapters} Chapters
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[#64748B] block font-medium">Formula Cards</span>
                <span className="font-heading font-bold text-sm text-[#0F172A] flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[#00687A]" />
                  {course.totalFormulas} Formulas
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[#64748B] block font-medium">Target Exam</span>
                <span className="font-heading font-bold text-sm text-[#059669] flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  CBSE / NCERT
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[#64748B] block font-medium">Access Tier</span>
                <span className="font-heading font-bold text-sm text-[#FF6B4A] flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-[#FF6B4A]" />
                  Annual Pass Inclusive
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link href="/annual-pass">
                <Button size="md" variant="primary" className="gap-2 shadow-sm">
                  <span>Enroll with Annual Pass</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              <Link href="/ai-teacher">
                <Button size="md" variant="secondary" className="gap-2">
                  <Sparkles className="w-4 h-4 text-[#1D4ED8]" />
                  <span>Ask AI Teacher About This Course</span>
                </Button>
              </Link>

              <ShareButton
                canonicalUrl={canonicalUrl}
                title={pageTitle}
                description={pageDesc}
                variant="button"
                buttonSize="md"
              />
            </div>
          </div>
        </div>

        {/* Course Topics & Learning Outcomes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Chapters & Syllabus */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                <div>
                  <h2 className="font-heading font-bold text-base text-[#0F172A]">
                    Chapter Modules & Syllabus Breakdown
                  </h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Click any chapter to study with standalone dedicated viewer
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-[#1D4ED8] bg-[#EFF6FF] px-2.5 py-1 rounded">
                  {relevantChapters.length || course.totalChapters} Modules
                </span>
              </div>

              <div className="space-y-2.5">
                {(relevantChapters.length > 0 ? relevantChapters : course.topics.map((t, idx) => ({
                  id: `mock-chap-${idx}`,
                  title: `${t} Comprehensive Mastery`,
                  slug: t.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                  description: `Master fundamental theorems, algebraic manipulation, and exemplar word problems for ${t}.`,
                  formulaCount: 4,
                  category: t,
                }))).map((chapter, idx) => (
                  <div
                    key={chapter.id}
                    className="p-3.5 rounded-lg border border-[#E2E8F0] hover:border-[#1D4ED8]/40 hover:bg-[#F8FAFC] transition-all flex items-start justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-md bg-[#EFF6FF] text-[#1D4ED8] font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-heading font-semibold text-sm text-[#0F172A] group-hover:text-[#1D4ED8] transition-colors">
                          {chapter.title}
                        </h3>
                        <p className="text-xs text-[#64748B] line-clamp-2">
                          {chapter.description}
                        </p>
                      </div>
                    </div>

                    <a
                      href={`/study/${chapter.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 px-3 py-1 bg-white border border-[#CBD5E1] text-[#1D4ED8] hover:bg-[#EFF6FF] rounded-md text-xs font-semibold flex items-center gap-1 group-hover:border-[#1D4ED8] transition-colors"
                    >
                      <span>Study</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Core Formulas Included in Course */}
            {relevantFormulas.length > 0 && (
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                  <div>
                    <h2 className="font-heading font-bold text-base text-[#0F172A]">
                      High-Yield Formulas in this Course
                    </h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Direct standalone links to derivations, mnemonics, and flashcards
                    </p>
                  </div>
                  <Link href="/formula-deck" className="text-xs text-[#1D4ED8] font-semibold hover:underline">
                    View Formula Deck
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {relevantFormulas.map((formula) => (
                    <a
                      key={formula.id}
                      href={`/formula/${formula.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-lg border border-[#E2E8F0] hover:border-[#00687A] hover:bg-[#F8FAFC] transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-[#00687A] font-semibold uppercase">
                          {formula.category}
                        </span>
                        <h4 className="font-heading font-bold text-xs text-[#0F172A] group-hover:text-[#1D4ED8] transition-colors">
                          {formula.title}
                        </h4>
                        <div className="font-mono text-xs text-[#1E293B] bg-[#F1F5F9] px-2 py-1 rounded truncate">
                          {formula.plainTextFormula}
                        </div>
                      </div>
                      <div className="pt-2 text-[11px] text-[#1D4ED8] font-medium flex items-center justify-end gap-1">
                        <span>Derivation & notes</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Pass Value Proposition & Sharing */}
          <div className="space-y-6">
            {/* Annual Pass Card */}
            <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white rounded-xl p-6 shadow-lg space-y-4 border border-[#334155]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#38BDF8] tracking-wider uppercase">
                  Complete Access
                </span>
                <span className="bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30 text-[10px] font-bold px-2 py-0.5 rounded">
                  7-Day Guarantee
                </span>
              </div>

              <h3 className="font-heading font-bold text-lg text-white">
                All-Class Annual Pass
              </h3>

              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Unlock this course along with all other Class 5–10 courses, 80+ formula decks, printable cheat sheets, and 24/7 AI Teacher solver.
              </p>

              <div className="space-y-2 pt-2 border-t border-[#334155] text-xs text-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                  <span>Full {course.title} access</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                  <span>Unlimited Multimodal AI Teacher doubts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                  <span>High-resolution printable PDF summaries</span>
                </div>
              </div>

              <div className="pt-3">
                <Link href="/annual-pass">
                  <Button size="md" variant="primary" className="w-full bg-[#1D4ED8] hover:bg-[#2563EB] text-white">
                    <span>View Pass & Pricing</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Share Widget */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-3">
              <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-[#64748B]">
                Share Course Resource
              </h3>
              <p className="text-xs text-[#64748B]">
                Share this standalone syllabus URL with classmates, study groups, or parents.
              </p>
              <ShareButton
                canonicalUrl={canonicalUrl}
                title={pageTitle}
                description={pageDesc}
                variant="inline"
              />
            </div>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
};
