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

    <!-- Quiz Generation Options -->
    <div class="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
      <h4 class="text-sm font-medium text-gray-900 mb-3">📋 Quiz Options</h4>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <div class="flex items-center mt-4">
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
          <!-- Generate Live Quiz Button -->
          <button
            @click="generateQuizStream"
            :disabled="isGeneratingQuiz"
            class="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
           
            {{ isGeneratingQuiz ? 'Generating...' : 'Generate Quiz ⚡' }}
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const fileUploadStore = useFileUploadStore()

// Store state
const { uploadedFile, hasUploadedFile, isGeneratingQuiz, supportedLanguages, selectedLanguage } = storeToRefs(fileUploadStore)

// Quiz generation options
const questionsPerPage = ref<number>(2)
const difficulty = ref<string>('mixed')
const includeExplanations = ref<boolean>(true)

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

// Streaming quiz generation
const generateQuizStream = async () => {
  if (!uploadedFile.value) return
  
  const options = {
    questionsPerPage: questionsPerPage.value,
    difficulty: difficulty.value as 'easy' | 'medium' | 'hard' | 'mixed',
    includeExplanations: includeExplanations.value
  }
  
  console.log('🎯 Starting streaming quiz generation with options:', options)
  console.log('🌐 Language:', selectedLanguage.value)
  
  await fileUploadStore.generateQuizStream(uploadedFile.value.filename, options)
}
</script> 