<template>
  <div 
    :class="containerClass"
    class="border border-gray-200 rounded-lg p-4"
  >
    <!-- Question Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="text-lg">📝</span>
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

    <!-- Question Text with Blanks -->
    <div class="mb-4">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Fill in the blanks:</h3>
      
      <!-- Show error if no blanks found -->
      <div v-if="!hasValidBlanks" class="p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
        <div class="flex items-center">
          <span class="text-yellow-600 mr-2">⚠️</span>
          <div>
            <p class="text-sm font-medium text-yellow-800">Invalid fill-in-the-blank question</p>
            <p class="text-xs text-yellow-700">This question doesn't contain any blanks to fill. The AI may have generated it incorrectly.</p>
          </div>
        </div>
      </div>
      
      <div v-if="hasValidBlanks" class="text-lg leading-relaxed">
        <template v-for="(part, index) in textParts" :key="index">
          <span v-if="part.type === 'text'">{{ part.content }}</span>
          <input
            v-else-if="part.type === 'blank'"
            v-model="userAnswers[part.blankIndex]"
            type="text"
            :disabled="showAnswers[question.id]"
            @keyup.enter="submitAnswers"
            class="inline-block mx-1 px-2 py-1 border-b-2 border-blue-300 focus:border-blue-500 focus:outline-none bg-transparent min-w-[100px]"
            :class="getBlankClass(part.blankIndex)"
            :placeholder="`Blank ${part.blankIndex + 1}`"
          />
        </template>
      </div>
      
      <!-- Show raw text if no blanks for debugging -->
      <div v-else class="text-lg leading-relaxed p-3 bg-gray-50 rounded">
        <p class="text-gray-700">{{ question.text }}</p>
        <details class="mt-2">
          <summary class="text-xs text-gray-500 cursor-pointer">Debug Info</summary>
          <pre class="text-xs text-gray-600 mt-1">{{ JSON.stringify(question, null, 2) }}</pre>
        </details>
      </div>
      
      <div v-if="hasValidBlanks" class="mt-4 flex justify-end">
        <button
          v-if="!showAnswers[question.id]"
          @click="submitAnswers"
          :disabled="!hasAllAnswers"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Answers
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
        Score: <span class="font-medium">{{ correctBlanks }}/{{ question.blanks.length }}</span>
      </div>
    </div>

    <!-- Answer Explanation -->
    <div v-if="showAnswers[question.id]" class="mt-3 p-3 bg-green-50 rounded border border-green-200">
      <div class="flex items-center mb-2">
        <svg class="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <span class="font-medium text-green-800">
          Correct Answers:
        </span>
      </div>
      
      <!-- Show correct answers for each blank -->
      <div class="mb-2">
        <template v-for="(blank, index) in question.blanks" :key="index">
          <div class="text-sm text-green-700 mb-1">
            Blank {{ index + 1 }}: <span class="font-medium">{{ blank }}</span>
            <span v-if="userAnswers[index]" class="ml-2">
              {{ isBlankCorrect(index) ? '✅' : '❌' }}
            </span>
          </div>
        </template>
      </div>
      
      <p v-if="question.explanation" class="text-green-700 text-sm">
        {{ question.explanation }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FillInTheBlankQuestion } from '~/types/api'

interface Props {
  question: FillInTheBlankQuestion
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

// Local state for multiple answers
const userAnswers = ref<string[]>([])

// Parse the text to separate text and blank parts
const textParts = computed(() => {
  const parts: Array<{type: 'text' | 'blank', content?: string, blankIndex?: number}> = []
  const text = props.question.text || ''
  
  let currentIndex = 0
  let blankIndex = 0
  
  // Split by {{blank}} markers
  const sections = text.split(/\{\{blank\}\}/)
  
  for (let i = 0; i < sections.length; i++) {
    if (sections[i]) {
      parts.push({ type: 'text', content: sections[i] })
    }
    
    // Add blank after each section except the last
    if (i < sections.length - 1) {
      parts.push({ type: 'blank', blankIndex: blankIndex++ })
    }
  }
  
  return parts
})

// Initialize user answers array
watch(() => props.question.blanks, () => {
  userAnswers.value = new Array(props.question.blanks.length).fill('')
}, { immediate: true })

// Computed properties
const hasValidBlanks = computed(() => {
  return textParts.value.some(part => part.type === 'blank')
})

const hasAllAnswers = computed(() => {
  return userAnswers.value.every(answer => answer.trim() !== '')
})

const correctBlanks = computed(() => {
  return userAnswers.value.filter((answer, index) => 
    answer.toLowerCase().trim() === props.question.blanks[index]?.toLowerCase().trim()
  ).length
})

const isAllCorrect = computed(() => {
  return correctBlanks.value === props.question.blanks.length
})

// Methods
const isBlankCorrect = (blankIndex: number) => {
  const userAnswer = userAnswers.value[blankIndex]?.toLowerCase().trim()
  const correctAnswer = props.question.blanks[blankIndex]?.toLowerCase().trim()
  return userAnswer === correctAnswer
}

const getBlankClass = (blankIndex: number) => {
  if (!props.showAnswers[props.question.id] || !userAnswers.value[blankIndex]) {
    return 'border-blue-300'
  }
  
  return isBlankCorrect(blankIndex) 
    ? 'border-green-500 bg-green-50' 
    : 'border-red-500 bg-red-50'
}

const submitAnswers = () => {
  if (!hasAllAnswers.value) return
  
  // Join all answers with separator for scoring
  const combinedAnswer = userAnswers.value.join('|')
  const combinedCorrect = props.question.blanks.join('|')
  
  // Create scoring object
  const questionForScoring = {
    ...props.question,
    correctAnswer: combinedCorrect
  }
  
  props.selectAnswer(props.question.id, combinedAnswer, questionForScoring)
}

// Watch for changes in selectedAnswers to update local state
watch(() => props.selectedAnswers[props.question.id], (newAnswer) => {
  if (newAnswer && userAnswers.value.every(a => !a)) {
    userAnswers.value = newAnswer.split('|')
  }
})

// Reset state when question changes
watch(() => props.question.id, () => {
  userAnswers.value = new Array(props.question.blanks.length).fill('')
})
</script>