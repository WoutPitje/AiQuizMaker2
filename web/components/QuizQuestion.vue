<template>
  <div 
    :class="containerClass"
    class="border border-gray-200 rounded-lg p-4"
  >
    <!-- Question Header -->
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm font-medium text-blue-600">Question {{ index + 1 }}</span>
      <div class="flex items-center space-x-2">
        <span v-if="question.pageNumber" class="text-xs text-gray-500">Page {{ question.pageNumber }}</span>
        <span 
          class="text-xs px-2 py-1 rounded-full"
          :class="getDifficultyClass(question.difficulty)"
        >
          {{ question.difficulty }}
        </span>
      </div>
    </div>

    <!-- Question Text -->
    <h3 class="text-lg font-medium text-gray-900 mb-4">{{ question.question }}</h3>

    <!-- Options -->
    <div class="space-y-2 mb-4">
      <div
        v-for="(option, optionKey) in question.options"
        :key="optionKey"
        :class="getOptionClass(question, optionKey.toString())"
        class="p-3 rounded cursor-pointer transition-colors border"
        @click="selectAnswer(question.id, optionKey.toString(), question)"
      >
        <div class="flex items-center justify-between">
          <div>
            <span class="font-medium">{{ optionKey }}.</span> {{ option }}
          </div>
          <div v-if="showAnswers[question.id] && optionKey === question.correctAnswer" class="text-green-600">
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Show/Hide Answer Button -->
    <div class="flex items-center justify-between">
      <button
        @click="toggleAnswer(question.id)"
        class="text-blue-600 hover:text-blue-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
      >
        {{ showAnswers[question.id] ? 'Hide Answer' : 'Show Answer' }}
      </button>
      
      <!-- Selected Answer Display -->
      <div v-if="selectedAnswers[question.id]" class="text-sm text-gray-600">
        Your answer: <span class="font-medium">{{ selectedAnswers[question.id] }}</span>
      </div>
    </div>

    <!-- Answer Explanation -->
    <div v-if="showAnswers[question.id]" class="mt-3 p-3 bg-green-50 rounded border border-green-200">
      <div class="flex items-center mb-2">
        <svg class="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <span class="font-medium text-green-800">
          Correct Answer: {{ question.correctAnswer }}
        </span>
      </div>
      <p v-if="question.explanation" class="text-green-700 text-sm">
        {{ question.explanation }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface QuizQuestionProps {
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

defineProps<QuizQuestionProps>()
</script> 