import React, { useState } from 'react';
import { Search, Filter, BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { INITIAL_CHAPTERS } from '../data/curriculumData';
import { StudentClass, MathSubjectCategory } from '../lib/firebase/types';
import { Link, useNavigation } from '../context/NavigationContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const StudyMaterialPage: React.FC = () => {
  const { currentRoute } = useNavigation();
  const classFromQuery = currentRoute.searchParams.get('class') as StudentClass | null;

  const [selectedClass, setSelectedClass] = useState<StudentClass | 'All'>(
    classFromQuery || 'Class 10'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const classes: (StudentClass | 'All')[] = [
    'All',
    'Class 5',
    'Class 6',
    'Class 7',
    'Class 8',
    'Class 9',
    'Class 10',
  ];

  const categories = [
    'All',
    'Number System',
    'Algebra',
    'Geometry',
    'Coordinate Geometry',
    'Trigonometry',
    'Mensuration',
  ];

  const filteredChapters = INITIAL_CHAPTERS.filter((ch) => {
    const matchesClass = selectedClass === 'All' || ch.classLevel === selectedClass;
    const matchesCategory = selectedCategory === 'All' || ch.category === selectedCategory;
    const matchesSearch =
      ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesCategory && matchesSearch;
  });

  return (
    <SharedLayout>
      <div className="space-y-8">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-xs font-heading font-semibold text-[#00687A] mb-1">
            <span>CBSE & ICSE Math Curriculum</span>
            <span aria-hidden="true">·</span>
            <span>Classes 5–10</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-[#0F172A] tracking-tight">
            Study Material & Chapter Modules
          </h1>
          <p className="text-sm md:text-base text-[#64748B] mt-1 max-w-2xl">
            In-depth conceptual breakdowns, key theorems, formula sheets, and step-by-step solved exemplars.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search chapters, theorems, or concepts (e.g. Pythagoras, Linear, Polynomials)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>

            {/* Total Count */}
            <div className="text-xs text-[#64748B] shrink-0 font-medium">
              Showing <span className="font-bold text-[#0F172A]">{filteredChapters.length}</span> modules
            </div>
          </div>

          {/* Class Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs text-[#64748B] font-semibold mr-1 shrink-0">Grade:</span>
            {classes.map((cls) => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1 rounded-md text-xs font-heading font-semibold transition-colors shrink-0 cursor-pointer ${
                  selectedClass === cls
                    ? 'bg-[#1D4ED8] text-white'
                    : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs text-[#64748B] font-semibold mr-1 shrink-0">Topic:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#06B6D4] text-white'
                    : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Chapters Grid */}
        {filteredChapters.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-12 text-center text-[#64748B]">
            <p className="text-sm">No chapters found matching your filter criteria.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setSelectedClass('All');
                setSelectedCategory('All');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChapters.map((chapter) => (
              <div
                key={chapter.id}
                className="bg-white rounded-lg border border-[#E2E8F0] shadow-[0_4px_14px_-2px_rgba(29,78,216,0.05)] hover:shadow-[0_8px_20px_-2px_rgba(29,78,216,0.1)] transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-xs font-bold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded">
                      {chapter.classLevel}
                    </span>
                    {chapter.isFreePreview ? (
                      <Badge variant="free">FREE PREVIEW</Badge>
                    ) : (
                      <Badge variant="pro">ANNUAL PASS</Badge>
                    )}
                  </div>

                  <h3 className="font-heading font-bold text-base text-[#0F172A] mb-2 group-hover:text-[#1D4ED8] transition-colors">
                    {chapter.title}
                  </h3>

                  <p className="text-xs text-[#64748B] leading-relaxed mb-4 line-clamp-2">
                    {chapter.description}
                  </p>

                  <div className="space-y-1.5 pt-3 border-t border-[#F1F5F9] text-xs text-[#475569]">
                    <div className="font-semibold text-[#00687A] text-[11px] uppercase tracking-wide">
                      Core Learning Focus:
                    </div>
                    {chapter.learningOutcomes.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 line-clamp-1">
                        <span className="text-[#06B6D4] font-bold">✓</span>
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#FAFBFD] border-t border-[#F1F5F9] px-5 py-3 flex items-center justify-between text-xs">
                  <div className="text-[#64748B] tabular-nums font-medium">
                    {chapter.formulaCount} formulas · {chapter.solvedProblemsCount} problems
                  </div>
                  <Link
                    href={`/study/${chapter.slug}`}
                    className="font-heading font-semibold text-[#1D4ED8] hover:underline flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Open Module</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </SharedLayout>
  );
};
