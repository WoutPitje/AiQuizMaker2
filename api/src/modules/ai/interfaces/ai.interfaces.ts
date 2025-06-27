/**
 * Options for generating questions from page content
 */
export interface GenerateQuestionsOptions {
  questionsPerPage?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  includeExplanations?: boolean;
  language?: string;
  questionTypes?: QuestionType[];
  quizType?: QuizType;
}

/**
 * Supported question types
 */
export type QuestionType =
  | 'multiple-choice'
  | 'flashcard'
  | 'true-false'
  | 'fill-in-blank'
  | 'matching'
  | 'multiple-select'
  | 'short-answer'
  | 'ordering';

/**
 * Supported quiz types
 */
export type QuizType =
  | 'mixed'
  | 'multiple-choice'
  | 'flashcard'
  | 'true-false'
  | 'fill-in-blank'
  | 'matching'
  | 'multiple-select'
  | 'short-answer'
  | 'ordering';

/**
 * OpenAI API configuration
 */
export interface OpenAIConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  maxRetries: number;
  retryDelay: number;
}

/**
 * Default OpenAI configuration values
 */
export const DEFAULT_OPENAI_CONFIG: OpenAIConfig = {
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 2000,
  maxRetries: 2,
  retryDelay: 1000,
};

/**
 * Configuration for title generation
 */
export const TITLE_GENERATION_CONFIG: Partial<OpenAIConfig> = {
  temperature: 0.3,
  maxTokens: 100,
};

/**
 * Configuration for description generation
 */
export const DESCRIPTION_GENERATION_CONFIG: Partial<OpenAIConfig> = {
  temperature: 0.4,
  maxTokens: 200,
};

/**
 * Content limits for AI processing
 */
export const CONTENT_LIMITS = {
  TITLE_GENERATION: 2000,
  DESCRIPTION_GENERATION: 3000,
} as const;