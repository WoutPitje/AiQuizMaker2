<template>
  <div v-if="shareUrl" class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
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
          @click="onCopyClick"
          :disabled="isCopying"
          class="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
        >
          {{ isCopying ? 'Copied!' : 'Copy Link' }}
        </button>
      </div>
    </div>
    <div class="mt-2">
      <input
        :value="shareUrl"
        readonly
        class="w-full px-2 py-1 text-xs bg-white border border-blue-200 rounded text-gray-600 font-mono"
        @click="($event.target as HTMLInputElement)?.select?.()"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface QuizShareSectionProps {
  shareUrl: string | null
  isCopying: boolean
  onCopyClick: () => void
}

defineProps<QuizShareSectionProps>()
</script> 