<template>
  <div v-if="isStreamingQuiz || streamingQuestions.length > 0" class="w-full max-w-4xl mx-auto mt-6">
    
    <!-- Quiz Ready to Share Section (shown at top when completed) -->
    <div v-if="!isStreamingQuiz && currentQuiz" class="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
      <div class="text-center">
        <div class="flex items-center justify-center mb-4">
          <svg class="h-8 w-8 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <h3 class="text-xl font-semibold text-gray-900">Quiz Ready to Share!</h3>
        </div>
        
        <!-- Share Section -->
        <div v-if="currentShareUrl" class="bg-gray-50 rounded-lg p-4 mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-3">Share this quiz:</label>
          <div class="flex items-center space-x-3">
            <input
              type="text"
              :value="currentShareUrl"
              readonly
              class="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white font-mono"
            />
            <button
              @click="copyToClipboard"
              :disabled="copyingLink"
              class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {{ copyingLink ? 'Copied!' : 'Copy' }}
            </button>
          </div>
        </div>

        <!-- Generation Stats -->
        <div v-if="streamingStats" class="grid grid-cols-3 gap-6 text-center">
          <div class="bg-blue-50 rounded-lg p-4">
            <div class="text-2xl font-bold text-blue-600">{{ streamingStats.totalQuestions }}</div>
            <div class="text-sm text-blue-800 font-medium">Questions</div>
          </div>
          <div class="bg-green-50 rounded-lg p-4">
            <div class="text-2xl font-bold text-green-600">{{ streamingStats.pagesProcessed }}</div>
            <div class="text-sm text-green-800 font-medium">Pages Processed</div>
          </div>
          <div class="bg-purple-50 rounded-lg p-4">
            <div class="text-2xl font-bold text-purple-600">{{ Math.ceil(streamingStats.totalQuestions * 1.5) }}</div>
            <div class="text-sm text-purple-800 font-medium">Est. Minutes</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Progress Header (shown during generation) -->
    <div v-if="isStreamingQuiz" class="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">
          Generating Quiz...
        </h3>
        <div v-if="totalPages > 0" class="text-sm text-gray-500">
          Page {{ currentPage }}/{{ totalPages }}
        </div>
      </div>
      
      <!-- Progress Bar -->
      <div v-if="totalPages > 0" class="w-full bg-gray-200 rounded-full h-3 mb-4">
        <div 
          class="bg-blue-600 h-3 rounded-full transition-all duration-300"
          :style="{ width: `${(currentPage / totalPages) * 100}%` }"
        ></div>
      </div>
      
      <!-- Status Message -->
      <p class="text-sm text-gray-600 mb-4">
        {{ streamingProgress }}
      </p>
      
      <!-- Statistics -->
      <div v-if="streamingQuestions.length > 0" class="flex items-center justify-center space-x-8 text-sm">
        <div class="flex items-center">
          <svg class="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <span class="text-gray-700 font-medium">{{ streamingQuestions.length }} questions generated</span>
        </div>
        <div class="text-xs text-gray-500">
          Share link will be shown when complete
        </div>
      </div>
    </div>

    <!-- Questions Grid -->
    <div v-if="streamingQuestions.length > 0" class="space-y-6">
      <div 
        v-for="(question, index) in streamingQuestions" 
        :key="question.id"
        class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden animate-fade-in"
      >
        <!-- Question Header -->
        <div class="border-b border-gray-200 px-6 py-4">
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
          <h3 class="text-lg font-medium text-gray-900">{{ question.question }}</h3>
        </div>

        <!-- Answer Options -->
        <div class="px-6 py-4">
          <div class="space-y-2 mb-4">
            <div 
              v-for="(option, optionKey) in question.options" 
              :key="optionKey"
              :class="getOptionClass(question, optionKey)"
              class="p-3 rounded cursor-pointer transition-colors border"
              @click="selectAnswer(question.id, optionKey)"
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
          <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
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
          <div v-if="showAnswers[question.id] && question.explanation" class="mt-4 p-3 bg-green-50 rounded border border-green-200">
            <div class="flex items-center mb-2">
              <svg class="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="font-medium text-green-800">
                Correct Answer: {{ question.correctAnswer }}
              </span>
            </div>
            <h5 class="text-sm font-medium text-green-900 mb-2">Explanation:</h5>
            <p class="text-sm text-green-700">{{ question.explanation }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useFileUploadStore } from '~/stores/fileUpload'

const fileUploadStore = useFileUploadStore()
const { 
  isStreamingQuiz, 
  streamingProgress, 
  streamingQuestions, 
  streamingStats,
  currentPage,
  totalPages,
  currentQuiz,
  currentShareUrl
} = storeToRefs(fileUploadStore)

// Local state for showing answers
const showAnswers = ref<Record<string, boolean>>({})
const selectedAnswers = ref<Record<string, string>>({})
const copyingLink = ref(false)

// Reset state when streaming starts
watch(isStreamingQuiz, (isStreaming) => {
  if (isStreaming) {
    showAnswers.value = {}
    selectedAnswers.value = {}
  }
})

// Reset state when questions change (new quiz)
watch(streamingQuestions, (newQuestions, oldQuestions) => {
  if (newQuestions.length === 0 && oldQuestions && oldQuestions.length > 0) {
    showAnswers.value = {}
    selectedAnswers.value = {}
  }
}, { deep: true })

const toggleAnswer = (questionId: string) => {
  showAnswers.value[questionId] = !showAnswers.value[questionId]
}

const selectAnswer = (questionId: string, optionKey: string) => {
  selectedAnswers.value[questionId] = optionKey
  // Also show the answer when user selects
  showAnswers.value[questionId] = true
}

const getOptionClass = (question: any, optionKey: string) => {
  const isSelected = selectedAnswers.value[question.id] === optionKey
  const isCorrect = optionKey === question.correctAnswer
  const showingAnswers = showAnswers.value[question.id]
  
  if (showingAnswers && isCorrect) {
    return 'bg-green-100 border-green-300 border-2'
  } else if (showingAnswers && isSelected && !isCorrect) {
    return 'bg-red-100 border-red-300 border-2'
  } else if (isSelected) {
    return 'bg-blue-100 border-blue-300 border-2'
  }
  return 'bg-gray-50 hover:bg-gray-100 border-gray-200'
}

const copyToClipboard = async () => {
  if (copyingLink.value) return
  
  copyingLink.value = true
  try {
    const success = await fileUploadStore.copyMagicLink()
    if (success) {
      // Keep "Copied!" state for 2 seconds
      setTimeout(() => {
        copyingLink.value = false
      }, 2000)
      console.log('✅ Link copied to clipboard!')
    } else {
      copyingLink.value = false
    }
  } catch (error) {
    console.error('Failed to copy link:', error)
    copyingLink.value = false
  }
}

const getDifficultyClass = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return 'bg-green-100 text-green-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'hard':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}
</style> 