import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  Users,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Info,
  Gift,
  Megaphone,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Image,
  Eye,
  RefreshCw,
  Clock,
  ShieldCheck,
  Check,
  X,
  ArrowRight,
  Filter,
  UserCheck,
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import {
  BroadcastItem,
  BroadcastCategory,
  BroadcastAudience,
  BROADCAST_CATEGORY_CONFIG,
  BROADCAST_AUDIENCE_CONFIG,
} from '../../../lib/broadcasts/broadcastTypes';
import { Button } from '../../ui/Button';

export const AdminNotificationsSection: React.FC = () => {
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<'all' | BroadcastCategory>('all');
  const [audienceFilter, setAudienceFilter] = useState<'all' | BroadcastAudience>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Form / Composer State
  const [showComposer, setShowComposer] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [category, setCategory] = useState<BroadcastCategory>('site_announcement');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [linkText, setLinkText] = useState('Learn More');
  const [imageUrl, setImageUrl] = useState('');
  const [audience, setAudience] = useState<BroadcastAudience>('all');
  const [selectedEmailsText, setSelectedEmailsText] = useState('');
  const [startTime, setStartTime] = useState(() => new Date().toISOString().slice(0, 16));
  const [hasEndTime, setHasEndTime] = useState(false);
  const [endTime, setEndTime] = useState(() => {
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return nextWeek.toISOString().slice(0, 16);
  });
  const [isActive, setIsActive] = useState(true);
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [dismissible, setDismissible] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);

  const fetchBroadcasts = async () => {
    setLoading(true);
    try {
      const items = await adminService.getAllBroadcasts();
      setBroadcasts(items);
    } catch (e: any) {
      setErrorMessage('Failed to load broadcasts: ' + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setCategory('site_announcement');
    setTitle('');
    setMessage('');
    setLink('');
    setLinkText('Learn More');
    setImageUrl('');
    setAudience('all');
    setSelectedEmailsText('');
    setStartTime(new Date().toISOString().slice(0, 16));
    setHasEndTime(false);
    setIsActive(true);
    setPriority('normal');
    setDismissible(true);
    setPreviewMode(false);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowComposer(true);
  };

  const handleOpenEdit = (b: BroadcastItem) => {
    setEditingId(b.id);
    setCategory(b.category);
    setTitle(b.title);
    setMessage(b.message);
    setLink(b.link || '');
    setLinkText(b.linkText || 'Learn More');
    setImageUrl(b.imageUrl || '');
    setAudience(b.audience);
    setSelectedEmailsText((b.selectedUserEmails || []).join(', '));
    setStartTime(b.startTime ? new Date(b.startTime).toISOString().slice(0, 16) : '');
    if (b.endTime) {
      setHasEndTime(true);
      setEndTime(new Date(b.endTime).toISOString().slice(0, 16));
    } else {
      setHasEndTime(false);
    }
    setIsActive(b.isActive);
    setPriority(b.priority || 'normal');
    setDismissible(b.dismissible ?? true);
    setShowComposer(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Broadcast title is required.');
      return;
    }
    if (!message.trim()) {
      setErrorMessage('Broadcast message body is required.');
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);

    const payload = {
      category,
      title: title.trim(),
      message: message.trim(),
      link: link.trim() || undefined,
      linkText: linkText.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      audience,
      selectedUserEmails:
        audience === 'selected_users'
          ? selectedEmailsText
              .split(/[\n,]/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
      endTime: hasEndTime && endTime ? new Date(endTime).toISOString() : undefined,
      isActive,
      priority,
      dismissible,
    };

    try {
      if (editingId) {
        const res = await adminService.updateBroadcast(editingId, payload);
        if (res.success && res.item) {
          setBroadcasts((prev) => prev.map((item) => (item.id === editingId ? res.item! : item)));
          setSuccessMessage(`Broadcast "${payload.title}" updated successfully.`);
          setShowComposer(false);
          resetForm();
        } else {
          setErrorMessage(res.error || 'Failed to update broadcast.');
        }
      } else {
        const res = await adminService.createBroadcast(payload);
        if (res.success && res.item) {
          setBroadcasts((prev) => [res.item!, ...prev]);
          setSuccessMessage(`New broadcast "${payload.title}" created successfully.`);
          setShowComposer(false);
          resetForm();
        } else {
          setErrorMessage(res.error || 'Failed to create broadcast.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error submitting broadcast.');
    } finally {
      setActionLoading(false);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  const handleToggleStatus = async (item: BroadcastItem) => {
    try {
      const nextActive = !item.isActive;
      const res = await adminService.updateBroadcast(item.id, { isActive: nextActive });
      if (res.success) {
        setBroadcasts((prev) =>
          prev.map((b) => (b.id === item.id ? { ...b, isActive: nextActive } : b))
        );
      }
    } catch (e: any) {
      setErrorMessage('Failed to toggle status: ' + (e?.message || e));
    }
  };

  const handleDelete = async (id: string, titleStr: string) => {
    try {
      const res = await adminService.deleteBroadcast(id);
      if (res.success) {
        setBroadcasts((prev) => prev.filter((b) => b.id !== id));
        setSuccessMessage(`Broadcast "${titleStr}" deleted.`);
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(res.error || 'Failed to delete broadcast.');
      }
    } catch (e: any) {
      setErrorMessage('Failed to delete broadcast: ' + (e?.message || e));
    }
  };

  // Filtered list
  const filteredBroadcasts = broadcasts.filter((b) => {
    if (categoryFilter !== 'all' && b.category !== categoryFilter) return false;
    if (audienceFilter !== 'all' && b.audience !== audienceFilter) return false;
    if (statusFilter === 'active' && !b.isActive) return false;
    if (statusFilter === 'inactive' && b.isActive) return false;
    return true;
  });

  // Aggregated Counts
  const activeCount = broadcasts.filter((b) => b.isActive).length;
  const siteAnnouncementCount = broadcasts.filter((b) => b.category === 'site_announcement').length;
  const dashboardCount = broadcasts.filter((b) => b.category === 'dashboard_notification').length;
  const promoCount = broadcasts.filter((b) => b.category === 'promotional_notification').length;
  const maintenanceCount = broadcasts.filter((b) => b.category === 'maintenance_message').length;

  const getCategoryIcon = (cat: BroadcastCategory) => {
    switch (cat) {
      case 'site_announcement':
        return <Megaphone className="w-4 h-4 text-blue-600" />;
      case 'dashboard_notification':
        return <Bell className="w-4 h-4 text-emerald-600" />;
      case 'promotional_notification':
        return <Gift className="w-4 h-4 text-purple-600" />;
      case 'maintenance_message':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Internal Website First Note */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
              Notification & Broadcast Management
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Internal Website First
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Publish site announcements, dashboard inbox notifications, promotional banners, and maintenance alerts across learner touchpoints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchBroadcasts}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          {!showComposer && (
            <Button
              size="sm"
              variant="primary"
              onClick={handleOpenCreate}
              className="gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Broadcast</span>
            </Button>
          )}
        </div>
      </div>

      {/* Security & Push Notification Architecture Notice */}
      <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold">Internal Website Notifications First Architecture</p>
          <p className="text-[11px] text-blue-800/90 leading-relaxed">
            Broadcasts render strictly via client-side components and student dashboard inboxes.
            External browser push notification permissions and service workers are deliberately decoupled, preventing intrusive permission dialogs on minors.
          </p>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total</span>
          <span className="text-xl font-heading font-extrabold text-slate-900">{broadcasts.length}</span>
          <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">{activeCount} active</span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Site Banner</span>
          <span className="text-xl font-heading font-extrabold text-blue-900">{siteAnnouncementCount}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Top sticky banner</span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Dashboard</span>
          <span className="text-xl font-heading font-extrabold text-emerald-900">{dashboardCount}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Inbox & Bell alerts</span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Promotions</span>
          <span className="text-xl font-heading font-extrabold text-purple-900">{promoCount}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Deals & pass offers</span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Maintenance</span>
          <span className="text-xl font-heading font-extrabold text-amber-900">{maintenanceCount}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">System advisories</span>
        </div>
      </div>

      {/* Broadcast Composer / Editor */}
      {showComposer && (
        <div className="bg-white rounded-2xl border-2 border-blue-600/30 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                {editingId ? <Edit3 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-slate-900">
                  {editingId ? 'Edit Broadcast / Notification' : 'Create New Broadcast / Notification'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Configure category, targeting audience, schedules, and display payload.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  previewMode ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{previewMode ? 'Hide Preview' : 'Live Preview'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowComposer(false);
                  resetForm();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Live Preview Panel */}
          {previewMode && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Real-Time In-App Render Preview
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Category: {BROADCAST_CATEGORY_CONFIG[category].label}
                </span>
              </div>

              {category === 'site_announcement' && (
                <div className="bg-[#1D4ED8] text-white p-2.5 rounded-lg text-xs flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2 truncate">
                    <Megaphone className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-extrabold uppercase text-[9px] px-1 py-0.2 bg-white/20 rounded">
                      ANNOUNCEMENT
                    </span>
                    <span className="font-bold truncate">{title || 'Sample Announcement Title'}</span>
                    <span className="text-[11px] opacity-80 hidden sm:inline truncate">— {message || 'Your message will appear here'}</span>
                  </div>
                  {link && (
                    <span className="px-2 py-0.5 rounded bg-white text-slate-900 font-bold text-[10px] shrink-0">
                      {linkText || 'Learn More'}
                    </span>
                  )}
                </div>
              )}

              {category === 'maintenance_message' && (
                <div className="bg-amber-600 text-white p-2.5 rounded-lg text-xs flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2 truncate">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-extrabold uppercase text-[9px] px-1 py-0.2 bg-white/20 rounded">
                      MAINTENANCE
                    </span>
                    <span className="font-bold truncate">{title || 'Scheduled Maintenance Notice'}</span>
                    <span className="text-[11px] opacity-80 hidden sm:inline truncate">— {message || 'Details regarding system advisory'}</span>
                  </div>
                  {link && (
                    <span className="px-2 py-0.5 rounded bg-white text-slate-900 font-bold text-[10px] shrink-0">
                      {linkText || 'Details'}
                    </span>
                  )}
                </div>
              )}

              {category === 'dashboard_notification' && (
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs text-slate-900 truncate">{title || 'Notification Headline'}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">Just now</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{message || 'Dashboard notification text will be presented to eligible students.'}</p>
                    {link && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 mt-1.5">
                        {linkText || 'Go to resource'} <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              )}

              {category === 'promotional_notification' && (
                <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Promo" className="w-full sm:w-24 h-16 object-cover rounded-lg shrink-0" />
                  ) : (
                    <div className="w-full sm:w-24 h-16 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 shrink-0">
                      <Gift className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 w-full">
                    <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 font-bold text-[9px] rounded uppercase">
                      PROMOTIONAL
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 mt-0.5">{title || 'Special Academic Offer'}</h4>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{message || 'Offer description text...'}</p>
                  </div>
                  {link && (
                    <span className="px-3 py-1.5 rounded-lg bg-purple-600 text-white font-bold text-xs shrink-0">
                      {linkText || 'Unlock Offer'}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Category Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Broadcast Category:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    'site_announcement',
                    'dashboard_notification',
                    'promotional_notification',
                    'maintenance_message',
                  ] as BroadcastCategory[]
                ).map((cat) => {
                  const cfg = BROADCAST_CATEGORY_CONFIG[cat];
                  const isSel = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSel
                          ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {getCategoryIcon(cat)}
                        <span className="font-heading font-bold text-xs text-slate-900">
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                        {cfg.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Target Audience */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Target Audience:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(
                  [
                    'all',
                    'free_users',
                    'pro_users',
                    'annual_pass',
                    'selected_users',
                  ] as BroadcastAudience[]
                ).map((aud) => {
                  const cfg = BROADCAST_AUDIENCE_CONFIG[aud];
                  const isSel = audience === aud;
                  return (
                    <button
                      key={aud}
                      type="button"
                      onClick={() => setAudience(aud)}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        isSel
                          ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600/30'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="font-heading font-bold text-[11px] text-slate-900 block truncate">
                        {cfg.label}
                      </span>
                      <p className="text-[9px] text-slate-500 line-clamp-1 mt-0.5">
                        {cfg.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Selected User Emails Input */}
              {audience === 'selected_users' && (
                <div className="mt-2.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
                  <label className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span>Target Email Addresses (Comma or Newline Separated):</span>
                  </label>
                  <textarea
                    rows={2}
                    value={selectedEmailsText}
                    onChange={(e) => setSelectedEmailsText(e.target.value)}
                    placeholder="student1@gmail.com, student2@example.com"
                    className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-amber-800">
                    Only students logging in with these exact email addresses will receive this broadcast.
                  </p>
                </div>
              )}
            </div>

            {/* 3. Title & Message */}
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Title: <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">{title.length}/150</span>
                </div>
                <input
                  type="text"
                  maxLength={150}
                  required
                  placeholder="e.g. CBSE Class 10 Term 2 Blueprint Released"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Message Body: <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">{message.length}/600</span>
                </div>
                <textarea
                  rows={3}
                  maxLength={600}
                  required
                  placeholder="Detailed announcement copy. Plaintext only (no arbitrary executable HTML allowed)."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* 4. Link & Image URL (Optional) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                  <span>Action Link (Optional):</span>
                </label>
                <input
                  type="text"
                  placeholder="/annual-pass or https://..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Button Label:</label>
                <input
                  type="text"
                  placeholder="Learn More, Unlock Pass..."
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Image className="w-3 h-3 text-slate-500" />
                  <span>Image URL (Optional):</span>
                </label>
                <input
                  type="text"
                  placeholder="https://... (CDN or Unsplash)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* 5. Schedule & Timing (Start Time & End Time) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Start Time (Go-Live):</span>
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-400 block">Broadcast becomes visible after this moment.</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>End Time (Expiration):</span>
                  </label>
                  <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasEndTime}
                      onChange={(e) => setHasEndTime(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Expires</span>
                  </label>
                </div>

                {hasEndTime ? (
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                ) : (
                  <div className="px-3 py-2 bg-slate-100 rounded-lg text-[11px] text-slate-500 font-medium italic">
                    Permanent / No automatic expiration
                  </div>
                )}
                <span className="text-[10px] text-slate-400 block">Automatically hidden from students once expired.</span>
              </div>
            </div>

            {/* 6. Status, Priority, Dismissible */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Active (Visible to target audience)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dismissible}
                    onChange={(e) => setDismissible(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Student Dismissible
                  </span>
                </label>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-700">Priority:</span>
                  {(['normal', 'high', 'urgent'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                        priority === p
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowComposer(false);
                    resetForm();
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={actionLoading}
                  className="gap-1.5"
                >
                  {actionLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{editingId ? 'Save Changes' : 'Broadcast Now'}</span>
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Category:</span>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {(['all', 'site_announcement', 'dashboard_notification', 'promotional_notification', 'maintenance_message'] as const).map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'All Categories' : BROADCAST_CATEGORY_CONFIG[cat].label}
                </button>
              )
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value as any)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
          >
            <option value="all">All Audiences</option>
            <option value="free_users">Free Users</option>
            <option value="pro_users">Pro Users</option>
            <option value="annual_pass">Annual Pass</option>
            <option value="selected_users">Selected Users</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Broadcasts List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>Active & Historical Broadcast Registry ({filteredBroadcasts.length})</span>
          <span className="font-mono text-[11px] text-blue-700">Internal Website Sync</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading broadcast notifications...</span>
          </div>
        ) : filteredBroadcasts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Bell className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-600">No broadcasts found matching current filters.</p>
            <p className="text-[11px] text-slate-400">Click &quot;Create Broadcast&quot; above to compose an announcement.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredBroadcasts.map((b) => {
              const catCfg = BROADCAST_CATEGORY_CONFIG[b.category];
              const audCfg = BROADCAST_AUDIENCE_CONFIG[b.audience];

              const now = Date.now();
              const startMs = new Date(b.startTime).getTime();
              const endMs = b.endTime ? new Date(b.endTime).getTime() : undefined;
              const isScheduled = !isNaN(startMs) && now < startMs;
              const isExpired = endMs ? !isNaN(endMs) && now > endMs : false;

              return (
                <div
                  key={b.id}
                  className={`p-4 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4 text-xs ${
                    !b.isActive ? 'bg-slate-50/60 opacity-75' : 'hover:bg-slate-50/40'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase flex items-center gap-1 ${catCfg.badgeColor}`}>
                        {getCategoryIcon(b.category)}
                        <span>{catCfg.label}</span>
                      </span>

                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        Audience: {audCfg.label}
                      </span>

                      {b.isActive ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600">
                          Inactive
                        </span>
                      )}

                      {isScheduled && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          Scheduled
                        </span>
                      )}

                      {isExpired && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Expired
                        </span>
                      )}

                      {b.priority && b.priority !== 'normal' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-rose-100 text-rose-800">
                          {b.priority}
                        </span>
                      )}
                    </div>

                    <h4 className="font-heading font-bold text-sm text-slate-900">
                      {b.title}
                    </h4>

                    <p className="text-slate-600 leading-relaxed max-w-3xl">
                      {b.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                      {b.link && (
                        <span className="flex items-center gap-1 text-blue-600 font-medium">
                          <ExternalLink className="w-3 h-3" />
                          <span>Link: {b.link} ({b.linkText || 'Learn More'})</span>
                        </span>
                      )}

                      {b.imageUrl && (
                        <span className="flex items-center gap-1 text-purple-600 font-medium">
                          <Image className="w-3 h-3" />
                          <span>Attached Banner Image</span>
                        </span>
                      )}

                      {b.audience === 'selected_users' && b.selectedUserEmails && (
                        <span className="text-amber-700 font-mono text-[10px]">
                          Targeted: {b.selectedUserEmails.length} email(s)
                        </span>
                      )}

                      <span>Starts: {b.startTime ? b.startTime.split('T')[0] : 'Immediate'}</span>
                      {b.endTime && <span>Expires: {b.endTime.split('T')[0]}</span>}
                      <span className="font-mono text-[10px]">ID: {b.id}</span>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center md:flex-col md:items-end justify-between md:justify-start gap-2 shrink-0 pt-2 md:pt-0">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleStatus(b)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          b.isActive
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                        title={b.isActive ? 'Deactivate broadcast' : 'Activate broadcast'}
                      >
                        {b.isActive ? 'Active' : 'Enable'}
                      </button>

                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 cursor-pointer"
                        title="Edit broadcast"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(b.id, b.title)}
                        className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 cursor-pointer"
                        title="Delete broadcast"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {b.metrics && (
                      <div className="text-[10px] text-slate-400 font-mono text-right hidden sm:block">
                        <span>{b.metrics.impressions.toLocaleString()} imp</span>
                        {b.metrics.clicks > 0 && <span> · {b.metrics.clicks.toLocaleString()} clicks</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
