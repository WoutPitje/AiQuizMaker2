<template>
  <div v-if="isVisible" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <!-- Background overlay -->
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div 
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
        aria-hidden="true"
        @click="closePopup"
      ></div>

      <!-- This element is to trick the browser into centering the modal contents. -->
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <!-- Modal panel -->
      <div class="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
        <!-- Close button -->
        <div class="absolute top-0 right-0 pt-4 pr-4">
          <button
            type="button"
            class="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            @click="closePopup"
          >
            <span class="sr-only">Close</span>
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="sm:flex sm:items-start">
          <!-- Coffee icon -->
          <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
            <span class="text-2xl">☕</span>
          </div>
          
          <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
              Keep QuizAi Online! ☕
            </h3>
            <div class="mt-2">
              <p class="text-sm text-gray-500 mb-3">
                Hey there! 👋 I'm glad you're enjoying QuizAi! This tool is completely free to use, but it costs money to keep the servers running and the AI processing your PDFs.
              </p>
              <p class="text-sm text-gray-500 mb-3">
                <strong>Your support helps:</strong>
              </p>
              <ul class="text-sm text-gray-500 mb-4 space-y-1">
                <li class="flex items-center">
                  <span class="text-green-500 mr-2">✓</span>
                  Keep the servers running 24/7
                </li>
                <li class="flex items-center">
                  <span class="text-green-500 mr-2">✓</span>
                  Cover AI processing costs
                </li>
                <li class="flex items-center">
                  <span class="text-green-500 mr-2">✓</span>
                  Add new features and improvements
                </li>
                <li class="flex items-center">
                  <span class="text-green-500 mr-2">✓</span>
                  Keep QuizAi completely free for everyone
                </li>
              </ul>
              <p class="text-sm text-gray-600 font-medium">
                Even a small coffee ☕ ($3-5) makes a huge difference! 
              </p>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <a
            href="https://buymeacoffee.com/woutpittens"
            target="_blank"
            rel="noopener noreferrer"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-400 text-base font-medium text-gray-900 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
            @click="handleCoffeeClick"
          >
            ☕ Buy me a coffee
          </a>
          <button
            type="button"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
            @click="remindLater"
          >
            Remind me later
          </button>
        </div>

        <!-- Small thank you note -->
        <div class="mt-4 text-center">
          <p class="text-xs text-gray-400">
            Thank you for using QuizAi! 🙏 - Wout
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isVisible = ref(false)

const emit = defineEmits<{
  close: []
  coffeeClick: []
}>()

const closePopup = () => {
  isVisible.value = false
  emit('close')
  
  // Set a flag to not show again for this session
  sessionStorage.setItem('coffeePopupShown', 'true')
}

const remindLater = () => {
  closePopup()
  
  // Set a flag to show again after some time (e.g., after 1 hour)
  const remindTime = Date.now() + (60 * 60 * 1000) // 1 hour from now
  localStorage.setItem('coffeePopupRemindTime', remindTime.toString())
}

const handleCoffeeClick = () => {
  emit('coffeeClick')
  closePopup()
  
  // Set a flag to not show again for a longer period (e.g., 1 week)
  const hideUntil = Date.now() + (7 * 24 * 60 * 60 * 1000) // 1 week from now
  localStorage.setItem('coffeePopupHideUntil', hideUntil.toString())
}

const shouldShowPopup = (): boolean => {
  // Don't show if already shown in this session
  if (sessionStorage.getItem('coffeePopupShown')) {
    return false
  }

  // Don't show if user clicked coffee button recently (within 1 week)
  const hideUntil = localStorage.getItem('coffeePopupHideUntil')
  if (hideUntil && Date.now() < parseInt(hideUntil)) {
    return false
  }

  // Don't show if user chose "remind me later" and time hasn't passed
  const remindTime = localStorage.getItem('coffeePopupRemindTime')
  if (remindTime && Date.now() < parseInt(remindTime)) {
    return false
  }

  return true
}

const showPopup = () => {
  if (shouldShowPopup()) {
    // Show popup after a delay to not interrupt user flow
    setTimeout(() => {
      isVisible.value = true
    }, 10000) // Show after 10 seconds to let user explore first
  }
}

// Expose methods for parent components
defineExpose({
  showPopup,
  closePopup
})

onMounted(() => {
  // Auto-show popup when component is mounted (with conditions)
  showPopup()
})
</script>

<style scoped>
/* Add some custom animations */
.transition-opacity {
  transition-property: opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

.transform {
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
</style> 