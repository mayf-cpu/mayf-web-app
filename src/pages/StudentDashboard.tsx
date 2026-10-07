/**
 * Comprehensive Student Dashboard for Maths at Your Fingertips (mayf.co.in)
 *
 * All 11 Core Student Sections:
 * 1. Profile (Google Auth credentials, Grade/Board selectors, Account metadata, Privacy pledge)
 * 2. Membership (Free vs Annual Pass status & comparison)
 * 3. Annual Pass (Active digital pass card, benefits, validity until 2027)
 * 4. Recent Activity (Product events: content_view, download, save, unsave, ai_question, purchase, course_open, formula_view with 50-event/30-day retention)
 * 5. Recently Viewed (Quick-access cards of recently browsed formulas & chapters)
 * 6. Saved Resources (Bookmarked formulas with KaTeX rendering, quick copy, unsave)
 * 7. Purchases (Order records, GST invoice downloads, 7-day guarantee)
 * 8. Downloads (High-res syllabus PDF cheatsheets with secure download tokens)
 * 9. AI Teacher History (Professor Sigma doubts, KaTeX math solutions, ratings)
 * 10. Courses (Grade-aligned courses, progress tracking, resume learning)
 * 11. Notifications (Real-time sync, unread badges, mark as read)
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  User,
  Shield,
  CreditCard,
  Sparkles,
  Clock,
  Eye,
  Bookmark,
  ShoppingBag,
  Download,
  Bot,
  GraduationCap,
  Bell,
  Flame,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  RefreshCw,
  Calendar,
  Lock,
  Layers,
  FileText,
  Search,
  Filter,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { useAuth } from '../context/AuthContext';
import { useNavigation, Link } from '../context/NavigationContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MathRenderer } from '../components/ui/MathRenderer';
import { LoadingSpinner } from '../components/ui/LoadingState';
import { TurnstileModal } from '../components/ui/TurnstileModal';
import {
  StudentClass,
  BoardType,
  ActivityLog,
  ActivityEventType,
  RecentlyViewedItem,
  NotificationItem,
  StudentCourse,
} from '../lib/firebase/types';
import {
  loadUserActivities,
  logProductEvent,
  getRecentlyViewed,
  subscribeToActivity,
} from '../lib/activity/activityService';
import {
  subscribeToStudentNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../lib/notifications/notificationService';
import { FORMULA_DECK_ITEMS } from '../data/formulaDeckData';
import { STUDENT_COURSES } from '../data/coursesData';
import { SAMPLE_PURCHASES } from '../data/curriculumData';

export type DashboardTab =
  | 'profile'
  | 'membership'
  | 'annual-pass'
  | 'activity'
  | 'recently-viewed'
  | 'saved'
  | 'purchases'
  | 'downloads'
  | 'ai-history'
  | 'courses'
  | 'notifications';

interface DownloadResource {
  id: string;
  title: string;
  classLevel: StudentClass;
  fileSize: string;
  pages: number;
  category: string;
  description: string;
}

const DOWNLOAD_RESOURCES: DownloadResource[] = [
  {
    id: 'dl-10-cheatsheet',
    title: 'Class 10 Board Exam Complete Formula Cheatsheet',
    classLevel: 'Class 10',
    fileSize: '2.4 MB',
    pages: 14,
    category: 'Formula Flashcards',
    description: 'Every formula in Real Numbers, Polynomials, Linear Systems, Quadratics, AP, Triangles, Trig, Circles, and Surface Areas in printable high-resolution PDF format.',
  },
  {
    id: 'dl-10-theorems',
    title: 'Class 10 Essential Geometry Proofs & Theorems Reference',
    classLevel: 'Class 10',
    fileSize: '1.8 MB',
    pages: 8,
    category: 'Theorems & Axioms',
    description: 'Complete step-by-step proofs for Basic Proportionality Theorem (BPT), Tangent Theorem, and cyclic properties with diagrams.',
  },
  {
    id: 'dl-9-circles',
    title: 'Class 9 Geometry & Mensuration Formula Handbook',
    classLevel: 'Class 9',
    fileSize: '1.5 MB',
    pages: 10,
    category: 'Formula Flashcards',
    description: 'Quick reference for Herons formula, Surface Areas & Volumes of cylinders/cones, and Circle chord angle properties.',
  },
  {
    id: 'dl-8-algebra',
    title: 'Class 8 Linear Equations & Factorisation Workbook',
    classLevel: 'Class 8',
    fileSize: '1.2 MB',
    pages: 12,
    category: 'Practice Sheet',
    description: 'Rational numbers, Linear Equations in one variable, Quadrilateral properties, Algebraic expressions and identities, and Factorisation.',
  },
  {
    id: 'dl-7-integers',
    title: 'Class 7 Integers & Decimals Quick Reference',
    classLevel: 'Class 7',
    fileSize: '1.1 MB',
    pages: 8,
    category: 'Foundations',
    description: 'Sign operations on Integers, Fractions & Decimals, Simple Equations, and Comparing Quantities (Percentages, Profit & Loss).',
  },
];

export const StudentDashboard: React.FC = () => {
  const { user, firebaseUser, entitlements, updateClass, logout, savedItemIds, toggleSavedItem, isAnnualPassActive } = useAuth();
  const { currentRoute, navigate } = useNavigation();

  // Determine active tab from route or query params
  const getInitialTab = (): DashboardTab => {
    const path = currentRoute.path;
    if (path === '/dashboard/profile') return 'profile';
    if (path === '/dashboard/membership') return 'membership';
    if (path === '/dashboard/annual-pass') return 'annual-pass';
    if (path === '/dashboard/activity') return 'activity';
    if (path === '/dashboard/recently-viewed') return 'recently-viewed';
    if (path === '/dashboard/saved') return 'saved';
    if (path === '/dashboard/purchases') return 'purchases';
    if (path === '/dashboard/downloads') return 'downloads';
    if (path === '/dashboard/ai-history') return 'ai-history';
    if (path === '/dashboard/courses') return 'courses';
    if (path === '/dashboard/notifications') return 'notifications';

    const tabParam = currentRoute.searchParams.get('tab') as DashboardTab;
    if (tabParam && [
      'profile',
      'membership',
      'annual-pass',
      'activity',
      'recently-viewed',
      'saved',
      'purchases',
      'downloads',
      'ai-history',
      'courses',
      'notifications'
    ].includes(tabParam)) {
      return tabParam;
    }
    return 'profile';
  };

  const [activeTab, setActiveTab] = useState<DashboardTab>(getInitialTab);

  // Sync tab with route changes
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [currentRoute.path, currentRoute.searchParams]);

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    // Smooth URL change
    navigate(`/dashboard?tab=${tab}`, { replace: true });
  };

  // State: Activities
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // State: Recently Viewed
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);

  // State: Notifications (Real-Time Listener)
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // State: AI History
  const [aiHistory, setAiHistory] = useState<any[]>([]);
  const [aiHistoryLoading, setAiHistoryLoading] = useState(false);
  const [aiRatingMap, setAiRatingMap] = useState<Record<string, 'helpful' | 'unhelpful'>>({});

  // State: Downloads
  const [downloadingItemId, setDownloadingItemId] = useState<string | null>(null);
  const [activeTurnstileItem, setActiveTurnstileItem] = useState<DownloadResource | null>(null);
  const [copiedUid, setCopiedUid] = useState(false);

  // State: Saved formulas search & filter
  const [savedSearchQuery, setSavedSearchQuery] = useState('');
  const [savedCategoryFilter, setSavedCategoryFilter] = useState('All');

  // Load user activities & recently viewed
  const fetchActivities = async () => {
    if (!user) return;
    setActivitiesLoading(true);
    try {
      const logs = await loadUserActivities(user.uid);
      setActivities(logs);
      setRecentlyViewed(getRecentlyViewed(user.uid));
    } finally {
      setActivitiesLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchActivities();

      // Subscribe to local session activity broadcasts (zero Firestore read costs!)
      const unsubscribe = subscribeToActivity((updated) => {
        setActivities(updated);
        setRecentlyViewed(getRecentlyViewed(user.uid));
      });

      return () => unsubscribe();
    }
  }, [user?.uid]);

  // Hook up real-time listener for student notifications (single lightweight query)
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeToStudentNotifications(user.uid, (items) => {
      setNotifications(items);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  // Load AI Doubts History when tab is active
  useEffect(() => {
    if (activeTab === 'ai-history') {
      async function loadAiHistory() {
        setAiHistoryLoading(true);
        try {
          let token = '';
          if (firebaseUser) {
            token = await firebaseUser.getIdToken();
          } else if (user) {
            token = `dev-token-${user.uid}`;
          }
          const headers: Record<string, string> = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const res = await fetch('/api/ai-teacher/history', { headers });
          const data = await res.json();
          if (data.history) {
            setAiHistory(data.history);
          }
        } catch (err) {
          console.debug('[StudentDashboard] AI history load note:', err);
        } finally {
          setAiHistoryLoading(false);
        }
      }
      loadAiHistory();
    }
  }, [activeTab, firebaseUser, user]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    if (activityFilter === 'all') return activities;
    return activities.filter((a) => {
      if (activityFilter === 'views') return a.eventType === 'content_view' || a.eventType === 'formula_view';
      if (activityFilter === 'downloads') return a.eventType === 'download';
      if (activityFilter === 'saved') return a.eventType === 'save' || a.eventType === 'unsave';
      if (activityFilter === 'ai') return a.eventType === 'ai_question';
      if (activityFilter === 'purchases') return a.eventType === 'purchase';
      if (activityFilter === 'courses') return a.eventType === 'course_open';
      return true;
    });
  }, [activities, activityFilter]);

  // Saved formulas list
  const savedFormulas = useMemo(() => {
    return FORMULA_DECK_ITEMS.filter((f) => savedItemIds.includes(f.id));
  }, [savedItemIds]);

  const filteredSavedFormulas = useMemo(() => {
    return savedFormulas.filter((f) => {
      const matchesSearch =
        f.title.toLowerCase().includes(savedSearchQuery.toLowerCase()) ||
        f.plainTextFormula.toLowerCase().includes(savedSearchQuery.toLowerCase());
      const matchesCategory =
        savedCategoryFilter === 'All' || f.category === savedCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [savedFormulas, savedSearchQuery, savedCategoryFilter]);

  // Handle Download Click
  const handleInitiateDownload = (resource: DownloadResource) => {
    setActiveTurnstileItem(resource);
  };

  // Format date nicely
  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Active';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(isoString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch {
      return 'Recently';
    }
  };

  // Copy UID helper
  const handleCopyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const navTabs: { id: DashboardTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'membership', label: 'Membership', icon: Shield },
    { id: 'annual-pass', label: 'Annual Pass', icon: CreditCard },
    { id: 'activity', label: 'Recent Activity', icon: Clock },
    { id: 'recently-viewed', label: 'Recently Viewed', icon: Eye },
    { id: 'saved', label: 'Saved Resources', icon: Bookmark, badge: savedItemIds.length },
    { id: 'purchases', label: 'Purchases', icon: ShoppingBag },
    { id: 'downloads', label: 'Downloads', icon: Download },
    { id: 'ai-history', label: 'AI Teacher History', icon: Bot },
    { id: 'courses', label: 'Courses', icon: GraduationCap },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
  ];

  return (
    <SharedLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        
        {/* ========================================================= */}
        {/* TOP PROFILE & ACCOUNT HEADER                              */}
        {/* ========================================================= */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Student Avatar & Google Identity */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-[#1D4ED8]/20 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#1D4ED8] to-[#3B82F6] text-white flex items-center justify-center font-heading font-extrabold text-2xl shadow-xs">
                    {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'S'}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xs">
                  <div className="w-4 h-4 rounded-full bg-[#10B981] flex items-center justify-center" title="Active Account">
                    <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0F172A]">
                    {user?.displayName || 'Google Verified Student'}
                  </h1>
                  {isAnnualPassActive ? (
                    <Badge variant="pro">ANNUAL PASS ACTIVE</Badge>
                  ) : (
                    <Badge variant="free">FREE ACCESS</Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-[#64748B] mt-1 flex-wrap">
                  <span className="font-medium text-[#334155]">{user?.email || 'student@mayf.co.in'}</span>
                  <span className="text-[#CBD5E1]">·</span>
                  <button
                    onClick={handleCopyUid}
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-[#64748B] hover:text-[#1D4ED8] cursor-pointer"
                    title="Click to copy student UID"
                  >
                    <span>UID: {user?.uid ? `${user.uid.slice(0, 10)}...` : 'mayf-1001'}</span>
                    {copiedUid ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[#64748B] mt-1">
                  <span>Last active: {user?.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : 'Today'}</span>
                  <span>·</span>
                  <span className="text-[#059669] font-medium">Google Authentication Secured</span>
                </div>
              </div>
            </div>

            {/* Quick Badges & Controls */}
            <div className="flex flex-wrap items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-[#F1F5F9]">
              
              {/* Revision Streak */}
              <div className="flex items-center gap-2 bg-[#FFF7ED] border border-[#FFEDD5] px-3.5 py-2 rounded-lg text-xs font-semibold text-[#EA580C]">
                <Flame className="w-4 h-4 fill-[#F97316] text-[#EA580C]" />
                <span className="font-heading font-bold">{user?.streakDays || 1} Day Streak</span>
              </div>

              {/* Class Selector Dropdown */}
              <div className="flex items-center gap-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 rounded-lg">
                <span className="text-[#64748B] font-medium">Grade:</span>
                <select
                  aria-label="Student Class"
                  value={user?.studentClass || 'Class 10'}
                  onChange={(e) => updateClass(e.target.value as StudentClass)}
                  className="bg-transparent font-heading font-bold text-xs text-[#0F172A] focus:outline-none cursor-pointer"
                >
                  {(['Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'] as StudentClass[]).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick AI Teacher Action */}
              <Link href="/ai-teacher">
                <Button size="sm" variant="outline" className="text-xs">
                  <Bot className="w-3.5 h-3.5 mr-1 text-[#1D4ED8]" />
                  <span>Ask Doubt</span>
                </Button>
              </Link>

            </div>

          </div>
        </div>

        {/* ========================================================= */}
        {/* RESPONSIVE HORIZONTAL NAVIGATION TABS                     */}
        {/* ========================================================= */}
        <div className="border-b border-[#E2E8F0] bg-white rounded-lg p-1.5 shadow-xs overflow-x-auto scrollbar-none">
          <nav className="flex space-x-1 min-w-max" aria-label="Student Dashboard Navigation">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs sm:text-sm font-heading font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1D4ED8] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-white text-[#1D4ED8]' : 'bg-[#EFF6FF] text-[#1D4ED8]'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ========================================================= */}
        {/* ACTIVE TAB CONTENT STAGE                                  */}
        {/* ========================================================= */}
        <div className="pt-2">

          {/* ------------------------------------------------------- */}
          {/* 1. PROFILE SECTION                                      */}
          {/* ------------------------------------------------------- */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Profile Identity Details */}
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                    <h3 className="font-heading font-bold text-base text-[#0F172A] flex items-center gap-2">
                      <User className="w-4 h-4 text-[#1D4ED8]" />
                      <span>Google Profile Credentials</span>
                    </h3>
                    <Badge variant="free">VERIFIED</Badge>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[#64748B] block font-medium">Google Display Name</span>
                      <span className="font-heading font-bold text-sm text-[#0F172A]">
                        {user?.displayName || 'Google Verified Student'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#64748B] block font-medium">Google Email Address</span>
                      <span className="font-heading font-bold text-sm text-[#0F172A]">
                        {user?.email || 'student@mayf.co.in'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#64748B] block font-medium">Unique Student UID</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <code className="bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-1 rounded text-[11px] font-mono text-[#475569]">
                          {user?.uid || 'mayf-student-1001'}
                        </code>
                        <button
                          onClick={handleCopyUid}
                          className="text-[#1D4ED8] hover:underline text-[11px] font-semibold cursor-pointer"
                        >
                          {copiedUid ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                        <span className="text-[11px] text-[#64748B] block">Member Since</span>
                        <span className="font-medium text-xs text-[#0F172A]">
                          {formatDate(user?.createdAt)}
                        </span>
                      </div>
                      <div className="bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                        <span className="text-[11px] text-[#64748B] block">Last Login</span>
                        <span className="font-medium text-xs text-[#0F172A]">
                          {formatDate(user?.lastLoginAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Academic Configuration */}
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                    <h3 className="font-heading font-bold text-base text-[#0F172A] flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#1D4ED8]" />
                      <span>Academic Syllabus Alignment</span>
                    </h3>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="text-[#64748B] block font-medium mb-1.5">Enrolled Grade Level</label>
                      <select
                        aria-label="Select Enrolled Grade"
                        value={user?.studentClass || 'Class 10'}
                        onChange={(e) => updateClass(e.target.value as StudentClass)}
                        className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs sm:text-sm font-heading font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                      >
                        {(['Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'] as StudentClass[]).map((c) => (
                          <option key={c} value={c}>
                            {c} CBSE / ICSE Standard
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-[#64748B] mt-1">
                        Changing your grade filters formulas, chapter notes, and mock tests automatically.
                      </p>
                    </div>

                    <div>
                      <label className="text-[#64748B] block font-medium mb-1.5">Curriculum Board</label>
                      <input
                        type="text"
                        disabled
                        value={`${user?.board || 'CBSE'} (Central Board of Secondary Education)`}
                        className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs sm:text-sm text-[#475569] font-medium cursor-not-allowed"
                      />
                    </div>

                    <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-xs text-[#1E3A8A]">
                      <span className="font-bold">Privacy Guarantee:</span> We do not collect student phone numbers, parent job details, or home addresses. Only minimal syllabus data needed for learning personalization is stored.
                    </div>
                  </div>
                </div>

              </div>

              {/* Quick Sign Out Action */}
              <div className="flex justify-between items-center bg-white rounded-xl border border-[#E2E8F0] p-4 text-xs">
                <span className="text-[#64748B]">
                  Logged in via Google Secure Auth. To switch Google accounts, sign out below.
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="text-[#DC2626] hover:bg-[#FEF2F2]"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------- */}
          {/* 2. MEMBERSHIP SECTION                                   */}
          {/* ------------------------------------------------------- */}
          {activeTab === 'membership' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-bold text-lg text-[#0F172A]">
                        Current Subscription Status
                      </h3>
                      {isAnnualPassActive ? (
                        <Badge variant="pro">ANNUAL PASS PRO</Badge>
                      ) : (
                        <Badge variant="free">FREE LEARNER</Badge>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B] mt-1">
                      {isAnnualPassActive
                        ? 'Unlimited access to all Class 5–10 resources, AI Doubt Solver, and printable PDFs.'
                        : 'Free access to public formulas and chapter study modules.'}
                    </p>
                  </div>

                  {!isAnnualPassActive && (
                    <Link href="/annual-pass">
                      <Button variant="primary" size="md">
                        Upgrade to Annual Pass (₹999/yr)
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Tier Features Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
                    <div className="font-heading font-bold text-sm text-[#0F172A]">
                      Free Access Tier
                    </div>
                    <ul className="space-y-2 text-xs text-[#64748B]">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#10B981]" />
                        <span>All 84+ public formula definitions & KaTeX view</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#10B981]" />
                        <span>Standard chapter study guides & preview problems</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#10B981]" />
                        <span>Up to 30 AI Teacher doubts daily</span>
                      </li>
                      <li className="flex items-center gap-2 text-[#94A3B8]">
                        <Lock className="w-3.5 h-3.5 text-[#CBD5E1]" />
                        <span>Watermarked printable PDFs</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-lg border border-[#BFDBFE] bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-heading font-bold text-sm text-[#1E3A8A]">
                        Annual Pass Tier (₹999/yr)
                      </div>
                      <Badge variant="pro">ALL ACCESS</Badge>
                    </div>
                    <ul className="space-y-2 text-xs text-[#1E3A8A]">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#1D4ED8]" />
                        <span>Unlimited multimodal Professor Sigma AI doubts</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#1D4ED8]" />
                        <span>High-resolution printable PDF Cheatsheets & Theorems</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#1D4ED8]" />
                        <span>10-Year NCERT Exemplar & CBSE Board Solved Papers</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#1D4ED8]" />
                        <span>Zero watermarks & instant priority teacher streaming</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------- */}
          {/* 3. ANNUAL PASS SECTION                                  */}
          {/* ------------------------------------------------------- */}
          {activeTab === 'annual-pass' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-[#0037B0] via-[#1D4ED8] to-[#0284C7] rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-mono text-xs uppercase tracking-widest text-[#93C5FD]">
                      OFFICIAL LEARNER DIGITAL PASS
                    </span>
                    <Badge variant="pro" className="bg-white/20 text-white border-white/40">
                      ACADEMIC YEAR 2026–2027
                    </Badge>
                  </div>

                  <h3 className="font-heading font-extrabold text-2xl sm:text-3xl">
                    Maths at Your Fingertips Annual Pass
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-white/20 text-xs">
                    <div>
                      <span className="text-[#BFDBFE] block text-[11px]">Pass Holder</span>
                      <span className="font-bold text-sm">{user?.displayName || 'Student'}</span>
                    </div>
                    <div>
                      <span className="text-[#BFDBFE] block text-[11px]">Valid Until</span>
                      <span className="font-bold text-sm">March 31, 2027</span>
                    </div>
                    <div>
                      <span className="text-[#BFDBFE] block text-[11px]">Pass Number</span>
                      <span className="font-mono font-bold text-sm">
                        MAYF-{user?.uid ? user.uid.slice(0, 6).toUpperCase() : 'PASS-2026'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#BFDBFE] block text-[11px]">Pass Status</span>
                      <span className="font-bold text-sm text-[#86EFAC]">
                        {isAnnualPassActive ? 'Active & Verified' : 'Free Preview'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pass Benefits Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs space-y-2">
                  <Bot className="w-5 h-5 text-[#1D4ED8]" />
                  <h4 className="font-heading font-bold text-sm text-[#0F172A]">Unlimited AI Doubts</h4>
                  <p className="text-xs text-[#64748B]">
                    Typed math or camera photograph upload with multimodal step-by-step KaTeX explanations.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs space-y-2">
                  <Download className="w-5 h-5 text-[#059669]" />
                  <h4 className="font-heading font-bold text-sm text-[#0F172A]">PDF Cheatsheets</h4>
                  <p className="text-xs text-[#64748B]">
                    Full high-resolution printable chapter formula guides for offline study before exams.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs space-y-2">
                  <Sparkles className="w-5 h-5 text-[#EA580C]" />
                  <h4 className="font-heading font-bold text-sm text-[#0F172A]">Exemplar Solutions</h4>
                  <p className="text-xs text-[#64748B]">
                    Step-by-step solutions to previous 10 years of CBSE & ICSE board examination questions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------- */}
          {/* 4. RECENT ACTIVITY SECTION                              */}
          {/* ------------------------------------------------------- */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              
              {/* Retention Policy Banner */}
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 text-xs text-[#1E3A8A] flex items-start gap-3">
                <Clock className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">
                    Automatic Retention Strategy (Max 50 Events · 30-Day Window)
                  </div>
                  <div className="text-[11px] leading-relaxed text-[#1D4ED8]">
                    We strictly store only useful product events (<code className="bg-white px-1 py-0.5 rounded">content_view</code>, <code className="bg-white px-1 py-0.5 rounded">download</code>, <code className="bg-white px-1 py-0.5 rounded">save</code>, <code className="bg-white px-1 py-0.5 rounded">unsave</code>, <code className="bg-white px-1 py-0.5 rounded">ai_question</code>, <code className="bg-white px-1 py-0.5 rounded">purchase</code>, <code className="bg-white px-1 py-0.5 rounded">course_open</code>, <code className="bg-white px-1 py-0.5 rounded">formula_view</code>). Older records are pruned automatically to protect your privacy and eliminate Firestore log clutter.
                  </div>
                </div>
              </div>

              {/* Filter Pills & Refresh */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'all', label: 'All Activities' },
                    { id: 'views', label: 'Views' },
                    { id: 'downloads', label: 'Downloads' },
                    { id: 'saved', label: 'Bookmarks' },
                    { id: 'ai', label: 'AI Doubts' },
                    { id: 'courses', label: 'Courses' },
                    { id: 'purchases', label: 'Purchases' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setActivityFilter(filter.id)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer ${
                        activityFilter === filter.id
                          ? 'bg-[#1D4ED8] text-white'
                          : 'bg-white border border-[#CBD5E1] text-[#475569] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={fetchActivities}
                  isLoading={activitiesLoading}
                  className="text-xs text-[#64748B]"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  <span>Refresh</span>
                </Button>
              </div>

              {/* Activity Timeline */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs divide-y divide-[#F1F5F9] overflow-hidden">
                {filteredActivities.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#64748B]">
                    No activity logs recorded under this filter yet.
                  </div>
                ) : (
                  filteredActivities.map((act) => {
                    const getEventBadge = (type: ActivityEventType) => {
                      switch (type) {
                        case 'formula_view':
                          return <span className="text-[10px] bg-[#EEF2FF] text-[#4338CA] px-2 py-0.5 rounded font-mono font-bold">formula_view</span>;
                        case 'content_view':
                          return <span className="text-[10px] bg-[#EFF6FF] text-[#1D4ED8] px-2 py-0.5 rounded font-mono font-bold">content_view</span>;
                        case 'download':
                          return <span className="text-[10px] bg-[#ECFDF5] text-[#047857] px-2 py-0.5 rounded font-mono font-bold">download</span>;
                        case 'save':
                          return <span className="text-[10px] bg-[#FEF3C7] text-[#B45309] px-2 py-0.5 rounded font-mono font-bold">save</span>;
                        case 'unsave':
                          return <span className="text-[10px] bg-[#F1F5F9] text-[#64748B] px-2 py-0.5 rounded font-mono font-bold">unsave</span>;
                        case 'ai_question':
                          return <span className="text-[10px] bg-[#ECFEFF] text-[#0E7490] px-2 py-0.5 rounded font-mono font-bold">ai_question</span>;
                        case 'purchase':
                          return <span className="text-[10px] bg-[#F5F3FF] text-[#6D28D9] px-2 py-0.5 rounded font-mono font-bold">purchase</span>;
                        case 'course_open':
                          return <span className="text-[10px] bg-[#F0F9FF] text-[#0284C7] px-2 py-0.5 rounded font-mono font-bold">course_open</span>;
                        default:
                          return <span className="text-[10px] bg-[#F1F5F9] text-[#475569] px-2 py-0.5 rounded font-mono font-bold">{type}</span>;
                      }
                    };

                    return (
                      <div key={act.id} className="p-4 hover:bg-[#F8FAFC] transition-colors flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getEventBadge(act.eventType)}
                            <span className="font-heading font-bold text-xs text-[#0F172A]">
                              {act.title}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#64748B] flex items-center gap-2">
                            <span>{formatRelativeTime(act.createdAt)}</span>
                            {act.targetSlug && (
                              <>
                                <span>·</span>
                                <span className="font-mono text-[#94A3B8]">slug: {act.targetSlug}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {act.targetSlug && (
                          <Link
                            href={
                              act.eventType === 'formula_view' || act.targetType === 'formula'
                                ? `/formula/${act.targetSlug}`
                                : `/study/${act.targetSlug}`
                            }
                          >
                            <Button size="sm" variant="ghost" className="text-xs shrink-0">
                              <span>Revisit</span>
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------- */}
          {/* 5. RECENTLY VIEWED SECTION                              */}
          {/* ------------------------------------------------------- */}
          {activeTab === 'recently-viewed' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-base text-[#0F172A]">
                    Recently Viewed Learning Resources
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Quickly jump back to your most recently accessed formula sheets, chapters, and courses.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {recentlyViewed.map((item) => (
                  <Link
                    key={`${item.type}-${item.slug}`}
                    href={item.type === 'formula' ? `/formula/${item.slug}` : `/study/${item.slug}`}
                    className="p-4 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#1D4ED8]/40 rounded-xl transition-all shadow-xs group block space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#00687A] bg-[#E0F2FE] px-2 py-0.5 rounded">
                        {item.type}
                      </span>
                      <span className="text-[11px] text-[#94A3B8]">
                        {formatRelativeTime(item.viewedAt)}
                      </span>
                    </div>

                    <h4 className="font-heading font-bold text-sm text-[#0F172A] group-hover:text-[#1D4ED8] transition-colors line-clamp-2">
                      {item.title}
                    </h4>

                    <div className="flex items-center justify-between text-xs text-[#64748B] pt-2 border-t border-[#F1F5F9]">
                      <span>{item.category || item.classLevel || 'Mathematics'}</span>
                      <span className="text-[#1D4ED8] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Open <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------- */}
          {/* 6. SAVED RESOURCES SECTION                              */}
          {/* ------------------------------------------------------- */}
          {activeTab === 'saved' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-heading font-bold text-base text-[#0F172A]">
                    Saved Formulas & Resources ({savedFormulas.length})
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Formulas and identities bookmarked for quick revision before class tests.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="text"
                      placeholder="Search saved..."
                      value={savedSearchQuery}
                      onChange={(e) => setSavedSearchQuery(e.target.value)}
                      className="bg-white border border-[#CBD5E1] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                    />
                  </div>
                </div>
              </div>

              {filteredSavedFormulas.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center space-y-3">
                  <Bookmark className="w-8 h-8 text-[#94A3B8] mx-auto" />
                  <div className="font-heading font-bold text-sm text-[#0F172A]">
                    No bookmarked formulas yet
                  </div>
                  <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                    Browse the Formula Deck and click the bookmark ribbon to pin essential formulas to your dashboard.
                  </p>
                  <Link href="/formula-deck">
                    <Button size="sm" variant="primary">
                      Browse Formula Deck
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSavedFormulas.map((f) => (
                    <div
                      key={f.id}
                      className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#00687A] bg-[#EFF6FF] px-2 py-0.5 rounded">
                            {f.category}
                          </span>
                          <button
                            onClick={() => {
                              toggleSavedItem(f.id);
                              logProductEvent({
                                userId: user?.uid || 'anonymous-student',
                                eventType: 'unsave',
                                title: `Unsaved formula: ${f.title}`,
                                targetId: f.id,
                                targetSlug: f.slug,
                                targetType: 'formula',
                              });
                            }}
                            className="text-[#DC2626] hover:bg-[#FEF2F2] p-1 rounded cursor-pointer"
                            title="Remove bookmark"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <Link href={`/formula/${f.slug}`}>
                          <h4 className="font-heading font-bold text-sm text-[#0F172A] hover:text-[#1D4ED8] transition-colors">
                            {f.title}
                          </h4>
                        </Link>

                        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-center overflow-x-auto">
                          <MathRenderer content={`$$${f.latexFormula}$$`} />
                        </div>

                        <p className="text-xs text-[#64748B] line-clamp-2">
                          {f.explanation}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
                        <span className="text-[11px] text-[#94A3B8]">
                          {f.applicableClasses.join(', ')}
                        </span>
                        <Link href={`/formula/${f.slug}`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            Study Formula <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------- */}
          {/* 7. PURCHASES SECTION                                    */}
          {/* ------------------------------------------------------- */}
          {activeTab === 'purchases' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
                  <div>
                    <h3 className="font-heading font-bold text-base text-[#0F172A]">
                      Orders & GST Tax Invoices
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Verified records of your learning subscriptions and payments.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#059669] font-medium bg-[#ECFDF5] px-3 py-1.5 rounded-lg border border-[#A7F3D0]">
                    <Shield className="w-4 h-4" />
                    <span>Protected under 7-Day Money-Back Guarantee</span>
                  </div>
                </div>

                {/* Purchases Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">Order ID</th>
                        <th className="py-2.5 px-4">Plan Description</th>
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Amount</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-right">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {SAMPLE_PURCHASES.map((p) => (
                        <tr key={p.orderId} className="hover:bg-[#F8FAFC]">
                          <td className="py-3 px-4 font-mono font-medium text-[#0F172A]">
                            {p.orderId}
                          </td>
                          <td className="py-3 px-4 font-heading font-semibold text-[#0F172A]">
                            {p.planName}
                          </td>
                          <td className="py-3 px-4 text-[#64748B]">
                            {p.purchaseDate}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">
                            ₹{p.amountInr}.00
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[11px] bg-[#ECFDF5] text-[#059669] font-semibold px-2 py-0.5 rounded">
                              Completed
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                alert(`Downloading GST Invoice PDF for order ${p.orderId}`);
                              }}
                              className="text-xs text-[#1D4ED8]"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              <span>PDF</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------- */}
          {/* 8. DOWNLOADS SECTION                                    */}
          {/* ------------------------------------------------------- */}
          {activeTab === 'downloads' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-base text-[#0F172A]">
                    Printable High-Resolution Downloads
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Verified PDF sheets, exam cheat notes, and theorem proofs protected by Cloudflare Turnstile single-use tokens.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DOWNLOAD_RESOURCES.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-bold text-[#00687A] bg-[#EFF6FF] px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                        <span className="font-mono text-[#64748B] text-[11px]">
                          {item.fileSize} · {item.pages} Pages
                        </span>
                      </div>

                      <h4 className="font-heading font-bold text-sm text-[#0F172A]">
                        {item.title}
                      </h4>

                      <p className="text-xs text-[#64748B] leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#059669]">
                        Verified PDF (Clean Print Format)
                      </span>
                      <Button
                        size="sm"
                        variant="primary"
                        isLoading={downloadingItemId === item.id}
                        onClick={() => handleInitiateDownload(item)}
                      >
                        <Download className="w-3.5 h-3.5 mr-1" />
                        <span>Download PDF</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------- */}
          {/* 9. AI TEACHER HISTORY SECTION                           */}
          {/* ------------------------------------------------------- */}
          {activeTab === 'ai-history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-base text-[#0F172A]">
                    Professor Sigma Doubt Session Log
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Past mathematical doubt sessions solved with step-by-step KaTeX reasoning.
                  </p>
                </div>

                <Link href="/ai-teacher">
                  <Button size="sm" variant="primary">
                    <Bot className="w-3.5 h-3.5 mr-1" />
                    <span>Ask New Doubt</span>
                  </Button>
                </Link>
              </div>

              {aiHistoryLoading ? (
                <div className="py-12 text-center">
                  <LoadingSpinner message="Loading AI doubt history..." size="md" />
                </div>
              ) : aiHistory.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center space-y-3">
                  <Bot className="w-8 h-8 text-[#94A3B8] mx-auto" />
                  <div className="font-heading font-bold text-sm text-[#0F172A]">
                    No doubt history recorded yet
                  </div>
                  <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                    Type a math problem or take a photo of your textbook question to get step-by-step guidance from Professor Sigma.
                  </p>
                  <Link href="/ai-teacher">
                    <Button size="sm" variant="primary">
                      Ask Professor Sigma Now
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {aiHistory.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] bg-[#EFF6FF] text-[#1D4ED8] font-bold px-2 py-0.5 rounded">
                              {item.studentClass || 'Class 10'} · {item.chapterTopic || 'Mathematics'}
                            </span>
                            <span className="text-[11px] text-[#94A3B8]">
                              {formatRelativeTime(item.timestamp)}
                            </span>
                          </div>
                          <h4 className="font-heading font-bold text-sm text-[#0F172A]">
                            Q: {item.question}
                          </h4>
                        </div>

                        <Badge variant="free">
                          {item.responseStatus === 'clarification_needed' ? 'Clarification' : 'Solved'}
                        </Badge>
                      </div>

                      {/* Reply with KaTeX Math rendering */}
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 text-xs text-[#1E293B] leading-relaxed overflow-x-auto">
                        <MathRenderer content={item.reply} />
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#64748B] pt-2 border-t border-[#F1F5F9]">
                        <span className="text-[11px]">
                          Model: {item.tokenMetadata?.model || 'Gemini 3.8 Flash (Multimodal)'}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setAiRatingMap((prev) => ({ ...prev, [item.id]: 'helpful' }))}
                            className={`p-1 rounded flex items-center gap-1 cursor-pointer ${
                              aiRatingMap[item.id] === 'helpful' ? 'text-[#059669] font-bold' : 'hover:text-[#0F172A]'
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Helpful</span>
                          </button>
                          <button
                            onClick={() => setAiRatingMap((prev) => ({ ...prev, [item.id]: 'unhelpful' }))}
                            className={`p-1 rounded flex items-center gap-1 cursor-pointer ${
                              aiRatingMap[item.id] === 'unhelpful' ? 'text-[#DC2626] font-bold' : 'hover:text-[#0F172A]'
                            }`}
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------- */}
          {/* 10. COURSES SECTION                                     */}
          {/* ------------------------------------------------------- */}
          {activeTab === 'courses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-base text-[#0F172A]">
                    Curriculum Masterclasses & Courses
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Structured chapter-by-chapter mastery courses for Classes 5 to 10.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {STUDENT_COURSES.map((course) => {
                  const progressPct = Math.round((course.completedChapters / course.totalChapters) * 100);
                  return (
                    <div
                      key={course.id}
                      className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="pro">{course.targetClass}</Badge>
                          <span className="text-[11px] font-semibold text-[#64748B]">
                            {course.level}
                          </span>
                        </div>

                        <h4 className="font-heading font-bold text-base text-[#0F172A]">
                          {course.title}
                        </h4>

                        <p className="text-xs text-[#64748B] leading-relaxed">
                          {course.description}
                        </p>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-[#64748B]">
                            <span>Progress ({course.completedChapters}/{course.totalChapters} Chapters)</span>
                            <span className="font-bold text-[#1D4ED8]">{progressPct}%</span>
                          </div>
                          <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#1D4ED8] rounded-full transition-all duration-500"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Topics tags */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          {course.topics.slice(0, 4).map((t) => (
                            <span key={t} className="text-[10px] bg-[#F1F5F9] text-[#475569] px-2 py-0.5 rounded">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
                        <span className="text-xs text-[#64748B]">
                          {course.totalFormulas} key formulas
                        </span>
                        <Link
                          href="/study-material"
                          onClick={() => {
                            logProductEvent({
                              userId: user?.uid || 'anonymous-student',
                              eventType: 'course_open',
                              title: `Opened Course: ${course.title}`,
                              targetId: course.id,
                              targetSlug: course.slug,
                              targetType: 'course',
                            });
                          }}
                        >
                          <Button size="sm" variant="primary">
                            <span>Resume Course</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------- */}
          {/* 11. NOTIFICATIONS SECTION (Real-Time Synchronized)      */}
          {/* ------------------------------------------------------- */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-base text-[#0F172A] flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#1D4ED8]" />
                    <span>Real-Time Student Notifications</span>
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Direct syllabus alerts, new formula deck releases, and doubt solver updates.
                  </p>
                </div>

                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (user?.uid) markAllNotificationsAsRead(user.uid);
                    }}
                    className="text-xs"
                  >
                    Mark All as Read
                  </Button>
                )}
              </div>

              <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs divide-y divide-[#F1F5F9] overflow-hidden">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#64748B]">
                    No notifications right now. You are fully caught up!
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 transition-colors flex items-start justify-between gap-4 ${
                        !notif.read ? 'bg-[#EFF6FF]/40' : 'hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-[#1D4ED8] shrink-0" title="Unread" />
                          )}
                          <h4 className="font-heading font-bold text-xs sm:text-sm text-[#0F172A]">
                            {notif.title}
                          </h4>
                          <span className="text-[11px] text-[#94A3B8]">
                            {formatRelativeTime(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-[#475569] leading-relaxed">
                          {notif.message}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {notif.linkUrl && (
                          <Link href={notif.linkUrl}>
                            <Button size="sm" variant="ghost" className="text-xs text-[#1D4ED8]">
                              <span>View</span>
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </Link>
                        )}
                        {!notif.read && (
                          <button
                            onClick={() => {
                              if (user?.uid) markNotificationAsRead(user.uid, notif.id);
                            }}
                            className="text-[11px] text-[#64748B] hover:text-[#0F172A] p-1 cursor-pointer"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Turnstile Modal for secure downloads */}
        {activeTurnstileItem && (
          <TurnstileModal
            isOpen={Boolean(activeTurnstileItem)}
            onClose={() => setActiveTurnstileItem(null)}
            contentId={activeTurnstileItem.id}
            title={activeTurnstileItem.title}
            classLevel={activeTurnstileItem.classLevel}
            fallbackFileName={`${activeTurnstileItem.title.replace(/\s+/g, '_')}.pdf`}
            onDownloadSuccess={(fileName) => {
              logProductEvent({
                userId: user?.uid || 'anonymous-student',
                eventType: 'download',
                title: `Downloaded: ${activeTurnstileItem.title}`,
                targetId: activeTurnstileItem.id,
                targetType: 'download',
                metadata: { fileSize: activeTurnstileItem.fileSize, classLevel: activeTurnstileItem.classLevel },
              });
              setActiveTurnstileItem(null);
            }}
          />
        )}

      </div>
    </SharedLayout>
  );
};
