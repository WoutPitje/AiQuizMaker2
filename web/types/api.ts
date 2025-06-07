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

export interface QuizQuestion {
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
}

export interface QuizResponse {
  success: boolean
  message: string
  quiz?: Quiz
  magicLink?: string
  shareUrl?: string
  error?: string
} 