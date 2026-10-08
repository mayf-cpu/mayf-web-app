/**
 * Authoritative Server-Side Hierarchical Category Manager.
 * 
 * Supports:
 * - Arbitrary parent-child nested structure (n-levels deep):
 *   e.g. Class 8 -> Mathematics -> Algebra -> Linear Equations
 * - Cyclic dependency prevention when moving categories
 * - Full CRUD & Lifecycle:
 *   create, rename, move, reorder, disable, safe-delete
 * - Safe Deletion Guard:
 *   PREVENTS deleting categories still containing content unless content is reassigned!
 */

import { auditLogService } from '../audit/auditLogger';
import { contentCmsManager } from '../cms/contentManager';

export interface HierarchicalCategory {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  disabled: boolean;
  applicableGrades?: string[];
  createdAt: string;
  updatedAt: string;
  // Computed fields
  level?: number;
  path?: string;
  ancestorIds?: string[];
  childrenCount?: number;
  contentCount?: number;
  children?: HierarchicalCategory[];
}

export interface CreateCategoryPayload {
  name: string;
  parentId?: string | null;
  description?: string;
  sortOrder?: number;
  disabled?: boolean;
  applicableGrades?: string[];
}

export interface UpdateCategoryPayload {
  name?: string;
  parentId?: string | null;
  description?: string;
  sortOrder?: number;
  disabled?: boolean;
  applicableGrades?: string[];
}

export interface CanDeleteResult {
  canDelete: boolean;
  contentCount: number;
  descendantCount: number;
  reason?: string;
}

class CategoryManager {
  private categoriesMap: Map<string, HierarchicalCategory> = new Map();
  private initialized = false;

  constructor() {
    this.initializeStore();
  }

  private initializeStore(): void {
    if (this.initialized) return;

    const now = '2026-04-01T00:00:00Z';

    // Seed realistic hierarchical curriculum tree supporting the exact user example:
    // Class 8 -> Mathematics -> Algebra -> Linear Equations
    const initialCategories: Omit<HierarchicalCategory, 'level' | 'path' | 'ancestorIds' | 'childrenCount' | 'contentCount' | 'children'>[] = [
      // ROOT: Class 8
      {
        id: 'cat-class-8',
        parentId: null,
        name: 'Class 8',
        slug: 'class-8',
        description: 'Middle school grade 8 foundations and NCERT syllabus',
        sortOrder: 1,
        disabled: false,
        applicableGrades: ['Class 8'],
        createdAt: now,
        updatedAt: now,
      },
      // Child of Class 8: Mathematics
      {
        id: 'cat-c8-maths',
        parentId: 'cat-class-8',
        name: 'Mathematics',
        slug: 'class-8-mathematics',
        description: 'Class 8 CBSE/ICSE Mathematics curriculum',
        sortOrder: 1,
        disabled: false,
        applicableGrades: ['Class 8'],
        createdAt: now,
        updatedAt: now,
      },
      // Child of Mathematics: Algebra
      {
        id: 'cat-c8-algebra',
        parentId: 'cat-c8-maths',
        name: 'Algebra',
        slug: 'class-8-algebra',
        description: 'Variables, expressions, identities, and equations',
        sortOrder: 1,
        disabled: false,
        applicableGrades: ['Class 8'],
        createdAt: now,
        updatedAt: now,
      },
      // Child of Algebra: Linear Equations (User Prompt Example)
      {
        id: 'cat-c8-linear-equations',
        parentId: 'cat-c8-algebra',
        name: 'Linear Equations',
        slug: 'class-8-linear-equations-in-one-variable',
        description: 'Linear equations in one variable, transposing, word problems',
        sortOrder: 1,
        disabled: false,
        applicableGrades: ['Class 8'],
        createdAt: now,
        updatedAt: now,
      },
      // Another Child of Algebra: Algebraic Expressions & Identities
      {
        id: 'cat-c8-algebraic-expressions',
        parentId: 'cat-c8-algebra',
        name: 'Algebraic Expressions & Identities',
        slug: 'class-8-algebraic-expressions',
        description: 'Monomials, polynomials, standard identities (a+b)²',
        sortOrder: 2,
        disabled: false,
        applicableGrades: ['Class 8'],
        createdAt: now,
        updatedAt: now,
      },
      // Child of Mathematics: Geometry
      {
        id: 'cat-c8-geometry',
        parentId: 'cat-c8-maths',
        name: 'Geometry',
        slug: 'class-8-geometry',
        description: 'Polygons, quadrilaterals, practical construction',
        sortOrder: 2,
        disabled: false,
        applicableGrades: ['Class 8'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cat-c8-quadrilaterals',
        parentId: 'cat-c8-geometry',
        name: 'Understanding Quadrilaterals',
        slug: 'class-8-quadrilaterals',
        description: 'Parallelograms, rhombuses, trapeziums properties',
        sortOrder: 1,
        disabled: false,
        applicableGrades: ['Class 8'],
        createdAt: now,
        updatedAt: now,
      },

      // ROOT: Class 9
      {
        id: 'cat-class-9',
        parentId: null,
        name: 'Class 9',
        slug: 'class-9',
        description: 'Secondary stage foundation curriculum',
        sortOrder: 2,
        disabled: false,
        applicableGrades: ['Class 9'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cat-c9-maths',
        parentId: 'cat-class-9',
        name: 'Mathematics',
        slug: 'class-9-mathematics',
        description: 'Class 9 Mathematics',
        sortOrder: 1,
        disabled: false,
        applicableGrades: ['Class 9'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cat-c9-number-system',
        parentId: 'cat-c9-maths',
        name: 'Number System',
        slug: 'class-9-number-system',
        description: 'Irrational numbers, real numbers and decimal expansions',
        sortOrder: 1,
        disabled: false,
        applicableGrades: ['Class 9'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cat-c9-geometry',
        parentId: 'cat-c9-maths',
        name: 'Geometry',
        slug: 'class-9-geometry',
        description: 'Euclidean geometry, triangles, circles',
        sortOrder: 2,
        disabled: false,
        applicableGrades: ['Class 9'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cat-c9-circles',
        parentId: 'cat-c9-geometry',
        name: 'Circles',
        slug: 'class-9-circles',
        description: 'Chords, cyclic quadrilaterals, angle subtended by arcs',
        sortOrder: 1,
        disabled: false,
        applicableGrades: ['Class 9'],
        createdAt: now,
        updatedAt: now,
      },

      // ROOT: Class 10
      {
        id: 'cat-class-10',
        parentId: null,
        name: 'Class 10',
        slug: 'class-10',
        description: 'Board examination terminal grade curriculum',
        sortOrder: 3,
        disabled: false,
        applicableGrades: ['Class 10'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cat-c10-maths',
        parentId: 'cat-class-10',
        name: 'Mathematics',
        slug: 'class-10-mathematics',
        description: 'Class 10 Board curriculum',
        sortOrder: 1,
        disabled: false,
        applicableGrades: ['Class 10'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cat-c10-algebra',
        parentId: 'cat-c10-maths',
        name: 'Algebra',
        slug: 'class-10-algebra',
        description: 'Polynomials, linear equations in two variables, quadratic equations, AP',
        sortOrder: 1,
        disabled: false,
        applicableGrades: ['Class 10'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cat-c10-linear-equations',
        parentId: 'cat-c10-algebra',
        name: 'Linear Equations in Two Variables',
        slug: 'class-10-linear-equations-in-two-variables',
        description: 'Graphical, substitution, elimination, consistency checks',
        sortOrder: 1,
        disabled: false,
        applicableGrades: ['Class 10'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cat-c10-quadratic-equations',
        parentId: 'cat-c10-algebra',
        name: 'Quadratic Equations',
        slug: 'class-10-quadratic-equations',
        description: 'Sridharacharya formula, discriminant, nature of roots',
        sortOrder: 2,
        disabled: false,
        applicableGrades: ['Class 10'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cat-c10-trigonometry',
        parentId: 'cat-c10-maths',
        name: 'Trigonometry',
        slug: 'class-10-trigonometry',
        description: 'Trigonometric ratios, identities, heights and distances',
        sortOrder: 2,
        disabled: false,
        applicableGrades: ['Class 10'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cat-c10-trig-identities',
        parentId: 'cat-c10-trigonometry',
        name: 'Trigonometric Identities',
        slug: 'class-10-trigonometric-identities',
        description: 'sin²θ + cos²θ = 1, 1 + tan²θ = sec²θ',
        sortOrder: 1,
        disabled: false,
        applicableGrades: ['Class 10'],
        createdAt: now,
        updatedAt: now,
      },
    ];

    initialCategories.forEach((cat) => {
      this.categoriesMap.set(cat.id, {
        ...cat,
      });
    });

    this.initialized = true;
  }

  /**
   * Helper: Get all ancestors (ordered from root down to parent)
   */
  public getAncestors(id: string): HierarchicalCategory[] {
    const ancestors: HierarchicalCategory[] = [];
    let current = this.categoriesMap.get(id);

    while (current && current.parentId) {
      const parent = this.categoriesMap.get(current.parentId);
      if (parent) {
        ancestors.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }

    return ancestors;
  }

  /**
   * Helper: Get all descendant IDs of a category
   */
  public getDescendantIds(id: string): string[] {
    const descendants: string[] = [];
    const queue = [id];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      for (const cat of this.categoriesMap.values()) {
        if (cat.parentId === currentId) {
          descendants.push(cat.id);
          queue.push(cat.id);
        }
      }
    }

    return descendants;
  }

  /**
   * Compute breadcrumb path and level for a category
   */
  private enrichCategory(cat: HierarchicalCategory): HierarchicalCategory {
    const ancestors = this.getAncestors(cat.id);
    const path = [...ancestors.map((a) => a.name), cat.name].join(' > ');
    const level = ancestors.length;

    // Direct children count
    let childrenCount = 0;
    for (const c of this.categoriesMap.values()) {
      if (c.parentId === cat.id) childrenCount++;
    }

    // Direct content count in this category
    const contentCount =
      contentCmsManager.countItemsWithCategory(cat.name) +
      contentCmsManager.countItemsWithCategory(cat.id);

    return {
      ...cat,
      level,
      path,
      ancestorIds: ancestors.map((a) => a.id),
      childrenCount,
      contentCount,
    };
  }

  /**
   * GET ALL CATEGORIES FLAT (enriched with level, path, counts)
   */
  public getAllFlat(includeDisabled = true): HierarchicalCategory[] {
    const result: HierarchicalCategory[] = [];

    for (const cat of this.categoriesMap.values()) {
      if (!includeDisabled && cat.disabled) continue;
      result.push(this.enrichCategory(cat));
    }

    // Sort by level then sortOrder then name
    result.sort((a, b) => {
      if ((a.level ?? 0) !== (b.level ?? 0)) {
        return (a.level ?? 0) - (b.level ?? 0);
      }
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  }

  /**
   * GET HIERARCHICAL TREE (nested children)
   */
  public getTree(includeDisabled = true): HierarchicalCategory[] {
    const flat = this.getAllFlat(includeDisabled);
    const map = new Map<string, HierarchicalCategory>();

    flat.forEach((item) => {
      map.set(item.id, { ...item, children: [] });
    });

    const roots: HierarchicalCategory[] = [];

    flat.forEach((item) => {
      const node = map.get(item.id)!;
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort children at every level
    const sortNodes = (nodes: HierarchicalCategory[]) => {
      nodes.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
      nodes.forEach((n) => {
        if (n.children && n.children.length > 0) {
          sortNodes(n.children);
        }
      });
    };

    sortNodes(roots);
    return roots;
  }

  /**
   * GET SINGLE CATEGORY
   */
  public getById(id: string): HierarchicalCategory | null {
    const found = this.categoriesMap.get(id);
    if (!found) return null;
    return this.enrichCategory(found);
  }

  /**
   * CREATE CATEGORY
   */
  public create(
    payload: CreateCategoryPayload,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): HierarchicalCategory {
    const name = payload.name.trim();
    if (!name) throw new Error('Category name is required.');

    const parentId = payload.parentId || null;
    if (parentId && !this.categoriesMap.has(parentId)) {
      throw new Error(`Parent category "${parentId}" does not exist.`);
    }

    const timestamp = new Date().toISOString();
    const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const id = `cat-${slugBase}-${Date.now().toString().slice(-4)}`;

    // Determine default sortOrder among siblings
    let maxSort = 0;
    for (const c of this.categoriesMap.values()) {
      if (c.parentId === parentId && c.sortOrder > maxSort) {
        maxSort = c.sortOrder;
      }
    }

    const newCat: HierarchicalCategory = {
      id,
      parentId,
      name,
      slug: slugBase,
      description: payload.description || '',
      sortOrder: payload.sortOrder ?? maxSort + 1,
      disabled: Boolean(payload.disabled),
      applicableGrades: payload.applicableGrades || (parentId ? this.categoriesMap.get(parentId)?.applicableGrades : ['Class 10']),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.categoriesMap.set(id, newCat);

    // Audit log
    auditLogService.log({
      action: 'CONTENT_CREATED',
      category: 'content',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: id,
      targetType: 'curriculum_category',
      details: { name, parentId, action: 'CREATE_CATEGORY' },
      status: 'success',
    });

    return this.enrichCategory(newCat);
  }

  /**
   * RENAME CATEGORY
   */
  public rename(
    id: string,
    newName: string,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): HierarchicalCategory {
    const cat = this.categoriesMap.get(id);
    if (!cat) throw new Error(`Category "${id}" not found.`);

    const trimmed = newName.trim();
    if (!trimmed) throw new Error('New category name cannot be empty.');

    const oldName = cat.name;
    cat.name = trimmed;
    cat.slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    cat.updatedAt = new Date().toISOString();

    this.categoriesMap.set(id, cat);

    auditLogService.log({
      action: 'CONTENT_UPDATED',
      category: 'content',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: id,
      targetType: 'curriculum_category',
      details: { oldName, newName: trimmed, action: 'RENAME_CATEGORY' },
      status: 'success',
    });

    return this.enrichCategory(cat);
  }

  /**
   * MOVE CATEGORY (Change parent with cyclic check)
   */
  public move(
    id: string,
    newParentId: string | null,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): HierarchicalCategory {
    const cat = this.categoriesMap.get(id);
    if (!cat) throw new Error(`Category "${id}" not found.`);

    const normalizedParent = newParentId || null;

    // Check if moving to self
    if (normalizedParent === id) {
      throw new Error('Cannot move a category to be its own parent.');
    }

    // Check if target parent exists
    if (normalizedParent && !this.categoriesMap.has(normalizedParent)) {
      throw new Error(`Target parent category "${normalizedParent}" not found.`);
    }

    // CRITICAL: Prevent cyclic dependency!
    // Cannot move a category to be a child of any of its descendants
    if (normalizedParent) {
      const descendants = this.getDescendantIds(id);
      if (descendants.includes(normalizedParent)) {
        throw new Error(
          'Cyclic dependency violation: Cannot move a category into one of its own subcategories.'
        );
      }
    }

    const oldParentId = cat.parentId;
    cat.parentId = normalizedParent;
    cat.updatedAt = new Date().toISOString();

    // Adjust sortOrder to bottom of new parent
    let maxSort = 0;
    for (const c of this.categoriesMap.values()) {
      if (c.parentId === normalizedParent && c.sortOrder > maxSort) {
        maxSort = c.sortOrder;
      }
    }
    cat.sortOrder = maxSort + 1;

    this.categoriesMap.set(id, cat);

    auditLogService.log({
      action: 'CONTENT_UPDATED',
      category: 'content',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: id,
      targetType: 'curriculum_category',
      details: { name: cat.name, oldParentId, newParentId: normalizedParent, action: 'MOVE_CATEGORY' },
      status: 'success',
    });

    return this.enrichCategory(cat);
  }

  /**
   * REORDER CATEGORY AMONG SIBLINGS
   */
  public reorder(
    id: string,
    newSortOrder: number,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): HierarchicalCategory {
    const cat = this.categoriesMap.get(id);
    if (!cat) throw new Error(`Category "${id}" not found.`);

    cat.sortOrder = Number(newSortOrder);
    cat.updatedAt = new Date().toISOString();
    this.categoriesMap.set(id, cat);

    auditLogService.log({
      action: 'CONTENT_REORDERED',
      category: 'content',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: id,
      targetType: 'curriculum_category',
      details: { name: cat.name, newSortOrder, action: 'REORDER_CATEGORY' },
      status: 'success',
    });

    return this.enrichCategory(cat);
  }

  /**
   * DISABLE / ENABLE CATEGORY
   */
  public toggleDisable(
    id: string,
    disabled: boolean,
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): HierarchicalCategory {
    const cat = this.categoriesMap.get(id);
    if (!cat) throw new Error(`Category "${id}" not found.`);

    cat.disabled = disabled;
    cat.updatedAt = new Date().toISOString();
    this.categoriesMap.set(id, cat);

    auditLogService.log({
      action: 'CONTENT_UPDATED',
      category: 'content',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: id,
      targetType: 'curriculum_category',
      details: { name: cat.name, disabled, action: disabled ? 'DISABLE_CATEGORY' : 'ENABLE_CATEGORY' },
      status: 'success',
    });

    return this.enrichCategory(cat);
  }

  /**
   * CAN DELETE CHECK (Safe deletion policy)
   * Prevents deleting categories containing active content unless reassigned
   */
  public canDelete(id: string): CanDeleteResult {
    const cat = this.categoriesMap.get(id);
    if (!cat) {
      return { canDelete: false, contentCount: 0, descendantCount: 0, reason: 'Category does not exist.' };
    }

    // Direct content count
    const directContent =
      contentCmsManager.countItemsWithCategory(cat.name) +
      contentCmsManager.countItemsWithCategory(cat.id);

    // Descendants check
    const descendantIds = this.getDescendantIds(id);
    let totalContentCount = directContent;

    for (const descId of descendantIds) {
      const desc = this.categoriesMap.get(descId);
      if (desc) {
        totalContentCount +=
          contentCmsManager.countItemsWithCategory(desc.name) +
          contentCmsManager.countItemsWithCategory(desc.id);
      }
    }

    if (totalContentCount > 0) {
      return {
        canDelete: false,
        contentCount: totalContentCount,
        descendantCount: descendantIds.length,
        reason: `Cannot delete category "${cat.name}". It is associated with ${totalContentCount} content resource(s). You must reassign existing content to another category first.`,
      };
    }

    return {
      canDelete: true,
      contentCount: 0,
      descendantCount: descendantIds.length,
    };
  }

  /**
   * DELETE CATEGORY WHERE SAFE
   * If reassignToId is passed, reassigns all content first, then deletes.
   */
  public delete(
    id: string,
    options: { reassignToId?: string; reason?: string },
    actor: { uid: string; email: string; role: 'admin' | 'superAdmin' }
  ): { success: boolean; reassignedCount: number; deletedId: string; deletedName: string } {
    const cat = this.categoriesMap.get(id);
    if (!cat) throw new Error(`Category "${id}" not found.`);

    const check = this.canDelete(id);
    let reassignedCount = 0;

    // If category has content:
    if (!check.canDelete) {
      if (!options.reassignToId) {
        throw new Error(
          check.reason ||
            `Safe deletion blocked: Category contains ${check.contentCount} content item(s). Specify a target category to reassign content before deletion.`
        );
      }

      const targetCat = this.categoriesMap.get(options.reassignToId);
      if (!targetCat) {
        throw new Error(`Reassignment target category "${options.reassignToId}" does not exist.`);
      }

      if (options.reassignToId === id || this.getDescendantIds(id).includes(options.reassignToId)) {
        throw new Error('Cannot reassign content to the category being deleted or one of its subcategories.');
      }

      // Reassign content of this category
      const resDirect = contentCmsManager.reassignCategory(cat.name, targetCat.name, actor);
      reassignedCount += resDirect.reassignedCount;

      // Reassign content of all descendants
      for (const descId of this.getDescendantIds(id)) {
        const desc = this.categoriesMap.get(descId);
        if (desc) {
          const resDesc = contentCmsManager.reassignCategory(desc.name, targetCat.name, actor);
          reassignedCount += resDesc.reassignedCount;
        }
      }
    }

    // Reparent any direct children to this category's parent (or null)
    for (const c of this.categoriesMap.values()) {
      if (c.parentId === id) {
        c.parentId = cat.parentId;
        c.updatedAt = new Date().toISOString();
        this.categoriesMap.set(c.id, c);
      }
    }

    const deletedName = cat.name;
    this.categoriesMap.delete(id);

    auditLogService.log({
      action: 'CONTENT_DELETED',
      category: 'content',
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: id,
      targetType: 'curriculum_category',
      details: {
        deletedName,
        reassignedCount,
        reassignedTo: options.reassignToId,
        reason: options.reason || 'Category removed by administrator',
        safeDeletionPolicy: true,
      },
      status: 'success',
    });

    return {
      success: true,
      reassignedCount,
      deletedId: id,
      deletedName,
    };
  }
}

export const categoryManager = new CategoryManager();
