<template>
  <div class="w-full max-w-2xl mx-auto">
    <!-- File Drop Zone -->
    <div
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave" 
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
      :class="[
        'relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300',
        isDragOver 
          ? 'border-blue-400 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50',
        isUploading ? 'pointer-events-none opacity-75' : ''
      ]"
    >
      <!-- Upload Icon -->
      <div class="mx-auto w-12 h-12 mb-4">
        <svg
          class="w-full h-full text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      <!-- Upload Text -->
      <div class="space-y-2">
        <p class="text-lg font-medium text-gray-900">
          Upload your PDF file
        </p>
        <p class="text-sm text-gray-500">
          Drag and drop your PDF file here, or click to browse
        </p>
        <p class="text-xs text-gray-400">
          Maximum file size: {{ maxFileSizeDisplay }}
        </p>
      </div>

      <!-- Hidden File Input -->
      <input
        ref="fileInput"
        type="file"
        accept=".pdf,application/pdf"
        class="hidden"
        @change="handleFileSelect"
      />

      <!-- Upload Progress -->
      <div v-if="isUploading" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
        <div class="text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p class="text-sm font-medium text-gray-700">Uploading...</p>
          <div class="w-48 bg-gray-200 rounded-full h-2 mt-2">
            <div 
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${uploadProgress}%` }"
            ></div>
          </div>
          <p class="text-xs text-gray-500 mt-1">{{ uploadProgress }}%</p>
        </div>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Upload Error</h3>
          <div class="mt-2 text-sm text-red-700">
            <p>{{ error }}</p>
          </div>
          <div class="mt-4">
            <button
              @click="clearError"
              class="bg-red-100 px-2 py-1 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const fileUploadStore = useFileUploadStore()
const { isUploading, uploadProgress, error } = storeToRefs(fileUploadStore)

const fileInput = ref<HTMLInputElement>()
const isDragOver = ref(false)
const serverConfig = ref<any>(null)

// Computed property for max file size display
const maxFileSizeDisplay = computed(() => {
  if (serverConfig.value?.config?.maxPdfSizeMB) {
    return `${serverConfig.value.config.maxPdfSizeMB}MB`
  }
  return '100MB' // fallback
})

// Fetch server configuration on mount
onMounted(async () => {
  try {
    const { getConfig } = useApi()
    serverConfig.value = await getConfig()
    console.log('📋 Server config loaded:', serverConfig.value)
  } catch (error) {
    console.warn('⚠️ Failed to load server config, using defaults')
  }
})

// Drag and drop handlers
const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = false
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = false
  
  const files = e.dataTransfer?.files
  if (files) {
    handleFiles(Array.from(files))
  }
}

// File input handlers
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (files) {
    handleFiles(Array.from(files))
  }
  // Reset input value to allow same file selection
  input.value = ''
}

// File processing
const handleFiles = async (files: File[]) => {
  const maxSize = serverConfig.value?.config?.maxPdfSize || 104857600 // 100MB default
  
  // Only process the first file
  const file = files[0]
  if (!file) return
  
  // Validate file type
  if (file.type !== 'application/pdf') {
    fileUploadStore.error = `"${file.name}" is not a PDF file. Only PDF files are allowed.`
    return
  }
  
  // Validate file size
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    const fileSizeMB = Math.round(file.size / (1024 * 1024))
    fileUploadStore.error = `"${file.name}" is too large (${fileSizeMB}MB). Maximum size is ${maxSizeMB}MB.`
    return
  }
  
  // Upload file
  try {
    await fileUploadStore.uploadFile(file)
  } catch (error: any) {
    // Error is already handled in the store
  }
}

// Utility functions
const clearError = () => {
  fileUploadStore.clearError()
}
</script> 