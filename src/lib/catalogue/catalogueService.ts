/**
 * Educational Content Catalogue Service for Maths at Your Fingertips.
 * 
 * CORE ARCHITECTURAL DIRECTIVES:
 * 1. Free study material is accessible 100% WITHOUT authentication.
 * 2. Efficient database cursor queries (never loads entire catalogue into browser memory).
 * 3. Maximum page size hard-capped at 20 documents.
 * 4. Uses Firestore cursors (startAfter) for next-page pagination.
 * 5. Full support for sorting: latest, popular, most viewed, A-Z.
 * 6. Multi-format content viewers: PDF, multi-image, single image, HTML5 video, YouTube, Facebook, Test Papers, Courses.
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../firebase/client';
import { ContentItem, StudentClass, ContentAccessType, ContentType } from '../firebase/types';
import { ParsedUserEntitlements } from '../firebase/authClaims';
import { INITIAL_CHAPTERS, INITIAL_FORMULAS } from '../../data/curriculumData';

export type CatalogueSortOption = 'latest' | 'popular' | 'most_viewed' | 'alpha';
export type DifficultyLevel = 'Foundation' | 'Standard' | 'Exemplar / Board';

export interface CatalogueFilters {
  classLevel?: StudentClass | 'All';
  categoryId?: string | 'All';
  subcategoryId?: string | 'All';
  accessType?: ContentAccessType | 'All';
  contentType?: ContentType | 'All';
  difficulty?: DifficultyLevel | 'All';
  featuredOnly?: boolean;
  sortBy?: CatalogueSortOption;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: QueryDocumentSnapshot | null;
  hasMore: boolean;
  totalLoaded: number;
}

export const MAX_PAGE_SIZE = 20;

/**
 * Rich, production-quality Seed Content covering all supported formats
 */
export const SEED_CONTENT_ITEMS: (ContentItem & { difficulty?: DifficultyLevel })[] = [
  // 1. Course: Real Numbers
  {
    id: 'cnt-course-real-numbers',
    title: 'Real Numbers & Fundamental Theorem of Arithmetic',
    slug: 'real-numbers-and-fundamental-theorem-of-arithmetic',
    shortDescription: 'Master Euclid division lemma, Fundamental Theorem of Arithmetic, irrationality proofs of √2 and √3.',
    description: 'Detailed modular course on Class 10 Real Numbers. Covers prime factorisation uniqueness, HCF-LCM relationships, and proof by contradiction for board exams.',
    classLevels: ['Class 10'],
    categoryId: 'Number System',
    subcategoryId: 'Real Numbers',
    topic: 'Arithmetic',
    contentType: 'course',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    accessType: 'free',
    price: 0,
    currency: 'INR',
    annualPassIncluded: true,
    downloadAllowed: true,
    visible: true,
    featured: true,
    trending: true,
    tags: ['Class 10', 'Number System', 'CBSE', 'Fundamental Theorem'],
    searchTerms: ['real numbers', 'euclid', 'arithmetic', 'class 10', 'prime factorisation'],
    seoTitle: 'Class 10 Real Numbers & Fundamental Theorem | MAYF',
    seoDescription: 'Master Class 10 Real Numbers with free proofs, theorems, and step-by-step exemplars.',
    sortOrder: 1,
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    publishedAt: '2026-04-01T10:00:00.000Z',
    viewCount: 4210,
    downloadCount: 980,
    difficulty: 'Standard',
  },

  // 2. PDF Document: Complete Class 10 Board Formula Cheatsheet
  {
    id: 'cnt-pdf-formula-handbook',
    title: 'Class 10 Board Examination Complete Formula Handbook (PDF)',
    slug: 'class-10-board-examination-complete-formula-handbook-pdf',
    shortDescription: 'Printable 14-page revision document with all formulas across Algebra, Geometry, Trig, and Mensuration.',
    description: 'Every single identity, theorem statement, and formula for Class 10 CBSE & ICSE mathematics compiled in high-density printable format.',
    classLevels: ['Class 10'],
    categoryId: 'Algebra',
    subcategoryId: 'Comprehensive Revision',
    topic: 'Formula Handbook',
    contentType: 'pdf',
    files: [
      {
        name: 'MAYF_Class10_Formula_Handbook.pdf',
        url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
        sizeBytes: 2450000,
        mimeType: 'application/pdf',
      },
    ],
    thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
    accessType: 'free',
    price: 0,
    currency: 'INR',
    annualPassIncluded: true,
    downloadAllowed: true,
    visible: true,
    featured: true,
    trending: true,
    tags: ['Formula Sheet', 'PDF', 'Class 10', 'Handout'],
    searchTerms: ['formula sheet', 'pdf', 'class 10 formulas', 'printable', 'handbook'],
    seoTitle: 'Class 10 Math Formula Handbook PDF Free Download | MAYF',
    seoDescription: 'Download the authoritative Class 10 Mathematics Formula Handbook PDF covering all 15 chapters.',
    sortOrder: 2,
    createdAt: '2026-04-02T00:00:00.000Z',
    updatedAt: '2026-04-02T00:00:00.000Z',
    publishedAt: '2026-04-02T12:00:00.000Z',
    viewCount: 8940,
    downloadCount: 3410,
    difficulty: 'Standard',
  },

  // 3. YouTube Embed Video: Sridharacharya Quadratic Formula Derivation
  {
    id: 'cnt-yt-quadratic-derivation',
    title: 'Visual Proof: Sridharacharya Quadratic Formula by Completing the Square',
    slug: 'visual-proof-sridharacharya-quadratic-formula',
    shortDescription: 'Step-by-step visual derivation of x = (-b ± √(b² - 4ac)) / (2a) in 8 minutes.',
    description: 'Never memorize the quadratic formula blindly again. Follow the geometric and algebraic steps of completing the square from ax² + bx + c = 0.',
    classLevels: ['Class 10'],
    categoryId: 'Algebra',
    subcategoryId: 'Quadratic Equations',
    topic: 'Quadratic Formula',
    contentType: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/ZBalWWHY9kE',
    source: 'YouTube',
    thumbnail: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&auto=format&fit=crop&q=80',
    accessType: 'free',
    price: 0,
    currency: 'INR',
    annualPassIncluded: true,
    downloadAllowed: false,
    visible: true,
    featured: true,
    trending: true,
    tags: ['Quadratic Formula', 'YouTube', 'Visual Proof', 'Algebra'],
    searchTerms: ['quadratic formula', 'derivation', 'video', 'completing the square'],
    seoTitle: 'Quadratic Formula Derivation Video Tutorial | MAYF',
    seoDescription: 'Watch the step-by-step proof of the Quadratic Formula by completing the square.',
    sortOrder: 3,
    createdAt: '2026-04-03T00:00:00.000Z',
    updatedAt: '2026-04-03T00:00:00.000Z',
    publishedAt: '2026-04-03T08:00:00.000Z',
    viewCount: 6120,
    downloadCount: 0,
    difficulty: 'Foundation',
  },

  // 4. Test Paper: Class 10 Mathematics Standard Mock Board Paper
  {
    id: 'cnt-test-class10-mock-1',
    title: 'CBSE Class 10 Standard Mathematics 80-Mark Mock Board Exam Paper',
    slug: 'cbse-class-10-standard-maths-mock-board-paper',
    shortDescription: 'Full syllabus 3-hour sample examination with Section A to Section E marking scheme.',
    description: 'Practice the latest CBSE board pattern: 20 MCQs, 5 Very Short Answers, 6 Short Answers, 4 Long Answers, and 3 Case-Based Integrated units.',
    classLevels: ['Class 10'],
    categoryId: 'Algebra',
    subcategoryId: 'Mock Papers',
    topic: 'Board Exam Preparation',
    contentType: 'testPaper',
    files: [
      {
        name: 'Class10_Maths_Sample_Paper_2026.pdf',
        url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
        sizeBytes: 1800000,
        mimeType: 'application/pdf',
      },
    ],
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
    accessType: 'paid',
    price: 199,
    currency: 'INR',
    annualPassIncluded: true,
    downloadAllowed: true,
    visible: true,
    featured: false,
    trending: true,
    tags: ['Mock Paper', 'Class 10', 'CBSE Board', 'Exam Prep'],
    searchTerms: ['mock paper', 'sample paper', 'class 10 exam', '80 marks'],
    seoTitle: 'Class 10 Maths Standard Mock Board Paper with Solutions | MAYF',
    seoDescription: 'Full-length 80-mark mock board exam paper for CBSE Class 10 with step-by-step marking schemes.',
    sortOrder: 4,
    createdAt: '2026-04-04T00:00:00.000Z',
    updatedAt: '2026-04-04T00:00:00.000Z',
    publishedAt: '2026-04-04T15:00:00.000Z',
    viewCount: 3180,
    downloadCount: 1420,
    difficulty: 'Exemplar / Board',
  },

  // 5. Multi-Image Guide: Step-by-Step Proof of Basic Proportionality Theorem (BPT)
  {
    id: 'cnt-multi-image-bpt',
    title: 'Visual Step Guide: Basic Proportionality Theorem (Thales Theorem)',
    slug: 'visual-step-guide-basic-proportionality-theorem-thales',
    shortDescription: 'Multi-slide visual proof breaking down auxiliary constructions, triangle area ratios, and equality.',
    description: 'Learn the most tested theorem in Class 10 Board Geometry across 4 clear visual panels showing altitude constructions and parallel base areas.',
    classLevels: ['Class 10', 'Class 9'],
    categoryId: 'Geometry',
    subcategoryId: 'Triangles',
    topic: 'Similarity',
    contentType: 'multiImage',
    files: [
      {
        name: 'BPT_Step1_Given_Construction.png',
        url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1000&auto=format&fit=crop&q=80',
        sizeBytes: 420000,
        mimeType: 'image/png',
      },
      {
        name: 'BPT_Step2_Area_Ratio_ADE_BDE.png',
        url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1000&auto=format&fit=crop&q=80',
        sizeBytes: 440000,
        mimeType: 'image/png',
      },
      {
        name: 'BPT_Step3_Area_Ratio_ADE_CDE.png',
        url: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=1000&auto=format&fit=crop&q=80',
        sizeBytes: 410000,
        mimeType: 'image/png',
      },
      {
        name: 'BPT_Step4_Final_Equivalence.png',
        url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1000&auto=format&fit=crop&q=80',
        sizeBytes: 450000,
        mimeType: 'image/png',
      },
    ],
    thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
    accessType: 'free',
    price: 0,
    currency: 'INR',
    annualPassIncluded: true,
    downloadAllowed: true,
    visible: true,
    featured: true,
    trending: false,
    tags: ['Geometry', 'BPT', 'Thales Theorem', 'Multi-Image'],
    searchTerms: ['bpt', 'basic proportionality', 'thales theorem', 'triangles'],
    seoTitle: 'Basic Proportionality Theorem Visual Step-by-Step Proof | MAYF',
    seoDescription: 'High-clarity step-by-step visual slide breakdown of the Basic Proportionality Theorem.',
    sortOrder: 5,
    createdAt: '2026-04-05T00:00:00.000Z',
    updatedAt: '2026-04-05T00:00:00.000Z',
    publishedAt: '2026-04-05T09:00:00.000Z',
    viewCount: 5290,
    downloadCount: 1870,
    difficulty: 'Standard',
  },

  // 6. Single Image: Trigonometric Specific Angle Values Chart (0° to 90°)
  {
    id: 'cnt-single-image-trig-chart',
    title: 'High-Res Study Chart: Trigonometric Ratios of Specific Angles Table',
    slug: 'trigonometric-ratios-of-specific-angles-table-chart',
    shortDescription: 'Pristine printable infographic for sin, cos, tan, cosec, sec, and cot at 0°, 30°, 45°, 60°, 90°.',
    description: 'Memorize standard angle trigonometric values with finger trick mnemonics and exact fraction notation (1/√2, √3/2).',
    classLevels: ['Class 10'],
    categoryId: 'Trigonometry',
    subcategoryId: 'Trigonometric Ratios',
    topic: 'Standard Angles',
    contentType: 'singleImage',
    files: [
      {
        name: 'Trig_Values_Table_HighRes.png',
        url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&auto=format&fit=crop&q=80',
        sizeBytes: 880000,
        mimeType: 'image/png',
      },
    ],
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    accessType: 'free',
    price: 0,
    currency: 'INR',
    annualPassIncluded: true,
    downloadAllowed: true,
    visible: true,
    featured: false,
    trending: false,
    tags: ['Trigonometry', 'Chart', 'Table', 'Angles'],
    searchTerms: ['trig table', 'sin 30', 'cos 60', 'tan 45', 'angles chart'],
    seoTitle: 'Trigonometry Table Chart 0 to 90 Degrees | MAYF',
    seoDescription: 'Download the authoritative trigonometry angle values chart with exact surd values.',
    sortOrder: 6,
    createdAt: '2026-04-06T00:00:00.000Z',
    updatedAt: '2026-04-06T00:00:00.000Z',
    publishedAt: '2026-04-06T11:00:00.000Z',
    viewCount: 7630,
    downloadCount: 2950,
    difficulty: 'Foundation',
  },

  // 7. Video: HTML5 Responsive Surface Areas and Volumes
  {
    id: 'cnt-video-cylinder-cone',
    title: '3D Solid Transformations: Melting Spheres into Cylinders',
    slug: '3d-solid-transformations-melting-spheres-cylinders',
    shortDescription: 'Conservation of volume animated walkthrough with liquid flow rates in cylindrical pipes.',
    description: 'Watch how 3D solid geometry conservation laws operate when metal spheres are recast into hollow cylinders.',
    classLevels: ['Class 10', 'Class 9'],
    categoryId: 'Mensuration',
    subcategoryId: 'Surface Areas and Volumes',
    topic: 'Conversion of Solids',
    contentType: 'video',
    embedUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
    accessType: 'paid',
    price: 149,
    currency: 'INR',
    annualPassIncluded: true,
    downloadAllowed: false,
    visible: true,
    featured: false,
    trending: true,
    tags: ['Mensuration', 'Volume Conservation', 'Cylinder', 'Video'],
    searchTerms: ['cylinder', 'volume', 'sphere', 'cone', 'mensuration video'],
    seoTitle: 'Conversion of Solids 3D Geometry Video Lesson | MAYF',
    seoDescription: 'Master Class 10 Surface Areas & Volumes with interactive 3D solid transformation examples.',
    sortOrder: 7,
    createdAt: '2026-04-07T00:00:00.000Z',
    updatedAt: '2026-04-07T00:00:00.000Z',
    publishedAt: '2026-04-07T14:00:00.000Z',
    viewCount: 2840,
    downloadCount: 0,
    difficulty: 'Exemplar / Board',
  },

  // 8. Facebook / Reel Embed: 60-Second Pythagoras Triplets Mental Math Hack
  {
    id: 'cnt-fb-pythagoras-reel',
    title: '60-Second Board Hack: Instant Pythagoras Triplet Generation',
    slug: '60-second-pythagoras-triplet-hack',
    shortDescription: 'Generate any primitive right triangle side lengths in your head without computing squares.',
    description: 'Quick micro-lesson demonstrating the formula 2m, m² - 1, m² + 1 to find right triangle side dimensions in seconds.',
    classLevels: ['Class 8', 'Class 9', 'Class 10'],
    categoryId: 'Geometry',
    subcategoryId: 'Triangles',
    topic: 'Pythagoras Triplets',
    contentType: 'facebook',
    embedUrl: 'https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fwww.facebook.com%2Ffacebook%2Fvideos%2F10153231379946729%2F&show_text=false&width=476',
    thumbnail: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&auto=format&fit=crop&q=80',
    accessType: 'free',
    price: 0,
    currency: 'INR',
    annualPassIncluded: true,
    downloadAllowed: false,
    visible: true,
    featured: false,
    trending: true,
    tags: ['Reel', 'Speed Math', 'Pythagoras', 'Facebook'],
    searchTerms: ['pythagoras triplets', 'speed math', 'triangles hack', 'reel'],
    seoTitle: 'Pythagoras Triplets Speed Math Reel | MAYF',
    seoDescription: 'Quick 60-second formula technique to generate right-triangle side lengths instantly.',
    sortOrder: 8,
    createdAt: '2026-04-08T00:00:00.000Z',
    updatedAt: '2026-04-08T00:00:00.000Z',
    publishedAt: '2026-04-08T16:00:00.000Z',
    viewCount: 11450,
    downloadCount: 0,
    difficulty: 'Foundation',
  },

  // 9. Worksheet: Class 8 Linear Equations Word Problems with Step Answers
  {
    id: 'cnt-worksheet-class8-linear',
    title: 'Class 8 Linear Equations in One Variable Practice Worksheet',
    slug: 'class-8-linear-equations-in-one-variable-worksheet',
    shortDescription: '15 real-life scenario questions on age differences, coins, and perimeter with full solutions.',
    description: 'Carefully graded practice problems starting from basic transposing balance axioms up to multi-variable age equations.',
    classLevels: ['Class 8'],
    categoryId: 'Algebra',
    subcategoryId: 'Linear Equations',
    topic: 'Word Problems',
    contentType: 'worksheet',
    files: [
      {
        name: 'Class8_Linear_Equations_Worksheet.pdf',
        url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
        sizeBytes: 1100000,
        mimeType: 'application/pdf',
      },
    ],
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
    accessType: 'free',
    price: 0,
    currency: 'INR',
    annualPassIncluded: true,
    downloadAllowed: true,
    visible: true,
    featured: false,
    trending: false,
    tags: ['Class 8', 'Worksheet', 'Linear Equations', 'Word Problems'],
    searchTerms: ['class 8 worksheet', 'linear equations', 'algebra practice', 'age problems'],
    seoTitle: 'Class 8 Linear Equations Worksheet with Solutions | MAYF',
    seoDescription: 'Free printable Class 8 Linear Equations practice worksheet with complete step answers.',
    sortOrder: 9,
    createdAt: '2026-04-09T00:00:00.000Z',
    updatedAt: '2026-04-09T00:00:00.000Z',
    publishedAt: '2026-04-09T10:00:00.000Z',
    viewCount: 3820,
    downloadCount: 1650,
    difficulty: 'Foundation',
  },

  // 10. Formula Sheet: Coordinate Geometry Section & Distance Formulas
  {
    id: 'cnt-formula-coordinate-geom',
    title: 'Coordinate Geometry Formula Sheet: Distance, Section & Area Formulas',
    slug: 'coordinate-geometry-formula-sheet-distance-section-area',
    shortDescription: 'Cartesian plane formulas with internal division ratio (m:n) and collinearity test conditions.',
    description: 'Master distance calculations, midpoint coordinates, centroid of triangle, and section formula derivations on coordinate axes.',
    classLevels: ['Class 10', 'Class 9'],
    categoryId: 'Coordinate Geometry',
    subcategoryId: 'Cartesian Plane',
    topic: 'Section Formula',
    contentType: 'formulaSheet',
    thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
    accessType: 'paid',
    price: 99,
    currency: 'INR',
    annualPassIncluded: true,
    downloadAllowed: true,
    visible: true,
    featured: false,
    trending: false,
    tags: ['Coordinate Geometry', 'Section Formula', 'Distance Formula', 'Class 10'],
    searchTerms: ['distance formula', 'section formula', 'coordinate geometry', 'midpoint'],
    seoTitle: 'Coordinate Geometry Formula Sheet Class 10 | MAYF',
    seoDescription: 'Complete reference card for Coordinate Geometry section and distance formulas.',
    sortOrder: 10,
    createdAt: '2026-04-10T00:00:00.000Z',
    updatedAt: '2026-04-10T00:00:00.000Z',
    publishedAt: '2026-04-10T12:00:00.000Z',
    viewCount: 4120,
    downloadCount: 1510,
    difficulty: 'Standard',
  },

  // 11. Class 5: Worksheet on Shapes & Angles
  {
    id: 'cnt-worksheet-class5-shapes-angles',
    title: 'Class 5 Shapes and Angles: Acute, Obtuse & Right Angles Explorer',
    slug: 'class-5-shapes-and-angles-explorer-worksheet',
    shortDescription: 'Visual angle tester sheet with clocks, yoga poses, and polygon corners.',
    description: 'Help young learners identify right angles, less than right angles, and more than right angles with everyday objects.',
    classLevels: ['Class 5'],
    categoryId: 'Geometry',
    subcategoryId: 'Triangles',
    topic: 'Shapes and Angles',
    contentType: 'worksheet',
    files: [
      {
        name: 'Class5_Shapes_and_Angles.pdf',
        url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
        sizeBytes: 850000,
        mimeType: 'application/pdf',
      },
    ],
    thumbnail: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&auto=format&fit=crop&q=80',
    accessType: 'free',
    price: 0,
    currency: 'INR',
    annualPassIncluded: true,
    downloadAllowed: true,
    visible: true,
    featured: false,
    trending: true,
    tags: ['Class 5', 'Worksheet', 'Angles', 'Geometry'],
    searchTerms: ['class 5 angles', 'right angle', 'acute angle', 'obtuse angle', 'shapes'],
    seoTitle: 'Class 5 Shapes and Angles Worksheet | MAYF',
    seoDescription: 'Free printable Class 5 shapes and angles worksheet with colorful illustrations.',
    sortOrder: 11,
    createdAt: '2026-04-11T00:00:00.000Z',
    updatedAt: '2026-04-11T00:00:00.000Z',
    publishedAt: '2026-04-11T09:00:00.000Z',
    viewCount: 5210,
    downloadCount: 2100,
    difficulty: 'Foundation',
  },

  // 12. Class 5: Modular Course on Area and Perimeter Grids
  {
    id: 'cnt-course-class5-area-boundary',
    title: 'Class 5 How Big? How Heavy? Area and Perimeter Masterclass',
    slug: 'class-5-area-and-perimeter-grids-masterclass',
    shortDescription: 'Interactive grid square counting, square stamps, and perimeter string loops.',
    description: 'Foundational course introducing 1-centimeter grid units, rectangular borders, and comparing irregular leaf areas.',
    classLevels: ['Class 5'],
    categoryId: 'Mensuration',
    subcategoryId: 'Surface Areas and Volumes',
    topic: 'Area and Perimeter',
    contentType: 'course',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    accessType: 'free',
    price: 0,
    currency: 'INR',
    annualPassIncluded: true,
    downloadAllowed: true,
    visible: true,
    featured: true,
    trending: false,
    tags: ['Class 5', 'Area', 'Perimeter', 'Course'],
    searchTerms: ['class 5 area', 'perimeter', 'grid squares', 'mensuration basics'],
    seoTitle: 'Class 5 Area & Perimeter Masterclass | MAYF',
    seoDescription: 'Learn area and boundary measurements using grid square techniques for Class 5.',
    sortOrder: 12,
    createdAt: '2026-04-12T00:00:00.000Z',
    updatedAt: '2026-04-12T00:00:00.000Z',
    publishedAt: '2026-04-12T11:00:00.000Z',
    viewCount: 3890,
    downloadCount: 1450,
    difficulty: 'Foundation',
  },

  // 13. Class 5: PDF Guide on Factors and Multiples
  {
    id: 'cnt-pdf-class5-factors-multiples',
    title: 'Class 5 Be My Multiple, I\'ll Be Your Factor Revision Handbook',
    slug: 'class-5-factors-and-multiples-revision-handbook-pdf',
    shortDescription: 'Bangle game, dice grids, and common multiples of 2, 3, 5, and 6.',
    description: 'Clear illustrated revision notes explaining prime numbers, composite numbers, factor trees, and the common multiple chart.',
    classLevels: ['Class 5'],
    categoryId: 'Number System',
    subcategoryId: 'Fractions & Decimals',
    topic: 'Factors and Multiples',
    contentType: 'pdf',
    files: [
      {
        name: 'Class5_Factors_and_Multiples.pdf',
        url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
        sizeBytes: 1200000,
        mimeType: 'application/pdf',
      },
    ],
    thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
    accessType: 'free',
    price: 0,
    currency: 'INR',
    annualPassIncluded: true,
    downloadAllowed: true,
    visible: true,
    featured: false,
    trending: false,
    tags: ['Class 5', 'Factors', 'Multiples', 'Number System'],
    searchTerms: ['class 5 factors', 'multiples', 'factor tree', 'prime numbers'],
    seoTitle: 'Class 5 Factors & Multiples PDF Handbook | MAYF',
    seoDescription: 'Download Class 5 factors and multiples revision handbook with factor tree methods.',
    sortOrder: 13,
    createdAt: '2026-04-13T00:00:00.000Z',
    updatedAt: '2026-04-13T00:00:00.000Z',
    publishedAt: '2026-04-13T14:00:00.000Z',
    viewCount: 4620,
    downloadCount: 1980,
    difficulty: 'Foundation',
  },

  // 14. Class 6: Single Image Chart of Integers on Number Line
  {
    id: 'cnt-single-image-class6-numberline',
    title: 'Class 6 Integers on the Number Line: Positive, Negative & Zero Reference Map',
    slug: 'class-6-integers-on-number-line-reference-chart',
    shortDescription: 'High-contrast visual aid demonstrating integer addition and subtraction directions.',
    description: 'Moving right for positive additions and left for negative subtractions with thermometer altitude parallels.',
    classLevels: ['Class 6'],
    categoryId: 'Number System',
    subcategoryId: 'Integers',
    topic: 'Number Line',
    contentType: 'singleImage',
    files: [
      {
        name: 'Class6_Integers_Number_Line.png',
        url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&auto=format&fit=crop&q=80',
        sizeBytes: 740000,
        mimeType: 'image/png',
      },
    ],
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    accessType: 'free',
    price: 0,
    currency: 'INR',
    annualPassIncluded: true,
    downloadAllowed: true,
    visible: true,
    featured: false,
    trending: true,
    tags: ['Class 6', 'Integers', 'Number Line', 'Infographic'],
    searchTerms: ['integers', 'number line', 'class 6', 'positive negative numbers'],
    seoTitle: 'Class 6 Integers Number Line Reference Chart | MAYF',
    seoDescription: 'Printable Class 6 integers number line chart with sign movement rules.',
    sortOrder: 14,
    createdAt: '2026-04-14T00:00:00.000Z',
    updatedAt: '2026-04-14T00:00:00.000Z',
    publishedAt: '2026-04-14T10:00:00.000Z',
    viewCount: 6840,
    downloadCount: 2340,
    difficulty: 'Foundation',
  },

  // 15. Class 6: Paid Test Paper Mid-Term
  {
    id: 'cnt-test-class6-midterm',
    title: 'Class 6 Mathematics Mid-Term Comprehensive Mock Examination (50 Marks)',
    slug: 'class-6-maths-mid-term-mock-examination',
    shortDescription: 'Covers Knowing Our Numbers, Whole Numbers, Playing with Numbers & Basic Geometry.',
    description: 'Designed as per latest CBSE Class 6 assessment structure with answer key and rubric explanations.',
    classLevels: ['Class 6'],
    categoryId: 'Number System',
    subcategoryId: 'Integers',
    topic: 'Assessment',
    contentType: 'testPaper',
    files: [
      {
        name: 'Class6_Maths_MidTerm_Paper.pdf',
        url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
        sizeBytes: 950000,
        mimeType: 'application/pdf',
      },
    ],
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
    accessType: 'paid',
    price: 99,
    currency: 'INR',
    annualPassIncluded: true,
    downloadAllowed: true,
    visible: true,
    featured: false,
    trending: false,
    tags: ['Class 6', 'Mock Test', 'Exam Paper', 'Assessment'],
    searchTerms: ['class 6 exam paper', 'mid term test', 'maths sample paper class 6'],
    seoTitle: 'Class 6 Maths Mid-Term Sample Examination Paper | MAYF',
    seoDescription: 'Comprehensive Class 6 mid-term mathematics test paper with full answer key.',
    sortOrder: 15,
    createdAt: '2026-04-15T00:00:00.000Z',
    updatedAt: '2026-04-15T00:00:00.000Z',
    publishedAt: '2026-04-15T13:00:00.000Z',
    viewCount: 3100,
    downloadCount: 1120,
    difficulty: 'Standard',
  },

  // 16. Class 6: YouTube Video on Ratio and Proportion
  {
    id: 'cnt-yt-class6-ratio-proportion',
    title: 'Class 6 Ratio, Proportion & Unitary Method: Real Life Scenarios Visualized',
    slug: 'class-6-ratio-proportion-unitary-method-video',
    shortDescription: 'Learn recipe scaling, speed comparisons, and the unitary method in 12 minutes.',
    description: 'Clear video lesson on understanding the ratio symbol (:), simplifying ratios, and determining proportions via cross-multiplication.',
    classLevels: ['Class 6'],
    categoryId: 'Algebra',
    subcategoryId: 'Linear Equations',
    topic: 'Ratio and Proportion',
    contentType: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/ZBalWWHY9kE',
    source: 'YouTube',
    thumbnail: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&auto=format&fit=crop&q=80',
    accessType: 'free',
    price: 0,
    currency: 'INR',
    annualPassIncluded: true,
    downloadAllowed: false,
    visible: true,
    featured: false,
    trending: true,
    tags: ['Class 6', 'Ratio', 'Proportion', 'Unitary Method'],
    searchTerms: ['ratio', 'proportion', 'class 6', 'unitary method', 'video'],
    seoTitle: 'Class 6 Ratio & Proportion Video Lesson | MAYF',
    seoDescription: 'Master Class 6 ratio, proportion and the unitary method with step-by-step video solutions.',
    sortOrder: 16,
    createdAt: '2026-04-16T00:00:00.000Z',
    updatedAt: '2026-04-16T00:00:00.000Z',
    publishedAt: '2026-04-16T15:00:00.000Z',
    viewCount: 5740,
    downloadCount: 0,
    difficulty: 'Standard',
  },

  // 17. Class 7: Modular Course on Congruence of Triangles
  {
    id: 'cnt-course-class7-congruence-triangles',
    title: 'Class 7 Congruence of Triangles: SSS, SAS, ASA and RHS Criteria Masterclass',
    slug: 'class-7-congruence-of-triangles-criteria-course',
    shortDescription: 'Superposition principle, corresponding parts (CPCTC), and geometric proofs.',
    description: 'Four interactive modules establishing the exact conditions for two triangles to coincide identically.',
    classLevels: ['Class 7'],
    categoryId: 'Geometry',
    subcategoryId: 'Triangles',
    topic: 'Congruence',
    contentType: 'course',
    thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
    accessType: 'free',
    price: 0,
    currency: 'INR',
    annualPassIncluded: true,
    downloadAllowed: true,
    visible: true,
    featured: true,
    trending: false,
    tags: ['Class 7', 'Congruence', 'Triangles', 'Geometry'],
    searchTerms: ['congruence of triangles', 'class 7', 'sss sas asa rhs', 'cpctc'],
    seoTitle: 'Class 7 Congruence of Triangles Course | MAYF',
    seoDescription: 'Master triangle congruence criteria (SSS, SAS, ASA, RHS) for Class 7 CBSE/ICSE.',
    sortOrder: 17,
    createdAt: '2026-04-17T00:00:00.000Z',
    updatedAt: '2026-04-17T00:00:00.000Z',
    publishedAt: '2026-04-17T11:00:00.000Z',
    viewCount: 4490,
    downloadCount: 1620,
    difficulty: 'Standard',
  },

  // 18. Class 7: Paid PDF on Algebraic Expressions
  {
    id: 'cnt-pdf-class7-algebraic-expressions',
    title: 'Class 7 Algebraic Expressions: Terms, Factors, Coefficients & Like Terms Guide (PDF)',
    slug: 'class-7-algebraic-expressions-and-identities-guide-pdf',
    shortDescription: 'Monomials, binomials, polynomials, addition/subtraction, and evaluating values at x.',
    description: 'In-depth 16-page PDF notes clarifying algebraic syntax, substitution techniques, and formula construction.',
    classLevels: ['Class 7'],
    categoryId: 'Algebra',
    subcategoryId: 'Polynomials',
    topic: 'Algebraic Expressions',
    contentType: 'pdf',
    files: [
      {
        name: 'Class7_Algebraic_Expressions.pdf',
        url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
        sizeBytes: 1650000,
        mimeType: 'application/pdf',
      },
    ],
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    accessType: 'paid',
    price: 129,
    currency: 'INR',
    annualPassIncluded: true,
    downloadAllowed: true,
    visible: true,
    featured: false,
    trending: true,
    tags: ['Class 7', 'Algebra', 'Expressions', 'PDF'],
    searchTerms: ['algebraic expressions', 'class 7 algebra', 'like terms', 'monomial binomial'],
    seoTitle: 'Class 7 Algebraic Expressions Revision PDF | MAYF',
    seoDescription: 'Detailed revision guide on Class 7 algebraic expressions and finding values.',
    sortOrder: 18,
    createdAt: '2026-04-18T00:00:00.000Z',
    updatedAt: '2026-04-18T00:00:00.000Z',
    publishedAt: '2026-04-18T16:00:00.000Z',
    viewCount: 3950,
    downloadCount: 1380,
    difficulty: 'Standard',
  },

  // 19. Class 7: Worksheet on Rational Numbers
  {
    id: 'cnt-worksheet-class7-rational-numbers',
    title: 'Class 7 Rational Numbers: Operations & Equivalent Forms Practice Worksheet',
    slug: 'class-7-rational-numbers-operations-worksheet',
    shortDescription: 'Standard form p/q (q ≠ 0), finding rational numbers between two numbers, and arithmetic.',
    description: 'Graded worksheet with 20 problems on comparing rational numbers and reciprocal multiplication.',
    classLevels: ['Class 7'],
    categoryId: 'Number System',
    subcategoryId: 'Integers',
    topic: 'Rational Numbers',
    contentType: 'worksheet',
    files: [
      {
        name: 'Class7_Rational_Numbers_Worksheet.pdf',
        url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
        sizeBytes: 980000,
        mimeType: 'application/pdf',
      },
    ],
    thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
    accessType: 'free',
    price: 0,
    currency: 'INR',
    annualPassIncluded: true,
    downloadAllowed: true,
    visible: true,
    featured: false,
    trending: false,
    tags: ['Class 7', 'Rational Numbers', 'Worksheet'],
    searchTerms: ['rational numbers', 'class 7', 'number system', 'standard form p/q'],
    seoTitle: 'Class 7 Rational Numbers Practice Worksheet | MAYF',
    seoDescription: 'Free printable Class 7 rational numbers worksheet with step-by-step answer key.',
    sortOrder: 19,
    createdAt: '2026-04-19T00:00:00.000Z',
    updatedAt: '2026-04-19T00:00:00.000Z',
    publishedAt: '2026-04-19T12:00:00.000Z',
    viewCount: 4720,
    downloadCount: 1890,
    difficulty: 'Standard',
  },

  // 20. Class 8: Multi-Image Guide on Quadrilaterals
  {
    id: 'cnt-multi-image-class8-quadrilaterals',
    title: 'Class 8 Understanding Quadrilaterals: Parallelogram, Rhombus, Rectangle & Square Slide Deck',
    slug: 'class-8-understanding-quadrilaterals-visual-slides',
    shortDescription: 'Step-by-step visual property charts for diagonals, opposite angles, and angle sum property.',
    description: 'Four rich slide cards contrasting parallelograms, rhombuses, kites, and trapeziums with diagonal angle rules.',
    classLevels: ['Class 8'],
    categoryId: 'Geometry',
    subcategoryId: 'Quadrilaterals',
    topic: 'Quadrilaterals',
    contentType: 'multiImage',
    files: [
      {
        name: 'Quad_Slide1_Angle_Sum_Property.png',
        url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1000&auto=format&fit=crop&q=80',
        sizeBytes: 420000,
        mimeType: 'image/png',
      },
      {
        name: 'Quad_Slide2_Parallelogram_Properties.png',
        url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1000&auto=format&fit=crop&q=80',
        sizeBytes: 440000,
        mimeType: 'image/png',
      },
      {
        name: 'Quad_Slide3_Rhombus_and_Rectangle.png',
        url: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=1000&auto=format&fit=crop&q=80',
        sizeBytes: 410000,
        mimeType: 'image/png',
      },
    ],
    thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
    accessType: 'free',
    price: 0,
    currency: 'INR',
    annualPassIncluded: true,
    downloadAllowed: true,
    visible: true,
    featured: false,
    trending: true,
    tags: ['Class 8', 'Quadrilaterals', 'Geometry', 'Multi-Image'],
    searchTerms: ['quadrilaterals', 'parallelogram', 'rhombus', 'rectangle', 'class 8 geometry'],
    seoTitle: 'Class 8 Quadrilaterals Visual Properties Slide Deck | MAYF',
    seoDescription: 'High-clarity slide breakdown of all quadrilateral properties for Class 8.',
    sortOrder: 20,
    createdAt: '2026-04-20T00:00:00.000Z',
    updatedAt: '2026-04-20T00:00:00.000Z',
    publishedAt: '2026-04-20T08:00:00.000Z',
    viewCount: 6110,
    downloadCount: 2280,
    difficulty: 'Standard',
  },

  // 21. Class 8: Paid Test Paper on Mensuration
  {
    id: 'cnt-test-class8-annual-sample',
    title: 'Class 8 Mensuration & Solid Shapes 60-Mark Practice Exam',
    slug: 'class-8-mensuration-and-solid-shapes-mock-exam',
    shortDescription: 'Cylinder surface areas, trapezium fields, polygon areas, and volume problems.',
    description: 'Comprehensive test paper challenging students with real-world road roller and water tank volume computations.',
    classLevels: ['Class 8'],
    categoryId: 'Mensuration',
    subcategoryId: 'Surface Areas and Volumes',
    topic: 'Mensuration Test',
    contentType: 'testPaper',
    files: [
      {
        name: 'Class8_Mensuration_Mock_Paper.pdf',
        url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
        sizeBytes: 1400000,
        mimeType: 'application/pdf',
      },
    ],
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
    accessType: 'paid',
    price: 149,
    currency: 'INR',
    annualPassIncluded: true,
    downloadAllowed: true,
    visible: true,
    featured: false,
    trending: false,
    tags: ['Class 8', 'Mensuration', 'Exam Paper', 'Cylinder'],
    searchTerms: ['class 8 mensuration', 'sample paper', 'cylinder area', 'trapezium area'],
    seoTitle: 'Class 8 Mensuration Mock Examination Paper | MAYF',
    seoDescription: '60-mark mock test on Class 8 mensuration with complete step scoring scheme.',
    sortOrder: 21,
    createdAt: '2026-04-21T00:00:00.000Z',
    updatedAt: '2026-04-21T00:00:00.000Z',
    publishedAt: '2026-04-21T10:00:00.000Z',
    viewCount: 3410,
    downloadCount: 1190,
    difficulty: 'Exemplar / Board',
  },

  // 22. Class 9: YouTube Video Proof of Heron's Formula
  {
    id: 'cnt-yt-class9-heron-formula',
    title: 'Class 9 Heron\'s Formula Proof: Area = √(s(s-a)(s-b)(s-c)) Explained Visually',
    slug: 'class-9-herons-formula-proof-visual-breakdown',
    shortDescription: 'Derivation using Pythagoras theorem on triangle altitudes without trigonometry.',
    description: 'Learn why semi-perimeter s = (a+b+c)/2 gives the triangle area and how to apply it to quadrilaterals and parks.',
    classLevels: ['Class 9'],
    categoryId: 'Mensuration',
    subcategoryId: 'Area Related to Circles',
    topic: 'Heron\'s Formula',
    contentType: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/ZBalWWHY9kE',
    source: 'YouTube',
    thumbnail: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&auto=format&fit=crop&q=80',
    accessType: 'free',
    price: 0,
    currency: 'INR',
    annualPassIncluded: true,
    downloadAllowed: false,
    visible: true,
    featured: false,
    trending: true,
    tags: ['Class 9', 'Herons Formula', 'Triangle Area', 'YouTube'],
    searchTerms: ['herons formula', 'class 9', 'semi perimeter', 'triangle area proof'],
    seoTitle: 'Heron\'s Formula Proof & Applications Video | MAYF',
    seoDescription: 'Watch the step-by-step geometric proof and application of Heron\'s formula.',
    sortOrder: 22,
    createdAt: '2026-04-22T00:00:00.000Z',
    updatedAt: '2026-04-22T00:00:00.000Z',
    publishedAt: '2026-04-22T14:00:00.000Z',
    viewCount: 7890,
    downloadCount: 0,
    difficulty: 'Standard',
  },

  // 23. Class 9: Paid Modular Course on Circles & Theorems
  {
    id: 'cnt-course-class9-circles-theorems',
    title: 'Class 9 Circles & Theorems: Angle Subtended at Center & Cyclic Quadrilaterals Masterclass',
    slug: 'class-9-circles-theorems-and-cyclic-quadrilaterals-course',
    shortDescription: 'Perpendicular from center bisects chord, angle in semicircle is right angle, and cyclic quadrilateral opposite angles sum to 180°.',
    description: 'Full modular course with 4 rigorous chapters covering the 7 core circle theorems of Class 9 mathematics.',
    classLevels: ['Class 9'],
    categoryId: 'Geometry',
    subcategoryId: 'Circles',
    topic: 'Circle Theorems',
    contentType: 'course',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    accessType: 'paid',
    price: 199,
    currency: 'INR',
    annualPassIncluded: true,
    downloadAllowed: true,
    visible: true,
    featured: true,
    trending: false,
    tags: ['Class 9', 'Circles', 'Theorems', 'Cyclic Quadrilateral'],
    searchTerms: ['circles theorems', 'class 9 geometry', 'cyclic quadrilateral', 'subtended angle'],
    seoTitle: 'Class 9 Circles & Theorems Complete Course | MAYF',
    seoDescription: 'Master all 7 Class 9 circle theorems with proofs and NCERT exemplar questions.',
    sortOrder: 23,
    createdAt: '2026-04-23T00:00:00.000Z',
    updatedAt: '2026-04-23T00:00:00.000Z',
    publishedAt: '2026-04-23T11:00:00.000Z',
    viewCount: 4190,
    downloadCount: 1540,
    difficulty: 'Exemplar / Board',
  },

  // 24. Class 9: Free PDF on Polynomials & Factor Theorem
  {
    id: 'cnt-pdf-class9-polynomials-factor-theorem',
    title: 'Class 9 Polynomials, Remainder Theorem & Algebraic Identities Handbook (PDF)',
    slug: 'class-9-polynomials-remainder-theorem-handbook-pdf',
    shortDescription: 'Zeroes of polynomial, (x+y+z)², (x±y)³, and x³+y³+z³ - 3xyz identities.',
    description: 'Printable 18-page handbook detailing splitting the middle term and factor theorem for cubic polynomials.',
    classLevels: ['Class 9'],
    categoryId: 'Algebra',
    subcategoryId: 'Polynomials',
    topic: 'Identities & Factor Theorem',
    contentType: 'pdf',
    files: [
      {
        name: 'Class9_Polynomials_Handbook.pdf',
        url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
        sizeBytes: 1750000,
        mimeType: 'application/pdf',
      },
    ],
    thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
    accessType: 'free',
    price: 0,
    currency: 'INR',
    annualPassIncluded: true,
    downloadAllowed: true,
    visible: true,
    featured: false,
    trending: true,
    tags: ['Class 9', 'Polynomials', 'Factor Theorem', 'PDF'],
    searchTerms: ['polynomials', 'class 9', 'remainder theorem', 'factor theorem', 'identities'],
    seoTitle: 'Class 9 Polynomials Handbook PDF | MAYF',
    seoDescription: 'Download Class 9 polynomials and algebraic identities revision handbook.',
    sortOrder: 24,
    createdAt: '2026-04-24T00:00:00.000Z',
    updatedAt: '2026-04-24T00:00:00.000Z',
    publishedAt: '2026-04-24T09:00:00.000Z',
    viewCount: 8200,
    downloadCount: 3120,
    difficulty: 'Standard',
  },

  // 25. Class 10: Paid Video on Heights and Distances Applications
  {
    id: 'cnt-video-class10-trig-heights-distances',
    title: 'Class 10 Some Applications of Trigonometry: Heights & Distances 3D Walkthrough',
    slug: 'class-10-trigonometry-heights-and-distances-3d-video',
    shortDescription: 'Angles of elevation and depression, double-triangle kite and lighthouse problems.',
    description: 'Visual animation demonstrating horizontal line of sight, observer height adjustments, and two-observer tower problems.',
    classLevels: ['Class 10'],
    categoryId: 'Trigonometry',
    subcategoryId: 'Heights & Distances',
    topic: 'Applications of Trigonometry',
    contentType: 'video',
    embedUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    accessType: 'paid',
    price: 149,
    currency: 'INR',
    annualPassIncluded: true,
    downloadAllowed: false,
    visible: true,
    featured: true,
    trending: true,
    tags: ['Class 10', 'Trigonometry', 'Heights and Distances', 'Video'],
    searchTerms: ['heights and distances', 'angle of elevation', 'angle of depression', 'class 10 trig'],
    seoTitle: 'Class 10 Heights & Distances 3D Video Masterclass | MAYF',
    seoDescription: 'Master Class 10 trigonometry heights and distances with 3D animation models.',
    sortOrder: 25,
    createdAt: '2026-04-25T00:00:00.000Z',
    updatedAt: '2026-04-25T00:00:00.000Z',
    publishedAt: '2026-04-25T15:00:00.000Z',
    viewCount: 9430,
    downloadCount: 0,
    difficulty: 'Exemplar / Board',
  },
];

/**
 * Fetch paginated content items using Firestore queries and cursors.
 * Hard limits page size to at most 20 documents.
 */
export async function fetchContentCatalogue(
  filters: CatalogueFilters = {},
  cursor: QueryDocumentSnapshot | null = null,
  requestedPageSize: number = MAX_PAGE_SIZE
): Promise<PaginatedResult<ContentItem>> {
  const pageSize = Math.min(Math.max(1, requestedPageSize), MAX_PAGE_SIZE);

  try {
    const constraints: QueryConstraint[] = [where('visible', '==', true)];

    if (filters.classLevel && filters.classLevel !== 'All') {
      constraints.push(where('classLevels', 'array-contains', filters.classLevel));
    }

    if (filters.categoryId && filters.categoryId !== 'All') {
      constraints.push(where('categoryId', '==', filters.categoryId));
    }

    if (filters.accessType && filters.accessType !== 'All') {
      constraints.push(where('accessType', '==', filters.accessType));
    }

    if (filters.contentType && filters.contentType !== 'All') {
      constraints.push(where('contentType', '==', filters.contentType));
    }

    // Determine sorting field based on user choice
    const sortBy = filters.sortBy || 'latest';
    switch (sortBy) {
      case 'popular':
        constraints.push(orderBy('downloadCount', 'desc'));
        break;
      case 'most_viewed':
        constraints.push(orderBy('viewCount', 'desc'));
        break;
      case 'alpha':
        constraints.push(orderBy('title', 'asc'));
        break;
      case 'latest':
      default:
        constraints.push(orderBy('publishedAt', 'desc'));
        break;
    }

    if (cursor) {
      constraints.push(startAfter(cursor));
    }

    constraints.push(limit(pageSize));

    const contentQuery = query(collection(db, 'contentItems'), ...constraints);
    const snapshot = await getDocs(contentQuery);

    if (snapshot.empty && !cursor) {
      return getLocalFilteredResults(filters, cursor, pageSize);
    }

    const items: ContentItem[] = snapshot.docs.map((d) => ({
      ...(d.data() as ContentItem),
      id: d.id,
    }));

    const nextDoc = snapshot.docs.length === pageSize ? snapshot.docs[snapshot.docs.length - 1] : null;

    return {
      items,
      nextCursor: nextDoc,
      hasMore: snapshot.docs.length === pageSize,
      totalLoaded: items.length,
    };
  } catch (error) {
    console.warn('[MAYF Catalogue] Firestore query note, using offline indexed catalog:', error);
    return getLocalFilteredResults(filters, cursor, pageSize);
  }
}

/**
 * Fetch single content item by slug
 */
export async function fetchContentItemBySlug(slug: string): Promise<ContentItem | null> {
  try {
    const q = query(
      collection(db, 'contentItems'),
      where('slug', '==', slug),
      where('visible', '==', true),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { ...(d.data() as ContentItem), id: d.id };
    }
  } catch (err) {
    console.warn('[MAYF Catalogue] Fetch by slug falling back to seed items');
  }

  const found = SEED_CONTENT_ITEMS.find((item) => item.slug === slug);
  return found || null;
}

/**
 * Access Control Evaluator (IMPORTANT LOGIN RULE ENFORCEMENT)
 * - Free study material is 100% accessible WITHOUT authentication.
 * - Paid content requires authentication + Pro or Annual Pass claims.
 */
export function checkUserCanAccessItem(
  item: ContentItem,
  entitlements: ParsedUserEntitlements | null
): { canAccess: boolean; requiresAuth: boolean; reason?: string } {
  // Free material rule: 100% accessible anonymously
  if (item.accessType === 'free') {
    return { canAccess: true, requiresAuth: false };
  }

  // Paid material: Authentication is strictly required
  if (!entitlements) {
    return {
      canAccess: false,
      requiresAuth: true,
      reason: 'Please log in to access this premium study material.',
    };
  }

  if (entitlements.isAdmin || entitlements.isSuperAdmin) {
    return { canAccess: true, requiresAuth: true };
  }

  if (entitlements.hasAnnualPass && item.annualPassIncluded !== false) {
    return { canAccess: true, requiresAuth: true };
  }

  if (entitlements.isPro) {
    return { canAccess: true, requiresAuth: true };
  }

  return {
    canAccess: false,
    requiresAuth: true,
    reason: 'This premium resource requires the Maths at Your Fingertips Annual Pass.',
  };
}

/**
 * Local fallback paginator honoring the max 20 page size and sorting modes
 */
function getLocalFilteredResults(
  filters: CatalogueFilters,
  cursor: QueryDocumentSnapshot | null,
  pageSize: number
): PaginatedResult<ContentItem> {
  let filtered = SEED_CONTENT_ITEMS.filter((item) => item.visible);

  if (filters.classLevel && filters.classLevel !== 'All') {
    filtered = filtered.filter((i) => i.classLevels.includes(filters.classLevel as StudentClass));
  }
  if (filters.categoryId && filters.categoryId !== 'All') {
    filtered = filtered.filter((i) => i.categoryId === filters.categoryId);
  }
  if (filters.subcategoryId && filters.subcategoryId !== 'All') {
    filtered = filtered.filter((i) => i.subcategoryId === filters.subcategoryId);
  }
  if (filters.accessType && filters.accessType !== 'All') {
    filtered = filtered.filter((i) => i.accessType === filters.accessType);
  }
  if (filters.contentType && filters.contentType !== 'All') {
    filtered = filtered.filter((i) => i.contentType === filters.contentType);
  }
  if (filters.difficulty && filters.difficulty !== 'All') {
    filtered = filtered.filter((i) => i.difficulty === filters.difficulty);
  }

  // Sorting
  const sortBy = filters.sortBy || 'latest';
  switch (sortBy) {
    case 'popular':
      filtered.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
      break;
    case 'most_viewed':
      filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
      break;
    case 'alpha':
      filtered.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'latest':
    default:
      filtered.sort(
        (a, b) =>
          new Date(b.publishedAt || b.createdAt).getTime() -
          new Date(a.publishedAt || a.createdAt).getTime()
      );
      break;
  }

  let startIndex = 0;
  if (cursor) {
    if (typeof (cursor as any).offset === 'number') {
      startIndex = (cursor as any).offset;
    } else if ((cursor as any).id) {
      const idx = filtered.findIndex((i) => i.id === (cursor as any).id);
      if (idx !== -1) startIndex = idx + 1;
    }
  }

  const items = filtered.slice(startIndex, startIndex + pageSize);
  const nextOffset = startIndex + items.length;
  const hasMore = nextOffset < filtered.length;
  const nextCursor = hasMore ? ({ id: items[items.length - 1]?.id, offset: nextOffset } as any) : null;

  return {
    items,
    nextCursor,
    hasMore,
    totalLoaded: items.length,
  };
}
