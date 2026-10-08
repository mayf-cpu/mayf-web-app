import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Award,
  BookOpen,
  Layers,
  Sparkles,
} from 'lucide-react';

export const AdminAnalyticsSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
          Learning Engagement & Retention Analytics
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time metrics on chapter engagement, most accessed formulas, and exam revision spikes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Most Viewed Formulas */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Top Formula Flashcards</span>
          </h3>
          <div className="space-y-2.5 text-xs">
            {[
              { title: 'Sridharacharya Quadratic Formula', views: '14,290 views', grade: 'Class 10' },
              { title: 'Pythagoras Theorem & Converse', views: '11,840 views', grade: 'Class 9–10' },
              { title: 'Trigonometric Ratios & Identity', views: '9,410 views', grade: 'Class 10' },
              { title: 'Cylinder Surface Area & Volume', views: '7,320 views', grade: 'Class 8–10' },
            ].map((f) => (
              <div key={f.title} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{f.title}</p>
                  <span className="text-[10px] text-blue-700 font-bold">{f.grade}</span>
                </div>
                <span className="font-mono text-slate-500 text-[11px]">{f.views}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Most Active Grades */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Active Student Distribution</span>
          </h3>
          <div className="space-y-3 text-xs">
            {[
              { grade: 'Class 10 (Board Exam Focus)', pct: 42, count: '5,240 students' },
              { grade: 'Class 9 (Foundations)', pct: 28, count: '3,490 students' },
              { grade: 'Class 8 (Pre-Algebra)', pct: 15, count: '1,870 students' },
              { grade: 'Class 7 & Class 6', pct: 15, count: '1,880 students' },
            ].map((g) => (
              <div key={g.grade} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-800">{g.grade}</span>
                  <span className="font-mono text-slate-500">{g.pct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${g.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-600" />
            <span>Device & Access Modality</span>
          </h3>
          <div className="space-y-3 text-xs">
            {[
              { device: 'Mobile Smartphone (Portrait)', pct: 68 },
              { device: 'Desktop / Laptop Browser', pct: 24 },
              { device: 'Tablet (iPad / Android Tab)', pct: 8 },
            ].map((d) => (
              <div key={d.device} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-800">{d.device}</span>
                  <span className="font-mono text-slate-500">{d.pct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: `${d.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
