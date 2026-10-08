import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Eye,
  Edit3,
  Copy,
  Trash2,
  Archive,
  RotateCcw,
  Star,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  FileText,
  Video,
  Layers,
  Youtube,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  IndianRupee,
  Calendar,
  HardDrive,
  Check,
  BookOpen,
  Film,
  HelpCircle,
  FileSpreadsheet,
  Sigma,
  Globe,
  Lock,
  Unlock,
} from 'lucide-react';
import katex from 'katex';
import { adminService, CmsContentRecord } from '../../../services/adminService';
import { StudentClass } from '../../../lib/firebase/types';

// Supported 12 Content Formats
const CONTENT_FORMATS: { value: string; label: string; icon: React.FC<{ className?: string }> }[] = [
  { value: 'pdf', label: 'PDF Document / Cheatsheet', icon: FileText },
  { value: 'course', label: 'Structured Multi-Unit Course', icon: BookOpen },
  { value: 'testPaper', label: 'Diagnostic / Board Test Paper', icon: FileSpreadsheet },
  { value: 'worksheet', label: 'Printable Practice Worksheet', icon: Layers },
  { value: 'formulaSheet', label: 'KaTeX Formula Sheet / Deck', icon: Sigma },
  { value: 'video', label: 'Direct Masterclass Video (MP4)', icon: Video },
  { value: 'reel', label: 'Short Video / Concept Reel', icon: Film },
  { value: 'youtube', label: 'YouTube Video Embed', icon: Youtube },
  { value: 'facebook', label: 'Facebook Video / Reel Embed', icon: Globe },
  { value: 'singleImage', label: 'Single Diagram / Mind Map', icon: ImageIcon },
  { value: 'multiImage', label: 'Step-by-Step Multi-Image Carousel', icon: Layers },
  { value: 'other', label: 'Other Educational Resource', icon: HelpCircle },
];

const GRADE_LEVELS: StudentClass[] = [
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
];

export const AdminContentSection: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [items, setItems] = useState<CmsContentRecord[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    active: 0,
    archived: 0,
    published: 0,
    draft: 0,
    hidden: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedAccess, setSelectedAccess] = useState<string>('All');
  const [selectedVisibility, setSelectedVisibility] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('sortOrder');

  // Modals state
  const [previewItem, setPreviewItem] = useState<CmsContentRecord | null>(null);
  const [editItem, setEditItem] = useState<Partial<CmsContentRecord> | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [safeDeleteModal, setSafeDeleteModal] = useState<{
    item: CmsContentRecord;
    isPurge: boolean;
  } | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load items from API
  const loadContent = async () => {
    setLoading(true);
    try {
      const res = await adminService.getContentList({
        search: searchQuery,
        classLevel: selectedClass,
        contentType: selectedType,
        accessType: selectedAccess,
        visibility: selectedVisibility,
        tab: activeTab,
        sortBy,
      });
      setItems(res.items || []);
      setCounts(res.counts || { total: 0, active: 0, archived: 0, published: 0, draft: 0, hidden: 0 });
    } catch (e: any) {
      console.error('Failed to load content', e);
      showMessage('Failed to load content catalogue: ' + (e?.message || 'Server error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [activeTab, selectedClass, selectedType, selectedAccess, selectedVisibility, sortBy]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadContent();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Actions
  const handlePublish = async (item: CmsContentRecord) => {
    const res = await adminService.publishContent(item.id);
    if (res.success) {
      showMessage(`"${item.title}" is now published.`);
      loadContent();
    } else {
      showMessage(res.error || 'Failed to publish', 'error');
    }
  };

  const handleUnpublish = async (item: CmsContentRecord) => {
    const res = await adminService.unpublishContent(item.id);
    if (res.success) {
      showMessage(`"${item.title}" reverted to draft.`);
      loadContent();
    } else {
      showMessage(res.error || 'Failed to unpublish', 'error');
    }
  };

  const handleHide = async (item: CmsContentRecord) => {
    const res = await adminService.hideContent(item.id);
    if (res.success) {
      showMessage(`"${item.title}" is now hidden from students.`);
      loadContent();
    } else {
      showMessage(res.error || 'Failed to hide item', 'error');
    }
  };

  const handleUnhide = async (item: CmsContentRecord) => {
    const res = await adminService.unhideContent(item.id);
    if (res.success) {
      showMessage(`"${item.title}" is now unhidden and visible.`);
      loadContent();
    } else {
      showMessage(res.error || 'Failed to unhide item', 'error');
    }
  };

  const handleToggleFeature = async (item: CmsContentRecord) => {
    const nextState = !item.featured;
    const res = await adminService.toggleFeatureContent(item.id, nextState);
    if (res.success) {
      showMessage(`"${item.title}" ${nextState ? 'marked as featured' : 'unfeatured'}.`);
      loadContent();
    } else {
      showMessage(res.error || 'Failed to toggle featured status', 'error');
    }
  };

  const handleDuplicate = async (item: CmsContentRecord) => {
    const res = await adminService.duplicateContent(item.id);
    if (res.success) {
      showMessage(`Duplicated "${item.title}" as draft copy.`);
      loadContent();
    } else {
      showMessage(res.error || 'Failed to duplicate item', 'error');
    }
  };

  const handleReorder = async (item: CmsContentRecord, direction: 'up' | 'down') => {
    const currentIndex = items.findIndex((i) => i.id === item.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const targetItem = items[targetIndex];
    const currentSort = item.sortOrder ?? currentIndex + 1;
    const targetSort = targetItem.sortOrder ?? targetIndex + 1;

    // Swap sort orders
    const mapping = [
      { id: item.id, sortOrder: targetSort },
      { id: targetItem.id, sortOrder: currentSort },
    ];

    const res = await adminService.reorderContent(mapping);
    if (res.success) {
      loadContent();
    } else {
      showMessage(res.error || 'Failed to reorder items', 'error');
    }
  };

  // Safe Deletion Handlers
  const openSafeDeleteModal = (item: CmsContentRecord, isPurge: boolean = false) => {
    setSafeDeleteModal({ item, isPurge });
    setDeleteReason(
      isPurge
        ? 'Permanent removal requested by administrator.'
        : 'Curriculum update / Replaced by newer edition'
    );
  };

  const handleConfirmDeletion = async () => {
    if (!safeDeleteModal) return;
    const { item, isPurge } = safeDeleteModal;

    if (isPurge) {
      // Permanent hard purge
      const res = await adminService.purgeContent(item.id, deleteReason);
      if (res.success) {
        showMessage(`"${item.title}" permanently purged. Audit log created.`);
        setSafeDeleteModal(null);
        loadContent();
      } else {
        showMessage(res.error || 'Failed to purge content', 'error');
      }
    } else {
      // Safe soft-delete / archive
      const res = await adminService.archiveContent(item.id, deleteReason);
      if (res.success) {
        showMessage(`"${item.title}" safely moved to Archive. Underlying files are preserved.`);
        setSafeDeleteModal(null);
        loadContent();
      } else {
        showMessage(res.error || 'Failed to archive content', 'error');
      }
    }
  };

  const handleRestore = async (item: CmsContentRecord) => {
    const res = await adminService.restoreContent(item.id);
    if (res.success) {
      showMessage(`"${item.title}" restored from archive back to active catalogue.`);
      loadContent();
    } else {
      showMessage(res.error || 'Failed to restore content', 'error');
    }
  };

  // Save Create / Edit
  const handleSaveItem = async () => {
    if (!editItem) return;

    if (!editItem.title?.trim()) {
      alert('Please enter a Resource Title');
      return;
    }

    try {
      if (isCreating) {
        const res = await adminService.createContent(editItem);
        if (res.success) {
          showMessage(`"${res.item?.title}" created successfully.`);
          setEditItem(null);
          setIsCreating(false);
          loadContent();
        } else {
          showMessage(res.error || 'Failed to create resource', 'error');
        }
      } else if (editItem.id) {
        const res = await adminService.updateContent(editItem.id, editItem);
        if (res.success) {
          showMessage(`"${res.item?.title}" updated successfully.`);
          setEditItem(null);
          loadContent();
        } else {
          showMessage(res.error || 'Failed to update resource', 'error');
        }
      }
    } catch (e: any) {
      showMessage(e?.message || 'Failed to save', 'error');
    }
  };

  const openCreateModal = () => {
    setIsCreating(true);
    setEditItem({
      title: '',
      slug: '',
      contentType: 'pdf',
      classLevels: ['Class 10'],
      categoryId: 'Algebra',
      subcategoryId: '',
      topic: '',
      shortDescription: '',
      description: '',
      accessType: 'free',
      price: 0,
      annualPassIncluded: true,
      downloadAllowed: true,
      visible: true,
      status: 'draft',
      featured: false,
      sourceDriveId: `1dr_stg_${Date.now().toString().slice(-8)}`,
      importStatus: 'direct',
      sortOrder: items.length + 1,
      thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
    });
  };

  const openEditModal = (item: CmsContentRecord) => {
    setIsCreating(false);
    setEditItem({ ...item });
  };

  // Format Helper
  const getFormatBadge = (type: string) => {
    const found = CONTENT_FORMATS.find((f) => f.value === type);
    const Icon = found ? found.icon : FileText;
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium">
        <Icon className="w-3.5 h-3.5 text-blue-600" />
        <span>{found ? found.label.split('/')[0].trim() : type}</span>
      </span>
    );
  };

  // Render KaTeX formula for preview
  const renderMath = (latex: string) => {
    try {
      const html = katex.renderToString(latex, { throwOnError: false, displayMode: true });
      return <div dangerouslySetInnerHTML={{ __html: html }} className="py-2 text-center text-slate-800" />;
    } catch {
      return <div className="font-mono text-xs text-slate-600 py-1">{latex}</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-lg border text-xs font-semibold flex items-center justify-between gap-3 shadow-xs transition-all ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header and Top Action Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
            Curriculum Content CMS
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative lifecycle control for all 12 formats · Safe deletion archive · Drive synchronization
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Resource</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Segments (Zero-Pill: functional button tabs) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
            activeTab === 'active'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Active Catalogue ({counts.active})
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'archived'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Safe Archive / Trash ({counts.archived})</span>
        </button>

        {activeTab === 'archived' && (
          <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 ml-auto">
            Safe Deletion Policy: Underlying Drive files preserved for rollback
          </span>
        )}
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Field */}
          <div className="relative md:col-span-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, slug, topic, Drive ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* Grade Selector */}
          <div className="md:col-span-2">
            <select
              aria-label="Filter by Grade"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 cursor-pointer focus:outline-hidden"
            >
              <option value="All">All Grades (5–10)</option>
              {GRADE_LEVELS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Format Selector */}
          <div className="md:col-span-2">
            <select
              aria-label="Filter by Content Format"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 cursor-pointer focus:outline-hidden"
            >
              <option value="All">All Formats (12)</option>
              {CONTENT_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Access Filter */}
          <div className="md:col-span-2">
            <select
              aria-label="Filter by Access"
              value={selectedAccess}
              onChange={(e) => setSelectedAccess(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 cursor-pointer focus:outline-hidden"
            >
              <option value="All">All Access Tiers</option>
              <option value="free">Free Access</option>
              <option value="paid">Paid / Annual Pass</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="md:col-span-2">
            <select
              aria-label="Sort by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 cursor-pointer focus:outline-hidden"
            >
              <option value="sortOrder">Curated Order</option>
              <option value="latest">Latest Updated</option>
              <option value="views">Most Views</option>
              <option value="downloads">Most Downloads</option>
              <option value="sales">Highest Sales</option>
              <option value="alpha">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main CMS Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table summary bar */}
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-medium text-slate-600">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-slate-900 font-semibold">{items.length}</strong> resources
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>
              {activeTab === 'active' ? `${counts.published} published / ${counts.hidden} hidden` : `${counts.archived} in safe archive`}
            </span>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            {activeTab === 'active' ? 'Drag or use Up/Down arrows to reorder' : 'Historical audit maintained'}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
            Loading curriculum inventory...
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-medium text-slate-700">No content resources found matching query.</p>
            <p className="text-[11px]">Adjust your filters or create a new resource above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-heading text-[10px]">
                <tr>
                  <th className="px-4 py-3 w-12 text-center">#</th>
                  <th className="px-4 py-3 min-w-[240px]">Resource & Category</th>
                  <th className="px-4 py-3">Format</th>
                  <th className="px-4 py-3 min-w-[140px]">Source Drive ID</th>
                  <th className="px-4 py-3">Import & Sync</th>
                  <th className="px-4 py-3">Visibility</th>
                  <th className="px-4 py-3">Access</th>
                  <th className="px-4 py-3 text-right">Views</th>
                  <th className="px-4 py-3 text-right">Downloads</th>
                  <th className="px-4 py-3 text-right">Sales</th>
                  <th className="px-5 py-3 text-right min-w-[160px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {items.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      item.isDeleted ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    {/* Sort Order & Reorder Controls */}
                    <td className="px-3 py-3 text-center">
                      {activeTab === 'active' ? (
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <button
                            onClick={() => handleReorder(item, 'up')}
                            disabled={idx === 0}
                            title="Move up in catalogue"
                            className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <span className="font-mono text-[10px] text-slate-500">
                            {item.sortOrder ?? idx + 1}
                          </span>
                          <button
                            onClick={() => handleReorder(item, 'down')}
                            disabled={idx === items.length - 1}
                            title="Move down in catalogue"
                            className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-mono text-[10px] text-slate-400">{idx + 1}</span>
                      )}
                    </td>

                    {/* Title & Metadata (Zero-Pill: unboxed clean text) */}
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        {item.featured && (
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <div className="font-heading font-bold text-slate-900 line-clamp-1">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className="font-semibold text-blue-700">
                              {item.classLevels.join(', ')}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{item.categoryId}</span>
                            {item.topic && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-slate-400">{item.topic}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Format */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getFormatBadge(item.contentType)}
                    </td>

                    {/* Source Drive ID (Show Drive ID + copy) */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <HardDrive className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-mono text-[11px] text-slate-700 truncate max-w-[100px]" title={item.sourceDriveId}>
                          {item.sourceDriveId || 'Direct / Native'}
                        </span>
                        {item.sourceDriveId && (
                          <button
                            onClick={() => copyToClipboard(item.sourceDriveId, item.id)}
                            title="Copy Google Drive File ID"
                            className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Import Status & Last Sync */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-[11px]">
                        <span
                          className={`font-medium ${
                            item.importStatus === 'imported'
                              ? 'text-emerald-700'
                              : item.importStatus === 'pending'
                              ? 'text-amber-700'
                              : 'text-slate-600'
                          }`}
                        >
                          {item.importStatus === 'imported'
                            ? '● Imported'
                            : item.importStatus === 'pending'
                            ? '○ Pending Sync'
                            : 'Direct CMS'}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {new Date(item.lastSync || item.updatedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </td>

                    {/* Visibility (Zero-Pill: unboxed text with status indicator) */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.isDeleted ? (
                        <span className="text-amber-800 font-medium">Archived</span>
                      ) : item.visible ? (
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Visible
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Hidden
                        </span>
                      )}
                    </td>

                    {/* Access */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.accessType === 'free' ? (
                        <span className="text-slate-600 text-[11px]">Free</span>
                      ) : (
                        <span className="text-blue-800 font-medium text-[11px]">
                          {item.annualPassIncluded ? 'Annual Pass' : `₹${item.price || 499}`}
                        </span>
                      )}
                    </td>

                    {/* Views */}
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                      {item.views.toLocaleString()}
                    </td>

                    {/* Downloads */}
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                      {item.downloads.toLocaleString()}
                    </td>

                    {/* Sales */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="font-mono text-xs tabular-nums text-slate-900">
                        {item.sales.orderCount > 0 ? (
                          <>
                            <span>{item.sales.orderCount} orders</span>
                            <div className="text-[10px] text-slate-500">₹{item.sales.revenue.toLocaleString()}</div>
                          </>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    </td>

                    {/* Actions Menu */}
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Live Preview Button */}
                        <button
                          onClick={() => setPreviewItem(item)}
                          title="Live Student Preview"
                          className="p-1.5 text-slate-500 hover:text-blue-600 rounded-md hover:bg-slate-100 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {activeTab === 'active' ? (
                          <>
                            {/* Edit Button */}
                            <button
                              onClick={() => openEditModal(item)}
                              title="Edit Resource Metadata"
                              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Visibility Toggle */}
                            {item.visible ? (
                              <button
                                onClick={() => handleHide(item)}
                                title="Hide from Catalogue"
                                className="p-1.5 text-slate-500 hover:text-amber-700 rounded-md hover:bg-amber-50 cursor-pointer"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUnhide(item)}
                                title="Make Visible in Catalogue"
                                className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-md hover:bg-emerald-50 cursor-pointer"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Featured Toggle */}
                            <button
                              onClick={() => handleToggleFeature(item)}
                              title={item.featured ? 'Remove from Featured' : 'Mark as Featured'}
                              className={`p-1.5 rounded-md hover:bg-slate-100 cursor-pointer ${
                                item.featured ? 'text-amber-500 hover:text-amber-600' : 'text-slate-400 hover:text-amber-500'
                              }`}
                            >
                              <Star className={`w-3.5 h-3.5 ${item.featured ? 'fill-amber-500' : ''}`} />
                            </button>

                            {/* Duplicate Button */}
                            <button
                              onClick={() => handleDuplicate(item)}
                              title="Duplicate Resource (Draft Copy)"
                              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Safe Delete / Archive Button */}
                            <button
                              onClick={() => openSafeDeleteModal(item, false)}
                              title="Safe Soft-Delete to Archive"
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 cursor-pointer transition-colors"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Archived Tab: Restore Button */}
                            <button
                              onClick={() => handleRestore(item)}
                              title="Restore Resource to Active Catalogue"
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Restore</span>
                            </button>

                            {/* Permanent Purge Button */}
                            <button
                              onClick={() => openSafeDeleteModal(item, true)}
                              title="Permanently Purge Record (Hard Delete)"
                              className="p-1.5 text-rose-500 hover:text-rose-700 rounded-md hover:bg-rose-100 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. LIVE STUDENT PREVIEW MODAL                                */}
      {/* ------------------------------------------------------------- */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Student Preview Mode
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    /{previewItem.slug}
                  </span>
                </div>
                <h3 className="text-base font-heading font-extrabold text-slate-900 mt-1">
                  {previewItem.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Multi-Format Viewer */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Entitlement Banner in Preview */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  {previewItem.accessType === 'free' ? (
                    <span className="font-semibold text-emerald-700">● 100% Free Public Access (No Login Required)</span>
                  ) : (
                    <span className="font-semibold text-blue-700">● Pro / Annual Pass Entitlement Required</span>
                  )}
                </div>
                <div className="text-slate-500 font-mono text-[11px]">
                  Format: {previewItem.contentType.toUpperCase()}
                </div>
              </div>

              {/* Format Specific Presentation */}
              {previewItem.contentType === 'formulaSheet' && (
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
                  <div className="text-xs font-heading font-bold text-slate-800 uppercase tracking-wider">
                    KaTeX Formula Deck Preview
                  </div>
                  {(previewItem.equations || [
                    { title: 'Standard Quadratic Form', latex: 'ax^2 + bx + c = 0', explanation: 'General polynomial of degree 2' },
                    { title: 'Quadratic Formula', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', explanation: 'Sridharacharya solution' },
                  ]).map((eq, i) => (
                    <div key={i} className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-1">
                      <div className="text-xs font-semibold text-slate-700">{eq.title}</div>
                      {renderMath(eq.latex)}
                      <div className="text-[11px] text-slate-500 text-center">{eq.explanation}</div>
                    </div>
                  ))}
                </div>
              )}

              {(previewItem.contentType === 'pdf' || previewItem.contentType === 'worksheet') && (
                <div className="bg-slate-900 rounded-xl p-8 text-white text-center space-y-3">
                  <FileText className="w-12 h-12 text-blue-400 mx-auto" />
                  <div className="font-heading font-bold text-sm">
                    {previewItem.files?.[0]?.name || `${previewItem.slug}.pdf`}
                  </div>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    {previewItem.shortDescription || 'Authoritative mathematics reference handout.'}
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-2">
                    <a
                      href={previewItem.files?.[0]?.url || 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF Attachment</span>
                    </a>
                  </div>
                </div>
              )}

              {previewItem.contentType === 'youtube' && (
                <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-md">
                  <iframe
                    src={previewItem.embedUrl || 'https://www.youtube.com/embed/ZBalWWHY9kE'}
                    title={previewItem.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {(previewItem.contentType === 'video' || previewItem.contentType === 'reel') && (
                <div className="bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center text-white">
                  <video
                    controls
                    poster={previewItem.thumbnail}
                    className="w-full h-full object-contain"
                  >
                    <source
                      src={previewItem.files?.[0]?.url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
                      type="video/mp4"
                    />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {previewItem.contentType === 'course' && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                  <div className="text-xs font-heading font-bold text-slate-800 uppercase tracking-wider">
                    Course Syllabus & Unit Progression
                  </div>
                  <div className="space-y-2">
                    {(previewItem.modules || [
                      { id: '1', title: 'Chapter 1: Real Numbers Foundations', duration: '40 mins', lessonsCount: 4 },
                      { id: '2', title: 'Chapter 2: Proofs of Irrationality', duration: '55 mins', lessonsCount: 5 },
                    ]).map((m, idx) => (
                      <div
                        key={m.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">{m.title}</div>
                          <div className="text-[11px] text-slate-500">{m.lessonsCount} lessons · {m.duration}</div>
                        </div>
                        <span className="text-slate-400 text-xs">Unit {idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewItem.contentType === 'testPaper' && (
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="text-xs font-bold text-slate-900">Diagnostic Board Test Structure</div>
                    <div className="text-xs text-blue-700 font-mono">
                      Max Marks: {previewItem.totalMarks || 80} · Duration: {previewItem.durationMinutes || 180} min
                    </div>
                  </div>
                  <div className="text-xs text-slate-600">
                    Total Questions: {previewItem.questionsCount || 38} (Section A: MCQs, Section B: Short Answer, Section C: Long Answer, Section D: Case Based)
                  </div>
                </div>
              )}

              {/* Resource Description & Metadata */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="text-xs font-heading font-bold text-slate-900">Resource Description</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {previewItem.description || previewItem.shortDescription || 'No description provided.'}
                </p>
                <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-3">
                  <span>Source Drive ID: <strong className="font-mono text-slate-600">{previewItem.sourceDriveId}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>Sync Status: <strong className="text-slate-600">{previewItem.importStatus}</strong></span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Live URL: <span className="font-mono text-blue-700">/study/{previewItem.slug}</span>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-medium cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. CREATE / EDIT RESOURCE MODAL                              */}
      {/* ------------------------------------------------------------- */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-heading font-extrabold text-slate-900">
                  {isCreating ? 'Create Curriculum Resource' : 'Edit Curriculum Resource'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure metadata, format viewer, source Drive reference, and access tier.
                </p>
              </div>
              <button
                onClick={() => setEditItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Title & Slug */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Resource Title *</label>
                <input
                  type="text"
                  value={editItem.title || ''}
                  onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                  placeholder="e.g. Real Numbers & Fundamental Theorem of Arithmetic"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">URL Slug</label>
                  <input
                    type="text"
                    value={editItem.slug || ''}
                    onChange={(e) => setEditItem({ ...editItem, slug: e.target.value })}
                    placeholder="auto-generated from title"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Content Format (Supports all 12 defined formats) */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Content Format *</label>
                  <select
                    value={editItem.contentType || 'pdf'}
                    onChange={(e) => setEditItem({ ...editItem, contentType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  >
                    {CONTENT_FORMATS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grades & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Target Grade Level</label>
                  <select
                    value={editItem.classLevels?.[0] || 'Class 10'}
                    onChange={(e) =>
                      setEditItem({
                        ...editItem,
                        classLevels: [e.target.value as StudentClass],
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  >
                    {GRADE_LEVELS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Subject Category</label>
                  <input
                    type="text"
                    value={editItem.categoryId || ''}
                    onChange={(e) => setEditItem({ ...editItem, categoryId: e.target.value })}
                    placeholder="Algebra / Geometry / Number System"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Source Drive ID & Embed URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Source Google Drive File ID</label>
                  <input
                    type="text"
                    value={editItem.sourceDriveId || ''}
                    onChange={(e) => setEditItem({ ...editItem, sourceDriveId: e.target.value })}
                    placeholder="1dr_8xK9ZqWvL3mNp7T2sF4hY5bC"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Media / Embed URL</label>
                  <input
                    type="text"
                    value={editItem.embedUrl || ''}
                    onChange={(e) => setEditItem({ ...editItem, embedUrl: e.target.value })}
                    placeholder="https://www.youtube.com/embed/... or CDN URL"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Access & Monetization */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-semibold text-slate-800">Access Tier & Pricing</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Access Type</label>
                    <select
                      value={editItem.accessType || 'free'}
                      onChange={(e) => setEditItem({ ...editItem, accessType: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 cursor-pointer"
                    >
                      <option value="free">Free Access</option>
                      <option value="paid">Paid Access</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Price (₹ INR)</label>
                    <input
                      type="number"
                      value={editItem.price ?? 0}
                      onChange={(e) => setEditItem({ ...editItem, price: Number(e.target.value) })}
                      disabled={editItem.accessType === 'free'}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 disabled:opacity-50"
                    />
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editItem.annualPassIncluded !== false}
                        onChange={(e) => setEditItem({ ...editItem, annualPassIncluded: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-700">Included in Annual Pass</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Descriptions */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Short Summary</label>
                <input
                  type="text"
                  value={editItem.shortDescription || ''}
                  onChange={(e) => setEditItem({ ...editItem, shortDescription: e.target.value })}
                  placeholder="One sentence summary for catalog cards"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Full Description</label>
                <textarea
                  rows={3}
                  value={editItem.description || ''}
                  onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                  placeholder="Detailed pedagogical notes, formulas, theorems, board patterns..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editItem.visible !== false}
                    onChange={(e) => setEditItem({ ...editItem, visible: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-slate-700">Visible to Students</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editItem.featured)}
                    onChange={(e) => setEditItem({ ...editItem, featured: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-slate-700">Featured Resource</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editItem.downloadAllowed !== false}
                    onChange={(e) => setEditItem({ ...editItem, downloadAllowed: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-slate-700">Allow Download</span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setEditItem(null)}
                className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs cursor-pointer"
              >
                {isCreating ? 'Create Resource' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. SAFE DELETION / ARCHIVE MODAL                             */}
      {/* ------------------------------------------------------------- */}
      {safeDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  safeDeleteModal.isPurge ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {safeDeleteModal.isPurge ? <Trash2 className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-heading font-extrabold text-slate-900">
                  {safeDeleteModal.isPurge ? 'Permanent Purge Record' : 'Move to Safe Archive'}
                </h3>
                <p className="text-xs text-slate-500">
                  {safeDeleteModal.isPurge
                    ? 'Irreversible hard deletion'
                    : 'Safe Deletion Policy active'}
                </p>
              </div>
            </div>

            <div
              className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                safeDeleteModal.isPurge
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="font-semibold">
                Resource: {safeDeleteModal.item.title}
              </div>
              <p className="text-[11px] leading-relaxed">
                {safeDeleteModal.isPurge
                  ? 'WARNING: This will permanently remove the record from all database indexes. Only proceed if curriculum is legally superseded.'
                  : 'SAFE POLICY: This item will be archived. All underlying files in Google Cloud Storage and source Drive IDs remain completely intact. You can restore this resource back to active inventory with 1 click anytime.'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Reason for {safeDeleteModal.isPurge ? 'Permanent Purge' : 'Archiving'} *
              </label>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="e.g. Rationalized 2026 syllabus, replaced by newer edition"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setSafeDeleteModal(null)}
                className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeletion}
                className={`px-4 py-2 rounded-lg text-white text-xs font-medium cursor-pointer ${
                  safeDeleteModal.isPurge
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {safeDeleteModal.isPurge ? 'Confirm Hard Purge' : 'Move to Safe Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
