import React, { useEffect, useState } from 'react';
import { History, Bot, ArrowRight, ThumbsUp, ThumbsDown, Sparkles, Image as ImageIcon, Camera, FileText } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Link } from '../context/NavigationContext';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { MathRenderer } from '../components/ui/MathRenderer';
import { LoadingSpinner } from '../components/ui/LoadingState';

interface AiHistoryItem {
  id: string;
  uid: string | null;
  question: string;
  questionType: 'text' | 'image' | 'camera' | 'screenshot';
  studentClass: string;
  chapterTopic: string;
  reply: string;
  timestamp: string;
  responseStatus: 'success' | 'clarification_needed';
  userRating?: 'helpful' | 'unhelpful';
  tokenMetadata?: {
    model: string;
    promptTokens?: number;
    candidateTokens?: number;
    totalTokens?: number;
  };
}

export const DashboardAiHistoryPage: React.FC = () => {
  const { user, firebaseUser } = useAuth();
  const [historyItems, setHistoryItems] = useState<AiHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        let token = '';
        if (firebaseUser) {
          token = await firebaseUser.getIdToken();
        } else if (user) {
          token = `dev-token-${user.uid}`;
        }

        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/ai-teacher/history', { headers });
        const data = await res.json();
        if (data.history) {
          setHistoryItems(data.history);
        }
      } catch (err) {
        console.error('Failed to load AI history:', err);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [user, firebaseUser]);

  const handleRate = async (doubtId: string, rating: 'helpful' | 'unhelpful') => {
    setHistoryItems((prev) =>
      prev.map((item) => (item.id === doubtId ? { ...item, userRating: rating } : item))
    );
    try {
      await fetch('/api/ai-teacher/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doubtId, rating }),
      });
    } catch {
      // ignore
    }
  };

  return (
    <DashboardLayout
      title="AI Tutor Doubt History"
      subtitle="Review past mathematical doubts, worked formulas, and step-by-step guidance from Professor Sigma."
    >
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center">
            <LoadingSpinner message="Loading your mathematical doubt logs..." />
          </div>
        ) : historyItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-base text-slate-900">No Past Doubts Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't asked any doubts to Professor Sigma yet. Have a question from your textbook or homework?
            </p>
            <div className="pt-2">
              <Link href="/ai-teacher">
                <Button variant="primary" size="sm" className="gap-1.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask AI Teacher</span>
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          historyItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {item.studentClass || 'Class 10'} · {item.chapterTopic}
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                    {item.questionType === 'camera' ? (
                      <Camera className="w-3 h-3" />
                    ) : item.questionType === 'image' || item.questionType === 'screenshot' ? (
                      <ImageIcon className="w-3 h-3" />
                    ) : (
                      <FileText className="w-3 h-3" />
                    )}
                    <span>{item.questionType || 'text'}</span>
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      item.responseStatus === 'clarification_needed'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.responseStatus === 'clarification_needed' ? 'Needs Clarification' : 'Solved'}
                  </span>
                  {item.tokenMetadata && (
                    <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-1.5 py-0.5 rounded">
                      {item.tokenMetadata.model}
                      {item.tokenMetadata.totalTokens ? ` · ${item.tokenMetadata.totalTokens} tokens` : ''}
                    </span>
                  )}
                </div>
                <span className="text-slate-400 font-mono text-[11px]">
                  {new Date(item.timestamp).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div>
                <h4 className="font-heading font-bold text-sm sm:text-base text-slate-900 mb-1.5">
                  "{item.question}"
                </h4>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800">
                  <MathRenderer content={item.reply} />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[11px]">Feedback:</span>
                  {item.userRating ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <ThumbsUp className="w-3 h-3" />
                      <span>{item.userRating === 'helpful' ? 'Marked Helpful' : 'Marked Needs Improvement'}</span>
                    </span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRate(item.id, 'helpful')}
                        className="p-1 hover:text-emerald-600 hover:bg-slate-100 rounded text-slate-400 cursor-pointer"
                        title="Helpful"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRate(item.id, 'unhelpful')}
                        className="p-1 hover:text-rose-600 hover:bg-slate-100 rounded text-slate-400 cursor-pointer"
                        title="Not helpful"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <Link href={`/ai-teacher?topic=${encodeURIComponent(item.chapterTopic)}`}>
                  <Button size="sm" variant="ghost" className="text-xs text-blue-700">
                    <Bot className="w-3.5 h-3.5 mr-1" />
                    <span>Ask Follow-up Doubt</span>
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};
