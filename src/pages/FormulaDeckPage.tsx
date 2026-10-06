import React, { useState } from 'react';
import { Search, Filter, Layers, Sparkles } from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { FormulaCard } from '../components/ui/FormulaCard';
import { INITIAL_FORMULAS } from '../data/curriculumData';
import { StudentClass, MathSubjectCategory } from '../lib/firebase/types';
import { Button } from '../components/ui/Button';

export const FormulaDeckPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedClass, setSelectedClass] = useState<StudentClass | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    'All',
    'Algebra',
    'Geometry',
    'Trigonometry',
    'Mensuration',
    'Coordinate Geometry',
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

  const filteredFormulas = INITIAL_FORMULAS.filter((f) => {
    const matchesCategory = selectedCategory === 'All' || f.category === selectedCategory;
    const matchesClass =
      selectedClass === 'All' || f.applicableClasses.includes(selectedClass as StudentClass);
    const matchesSearch =
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.plainTextFormula.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.explanation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesClass && matchesSearch;
  });

  return (
    <SharedLayout>
      <div className="space-y-8">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-xs font-heading font-semibold text-[#00687A] mb-1">
            <span>Visual Mathematical Memory</span>
            <span aria-hidden="true">·</span>
            <span>Classes 5–10</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-[#0F172A] tracking-tight">
            Interactive Formula Deck
          </h1>
          <p className="text-sm md:text-base text-[#64748B] mt-1 max-w-2xl">
            Cleanly typeset mathematical identities with variable specifications, mnemonics, and instant copy affordances.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search formulas (e.g. Sridharacharya, cylinder, Pythagoras, sin²θ)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>

            <div className="text-xs text-[#64748B] shrink-0 font-medium">
              Showing <span className="font-bold text-[#0F172A]">{filteredFormulas.length}</span> formulas
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs text-[#64748B] font-semibold mr-1 shrink-0">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-md text-xs font-heading font-semibold transition-colors shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#1D4ED8] text-white'
                    : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs text-[#64748B] font-semibold mr-1 shrink-0">Standard:</span>
            {classes.map((cls) => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                  selectedClass === cls
                    ? 'bg-[#06B6D4] text-white'
                    : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9]'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>

        {/* Formulas Grid */}
        {filteredFormulas.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-12 text-center text-[#64748B]">
            <p className="text-sm">No formulas found matching your filters.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setSelectedCategory('All');
                setSelectedClass('All');
                setSearchQuery('');
              }}
            >
              Reset Filters
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
    </SharedLayout>
  );
};
