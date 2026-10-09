import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Layers, ArrowRight, X, Sparkles } from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { SeoHead } from '../components/common/SeoHead';
import { Link } from '../context/NavigationContext';
import { AdSensePlacement } from '../components/adsense/AdSensePlacement';
import { searchService } from '../lib/search/lightweightSearchService';
import { SearchResultItem } from '../lib/search/searchInterface';
import { trackSearch } from '../lib/analytics/analyticsService';

export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const popularSearches = [
    'Quadratic Formula',
    'Pythagoras Theorem',
    'Trigonometric Identities',
    'Surface Area of Cylinder',
    'Arithmetic Progression',
    'Real Numbers',
  ];

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [items, auto] = await Promise.all([
          searchService.search({ query, limit: 15 }),
          searchService.autocomplete(query, 5),
        ]);
        setResults(items);
        setSuggestions(auto);

        // GA4 / Firebase Analytics search event
        if (query.trim().length >= 2) {
          trackSearch({
            search_term: query.trim(),
            results_count: items.length,
          });
        }
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <SharedLayout>
      <SeoHead
        title="Search Mathematical Syllabus & Formulas"
        description="Search Class 5–10 math formulas, geometry theorems, and solved exemplars."
        canonicalUrl="/search"
        noindex={Boolean(query.trim())}
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Search', item: '/search' },
        ]}
      />
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Title */}
        <div>
          <div className="flex items-center gap-2 text-xs font-heading font-semibold text-[#00687A] mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Pluggable Search Service · Normalized Tokens & Prefixes</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F172A] tracking-tight">
            Curriculum & Formula Search
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Instantly search across Class 5–10 chapters, formulas, identities, and theorems.
          </p>
        </div>

        {/* Big Search Input with Autocomplete */}
        <div className="relative">
          <Search className="w-5 h-5 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            autoFocus
            placeholder="Type any formula name, theorem, or math topic (e.g. 'cylinder', 'pythagoras')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3.5 bg-white border border-[#CBD5E1] rounded-xl text-sm sm:text-base text-[#0F172A] shadow-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#94A3B8] hover:text-[#475569] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Autocomplete suggestions bar */}
        {suggestions.length > 0 && query.trim() && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[#64748B] font-semibold shrink-0">Suggestions:</span>
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(s)}
                className="bg-[#EFF6FF] text-[#1D4ED8] hover:bg-[#DBEAFE] px-2.5 py-0.5 rounded-full shrink-0 font-medium cursor-pointer transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Popular Tags when search is empty */}
        {!query.trim() && (
          <div className="space-y-3 pt-2">
            <div className="text-xs font-heading font-bold text-[#64748B] uppercase tracking-wider">
              Frequently Searched Topics:
            </div>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-3 py-1.5 bg-white hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#1D4ED8]/40 rounded-full text-xs text-[#334155] hover:text-[#1D4ED8] transition-colors cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {query.trim() && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[#64748B]">
              <span className="font-medium">
                Found <strong className="text-[#0F172A]">{results.length}</strong> matches for "{query}"
              </span>
              {isSearching && <span className="text-[#1D4ED8]">Indexing matches...</span>}
            </div>

            {results.length === 0 && !isSearching ? (
              <div className="text-xs text-[#94A3B8] italic p-6 bg-white rounded-lg border border-[#E2E8F0] text-center">
                No matching formula cards or study modules found for "{query}".
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((item) => (
                  <Link
                    key={item.id}
                    href={item.url}
                    className="block p-4 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#1D4ED8] rounded-lg transition-all group shadow-xs"
                  >
                    <div className="flex items-center justify-between text-xs text-[#64748B] mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#00687A]">{item.category}</span>
                        {item.classLevel && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{item.classLevel}</span>
                          </>
                        )}
                      </div>
                      <span className="text-[11px] font-mono uppercase bg-[#F1F5F9] px-2 py-0.5 rounded text-[#475569]">
                        {item.type}
                      </span>
                    </div>

                    <div className="font-heading font-bold text-sm sm:text-base text-[#0F172A] group-hover:text-[#1D4ED8] transition-colors">
                      {item.title}
                    </div>

                    <p className="text-xs text-[#64748B] mt-1 line-clamp-2 leading-relaxed">
                      {item.snippet}
                    </p>

                    <div className="mt-2 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px]">
                      <span className="font-medium text-[#059669]">
                        {item.accessType === 'free' ? 'Free Material' : 'Annual Pass'}
                      </span>
                      <span className="text-[#1D4ED8] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Open Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reusable Child-Safe AdSense Placement for Search */}
        <AdSensePlacement zone="search" />

      </div>
    </SharedLayout>
  );
};
