import React, { useEffect, useState } from 'react';
import { adminService, AiActivityRecord } from '../../../services/adminService';

export const AdminAiActivitySection: React.FC = () => {
  const [logs, setLogs] = useState<AiActivityRecord[]>([]);
  const [config, setConfig] = useState<{ model: string; status: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    void Promise.all([adminService.getAiActivity(), fetch('/api/ai-teacher/config').then(response => response.json())]).then(([records, settings]) => { setLogs(records); setConfig(settings); }).catch(() => setError('AI activity could not be loaded.')).finally(() => setLoading(false));
  }, []);
  const recent = logs.filter(log => Date.parse(log.timestamp) > Date.now() - 86400000);
  const measured = recent.filter(log => typeof log.latencyMs === 'number');
  const votes = recent.filter(log => log.rating !== undefined);
  const cards = [
    ['Configured model', config?.status === 'configured' ? config.model : 'Not configured'],
    ['Average response time (24h)', measured.length ? `${Math.round(measured.reduce((sum, log) => sum + log.latencyMs!, 0) / measured.length)} ms` : 'No measurements'],
    ['Recorded tokens (24h)', recent.some(log => log.tokensUsed !== null) ? recent.reduce((sum, log) => sum + (log.tokensUsed || 0), 0).toLocaleString() : 'No measurements'],
    ['Helpful ratings (24h)', votes.length ? `${votes.filter(log => log.rating === 1).length} of ${votes.length}` : 'No feedback'],
  ];
  return <div className="space-y-6 text-slate-900">
    <div><h2 className="text-xl font-bold">AI Teacher Activity</h2><p className="text-sm text-slate-600">Recorded signed-in student sessions. Summaries use the latest 100 sessions.</p></div>
    {error && <p role="alert" className="rounded bg-red-50 p-3 text-red-700">{error}</p>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 font-bold">{loading ? 'Loading…' : value}</p></div>)}</div>
    <div className="rounded-xl border bg-white">{!loading && !logs.length && <p className="p-5 text-slate-600">No AI sessions have been recorded.</p>}{logs.map(log => <article key={log.id} className="border-b p-4"><p className="text-xs text-slate-500">{log.studentGrade} · {log.topic} · {new Date(log.timestamp).toLocaleString()}</p><p className="my-2 text-sm">{log.questionSnippet}</p><p className="text-xs text-slate-600">{log.model} · {log.latencyMs == null ? 'Time unavailable' : `${log.latencyMs} ms`} · {log.tokensUsed == null ? 'Token count unavailable' : `${log.tokensUsed} tokens`} · {log.resolved ? 'Answered' : 'Clarification needed'}</p></article>)}</div>
  </div>;
};
