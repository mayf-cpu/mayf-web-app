import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  CreditCard,
  Flame,
  Calendar,
  CheckCircle2,
  XCircle,
  MoreVertical,
  ShieldCheck,
} from 'lucide-react';
import { adminService, StudentRecord } from '../../../services/adminService';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';

export const AdminStudentsSection: React.FC = () => {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [boardFilter, setBoardFilter] = useState('All');
  const [passFilter, setPassFilter] = useState('All');

  useEffect(() => {
    adminService.getStudents().then(setStudents);
  }, []);

  const filtered = students.filter((s) => {
    if (gradeFilter !== 'All' && s.studentClass !== gradeFilter) return false;
    if (boardFilter !== 'All' && s.board !== boardFilter) return false;
    if (passFilter === 'pass' && !s.hasAnnualPass) return false;
    if (passFilter === 'free' && s.hasAnnualPass) return false;
    if (
      search &&
      !s.displayName.toLowerCase().includes(search.toLowerCase()) &&
      !s.email.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = 'UID,Name,Email,Grade,Board,HasPass,Expiry,Streak,Joined\n';
    const rows = filtered
      .map(
        (s) =>
          `"${s.uid}","${s.displayName}","${s.email}","${s.studentClass}","${s.board}",${s.hasAnnualPass},"${s.passExpiry || ''}",${s.streakDays},"${s.createdAt}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mayf-students-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
            Registered Student Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Student profiles stored in <code className="font-mono text-blue-700">/users/{'{uid}'}</code>.
            Authorization is strictly validated via ID token custom claims.
          </p>
        </div>

        <Button size="sm" variant="outline" onClick={handleExportCSV} className="gap-1.5 shadow-2xs">
          <Download className="w-3.5 h-3.5" />
          <span>Export Student CSV</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student by name or email address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              aria-label="Filter students by class"
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-heading font-medium text-slate-700 cursor-pointer"
            >
              <option value="All">All Grades (5–10)</option>
              <option value="Class 5">Class 5</option>
              <option value="Class 6">Class 6</option>
              <option value="Class 7">Class 7</option>
              <option value="Class 8">Class 8</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
            </select>

            <select
              aria-label="Filter students by board"
              value={boardFilter}
              onChange={(e) => setBoardFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-heading font-medium text-slate-700 cursor-pointer"
            >
              <option value="All">All Boards</option>
              <option value="CBSE">CBSE</option>
              <option value="ICSE">ICSE</option>
            </select>

            <select
              aria-label="Filter students by pass status"
              value={passFilter}
              onChange={(e) => setPassFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-heading font-medium text-slate-700 cursor-pointer"
            >
              <option value="All">All Entitlements</option>
              <option value="pass">Annual Pass Active</option>
              <option value="free">Free Access Tier</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>{filtered.length} Students Displayed</span>
          <span className="font-mono text-[11px] text-emerald-700">Firestore Protected RBAC</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-heading text-[10px]">
              <tr>
                <th className="px-5 py-3">Student Name</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">Board</th>
                <th className="px-4 py-3">Pass Entitlement</th>
                <th className="px-4 py-3">Streak</th>
                <th className="px-4 py-3">Last Active</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.map((s) => (
                <tr key={s.uid} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-heading font-bold text-slate-900">{s.displayName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{s.email}</div>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-blue-700">{s.studentClass}</td>
                  <td className="px-4 py-3.5 text-slate-600">{s.board}</td>
                  <td className="px-4 py-3.5">
                    {s.hasAnnualPass ? (
                      <div className="space-y-0.5">
                        <Badge variant="pro">ANNUAL PASS</Badge>
                        {s.passExpiry && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Expires {s.passExpiry}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Badge variant="free">FREE ACCESS</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-600">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span>{s.streakDays}d</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                    {s.lastActiveDate}
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <button
                      className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded border border-blue-200 transition-colors cursor-pointer"
                      onClick={() => alert(`Student profile inspector for ${s.displayName} (${s.uid})`)}
                    >
                      Inspect Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
