import React, { useState, useEffect } from 'react';
import {
  GripVertical,
  Settings,
  ArrowUp,
  ArrowDown,
  Save,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  BookOpen,
  Search,
  Flame,
  Clock,
  TrendingUp,
  FolderTree,
  Gift,
  Crown,
  Sigma,
  Bot,
  Video,
  CreditCard,
  Share2,
  Megaphone,
  LayoutTemplate,
  Info,
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import {
  HomepageBlock,
  HomepageBlockId,
  DEFAULT_HOMEPAGE_BLOCKS,
} from '../../../lib/layout/homepageLayoutTypes';

// Block Icon mapping
const BLOCK_ICONS: Record<HomepageBlockId, React.FC<{ className?: string }>> = {
  hero: Sparkles,
  globalSearch: Search,
  trending: Flame,
  latest: Clock,
  popular: TrendingUp,
  classCategories: FolderTree,
  freeMaterial: Gift,
  premiumMaterial: Crown,
  formulaDeckCta: Sigma,
  aiTeacherCta: Bot,
  courses: Video,
  annualPassCta: CreditCard,
  socialJoin: Share2,
  adsense: LayoutTemplate,
  customAnnouncement: Megaphone,
};

export const AdminLayoutSection: React.FC = () => {
  const [blocks, setBlocks] = useState<HomepageBlock[]>(DEFAULT_HOMEPAGE_BLOCKS);
  const [loading, setLoading] = useState<boolean>(true);
  const [saved, setSaved] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Config Drawer Modal state
  const [activeConfigBlock, setActiveConfigBlock] = useState<HomepageBlock | null>(null);
  const [tempConfig, setTempConfig] = useState<Record<string, any>>({});

  // Load authoritative layout
  const loadLayout = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAdminHomepageLayout();
      if (data && Array.isArray(data.blocks)) {
        setBlocks(data.blocks);
      }
    } catch (e: any) {
      console.error('Failed to load homepage layout', e);
      showMessage('Could not load stored layout; displaying canonical defaults.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLayout();
  }, []);

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // Toggle enable/disable
  const handleToggleBlock = (id: HomepageBlockId) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b))
    );
  };

  // Move up/down buttons
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const updated = [...blocks];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    // Re-index orders
    const reordered = updated.map((b, idx) => ({ ...b, order: idx + 1 }));
    setBlocks(reordered);
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...blocks];
    const [removed] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, removed);

    const reordered = updated.map((b, idx) => ({ ...b, order: idx + 1 }));
    setBlocks(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Save full layout
  const handleSaveLayout = async () => {
    try {
      const res = await adminService.saveAdminHomepageLayout(blocks);
      if (res.success) {
        setSaved(true);
        showMessage('Homepage layout saved to Firestore site settings & cached.');
        setTimeout(() => setSaved(false), 3000);
      } else {
        showMessage(res.error || 'Failed to save layout', 'error');
      }
    } catch (e: any) {
      showMessage(e?.message || 'Failed to save layout', 'error');
    }
  };

  // Reset to Defaults
  const handleResetDefaults = async () => {
    const confirmed = window.confirm(
      'Reset homepage block sequence and configurations to canonical defaults?'
    );
    if (!confirmed) return;

    try {
      const res = await adminService.resetAdminHomepageLayout();
      if (res.success && res.layout) {
        setBlocks(res.layout.blocks);
        showMessage('Homepage layout reset to defaults.');
      } else {
        showMessage(res.error || 'Failed to reset', 'error');
      }
    } catch (e: any) {
      showMessage(e?.message || 'Failed to reset', 'error');
    }
  };

  // Open Block Configuration
  const handleOpenConfig = (block: HomepageBlock) => {
    setActiveConfigBlock(block);
    setTempConfig({ ...(block.config || {}) });
  };

  const handleSaveConfig = () => {
    if (!activeConfigBlock) return;

    setBlocks((prev) =>
      prev.map((b) =>
        b.id === activeConfigBlock.id
          ? { ...b, config: { ...tempConfig } }
          : b
      )
    );

    setActiveConfigBlock(null);
    showMessage(`Updated configuration for ${activeConfigBlock.name}. Click "Save Layout Changes" to persist.`);
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

      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
            Controlled Homepage Block Manager
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Predefined performant layout blocks · Drag-and-drop ordering · Stored in site settings
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            <span>Live Public Preview</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSaveLayout}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saved ? 'Saved Layout!' : 'Save Layout Changes'}</span>
          </button>
        </div>
      </div>

      {/* Informative Guidance Banner */}
      <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Controlled Assembly Architecture:</strong> This manager governs exactly 15 predefined, high-performance pedagogical blocks. Drag blocks up and down to change public layout sequence, toggle visibility with the switch, or click <strong>Configure</strong> to customize block copy and parameters.
        </div>
      </div>

      {/* Main Drag-and-Drop Block List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-medium text-slate-600">
          <span>
            {blocks.filter((b) => b.enabled).length} of {blocks.length} Blocks Active on Homepage
          </span>
          <span className="font-mono text-[11px] text-blue-700">
            Drag handle or arrows to reorder
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
            Loading block configuration...
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {blocks.map((block, idx) => {
              const Icon = BLOCK_ICONS[block.id] || LayoutTemplate;
              const isDragging = draggedIndex === idx;
              const isOver = dragOverIndex === idx;

              return (
                <div
                  key={block.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, idx)}
                  className={`p-4 transition-all flex items-center justify-between gap-4 ${
                    isDragging
                      ? 'opacity-40 bg-blue-50/30'
                      : isOver
                      ? 'border-t-2 border-blue-600 bg-blue-50/20'
                      : block.enabled
                      ? 'hover:bg-slate-50/70'
                      : 'bg-slate-50/40 opacity-70'
                  }`}
                >
                  {/* Drag Handle & Order Badge */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-700 rounded"
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <span className="font-mono text-xs font-bold text-slate-400 w-5 text-center">
                      #{idx + 1}
                    </span>

                    {/* Block Icon */}
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        block.enabled ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Block Information */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-xs text-slate-900">
                          {block.name}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          [{block.id}]
                        </span>
                        {!block.enabled && (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                            Disabled
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-md">
                        {block.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Toggles */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {/* Up / Down Accessibility Buttons */}
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                      <button
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-[1px] h-4 bg-slate-200" />
                      <button
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === blocks.length - 1}
                        title="Move Down"
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Configure Settings Button */}
                    <button
                      onClick={() => handleOpenConfig(block)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium cursor-pointer"
                      title={`Configure parameters for ${block.name}`}
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-500" />
                      <span>Configure</span>
                    </button>

                    {/* Enable / Disable Switch */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={block.enabled}
                        onChange={() => handleToggleBlock(block.id)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* BLOCK CONFIGURATION DRAWER / MODAL                            */}
      {/* ------------------------------------------------------------- */}
      {activeConfigBlock && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-heading font-extrabold text-slate-900">
                  Configure Block: {activeConfigBlock.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  ID: {activeConfigBlock.id}
                </p>
              </div>
              <button
                onClick={() => setActiveConfigBlock(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields Tailored to Block */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* HERO */}
              {activeConfigBlock.id === 'hero' && (
                <>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Headline</label>
                    <input
                      type="text"
                      value={tempConfig.headline || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, headline: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Kicker Text</label>
                    <input
                      type="text"
                      value={tempConfig.kickerText || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, kickerText: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Subheadline / Paragraph</label>
                    <textarea
                      rows={3}
                      value={tempConfig.subheadline || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, subheadline: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Primary Button Label</label>
                      <input
                        type="text"
                        value={tempConfig.primaryButtonText || ''}
                        onChange={(e) => setTempConfig({ ...tempConfig, primaryButtonText: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Primary Button Link</label>
                      <input
                        type="text"
                        value={tempConfig.primaryButtonLink || ''}
                        onChange={(e) => setTempConfig({ ...tempConfig, primaryButtonLink: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* GLOBAL SEARCH */}
              {activeConfigBlock.id === 'globalSearch' && (
                <>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Search Input Placeholder</label>
                    <input
                      type="text"
                      value={tempConfig.placeholder || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, placeholder: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Quick Search Suggestions (comma separated)</label>
                    <input
                      type="text"
                      value={Array.isArray(tempConfig.quickTags) ? tempConfig.quickTags.join(', ') : tempConfig.quickTags || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, quickTags: e.target.value.split(',').map((s: string) => s.trim()) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </>
              )}

              {/* TRENDING / LATEST / POPULAR / FREE / PREMIUM / COURSES */}
              {(['trending', 'latest', 'popular', 'freeMaterial', 'premiumMaterial', 'courses'] as string[]).includes(activeConfigBlock.id) && (
                <>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Section Title</label>
                    <input
                      type="text"
                      value={tempConfig.title || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Subtitle</label>
                    <input
                      type="text"
                      value={tempConfig.subtitle || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, subtitle: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Maximum Display Items</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={tempConfig.maxItems || 4}
                      onChange={(e) => setTempConfig({ ...tempConfig, maxItems: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </>
              )}

              {/* CLASS CATEGORIES */}
              {activeConfigBlock.id === 'classCategories' && (
                <>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Section Title</label>
                    <input
                      type="text"
                      value={tempConfig.title || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Default Selected Grade</label>
                    <select
                      value={tempConfig.defaultClass || 'Class 10'}
                      onChange={(e) => setTempConfig({ ...tempConfig, defaultClass: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
                    >
                      <option value="Class 5">Class 5</option>
                      <option value="Class 6">Class 6</option>
                      <option value="Class 7">Class 7</option>
                      <option value="Class 8">Class 8</option>
                      <option value="Class 9">Class 9</option>
                      <option value="Class 10">Class 10</option>
                    </select>
                  </div>
                </>
              )}

              {/* AI TEACHER CTA */}
              {activeConfigBlock.id === 'aiTeacherCta' && (
                <>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Headline</label>
                    <input
                      type="text"
                      value={tempConfig.headline || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, headline: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Body Copy</label>
                    <textarea
                      rows={3}
                      value={tempConfig.subheadline || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, subheadline: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Badge Kicker</label>
                    <input
                      type="text"
                      value={tempConfig.badgeText || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, badgeText: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </>
              )}

              {/* ANNUAL PASS CTA */}
              {activeConfigBlock.id === 'annualPassCta' && (
                <>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Pass Title</label>
                    <input
                      type="text"
                      value={tempConfig.title || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Price Display</label>
                      <input
                        type="text"
                        value={tempConfig.priceFormatted || '₹999'}
                        onChange={(e) => setTempConfig({ ...tempConfig, priceFormatted: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Period Label</label>
                      <input
                        type="text"
                        value={tempConfig.periodText || '/ entire academic year'}
                        onChange={(e) => setTempConfig({ ...tempConfig, periodText: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Guarantee Text</label>
                    <input
                      type="text"
                      value={tempConfig.guaranteeText || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, guaranteeText: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </>
              )}

              {/* SOCIAL JOIN */}
              {activeConfigBlock.id === 'socialJoin' && (
                <>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Title</label>
                    <input
                      type="text"
                      value={tempConfig.title || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Telegram Channel URL</label>
                    <input
                      type="text"
                      value={tempConfig.telegramUrl || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, telegramUrl: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">YouTube Channel URL</label>
                    <input
                      type="text"
                      value={tempConfig.youtubeUrl || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, youtubeUrl: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px]"
                    />
                  </div>
                </>
              )}

              {/* ADSENSE */}
              {activeConfigBlock.id === 'adsense' && (
                <>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Google AdSense Slot ID</label>
                    <input
                      type="text"
                      value={tempConfig.adSlotId || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, adSlotId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Ad Format</label>
                    <select
                      value={tempConfig.format || 'horizontal'}
                      onChange={(e) => setTempConfig({ ...tempConfig, format: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
                    >
                      <option value="horizontal">Horizontal Banner (Leaderboard)</option>
                      <option value="auto">Responsive Auto</option>
                      <option value="rectangle">Medium Rectangle</option>
                    </select>
                  </div>
                </>
              )}

              {/* CUSTOM ANNOUNCEMENT */}
              {activeConfigBlock.id === 'customAnnouncement' && (
                <>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Announcement Title</label>
                    <input
                      type="text"
                      value={tempConfig.title || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Message Body</label>
                    <textarea
                      rows={2}
                      value={tempConfig.message || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, message: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Action Link Text</label>
                      <input
                        type="text"
                        value={tempConfig.linkText || ''}
                        onChange={(e) => setTempConfig({ ...tempConfig, linkText: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Action Link Target URL</label>
                      <input
                        type="text"
                        value={tempConfig.linkUrl || ''}
                        onChange={(e) => setTempConfig({ ...tempConfig, linkUrl: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Banner Style</label>
                    <select
                      value={tempConfig.variant || 'info'}
                      onChange={(e) => setTempConfig({ ...tempConfig, variant: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
                    >
                      <option value="info">Info (Blue)</option>
                      <option value="warning">Urgent / Warning (Amber)</option>
                      <option value="promo">Promotional (Purple / Gold)</option>
                      <option value="exam">Exam Cycle (Emerald)</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setActiveConfigBlock(null)}
                className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium cursor-pointer"
              >
                Apply Parameters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
