/**
 * Firestore data model types for Maths at Your Fingertips (MAYF)
 * Tailored for Class 5–10 CBSE / ICSE curriculum.
 */

export type StudentClass = 'Class 5' | 'Class 6' | 'Class 7' | 'Class 8' | 'Class 9' | 'Class 10';

export interface StudentProfile {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  studentClass: StudentClass;
  board: 'CBSE' | 'ICSE' | 'State Board';
  hasAnnualPass: boolean;
  passExpiryDate?: string;
  streakDays: number;
  lastActiveDate: string;
  createdAt: string;
  role: 'student' | 'parent' | 'admin';
}

export type MathSubjectCategory =
  | 'Number System'
  | 'Algebra'
  | 'Geometry'
  | 'Coordinate Geometry'
  | 'Trigonometry'
  | 'Mensuration'
  | 'Statistics & Probability'
  | 'Commercial Math';

export interface StudyChapter {
  id: string;
  slug: string;
  title: string;
  classLevel: StudentClass;
  category: MathSubjectCategory;
  orderIndex: number;
  description: string;
  formulaCount: number;
  solvedProblemsCount: number;
  isFreePreview: boolean;
  learningOutcomes: string[];
  keyTheorems: string[];
  downloadableNotesUrl?: string;
}

export interface FormulaItem {
  id: string;
  slug: string;
  title: string;
  category: MathSubjectCategory;
  applicableClasses: StudentClass[];
  latexFormula: string;
  plainTextFormula: string;
  variables: { symbol: string; meaning: string; unit?: string }[];
  explanation: string;
  exampleProblem: {
    question: string;
    stepByStepSolution: string[];
    answer: string;
  };
  mnemonicHint?: string;
  isProOnly: boolean;
  watermarkGlyph: string; // e.g. 'π', '√', 'Σ', '∞', 'x²', '∫'
}

export interface SolvedProblemStep {
  stepNumber: number;
  heading: string;
  mathExpression: string;
  explanation: string;
}

export interface SolvedProblem {
  id: string;
  chapterSlug: string;
  title: string;
  classLevel: StudentClass;
  difficulty: 'Foundation' | 'Standard' | 'Exemplar / Board';
  question: string;
  steps: SolvedProblemStep[];
  finalAnswer: string;
  keyFormulaUsed: string;
}

export interface AiDoubtMessage {
  id: string;
  sender: 'student' | 'ai_teacher';
  text: string;
  timestamp: string;
  suggestedFormulas?: string[];
  stepHints?: string[];
}

export interface AiDoubtSession {
  id: string;
  userId: string;
  title: string;
  classLevel: StudentClass;
  chapterTopic?: string;
  lastUpdated: string;
  messages: AiDoubtMessage[];
}

export interface PurchaseRecord {
  orderId: string;
  userId: string;
  planName: string;
  amountInr: number;
  currency: 'INR';
  purchaseDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'refunded';
  invoicePdfUrl?: string;
}

export interface SavedBookmark {
  id: string;
  userId: string;
  itemType: 'formula' | 'chapter' | 'problem';
  itemSlug: string;
  title: string;
  classLevel: StudentClass;
  savedAt: string;
}
