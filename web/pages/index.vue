<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div class="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
          <div class="text-2xl font-bold text-gray-900 text-center sm:text-left">
            🧠 QuizAi
          </div>
          <div class="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
            <a
              href="https://www.linkedin.com/in/wout-pittens-425b31200/"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              💼 LinkedIn
            </a>
            <a
              href="https://buymeacoffee.com/woutpittens"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center px-3 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              ☕ Buy me a coffee
            </a>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="text-center mb-8">
        <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          Transform Any PDF into an 
          <span class="text-blue-600">Interactive Quiz</span>
        </h1>
        <p class="text-xl text-gray-600 mb-4 max-w-3xl mx-auto">
          Upload your study materials, textbooks, or documents and instantly generate personalized, AI-powered quizzes. Perfect for students, educators, and lifelong learners.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <div class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
            ✨ Powered by Advanced AI
          </div>
          <div class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            ⚡ Instant Quiz Generation
          </div>
          <div class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            📚 Any Learning Material
          </div>
        </div>
        <h2 class="text-2xl font-semibold text-gray-800 mb-2">
          Get Started - Upload Your PDF Below
        </h2>
        <p class="text-gray-600">
          Maximum file size: 100MB • PDF files only • Free to use
        </p>
      </div>

      <!-- File Upload Section -->
      <div class="flex flex-col items-center space-y-8">
        <!-- File Dropbox -->
        <FileDropbox v-if="!hasUploadedFile" />
        
        <!-- File Uploaded - Pre-Generation Options -->
        <div v-if="hasUploadedFile && !hasGeneratedQuiz && !isGeneratingQuiz" class="w-full max-w-2xl mx-auto">
          <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div class="text-center mb-6">
              <div class="flex items-center justify-center mb-4">
                <svg class="h-8 w-8 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <h3 class="text-lg font-semibold text-gray-900">
                  📄 PDF Uploaded Successfully!
                </h3>
              </div>
              <p class="text-gray-600 mb-4">
                Your PDF is ready for quiz generation. Not the right file?
              </p>
              
              <button
                @click="handleUploadNewFile"
                class="inline-flex items-center px-4 py-2 border border-orange-300 text-orange-700 bg-orange-50 text-sm font-medium rounded-md hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
              >
                📎 Upload Different File
              </button>
            </div>
          </div>
        </div>
        
        <!-- New Quiz Options (shown after quiz generation is complete) -->
        <div v-if="hasGeneratedQuiz && !isGeneratingQuiz" class="w-full max-w-2xl mx-auto">
          <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div class="text-center mb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                🎉 Quiz Generated Successfully!
              </h3>
              <p class="text-gray-600">
                What would you like to do next?
              </p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Upload New File Option -->
              <div class="text-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h4 class="text-sm font-medium text-gray-900 mb-2">Upload New PDF</h4>
                <p class="text-xs text-gray-600 mb-3">
                  Upload a different PDF file to create a new quiz
                </p>
                <button
                  @click="handleUploadNewFile"
                  class="w-full inline-flex items-center justify-center px-3 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors"
                >
                  📄 Choose New File
                </button>
              </div>
              
              <!-- Generate New Quiz with Same File -->
              <div class="text-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors">
                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h4 class="text-sm font-medium text-gray-900 mb-2">Same PDF, New Quiz</h4>
                <p class="text-xs text-gray-600 mb-3">
                  Generate another quiz with different options using the same PDF
                </p>
                <button
                  @click="handleStartNewQuiz"
                  class="w-full inline-flex items-center justify-center px-3 py-2 border border-green-300 shadow-sm text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 transition-colors"
                >
                  🔄 New Quiz Options
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Uploaded Files List -->
        <FileList />

        <!-- Quiz Generation Error -->
        <div v-if="quizError" class="w-full max-w-2xl mx-auto">
          <div class="bg-red-50 border border-red-200 rounded-md p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">
                  Quiz Generation Failed
                </h3>
                <div class="mt-2 text-sm text-red-700">
                  <p>{{ quizError }}</p>
                </div>
                <div class="mt-4">
                  <button
                    @click="clearQuizError"
                    class="bg-red-100 px-2 py-1 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Features Section -->
        <section class="mt-20 mb-16">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">
              Why Choose QuizAi?
            </h2>
            <p class="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience the future of learning with our advanced AI-powered quiz generation platform
            </p>
          </div>
          
          <div class="grid md:grid-cols-3 gap-8">
            <div class="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-2xl">🤖</span>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">AI-Powered Intelligence</h3>
              <p class="text-gray-600">
                Advanced AI analyzes your PDF content to generate relevant, contextual questions that test comprehension and knowledge retention.
              </p>
            </div>
            
            <div class="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-2xl">⚡</span>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">Instant Results</h3>
              <p class="text-gray-600">
                Upload your PDF and get a complete interactive quiz in seconds. No waiting, no complex setup - just instant learning enhancement.
              </p>
            </div>
            
            <div class="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-2xl">📚</span>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">Any Learning Material</h3>
              <p class="text-gray-600">
                Works with textbooks, research papers, study guides, manuals, and any PDF document. Perfect for students and educators.
              </p>
            </div>
          </div>
        </section>

        <!-- How It Works Section -->
        <section class="mb-16 bg-gray-50 rounded-2xl p-8">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p class="text-lg text-gray-600">
              Create engaging quizzes in just three simple steps
            </p>
          </div>
          
          <div class="grid md:grid-cols-3 gap-8">
            <div class="text-center">
              <div class="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">Upload PDF</h3>
              <p class="text-gray-600">
                Drag and drop or select your PDF document (up to 100MB)
              </p>
            </div>
            
            <div class="text-center">
              <div class="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">AI Processing</h3>
              <p class="text-gray-600">
                Our AI analyzes content and generates relevant quiz questions
              </p>
            </div>
            
            <div class="text-center">
              <div class="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">Interactive Quiz</h3>
              <p class="text-gray-600">
                Get your personalized quiz ready for learning and testing
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 mt-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="text-center space-y-4">
          <!-- Mobile: Stack vertically, Desktop: Horizontal layout -->
          <div class="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:items-center sm:space-y-0 sm:space-x-6">
            <p class="text-sm text-gray-500 text-center sm:text-left">
              🧠 QuizAi - Powered by Vue 3, Nuxt.js & OpenAI GPT
            </p>
            <!-- Mobile: No border, Desktop: Left border -->
            <div class="sm:border-l sm:border-gray-300 sm:pl-6 flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
              <a
                href="https://www.linkedin.com/in/wout-pittens-425b31200/"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                💼 Connect on LinkedIn
              </a>
              <a
                href="https://buymeacoffee.com/woutpittens"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                ☕ Buy me a coffee
              </a>
            </div>
          </div>
          <div class="text-xs text-gray-400">
            <p>Support the development of QuizAi • Connect with the developer</p>
          </div>
        </div>
      </div>
    </footer>

    <!-- Coffee Support Popup -->
    <CoffeePopup 
      ref="coffeePopupRef"
      @close="handleCoffeePopupClose"
      @coffee-click="handleCoffeeClick"
    />
  </div>
</template>

<script setup lang="ts">
// Enhanced SEO metadata for homepage
useHead({
  title: '🧠 QuizAi - Transform PDFs into Interactive Quizzes Instantly',
  meta: [
    { name: 'description', content: 'Transform any PDF document into engaging, AI-powered quizzes in seconds. Upload your study materials, textbooks, or documents and generate personalized interactive quizzes automatically.' },
    { name: 'keywords', content: 'QuizAi, AI quiz maker, PDF to quiz, interactive quiz generator, study tools, educational AI, quiz creation, learning platform, PDF quiz generator, AI education' },
    { property: 'og:title', content: '🧠 QuizAi - Transform PDFs into Interactive Quizzes Instantly' },
    { property: 'og:description', content: 'Transform any PDF document into engaging, AI-powered quizzes in seconds. Upload your study materials, textbooks, or documents and generate personalized interactive quizzes automatically.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://quizai.nl' },
    { name: 'twitter:title', content: '🧠 QuizAi - Transform PDFs into Interactive Quizzes Instantly' },
    { name: 'twitter:description', content: 'Transform any PDF document into engaging, AI-powered quizzes in seconds. Upload your study materials and generate personalized quizzes automatically.' }
  ],
  link: [
    { rel: 'canonical', href: 'https://quizai.nl' }
  ]
})

// Initialize the store on page load
const fileUploadStore = useFileUploadStore()
const { quizError, hasGeneratedQuiz, isGeneratingQuiz, hasUploadedFile } = storeToRefs(fileUploadStore)

// Coffee popup reference
const coffeePopupRef = ref(null)

// Listen for coffee popup trigger event
onMounted(() => {
  window.addEventListener('show-coffee-popup', () => {
    if (coffeePopupRef.value) {
      coffeePopupRef.value.showPopup()
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('show-coffee-popup', () => {})
})

const clearQuizError = () => {
  fileUploadStore.clearQuizError()
}

const handleUploadNewFile = () => {
  // Clear everything and allow user to upload a new file
  fileUploadStore.removeFile()
}

const handleStartNewQuiz = () => {
  // Start a new quiz with the same file
  fileUploadStore.startNewQuiz()
}

// Coffee popup event handlers
const handleCoffeePopupClose = () => {
  console.log('☕ Coffee popup closed')
}

const handleCoffeeClick = () => {
  console.log('☕ User clicked coffee button from popup')
  // You can add analytics tracking here if needed
}
</script> 