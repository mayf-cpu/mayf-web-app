import React, { useState } from 'react';
import { BookOpen, CheckCircle2, ChevronRight, Sparkles, Award } from 'lucide-react';
import { Button } from '../ui/Button';

interface CourseViewerProps {
  title: string;
  description?: string;
  classLevel: string;
}

export const CourseViewer: React.FC<CourseViewerProps> = ({ title, description, classLevel }) => {
  const [activeLesson, setActiveLesson] = useState(0);

  const modules = [
    {
      title: 'Module 1: Conceptual Foundations & Real World Scenarios',
      summary: 'Intuition building without formulas, understanding variables and relationships.',
      duration: '15 mins',
      completed: true,
    },
    {
      title: 'Module 2: Standard Theorems, Identities & Algebraic Proofs',
      summary: 'Rigorous mathematical step-by-step derivation for board examination criteria.',
      duration: '25 mins',
      completed: false,
    },
    {
      title: 'Module 3: NCERT Exemplar & Previous Year Board Questions',
      summary: 'Deep dive into 5 high-yield exemplar word problems with step marking.',
      duration: '35 mins',
      completed: false,
    },
    {
      title: 'Module 4: Speed Verification & Common Trap Avoidance',
      summary: 'Sign check heuristics and mental math estimates to guarantee 100% accuracy.',
      duration: '20 mins',
      completed: false,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-md p-6 sm:p-8 space-y-6">
      <div>
        <div className="text-xs font-heading font-semibold text-[#1D4ED8] uppercase tracking-wider mb-1">
          {classLevel} Modular Course Syllabus
        </div>
        <h2 className="font-heading font-bold text-xl sm:text-2xl text-[#0F172A]">{title}</h2>
        {description && <p className="text-xs sm:text-sm text-[#475569] mt-2 leading-relaxed">{description}</p>}
      </div>

      {/* Progress Track */}
      <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center font-bold text-xs">
            25%
          </div>
          <div>
            <div className="font-heading font-bold text-xs sm:text-sm text-[#0F172A]">Chapter Mastery Track</div>
            <div className="text-[11px] text-[#64748B]">1 of 4 learning units completed</div>
          </div>
        </div>
        <span className="text-xs font-semibold text-[#00687A]">Verified Syllabus</span>
      </div>

      {/* Modules List */}
      <div className="space-y-3">
        {modules.map((m, idx) => (
          <div
            key={idx}
            onClick={() => setActiveLesson(idx)}
            className={`p-4 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-4 ${
              activeLesson === idx
                ? 'border-[#1D4ED8] bg-[#EFF6FF]/60 shadow-xs ring-1 ring-[#1D4ED8]'
                : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                  m.completed ? 'bg-[#10B981] text-white' : 'bg-[#E2E8F0] text-[#475569]'
                }`}
              >
                {m.completed ? '✓' : idx + 1}
              </span>
              <div>
                <h4 className="font-heading font-bold text-xs sm:text-sm text-[#0F172A]">{m.title}</h4>
                <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">{m.summary}</p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] font-mono text-[#64748B] block">{m.duration}</span>
              <ChevronRight className="w-4 h-4 text-[#94A3B8] ml-auto mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
