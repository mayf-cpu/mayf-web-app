import React from 'react';
import { HelpCircle, ArrowLeft, Home, Search, Layers } from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { Button } from '../components/ui/Button';
import { Link, useNavigation } from '../context/NavigationContext';

export const NotFoundPage: React.FC = () => {
  const { currentRoute, goBack } = useNavigation();

  return (
    <SharedLayout>
      <div className="max-w-md mx-auto text-center py-12 sm:py-20 space-y-6">
        
        {/* Mathematical Glyph Graphic */}
        <div className="w-20 h-20 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] font-heading font-extrabold text-4xl flex items-center justify-center mx-auto shadow-xs">
          404
        </div>

        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F172A] tracking-tight">
            Mathematics Theorem Not Found
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-2 leading-relaxed">
            The path <code className="font-mono text-[#0037B0] bg-[#F1F5F9] px-1.5 py-0.5 rounded">{currentRoute.path}</code> does not exist in our Class 5–10 syllabus index.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/">
            <Button size="md" variant="primary" className="gap-2 w-full sm:w-auto">
              <Home className="w-4 h-4" />
              <span>Return to Home</span>
            </Button>
          </Link>

          <Link href="/search">
            <Button size="md" variant="outline" className="gap-2 w-full sm:w-auto">
              <Search className="w-4 h-4" />
              <span>Search Syllabus</span>
            </Button>
          </Link>
        </div>

        {/* Quick Suggestions */}
        <div className="pt-6 border-t border-[#E2E8F0] text-xs text-[#64748B] space-y-2">
          <span className="font-semibold text-[#00687A]">Popular Destinations:</span>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/study-material" className="hover:text-[#1D4ED8] hover:underline">
              Study Material
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/formula-deck" className="hover:text-[#1D4ED8] hover:underline">
              Formula Deck
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/ai-teacher" className="hover:text-[#1D4ED8] hover:underline">
              AI Teacher
            </Link>
          </div>
        </div>

      </div>
    </SharedLayout>
  );
};
