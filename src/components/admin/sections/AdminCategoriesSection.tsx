import React, { useState, useEffect, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit3,
  Trash2,
  Move,
  ArrowUp,
  ArrowDown,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Unlock,
  BookOpen,
  CornerDownRight,
  List,
  Network,
  RotateCcw,
  FileText,
  Info,
} from 'lucide-react';
import {
  adminService,
  HierarchicalCategoryRecord,
  CanDeleteCategoryResponse,
} from '../../../services/adminService';

export const AdminCategoriesSection: React.FC = () => {
  // State
  const [treeData, setTreeData] = useState<HierarchicalCategoryRecord[]>([]);
  const [flatData, setFlatData] = useState<HierarchicalCategoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // View Options
  const [viewMode, setViewMode] = useState<'tree' | 'flat'>('tree');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [includeDisabled, setIncludeDisabled] = useState<boolean>(true);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set(['cat-class-8', 'cat-c8-maths', 'cat-c8-algebra']));

  // Modals state
  const [createModal, setCreateModal] = useState<{
    isOpen: boolean;
    parentId: string | null;
    parentName?: string;
  }>({ isOpen: false, parentId: null });

  const [editModal, setEditModal] = useState<{
    category: HierarchicalCategoryRecord | null;
  }>({ category: null });

  const [moveModal, setMoveModal] = useState<{
    category: HierarchicalCategoryRecord | null;
    targetParentId: string | null;
  }>({ category: null, targetParentId: null });

  const [deleteModal, setDeleteModal] = useState<{
    category: HierarchicalCategoryRecord | null;
    checkResult: CanDeleteCategoryResponse | null;
    targetReassignId: string;
    reason: string;
  }>({ category: null, checkResult: null, targetReassignId: '', reason: '' });

  // Form State
  const [formName, setFormName] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formSortOrder, setFormSortOrder] = useState<number>(1);
  const [formDisabled, setFormDisabled] = useState<boolean>(false);

  // Load Categories
  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await adminService.getCategories('tree', includeDisabled);
      setTreeData(res.categories || []);
      setFlatData(res.flat || []);
    } catch (e: any) {
      console.error('Failed to load categories', e);
      showMessage('Failed to load categories: ' + (e?.message || 'Server error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [includeDisabled]);

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // Expand / Collapse Helpers
  const toggleExpand = (nodeId: string) => {
    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = flatData.map((c) => c.id);
    setExpandedNodeIds(new Set(allIds));
  };

  const collapseAll = () => {
    setExpandedNodeIds(new Set());
  };

  // Actions: Create
  const handleOpenCreate = (parentId: string | null = null, parentName?: string) => {
    setFormName('');
    setFormDescription('');
    setFormSortOrder(1);
    setFormDisabled(false);
    setCreateModal({ isOpen: true, parentId, parentName });
  };

  const handleSaveCreate = async () => {
    if (!formName.trim()) {
      showMessage('Please enter a category name', 'error');
      return;
    }

    try {
      const res = await adminService.createCategory({
        name: formName.trim(),
        parentId: createModal.parentId,
        description: formDescription.trim(),
        sortOrder: formSortOrder,
        disabled: formDisabled,
      });

      if (res.success) {
        showMessage(`Category "${res.category?.name}" created successfully.`);
        setCreateModal({ isOpen: false, parentId: null });
        if (createModal.parentId) {
          setExpandedNodeIds((prev) => new Set([...prev, createModal.parentId!]));
        }
        loadCategories();
      } else {
        showMessage(res.error || 'Failed to create category', 'error');
      }
    } catch (e: any) {
      showMessage(e?.message || 'Failed to create category', 'error');
    }
  };

  // Actions: Edit / Rename
  const handleOpenEdit = (cat: HierarchicalCategoryRecord) => {
    setFormName(cat.name);
    setFormDescription(cat.description || '');
    setFormSortOrder(cat.sortOrder);
    setFormDisabled(cat.disabled);
    setEditModal({ category: cat });
  };

  const handleSaveEdit = async () => {
    if (!editModal.category || !formName.trim()) return;

    try {
      const res = await adminService.updateCategory(editModal.category.id, {
        name: formName.trim(),
        description: formDescription.trim(),
        sortOrder: formSortOrder,
        disabled: formDisabled,
      });

      if (res.success) {
        showMessage(`Category "${res.category?.name}" updated successfully.`);
        setEditModal({ category: null });
        loadCategories();
      } else {
        showMessage(res.error || 'Failed to update category', 'error');
      }
    } catch (e: any) {
      showMessage(e?.message || 'Failed to update category', 'error');
    }
  };

  // Actions: Move Parent
  const handleOpenMove = (cat: HierarchicalCategoryRecord) => {
    setMoveModal({ category: cat, targetParentId: cat.parentId });
  };

  const handleSaveMove = async () => {
    if (!moveModal.category) return;

    try {
      const res = await adminService.moveCategory(moveModal.category.id, moveModal.targetParentId);
      if (res.success) {
        showMessage(`"${moveModal.category.name}" moved successfully.`);
        setMoveModal({ category: null, targetParentId: null });
        if (moveModal.targetParentId) {
          setExpandedNodeIds((prev) => new Set([...prev, moveModal.targetParentId!]));
        }
        loadCategories();
      } else {
        showMessage(res.error || 'Failed to move category', 'error');
      }
    } catch (e: any) {
      showMessage(e?.message || 'Failed to move category', 'error');
    }
  };

  // Actions: Reorder Sibling
  const handleReorder = async (cat: HierarchicalCategoryRecord, direction: 'up' | 'down') => {
    // Find siblings
    const siblings = flatData
      .filter((c) => c.parentId === cat.parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const currentIndex = siblings.findIndex((s) => s.id === cat.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const targetSibling = siblings[targetIndex];
    const currentSort = cat.sortOrder;
    const targetSort = targetSibling.sortOrder;

    try {
      // Swap
      await adminService.reorderCategory(cat.id, targetSort);
      await adminService.reorderCategory(targetSibling.id, currentSort);
      loadCategories();
    } catch (e: any) {
      showMessage(e?.message || 'Failed to reorder', 'error');
    }
  };

  // Actions: Toggle Disable
  const handleToggleDisable = async (cat: HierarchicalCategoryRecord) => {
    const nextState = !cat.disabled;
    try {
      const res = await adminService.toggleDisableCategory(cat.id, nextState);
      if (res.success) {
        showMessage(`Category "${cat.name}" ${nextState ? 'disabled' : 'enabled'}.`);
        loadCategories();
      } else {
        showMessage(res.error || 'Failed to toggle status', 'error');
      }
    } catch (e: any) {
      showMessage(e?.message || 'Failed to toggle status', 'error');
    }
  };

  // Actions: Delete & Content Reassignment Pre-check
  const handleOpenDelete = async (cat: HierarchicalCategoryRecord) => {
    try {
      const checkResult = await adminService.canDeleteCategory(cat.id);
      
      // Default reassignment candidate: pick any other category at the same level or root
      const candidates = flatData.filter(
        (c) => c.id !== cat.id && !c.ancestorIds?.includes(cat.id)
      );
      const defaultCandidate = candidates[0]?.id || '';

      setDeleteModal({
        category: cat,
        checkResult,
        targetReassignId: defaultCandidate,
        reason: 'Curriculum restructuring / consolidation',
      });
    } catch (e: any) {
      showMessage(e?.message || 'Failed to evaluate delete safety', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.category) return;

    const { category, checkResult, targetReassignId, reason } = deleteModal;
    const requiresReassignment = checkResult && !checkResult.canDelete;

    if (requiresReassignment && !targetReassignId) {
      showMessage('Please select a target category to reassign content before deletion.', 'error');
      return;
    }

    try {
      const res = await adminService.deleteCategory(category.id, {
        reassignToId: requiresReassignment ? targetReassignId : undefined,
        reason,
      });

      if (res.success) {
        showMessage(
          res.reassignedCount && res.reassignedCount > 0
            ? `"${category.name}" deleted. Reassigned ${res.reassignedCount} content items to target.`
            : `"${category.name}" safely deleted.`
        );
        setDeleteModal({ category: null, checkResult: null, targetReassignId: '', reason: '' });
        loadCategories();
      } else {
        showMessage(res.error || 'Failed to delete category', 'error');
      }
    } catch (e: any) {
      showMessage(e?.message || 'Failed to delete category', 'error');
    }
  };

  // Filtered Flat List for Search
  const filteredFlatData = useMemo(() => {
    if (!searchQuery.trim()) return flatData;
    const q = searchQuery.toLowerCase().trim();
    return flatData.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.path?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  }, [flatData, searchQuery]);

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: HierarchicalCategoryRecord, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodeIds.has(node.id);

    // If searching, check if node or any children match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nodeMatches =
        node.name.toLowerCase().includes(q) ||
        node.path?.toLowerCase().includes(q) ||
        node.description?.toLowerCase().includes(q);
      
      const hasMatchingChild = (n: HierarchicalCategoryRecord): boolean => {
        if (!n.children) return false;
        return n.children.some(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.path?.toLowerCase().includes(q) ||
            hasMatchingChild(c)
        );
      };

      if (!nodeMatches && !hasMatchingChild(node)) {
        return null;
      }
    }

    return (
      <div key={node.id} className="select-none">
        <div
          className={`group flex items-center justify-between py-2.5 px-3 rounded-xl border transition-all ${
            node.disabled
              ? 'bg-slate-50/70 border-slate-200 text-slate-400 opacity-75'
              : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs text-slate-800'
          }`}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          {/* Node Identity & Expand Arrow */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(node.id)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 cursor-pointer"
                title={isExpanded ? 'Collapse subcategories' : 'Expand subcategories'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                )}
              </button>
            ) : (
              <span className="w-6 flex items-center justify-center text-slate-300">
                <CornerDownRight className="w-3.5 h-3.5" />
              </span>
            )}

            {/* Folder Icon */}
            <span className="text-blue-600 shrink-0">
              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-blue-600" />
                ) : (
                  <Folder className="w-4 h-4 text-blue-500" />
                )
              ) : (
                <BookOpen className="w-4 h-4 text-slate-400" />
              )}
            </span>

            {/* Title & Level Tag */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-heading font-bold text-xs ${node.disabled ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                  {node.name}
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  L{depth}
                </span>
                {node.disabled && (
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                    Disabled
                  </span>
                )}
              </div>

              {/* Path Breadcrumb (Zero-Pill: unboxed clean text) */}
              <div className="text-[11px] text-slate-400 font-normal truncate mt-0.5">
                {node.path || node.name}
              </div>
            </div>
          </div>

          {/* Counts & Badges */}
          <div className="flex items-center gap-4 text-xs font-mono shrink-0 mr-2">
            <div className="text-right">
              <span
                className={`text-[11px] font-semibold ${
                  (node.contentCount ?? 0) > 0 ? 'text-blue-700' : 'text-slate-400'
                }`}
                title="Number of linked curriculum content items"
              >
                {node.contentCount ?? 0} items
              </span>
              {hasChildren && (
                <div className="text-[10px] text-slate-400">
                  {node.children?.length} subtopics
                </div>
              )}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
            {/* + Add Child */}
            <button
              onClick={() => handleOpenCreate(node.id, node.name)}
              title={`Add subcategory under ${node.name}`}
              className="p-1.5 text-slate-500 hover:text-blue-600 rounded-md hover:bg-blue-50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            {/* Edit / Rename */}
            <button
              onClick={() => handleOpenEdit(node)}
              title="Edit name and details"
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            {/* Move (Change Parent) */}
            <button
              onClick={() => handleOpenMove(node)}
              title="Move to new parent category"
              className="p-1.5 text-slate-500 hover:text-purple-600 rounded-md hover:bg-purple-50 cursor-pointer"
            >
              <Move className="w-3.5 h-3.5" />
            </button>

            {/* Reorder Up */}
            <button
              onClick={() => handleReorder(node, 'up')}
              title="Move up among siblings"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>

            {/* Reorder Down */}
            <button
              onClick={() => handleReorder(node, 'down')}
              title="Move down among siblings"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 cursor-pointer"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>

            {/* Disable / Enable Toggle */}
            <button
              onClick={() => handleToggleDisable(node)}
              title={node.disabled ? 'Enable category' : 'Disable category'}
              className="p-1.5 text-slate-500 hover:text-amber-600 rounded-md hover:bg-amber-50 cursor-pointer"
            >
              {node.disabled ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            </button>

            {/* Safe Delete */}
            <button
              onClick={() => handleOpenDelete(node)}
              title="Delete category (safe content check enforced)"
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Children Rendered Recursively */}
        {hasChildren && isExpanded && (
          <div className="mt-1.5 space-y-1.5">
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
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

      {/* Header and Action Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
            Curriculum Category Hierarchy
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Arbitrary depth parent-child taxonomy (Class → Subject → Domain → Topic) · Content safety guard
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenCreate(null)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Root Category</span>
          </button>
        </div>
      </div>

      {/* Controls, Search and Segmented Switch */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by name, topic, or breadcrumb path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* View Toggles & Expand Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {viewMode === 'tree' && (
              <>
                <button
                  onClick={expandAll}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium cursor-pointer"
                >
                  Expand All
                </button>
                <button
                  onClick={collapseAll}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium cursor-pointer"
                >
                  Collapse All
                </button>
              </>
            )}

            {/* Segmented View Mode Toggle */}
            <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('tree')}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  viewMode === 'tree' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>Tree View</span>
              </button>
              <button
                onClick={() => setViewMode('flat')}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  viewMode === 'flat' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Flat List ({flatData.length})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Hierarchy Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Sub-Header Status */}
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-medium text-slate-600">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>
              <strong>{flatData.length}</strong> Total Categories Configured Across All Depths
            </span>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            Safety Policy: Deletion of categories with content is strictly prevented
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
            Loading category hierarchy...
          </div>
        ) : viewMode === 'tree' ? (
          /* Tree Explorer View */
          <div className="p-5 space-y-2">
            {treeData.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No categories found. Click "Create Root Category" to begin building the hierarchy.
              </div>
            ) : (
              treeData.map((rootNode) => renderTreeNode(rootNode, 0))
            )}
          </div>
        ) : (
          /* Flat Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-heading text-[10px]">
                <tr>
                  <th className="px-4 py-3">Category Name & Slug</th>
                  <th className="px-4 py-3">Hierarchy Level</th>
                  <th className="px-4 py-3 min-w-[200px]">Full Breadcrumb Path</th>
                  <th className="px-4 py-3 text-right">Content Items</th>
                  <th className="px-4 py-3 text-right">Subcategories</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredFlatData.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-heading font-bold text-slate-900">{cat.name}</div>
                      <div className="font-mono text-[10px] text-slate-400">/{cat.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Level {cat.level}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-600 font-mono text-[11px] truncate block max-w-xs" title={cat.path}>
                        {cat.path}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      <span className={(cat.contentCount ?? 0) > 0 ? 'text-blue-700 font-bold' : 'text-slate-400'}>
                        {cat.contentCount ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">
                      {cat.childrenCount ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      {cat.disabled ? (
                        <span className="text-amber-800 font-medium">Disabled</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">Active</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => handleOpenCreate(cat.id, cat.name)}
                        title="Add child category"
                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded-md hover:bg-blue-50 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        title="Edit category"
                        className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenMove(cat)}
                        title="Move category"
                        className="p-1.5 text-slate-500 hover:text-purple-600 rounded-md hover:bg-purple-50 cursor-pointer"
                      >
                        <Move className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(cat)}
                        title="Delete category"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. CREATE CATEGORY MODAL                                      */}
      {/* ------------------------------------------------------------- */}
      {createModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-heading font-extrabold text-slate-900">
                  {createModal.parentId ? `Add Subcategory under "${createModal.parentName}"` : 'Create Root Category'}
                </h3>
                <p className="text-xs text-slate-500">
                  {createModal.parentId ? `Creates Level ${(flatData.find(c => c.id === createModal.parentId)?.level ?? 0) + 1} node` : 'Creates Level 0 root node (e.g. Class 8)'}
                </p>
              </div>
              <button
                onClick={() => setCreateModal({ isOpen: false, parentId: null })}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Category Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Linear Equations"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Pedagogical focus, NCERT chapters, key concepts..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Sort Order</label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formDisabled}
                      onChange={(e) => setFormDisabled(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-slate-700">Disable initially</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setCreateModal({ isOpen: false, parentId: null })}
                className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCreate}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium cursor-pointer"
              >
                Create Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. EDIT / RENAME CATEGORY MODAL                               */}
      {/* ------------------------------------------------------------- */}
      {editModal.category && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-heading font-extrabold text-slate-900">
                  Edit Category: {editModal.category.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Update name, description, order, or state.
                </p>
              </div>
              <button
                onClick={() => setEditModal({ category: null })}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Category Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Sort Order</label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formDisabled}
                      onChange={(e) => setFormDisabled(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-slate-700">Disabled</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditModal({ category: null })}
                className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. MOVE CATEGORY MODAL (Change Parent with Cyclic Check)      */}
      {/* ------------------------------------------------------------- */}
      {moveModal.category && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-heading font-extrabold text-slate-900">
                  Move Category: {moveModal.category.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Select a new parent category to re-root this entire branch.
                </p>
              </div>
              <button
                onClick={() => setMoveModal({ category: null, targetParentId: null })}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 space-y-1">
                <div>Current Parent: <strong>{flatData.find(c => c.id === moveModal.category?.parentId)?.name || 'None (Root)'}</strong></div>
                <div>Current Path: <span className="font-mono text-[11px]">{moveModal.category.path}</span></div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">New Parent Category *</label>
                <select
                  value={moveModal.targetParentId || ''}
                  onChange={(e) => setMoveModal({ ...moveModal, targetParentId: e.target.value || null })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">None (Convert to Root Level Node)</option>
                  {flatData.map((candidate) => {
                    // Cyclic validation in UI: cannot move to self or descendants
                    const isSelf = candidate.id === moveModal.category?.id;
                    const isDescendant = candidate.ancestorIds?.includes(moveModal.category!.id);
                    const disabled = isSelf || isDescendant;

                    return (
                      <option key={candidate.id} value={candidate.id} disabled={disabled}>
                        {disabled
                          ? `🚫 ${candidate.path} (Invalid: Cyclic/Self)`
                          : `${candidate.path}`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="text-[11px] text-slate-500 bg-blue-50 border border-blue-200 p-2.5 rounded-lg flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Moving this node automatically relocates all of its child subcategories and preserves existing curriculum resource mappings.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setMoveModal({ category: null, targetParentId: null })}
                className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMove}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium cursor-pointer"
              >
                Confirm Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. SAFE DELETION & CONTENT REASSIGNMENT MODAL                  */}
      {/* ------------------------------------------------------------- */}
      {deleteModal.category && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  deleteModal.checkResult && !deleteModal.checkResult.canDelete
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-rose-100 text-rose-600'
                }`}
              >
                {deleteModal.checkResult && !deleteModal.checkResult.canDelete ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-heading font-extrabold text-slate-900">
                  Delete Category: {deleteModal.category.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Enforces: "Prevent deleting categories still containing content unless reassigned"
                </p>
              </div>
            </div>

            {/* Condition A: Content is present -> Deletion is BLOCKED without Reassignment */}
            {deleteModal.checkResult && !deleteModal.checkResult.canDelete ? (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <Lock className="w-4 h-4 text-amber-700" />
                    <span>Deletion Blocked by Safe Deletion Policy</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    This category is currently associated with{' '}
                    <strong>{deleteModal.checkResult.contentCount} active curriculum resource(s)</strong>.
                    To prevent broken student links or orphaned study material, you must reassign all content to another category.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">
                    Reassign All Content to Target Category *
                  </label>
                  <select
                    value={deleteModal.targetReassignId}
                    onChange={(e) => setDeleteModal({ ...deleteModal, targetReassignId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="" disabled>
                      Select Target Category...
                    </option>
                    {flatData
                      .filter(
                        (c) =>
                          c.id !== deleteModal.category?.id &&
                          !c.ancestorIds?.includes(deleteModal.category!.id)
                      )
                      .map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.path} ({candidate.contentCount} items)
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Reason for Reassignment & Deletion *</label>
                  <input
                    type="text"
                    value={deleteModal.reason}
                    onChange={(e) => setDeleteModal({ ...deleteModal, reason: e.target.value })}
                    placeholder="e.g. Consolidating into higher-level algebra unit"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>
            ) : (
              /* Condition B: 0 content items -> Safe to delete directly */
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Safe Deletion Verified</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    This category contains <strong>0 active content items</strong>. Deleting this category will not orphan any student resources.
                  </p>
                </div>

                {deleteModal.category.childrenCount && deleteModal.category.childrenCount > 0 ? (
                  <p className="text-[11px] text-slate-500">
                    Note: Any empty child categories will be cleanly reparented to{' '}
                    <strong>
                      {flatData.find((c) => c.id === deleteModal.category?.parentId)?.name || 'Root Level'}
                    </strong>.
                  </p>
                ) : null}

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Reason for Deletion</label>
                  <input
                    type="text"
                    value={deleteModal.reason}
                    onChange={(e) => setDeleteModal({ ...deleteModal, reason: e.target.value })}
                    placeholder="e.g. Unused category placeholder"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteModal({ category: null, checkResult: null, targetReassignId: '', reason: '' })}
                className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className={`px-4 py-2 rounded-lg text-white text-xs font-medium cursor-pointer ${
                  deleteModal.checkResult && !deleteModal.checkResult.canDelete
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {deleteModal.checkResult && !deleteModal.checkResult.canDelete
                  ? 'Reassign Content & Delete'
                  : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
