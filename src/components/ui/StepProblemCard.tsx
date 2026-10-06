import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, Sparkles, HelpCircle } from 'lucide-react';
import { SolvedProblem } from '../../lib/firebase/types';
import { Button } from './Button';

export interface StepProblemCardProps {
  problem: SolvedProblem;
  defaultExpanded?: boolean;
}

export const StepProblemCard: React.FC<StepProblemCardProps> = ({
  problem,
  defaultExpanded = false,
}) => {
  const [isRevealed, setIsRevealed] = useState(defaultExpanded);
  const [activeStepIndex, setActiveStepIndex] = useState(defaultExpanded ? problem.steps.length : 1);
  const [completed, setCompleted] = useState(false);

  const handleRevealAll = () => {
    setIsRevealed(true);
    setActiveStepIndex(problem.steps.length);
    setCompleted(true);
  };

  const handleNextStep = () => {
    if (activeStepIndex < problem.steps.length) {
      setActiveStepIndex((prev) => prev + 1);
      if (activeStepIndex + 1 === problem.steps.length) {
        setCompleted(true);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-[0_4px_14px_-2px_rgba(29,78,216,0.05)] overflow-hidden transition-all duration-200">
      {/* Header bar */}
      <div className="p-5 border-b border-[#F1F5F9] bg-[#FAFBFD] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#1D4ED8] bg-[#EFF6FF] px-2.5 py-1 rounded">
            {problem.classLevel}
          </span>
          <span className="text-xs font-semibold text-[#64748B] border border-[#E2E8F0] px-2 py-0.5 rounded">
            {problem.difficulty}
          </span>
          <span className="text-xs text-[#00687A] font-medium hidden sm:inline">
            Formula: <code className="font-mono text-[#0037B0]">{problem.keyFormulaUsed}</code>
          </span>
        </div>

        <button
          onClick={() => setIsRevealed(!isRevealed)}
          className="text-xs font-semibold text-[#1D4ED8] hover:text-[#1E40AF] flex items-center gap-1 cursor-pointer"
        >
          <span>{isRevealed ? 'Collapse Steps' : 'View Solution Steps'}</span>
          {isRevealed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Problem Question Statement */}
      <div className="p-5 md:p-6">
        <h4 className="font-heading font-bold text-base md:text-lg text-[#0F172A] mb-2">
          {problem.title}
        </h4>
        <p className="text-sm md:text-base text-[#334155] leading-relaxed mb-4">
          {problem.question}
        </p>

        {!isRevealed ? (
          <div className="mt-4 pt-4 border-t border-dashed border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-[#64748B] flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#06B6D4]" />
              <span>Try calculating on paper first, then reveal each step sequentially!</span>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setIsRevealed(true)}>
              Solve Step-by-Step
            </Button>
          </div>
        ) : (
          <div className="mt-6 pt-2">
            <div className="text-xs font-bold tracking-wider uppercase text-[#00687A] mb-4 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>Step-by-Step Breakdown</span>
            </div>

            {/* Step-by-Step Problem Cards with linear connector lines (2px dashed #CBD5E1) */}
            <div className="relative pl-6 space-y-6">
              {/* Vertical Dashed Line connector */}
              <div
                className="absolute left-[15px] top-4 bottom-4 w-0 border-l-2 border-dashed border-[#CBD5E1]"
                aria-hidden="true"
              />

              {problem.steps.slice(0, activeStepIndex).map((step, idx) => (
                <div key={step.stepNumber} className="relative group">
                  {/* Numbered Sequence Bubble */}
                  <div
                    className={`absolute -left-[24px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-heading shadow-xs ${
                      idx + 1 === activeStepIndex && !completed
                        ? 'bg-[#1D4ED8] text-white ring-4 ring-[#EFF6FF]'
                        : 'bg-[#06B6D4] text-white'
                    }`}
                  >
                    {step.stepNumber}
                  </div>

                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4">
                    <div className="font-heading font-semibold text-xs md:text-sm text-[#0F172A] mb-1">
                      {step.heading}
                    </div>
                    {step.mathExpression && (
                      <div className="font-mono tabular-nums text-sm md:text-base font-semibold text-[#0037B0] bg-white border border-[#E0F2FE] rounded px-3 py-1.5 my-2 overflow-x-auto">
                        {step.mathExpression}
                      </div>
                    )}
                    <p className="text-xs md:text-sm text-[#475569] leading-relaxed">
                      {step.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stepper Navigation Controls */}
            {activeStepIndex < problem.steps.length && (
              <div className="mt-6 pt-4 border-t border-[#F1F5F9] flex items-center justify-between">
                <span className="text-xs text-[#64748B]">
                  Step {activeStepIndex} of {problem.steps.length}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleRevealAll}>
                    Reveal All
                  </Button>
                  <Button size="sm" variant="primary" onClick={handleNextStep}>
                    Next Step ({activeStepIndex + 1})
                  </Button>
                </div>
              </div>
            )}

            {/* Positive Reinforcement & Final Answer (Emerald #10B981) */}
            {(completed || activeStepIndex === problem.steps.length) && (
              <div className="mt-6 p-4 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
                <div>
                  <div className="font-heading font-bold text-xs md:text-sm text-[#065F46] uppercase tracking-wide">
                    Final Verified Answer
                  </div>
                  <div className="font-mono tabular-nums font-bold text-base md:text-lg text-[#047857] mt-0.5">
                    {problem.finalAnswer}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
