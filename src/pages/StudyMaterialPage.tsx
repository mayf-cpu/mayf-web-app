import {useClassification} from '../lib/cms/useClassification';
import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, BookOpen, ArrowUpRight, ArrowRight, Sparkles, FileText, Download, CheckCircle2, Eye, X, ArrowUpDown, ChevronDown } from 'lucide-react';
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
import { AdSensePlacement } from '../components/adsense/AdSensePlacement';
import { Link } from '../context/NavigationContext';
import { CardSkeleton } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { trackSearch } from '../lib/analytics/analyticsService';

const FilterDropdown: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & {label: string}> = ({label, children, ...props}) => {
  const id = React.useId();
  return (
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-slate-500">{label}</label>
      <div className="relative">
        <select {...props} id={id} className="min-h-11 w-full min-w-0 appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-9 text-sm font-medium text-slate-800 shadow-xs transition-colors hover:border-slate-300 hover:bg-white focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 disabled:cursor-not-allowed disabled:text-slate-400">
          {children}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
      </div>
    </div>
  );
};

export const StudyMaterialPage: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [selectedAccessType, setSelectedAccessType] = useState<ContentAccessType | 'All'>('All');
  const [selectedContentType, setSelectedContentType] = useState<ContentType | 'All'>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'All'>('All');
  const [sortBy, setSortBy] = useState<CatalogueSortOption>('latest');
  const openInNewTab = false;

  // Debounced search state
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Pagination states (strict cursor-based pagination, maximum 20 items per page)
  const requestSequence = useRef(0);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {settings:classification}=useClassification();
  const classes=['All',...classification.grades];
  const categories=['All',...Object.keys(classification.subjects)];
  const subcategoryMap:Record<string,string[]>=Object.fromEntries(Object.entries(classification.subjects).map(([subject,topics])=>[subject,['All',...topics]]));

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
    { label: 'Long videos', value: 'video' },
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

  // Track catalogue search events
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      trackSearch({
        search_term: debouncedQuery,
        results_count: items.length,
        category_filter: selectedCategory !== 'All' ? selectedCategory : undefined,
        class_filter: selectedClass !== 'All' ? selectedClass : undefined,
      });
    }
  }, [debouncedQuery]);

  // Autocomplete suggestions as user types
  useEffect(() => {
    if (searchInput.trim().length >= 2) {
      searchService.autocomplete(searchInput.trim(), 5).then((suggestions) => {
        setSearchSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      }).catch(() => { setSearchSuggestions([]); setShowSuggestions(false); });
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
    const sequence = ++requestSequence.current;
    if (reset) {
      setLoading(true);
      setCursor(null);
      setErrorMessage(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const result = await fetchContentCatalogue(
        {
          search: debouncedQuery,
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

      if (sequence !== requestSequence.current) return;
      if (reset) {
        setItems(result.items);
      } else {
        setItems((prev) => [...prev, ...result.items]);
      }
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
      setErrorMessage(null);
    } catch (err: any) {
      if (sequence !== requestSequence.current) return;
      console.error('[StudyMaterialPage] Catalogue fetch error:', err);
      setErrorMessage(err?.message || 'Unable to load curriculum study materials. Please check your network connection and retry.');
    } finally {
      if (sequence === requestSequence.current) { setLoading(false); setLoadingMore(false); }
    }
  };

  useEffect(() => {
    loadCatalogue(true);
    return () => { requestSequence.current++; };
  }, [
    debouncedQuery,
    selectedClass,
    selectedCategory,
    selectedSubcategory,
    selectedAccessType,
    selectedContentType,
    selectedDifficulty,
    sortBy,
  ]);

  const displayedItems = items;

  return (
    <SharedLayout>
      <SeoHead
        title="Class 5–10 Mathematics Public Catalogue | Maths at Your Fingertips"
        description="Browse worksheets, PDF formula sheets, chapter courses, mock test papers, and video breakdowns for CBSE & ICSE mathematics."
        canonicalUrl="/study-material"
        ogType="website"
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Study Material', item: '/study-material' },
        ]}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Class 5–10 Mathematics Study Material & Resources',
          description: 'Official catalogue of CBSE & ICSE math formulas, worksheets, and chapter blueprints.',
          publisher: {
            '@type': 'Organization',
            name: 'Maths at Your Fingertips',
            url: 'https://mayf.co.in',
          },
        }}
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
              Indexed educational resources with direct shareable URLs. Select a resource to study it on this site.
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


          </div>
        </div>

        {/* Multi-Faceted Filters & Debounced Autocomplete Search */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-5 shadow-xs space-y-4">
          
          {/* Full-width search with autocomplete */}
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

          </div>

          <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 border-t border-slate-100 pt-4">
            <FilterDropdown label="Grade" aria-label="Filter Grade" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              {classes.map(grade => <option key={grade} value={grade}>{grade === 'All' ? 'All Grades' : grade}</option>)}
            </FilterDropdown>
            <FilterDropdown label="Category" aria-label="Filter Category" value={selectedCategory} onChange={e => {setSelectedCategory(e.target.value); setSelectedSubcategory('All');}}>
              {categories.map(category => <option key={category} value={category}>{category === 'All' ? 'All Categories' : category}</option>)}
            </FilterDropdown>
            <FilterDropdown label="Subtopic" aria-label="Filter Subcategory" value={selectedSubcategory} disabled={availableSubcategories.length <= 1} onChange={e => setSelectedSubcategory(e.target.value)}>
              {availableSubcategories.map(subtopic => <option key={subtopic} value={subtopic}>{subtopic === 'All' ? 'All Subtopics' : subtopic}</option>)}
            </FilterDropdown>
            <FilterDropdown label="Format" aria-label="Filter Content Type" value={selectedContentType} onChange={e => setSelectedContentType(e.target.value as ContentType | 'All')}>
              {contentTypes.map(format => <option key={format.value} value={format.value}>{format.label}</option>)}
            </FilterDropdown>
            <FilterDropdown label="Difficulty" aria-label="Filter Difficulty" value={selectedDifficulty} onChange={e => setSelectedDifficulty(e.target.value as DifficultyLevel | 'All')}>
              {(['All', 'Foundation', 'Standard', 'Exemplar / Board'] as const).map(difficulty => <option key={difficulty} value={difficulty}>{difficulty === 'All' ? 'All Levels' : difficulty}</option>)}
            </FilterDropdown>
            <FilterDropdown label="Access" aria-label="Filter Access" value={selectedAccessType} onChange={e => setSelectedAccessType(e.target.value as ContentAccessType | 'All')}>
              <option value="All">All Access</option>
              <option value="free">Free Access</option>
              <option value="paid">Annual Pass</option>
            </FilterDropdown>
          </div>
        </div>

        {/* Content Items Grid & Network States */}
        {loading ? (
          <div className="space-y-4">
            <div className="text-xs text-[#64748B] flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-[#1D4ED8] border-t-transparent rounded-full animate-spin" />
              <span>Loading curriculum catalogue...</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <CardSkeleton key={idx} />
              ))}
            </div>
          </div>
        ) : errorMessage ? (
          <ErrorState
            title="Failed to Load Study Materials"
            description={errorMessage}
            onRetry={() => loadCatalogue(true)}
            actionText="Retry Loading Catalogue"
          />
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
                /* Content card with SPA routing */
                <Link
                  key={item.id}
                  href={`/study/${item.slug}`}
                  openInNewTab={openInNewTab}
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

                    {/* Title with break-words and tooltip for long titles */}
                    <h3
                      className="font-heading font-bold text-base text-[#0F172A] mb-2 group-hover:text-[#1D4ED8] transition-colors leading-snug line-clamp-2 break-words"
                      title={item.title}
                    >
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-[#64748B] leading-relaxed mb-4 line-clamp-2 break-words">
                      {item.shortDescription || item.description}
                    </p>

                    {/* Topic metadata */}
                    <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
                      <span className="font-semibold text-[#00687A] truncate max-w-[150px]">{item.categoryId}</span>
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
                </Link>
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
                  Showing up to 20 resources per page.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Reusable Child-Safe AdSense Placement for Catalogue */}
        <AdSensePlacement zone="catalogue" />

      </div>
    </SharedLayout>
  );
};
