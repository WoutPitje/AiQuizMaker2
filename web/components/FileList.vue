<template>
  <div v-if="hasUploadedFile" class="w-full max-w-2xl mx-auto mt-8">
    <h2 class="text-xl font-semibold text-gray-900 mb-4">
      Uploaded PDF File
    </h2>
    
    <!-- Language Selection -->
    <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
      <label class="block text-sm font-medium text-blue-900 mb-2">
        🌐 Quiz Language
      </label>
      <select 
        :value="selectedLanguage"
        @change="handleLanguageChange($event)"
        :disabled="isGeneratingQuiz"
        class="w-full px-3 py-2 border border-blue-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option 
          v-for="language in supportedLanguages" 
          :key="language.code" 
          :value="language.code"
        >
          {{ language.name }}
        </option>
      </select>
      <p class="text-xs text-blue-700 mt-1">
        Questions and answers will be generated in the selected language
      </p>
    </div>

    <!-- Quiz Limit Notice - only show if authenticated or if anonymous with remaining quota -->
    <div v-if="quizLimitInfo && (authStore.isLoggedIn || quizLimitInfo.allowed)" class="mb-6 p-4 rounded-md" :class="quizLimitInfo.allowed ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg v-if="quizLimitInfo.allowed" class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          <svg v-else class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium" :class="quizLimitInfo.allowed ? 'text-blue-800' : 'text-red-800'">
            {{ authStore.isLoggedIn ? 'Authenticated User' : 'Anonymous User' }} - Quiz Limit {{ quizLimitInfo.current }}/{{ quizLimitInfo.limit }}
          </h3>
          <div class="mt-2 text-sm" :class="quizLimitInfo.allowed ? 'text-blue-700' : 'text-red-700'">
            <p v-if="quizLimitInfo.allowed">
              You can create {{ quizLimitInfo.limit - quizLimitInfo.current }} more quiz{{ quizLimitInfo.limit - quizLimitInfo.current === 1 ? '' : 's' }}.
              {{ !authStore.isLoggedIn ? 'Anonymous users get 1 quiz per day with multiple-choice questions only.' : 'Authenticated users get 3 quizzes with all question types.' }}
            </p>
            <p v-else>
              {{ quizLimitInfo.message }}
            </p>
            <p v-if="!authStore.isLoggedIn && quizLimitInfo.allowed" class="mt-1">
              <NuxtLink to="/login" class="font-medium underline hover:text-blue-900">Sign in</NuxtLink> 
              or 
              <NuxtLink to="/register" class="font-medium underline hover:text-blue-900">create an account</NuxtLink> 
              for higher limits and advanced features.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Quiz Generation Options -->
    <div class="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-medium text-gray-900">📋 Quiz Options</h4>
        <span v-if="!authStore.isLoggedIn" class="text-xs text-amber-600 font-medium">Limited Options</span>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Questions per page -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Questions per page
          </label>
          <select 
            v-model="questionsPerPage" 
            :disabled="isGeneratingQuiz"
            class="w-full px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="1">1 question</option>
            <option value="2">2 questions</option>
            <option value="3">3 questions</option>
            <option value="4">4 questions</option>
            <option value="5">5 questions</option>
          </select>
        </div>

        <!-- Question Type -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Question Type
            <span v-if="!authStore.isLoggedIn" class="text-amber-600">🔒 (Limited)</span>
          </label>
          <select 
            v-model="questionType" 
            :disabled="isGeneratingQuiz || !authStore.isLoggedIn"
            class="w-full px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="multiple-choice">🔘 Multiple Choice</option>
            <option v-if="authStore.isLoggedIn" value="flashcard">🃏 Flashcards</option>
            <option v-if="authStore.isLoggedIn" value="true-false">✅ True/False</option>
            <option v-if="authStore.isLoggedIn" value="fill-in-blank">📝 Fill in the Blank</option>
            <option v-if="authStore.isLoggedIn" value="short-answer">💭 Short Answer</option>
            <option v-if="authStore.isLoggedIn" value="matching">🔗 Matching</option>
            <option v-if="authStore.isLoggedIn" value="mixed">🎯 Mixed Types</option>
          </select>
          <p v-if="!authStore.isLoggedIn" class="text-xs text-amber-600 mt-1">
            Sign in to unlock all question types
          </p>
        </div>

        <!-- Difficulty -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Difficulty
          </label>
          <select 
            v-model="difficulty" 
            :disabled="isGeneratingQuiz"
            class="w-full px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="mixed">Mixed</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <!-- Explanations -->
        <div class="md:col-span-2 flex items-center justify-center mt-2">
          <div class="flex items-center">
            <input 
              id="includeExplanations" 
              type="checkbox" 
              v-model="includeExplanations"
              :disabled="isGeneratingQuiz"
              class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
            <label for="includeExplanations" class="ml-2 text-xs font-medium text-gray-700">
              Include explanations
            </label>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Single File Display -->
    <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3 flex-1 min-w-0">
          <!-- PDF Icon -->
          <div class="flex-shrink-0">
            <svg
              class="h-8 w-8 text-red-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              <path d="M8,12V14H10V18H12V14H14V12H8M8,16V18H10V16H8Z" />
            </svg>
          </div>
          
          <!-- File Details -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ uploadedFile.originalname }}
            </p>
            <div class="flex items-center space-x-4 text-xs text-gray-500">
              <span>{{ formatFileSize(uploadedFile.size) }}</span>
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                📄 PDF
              </span>
              <span>{{ formatDate(uploadedFile.uploadedAt) }}</span>
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex items-center space-x-2">
          <!-- Generate Live Quiz Button - only show if no quiz has been generated or if currently generating -->
          <button
            v-if="!hasGeneratedQuiz"
            @click="handleGenerateQuiz"
            :disabled="isGeneratingQuiz"
            class="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
           
            {{ isGeneratingQuiz ? 'Generating...' : 'Generate Quiz ⚡' }}
          </button>
          
          <!-- Start New Quiz Button - only show after quiz generation is complete -->
          <button
            v-if="hasGeneratedQuiz && !isGeneratingQuiz"
            @click="handleStartNewQuiz"
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            🔄 Start New Quiz
          </button>
          
          <button
            @click="handleRemoveFile"
            :disabled="isGeneratingQuiz"
            class="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Remove PDF file"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Success Message after Quiz Generation -->
    <div v-if="hasGeneratedQuiz && !isGeneratingQuiz" class="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
      <div class="flex items-center">
        <svg class="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <div>
          <p class="text-sm font-medium text-green-800">
            Quiz generated successfully!
          </p>
          <p class="text-xs text-green-600 mt-1">
            Your interactive quiz is ready. Scroll down to view questions or use the "Start New Quiz" button to create another quiz with different options.
          </p>
        </div>
      </div>
    </div>
    
    <!-- Warning Message -->
    <div v-if="isGeneratingQuiz" class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
      <div class="flex items-center">
        <svg class="h-5 w-5 text-blue-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
        <div>
          <p class="text-sm font-medium text-blue-800">
            Generating your quiz with live updates...
          </p>
          <p class="text-xs text-blue-600 mt-1">
            Questions will appear as they're created. Share link will be shown when generation is complete.
          </p>
        </div>
      </div>
    </div>

    <!-- Streaming Quiz Display -->
    <StreamingQuizDisplay />

    <!-- Quiz Limit Modal -->
    <QuizLimitModal 
      :show="showLimitModal" 
      @close="showLimitModal = false" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const fileUploadStore = useFileUploadStore()
const authStore = useAuthStore()
const { checkQuizLimit } = useAuth()

// Store state
const { uploadedFile, hasUploadedFile, isGeneratingQuiz, supportedLanguages, selectedLanguage, hasGeneratedQuiz } = storeToRefs(fileUploadStore)

// Quiz limit state
const quizLimitInfo = ref<any>(null)
const showLimitModal = ref(false)

// Quiz generation options
const questionsPerPage = ref<number>(2)
const questionType = ref<string>('multiple-choice')
const difficulty = ref<string>('mixed')
const includeExplanations = ref<boolean>(true)

// Load quiz limit information on component mount and when auth state changes
const fetchQuizLimit = async () => {
  try {
    const response = await checkQuizLimit()
    quizLimitInfo.value = response
  } catch (error) {
    console.error('Failed to fetch quiz limit:', error)
    quizLimitInfo.value = null
  }
}

// Watch for authentication changes and enforce restrictions for anonymous users
watch(() => authStore.isLoggedIn, (isLoggedIn) => {
  if (!isLoggedIn) {
    // Force anonymous users to multiple-choice only
    questionType.value = 'multiple-choice'
  }
  // Refetch quiz limit when auth status changes
  fetchQuizLimit()
}, { immediate: true })

onMounted(() => {
  fetchQuizLimit()
})

// Utility functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

// Actions
const handleLanguageChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  fileUploadStore.setLanguage(target.value)
}

const handleRemoveFile = () => {
  if (isGeneratingQuiz.value) {
    return
  }
  fileUploadStore.removeFile()
}

// Handle quiz generation button click
const handleGenerateQuiz = async () => {
  if (!uploadedFile.value) return
  
  // Check quota before generation
  await fetchQuizLimit()
  if (quizLimitInfo.value && !quizLimitInfo.value.allowed) {
    console.warn('Quiz generation blocked: limit exceeded')
    
    // Show modal for anonymous users who hit the limit
    if (!authStore.isLoggedIn) {
      showLimitModal.value = true
    }
    return
  }
  
  // If quota allows, proceed with generation
  await generateQuizStream()
}

// Streaming quiz generation
const generateQuizStream = async () => {
  if (!uploadedFile.value) return
  
  const options = {
    questionsPerPage: questionsPerPage.value,
    difficulty: difficulty.value as 'easy' | 'medium' | 'hard' | 'mixed',
    includeExplanations: includeExplanations.value,
    quizType: questionType.value as 'multiple-choice' | 'flashcard' | 'true-false' | 'fill-in-blank' | 'short-answer' | 'matching' | 'mixed',
    questionTypes: questionType.value === 'mixed' ? ['multiple-choice', 'flashcard', 'true-false', 'fill-in-blank', 'short-answer', 'matching'] : [questionType.value]
  }
  
  console.log('🎯 Starting streaming quiz generation with options:', options)
  console.log('🌐 Language:', selectedLanguage.value)
  
  await fileUploadStore.generateQuizStream(uploadedFile.value.filename, options)
  
  // Refresh quota after generation
  await fetchQuizLimit()
}

const handleStartNewQuiz = () => {
  // Call the store action to start a new quiz
  fileUploadStore.startNewQuiz()
}
</script> 