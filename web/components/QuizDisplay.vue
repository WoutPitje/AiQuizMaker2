<template>
  <div v-if="currentQuiz" class="w-full max-w-4xl mx-auto mt-8 bg-white rounded-lg shadow-lg p-6">
    <!-- Quiz Header -->
    <div class="border-b border-gray-200 pb-4 mb-6">
      <h2 class="text-2xl font-bold text-gray-900">{{ currentQuiz.title }}</h2>
      <p class="text-gray-600 mt-1">{{ currentQuiz.description }}</p>
      <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500">
        <span>📄 {{ currentQuiz.metadata.totalPages }} pages</span>
        <span>⏱️ {{ currentQuiz.metadata.estimatedDuration }} minutes</span>
        <span>❓ {{ currentQuiz.questions.length }} questions</span>
        <span v-if="currentQuiz.metadata.language">🌐 {{ getLanguageDisplayName(currentQuiz.metadata.language) }}</span>
      </div>
      
      <!-- Magic Link Sharing -->
      <QuizShareSection
        :share-url="currentShareUrl"
        :is-copying="copyingLink"
        :on-copy-click="copyShareUrl"
      />
    </div>

    <!-- Score Card -->
    <QuizScoreCard
      v-if="currentQuiz"
      :total-answered="totalAnswered"
      :total-correct="totalCorrect"
      :score-percentage="scorePercentage"
      :score-color="getScoreColor"
      :total-questions="currentQuiz.questions.length"
    />

    <!-- Questions -->
    <div class="space-y-6">
      <QuizQuestion
        v-for="(question, index) in currentQuiz.questions"
        :key="question.id"
        :question="question"
        :index="index"
        :show-answers="showAnswers"
        :selected-answers="selectedAnswers"
        :select-answer="selectAnswer"
        :toggle-answer="toggleAnswer"
        :get-option-class="getOptionClass"
        :get-difficulty-class="getDifficultyClass"
      />
    </div>

    <!-- Quiz Actions -->
    <div class="flex justify-center mt-8 pt-6 border-t border-gray-200">
      <button
        v-if="currentShareUrl"
        @click="copyShareUrl"
        :disabled="copyingLink"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {{ copyingLink ? 'Copied!' : 'Share Quiz' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useFileUploadStore } from '~/stores/fileUpload'
import { useQuizInteractions } from '~/composables/useQuizInteractions'
import QuizQuestion from '~/components/QuizQuestion.vue'
import QuizShareSection from '~/components/QuizShareSection.vue'
import QuizScoreCard from '~/components/QuizScoreCard.vue'

const fileUploadStore = useFileUploadStore()
const { currentQuiz, currentShareUrl } = storeToRefs(fileUploadStore)

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
  copyShareUrl,
  getLanguageDisplayName
} = useQuizInteractions()

// Debug watcher
watch(currentQuiz, (newQuiz, oldQuiz) => {
  console.log('🔍 QuizDisplay: Quiz state changed')
  console.log('📊 New quiz:', newQuiz)
  console.log('📊 Old quiz:', oldQuiz)
}, { immediate: true })

const clearQuiz = () => {
  fileUploadStore.clearQuiz()
  resetInteractionState()
}
</script> 