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
      <div v-if="currentShareUrl" class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <svg class="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
            </svg>
            <div>
              <p class="text-sm font-medium text-blue-900">Share this quiz</p>
              <p class="text-xs text-blue-700">Anyone with this link can access the quiz</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="copyShareUrl"
              :disabled="copyingLink"
              class="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              {{ copyingLink ? 'Copied!' : 'Copy Link' }}
            </button>
          </div>
        </div>
        <div class="mt-2">
          <input
            :value="currentShareUrl"
            readonly
            class="w-full px-2 py-1 text-xs bg-white border border-blue-200 rounded text-gray-600 font-mono"
            @click="$event.target.select()"
          />
        </div>
      </div>
    </div>

    <!-- Questions -->
    <div class="space-y-6">
      <div
        v-for="(question, index) in currentQuiz.questions"
        :key="question.id"
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
    </div>

    <!-- Quiz Actions -->
    <div class="flex justify-center space-x-4 mt-8 pt-6 border-t border-gray-200">
      <button
        v-if="currentShareUrl"
        @click="copyShareUrl"
        :disabled="copyingLink"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {{ copyingLink ? 'Copied!' : 'Share Quiz' }}
      </button>
      <button
        @click="clearQuiz"
        class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
      >
        Close Quiz
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useFileUploadStore } from '~/stores/fileUpload'

const fileUploadStore = useFileUploadStore()
const { currentQuiz, currentShareUrl } = storeToRefs(fileUploadStore)

// Debug watcher
watch(currentQuiz, (newQuiz, oldQuiz) => {
  console.log('🔍 QuizDisplay: Quiz state changed')
  console.log('📊 New quiz:', newQuiz)
  console.log('📊 Old quiz:', oldQuiz)
}, { immediate: true })

const showAnswers = ref<Record<string, boolean>>({})
const selectedAnswers = ref<Record<string, string>>({})
const copyingLink = ref(false)

const selectAnswer = (questionId: string, optionKey: string) => {
  selectedAnswers.value[questionId] = optionKey
  // Also show the answer when user selects
  showAnswers.value[questionId] = true
}

const toggleAnswer = (questionId: string) => {
  showAnswers.value[questionId] = !showAnswers.value[questionId]
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

const getLanguageDisplayName = (languageCode: string): string => {
  // Fallback function since getLanguageName might not be available
  try {
    return fileUploadStore.getLanguageName(languageCode)
  } catch (error) {
    console.warn('getLanguageName not available, using fallback')
    // Fallback language names
    const languageNames: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish', 
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'da': 'Danish',
      'no': 'Norwegian'
    }
    return languageNames[languageCode] || languageCode.toUpperCase()
  }
}

const copyShareUrl = async () => {
  if (copyingLink.value) return
  
  copyingLink.value = true
  try {
    const success = await fileUploadStore.copyMagicLink()
    if (success) {
      // Keep "Copied!" state for 2 seconds
      setTimeout(() => {
        copyingLink.value = false
      }, 2000)
    } else {
      copyingLink.value = false
    }
  } catch (error) {
    console.error('Failed to copy link:', error)
    copyingLink.value = false
  }
}

const clearQuiz = () => {
  fileUploadStore.clearQuiz()
  showAnswers.value = {}
  selectedAnswers.value = {}
}
</script> 