<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-900">
            AI Quiz Maker
          </h1>
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
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold text-gray-900 mb-2">
          Upload Your PDF File
        </h2>
        <p class="text-lg text-gray-600">
          Upload a PDF and generate an AI-powered quiz. Maximum file size: 100MB
        </p>
        <div class="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          📄 PDF Files Only
        </div>
      </div>

      <!-- File Upload Section -->
      <div class="flex flex-col items-center space-y-8">
        <!-- File Dropbox -->
        <FileDropbox />
        
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
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 mt-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="text-center space-y-4">
          <div class="flex justify-center items-center space-x-6">
            <p class="text-sm text-gray-500">
              AI Quiz Maker - Powered by Vue 3, Nuxt.js & OpenAI GPT
            </p>
            <div class="border-l border-gray-300 pl-6">
              <a
                href="https://buymeacoffee.com/woutpittens"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                
                ☕ Buy me a coffee
              </a>
            </div>
          </div>
          <div class="text-xs text-gray-400">
            <p>Support the development of AI Quiz Maker</p>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
// Set page metadata
useHead({
  title: 'AI Quiz Maker - PDF Upload & Quiz Generation',
  meta: [
    { name: 'description', content: 'Upload PDF files and generate AI-powered quizzes using OpenAI GPT' }
  ]
})

// Initialize the store on page load
const fileUploadStore = useFileUploadStore()
const { quizError } = storeToRefs(fileUploadStore)

const clearQuizError = () => {
  fileUploadStore.clearQuizError()
}
</script> 