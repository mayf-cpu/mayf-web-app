import React from 'react';
import { Bookmark, ArrowRight, Layers } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { INITIAL_FORMULAS } from '../data/curriculumData';
import { FormulaCard } from '../components/ui/FormulaCard';
import { Button } from '../components/ui/Button';
import { Link } from '../context/NavigationContext';

export const DashboardSavedPage: React.FC = () => {
  const { savedItemIds } = useAuth();

  const savedFormulas = INITIAL_FORMULAS.filter((f) => savedItemIds.includes(f.id));

  return (
    <DashboardLayout
      title="Saved Formulas & Chapters"
      subtitle="Your starred mathematical identity cards and quick reference bookmarks."
    >
      <div className="space-y-6">
        {savedFormulas.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-12 text-center text-[#64748B] space-y-3">
            <div className="w-12 h-12 bg-[#F1F5F9] rounded-full flex items-center justify-center mx-auto text-[#94A3B8]">
              <Bookmark className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-base text-[#0F172A]">
              No Saved Formulas Yet
            </h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              Click the bookmark icon on any formula card across the Formula Deck to store it here for swift revision before exams.
            </p>
            <Link href="/formula-deck">
              <Button size="sm" variant="primary">
                Browse Formula Deck
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedFormulas.map((f) => (
              <FormulaCard key={f.id} formula={f} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
