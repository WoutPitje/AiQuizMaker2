<template>
  <div v-if="totalAnswered > 0" class="border border-gray-200 rounded-lg p-4 mb-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="flex-shrink-0">
          <span class="text-2xl">{{ getScoreEmoji }}</span>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900">Your Score</h3>
          <p class="text-sm text-gray-600">{{ totalAnswered }} question{{ totalAnswered !== 1 ? 's' : '' }} answered</p>
        </div>
      </div>
      
      <div class="text-right">
        <div class="text-2xl font-bold" :class="scoreColor">
          {{ scorePercentage }}%
        </div>
        <div class="text-sm text-gray-600">
          {{ totalCorrect }}/{{ totalAnswered }} correct
        </div>
      </div>
    </div>
    
    <!-- Progress Bar -->
    <div class="mt-4">
      <div class="flex justify-between text-xs text-gray-600 mb-1">
        <span>Progress</span>
        <span>{{ totalAnswered }}/{{ totalQuestions }} questions</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div 
          class="h-2 rounded-full transition-all duration-300"
          :class="getProgressBarColor"
          :style="{ width: `${(totalAnswered / totalQuestions) * 100}%` }"
        ></div>
      </div>
    </div>
    
    <!-- Score Categories -->
    <div v-if="totalAnswered >= 4" class="mt-3 flex items-center space-x-2">
      <span class="text-xs px-2 py-1 rounded-full" :class="getScoreBadgeClass">
        {{ getScoreCategory }}
      </span>
      <span class="text-xs text-gray-500">{{ getScoreMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface QuizScoreCardProps {
  totalAnswered: number
  totalCorrect: number
  scorePercentage: number
  scoreColor: string
  totalQuestions: number
}

const props = defineProps<QuizScoreCardProps>()

const getProgressBarColor = computed(() => {
  const percentage = props.scorePercentage
  if (percentage >= 80) return 'bg-green-500'
  if (percentage >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
})

const getScoreBadgeClass = computed(() => {
  const percentage = props.scorePercentage
  if (percentage >= 80) return 'bg-green-100 text-green-800'
  if (percentage >= 60) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
})

const getScoreCategory = computed(() => {
  const percentage = props.scorePercentage
  if (percentage >= 90) return '🏆 Excellent'
  if (percentage >= 80) return '✅ Good'
  if (percentage >= 70) return '👍 Fair'
  if (percentage >= 60) return '⚠️ Needs Work'
  return '❌ Poor'
})

const getScoreMessage = computed(() => {
  const percentage = props.scorePercentage
  if (percentage >= 90) return 'Outstanding work!'
  if (percentage >= 80) return 'Well done!'
  if (percentage >= 70) return 'Not bad, keep going!'
  if (percentage >= 60) return 'Room for improvement'
  return 'Consider reviewing the material'
})

const getScoreEmoji = computed(() => {
  const percentage = props.scorePercentage
  if (percentage >= 90) return '🏆'
  if (percentage >= 80) return '✅'
  if (percentage >= 70) return '👍'
  if (percentage >= 60) return '⚠️'
  return '❌'
})
</script> 