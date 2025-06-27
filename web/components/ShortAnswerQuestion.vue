<template>
  <div 
    :class="containerClass"
    class="border border-gray-200 rounded-lg p-4"
  >
    <!-- Question Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="text-lg">💭</span>
        <span class="text-sm font-medium text-blue-600">Question {{ index + 1 }}</span>
      </div>
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

    <!-- Answer Textarea -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">Your answer:</label>
      <textarea
        v-model="userAnswer"
        :disabled="showAnswers[question.id]"
        @keydown.ctrl.enter="submitAnswer"
        @keydown.meta.enter="submitAnswer"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-y"
        :class="getTextareaClass()"
        rows="4"
        placeholder="Type your detailed answer here... (Ctrl/Cmd + Enter to submit)"
      />
      
      <div class="mt-2 flex justify-between items-center">
        <div class="text-xs text-gray-500">
          {{ userAnswer.length }} characters
        </div>
        <button
          v-if="!showAnswers[question.id]"
          @click="submitAnswer"
          :disabled="!userAnswer.trim()"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Answer
        </button>
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
      
      <!-- Score Display -->
      <div v-if="selectedAnswers[question.id]" class="text-sm text-gray-600">
        <span class="font-medium">{{ keywordScore }}/{{ question.keywords.length }}</span> keywords found
      </div>
    </div>

    <!-- Answer Explanation -->
    <div v-if="showAnswers[question.id]" class="mt-3 p-3 bg-green-50 rounded border border-green-200">
      <div class="flex items-center mb-2">
        <svg class="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <span class="font-medium text-green-800">
          Expected Answer:
        </span>
      </div>
      
      <p class="text-green-700 text-sm mb-3">{{ question.expectedAnswer }}</p>
      
      <!-- Keywords Analysis -->
      <div v-if="question.keywords.length > 0" class="mb-3">
        <h4 class="text-sm font-medium text-green-800 mb-2">Key Terms:</h4>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="keyword in question.keywords"
            :key="keyword"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
            :class="getKeywordClass(keyword)"
          >
            {{ keyword }}
            <span class="ml-1">
              {{ userAnswerContainsKeyword(keyword) ? '✅' : '❌' }}
            </span>
          </span>
        </div>
      </div>
      
      <!-- User's Answer Display -->
      <div v-if="userAnswer" class="border-t border-green-200 pt-3">
        <h4 class="text-sm font-medium text-green-800 mb-2">Your Answer:</h4>
        <p class="text-sm text-gray-700 bg-white p-2 rounded border">{{ userAnswer }}</p>
      </div>
      
      <p v-if="question.explanation" class="text-green-700 text-sm mt-3 border-t border-green-200 pt-3">
        <strong>Explanation:</strong> {{ question.explanation }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ShortAnswerQuestion } from '~/types/api'

interface Props {
  question: ShortAnswerQuestion
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

// Local state for answer
const userAnswer = ref('')

// Computed properties
const keywordScore = computed(() => {
  if (!userAnswer.value) return 0
  const userText = userAnswer.value.toLowerCase()
  return props.question.keywords.filter(keyword => 
    userText.includes(keyword.toLowerCase())
  ).length
})

const isGoodAnswer = computed(() => {
  const minKeywords = Math.ceil(props.question.keywords.length * 0.6) // 60% of keywords
  return keywordScore.value >= minKeywords && userAnswer.value.trim().length >= 20
})

// Methods
const userAnswerContainsKeyword = (keyword: string) => {
  if (!userAnswer.value) return false
  return userAnswer.value.toLowerCase().includes(keyword.toLowerCase())
}

const getKeywordClass = (keyword: string) => {
  if (!userAnswer.value) {
    return 'bg-gray-100 text-gray-700'
  }
  
  return userAnswerContainsKeyword(keyword)
    ? 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-800'
}

const getTextareaClass = () => {
  if (!props.showAnswers[props.question.id] || !userAnswer.value) {
    return ''
  }
  
  return isGoodAnswer.value 
    ? 'border-green-500 bg-green-50' 
    : 'border-yellow-500 bg-yellow-50'
}

const submitAnswer = () => {
  if (!userAnswer.value.trim()) return
  
  // Create scoring object - short answers are scored based on keyword matching
  const questionForScoring = {
    ...props.question,
    correctAnswer: `${keywordScore.value}/${props.question.keywords.length}` // For scoring display
  }
  
  props.selectAnswer(props.question.id, userAnswer.value.trim(), questionForScoring)
}

// Watch for changes in selectedAnswers to update local state
watch(() => props.selectedAnswers[props.question.id], (newAnswer) => {
  if (newAnswer && !userAnswer.value) {
    userAnswer.value = newAnswer
  }
})

// Reset state when question changes
watch(() => props.question.id, () => {
  userAnswer.value = ''
})
</script>