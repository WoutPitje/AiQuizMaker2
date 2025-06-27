// Base interface for all question types
export interface BaseQuestion {
  id: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
  pageNumber: number;
  language?: string;
}

// Multiple choice question (original format)
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

// Flashcard question
export interface FlashcardQuestion extends BaseQuestion {
  type: 'flashcard';
  front: string;
  back: string;
}

// True/False question
export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true-false';
  statement: string;
  correctAnswer: boolean;
}

// Fill in the blank question
export interface FillInBlankQuestion extends BaseQuestion {
  type: 'fill-in-blank';
  text: string; // Text with blanks marked as {{blank}}
  blanks: string[]; // Correct answers for each blank
}

// Matching question
export interface MatchingQuestion extends BaseQuestion {
  type: 'matching';
  leftItems: { id: string; text: string }[];
  rightItems: { id: string; text: string }[];
  correctPairs: { leftId: string; rightId: string }[];
}

// Multiple select question
export interface MultipleSelectQuestion extends BaseQuestion {
  type: 'multiple-select';
  question: string;
  options: string[];
  correctAnswers: number[]; // Indices of correct options
}

// Short answer question
export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short-answer';
  question: string;
  expectedAnswer: string;
  keywords?: string[]; // Key terms that should be in the answer
}

// Ordering question
export interface OrderingQuestion extends BaseQuestion {
  type: 'ordering';
  question: string;
  items: string[];
  correctOrder: number[]; // Indices representing correct order
}

// Union type for all question types
export type QuizQuestion =
  | MultipleChoiceQuestion
  | FlashcardQuestion
  | TrueFalseQuestion
  | FillInBlankQuestion
  | MatchingQuestion
  | MultipleSelectQuestion
  | ShortAnswerQuestion
  | OrderingQuestion;

// Legacy support - alias for backward compatibility
export type LegacyQuizQuestion = MultipleChoiceQuestion;

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  magicLink?: string;
  version?: number; // For schema versioning
  type?:
    | 'mixed'
    | 'multiple-choice'
    | 'flashcard'
    | 'true-false'
    | 'fill-in-blank'
    | 'matching'
    | 'multiple-select'
    | 'short-answer'
    | 'ordering';
  metadata: {
    sourceFile: string;
    totalPages: number;
    createdAt?: Date;
    generatedAt?: string;
    estimatedDuration?: number;
    language?: string;
    questionsPerPage?: number;
    difficulty?: string;
    includeExplanations?: boolean;
    magicLink?: string;
    savedAt?: Date;
    pagesProcessed?: number;
    totalQuestions?: number;
    questionTypes?: string[]; // Types of questions in this quiz
    [key: string]: any;
  };
}

export interface PdfToQuizOptions {
  questionsPerPage?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  includeExplanations?: boolean;
  generateImages?: boolean;
  language?: string;
  questionTypes?: (
    | 'multiple-choice'
    | 'flashcard'
    | 'true-false'
    | 'fill-in-blank'
    | 'matching'
    | 'multiple-select'
    | 'short-answer'
    | 'ordering'
  )[]; // Types of questions to generate
  quizType?:
    | 'mixed'
    | 'multiple-choice'
    | 'flashcard'
    | 'true-false'
    | 'fill-in-blank'
    | 'matching'
    | 'multiple-select'
    | 'short-answer'
    | 'ordering'; // Overall quiz type
  userId?: string; // User ID for authenticated quiz creation
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

// Type guards for question types
export function isMultipleChoiceQuestion(
  question: QuizQuestion,
): question is MultipleChoiceQuestion {
  return question.type === 'multiple-choice';
}

export function isFlashcardQuestion(
  question: QuizQuestion,
): question is FlashcardQuestion {
  return question.type === 'flashcard';
}

export function isTrueFalseQuestion(
  question: QuizQuestion,
): question is TrueFalseQuestion {
  return question.type === 'true-false';
}

export function isFillInBlankQuestion(
  question: QuizQuestion,
): question is FillInBlankQuestion {
  return question.type === 'fill-in-blank';
}

export function isMatchingQuestion(
  question: QuizQuestion,
): question is MatchingQuestion {
  return question.type === 'matching';
}

export function isMultipleSelectQuestion(
  question: QuizQuestion,
): question is MultipleSelectQuestion {
  return question.type === 'multiple-select';
}

export function isShortAnswerQuestion(
  question: QuizQuestion,
): question is ShortAnswerQuestion {
  return question.type === 'short-answer';
}

export function isOrderingQuestion(
  question: QuizQuestion,
): question is OrderingQuestion {
  return question.type === 'ordering';
}

// Utility functions
export function getQuestionTypes(quiz: Quiz): string[] {
  const types = new Set(quiz.questions.map((q) => q.type));
  return Array.from(types);
}

export function convertLegacyQuestion(
  legacyQuestion: any,
): MultipleChoiceQuestion {
  // Convert old format to new format for backward compatibility
  if (!legacyQuestion.type) {
    return {
      ...legacyQuestion,
      type: 'multiple-choice',
    };
  }
  return legacyQuestion;
}

export function isLegacyQuiz(quiz: any): boolean {
  // Check if quiz follows old format (no version or type field)
  return (
    !quiz.version &&
    !quiz.type &&
    quiz.questions?.length > 0 &&
    !quiz.questions[0].type
  );
}

export function migrateLegacyQuiz(quiz: any): Quiz {
  if (!isLegacyQuiz(quiz)) {
    return quiz;
  }

  return {
    ...quiz,
    version: 2,
    type: 'multiple-choice',
    questions: quiz.questions.map(convertLegacyQuestion),
    metadata: {
      ...quiz.metadata,
      questionTypes: ['multiple-choice'],
    },
  };
}
