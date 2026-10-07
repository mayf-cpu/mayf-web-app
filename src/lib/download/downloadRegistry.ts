/**
 * Central Download Registry and Content Resolver
 * Tracks downloadable educational items, access rules (free vs paid),
 * file metadata, and document generation.
 */

export interface DownloadableItem {
  id: string;
  slug: string;
  title: string;
  accessType: 'free' | 'paid';
  downloadAllowed: boolean;
  classLevel: string;
  category: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  description: string;
}

export const DOWNLOADABLE_ITEMS: DownloadableItem[] = [
  // Dashboard Downloadable Items
  {
    id: 'dl-10-cheatsheet',
    slug: 'class-10-board-complete-formula-cheatsheet',
    title: 'Class 10 Board Exam Complete Formula Cheatsheet',
    accessType: 'free',
    downloadAllowed: true,
    classLevel: 'Class 10',
    category: 'Formula Flashcards',
    fileName: 'MAYF_Class10_Board_Formula_Cheatsheet.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 2450000,
    description: 'Every formula in Real Numbers, Polynomials, Linear Systems, Quadratics, AP, Triangles, Trig, Circles, and Surface Areas in printable high-resolution PDF format.',
  },
  {
    id: 'dl-10-theorems',
    slug: 'class-10-essential-geometry-proofs-theorems',
    title: 'Class 10 Essential Geometry Proofs & Theorems Reference',
    accessType: 'free',
    downloadAllowed: true,
    classLevel: 'Class 10',
    category: 'Theorems & Axioms',
    fileName: 'MAYF_Class10_Geometry_Proofs_Reference.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 1850000,
    description: 'Complete step-by-step proofs for Basic Proportionality Theorem (BPT), Tangent Theorem, and cyclic properties with diagrams.',
  },
  {
    id: 'dl-9-circles',
    slug: 'class-9-geometry-mensuration-handbook',
    title: 'Class 9 Geometry & Mensuration Formula Handbook',
    accessType: 'free',
    downloadAllowed: true,
    classLevel: 'Class 9',
    category: 'Formula Flashcards',
    fileName: 'MAYF_Class9_Mensuration_Handbook.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 1540000,
    description: 'Quick reference for Herons formula, Surface Areas & Volumes of cylinders/cones, and Circle chord angle properties.',
  },
  {
    id: 'dl-8-algebra',
    slug: 'class-8-linear-equations-workbook',
    title: 'Class 8 Linear Equations & Factorisation Workbook',
    accessType: 'free',
    downloadAllowed: true,
    classLevel: 'Class 8',
    category: 'Practice Sheet',
    fileName: 'MAYF_Class8_Algebra_Workbook.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 1220000,
    description: 'Handcrafted word problems with step-by-step worked solutions for algebraic expressions and identities.',
  },
  {
    id: 'dl-foundation',
    slug: 'classes-5-7-mental-math-foundations-chart',
    title: 'Classes 5–7 Mental Math & Foundations Master Chart',
    accessType: 'free',
    downloadAllowed: true,
    classLevel: 'Classes 5–7',
    category: 'Foundation',
    fileName: 'MAYF_Classes5-7_Mental_Math_Chart.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 950000,
    description: 'Fraction addition rules, divisibility tricks, LCM/HCF shortcuts, and integer sign rules chart for study table wall mounting.',
  },

  // Catalogue Curriculum Items (Free)
  {
    id: 'cnt-pdf-formula-handbook',
    slug: 'class-10-board-examination-complete-formula-handbook-pdf',
    title: 'Class 10 Board Examination Complete Formula Handbook (PDF)',
    accessType: 'free',
    downloadAllowed: true,
    classLevel: 'Class 10',
    category: 'Algebra',
    fileName: 'MAYF_Class10_Formula_Handbook.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 2450000,
    description: 'Every single identity, theorem statement, and formula for Class 10 CBSE & ICSE mathematics compiled in high-density printable format.',
  },
  {
    id: 'cnt-worksheet-class8-linear',
    slug: 'class-8-linear-equations-in-one-variable-worksheet',
    title: 'Class 8 Linear Equations in One Variable Practice Worksheet',
    accessType: 'free',
    downloadAllowed: true,
    classLevel: 'Class 8',
    category: 'Algebra',
    fileName: 'MAYF_Class8_Linear_Equations_Worksheet.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 1100000,
    description: '15 real-life scenario questions on age differences, coins, and perimeter with full solutions.',
  },
  {
    id: 'cnt-worksheet-class5-shapes-angles',
    slug: 'class-5-shapes-and-angles-explorer-worksheet',
    title: 'Class 5 Shapes and Angles: Acute, Obtuse & Right Angles Explorer',
    accessType: 'free',
    downloadAllowed: true,
    classLevel: 'Class 5',
    category: 'Geometry',
    fileName: 'MAYF_Class5_Shapes_and_Angles.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 850000,
    description: 'Visual angle tester sheet with clocks, yoga poses, and polygon corners.',
  },
  {
    id: 'cnt-pdf-class5-factors-multiples',
    slug: 'class-5-factors-and-multiples-revision-handbook-pdf',
    title: 'Class 5 Factors and Multiples Revision Handbook',
    accessType: 'free',
    downloadAllowed: true,
    classLevel: 'Class 5',
    category: 'Number System',
    fileName: 'MAYF_Class5_Factors_and_Multiples.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 1200000,
    description: 'Illustrated revision notes explaining prime numbers, composite numbers, factor trees, and the common multiple chart.',
  },
  {
    id: 'cnt-worksheet-class7-rational-numbers',
    slug: 'class-7-rational-numbers-operations-worksheet',
    title: 'Class 7 Rational Numbers Practice Worksheet',
    accessType: 'free',
    downloadAllowed: true,
    classLevel: 'Class 7',
    category: 'Number System',
    fileName: 'MAYF_Class7_Rational_Numbers_Worksheet.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 980000,
    description: 'Graded worksheet with 20 problems on comparing rational numbers and reciprocal multiplication.',
  },
  {
    id: 'cnt-pdf-class9-polynomials-factor-theorem',
    slug: 'class-9-polynomials-remainder-theorem-handbook-pdf',
    title: 'Class 9 Polynomials & Factor Theorem Handbook (PDF)',
    accessType: 'free',
    downloadAllowed: true,
    classLevel: 'Class 9',
    category: 'Algebra',
    fileName: 'MAYF_Class9_Polynomials_Handbook.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 1750000,
    description: 'Printable 18-page handbook detailing splitting the middle term and factor theorem for cubic polynomials.',
  },
  {
    id: 'cnt-single-image-trig-chart',
    slug: 'trigonometric-ratios-of-specific-angles-table-chart',
    title: 'Trigonometric Ratios Specific Angles Table Chart',
    accessType: 'free',
    downloadAllowed: true,
    classLevel: 'Class 10',
    category: 'Trigonometry',
    fileName: 'MAYF_Trig_Angle_Values_Chart.png',
    mimeType: 'image/png',
    fileSizeBytes: 880000,
    description: 'Memorize standard angle trigonometric values with finger trick mnemonics and exact fraction notation.',
  },

  // Catalogue Curriculum Items (PAID - Requires Login + Annual Pass / Pro Access)
  {
    id: 'cnt-test-class10-mock-1',
    slug: 'cbse-class-10-standard-maths-mock-board-paper',
    title: 'CBSE Class 10 Standard Mathematics 80-Mark Mock Board Exam Paper',
    accessType: 'paid',
    downloadAllowed: true,
    classLevel: 'Class 10',
    category: 'Algebra',
    fileName: 'MAYF_Class10_Mock_Board_Paper_2026.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 1800000,
    description: 'Full syllabus 3-hour sample examination with Section A to Section E marking scheme and answer keys.',
  },
  {
    id: 'cnt-formula-coordinate-geom',
    slug: 'coordinate-geometry-formula-sheet-distance-section-area',
    title: 'Coordinate Geometry Formula Sheet: Distance & Section Formulas',
    accessType: 'paid',
    downloadAllowed: true,
    classLevel: 'Class 10',
    category: 'Coordinate Geometry',
    fileName: 'MAYF_Coordinate_Geometry_Complete_Card.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 1150000,
    description: 'Master distance calculations, midpoint coordinates, centroid of triangle, and section formula derivations on coordinate axes.',
  },
  {
    id: 'cnt-test-class6-midterm',
    slug: 'class-6-maths-mid-term-mock-examination',
    title: 'Class 6 Mathematics Mid-Term Comprehensive Mock Examination (50 Marks)',
    accessType: 'paid',
    downloadAllowed: true,
    classLevel: 'Class 6',
    category: 'Number System',
    fileName: 'MAYF_Class6_Maths_MidTerm_Paper.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 950000,
    description: 'Designed as per latest CBSE Class 6 assessment structure with answer key and rubric explanations.',
  },
  {
    id: 'cnt-pdf-class7-algebraic-expressions',
    slug: 'class-7-algebraic-expressions-and-identities-guide-pdf',
    title: 'Class 7 Algebraic Expressions: Terms, Factors & Like Terms Guide (PDF)',
    accessType: 'paid',
    downloadAllowed: true,
    classLevel: 'Class 7',
    category: 'Algebra',
    fileName: 'MAYF_Class7_Algebraic_Expressions_Guide.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 1650000,
    description: 'In-depth 16-page PDF notes clarifying algebraic syntax, substitution techniques, and formula construction.',
  },
  {
    id: 'cnt-test-class8-annual-sample',
    slug: 'class-8-mensuration-and-solid-shapes-mock-exam',
    title: 'Class 8 Mensuration & Solid Shapes 60-Mark Practice Exam',
    accessType: 'paid',
    downloadAllowed: true,
    classLevel: 'Class 8',
    category: 'Mensuration',
    fileName: 'MAYF_Class8_Mensuration_Mock_Paper.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 1400000,
    description: 'Comprehensive test paper challenging students with real-world road roller and water tank volume computations.',
  },
];

/**
 * Finds a downloadable item by its ID or slug
 */
export function getDownloadableItem(idOrSlug: string): DownloadableItem | null {
  const match = DOWNLOADABLE_ITEMS.find(
    (item) => item.id === idOrSlug || item.slug === idOrSlug
  );
  return match || null;
}
