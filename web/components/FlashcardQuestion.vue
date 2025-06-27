<template>
  <div 
    :class="containerClass"
    class="border border-gray-200 rounded-lg p-4"
  >
    <!-- Question Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="text-lg">🃏</span>
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

    <!-- Flashcard -->
    <div class="flashcard-wrapper">
      <div 
        class="flashcard"
        :class="{ 
          'flipped': isFlipped,
          'hoverable': !isFlipped 
        }"
        @click="!isFlipped && flipCard()"
      >
        <!-- Front of card -->
        <div class="flashcard-side flashcard-front">
          <div class="card-content">
            <div class="card-label">Question</div>
            <div class="card-text">{{ question.front }}</div>
            <div class="card-action">
              <button 
                class="flip-button"
                @click.stop="flipCard"
                :disabled="isFlipped"
              >
                <span class="mr-2">👁️</span>
                Show Answer
              </button>
            </div>
          </div>
        </div>

        <!-- Back of card -->
        <div class="flashcard-side flashcard-back">
          <div class="card-content">
            <div class="card-label">Answer</div>
            <div class="card-text">{{ question.back }}</div>
            <div class="card-action">
              <button 
                class="flip-button secondary"
                @click.stop="flipCard"
              >
                <span class="mr-2">🔄</span>
                Show Question
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Self-Assessment -->
    <div v-if="isFlipped && showSelfAssessment" class="self-assessment mt-6">
      <div class="mb-3">
        <p class="text-sm font-medium text-gray-700 mb-2">How well did you know this?</p>
        <div class="flex gap-2">
          <button
            v-for="option in selfAssessmentOptions"
            :key="option.value"
            @click="handleSelfAssessment(option.value)"
            class="flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors"
            :class="[
              selfAssessment === option.value
                ? option.selectedClass
                : option.defaultClass
            ]"
          >
            <span class="mr-1">{{ option.emoji }}</span>
            {{ option.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Explanation -->
    <div v-if="showExplanation" class="explanation mt-6">
      <button
        @click="toggleExplanation"
        class="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
      >
        <span class="flex items-center gap-2 text-sm font-medium text-blue-700">
          <span>💡</span>
          Explanation
        </span>
        <span class="text-blue-500">
          {{ showExplanationText ? '▼' : '▶️' }}
        </span>
      </button>
      
      <div v-if="showExplanationText" class="mt-3 p-4 bg-blue-50 rounded-lg">
        <p class="text-sm text-gray-700">{{ question.explanation }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FlashcardQuestion } from '~/types/api'

interface Props {
  question: FlashcardQuestion
  index: number
  containerClass?: string
  showAnswers: Record<string, boolean>
  selectedAnswers: Record<string, string>
  selectAnswer: (questionId: string, optionKey: string, question: any) => void
  toggleAnswer: (questionId: string) => void
  getOptionClass: (question: any, optionKey: string) => string
  getDifficultyClass: (difficulty: string) => string
  showSelfAssessment?: boolean
  showExplanation?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showSelfAssessment: true,
  showExplanation: true
})

const emit = defineEmits<{
  selfAssessment: [questionId: string, rating: number]
}>()

// Reactive state
const isFlipped = ref(false)
const showExplanationText = ref(false)
const selfAssessment = ref<number | null>(null)

// Computed
const selfAssessmentOptions = [
  {
    value: 1,
    label: 'Again',
    emoji: '❌',
    defaultClass: 'border-red-200 text-red-700 hover:bg-red-50',
    selectedClass: 'border-red-500 bg-red-100 text-red-800'
  },
  {
    value: 2,
    label: 'Hard',
    emoji: '😰',
    defaultClass: 'border-orange-200 text-orange-700 hover:bg-orange-50',
    selectedClass: 'border-orange-500 bg-orange-100 text-orange-800'
  },
  {
    value: 3,
    label: 'Good',
    emoji: '👍',
    defaultClass: 'border-blue-200 text-blue-700 hover:bg-blue-50',
    selectedClass: 'border-blue-500 bg-blue-100 text-blue-800'
  },
  {
    value: 4,
    label: 'Easy',
    emoji: '✅',
    defaultClass: 'border-green-200 text-green-700 hover:bg-green-50',
    selectedClass: 'border-green-500 bg-green-100 text-green-800'
  }
]

// Methods
const flipCard = () => {
  isFlipped.value = !isFlipped.value
}

const toggleExplanation = () => {
  showExplanationText.value = !showExplanationText.value
}

const handleSelfAssessment = (rating: number) => {
  selfAssessment.value = rating
  
  // Integrate with scoring system - treat ratings 3-4 as correct, 1-2 as incorrect
  const isCorrect = rating >= 3
  props.selectAnswer(props.question.id, rating.toString(), { 
    ...props.question, 
    correctAnswer: '3' // Set a baseline for "correct" self-assessment
  })
  
  emit('selfAssessment', props.question.id, rating)
}

// Reset state when question changes
watch(() => props.question.id, () => {
  isFlipped.value = false
  showExplanationText.value = false
  selfAssessment.value = null
})
</script>

<style scoped>
.flashcard-wrapper {
  position: relative;
  perspective: 1000px;
  height: 280px;
  margin-bottom: 1rem;
}

.flashcard {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s;
  cursor: pointer;
}

.flashcard.hoverable:hover {
  transform: scale(1.05);
  transition: transform 0.3s ease;
}

.flashcard.flipped {
  transform: rotateY(180deg);
  cursor: default;
}

.flashcard-side {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border: 1px solid;
  backface-visibility: hidden;
}

.flashcard-front {
  background: linear-gradient(to bottom right, #dbeafe, #e0e7ff);
  border-color: #bfdbfe;
}

.flashcard-back {
  background: linear-gradient(to bottom right, #dcfce7, #d1fae5);
  border-color: #bbf7d0;
  transform: rotateY(180deg);
}

.card-content {
  height: 100%;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.flashcard-front .card-label {
  color: #2563eb;
}

.flashcard-back .card-label {
  color: #059669;
}

.card-text {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 1.125rem;
  font-weight: 500;
  line-height: 1.75;
  color: #1f2937;
}

.card-action {
  display: flex;
  justify-content: center;
}

.flip-button {
  padding: 0.5rem 1rem;
  font-weight: 500;
  border-radius: 0.5rem;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.flip-button:not(.secondary) {
  background-color: #2563eb;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.flip-button:not(.secondary):hover {
  background-color: #1d4ed8;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.flip-button.secondary {
  background-color: white;
  color: #374151;
  border: 1px solid #d1d5db;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.flip-button.secondary:hover {
  background-color: #f9fafb;
}

.flip-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.self-assessment {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
}

.explanation {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
}

@media (max-width: 640px) {
  .flashcard-wrapper {
    height: 220px;
  }
  
  .card-content {
    padding: 1rem;
  }
  
  .card-text {
    font-size: 1rem;
  }
}
</style>