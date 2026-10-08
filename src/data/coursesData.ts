/**
 * Structured Curriculum Courses Data for Classes 5 to 10
 * Maths at Your Fingertips (mayf.co.in)
 */

import { StudentCourse } from '../lib/firebase/types';

export const STUDENT_COURSES: StudentCourse[] = [
  {
    id: 'course-class-10-board-mastery',
    title: 'Class 10 CBSE Board Exam Mathematics Mastery',
    slug: 'class-10-board-exam-mastery',
    description: 'Complete high-retention syllabus coverage: Real Numbers, Polynomials, Linear Systems, Quadratic Equations, Arithmetic Progressions, Triangles, Trigonometry, and Circles with NCERT Exemplar & previous 10-year board questions.',
    targetClass: 'Class 10',
    totalChapters: 14,
    completedChapters: 6,
    totalFormulas: 42,
    level: 'Board Exemplar',
    topics: ['Real Numbers', 'Polynomials', 'Quadratic Equations', 'Arithmetic Progressions', 'Triangles', 'Trigonometry', 'Circles'],
    bannerGradient: 'from-blue-600 to-indigo-800',
  },
  {
    id: 'course-class-10-trigonometry-fasttrack',
    title: 'Trigonometry & Heights/Distances Zero-to-Hero',
    slug: 'class-10-trigonometry-fasttrack',
    description: 'Master trigonometric ratios, standard angle values, Pythagorean trig identities, and line-of-sight elevation/depression word problems with visual geometric proofs.',
    targetClass: 'Class 10',
    totalChapters: 3,
    completedChapters: 2,
    totalFormulas: 15,
    level: 'Board Exemplar',
    topics: ['Trig Ratios', 'Pythagorean Identities', 'Heights and Distances'],
    bannerGradient: 'from-cyan-600 to-blue-700',
  },
  {
    id: 'course-class-9-foundations',
    title: 'Class 9 Comprehensive Mathematics Foundation',
    slug: 'class-9-mathematics-foundation',
    description: 'Number Systems (Irrationality, Surds), Coordinate Geometry, Linear Equations in Two Variables, Euclid Geometry, Lines & Angles, Triangles (Congruence criteria), and Herons Formula.',
    targetClass: 'Class 9',
    totalChapters: 12,
    completedChapters: 4,
    totalFormulas: 28,
    level: 'Comprehensive' as any,
    topics: ['Number Systems', 'Coordinate Geometry', 'Lines & Angles', 'Triangles', 'Herons Formula', 'Surface Areas'],
    bannerGradient: 'from-emerald-600 to-teal-800',
  },
  {
    id: 'course-class-8-algebra-geometry',
    title: 'Class 8 Linear Equations & Practical Mensuration',
    slug: 'class-8-linear-equations-mensuration',
    description: 'Rational numbers, Linear Equations in one variable, Quadrilateral properties, Algebraic expressions and identities, Factorisation, and solid mensuration.',
    targetClass: 'Class 8',
    totalChapters: 10,
    completedChapters: 3,
    totalFormulas: 20,
    level: 'Standard',
    topics: ['Rational Numbers', 'Linear Equations', 'Factorisation', 'Mensuration', 'Exponents'],
    bannerGradient: 'from-purple-600 to-indigo-700',
  },
  {
    id: 'course-class-7-integers-fractions',
    title: 'Class 7 Integers, Fractions & Algebraic Expressions',
    slug: 'class-7-integers-fractions-algebra',
    description: 'Sign operations on Integers, Fractions & Decimals, Simple Equations, Lines and Angles, Triangles and their properties, Congruence of Triangles, and Comparing Quantities (Percentages, Profit & Loss).',
    targetClass: 'Class 7',
    totalChapters: 9,
    completedChapters: 5,
    totalFormulas: 18,
    level: 'Foundation',
    topics: ['Integers', 'Fractions & Decimals', 'Simple Equations', 'Lines and Angles', 'Comparing Quantities'],
    bannerGradient: 'from-amber-600 to-orange-700',
  },
  {
    id: 'course-class-6-foundational-arithmetic',
    title: 'Class 6 Foundational Arithmetic & Geometric Shapes',
    slug: 'class-6-foundational-arithmetic',
    description: 'Knowing Our Numbers, Whole Numbers, Playing with Numbers (HCF/LCM, Prime factorisation), Basic Geometrical Ideas, Integers, Fractions, and Decimals.',
    targetClass: 'Class 6',
    totalChapters: 8,
    completedChapters: 2,
    totalFormulas: 12,
    level: 'Foundation',
    topics: ['Whole Numbers', 'HCF & LCM', 'Fractions', 'Decimals', 'Basic Geometry'],
    bannerGradient: 'from-sky-600 to-cyan-800',
  },
  {
    id: 'course-class-5-elementary-maths',
    title: 'Class 5 Elementary Number Sense & Spatial Shapes',
    slug: 'class-5-elementary-maths',
    description: 'Building strong visual intuition: Fish Tale (large numbers), Shapes and Angles, Parts and Wholes (visual fractions), Be My Multiple I will be your Factor, and Area and its Boundary.',
    targetClass: 'Class 5',
    totalChapters: 7,
    completedChapters: 1,
    totalFormulas: 9,
    level: 'Foundation',
    topics: ['Large Numbers', 'Shapes & Angles', 'Visual Fractions', 'Factors & Multiples', 'Area & Perimeter'],
    bannerGradient: 'from-rose-600 to-pink-700',
  },
];

export function getCourseBySlug(slug: string): StudentCourse | undefined {
  return STUDENT_COURSES.find((c) => c.slug === slug || c.id === slug);
}

export function getCourseById(id: string): StudentCourse | undefined {
  return STUDENT_COURSES.find((c) => c.id === id);
}
