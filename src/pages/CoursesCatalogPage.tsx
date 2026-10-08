import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Search,
  BookOpen,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { SeoHead } from '../components/common/SeoHead';
import { ShareButton } from '../components/ui/ShareButton';
import { CourseCard } from '../components/ui/CourseCard';
import { STUDENT_COURSES } from '../data/coursesData';
import { StudentClass } from '../lib/firebase/types';
import { PromotionalBanner } from '../components/ui/PromotionalBanner';
import { Link } from '../context/NavigationContext';
import { Button } from '../components/ui/Button';

export const CoursesCatalogPage: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<StudentClass | 'All'>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [openInNewTab, setOpenInNewTab] = useState(true);

  const classes: (StudentClass | 'All')[] = [
    'All',
    'Class 5',
    'Class 6',
    'Class 7',
    'Class 8',
    'Class 9',
    'Class 10',
  ];

  const levels = ['All', 'Board Exemplar', 'Comprehensive', 'Standard', 'Foundation'];

  const filteredCourses = useMemo(() => {
    return STUDENT_COURSES.filter((course) => {
      const matchClass = selectedClass === 'All' || course.targetClass === selectedClass;
      const matchLevel = selectedLevel === 'All' || course.level === selectedLevel;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        course.title.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q) ||
        course.topics.some((t) => t.toLowerCase().includes(q));
      return matchClass && matchLevel && matchSearch;
    });
  }, [selectedClass, selectedLevel, searchQuery]);

  const canonicalUrl = 'https://mayf.co.in/courses';
  const pageTitle = 'Comprehensive Mathematics Courses for Classes 5–10';
  const pageDesc =
    'Structured chapter-by-chapter mastery courses for Classes 5 to 10 CBSE Board syllabus, fast-track modules, formula derivations, and exemplars.';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Mathematics Mastery Courses',
    description: pageDesc,
    itemListElement: STUDENT_COURSES.map((course, index) => ({
      '@type': 'Course',
      position: index + 1,
      name: course.title,
      description: course.description,
      provider: {
        '@type': 'Organization',
        name: 'Maths at Your Fingertips',
        sameAs: 'https://mayf.co.in',
      },
      url: `https://mayf.co.in/course/${course.slug}`,
    })),
  };

  return (
    <SharedLayout>
      <SeoHead
        title={pageTitle}
        description={pageDesc}
        canonicalUrl={canonicalUrl}
        structuredData={structuredData}
      />

      <div className="space-y-10">
        {/* Promotional Banner */}
        <PromotionalBanner placement="catalogue" />

        {/* Hero Section & Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E2E8F0]">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-heading font-semibold text-[#64748B] flex-wrap">
              <span className="text-[#1D4ED8] bg-[#EFF6FF] px-2.5 py-1 rounded">
                Official Curriculum Courses
              </span>
              <span aria-hidden="true">·</span>
              <span>Classes 5–10</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#059669] font-bold">CBSE & State Board Aligned</span>
            </div>

            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-[#0F172A] tracking-tight">
              Curriculum Mastery Courses
            </h1>

            <p className="text-sm md:text-base text-[#64748B] leading-relaxed">
              Step-by-step video lessons, step derivations, NCERT Exemplar questions, and formula
              flashcards curated for academic retention. Standalone shareable URLs with direct access.
            </p>
          </div>

          {/* Share & Options Widget */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <ShareButton
              canonicalUrl={canonicalUrl}
              title={pageTitle}
              description={pageDesc}
              buttonText="Share Courses"
              buttonSize="sm"
            />

            <Link href="/annual-pass">
              <Button size="sm" variant="primary" className="gap-1.5 shadow-xs">
                <span>Unlock All via Pass</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Controls & Preferences */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search courses, topics (e.g. 'Trigonometry', 'Quadratic', 'Mensuration')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>

            {/* Config: Open cards in new tab */}
            <label className="flex items-center gap-2 text-xs font-heading font-medium text-[#475569] cursor-pointer select-none bg-[#F8FAFC] px-3 py-2 rounded-lg border border-[#E2E8F0] hover:bg-white transition-colors shrink-0">
              <input
                type="checkbox"
                checked={openInNewTab}
                onChange={(e) => setOpenInNewTab(e.target.checked)}
                className="rounded border-[#CBD5E1] text-[#1D4ED8] focus:ring-[#1D4ED8] w-4 h-4 cursor-pointer"
              />
              <span>Open course cards in new tab</span>
              <ExternalLink className="w-3 h-3 text-[#94A3B8]" />
            </label>
          </div>

          {/* Grade and Level Filter Buttons */}
          <div className="pt-2 border-t border-[#F1F5F9] flex flex-wrap gap-4 items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[#64748B] font-semibold mr-1">Grade:</span>
              {classes.map((cls) => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    selectedClass === cls
                      ? 'bg-[#1D4ED8] text-white shadow-2xs font-semibold'
                      : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[#64748B] font-semibold mr-1">Level:</span>
              {levels.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    selectedLevel === lvl
                      ? 'bg-[#1E293B] text-white'
                      : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center text-[#64748B] space-y-3">
            <GraduationCap className="w-10 h-10 text-[#94A3B8] mx-auto" />
            <p className="text-sm font-heading font-semibold text-[#0F172A]">
              No courses found for the selected criteria.
            </p>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              Try adjusting your grade level or search keywords.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedClass('All');
                setSelectedLevel('All');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[#64748B] px-1">
              <span>Showing {filteredCourses.length} structured courses</span>
              <span>All courses have standalone dedicated URLs</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  openInNewTab={openInNewTab}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </SharedLayout>
  );
};
