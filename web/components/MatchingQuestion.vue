<template>
  <div 
    :class="containerClass"
    class="border border-gray-200 rounded-lg p-4"
  >
    <!-- Question Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="text-lg">🔗</span>
        <span class="text-sm font-medium text-blue-600">Question {{ index + 1 }}</span>
      </div>
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
    <h3 class="text-lg font-medium text-gray-900 mb-4">Match the items:</h3>

    <!-- Matching Interface -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <!-- Left Column -->
      <div>
        <h4 class="text-sm font-medium text-gray-700 mb-2">Items</h4>
        <div class="space-y-2">
          <div
            v-for="leftItem in question.leftItems"
            :key="leftItem.id"
            class="p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer transition-all"
            :class="getLeftItemClass(leftItem.id)"
            @click="selectLeftItem(leftItem.id)"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">{{ leftItem.text }}</span>
              <span v-if="userPairs[leftItem.id]" class="text-xs text-blue-600">
                → {{ getRightItemText(userPairs[leftItem.id]) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column -->
      <div>
        <h4 class="text-sm font-medium text-gray-700 mb-2">Matches</h4>
        <div class="space-y-2">
          <div
            v-for="rightItem in shuffledRightItems"
            :key="rightItem.id"
            class="p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer transition-all"
            :class="getRightItemClass(rightItem.id)"
            @click="selectRightItem(rightItem.id)"
            :data-item-id="rightItem.id"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm">{{ rightItem.text }}</span>
              <span v-if="isRightItemMatched(rightItem.id)" class="text-xs text-gray-600">
                ✓
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center justify-between mb-4">
      <button
        @click="clearMatches"
        :disabled="Object.keys(userPairs).length === 0 || showAnswers[question.id]"
        class="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Clear all matches
      </button>
      
      <button
        v-if="!showAnswers[question.id]"
        @click="submitAnswers"
        :disabled="!hasAllMatches"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit Matches
      </button>
    </div>

    <!-- Show/Hide Answer Button -->
    <div class="flex items-center justify-between">
      <button
        @click="toggleAnswer(question.id)"
        class="text-blue-600 hover:text-blue-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
      >
        {{ showAnswers[question.id] ? 'Hide Answer' : 'Show Answer' }}
      </button>
      
      <!-- Score Display -->
      <div v-if="selectedAnswers[question.id]" class="text-sm text-gray-600">
        Score: <span class="font-medium">{{ correctMatches }}/{{ question.correctPairs.length }}</span> correct
      </div>
    </div>

    <!-- Answer Explanation -->
    <div v-if="showAnswers[question.id]" class="mt-3 p-3 bg-green-50 rounded border border-green-200">
      <div class="flex items-center mb-2">
        <svg class="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <span class="font-medium text-green-800">
          Correct Matches:
        </span>
      </div>
      
      <!-- Show correct pairs -->
      <div class="space-y-1 mb-3">
        <div v-for="pair in question.correctPairs" :key="`${pair.leftId}-${pair.rightId}`" class="text-sm">
          <span class="font-medium text-green-700">{{ getLeftItemText(pair.leftId) }}</span>
          <span class="text-gray-600"> → </span>
          <span class="text-green-700">{{ getRightItemText(pair.rightId) }}</span>
          <span class="ml-2">
            {{ isMatchCorrect(pair.leftId, pair.rightId) ? '✅' : '❌' }}
          </span>
        </div>
      </div>
      
      <p v-if="question.explanation" class="text-green-700 text-sm border-t border-green-200 pt-3">
        {{ question.explanation }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MatchingQuestion } from '~/types/api'

interface Props {
  question: MatchingQuestion
  index: number
  containerClass?: string
  showAnswers: Record<string, boolean>
  selectedAnswers: Record<string, string>
  selectAnswer: (questionId: string, optionKey: string, question: any) => void
  toggleAnswer: (questionId: string) => void
  getOptionClass: (question: any, optionKey: string) => string
  getDifficultyClass: (difficulty: string) => string
}

const props = defineProps<Props>()

// Local state
const userPairs = ref<Record<string, string>>({}) // leftId -> rightId mapping
const selectedLeftItem = ref<string | null>(null)

// Shuffle right items to make it more challenging
const shuffledRightItems = computed(() => {
  const items = [...props.question.rightItems]
  // Use a deterministic shuffle based on question ID
  const seed = props.question.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
  return items.sort(() => (seed % 2) - 0.5)
})

// Computed properties
const hasAllMatches = computed(() => {
  return Object.keys(userPairs.value).length === props.question.leftItems.length
})

const correctMatches = computed(() => {
  let correct = 0
  for (const pair of props.question.correctPairs) {
    if (userPairs.value[pair.leftId] === pair.rightId) {
      correct++
    }
  }
  return correct
})

// Methods
const selectLeftItem = (leftId: string) => {
  if (props.showAnswers[props.question.id]) return
  selectedLeftItem.value = leftId
}

const selectRightItem = (rightId: string) => {
  if (props.showAnswers[props.question.id] || !selectedLeftItem.value) return
  
  // Remove any existing match for this right item
  for (const [leftId, matchedRightId] of Object.entries(userPairs.value)) {
    if (matchedRightId === rightId) {
      delete userPairs.value[leftId]
    }
  }
  
  // Create new match
  userPairs.value[selectedLeftItem.value] = rightId
  selectedLeftItem.value = null
}

const clearMatches = () => {
  userPairs.value = {}
  selectedLeftItem.value = null
}

const getLeftItemText = (leftId: string) => {
  return props.question.leftItems.find(item => item.id === leftId)?.text || ''
}

const getRightItemText = (rightId: string) => {
  return props.question.rightItems.find(item => item.id === rightId)?.text || ''
}

const isRightItemMatched = (rightId: string) => {
  return Object.values(userPairs.value).includes(rightId)
}

const isMatchCorrect = (leftId: string, rightId: string) => {
  return userPairs.value[leftId] === rightId
}

const getLeftItemClass = (leftId: string) => {
  if (selectedLeftItem.value === leftId) {
    return 'border-blue-500 bg-blue-100 ring-2 ring-blue-300'
  }
  if (props.showAnswers[props.question.id] && userPairs.value[leftId]) {
    const correctPair = props.question.correctPairs.find(p => p.leftId === leftId)
    const isCorrect = correctPair && userPairs.value[leftId] === correctPair.rightId
    return isCorrect ? 'border-green-500 bg-green-100' : 'border-red-500 bg-red-100'
  }
  return userPairs.value[leftId] ? 'border-blue-400 bg-blue-100' : ''
}

const getRightItemClass = (rightId: string) => {
  if (props.showAnswers[props.question.id] && isRightItemMatched(rightId)) {
    const leftId = Object.entries(userPairs.value).find(([_, rId]) => rId === rightId)?.[0]
    if (leftId) {
      const correctPair = props.question.correctPairs.find(p => p.leftId === leftId)
      const isCorrect = correctPair && correctPair.rightId === rightId
      return isCorrect ? 'border-green-500 bg-green-100' : 'border-red-500 bg-red-100'
    }
  }
  if (isRightItemMatched(rightId)) {
    return 'border-gray-400 bg-gray-100 opacity-60'
  }
  return selectedLeftItem.value ? 'hover:border-blue-300 hover:bg-blue-50' : ''
}

const submitAnswers = () => {
  if (!hasAllMatches.value) return
  
  // Serialize pairs for storage
  const serializedPairs = JSON.stringify(userPairs.value)
  
  // Create scoring object
  const questionForScoring = {
    ...props.question,
    correctAnswer: JSON.stringify(props.question.correctPairs)
  }
  
  props.selectAnswer(props.question.id, serializedPairs, questionForScoring)
}

// Watch for changes in selectedAnswers to update local state
watch(() => props.selectedAnswers[props.question.id], (newAnswer) => {
  if (newAnswer && Object.keys(userPairs.value).length === 0) {
    try {
      userPairs.value = JSON.parse(newAnswer)
    } catch (e) {
      console.error('Failed to parse saved matches:', e)
    }
  }
})

// Reset state when question changes
watch(() => props.question.id, () => {
  userPairs.value = {}
  selectedLeftItem.value = null
})
</script>