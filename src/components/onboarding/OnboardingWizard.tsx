import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import {
  Sparkles,
  BookOpen,
  Bot,
  FileDown,
  Flame,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  HelpCircle,
  Layers,
  GraduationCap,
  Lightbulb,
} from 'lucide-react';
import { Button } from '../ui/Button';

export interface OnboardingStep {
  id: string;
  stepNumber: number;
  category: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  description: string;
  educationalTooltip: string;
  proTip: string;
  targetPath?: string;
  actionLabel?: string;
  highlights: string[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'class-curriculum',
    stepNumber: 1,
    category: 'Curriculum & Board',
    title: 'Personalized Class 5–10 Syllabus',
    icon: GraduationCap,
    accentColor: '#2563EB',
    badgeBg: 'bg-blue-50 border-blue-200 text-blue-700',
    badgeText: 'Curriculum Setup',
    description: 'Welcome to Maths at Your Fingertips! Your learning experience is automatically filtered to your academic grade.',
    educationalTooltip:
      'Select your exact class (Class 5 through Class 10) and curriculum board (CBSE or ICSE) from the header selector. Every formula card, chapter breakdown, and practice problem will instantly calibrate to your official NCERT and board syllabus.',
    proTip: 'Changing your class grade never resets your progress or saved formulas. You can switch grade levels anytime to revise previous years concepts.',
    targetPath: '/study-material',
    actionLabel: 'Browse Chapters',
    highlights: [
      'Tailored for Class 5, 6, 7, 8, 9, and 10 students',
      'Dual CBSE & ICSE syllabus compatibility',
      'Instant real-time filtering without page reloads',
    ],
  },
  {
    id: 'formula-deck',
    stepNumber: 2,
    category: 'Interactive Formulas',
    title: 'KaTeX Formula Deck & Derivations',
    icon: BookOpen,
    accentColor: '#059669',
    badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    badgeText: 'Formula Mastery',
    description: 'Move beyond rote memorization with pure mathematical typesetting and step-by-step proofs.',
    educationalTooltip:
      'Click any formula card in the Formula Deck to open its deep-dive page. You will discover rigorous theorem proofs, step-by-step derivations, interactive SVG geometry diagrams, and a 1-click LaTeX copier for your digital homework assignments.',
    proTip: 'Click the star icon on any card to save it into your personal revision deck before exams.',
    targetPath: '/formula-deck',
    actionLabel: 'Open Formula Deck',
    highlights: [
      'LaTeX math rendered with sub-millisecond KaTeX',
      'Step-by-step proof derivations & edge cases',
      'Interactive geometry diagrams and variable keys',
    ],
  },
  {
    id: 'ai-teacher',
    stepNumber: 3,
    category: 'Multimodal AI Teacher',
    title: '24/7 AI Doubt Solver & Step Hints',
    icon: Bot,
    accentColor: '#7C3AED',
    badgeBg: 'bg-purple-50 border-purple-200 text-purple-700',
    badgeText: 'AI Tutor',
    description: 'Get unstuck on difficult math problems anytime with syllabus-aware pedagogical explanations.',
    educationalTooltip:
      'Whenever you encounter a confusing question, navigate to the AI Teacher. You can ask for a conceptual hint, request a Socratic clue, or get a full step-by-step breakdown. The AI Teacher follows standard board rubrics and explains the intuition behind every step.',
    proTip: 'Ask "Give me a hint first before showing the answer" to train your independent problem-solving skills for board exams.',
    targetPath: '/ai-teacher',
    actionLabel: 'Try AI Teacher',
    highlights: [
      'Free students receive 30 daily doubts; Annual Pass get 1,000/day',
      'Step-by-step logic without confusing mathematical leaps',
      'Rate answers to build your personal doubt history ledger',
    ],
  },
  {
    id: 'secure-downloads',
    stepNumber: 4,
    category: 'Exam Materials',
    title: 'Verified Cheat Sheets & Mock Papers',
    icon: FileDown,
    accentColor: '#D97706',
    badgeBg: 'bg-amber-50 border-amber-200 text-amber-700',
    badgeText: 'Revision Sheets',
    description: 'Download printable high-resolution PDF formula summaries and mid-term test papers.',
    educationalTooltip:
      'All curriculum downloads are protected with Cloudflare Turnstile single-use verification tokens. This ensures lightning-fast, secure downloads directly from our Cloud storage without intrusive ads, malware, or bot traps.',
    proTip: 'Print the formula cheat sheets ahead of exam revision week to keep next to your study desk for quick reference.',
    targetPath: '/study-material',
    actionLabel: 'Find Practice Papers',
    highlights: [
      'High-resolution printable PDF cheat-sheets',
      'Cloudflare Turnstile token-secured downloads',
      'Mid-term and annual board exam mock tests',
    ],
  },
  {
    id: 'student-dashboard',
    stepNumber: 5,
    category: 'Learning Hub',
    title: 'Study Streaks, Bookmarks & Orders',
    icon: Flame,
    accentColor: '#EA580C',
    badgeBg: 'bg-orange-50 border-orange-200 text-orange-700',
    badgeText: 'Student Dashboard',
    description: 'Your central headquarters for monitoring your academic consistency and saved materials.',
    educationalTooltip:
      'Track your daily revision streak, review recently visited chapters, access all bookmarked formulas, and inspect your Annual Pass status and tax invoices all in one clean place.',
    proTip: 'Revising just 1 formula every day maintains your study streak and builds long-term mathematical retention.',
    targetPath: '/dashboard',
    actionLabel: 'Visit Dashboard',
    highlights: [
      'Daily revision streak counter with fire badges',
      'Instant access to saved formula bookmarks',
      'Download tax receipts & manage Annual Pass anytime',
    ],
  },
];

const ONBOARDING_STORAGE_PREFIX = 'mayf_onboarding_completed_';

/**
 * Triggers the onboarding tour globally from anywhere in the app
 */
export function openOnboardingTour() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mayf_open_onboarding'));
  }
}

export const OnboardingWizard: React.FC = () => {
  const { user } = useAuth();
  const { navigate } = useNavigation();

  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasDismissedPermanently, setHasDismissedPermanently] = useState(false);

  // Check if onboarding should automatically open for new user on first login
  useEffect(() => {
    if (!user?.uid) return;

    const storageKey = `${ONBOARDING_STORAGE_PREFIX}${user.uid}`;
    const isCompleted = localStorage.getItem(storageKey);

    if (!isCompleted && !hasDismissedPermanently) {
      // Delay slightly (700ms) to ensure initial render is calm and complete
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [user?.uid, hasDismissedPermanently]);

  // Listen for manual trigger events (e.g. from Dashboard "Tour" button)
  useEffect(() => {
    const handleManualOpen = () => {
      setCurrentStepIndex(0);
      setIsOpen(true);
    };

    window.addEventListener('mayf_open_onboarding', handleManualOpen);
    return () => {
      window.removeEventListener('mayf_open_onboarding', handleManualOpen);
    };
  }, []);

  const currentStep = ONBOARDING_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === ONBOARDING_STEPS.length - 1;
  const progressPercent = Math.round(((currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100);

  const markTourCompleted = useCallback(() => {
    if (user?.uid) {
      localStorage.setItem(`${ONBOARDING_STORAGE_PREFIX}${user.uid}`, 'true');
    } else {
      localStorage.setItem(`${ONBOARDING_STORAGE_PREFIX}guest`, 'true');
    }
    setHasDismissedPermanently(true);
  }, [user?.uid]);

  const handleClose = () => {
    markTourCompleted();
    setIsOpen(false);
  };

  const handleNext = () => {
    if (isLastStep) {
      markTourCompleted();
      setIsOpen(false);
      if (user) {
        navigate('/dashboard');
      }
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleQuickAction = (targetPath?: string) => {
    markTourCompleted();
    setIsOpen(false);
    if (targetPath) {
      navigate(targetPath);
    }
  };

  // Keyboard accessibility
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  if (!isOpen || !currentStep) {
    return null;
  }

  const StepIcon = currentStep.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-step-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Header Bar */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${currentStep.badgeBg}`}>
              {currentStep.badgeText}
            </span>
            <span className="text-xs font-mono font-medium text-slate-400">
              Step {currentStepIndex + 1} of {ONBOARDING_STEPS.length}
            </span>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Step Hero */}
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
              style={{ backgroundColor: currentStep.accentColor }}
            >
              <StepIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2
                id="onboarding-step-title"
                className="font-heading font-extrabold text-xl text-slate-900 tracking-tight leading-snug"
              >
                {currentStep.title}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                {currentStep.description}
              </p>
            </div>
          </div>

          {/* Educational Tooltip Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>How this helps your learning:</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {currentStep.educationalTooltip}
            </p>
          </div>

          {/* Key Feature Highlights */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Core Capabilities:
            </span>
            <div className="grid grid-cols-1 gap-2">
              {currentStep.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Educational Pro Tip Callout */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-3">
            <div className="p-1 rounded-md bg-amber-100 text-amber-700 shrink-0 mt-0.5">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong className="font-bold">Exam Pro Tip: </strong>
              <span>{currentStep.proTip}</span>
            </div>
          </div>
        </div>

        {/* Footer Navigation Controls */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
          {/* Left: Step Indicators */}
          <div className="flex items-center gap-1.5">
            {ONBOARDING_STEPS.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentStepIndex(idx)}
                aria-label={`Jump to step ${idx + 1}`}
                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-6 bg-blue-600'
                    : idx < currentStepIndex
                    ? 'bg-slate-400'
                    : 'bg-slate-200 hover:bg-slate-300'
                }`}
              />
            ))}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                className="text-xs font-semibold text-slate-600"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Back
              </Button>
            )}

            {currentStep.targetPath && (
              <button
                onClick={() => handleQuickAction(currentStep.targetPath)}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline px-2 py-1 cursor-pointer"
              >
                <span>{currentStep.actionLabel || 'Try Now'}</span>
              </button>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={handleNext}
              className="text-xs font-bold px-4"
            >
              <span>{isLastStep ? 'Get Started' : 'Next Step'}</span>
              {!isLastStep && <ChevronRight className="w-3.5 h-3.5 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
