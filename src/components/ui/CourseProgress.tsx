import React from 'react';

/** Only caller-supplied, verified learner records may produce a completion bar. */
export function CourseProgress({ completedChapters, totalChapters }: { completedChapters?: number; totalChapters: number }) {
  if (!Number.isSafeInteger(completedChapters) || !Number.isSafeInteger(totalChapters) || totalChapters <= 0 || completedChapters! < 0 || completedChapters! > totalChapters) {
    return <p className="text-xs text-slate-500">No verified completion record for this course.</p>;
  }
  const percentage = Math.round(completedChapters! / totalChapters * 100);
  return <div className="space-y-1"><div className="flex justify-between text-xs"><span>Completed: {completedChapters}/{totalChapters}</span><span>{percentage}%</span></div><div role="progressbar" aria-label="Verified course completion" aria-valuemin={0} aria-valuemax={totalChapters} aria-valuenow={completedChapters} className="h-2 rounded-full overflow-hidden bg-slate-100"><div className="h-full bg-blue-700" style={{ width: percentage + '%' }} /></div></div>;
}
