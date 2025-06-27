export interface UploadResponse {
  success: boolean
  message: string
  file?: {
    filename: string
    originalname: string
    mimetype: string
    size: number
    path: string
  }
  error?: string
}

export interface Language {
  code: string
  name: string
}

export interface LanguagesResponse {
  success: boolean
  languages: Language[]
  count: number
  error?: string
}

export interface ConfigResponse {
  success: boolean
  config: {
    maxPdfSize: number
    maxPdfSizeMB: number
    maxPagesPerPdf: number
    defaultQuestionsPerPage: number
    supportedLanguages: Language[]
  }
}

export interface FileUploadState {
  isUploading: boolean
  uploadProgress: number
  error: string | null
  uploadedFile: UploadedFile | null
}

export interface UploadedFile {
  id: string
  filename: string
  originalname: string
  size: number
  uploadedAt: Date
}

// Base interface for all question types
export interface BaseQuestion {
  id: string
  type: string
  difficulty: 'easy' | 'medium' | 'hard'
  explanation: string
  pageNumber: number
  language?: string
}

// Multiple choice question (original format)
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice'
  question: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  correctAnswer: 'A' | 'B' | 'C' | 'D'
}

// Flashcard question
export interface FlashcardQuestion extends BaseQuestion {
  type: 'flashcard'
  front: string
  back: string
}

// True/False question
export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true-false'
  statement: string
  correctAnswer: boolean
}

// Fill-in-the-Blank question
export interface FillInTheBlankQuestion extends BaseQuestion {
  type: 'fill-in-blank'
  text: string // Text with blanks marked as {{blank}}
  blanks: string[] // Correct answers for each blank
}

// Short Answer question
export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short-answer'
  question: string
  expectedAnswer: string
  keywords: string[] // Key terms that should be in the answer
}

// Matching question
export interface MatchingQuestion extends BaseQuestion {
  type: 'matching'
  leftItems: { id: string; text: string }[]
  rightItems: { id: string; text: string }[]
  correctPairs: { leftId: string; rightId: string }[]
}

// Union type for all question types
export type QuizQuestion = MultipleChoiceQuestion | FlashcardQuestion | TrueFalseQuestion | FillInTheBlankQuestion | ShortAnswerQuestion | MatchingQuestion

// Legacy interface for backward compatibility
export interface LegacyQuizQuestion {
  id: string
  question: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  correctAnswer: 'A' | 'B' | 'C' | 'D'
  difficulty: 'easy' | 'medium' | 'hard'
  explanation: string
  pageNumber: number
  language?: string
}

export interface Quiz {
  id: string
  title: string
  description: string
  questions: QuizQuestion[]
  magicLink?: string
  metadata: {
    sourceFile: string
    totalPages: number
    createdAt: Date
    estimatedDuration: number
    language?: string
    questionsPerPage?: number
    difficulty?: string
    magicLink?: string
    savedAt?: Date
  }
}

export interface QuizGenerationOptions {
  questionsPerPage?: number
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed'
  includeExplanations?: boolean
  language?: string
  questionTypes?: string[]
  quizType?: 'mixed' | 'multiple-choice' | 'flashcard' | 'true-false'
}

export interface QuizResponse {
  success: boolean
  message: string
  quiz?: Quiz
  magicLink?: string
  shareUrl?: string
  error?: string
} 