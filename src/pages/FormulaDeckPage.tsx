import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  Layers,
  Sparkles,
  Bookmark,
  Share2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  SlidersHorizontal,
  LayoutGrid,
  CreditCard,
  Check,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { FormulaCard } from '../components/ui/FormulaCard';
import { FORMULA_DECK_ITEMS, FORMULA_CATEGORIES } from '../data/formulaDeckData';
import { StudentClass, FormulaCategory } from '../lib/firebase/types';
import { Button } from '../components/ui/Button';
import { Link, useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import katex from 'katex';

export const FormulaDeckPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { savedItemIds } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedClass, setSelectedClass] = useState<StudentClass | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'swipe'>('grid');

  // Swipe Deck / Flashcard Index
  const [swipeIndex, setSwipeIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const categories: (string | FormulaCategory)[] = [
    'All',
    'Arithmetic',
    'Fractions',
    'Algebra',
    'Geometry',
    'Mensuration',
    'Coordinate Geometry',
    'Statistics',
    'Probability',
    'Trigonometry',
  ];

  const classes: (StudentClass | 'All')[] = [
    'All',
    'Class 5',
    'Class 6',
    'Class 7',
    'Class 8',
    'Class 9',
    'Class 10',
  ];

  const filteredFormulas = useMemo(() => {
    return FORMULA_DECK_ITEMS.filter((f) => {
      const matchesCategory = selectedCategory === 'All' || f.category === selectedCategory;
      const matchesClass =
        selectedClass === 'All' || f.applicableClasses.includes(selectedClass as StudentClass);
      const matchesFavorite = !favoritesOnly || savedItemIds.includes(f.id);

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        f.title.toLowerCase().includes(q) ||
        f.plainTextFormula.toLowerCase().includes(q) ||
        f.explanation.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.tags?.some((t) => t.toLowerCase().includes(q)) ||
        f.variables?.some(
          (v) => v.symbol.toLowerCase().includes(q) || v.meaning.toLowerCase().includes(q)
        );

      return matchesCategory && matchesClass && matchesFavorite && matchesSearch;
    });
  }, [selectedCategory, selectedClass, favoritesOnly, searchQuery, savedItemIds]);

  // Keep swipeIndex in bounds
  useEffect(() => {
    if (swipeIndex >= filteredFormulas.length && filteredFormulas.length > 0) {
      setSwipeIndex(0);
    }
  }, [filteredFormulas.length, swipeIndex]);

  // Touch handlers for mobile swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // Swiped Left -> Next formula
      handleNextSwipe();
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Previous formula
      handlePrevSwipe();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  const handleNextSwipe = () => {
    if (filteredFormulas.length === 0) return;
    setSwipeIndex((prev) => (prev + 1) % filteredFormulas.length);
  };

  const handlePrevSwipe = () => {
    if (filteredFormulas.length === 0) return;
    setSwipeIndex((prev) => (prev - 1 + filteredFormulas.length) % filteredFormulas.length);
  };

  // Keyboard navigation for swipe mode
  useEffect(() => {
    if (viewMode !== 'swipe') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'j') {
        handleNextSwipe();
      } else if (e.key === 'ArrowLeft' || e.key === 'k') {
        handlePrevSwipe();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, filteredFormulas.length]);

  const activeSwipeFormula = filteredFormulas[swipeIndex] || filteredFormulas[0];

  const renderedSwipeLatex = useMemo(() => {
    if (!activeSwipeFormula?.latexFormula) return null;
    try {
      return katex.renderToString(activeSwipeFormula.latexFormula, {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return null;
    }
  }, [activeSwipeFormula?.latexFormula]);

  return (
    <SharedLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-sky-950 text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-md">
          {/* Decorative Background Elements */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center text-9xl font-mono select-none">
            ∑√π
          </div>

          <div className="relative z-10 max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-cyan-300 border border-cyan-400/30 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Formula Deck · Classes 5–10 NCERT Curriculum</span>
            </div>

            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl tracking-tight text-white">
              Formula Deck
            </h1>

            <p className="text-sm md:text-base text-blue-100/90 leading-relaxed">
              Every mathematical identity from Arithmetic to Trigonometry. Every formula is a standalone, indexable document with KaTeX mathematical typesetting, variable definitions, and step-by-step worked exemplars.
            </p>

            <div className="flex items-center gap-4 pt-2 text-xs text-blue-200">
              <span>{FORMULA_DECK_ITEMS.length} Total Formulas</span>
              <span aria-hidden="true">·</span>
              <span>9 Subject Categories</span>
              <span aria-hidden="true">·</span>
              <span>Direct shareable URLs (/formula/[slug])</span>
            </div>
          </div>
        </div>

        {/* Filter Controls Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
          
          {/* Top row: Search input + View mode toggle + Favorites toggle */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search formulas (e.g. Sridharacharya, cylinder volume, Pythagoras, section formula, LCM)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Favorites toggle */}
              <button
                onClick={() => setFavoritesOnly(!favoritesOnly)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                  favoritesOnly
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-amber-500 text-amber-500' : ''}`} />
                <span>Favorites ({savedItemIds.length})</span>
              </button>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setViewMode('grid')}
                  title="Grid Browse View"
                  className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>

                <button
                  onClick={() => setViewMode('swipe')}
                  title="Swipeable Card Deck View"
                  className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    viewMode === 'swipe'
                      ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Flashcard Deck</span>
                </button>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs text-slate-500 font-semibold mr-1 shrink-0">
                Category:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-blue-700 text-white shadow-xs scale-102'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Standard / Class Level Tabs */}
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs text-slate-500 font-semibold mr-1 shrink-0">
                Standard:
              </span>
              {classes.map((cls) => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                    selectedClass === cls
                      ? 'bg-cyan-600 text-white font-semibold'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500 shrink-0 font-medium">
              Showing <span className="font-bold text-slate-900">{filteredFormulas.length}</span> formulas
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW MODE 1: SWIPEABLE FLASHCARD DECK (Mobile & Desktop) */}
        {/* ======================================================== */}
        {viewMode === 'swipe' && filteredFormulas.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-2">
              <span>Card {swipeIndex + 1} of {filteredFormulas.length}</span>
              <span className="hidden sm:inline text-slate-400">
                Tip: Swipe on mobile touch screen or use ← → arrow keys
              </span>
            </div>

            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="bg-white rounded-2xl border-2 border-blue-200 shadow-lg p-6 sm:p-10 relative overflow-hidden transition-all duration-300 min-h-[380px] flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 text-xs font-bold">
                      {activeSwipeFormula.category}
                    </span>
                    <span className="text-xs text-slate-500">
                      {activeSwipeFormula.applicableClasses.join(', ')}
                    </span>
                  </div>

                  <span className="text-xs font-mono text-slate-400">
                    /formula/{activeSwipeFormula.slug}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900">
                  {activeSwipeFormula.title}
                </h2>

                {/* KaTeX Display */}
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-6 text-center my-4 overflow-x-auto">
                  {renderedSwipeLatex ? (
                    <div
                      className="text-blue-900 text-xl sm:text-2xl font-semibold"
                      dangerouslySetInnerHTML={{ __html: renderedSwipeLatex }}
                    />
                  ) : (
                    <div className="font-mono text-xl sm:text-2xl font-bold text-blue-900">
                      {activeSwipeFormula.plainTextFormula}
                    </div>
                  )}
                </div>

                <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-2xl">
                  {activeSwipeFormula.explanation}
                </p>

                {/* Variables summary */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="text-xs font-bold text-slate-700 uppercase mb-2">
                    Variables Specification:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {activeSwipeFormula.variables.map((v, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="font-mono font-bold text-blue-700">{v.symbol}:</span>
                        <span className="text-slate-600">{v.meaning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Card Footer with Previous / Next and Full Document Link */}
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevSwipe}
                    className="gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous Card</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextSwipe}
                    className="gap-1.5"
                  >
                    <span>Next Card</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                <Link
                  href={`/formula/${activeSwipeFormula.slug}`}
                  className="w-full sm:w-auto"
                >
                  <Button variant="primary" size="sm" className="gap-2 w-full">
                    <span>Open Full Formula Document & Worked Exemplar</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW MODE 2: GRID BROWSING */}
        {/* ======================================================== */}
        {viewMode === 'grid' && (
          <div>
            {filteredFormulas.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
                <p className="text-sm font-medium">No formulas found matching your filter criteria.</p>
                <p className="text-xs text-slate-400">Try choosing "All" categories or resetting search queries.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedClass('All');
                    setFavoritesOnly(false);
                    setSearchQuery('');
                  }}
                  className="mt-2"
                >
                  Reset All Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFormulas.map((formula) => (
                  <FormulaCard key={formula.id} formula={formula} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Categories Directory Grid at bottom */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-base text-slate-900">
              Browse Formulas by Curriculum Domain
            </h3>
            <span className="text-xs text-slate-500">Class 5 to 10 Standard</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FORMULA_CATEGORIES.map((c) => {
              const count = FORMULA_DECK_ITEMS.filter((f) => f.category === c.id).length;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCategory(c.id);
                    setViewMode('grid');
                    window.scrollTo({ top: 200, behavior: 'smooth' });
                  }}
                  className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    selectedCategory === c.id
                      ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-2xl shrink-0 p-1 bg-white rounded-md border border-slate-200/80 shadow-2xs">
                    {c.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {c.label}
                      </span>
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                        {count}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {c.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </SharedLayout>
  );
};
