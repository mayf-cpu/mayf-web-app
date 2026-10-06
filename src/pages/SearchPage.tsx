import React, { useState } from 'react';
import { Search, BookOpen, Layers, ArrowRight, X } from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { INITIAL_CHAPTERS, INITIAL_FORMULAS } from '../data/curriculumData';
import { Link } from '../context/NavigationContext';

export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');

  const filteredChapters = query.trim()
    ? INITIAL_CHAPTERS.filter(
        (c) =>
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          c.description.toLowerCase().includes(query.toLowerCase()) ||
          c.category.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const filteredFormulas = query.trim()
    ? INITIAL_FORMULAS.filter(
        (f) =>
          f.title.toLowerCase().includes(query.toLowerCase()) ||
          f.plainTextFormula.toLowerCase().includes(query.toLowerCase()) ||
          f.explanation.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const popularSearches = [
    'Quadratic Formula',
    'Pythagoras Theorem',
    'Trigonometric Identities',
    'Volume of Cylinder',
    'Arithmetic Progression',
    'Real Numbers',
  ];

  return (
    <SharedLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Title */}
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F172A] tracking-tight">
            Curriculum & Formula Search
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Instantly search across Class 5–10 chapters, formulas, identities, and theorems.
          </p>
        </div>

        {/* Big Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            autoFocus
            placeholder="Type any formula name, theorem, or math topic (e.g., 'cylinder', 'discriminant')..."
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
          <div className="space-y-8">
            
            {/* Formulas Found */}
            <div>
              <div className="flex items-center gap-2 text-xs font-heading font-bold text-[#00687A] uppercase tracking-wider mb-3">
                <Layers className="w-4 h-4 text-[#06B6D4]" />
                <span>Matching Formulas ({filteredFormulas.length})</span>
              </div>

              {filteredFormulas.length === 0 ? (
                <div className="text-xs text-[#94A3B8] italic p-4 bg-white rounded-lg border border-[#E2E8F0]">
                  No formula cards match "{query}".
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFormulas.map((f) => (
                    <Link
                      key={f.id}
                      href={`/formula/${f.slug}`}
                      className="block p-4 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#1D4ED8] rounded-lg transition-all group"
                    >
                      <div className="flex items-center justify-between text-xs text-[#64748B] mb-1">
                        <span className="font-semibold text-[#00687A]">{f.category}</span>
                        <span>{f.applicableClasses.join(', ')}</span>
                      </div>
                      <div className="font-heading font-bold text-sm sm:text-base text-[#0F172A] group-hover:text-[#1D4ED8] transition-colors">
                        {f.title}
                      </div>
                      <div className="font-mono text-xs font-semibold text-[#0037B0] bg-[#F0F9FF] rounded px-2 py-1 my-2 inline-block">
                        {f.plainTextFormula}
                      </div>
                      <p className="text-xs text-[#64748B] line-clamp-1">{f.explanation}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Chapters Found */}
            <div>
              <div className="flex items-center gap-2 text-xs font-heading font-bold text-[#00687A] uppercase tracking-wider mb-3">
                <BookOpen className="w-4 h-4 text-[#06B6D4]" />
                <span>Matching Chapters & Study Modules ({filteredChapters.length})</span>
              </div>

              {filteredChapters.length === 0 ? (
                <div className="text-xs text-[#94A3B8] italic p-4 bg-white rounded-lg border border-[#E2E8F0]">
                  No study chapters match "{query}".
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredChapters.map((c) => (
                    <Link
                      key={c.id}
                      href={`/study/${c.slug}`}
                      className="block p-4 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#1D4ED8] rounded-lg transition-all group"
                    >
                      <div className="flex items-center justify-between text-xs text-[#64748B] mb-1">
                        <span className="font-semibold text-[#1D4ED8]">{c.classLevel}</span>
                        <span>{c.category}</span>
                      </div>
                      <div className="font-heading font-bold text-sm sm:text-base text-[#0F172A] group-hover:text-[#1D4ED8] transition-colors">
                        {c.title}
                      </div>
                      <p className="text-xs text-[#64748B] mt-1 line-clamp-2">{c.description}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </SharedLayout>
  );
};
