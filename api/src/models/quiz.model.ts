export interface QuizQuestion {
  id: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
  pageNumber: number;
  language?: string; // Language the question was generated in
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  magicLink?: string; // Magic link for sharing and accessing the quiz
  metadata: {
    sourceFile: string;
    totalPages: number;
    createdAt?: Date;
    generatedAt?: string; // ISO string for when quiz was generated
    estimatedDuration?: number; // in minutes
    language?: string; // Quiz language
    questionsPerPage?: number;
    difficulty?: string;
    includeExplanations?: boolean;
    magicLink?: string; // Also store in metadata for backwards compatibility
    savedAt?: Date; // When the quiz was saved to storage
    pagesProcessed?: number; // Number of pages actually processed
    totalQuestions?: number; // Total number of questions generated
    [key: string]: any; // Allow additional metadata fields
  };
}

export interface PdfToQuizOptions {
  questionsPerPage?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  includeExplanations?: boolean;
  generateImages?: boolean;
  language?: string; // Target language for quiz generation
}

export interface PdfPage {
  pageNumber: number;
  content: string;
  imagePath?: string;
}

export interface PdfProcessingResult {
  pages: PdfPage[];
  totalPages: number;
  metadata: {
    filename: string;
    fileSize: number;
    contentLength: number;
    language?: string;
  };
} 