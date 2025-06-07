<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <div class="text-center">
          <svg class="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="text-lg text-gray-600">Loading quiz...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="max-w-2xl mx-auto">
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
          <h2 class="text-xl font-semibold text-red-900 mb-2">Quiz Not Found</h2>
          <p class="text-red-700 mb-4">{{ error }}</p>
          <div class="space-y-3">
            <button
              @click="retryLoad"
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
            <div>
              <NuxtLink
                to="/"
                class="text-red-600 hover:text-red-800 underline"
              >
                ← Go back to create a new quiz
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Quiz Display -->
      <div v-else-if="currentQuiz">
        <!-- Header with branding -->
        <div class="text-center mb-8">
          <div class="grid grid-cols-3 items-center mb-6">
            <div></div>
            <div class="text-center">
              <h1 class="text-3xl font-bold text-gray-900 mb-2">
                🧠 AiQuizMaker
              </h1>
              <p class="text-gray-600">
                AI-powered quiz from your PDF documents
              </p>
            </div>
            <div class="flex justify-end">
              <a
                href="https://buymeacoffee.com/woutpittens"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center px-3 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                ☕ Buy me a coffee
              </a>
            </div>
          </div>
        </div>

        <!-- Quiz Component -->
        <QuizDisplay />

        <!-- Back to Home -->
        <div class="text-center mt-8">
          <NuxtLink
            to="/"
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Create Your Own Quiz
          </NuxtLink>
        </div>

        <!-- Buy Me a Coffee -->
        <div class="text-center mt-8 pt-8 border-t border-gray-200">
          <a
            href="https://buymeacoffee.com/woutpittens"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
          >

            ☕ Buy me a coffee
          </a>
          <p class="text-xs text-gray-500 mt-2">
            Support the development of AI Quiz Maker
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useFileUploadStore } from '~/stores/fileUpload'

// Page meta
definePageMeta({
  title: 'Quiz Viewer - AiQuizMaker',
  description: 'View your AI-generated quiz'
})

const route = useRoute()
const fileUploadStore = useFileUploadStore()
const { currentQuiz, quizError } = storeToRefs(fileUploadStore)

const isLoading = ref(true)
const error = ref<string | null>(null)

const magicLink = computed(() => route.params.magicLink as string)

const loadQuiz = async () => {
  if (!magicLink.value) {
    error.value = 'Invalid quiz link'
    isLoading.value = false
    return
  }

  try {
    isLoading.value = true
    error.value = null
    
    console.log('🔗 Loading quiz from magic link:', magicLink.value)
    await fileUploadStore.loadQuizByMagicLink(magicLink.value)
    
    // Check if quiz was loaded successfully
    if (quizError.value) {
      error.value = quizError.value
    } else if (!currentQuiz.value) {
      error.value = 'Quiz not found or failed to load'
    }
    
  } catch (err: any) {
    console.error('Failed to load quiz:', err)
    error.value = err.message || 'Failed to load quiz'
  } finally {
    isLoading.value = false
  }
}

const retryLoad = () => {
  loadQuiz()
}

// Load quiz when component mounts
onMounted(() => {
  loadQuiz()
})

// Update page title when quiz loads
watch(currentQuiz, (quiz) => {
  if (quiz) {
    useHead({
      title: `${quiz.title} - AiQuizMaker`,
      meta: [
        { name: 'description', content: quiz.description },
        { property: 'og:title', content: quiz.title },
        { property: 'og:description', content: quiz.description },
        { property: 'og:type', content: 'article' }
      ]
    })
  }
})
</script> 