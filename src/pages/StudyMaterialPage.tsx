import React, { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, ArrowRight, Sparkles, FileText, Download, CheckCircle2 } from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { StudentClass, MathSubjectCategory, ContentItem, ContentType, ContentAccessType } from '../lib/firebase/types';
import { Link, useNavigation } from '../context/NavigationContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { fetchContentCatalogue, MAX_PAGE_SIZE } from '../lib/catalogue/catalogueService';
import { QueryDocumentSnapshot } from 'firebase/firestore';

export const StudyMaterialPage: React.FC = () => {
  const { currentRoute } = useNavigation();
  const classFromQuery = currentRoute.searchParams.get('class') as StudentClass | null;

  const [selectedClass, setSelectedClass] = useState<StudentClass | 'All'>(
    classFromQuery || 'Class 10'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAccessType, setSelectedAccessType] = useState<ContentAccessType | 'All'>('All');
  const [selectedContentType, setSelectedContentType] = useState<ContentType | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Efficient cursor-based catalogue loader (Maximum 20 items per page)
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
          accessType: selectedAccessType,
          contentType: selectedContentType,
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
  }, [selectedClass, selectedCategory, selectedAccessType, selectedContentType]);

  const filteredItems = searchQuery.trim()
    ? items.filter(
        (i) =>
          i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (i.shortDescription && i.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : items;

  return (
    <SharedLayout>
      <div className="space-y-8">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-xs font-heading font-semibold text-[#00687A] mb-1">
            <span>CBSE & ICSE Math Curriculum</span>
            <span aria-hidden="true">·</span>
            <span>Classes 5–10</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#059669] font-bold">Free Materials Unrestricted</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-[#0F172A] tracking-tight">
            Study Material & Chapter Modules
          </h1>
          <p className="text-sm md:text-base text-[#64748B] mt-1 max-w-2xl">
            In-depth conceptual breakdowns, key theorems, formula sheets, and step-by-step solved exemplars. Free material requires no sign-in.
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

            {/* Access Type Switcher */}
            <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-lg shrink-0">
              <button
                onClick={() => setSelectedAccessType('All')}
                className={`px-2.5 py-1 text-xs font-heading font-semibold rounded cursor-pointer ${
                  selectedAccessType === 'All' ? 'bg-white text-[#1D4ED8] shadow-xs' : 'text-[#64748B]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedAccessType('free')}
                className={`px-2.5 py-1 text-xs font-heading font-semibold rounded cursor-pointer ${
                  selectedAccessType === 'free' ? 'bg-white text-[#059669] shadow-xs' : 'text-[#64748B]'
                }`}
              >
                Free Access
              </button>
              <button
                onClick={() => setSelectedAccessType('paid')}
                className={`px-2.5 py-1 text-xs font-heading font-semibold rounded cursor-pointer ${
                  selectedAccessType === 'paid' ? 'bg-white text-[#EA580C] shadow-xs' : 'text-[#64748B]'
                }`}
              >
                Annual Pass
              </button>
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

        {/* Content Items Grid */}
        {loading ? (
          <div className="py-16 text-center text-[#64748B] text-xs">
            Querying Firestore catalogue (up to 20 documents via cursor)...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-12 text-center text-[#64748B]">
            <p className="text-sm">No items found matching your filters.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setSelectedClass('All');
                setSelectedCategory('All');
                setSelectedAccessType('All');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg border border-[#E2E8F0] shadow-[0_4px_14px_-2px_rgba(29,78,216,0.05)] hover:shadow-[0_8px_20px_-2px_rgba(29,78,216,0.1)] transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded">
                          {item.classLevels.join(', ')}
                        </span>
                        <span className="text-[11px] font-mono text-[#00687A] bg-[#ECFEFF] px-1.5 py-0.5 rounded uppercase">
                          {item.contentType}
                        </span>
                      </div>
                      {item.accessType === 'free' ? (
                        <Badge variant="free">FREE PREVIEW</Badge>
                      ) : (
                        <Badge variant="pro">ANNUAL PASS</Badge>
                      )}
                    </div>

                    <h3 className="font-heading font-bold text-base text-[#0F172A] mb-2 group-hover:text-[#1D4ED8] transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs text-[#64748B] leading-relaxed mb-4 line-clamp-2">
                      {item.shortDescription || item.description}
                    </p>

                    <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
                      <span className="font-semibold text-[#00687A]">{item.categoryId}</span>
                      <span className="font-mono tabular-nums">{item.viewCount} views</span>
                    </div>
                  </div>

                  <div className="bg-[#FAFBFD] border-t border-[#F1F5F9] px-5 py-3 flex items-center justify-between text-xs">
                    <span className="text-[#059669] font-medium font-mono">
                      {item.accessType === 'free' ? 'No Login Required' : 'Annual Pass'}
                    </span>
                    <Link
                      href={item.contentType === 'formulaSheet' ? `/formula/${item.slug}` : `/study/${item.slug}`}
                      className="font-heading font-semibold text-[#1D4ED8] hover:underline flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Open Material</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Cursor Controls (Database Query Cursor) */}
            {hasMore && (
              <div className="pt-4 text-center">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => loadCatalogue(false)}
                  isLoading={loadingMore}
                  className="font-bold gap-2 px-6"
                >
                  <span>Load Next Page (Max 20 documents)</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <p className="text-[11px] text-[#94A3B8] mt-1.5">
                  Uses Firestore query cursors. Never loads full database into browser memory.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </SharedLayout>
  );
};
