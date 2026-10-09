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
  ShieldAlert,
  UserX,
  UserCheck,
  Trash2,
  Sparkles,
  Receipt,
  Activity,
  Key,
  Clock,
  AlertTriangle,
  X,
  ExternalLink,
  RefreshCw,
  Phone,
  Mail,
  Award,
} from 'lucide-react';
import {
  adminService,
  StudentRecord,
  OrderRecord,
  StudentActivityRecord,
} from '../../../services/adminService';
import { useAuth } from '../../../context/AuthContext';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';

export const AdminStudentsSection: React.FC = () => {
  const { entitlements } = useAuth();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [boardFilter, setBoardFilter] = useState('All');
  const [passFilter, setPassFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal / Drawer state for inspecting student profile
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'entitlements' | 'lifecycle' | 'orders' | 'activity'>('entitlements');
  const [studentOrders, setStudentOrders] = useState<OrderRecord[]>([]);
  const [studentActivity, setStudentActivity] = useState<StudentActivityRecord[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Forms inside inspector
  const [customExpiry, setCustomExpiry] = useState('');
  const [policyReason, setPolicyReason] = useState('GDPR_STUDENT_REQUEST');
  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState('Customer request');

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await adminService.getStudents({
        q: search,
        studentClass: gradeFilter,
        board: boardFilter,
        passStatus: passFilter,
        includeDisabled: true,
      });
      setStudents(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [search, gradeFilter, boardFilter, passFilter]);

  const handleOpenInspector = async (student: StudentRecord) => {
    setSelectedStudent(student);
    setActiveTab('entitlements');
    setActionMessage(null);
    setCustomExpiry(student.passExpiry || '2027-04-30');

    // Load full orders and activity
    const [orders, activity] = await Promise.all([
      adminService.getUserOrders(student.uid),
      adminService.getUserActivity(student.uid),
    ]);
    setStudentOrders(orders);
    setStudentActivity(activity);
  };

  const handleCloseInspector = () => {
    setSelectedStudent(null);
    setActionMessage(null);
    setRefundOrderId(null);
  };

  // Actions
  const handleToggleDisabled = async () => {
    if (!selectedStudent) return;
    const newStatus = !selectedStudent.disabled;
    setActionLoading(true);
    setActionMessage(null);

    const res = await adminService.toggleUserDisabled(selectedStudent.uid, newStatus);
    setActionLoading(false);
    if (res.success) {
      const updated = { ...selectedStudent, disabled: newStatus };
      setSelectedStudent(updated);
      setStudents((prev) => prev.map((s) => (s.uid === updated.uid ? updated : s)));
      setActionMessage({
        type: 'success',
        text: newStatus
          ? 'User account disabled via Firebase Admin SDK. Tokens revoked.'
          : 'User account successfully reactivated.',
      });
    } else {
      setActionMessage({ type: 'error', text: res.error || 'Failed to update user status.' });
    }
  };

  const handleDeleteAccordingToPolicy = async () => {
    if (!selectedStudent) return;

    setActionLoading(true);
    setActionMessage(null);

    const res = await adminService.deleteUserAccordingToPolicy(selectedStudent.uid, policyReason);
    setActionLoading(false);
    if (res.success) {
      setActionMessage({
        type: 'success',
        text: 'User successfully removed according to policy and Auth profile purged.',
      });
      loadStudents();
      setTimeout(() => handleCloseInspector(), 1500);
    } else {
      setActionMessage({ type: 'error', text: res.error || 'Failed to remove user.' });
    }
  };

  const handleTogglePro = async (grant: boolean) => {
    if (!selectedStudent) return;
    setActionLoading(true);
    setActionMessage(null);

    const res = await adminService.setUserProStatus(
      selectedStudent.uid,
      grant,
      grant ? 'Admin granted Pro access' : 'Admin revoked Pro access'
    );
    setActionLoading(false);
    if (res.success) {
      const updated = { ...selectedStudent, isPro: grant };
      setSelectedStudent(updated);
      setStudents((prev) => prev.map((s) => (s.uid === updated.uid ? updated : s)));
      setActionMessage({
        type: 'success',
        text: grant
          ? 'Pro privileges granted via Firebase custom claim pro:true. Token refresh forced.'
          : 'Pro privileges revoked. Token refresh forced.',
      });
    } else {
      setActionMessage({ type: 'error', text: res.error || 'Failed to update Pro status.' });
    }
  };

  const handleToggleAnnualPass = async (grant: boolean) => {
    if (!selectedStudent) return;
    setActionLoading(true);
    setActionMessage(null);

    const res = await adminService.setUserAnnualPass(
      selectedStudent.uid,
      grant,
      grant ? customExpiry : undefined,
      grant ? 'Admin granted Annual Pass' : 'Admin revoked Annual Pass'
    );
    setActionLoading(false);
    if (res.success) {
      const updated = {
        ...selectedStudent,
        hasAnnualPass: grant,
        passExpiry: grant ? customExpiry : undefined,
        isPro: grant ? true : selectedStudent.isPro,
      };
      setSelectedStudent(updated);
      setStudents((prev) => prev.map((s) => (s.uid === updated.uid ? updated : s)));
      setActionMessage({
        type: 'success',
        text: grant
          ? `Annual Pass granted until ${customExpiry}. Custom claims updated.`
          : 'Annual Pass revoked.',
      });
    } else {
      setActionMessage({ type: 'error', text: res.error || 'Failed to update Annual Pass.' });
    }
  };

  const handleChangeExpiry = async () => {
    if (!selectedStudent || !customExpiry) return;
    setActionLoading(true);
    setActionMessage(null);

    const res = await adminService.changeUserAnnualPassExpiry(
      selectedStudent.uid,
      customExpiry,
      'Admin updated Annual Pass expiry date'
    );
    setActionLoading(false);
    if (res.success) {
      const updated = { ...selectedStudent, passExpiry: customExpiry, hasAnnualPass: true, isPro: true };
      setSelectedStudent(updated);
      setStudents((prev) => prev.map((s) => (s.uid === updated.uid ? updated : s)));
      setActionMessage({
        type: 'success',
        text: `Annual Pass expiry successfully updated to ${customExpiry}. Token refresh forced.`,
      });
    } else {
      setActionMessage({ type: 'error', text: res.error || 'Failed to update expiry.' });
    }
  };

  const handleRoleChange = async (newRole: 'admin' | 'superAdmin' | 'student') => {
    if (!selectedStudent) return;
    setActionLoading(true);
    setActionMessage(null);

    const res = await adminService.setUserRole(selectedStudent.uid, newRole);
    setActionLoading(false);
    if (res.success) {
      const updated = { ...selectedStudent, role: newRole };
      setSelectedStudent(updated);
      setStudents((prev) => prev.map((s) => (s.uid === updated.uid ? updated : s)));
      setActionMessage({
        type: 'success',
        text: `Role successfully updated to ${newRole}. Claims refreshed & tokens revoked.`,
      });
    } else {
      setActionMessage({ type: 'error', text: res.error || 'Failed to update role.' });
    }
  };

  const handleProcessRefund = async (order: OrderRecord) => {
    setActionLoading(true);
    setActionMessage(null);
    const res = await adminService.processRefund(order.id, order.amount, refundReason);
    setActionLoading(false);
    if (res.success) {
      setStudentOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: 'refunded' } : o))
      );
      setRefundOrderId(null);
      setActionMessage({
        type: 'success',
        text: `Refund processed for order ${order.orderNumber}. Audit log recorded.`,
      });
    } else {
      setActionMessage({ type: 'error', text: res.error || 'Failed to process refund.' });
    }
  };

  const handleExportCSV = () => {
    const headers = 'UID,Name,Email,Grade,Board,HasPass,Expiry,IsPro,Disabled,Streak,Joined\n';
    const rows = students
      .map(
        (s) =>
          `"${s.uid}","${s.displayName}","${s.email}","${s.studentClass}","${s.board}",${s.hasAnnualPass},"${s.passExpiry || ''}",${Boolean(s.isPro)},${Boolean(s.disabled)},${s.streakDays},"${s.createdAt}"`
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Student & User Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Server-side Firebase Admin SDK user management: profile inspection, custom claims, account status, policy deletion, orders, and activity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleExportCSV} className="gap-1.5 shadow-2xs">
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
          <Button size="sm" variant="secondary" onClick={loadStudents} className="gap-1.5 shadow-2xs">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, email, UID, or phone number..."
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

      {/* Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>{students.length} Students Listed</span>
          <span className="font-mono text-[11px] text-emerald-700 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Firebase Admin SDK Custom Claims Enforced</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-heading text-[10px]">
              <tr>
                <th className="px-5 py-3">Student Name</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">Board</th>
                <th className="px-4 py-3">Entitlements</th>
                <th className="px-4 py-3">Account Status</th>
                <th className="px-4 py-3">Streak</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {students.map((s) => (
                <tr key={s.uid} className={`hover:bg-blue-50/20 transition-colors ${s.disabled ? 'bg-rose-50/20 opacity-75' : ''}`}>
                  <td className="px-5 py-3.5">
                    <div className="font-heading font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{s.displayName}</span>
                      {s.disabled && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          DISABLED
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">{s.email}</div>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-blue-700">{s.studentClass}</td>
                  <td className="px-4 py-3.5 text-slate-600">{s.board}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-1 items-start">
                      {s.hasAnnualPass ? (
                        <Badge variant="pro">ANNUAL PASS</Badge>
                      ) : s.isPro ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          PRO ACTIVE
                        </span>
                      ) : (
                        <Badge variant="free">FREE ACCESS</Badge>
                      )}
                      {s.passExpiry && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Expires {s.passExpiry}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {s.disabled ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Suspended</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-600">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span>{s.streakDays}d</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-[10px] uppercase font-bold text-slate-600">
                      {s.role || 'student'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <button
                      className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded border border-blue-200 transition-colors cursor-pointer"
                      onClick={() => handleOpenInspector(s)}
                    >
                      Manage User
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Inspector Modal / Drawer */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-heading font-bold text-sm shadow-xs">
                  {selectedStudent.displayName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-extrabold text-base text-slate-900">
                      {selectedStudent.displayName}
                    </h3>
                    {selectedStudent.disabled ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        ACCOUNT DISABLED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ACTIVE USER
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-mono mt-0.5">
                    <span>{selectedStudent.email}</span>
                    <span>·</span>
                    <span>UID: {selectedStudent.uid}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCloseInspector}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metadata Strip */}
            <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
              <div className="flex items-center gap-4">
                <span>Grade: <strong className="text-slate-800 font-bold">{selectedStudent.studentClass}</strong></span>
                <span>Board: <strong className="text-slate-800 font-bold">{selectedStudent.board}</strong></span>
                <span>Phone: <strong className="text-slate-800 font-mono">{selectedStudent.phoneNumber || 'Not provided'}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5" />
                <span>Joined: {selectedStudent.createdAt.split('T')[0]}</span>
              </div>
            </div>

            {/* Action Feedback Notification */}
            {actionMessage && (
              <div
                className={`px-6 py-2.5 text-xs font-medium flex items-center gap-2 ${
                  actionMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-b border-rose-200'
                }`}
              >
                {actionMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{actionMessage.text}</span>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="px-6 pt-3 border-b border-slate-200 flex items-center gap-4">
              <button
                onClick={() => setActiveTab('entitlements')}
                className={`pb-2.5 text-xs font-heading font-bold border-b-2 cursor-pointer transition-colors ${
                  activeTab === 'entitlements'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Pass & Pro Claims
              </button>
              <button
                onClick={() => setActiveTab('lifecycle')}
                className={`pb-2.5 text-xs font-heading font-bold border-b-2 cursor-pointer transition-colors ${
                  activeTab === 'lifecycle'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Account & Roles
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`pb-2.5 text-xs font-heading font-bold border-b-2 cursor-pointer transition-colors ${
                  activeTab === 'orders'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Orders ({studentOrders.length})
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`pb-2.5 text-xs font-heading font-bold border-b-2 cursor-pointer transition-colors ${
                  activeTab === 'activity'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                AI & Study Activity ({studentActivity.length})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* TAB 1: ENTITLEMENTS */}
              {activeTab === 'entitlements' && (
                <div className="space-y-5">
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-start gap-2.5">
                    <Key className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Cryptographic Custom Claims:</strong> Role entitlements are stored in verified Firebase ID token claims (<code className="font-mono text-blue-900">pro</code> and <code className="font-mono text-blue-900">annualPass</code>). Updating these claims revokes refresh tokens on the server to force immediate re-authentication.
                    </div>
                  </div>

                  {/* Annual Pass Management */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                          <Award className="w-4 h-4 text-purple-600" />
                          <span>Annual Pass Entitlement</span>
                        </h4>
                        <p className="text-xs text-slate-500">
                          Grants full access to all curriculum chapters, formulas, offline downloads, and AI teacher.
                        </p>
                      </div>

                      {selectedStudent.hasAnnualPass ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-rose-600 border-rose-200 hover:bg-rose-50"
                          disabled={actionLoading}
                          onClick={() => handleToggleAnnualPass(false)}
                        >
                          Revoke Annual Pass
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={actionLoading}
                          onClick={() => handleToggleAnnualPass(true)}
                        >
                          Grant Annual Pass
                        </Button>
                      )}
                    </div>

                    {/* Expiry Date Editor */}
                    <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block">
                          Annual Pass Expiry Date (YYYY-MM-DD):
                        </label>
                        <span className="text-[11px] text-slate-400">
                          Current expiry: {selectedStudent.passExpiry || 'Not set'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={customExpiry}
                          onChange={(e) => setCustomExpiry(e.target.value)}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading || !customExpiry}
                          onClick={handleChangeExpiry}
                        >
                          Update Expiry
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Pro Tier Management */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Pro Tier Access</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Sets <code className="font-mono text-slate-700">pro: true</code> claim in ID token.
                      </p>
                    </div>

                    {selectedStudent.isPro ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading}
                        onClick={() => handleTogglePro(false)}
                      >
                        Remove Pro
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={actionLoading}
                        onClick={() => handleTogglePro(true)}
                      >
                        Grant Pro
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: LIFECYCLE & ROLES */}
              {activeTab === 'lifecycle' && (
                <div className="space-y-5">
                  {/* Disable User Account */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                        {selectedStudent.disabled ? (
                          <UserX className="w-4 h-4 text-rose-600" />
                        ) : (
                          <UserCheck className="w-4 h-4 text-emerald-600" />
                        )}
                        <span>Account Access Status</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        {selectedStudent.disabled
                          ? 'This user is suspended. Firebase ID tokens will be rejected.'
                          : 'User account is active. Disabling terminates current session.'}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant={selectedStudent.disabled ? 'primary' : 'outline'}
                      className={!selectedStudent.disabled ? 'text-rose-600 border-rose-200 hover:bg-rose-50' : ''}
                      disabled={actionLoading}
                      onClick={handleToggleDisabled}
                    >
                      {selectedStudent.disabled ? 'Re-enable Account' : 'Disable User'}
                    </Button>
                  </div>

                  {/* Role Assignment: RBAC Gated */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                          <span>Administrative Role Assignment</span>
                        </h4>
                        <p className="text-xs text-slate-500">
                          Current role: <strong className="font-mono font-bold text-slate-800">{selectedStudent.role || 'student'}</strong>
                        </p>
                      </div>

                      {!entitlements.isSuperAdmin && (
                        <span className="text-[11px] font-mono text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                          SuperAdmin privilege required to assign admin roles
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                      {selectedStudent.role === 'admin' || selectedStudent.role === 'superAdmin' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-rose-600 border-rose-200 hover:bg-rose-50"
                          disabled={actionLoading || !entitlements.isSuperAdmin}
                          onClick={() => handleRoleChange('student')}
                        >
                          Remove Admin Privileges
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionLoading || !entitlements.isSuperAdmin}
                            onClick={() => handleRoleChange('admin')}
                          >
                            Promote to Admin
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={actionLoading || !entitlements.isSuperAdmin}
                            onClick={() => handleRoleChange('superAdmin')}
                          >
                            Promote to SuperAdmin
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Policy Deletion Section */}
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3">
                    <div className="flex items-center gap-2 text-rose-800">
                      <Trash2 className="w-4 h-4" />
                      <h4 className="font-heading font-bold text-sm">
                        Delete User According to Policy
                      </h4>
                    </div>

                    <p className="text-xs text-rose-700 leading-relaxed">
                      Complies with Indian Digital Personal Data Protection (DPDP) Act and GDPR student removal guidelines. Deleting permanently purges the authentication credentials and records an authoritative audit entry.
                    </p>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                      <select
                        value={policyReason}
                        onChange={(e) => setPolicyReason(e.target.value)}
                        className="bg-white border border-rose-300 rounded-lg px-3 py-1.5 text-xs font-heading font-medium text-slate-800 cursor-pointer flex-1"
                      >
                        <option value="GDPR_STUDENT_REQUEST">GDPR / Student Erasure Request</option>
                        <option value="PARENT_GUARDIAN_REQUEST">Parent / Guardian Legal Request</option>
                        <option value="TERMS_VIOLATION">Terms of Service / Anti-Abuse Violation</option>
                        <option value="INACTIVE_RETENTION_POLICY">Inactive Account Cleanup Policy</option>
                        <option value="DUPLICATE_ACCOUNT">Duplicate Identity Account Merge</option>
                      </select>

                      <Button
                        size="sm"
                        variant="primary"
                        className="bg-rose-600 hover:bg-rose-700 text-white shrink-0"
                        disabled={actionLoading}
                        onClick={handleDeleteAccordingToPolicy}
                      >
                        Execute Policy Deletion
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ORDERS */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  {studentOrders.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400 font-mono">
                      No purchase orders recorded for this student account.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {studentOrders.map((ord) => (
                        <div
                          key={ord.id || ord.orderNumber}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="font-heading font-bold text-slate-900 flex items-center gap-2">
                              <span>{ord.planName}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  ord.status === 'captured' || ord.status === 'paid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : ord.status === 'refunded'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {ord.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                              Order: {ord.orderNumber} · Gateway: {ord.gateway} · {ord.createdAt.split('T')[0]}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-heading font-extrabold text-sm text-slate-900">
                              ₹{ord.amount}
                            </span>
                            {ord.status !== 'refunded' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleProcessRefund(ord)}
                                disabled={actionLoading}
                              >
                                Refund Order
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: ACTIVITY LOG */}
              {activeTab === 'activity' && (
                <div className="space-y-3">
                  {studentActivity.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400 font-mono">
                      No recent activity events recorded.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                      {studentActivity.map((act) => (
                        <div key={act.id} className="p-3.5 flex items-start gap-3 bg-white">
                          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                            <Activity className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-xs">
                            <div className="font-heading font-bold text-slate-900">{act.title}</div>
                            <div className="text-slate-500 mt-0.5">{act.description}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-1">
                              {new Date(act.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400 text-[11px]">
                ID: {selectedStudent.uid}
              </span>
              <Button size="sm" variant="outline" onClick={handleCloseInspector}>
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
