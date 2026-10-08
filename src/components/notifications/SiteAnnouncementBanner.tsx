import React from 'react';
import { AlertTriangle, Megaphone, ArrowRight, X, Sparkles, AlertCircle } from 'lucide-react';
import { useBroadcasts } from '../../context/BroadcastContext';
import { Link } from '../../context/NavigationContext';

export const SiteAnnouncementBanner: React.FC = () => {
  const { siteAnnouncements, maintenanceMessages, dismissBroadcast } = useBroadcasts();

  // Maintenance messages take precedence over standard announcements
  const activeAlert = maintenanceMessages[0] || siteAnnouncements[0];

  if (!activeAlert) {
    return null;
  }

  const isMaintenance = activeAlert.category === 'maintenance_message';

  return (
    <div
      role="banner"
      aria-label={isMaintenance ? 'System Maintenance Notice' : 'Website Announcement'}
      className={`relative z-50 text-xs px-4 py-2.5 transition-all shadow-xs ${
        isMaintenance
          ? 'bg-amber-600 text-white'
          : 'bg-[#1D4ED8] text-white'
      }`}
    >
      <div className="max-w-[1140px] mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1 rounded bg-white/20 shrink-0">
            {isMaintenance ? (
              <AlertTriangle className="w-3.5 h-3.5 text-white" />
            ) : (
              <Megaphone className="w-3.5 h-3.5 text-white" />
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 min-w-0">
            <span className="font-heading font-extrabold uppercase tracking-wider text-[10px] px-1.5 py-0.2 rounded bg-white/20 shrink-0">
              {isMaintenance ? 'Maintenance Advisory' : 'Announcement'}
            </span>
            <span className="font-bold truncate">{activeAlert.title}</span>
            <span className="hidden md:inline opacity-90 truncate max-w-md text-[11px]">
              — {activeAlert.message}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {activeAlert.link && (
            <Link
              href={activeAlert.link}
              className="inline-flex items-center gap-1 font-heading font-bold text-[11px] px-2.5 py-1 rounded bg-white text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span>{activeAlert.linkText || 'Learn More'}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}

          {activeAlert.dismissible && (
            <button
              onClick={() => dismissBroadcast(activeAlert.id)}
              className="p-1 rounded text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Dismiss banner"
              title="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
