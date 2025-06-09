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
              @click="copyShareUrl"
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
        <div v-if="streamingStats" class="grid grid-cols-3 gap-6 text-center mb-6">
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
        
        <!-- Action Buttons -->
        <div class="flex justify-center space-x-4">
          <button
            @click="scrollToTop"
            class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            ⬆️ Back to Top
          </button>
          <button
            @click="handleStartOver"
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            🔄 Create New Quiz
          </button>
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

    <!-- Score Card -->
    <QuizScoreCard
      v-if="streamingQuestions.length > 0"
      :total-answered="totalAnswered"
      :total-correct="totalCorrect"
      :score-percentage="scorePercentage"
      :score-color="getScoreColor"
      :total-questions="streamingQuestions.length"
    />

    <!-- Questions Grid -->
    <div v-if="streamingQuestions.length > 0" class="space-y-6">
      <QuizQuestion
        v-for="(question, index) in streamingQuestions" 
        :key="question.id"
        :question="question"
        :index="index"
        container-class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden animate-fade-in"
        :show-answers="showAnswers"
        :selected-answers="selectedAnswers"
        :select-answer="selectAnswer"
        :toggle-answer="toggleAnswer"
        :get-option-class="getOptionClass"
        :get-difficulty-class="getDifficultyClass"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useFileUploadStore } from '~/stores/fileUpload'
import { useQuizInteractions } from '~/composables/useQuizInteractions'
import QuizQuestion from '~/components/QuizQuestion.vue'
import QuizScoreCard from '~/components/QuizScoreCard.vue'

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

// Use shared quiz interactions composable
const {
  showAnswers,
  selectedAnswers,
  copyingLink,
  answeredQuestions,
  correctAnswers,
  totalAnswered,
  totalCorrect,
  scorePercentage,
  getScoreColor,
  resetInteractionState,
  toggleAnswer,
  selectAnswer,
  getOptionClass,
  getDifficultyClass,
  copyShareUrl
} = useQuizInteractions()

// Reset state when streaming starts
watch(isStreamingQuiz, (isStreaming) => {
  if (isStreaming) {
    resetInteractionState()
  }
})

// Reset state when questions change (new quiz)
watch(streamingQuestions, (newQuestions, oldQuestions) => {
  if (newQuestions.length === 0 && oldQuestions && oldQuestions.length > 0) {
    resetInteractionState()
  }
}, { deep: true })

// Utility functions
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleStartOver = () => {
  // Go back to the file upload section and clear current quiz
  fileUploadStore.startNewQuiz()
  scrollToTop()
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