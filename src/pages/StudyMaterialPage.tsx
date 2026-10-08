import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, BookOpen, ArrowUpRight, ArrowRight, Sparkles, FileText, Download, CheckCircle2, Eye, X, ArrowUpDown } from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { StudentClass, MathSubjectCategory, ContentItem, ContentType, ContentAccessType } from '../lib/firebase/types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { fetchContentCatalogue, MAX_PAGE_SIZE, CatalogueSortOption, DifficultyLevel } from '../lib/catalogue/catalogueService';
import { searchService } from '../lib/search/lightweightSearchService';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { SeoHead } from '../components/common/SeoHead';
import { PromotionalBanner } from '../components/ui/PromotionalBanner';
import { ShareButton } from '../components/ui/ShareButton';

export const StudyMaterialPage: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<StudentClass | 'All'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [selectedAccessType, setSelectedAccessType] = useState<ContentAccessType | 'All'>('All');
  const [selectedContentType, setSelectedContentType] = useState<ContentType | 'All'>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'All'>('All');
  const [sortBy, setSortBy] = useState<CatalogueSortOption>('latest');
  const [openInNewTab, setOpenInNewTab] = useState<boolean>(true);

  // Debounced search state
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Pagination states (strict cursor-based pagination, maximum 20 items per page)
  const [items, setItems] = useState<ContentItem[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

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

  const subcategoryMap: Record<string, string[]> = {
    'All': ['All'],
    'Number System': ['All', 'Real Numbers', 'Integers', 'Fractions & Decimals'],
    'Algebra': ['All', 'Polynomials', 'Linear Equations', 'Quadratic Equations', 'Arithmetic Progressions', 'Mock Papers'],
    'Geometry': ['All', 'Triangles', 'Circles', 'Quadrilaterals'],
    'Coordinate Geometry': ['All', 'Cartesian Plane', 'Section Formula', 'Distance Formula'],
    'Trigonometry': ['All', 'Trigonometric Ratios', 'Identities', 'Heights & Distances'],
    'Mensuration': ['All', 'Surface Areas and Volumes', 'Conversion of Solids', 'Area Related to Circles'],
  };

  const availableSubcategories = subcategoryMap[selectedCategory] || ['All'];

  const contentTypes: { label: string; value: ContentType | 'All' }[] = [
    { label: 'All Formats', value: 'All' },
    { label: 'PDF Documents', value: 'pdf' },
    { label: 'Courses & Chapters', value: 'course' },
    { label: 'Formula Sheets', value: 'formulaSheet' },
    { label: 'Test Papers', value: 'testPaper' },
    { label: 'Worksheets', value: 'worksheet' },
    { label: 'Multi-Image Guides', value: 'multiImage' },
    { label: 'Single Diagrams', value: 'singleImage' },
    { label: 'Videos', value: 'video' },
    { label: 'YouTube Embeds', value: 'youtube' },
    { label: 'Micro Reels', value: 'facebook' },
  ];

  // Debounce search input (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Autocomplete suggestions as user types
  useEffect(() => {
    if (searchInput.trim().length >= 2) {
      searchService.autocomplete(searchInput.trim(), 5).then((suggestions) => {
        setSearchSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      });
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchInput]);

  // Close suggestions dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Database cursor-driven catalogue query
  const loadCatalogue = async (reset: boolean = true) => {
    if (reset) {
      setLoading(true);
      setCursor(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const result = await fetchContentCatalogue(
        {
          classLevel: selectedClass,
          categoryId: selectedCategory,
          subcategoryId: selectedSubcategory,
          accessType: selectedAccessType,
          contentType: selectedContentType,
          difficulty: selectedDifficulty,
          sortBy,
        },
        reset ? null : cursor,
        MAX_PAGE_SIZE
      );

      if (reset) {
        setItems(result.items);
      } else {
        setItems((prev) => [...prev, ...result.items]);
      }
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadCatalogue(true);
  }, [
    selectedClass,
    selectedCategory,
    selectedSubcategory,
    selectedAccessType,
    selectedContentType,
    selectedDifficulty,
    sortBy,
  ]);

  // Client search filtering against currently loaded items or query
  const displayedItems = debouncedQuery
    ? items.filter((item) =>
        item.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        (item.shortDescription && item.shortDescription.toLowerCase().includes(debouncedQuery.toLowerCase())) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(debouncedQuery.toLowerCase())))
      )
    : items;

  return (
    <SharedLayout>
      <SeoHead
        title="Class 5–10 Mathematics Public Catalogue"
        description="Browse worksheets, PDF formula sheets, chapter courses, mock test papers, and video breakdowns for CBSE & ICSE mathematics."
        canonicalUrl="https://mayf.co.in/study-material"
        ogType="website"
      />

      <div className="space-y-8">
        {/* Authoritative Admin Promotional Banner for Catalogue */}
        <PromotionalBanner placement="catalogue" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-heading font-semibold text-[#00687A] mb-1">
              <span>Public Learning Catalogue</span>
              <span aria-hidden="true">·</span>
              <span>Classes 5–10</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#059669] font-bold">Free Materials Unrestricted</span>
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-[#0F172A] tracking-tight">
              Curriculum Study Materials
            </h1>
            <p className="text-sm md:text-base text-[#64748B] mt-1 max-w-2xl">
              Indexed educational resources with direct shareable URLs. Click any card to open in a new tab.
            </p>
          </div>

          {/* Actions: Share & Sort Controls */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <ShareButton
              canonicalUrl="https://mayf.co.in/study-material"
              title="Curriculum Study Materials (Classes 5–10)"
              description="Indexed educational resources with direct shareable URLs for CBSE & ICSE mathematics."
              buttonText="Share Catalogue"
              buttonSize="sm"
            />

            {/* Sort Control */}
            <div className="flex items-center gap-2 bg-white border border-[#CBD5E1] rounded-lg px-3 py-1.5 shadow-xs shrink-0 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span className="text-[#64748B] font-semibold">Sort by:</span>
              <select
                aria-label="Sort Catalogue"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as CatalogueSortOption)}
                className="font-heading font-semibold text-[#0F172A] bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="latest">Latest Published</option>
                <option value="popular">Most Popular (Downloads)</option>
                <option value="most_viewed">Most Viewed</option>
                <option value="alpha">Alphabetical (A–Z)</option>
              </select>
            </div>

            {/* Config: Open cards in new tab */}
            <label className="flex items-center gap-1.5 text-xs text-[#475569] font-medium cursor-pointer select-none px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] shadow-xs shrink-0">
              <input
                type="checkbox"
                checked={openInNewTab}
                onChange={(e) => setOpenInNewTab(e.target.checked)}
                className="rounded border-[#CBD5E1] text-[#1D4ED8] focus:ring-[#1D4ED8] w-3.5 h-3.5 cursor-pointer"
              />
              <span>Open in new tab</span>
            </label>
          </div>
        </div>

        {/* Multi-Faceted Filters & Debounced Autocomplete Search */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-5 shadow-xs space-y-4">
          
          {/* Top Row: Debounced Search & Free/Premium Switcher */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input with Autocomplete Suggestions */}
            <div ref={searchContainerRef} className="relative flex-1">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search formulas, theorems, worksheets, mock papers (e.g. 'BPT', 'cylinder', 'quadratic')..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => {
                  if (searchSuggestions.length > 0) setShowSuggestions(true);
                }}
                className="w-full pl-9 pr-9 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput('');
                    setShowSuggestions(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
                  aria-label="Clear Search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Autocomplete Suggestions Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#CBD5E1] rounded-lg shadow-lg z-30 py-1 overflow-hidden">
                  <div className="px-3 py-1 text-[10px] font-heading font-bold text-[#94A3B8] uppercase">
                    Suggested Topics
                  </div>
                  {searchSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSearchInput(s);
                        setShowSuggestions(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-[#0F172A] hover:bg-[#EFF6FF] hover:text-[#1D4ED8] flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>{s}</span>
                      <ArrowUpRight className="w-3 h-3 text-[#94A3B8]" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Access Type Switcher (Free vs Annual Pass) */}
            <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-lg shrink-0">
              <button
                onClick={() => setSelectedAccessType('All')}
                className={`px-3 py-1 text-xs font-heading font-semibold rounded cursor-pointer transition-colors ${
                  selectedAccessType === 'All' ? 'bg-white text-[#1D4ED8] shadow-xs' : 'text-[#64748B]'
                }`}
              >
                All Access
              </button>
              <button
                onClick={() => setSelectedAccessType('free')}
                className={`px-3 py-1 text-xs font-heading font-semibold rounded cursor-pointer transition-colors ${
                  selectedAccessType === 'free' ? 'bg-white text-[#059669] shadow-xs' : 'text-[#64748B]'
                }`}
              >
                Free Access
              </button>
              <button
                onClick={() => setSelectedAccessType('paid')}
                className={`px-3 py-1 text-xs font-heading font-semibold rounded cursor-pointer transition-colors ${
                  selectedAccessType === 'paid' ? 'bg-white text-[#EA580C] shadow-xs' : 'text-[#64748B]'
                }`}
              >
                Annual Pass
              </button>
            </div>
          </div>

          {/* Row 2: Grade (Class 5–10) Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs text-[#64748B] font-semibold mr-1 shrink-0">Grade:</span>
            {classes.map((cls) => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1 rounded-md text-xs font-heading font-semibold transition-colors shrink-0 cursor-pointer ${
                  selectedClass === cls
                    ? 'bg-[#1D4ED8] text-white shadow-xs'
                    : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>

          {/* Row 3: Category & Dynamic Subcategory */}
          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-[#F1F5F9]">
            {/* Category */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs text-[#64748B] font-semibold mr-1 shrink-0">Category:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedSubcategory('All');
                  }}
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

            {/* Subcategory if selected category has options */}
            {availableSubcategories.length > 1 && (
              <div className="flex items-center gap-1 text-xs ml-auto">
                <span className="text-[#64748B] font-medium">Subtopic:</span>
                <select
                  aria-label="Filter Subcategory"
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  className="bg-[#F8FAFC] border border-[#CBD5E1] rounded px-2 py-0.5 text-xs text-[#0F172A] font-medium focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
                >
                  {availableSubcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Row 4: Format / Content Type & Difficulty Selectors */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#F1F5F9] text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[#64748B] font-semibold">Format:</span>
              <select
                aria-label="Filter Content Type"
                value={selectedContentType}
                onChange={(e) => setSelectedContentType(e.target.value as any)}
                className="bg-[#F8FAFC] border border-[#CBD5E1] rounded px-2 py-1 font-heading text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
              >
                {contentTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[#64748B] font-semibold">Difficulty:</span>
              {(['All', 'Foundation', 'Standard', 'Exemplar / Board'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    selectedDifficulty === diff
                      ? 'bg-[#1E293B] text-white'
                      : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Items Grid */}
        {loading ? (
          <div className="py-20 text-center text-[#64748B] text-xs space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-[#1D4ED8] border-t-transparent animate-spin mx-auto" />
            <p>Querying indexed Firestore catalogue (up to 20 documents via database cursor)...</p>
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center text-[#64748B] space-y-3">
            <p className="text-sm font-heading font-semibold text-[#0F172A]">
              No educational resources match your selected filter combination.
            </p>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              Try adjusting grade levels, subtopics, or reset search terms to view all available resources.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedClass('All');
                setSelectedCategory('All');
                setSelectedSubcategory('All');
                setSelectedAccessType('All');
                setSelectedContentType('All');
                setSelectedDifficulty('All');
                setSearchInput('');
              }}
            >
              Reset All Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedItems.map((item) => (
                /* Content card with configurable openInNewTab */
                <a
                  key={item.id}
                  href={`/study/${item.slug}`}
                  target={openInNewTab ? '_blank' : undefined}
                  rel={openInNewTab ? 'noopener noreferrer' : undefined}
                  className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_4px_14px_-2px_rgba(29,78,216,0.05)] hover:shadow-[0_10px_25px_-2px_rgba(29,78,216,0.12)] transition-all duration-200 flex flex-col justify-between overflow-hidden group block focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                >
                  <div className="p-5">
                    {/* Format and Grade Pills */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded">
                          {item.classLevels.join(', ')}
                        </span>
                        <span className="text-[11px] font-mono text-[#00687A] bg-[#ECFEFF] px-1.5 py-0.5 rounded uppercase font-semibold">
                          {item.contentType}
                        </span>
                      </div>

                      {item.accessType === 'free' ? (
                        <Badge variant="free">FREE</Badge>
                      ) : (
                        <Badge variant="pro">PRO PASS</Badge>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-heading font-bold text-base text-[#0F172A] mb-2 group-hover:text-[#1D4ED8] transition-colors leading-snug">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-[#64748B] leading-relaxed mb-4 line-clamp-2">
                      {item.shortDescription || item.description}
                    </p>

                    {/* Topic metadata */}
                    <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
                      <span className="font-semibold text-[#00687A]">{item.categoryId}</span>
                      <span className="font-mono tabular-nums">{item.viewCount} views</span>
                    </div>
                  </div>

                  {/* Card Bottom Strip */}
                  <div className="bg-[#FAFBFD] border-t border-[#F1F5F9] px-5 py-3 flex items-center justify-between text-xs">
                    <span className="text-[#059669] font-medium font-mono text-[11px]">
                      {item.accessType === 'free' ? 'Public Access' : 'Annual Pass'}
                    </span>
                    <span className="font-heading font-semibold text-[#1D4ED8] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>{openInNewTab ? 'Open in New Tab' : 'Study Resource'}</span>
                      {openInNewTab ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    </span>
                  </div>
                </a>
              ))}
            </div>

            {/* Pagination Button (Strict Cursor Capped at 20 docs per fetch) */}
            {hasMore && (
              <div className="pt-6 text-center">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => loadCatalogue(false)}
                  isLoading={loadingMore}
                  className="font-bold gap-2 px-8"
                >
                  <span>Load More (Next 20 Items)</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
                <p className="text-[11px] text-[#94A3B8] mt-1.5 font-mono">
                  Backed by Firestore indexed cursor queries (startAfter). Max 20 items per request.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </SharedLayout>
  );
};
