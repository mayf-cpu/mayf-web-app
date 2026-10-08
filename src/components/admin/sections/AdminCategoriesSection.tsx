import React, { useState } from 'react';
import { Layers, Plus, Edit, Trash2, CheckCircle2, BookOpen } from 'lucide-react';
import { Button } from '../../ui/Button';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  subtopics: string[];
  applicableGrades: string[];
  itemCount: number;
}

const INITIAL_CAT_ITEMS: CategoryItem[] = [
  {
    id: 'cat-1',
    name: 'Number System',
    slug: 'number-system',
    description: 'Real numbers, Euclid lemma, fundamental theorem of arithmetic, rational expressions',
    subtopics: ['Real Numbers', 'Euclids Division', 'Rational & Irrational', 'LCM & HCF'],
    applicableGrades: ['Class 9', 'Class 10'],
    itemCount: 8,
  },
  {
    id: 'cat-2',
    name: 'Algebra',
    slug: 'algebra',
    description: 'Polynomials, linear equations in two variables, quadratic equations, AP series',
    subtopics: ['Polynomials', 'Linear Equations', 'Quadratic Equations', 'Arithmetic Progressions'],
    applicableGrades: ['Class 8', 'Class 9', 'Class 10'],
    itemCount: 16,
  },
  {
    id: 'cat-3',
    name: 'Geometry',
    slug: 'geometry',
    description: 'Triangles, similarity criteria, circles, tangents, quadrilaterals, BPT theorem',
    subtopics: ['BPT Theorem', 'Pythagoras Theorem', 'Circle Tangents', 'Congruence & Similarity'],
    applicableGrades: ['Class 7', 'Class 8', 'Class 9', 'Class 10'],
    itemCount: 14,
  },
  {
    id: 'cat-4',
    name: 'Coordinate Geometry',
    slug: 'coordinate-geometry',
    description: 'Cartesian system, distance formula, section formula, collinearity test',
    subtopics: ['Distance Formula', 'Section Formula', 'Midpoint Formula', 'Area of Triangle'],
    applicableGrades: ['Class 9', 'Class 10'],
    itemCount: 6,
  },
  {
    id: 'cat-5',
    name: 'Trigonometry',
    slug: 'trigonometry',
    description: 'Trigonometric ratios, standard angles (0°–90°), fundamental identities, heights & distances',
    subtopics: ['Trig Ratios', 'Angle Values', 'Pythagorean Identities', 'Angle of Elevation'],
    applicableGrades: ['Class 10'],
    itemCount: 12,
  },
  {
    id: 'cat-6',
    name: 'Mensuration',
    slug: 'mensuration',
    description: 'Surface areas and volumes of cylinder, cone, sphere, hemisphere, conversion of solids',
    subtopics: ['Cylinder & Cone', 'Sphere & Hemisphere', 'Combination of Solids', 'Frustum'],
    applicableGrades: ['Class 8', 'Class 9', 'Class 10'],
    itemCount: 10,
  },
  {
    id: 'cat-7',
    name: 'Statistics & Probability',
    slug: 'statistics-probability',
    description: 'Mean, median, mode of grouped data, empirical probability, coin & dice experiments',
    subtopics: ['Mean (Direct & Step Deviation)', 'Median & Mode', 'Ogive Curves', 'Classical Probability'],
    applicableGrades: ['Class 9', 'Class 10'],
    itemCount: 7,
  },
];

export const AdminCategoriesSection: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CAT_ITEMS);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
            Curriculum Subject Categories
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize formulas and chapter materials across CBSE and ICSE mathematics streams.
          </p>
        </div>

        <Button size="sm" variant="primary" className="gap-1.5 shadow-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>Add Subject Category</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-lg bg-blue-50 text-blue-700">
                  <Layers className="w-4 h-4" />
                </span>
                <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {cat.itemCount} items
                </span>
              </div>

              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">{cat.name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                  {cat.description}
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-heading font-semibold uppercase tracking-wider text-slate-400">
                  Subtopics Included:
                </span>
                <div className="flex flex-wrap gap-1">
                  {cat.subtopics.map((sub) => (
                    <span
                      key={sub}
                      className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 text-[11px] text-blue-700 font-semibold">
                Grades: {cat.applicableGrades.join(', ')}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100 cursor-pointer"
                title="Edit category"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
