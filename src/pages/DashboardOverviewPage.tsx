import React from 'react';
import { BookOpen, Layers, Bot, Flame, ArrowRight, Award, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { Link } from '../context/NavigationContext';
import { INITIAL_CHAPTERS, INITIAL_FORMULAS } from '../data/curriculumData';
import { Button } from '../components/ui/Button';

export const DashboardOverviewPage: React.FC = () => {
  const { user } = useAuth();
  const currentClass = user?.studentClass || 'Class 10';

  const upcomingChapters = INITIAL_CHAPTERS.filter((c) => c.classLevel === currentClass).slice(0, 3);
  const keyFormulas = INITIAL_FORMULAS.filter((f) => f.applicableClasses.includes(currentClass)).slice(0, 2);

  return (
    <DashboardLayout
      title="Learning Dashboard"
      subtitle={`Welcome back! Track your revision progress for ${currentClass}.`}
    >
      <div className="space-y-8">
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-xs">
            <div className="text-xs text-[#64748B] font-semibold uppercase tracking-wider mb-1">
              Revision Streak
            </div>
            <div className="flex items-baseline gap-2 font-mono tabular-nums text-2xl sm:text-3xl font-extrabold text-[#EA580C]">
              <span>{user?.streakDays || 1} Days</span>
              <Flame className="w-5 h-5 fill-[#F97316] text-[#EA580C]" />
            </div>
            <div className="text-[11px] text-[#059669] font-medium mt-1">
              Top 5% consistency this week
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-xs">
            <div className="text-xs text-[#64748B] font-semibold uppercase tracking-wider mb-1">
              Formulas Mastered
            </div>
            <div className="font-mono tabular-nums text-2xl sm:text-3xl font-extrabold text-[#1D4ED8]">
              24 <span className="text-sm font-sans text-[#64748B] font-normal">/ 84</span>
            </div>
            <div className="text-[11px] text-[#64748B] mt-1">
              28% syllabus formula retention
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-xs">
            <div className="text-xs text-[#64748B] font-semibold uppercase tracking-wider mb-1">
              AI Doubts Resolved
            </div>
            <div className="font-mono tabular-nums text-2xl sm:text-3xl font-extrabold text-[#00687A]">
              18
            </div>
            <div className="text-[11px] text-[#64748B] mt-1">
              Average response time: instant
            </div>
          </div>
        </div>

        {/* Continue Learning Strip */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-[#0F172A]">
                Resume Your Chapter Studies ({currentClass})
              </h3>
              <p className="text-xs text-[#64748B]">
                Pick up right where you left off.
              </p>
            </div>
            <Link href="/study-material">
              <Button size="sm" variant="outline">
                All Chapters
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {upcomingChapters.map((ch) => (
              <Link
                key={ch.id}
                href={`/study/${ch.slug}`}
                className="group p-4 bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#1D4ED8]/40 rounded-lg transition-all"
              >
                <div className="text-[11px] font-semibold text-[#00687A] mb-1">
                  {ch.category}
                </div>
                <div className="font-heading font-bold text-sm text-[#0F172A] group-hover:text-[#1D4ED8] transition-colors line-clamp-1 mb-2">
                  {ch.title}
                </div>
                <div className="flex items-center justify-between text-xs text-[#64748B] pt-2 border-t border-[#EDF2F7]">
                  <span>{ch.formulaCount} formulas</span>
                  <span className="font-semibold text-[#1D4ED8] flex items-center gap-1">
                    Study <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Tools Access */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] border border-[#BFDBFE] rounded-lg space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#1D4ED8] text-white flex items-center justify-center font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <h4 className="font-heading font-bold text-base text-[#1E3A8A]">
              Ask Professor Sigma (AI Teacher)
            </h4>
            <p className="text-xs text-[#3B82F6] leading-relaxed">
              Have an urgent doubt before tomorrow's class test? Submit your question and get a step-by-step breakdown immediately.
            </p>
            <Link href="/ai-teacher">
              <Button size="sm" variant="primary">
                Open AI Teacher
              </Button>
            </Link>
          </div>

          <div className="p-6 bg-white border border-[#E2E8F0] rounded-lg space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-[#06B6D4] text-white flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="font-heading font-bold text-base text-[#0F172A]">
              Formula Flashcards
            </h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Test your recall of key trigonometric, algebraic, and mensuration formulas with active recall cards.
            </p>
            <Link href="/formula-deck">
              <Button size="sm" variant="outline">
                Practice Flashcards
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};
