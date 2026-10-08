import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Clock,
  Coins,
  CheckCircle2,
  TrendingUp,
  Brain,
  MessageSquare,
  Search,
} from 'lucide-react';
import { adminService, AiActivityRecord } from '../../../services/adminService';

export const AdminAiActivitySection: React.FC = () => {
  const [logs, setLogs] = useState<AiActivityRecord[]>([]);

  useEffect(() => {
    adminService.getAiActivity().then(setLogs);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
          AI Teacher Telemetry & Doubt Logs
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time analytics for automated step-by-step doubt resolution across Classes 5 to 10.
        </p>
      </div>

      {/* AI Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[10px] font-heading font-bold text-slate-500 uppercase tracking-wider">
            Active Model
          </span>
          <div className="mt-2 text-base font-heading font-extrabold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>gemini-3.1-flash-lite</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Configurable via remote env</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[10px] font-heading font-bold text-slate-500 uppercase tracking-wider">
            Average Latency
          </span>
          <div className="mt-2 text-2xl font-heading font-extrabold text-slate-900">
            680 ms
          </div>
          <p className="text-[11px] text-emerald-600 mt-1">Optimized streaming throughput</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[10px] font-heading font-bold text-slate-500 uppercase tracking-wider">
            Total Tokens (24h)
          </span>
          <div className="mt-2 text-2xl font-heading font-extrabold text-slate-900">
            1.42 M
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Context window: 1M tokens</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[10px] font-heading font-bold text-slate-500 uppercase tracking-wider">
            Pedagogical Rating
          </span>
          <div className="mt-2 text-2xl font-heading font-extrabold text-slate-900">
            4.9 / 5.0
          </div>
          <p className="text-[11px] text-purple-600 mt-1">Socratic hint accuracy</p>
        </div>
      </div>

      {/* Recent Doubt Logs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>Recent Solved Doubt Interactions</span>
          <span className="font-mono text-[11px] text-purple-700">Gemini 3.1 Inference Engine</span>
        </div>

        <div className="divide-y divide-slate-100">
          {logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-700">{log.studentGrade}</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="font-semibold text-slate-800">{log.topic}</span>
                  <span className="text-[10px] font-mono text-slate-400">({log.id})</span>
                </div>
                <p className="text-slate-600 leading-relaxed italic">
                  &ldquo;{log.questionSnippet}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-slate-500 shrink-0">
                <div className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{log.latencyMs}ms</span>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span>{log.tokensUsed} tok</span>
                </div>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Resolved</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
