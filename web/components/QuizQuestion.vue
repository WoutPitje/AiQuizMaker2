<template>
  <div>
    <!-- Multiple Choice Question -->
    <MultipleChoiceQuestion
      v-if="isMultipleChoice(typedQuestion)"
      :question="typedQuestion"
      :index="index"
      :container-class="containerClass"
      :show-answers="showAnswers"
      :selected-answers="selectedAnswers"
      :select-answer="selectAnswer"
      :toggle-answer="toggleAnswer"
      :get-option-class="getOptionClass"
      :get-difficulty-class="getDifficultyClass"
    />

    <!-- Flashcard Question -->
    <FlashcardQuestion
      v-else-if="isFlashcard(typedQuestion)"
      :question="typedQuestion"
      :index="index"
      :container-class="containerClass"
      :show-answers="showAnswers"
      :selected-answers="selectedAnswers"
      :select-answer="selectAnswer"
      :toggle-answer="toggleAnswer"
      :get-option-class="getOptionClass"
      :get-difficulty-class="getDifficultyClass"
      :show-self-assessment="true"
      :show-explanation="true"
      @self-assessment="handleSelfAssessment"
    />

    <!-- True/False Question -->
    <TrueFalseQuestion
      v-else-if="isTrueFalse(typedQuestion)"
      :question="typedQuestion"
      :index="index"
      :container-class="containerClass"
      :show-answers="showAnswers"
      :selected-answers="selectedAnswers"
      :select-answer="selectAnswer"
      :toggle-answer="toggleAnswer"
      :get-option-class="getOptionClass"
      :get-difficulty-class="getDifficultyClass"
    />

    <!-- Fill-in-the-Blank Question -->
    <FillInTheBlankQuestion
      v-else-if="isFillInTheBlank(typedQuestion)"
      :question="typedQuestion"
      :index="index"
      :container-class="containerClass"
      :show-answers="showAnswers"
      :selected-answers="selectedAnswers"
      :select-answer="selectAnswer"
      :toggle-answer="toggleAnswer"
      :get-option-class="getOptionClass"
      :get-difficulty-class="getDifficultyClass"
    />

    <!-- Short Answer Question -->
    <ShortAnswerQuestion
      v-else-if="isShortAnswer(typedQuestion)"
      :question="typedQuestion"
      :index="index"
      :container-class="containerClass"
      :show-answers="showAnswers"
      :selected-answers="selectedAnswers"
      :select-answer="selectAnswer"
      :toggle-answer="toggleAnswer"
      :get-option-class="getOptionClass"
      :get-difficulty-class="getDifficultyClass"
    />

    <!-- Matching Question -->
    <MatchingQuestion
      v-else-if="isMatching(typedQuestion)"
      :question="typedQuestion"
      :index="index"
      :container-class="containerClass"
      :show-answers="showAnswers"
      :selected-answers="selectedAnswers"
      :select-answer="selectAnswer"
      :toggle-answer="toggleAnswer"
      :get-option-class="getOptionClass"
      :get-difficulty-class="getDifficultyClass"
    />

    <!-- Fallback for unknown question types -->
    <div v-else class="border border-red-200 rounded-lg p-4 bg-red-50">
      <div class="flex items-center gap-2 text-red-600 mb-2">
        <span>⚠️</span>
        <span class="font-medium">Unknown Question Type</span>
      </div>
      <p class="text-sm text-red-700">
        Question type "{{ typedQuestion.type }}" is not supported yet.
      </p>
      <details class="mt-2">
        <summary class="text-xs text-red-600 cursor-pointer">Debug Info</summary>
        <pre class="text-xs text-red-600 mt-1 overflow-auto">{{ JSON.stringify(typedQuestion, null, 2) }}</pre>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QuizQuestion } from '~/types/api'
import { isMultipleChoice, isFlashcard, isTrueFalse, isFillInTheBlank, isShortAnswer, isMatching, ensureQuestionType } from '~/utils/questionTypes'

interface Props {
  question: any
  index: number
  containerClass?: string
  showAnswers: Record<string, boolean>
  selectedAnswers: Record<string, string>
  selectAnswer: (questionId: string, optionKey: string, question: any) => void
  toggleAnswer: (questionId: string) => void
  getOptionClass: (question: any, optionKey: string) => string
  getDifficultyClass: (difficulty: string) => string
}

const props = defineProps<Props>()

// Ensure the question has a proper type
const typedQuestion = computed(() => ensureQuestionType(props.question))

// Handle flashcard self-assessment
const handleSelfAssessment = (questionId: string, rating: number) => {
  // The FlashcardQuestion component now handles integration with selectAnswer internally
  console.log('Flashcard self-assessment:', questionId, rating)
}</script> 