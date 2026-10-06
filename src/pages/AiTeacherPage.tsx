import React, { useState } from 'react';
import { Bot, Send, Sparkles, HelpCircle, Layers, Lightbulb, RefreshCw, User } from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { StudentClass } from '../lib/firebase/types';
import { useNavigation } from '../context/NavigationContext';

interface ChatMessage {
  id: string;
  sender: 'student' | 'ai_teacher';
  text: string;
  timestamp: string;
  suggestedFormulas?: string[];
  stepHints?: string[];
}

export const AiTeacherPage: React.FC = () => {
  const { user } = useAuth();
  const { currentRoute } = useNavigation();
  const queryTopic = currentRoute.searchParams.get('topic');

  const [studentClass, setStudentClass] = useState<StudentClass>(
    user?.studentClass || 'Class 10'
  );
  const [topic, setTopic] = useState<string>(queryTopic || 'Quadratic Equations');
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai_teacher',
      text: `Hello! I am **Professor Sigma**, your 24/7 AI Mathematics Teacher for **${studentClass}**.\n\nWhether you are stuck on a textbook theorem, confusing signs in an equation, or need a step-by-step hint for your homework—ask me anything! I will break it down into clear, logical steps.`,
      timestamp: 'Just now',
      suggestedFormulas: ['Quadratic Formula: x = (-b ± √(b² - 4ac)) / (2a)', 'Pythagoras: h² = p² + b²'],
      stepHints: ['Identify what is given and what you need to find.', 'Relate the problem to a standard theorem.'],
    },
  ]);

  const quickPrompts = [
    'How do I derive the Quadratic Formula from ax² + bx + c = 0?',
    'Why is √2 an irrational number? Can you show the proof?',
    'What is the difference between CSA and TSA of a cylinder?',
    'Explain why sin²θ + cos²θ = 1 using a right triangle.',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const question = textToSend || inputQuestion;
    if (!question.trim() || loading) return;

    const studentMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'student',
      text: question.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, studentMsg]);
    setInputQuestion('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai-teacher/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          studentClass,
          chapterTopic: topic,
          history: messages.slice(-4),
        }),
      });

      if (!response.ok) {
        throw new Error('Server returned error status');
      }

      const data = await response.json();
      const teacherMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'ai_teacher',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedFormulas: data.suggestedFormulas,
        stepHints: data.stepHints,
      };

      setMessages((prev) => [...prev, teacherMsg]);
    } catch (err) {
      const fallbackMsg: ChatMessage = {
        id: 'msg-err-' + Date.now(),
        sender: 'ai_teacher',
        text: `Let's work through your question: "${question}".\n\n**Step 1: Write down the known values**\nAlways state what quantities are given with units.\n\n**Step 2: Choose the applicable theorem**\nFor this topic, check standard identities in your formula deck.\n\n**Step 3: Check boundary conditions**\nEnsure there is no division by zero or negative square root in real numbers.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedFormulas: ['Standard Formula for ' + topic],
        stepHints: ['Work step by step without skipping lines.'],
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const classes: StudentClass[] = [
    'Class 5',
    'Class 6',
    'Class 7',
    'Class 8',
    'Class 9',
    'Class 10',
  ];

  return (
    <SharedLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header & Configuration Bar */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-heading font-semibold text-[#00687A] mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>AI Math Teacher · Professor Sigma</span>
            </div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-[#0F172A]">
              Step-by-Step Doubt Tutor
            </h1>
            <p className="text-xs text-[#64748B]">
              Rigorous pedagogical guidance tuned for CBSE and ICSE standards.
            </p>
          </div>

          {/* Selectors */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-xs">
              <label htmlFor="grade-select" className="text-[#64748B] font-medium block mb-1">Your Grade:</label>
              <select
                id="grade-select"
                aria-label="Your Grade"
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value as StudentClass)}
                className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-md px-2.5 py-1.5 font-heading font-semibold text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              >
                {classes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs">
              <label htmlFor="topic-focus" className="text-[#64748B] font-medium block mb-1">Topic Focus:</label>
              <input
                id="topic-focus"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Polynomials, Triangles"
                className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-md px-2.5 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] w-40"
              />
            </div>
          </div>
        </div>

        {/* Quick Prompts Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs text-[#64748B] font-semibold shrink-0">Try asking:</span>
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="text-xs bg-white hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#1D4ED8]/30 text-[#475569] hover:text-[#1D4ED8] px-3 py-1.5 rounded-full shrink-0 transition-colors cursor-pointer text-left font-medium"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Transcript Container */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm min-h-[460px] flex flex-col justify-between overflow-hidden">
          
          {/* Messages Feed */}
          <div className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto max-h-[580px]">
            {messages.map((msg) => {
              const isTeacher = msg.sender === 'ai_teacher';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isTeacher ? 'items-start' : 'items-start flex-row-reverse'}`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                      isTeacher
                        ? 'bg-[#1D4ED8] text-white shadow-xs'
                        : 'bg-[#F1F5F9] text-[#1E293B] border border-[#CBD5E1]'
                    }`}
                  >
                    {isTeacher ? 'Σ' : 'You'}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-lg p-4 sm:p-5 ${
                      isTeacher
                        ? 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B]'
                        : 'bg-[#1D4ED8] text-white shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-2 text-[11px] opacity-75">
                      <span className="font-heading font-semibold">
                        {isTeacher ? 'Professor Sigma (AI Tutor)' : 'You'}
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Message Body */}
                    <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                      {msg.text}
                    </div>

                    {/* Suggested Formulas Callout (if teacher) */}
                    {isTeacher && msg.suggestedFormulas && msg.suggestedFormulas.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-[#E2E8F0] space-y-1.5">
                        <div className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#00687A] flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-[#06B6D4]" />
                          <span>Key Formula Reference</span>
                        </div>
                        {msg.suggestedFormulas.map((f, i) => (
                          <div
                            key={i}
                            className="bg-white border border-[#E0F2FE] rounded px-2.5 py-1.5 font-mono text-xs font-semibold text-[#0037B0]"
                          >
                            {f}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center font-bold text-xs">
                  Σ
                </div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-xs text-[#64748B] flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#1D4ED8]" />
                  <span>Professor Sigma is analyzing the algebraic steps...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Box Footer */}
          <div className="p-4 bg-[#FAFBFD] border-t border-[#E2E8F0]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={`Ask a math doubt in ${topic} for ${studentClass}...`}
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                disabled={loading}
                className="flex-1 bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!inputQuestion.trim() || loading}
                isLoading={loading}
                className="px-5 font-bold"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Ask</span>
              </Button>
            </form>
            <div className="mt-2 text-[11px] text-[#64748B] flex items-center justify-between">
              <span>Supports arithmetic, geometry proofs, algebra identities, and word problems.</span>
              <span className="hidden sm:inline">Powered by server-side Gemini</span>
            </div>
          </div>

        </div>

      </div>
    </SharedLayout>
  );
};
