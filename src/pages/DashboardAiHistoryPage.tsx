import React from 'react';
import { History, Bot, ArrowRight, MessageSquare } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Link } from '../context/NavigationContext';
import { Button } from '../components/ui/Button';

interface PastDoubtItem {
  id: string;
  topic: string;
  question: string;
  summary: string;
  date: string;
  formulasUsed: string[];
}

export const DashboardAiHistoryPage: React.FC = () => {
  const historyItems: PastDoubtItem[] = [
    {
      id: 'doubt-1',
      topic: 'Quadratic Equations',
      question: 'Why do we reject negative roots in speed and distance word problems?',
      summary: 'Physical speed and geometric length are scalar quantities defined strictly as non-negative reals in classical kinematics.',
      date: 'Today, 10:14 AM',
      formulasUsed: ['Speed = Distance / Time', 'ax² + bx + c = 0'],
    },
    {
      id: 'doubt-2',
      topic: 'Introduction to Trigonometry',
      question: 'How to prove 1 + tan²θ = sec²θ algebraically without geometry?',
      summary: 'Divided both sides of sin²θ + cos²θ = 1 by cos²θ, applying reciprocal identities tanθ = sin/cos and secθ = 1/cos.',
      date: 'Yesterday, 8:30 PM',
      formulasUsed: ['sin²θ + cos²θ = 1', 'tanθ = sinθ / cosθ'],
    },
    {
      id: 'doubt-3',
      topic: 'Real Numbers',
      question: 'Can Fundamental Theorem of Arithmetic be applied to negative numbers?',
      summary: 'FTA is strictly formulated over natural numbers greater than 1; signs are handled by an auxiliary unit factor (-1).',
      date: 'Oct 4, 2026',
      formulasUsed: ['Prime Factorisation Theorem'],
    },
  ];

  return (
    <DashboardLayout
      title="AI Doubt History"
      subtitle="Review past mathematical doubt breakdowns with Professor Sigma."
    >
      <div className="space-y-4">
        {historyItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded">
                {item.topic}
              </span>
              <span className="text-[#64748B] font-mono">{item.date}</span>
            </div>

            <div>
              <h4 className="font-heading font-semibold text-sm sm:text-base text-[#0F172A] mb-1">
                "{item.question}"
              </h4>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                {item.summary}
              </p>
            </div>

            <div className="pt-2 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-[#00687A]">Referenced:</span>
                {item.formulasUsed.map((f, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-mono bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded text-[#334155]"
                  >
                    {f}
                  </span>
                ))}
              </div>

              <Link href={`/ai-teacher?topic=${encodeURIComponent(item.topic)}`}>
                <Button size="sm" variant="ghost" className="text-xs">
                  <Bot className="w-3.5 h-3.5 mr-1" />
                  <span>Ask Follow-up Doubt</span>
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};
