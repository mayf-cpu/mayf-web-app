import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  ExternalLink,
  X,
  Megaphone,
  Sparkles,
  AlertTriangle,
  Gift,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { useBroadcasts } from '../../context/BroadcastContext';
import { Link } from '../../context/NavigationContext';
import { BROADCAST_CATEGORY_CONFIG } from '../../lib/broadcasts/broadcastTypes';

export const NotificationBellDropdown: React.FC = () => {
  const {
    activeBroadcasts,
    unreadDashboardCount,
    dismissBroadcast,
    isDismissed,
  } = useBroadcasts();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const markAllRead = () => {
    activeBroadcasts.forEach((b) => dismissBroadcast(b.id));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'maintenance_message':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
      case 'promotional_notification':
        return <Gift className="w-3.5 h-3.5 text-purple-600" />;
      case 'site_announcement':
        return <Megaphone className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer"
        title="Notifications & Broadcasts"
        aria-label="Open notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadDashboardCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-xs text-slate-900">
                Broadcasts & Notifications
              </span>
              {unreadDashboardCount > 0 && (
                <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 font-mono font-bold text-[10px] rounded-full">
                  {unreadDashboardCount} new
                </span>
              )}
            </div>

            {unreadDashboardCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {activeBroadcasts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                <CheckCircle2 className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600">All caught up!</p>
                <p className="text-[11px]">No active announcements at this time.</p>
              </div>
            ) : (
              activeBroadcasts.map((b) => {
                const read = isDismissed(b.id);
                const categoryMeta = BROADCAST_CATEGORY_CONFIG[b.category] || BROADCAST_CATEGORY_CONFIG.site_announcement;

                return (
                  <div
                    key={b.id}
                    className={`p-3.5 transition-colors relative flex items-start gap-3 ${
                      read ? 'bg-white opacity-70' : 'bg-blue-50/30'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                      {getCategoryIcon(b.category)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded border ${categoryMeta.badgeColor}`}>
                          {categoryMeta.label}
                        </span>
                        {!read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" title="Unread" />
                        )}
                      </div>

                      <h5 className="font-heading font-bold text-xs text-slate-900 leading-tight">
                        {b.title}
                      </h5>

                      <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">
                        {b.message}
                      </p>

                      {b.imageUrl && (
                        <img
                          src={b.imageUrl}
                          alt={b.title}
                          className="w-full h-24 object-cover rounded-lg border border-slate-200 mt-2"
                        />
                      )}

                      <div className="flex items-center justify-between pt-1">
                        {b.link ? (
                          <Link
                            href={b.link}
                            onClick={() => {
                              dismissBroadcast(b.id);
                              setIsOpen(false);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                          >
                            <span>{b.linkText || 'Learn More'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        ) : <div />}

                        <button
                          onClick={() => dismissBroadcast(b.id)}
                          className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {read ? 'Dismissed' : 'Mark as read'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer link to full dashboard notifications */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-center">
            <Link
              href="/dashboard/notifications"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-bold text-slate-600 hover:text-blue-600"
            >
              Open Full Student Notification Center →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
