import React, { useState } from 'react';
import { Clock, Download, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { Button } from '../ui/Button';

interface TestPaperViewerProps {
  title: string;
  classLevel: string;
  downloadUrl?: string;
}

export const TestPaperViewer: React.FC<TestPaperViewerProps> = ({
  title,
  classLevel,
  downloadUrl,
}) => {
  const [timerSeconds, setTimerSeconds] = useState(10800); // 3 Hours (180 mins)
  const [timerRunning, setTimerRunning] = useState(false);
  const [activeSection, setActiveSection] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds((s) => s - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const sampleQuestions = {
    A: [
      { num: 1, q: 'If two positive integers a and b are written as a = x³y² and b = xy³, where x, y are prime numbers, then HCF(a, b) is:', marks: 1, options: ['xy', 'xy²', 'x³y³', 'x²y²'], ans: 'xy²' },
      { num: 2, q: 'The roots of quadratic equation 2x² - x - 6 = 0 are:', marks: 1, options: ['-2, 3/2', '2, -3/2', '-2, -3/2', '2, 3/2'], ans: '2, -3/2' },
      { num: 3, q: 'If ∆ABC ~ ∆PQR, with BC/QR = 1/3, then ar(∆PRQ)/ar(∆BCA) is equal to:', marks: 1, options: ['9', '3', '1/3', '1/9'], ans: '9' },
    ],
    B: [
      { num: 4, q: 'Prove that √5 is an irrational number by method of contradiction.', marks: 2 },
      { num: 5, q: 'Find the 20th term from the last term of the AP: 3, 8, 13, ..., 253.', marks: 2 },
    ],
    C: [
      { num: 6, q: 'Prove that the lengths of tangents drawn from an external point to a circle are equal.', marks: 3 },
      { num: 7, q: 'Solve the pair of equations: 2/x + 3/y = 13 and 5/x - 4/y = -2 where x, y ≠ 0.', marks: 3 },
    ],
    D: [
      { num: 8, q: 'State and prove Basic Proportionality Theorem (Thales Theorem).', marks: 5 },
      { num: 9, q: 'A solid toy is in the form of a hemisphere surmounted by a right circular cone. If height of cone is 4 cm and diameter of base is 8 cm, determine volume of toy. (Use π = 3.14)', marks: 5 },
    ],
    E: [
      { num: 10, q: 'Case Study: A group of students visited a suspension bridge. The cables hang in parabolic curves modeled by y = ax² + bx + c. Determine coefficients from tower dimensions.', marks: 4 },
    ],
  };

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-md overflow-hidden space-y-6 p-6 sm:p-8">
      {/* Header bar with exam timer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2 text-xs font-heading font-semibold text-[#1D4ED8] mb-1">
            <span>{classLevel} Mathematics Examination Paper</span>
            <span aria-hidden="true">·</span>
            <span>Maximum Marks: 80</span>
          </div>
          <h2 className="font-heading font-bold text-xl sm:text-2xl text-[#0F172A]">{title}</h2>
        </div>

        {/* Exam Stopwatch */}
        <div className="flex items-center gap-3 bg-[#F8FAFC] border border-[#CBD5E1] p-3 rounded-lg shrink-0">
          <Clock className="w-5 h-5 text-[#EA580C]" />
          <div>
            <div className="text-[10px] text-[#64748B] font-semibold uppercase">Board Timer</div>
            <div className="font-mono tabular-nums text-lg font-bold text-[#0F172A]">{formatTime(timerSeconds)}</div>
          </div>
          <Button
            size="sm"
            variant={timerRunning ? 'outline' : 'primary'}
            onClick={() => setTimerRunning(!timerRunning)}
            className="text-xs h-8 px-3 ml-2"
          >
            {timerRunning ? 'Pause' : 'Start Timer'}
          </Button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['A', 'B', 'C', 'D', 'E'] as const).map((sec) => (
          <button
            key={sec}
            onClick={() => setActiveSection(sec)}
            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold transition-colors cursor-pointer ${
              activeSection === sec ? 'bg-[#1D4ED8] text-white shadow-xs' : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Section {sec} {sec === 'A' ? '(1 Mark)' : sec === 'B' ? '(2 Marks)' : sec === 'C' ? '(3 Marks)' : sec === 'D' ? '(5 Marks)' : '(Case Study)'}
          </button>
        ))}
      </div>

      {/* Questions list */}
      <div className="space-y-4 pt-2">
        {sampleQuestions[activeSection].map((q) => (
          <div key={q.num} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-2">
            <div className="flex items-start justify-between gap-3 text-xs">
              <span className="font-heading font-bold text-[#0F172A]">Question {q.num}</span>
              <span className="font-mono text-[11px] font-semibold text-[#00687A] bg-[#ECFEFF] px-2 py-0.5 rounded">
                [{q.marks} Mark{q.marks > 1 ? 's' : ''}]
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#334155] leading-relaxed font-sans">{q.q}</p>
            {'options' in q && q.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs">
                {q.options.map((opt, i) => (
                  <div key={i} className="p-2 bg-white border border-[#CBD5E1] rounded text-[#475569]">
                    <span className="font-bold mr-1">({String.fromCharCode(65 + i)})</span> {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer controls */}
      <div className="pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 text-xs text-[#64748B]">
        <span>General Instruction: All questions are compulsory. Internal choices provided in sections C & D.</span>
        {downloadUrl && (
          <Button size="sm" variant="secondary" onClick={() => window.open(downloadUrl, '_blank')}>
            <Download className="w-3.5 h-3.5 mr-1" />
            <span>Download Paper PDF</span>
          </Button>
        )}
      </div>
    </div>
  );
};
