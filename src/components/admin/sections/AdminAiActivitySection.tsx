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
  const [error, setError] = useState('');
  useEffect(() => {
    adminService.getAiActivity().then(setLogs).catch((err: any) => setError(err?.message || 'AI activity could not be loaded.'));
  }, []);

  const latestModel = logs.find(log => log.model)?.model || 'Not measured';
  const latencySamples = logs.filter(log => typeof log.latencyMs === 'number');
  const averageLatency = latencySamples.length
    ? Math.round(latencySamples.reduce((sum, log) => sum + (log.latencyMs ?? 0), 0) / latencySamples.length)
    : null;
  const inLast24Hours = logs.filter(log => Number.isFinite(Date.parse(log.timestamp)) &&
    Date.parse(log.timestamp) >= Date.now() - 86400000);
  const measuredTokens = inLast24Hours.filter(log => typeof log.tokensUsed === 'number');
  const tokens24h = measuredTokens.length ? measuredTokens.reduce((sum, log) => sum + (log.tokensUsed ?? 0), 0) : null;
  const rated = logs.filter(log => log.rating === 1 || log.rating === 0);
  const helpfulShare = rated.length ? Math.round(rated.filter(log => log.rating === 1).length / rated.length * 100) : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
          AI Teacher Telemetry & Doubt Logs
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Actual saved AI responses and available usage measurements. Missing data is never estimated.
        </p>
      </div>

      {error && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
      {/* AI Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[10px] font-heading font-bold text-slate-500 uppercase tracking-wider">
            Last Response Model
          </span>
          <div className="mt-2 text-base font-heading font-extrabold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>{latestModel}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Latest recorded response model</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[10px] font-heading font-bold text-slate-500 uppercase tracking-wider">
            Average Latency
          </span>
          <div className="mt-2 text-2xl font-heading font-extrabold text-slate-900">
            {averageLatency == null ? 'Not measured' : `${averageLatency} ms`}
          </div>
          <p className="text-[11px] text-emerald-600 mt-1">Average of records with measured latency</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[10px] font-heading font-bold text-slate-500 uppercase tracking-wider">
            Recorded Tokens (24h)
          </span>
          <div className="mt-2 text-2xl font-heading font-extrabold text-slate-900">
            {tokens24h == null ? 'Not measured' : tokens24h.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">From recent retained records only</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[10px] font-heading font-bold text-slate-500 uppercase tracking-wider">
            Helpful Ratings
          </span>
          <div className="mt-2 text-2xl font-heading font-extrabold text-slate-900">
            {helpfulShare == null ? 'Not measured' : `${helpfulShare}%`}
          </div>
          <p className="text-[11px] text-purple-600 mt-1">Share of student-rated helpful answers</p>
        </div>
      </div>

      {/* Recent Doubt Logs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>Recent Solved Doubt Interactions</span>
          <span className="font-mono text-[11px] text-purple-700">Recorded AI model responses</span>
        </div>

        <div className="divide-y divide-slate-100">
          {!error && logs.length === 0 && <p className="p-5 text-sm text-slate-500">No recorded AI responses yet.</p>}
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
                  <span>{log.latencyMs == null ? '—' : `${log.latencyMs}ms`}</span>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span>{log.tokensUsed == null ? '—' : `${log.tokensUsed} tok`}</span>
                </div>
                <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded border ${log.resolved ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-amber-800 bg-amber-50 border-amber-200"}`}>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{log.resolved ? 'Resolved' : 'Needs review'}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
