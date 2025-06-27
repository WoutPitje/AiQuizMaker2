import type { QuizQuestion, MultipleChoiceQuestion, FlashcardQuestion, TrueFalseQuestion, FillInTheBlankQuestion, ShortAnswerQuestion, MatchingQuestion } from '~/types/api'

// Type guard functions
export function isMultipleChoice(question: QuizQuestion): question is MultipleChoiceQuestion {
  return question.type === 'multiple-choice' || !('type' in question)
}

export function isFlashcard(question: QuizQuestion): question is FlashcardQuestion {
  return question.type === 'flashcard'
}

export function isTrueFalse(question: QuizQuestion): question is TrueFalseQuestion {
  return question.type === 'true-false'
}

export function isFillInTheBlank(question: QuizQuestion): question is FillInTheBlankQuestion {
  return question.type === 'fill-in-blank'
}

export function isShortAnswer(question: QuizQuestion): question is ShortAnswerQuestion {
  return question.type === 'short-answer'
}

export function isMatching(question: QuizQuestion): question is MatchingQuestion {
  return question.type === 'matching'
}

// Helper function to migrate legacy questions that don't have a type field
export function ensureQuestionType(question: any): QuizQuestion {
  if (!question.type) {
    // Legacy question - assume multiple choice
    return {
      ...question,
      type: 'multiple-choice'
    } as MultipleChoiceQuestion
  }
  return question as QuizQuestion
}

// Get display name for question types
export function getQuestionTypeDisplayName(type: string): string {
  const typeNames: Record<string, string> = {
    'multiple-choice': 'Multiple Choice',
    'flashcard': 'Flashcards',
    'true-false': 'True/False',
    'fill-in-blank': 'Fill in the Blank',
    'matching': 'Matching',
    'multiple-select': 'Multiple Select',
    'short-answer': 'Short Answer',
    'ordering': 'Ordering'
  }
  return typeNames[type] || type
}

// Get icon for question types
export function getQuestionTypeIcon(type: string): string {
  const typeIcons: Record<string, string> = {
    'multiple-choice': '🔘',
    'flashcard': '🃏',
    'true-false': '✅',
    'fill-in-blank': '📝',
    'matching': '🔗',
    'multiple-select': '☑️',
    'short-answer': '💭',
    'ordering': '📋'
  }
  return typeIcons[type] || '❓'
}