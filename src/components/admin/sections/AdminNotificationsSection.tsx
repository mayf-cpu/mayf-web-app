import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  Users,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Info,
  Tag,
  BookOpen,
} from 'lucide-react';
import { adminService, AdminBroadcastNotification } from '../../../services/adminService';
import { Button } from '../../ui/Button';

export const AdminNotificationsSection: React.FC = () => {
  const [notifications, setNotifications] = useState<AdminBroadcastNotification[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetClass, setTargetClass] = useState('All');
  const [type, setType] = useState<'info' | 'alert' | 'promo' | 'exam'>('info');
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    adminService.getNotifications().then(setNotifications);
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    const res = await adminService.sendBroadcastNotification({
      title: title.trim(),
      message: message.trim(),
      targetClass,
      type,
    });

    if (res.success) {
      setNotifications([res.notification, ...notifications]);
      setTitle('');
      setMessage('');
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
          Student Announcement & In-App Notification Broadcaster
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Send syllabus updates, exam revision reminders, and holiday announcements to registered students.
        </p>
      </div>

      {/* Broadcast Composer */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <h3 className="font-heading font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
          <Send className="w-4 h-4 text-blue-600" />
          <span>Compose New Announcement</span>
        </h3>

        <form onSubmit={handleBroadcast} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-700">Notification Title:</label>
              <input
                type="text"
                placeholder="e.g. CBSE Class 10 Term 2 Mathematics Blueprint Released"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Target Audience:</label>
              <select
                value={targetClass}
                onChange={(e) => setTargetClass(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
              >
                <option value="All">All Students (Classes 5–10)</option>
                <option value="Class 10">Class 10 Only</option>
                <option value="Class 9">Class 9 Only</option>
                <option value="Class 8">Class 8 Only</option>
                <option value="Class 7">Class 7 Only</option>
                <option value="Class 6">Class 6 Only</option>
                <option value="Class 5">Class 5 Only</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Message Body:</label>
            <textarea
              rows={3}
              placeholder="Detailed notification message shown in student notification bell..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Notification Type:</span>
              <div className="flex items-center gap-1">
                {(['info', 'exam', 'promo', 'alert'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`px-2.5 py-1 text-xs font-heading font-semibold rounded cursor-pointer transition-colors ${
                      type === t
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <Button size="sm" variant="primary" type="submit" className="gap-1.5 shadow-xs">
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Now</span>
            </Button>
          </div>
        </form>

        {sentSuccess && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Announcement successfully broadcast to active student inboxes.</span>
          </div>
        )}
      </div>

      {/* Broadcast History */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>Broadcast Log History</span>
          <span className="font-mono text-[11px] text-blue-700">Push & In-App Sync</span>
        </div>

        <div className="divide-y divide-slate-100">
          {notifications.map((n) => (
            <div key={n.id} className="p-4 hover:bg-slate-50/40 transition-colors flex items-start justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-slate-900">{n.title}</span>
                  <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                    {n.type}
                  </span>
                  <span className="text-[11px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                    Target: {n.targetClass}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed max-w-2xl">{n.message}</p>
                <div className="text-[10px] text-slate-400 font-mono">
                  Sent on {n.createdAt.split('T')[0]} by {n.author}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded text-xs">
                  {n.sentCount.toLocaleString()} delivered
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
