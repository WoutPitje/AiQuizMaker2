import { ref, computed } from 'vue'
import { useFileUploadStore } from '~/stores/fileUpload'

export const useQuizInteractions = () => {
  const fileUploadStore = useFileUploadStore()
  
  // Local state for quiz interactions
  const showAnswers = ref<Record<string, boolean>>({})
  const selectedAnswers = ref<Record<string, string>>({})
  const copyingLink = ref(false)
  
  // Score tracking
  const answeredQuestions = ref<Record<string, boolean>>({})
  const correctAnswers = ref<Record<string, boolean>>({})

  // Reset all interaction state
  const resetInteractionState = () => {
    showAnswers.value = {}
    selectedAnswers.value = {}
    answeredQuestions.value = {}
    correctAnswers.value = {}
  }

  // Toggle answer visibility for a question
  const toggleAnswer = (questionId: string) => {
    showAnswers.value[questionId] = !showAnswers.value[questionId]
  }

  // Select an answer for a question
  const selectAnswer = (questionId: string, optionKey: string, question: any) => {
    selectedAnswers.value[questionId] = optionKey
    // Also show the answer when user selects
    showAnswers.value[questionId] = true
    
    // Track if this question has been answered and if it's correct
    answeredQuestions.value[questionId] = true
    
    // Handle different question types and correctAnswer formats
    let isCorrect = false
    if (question.type === 'true-false') {
      // For true/false, convert string to boolean for comparison
      const selectedBool = optionKey === 'true'
      isCorrect = selectedBool === question.correctAnswer
    } else if (question.type === 'flashcard') {
      // For flashcards, ratings 3-4 are considered correct
      const rating = parseInt(optionKey)
      isCorrect = rating >= 3
    } else if (question.type === 'matching') {
      // For matching, parse the JSON pairs and compare
      try {
        const userPairs = JSON.parse(optionKey)
        const correctPairs = JSON.parse(question.correctAnswer)
        let correctMatches = 0
        for (const correctPair of correctPairs) {
          if (userPairs[correctPair.leftId] === correctPair.rightId) {
            correctMatches++
          }
        }
        // Consider it correct if at least 60% of matches are right
        isCorrect = correctMatches >= Math.ceil(correctPairs.length * 0.6)
      } catch (e) {
        isCorrect = false
      }
    } else {
      // For multiple choice and other types, use string comparison
      isCorrect = optionKey === question.correctAnswer
    }
    
    correctAnswers.value[questionId] = isCorrect
  }

  // Get CSS classes for option styling based on state
  const getOptionClass = (question: any, optionKey: string) => {
    const isSelected = selectedAnswers.value[question.id] === optionKey
    const showingAnswers = showAnswers.value[question.id]
    
    // Handle different question types for correctAnswer comparison
    let isCorrect = false
    if (question.type === 'true-false') {
      // For true/false, convert string to boolean for comparison
      const selectedBool = optionKey === 'true'
      isCorrect = selectedBool === question.correctAnswer
    } else if (question.type === 'flashcard') {
      // For flashcards, ratings 3-4 are considered correct
      const rating = parseInt(optionKey)
      isCorrect = rating >= 3
    } else {
      // For multiple choice and other types, use string comparison
      isCorrect = optionKey === question.correctAnswer
    }
    
    if (showingAnswers && isCorrect) {
      return 'bg-green-100 border-green-300 border-2'
    } else if (showingAnswers && isSelected && !isCorrect) {
      return 'bg-red-100 border-red-300 border-2'
    } else if (isSelected) {
      return 'bg-blue-100 border-blue-300 border-2'
    }
    return 'bg-gray-50 hover:bg-gray-100 border-gray-200'
  }

  // Get CSS classes for difficulty badge
  const getDifficultyClass = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'hard':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Copy share URL to clipboard
  const copyShareUrl = async () => {
    if (copyingLink.value) return
    
    copyingLink.value = true
    try {
      const success = await fileUploadStore.copyMagicLink()
      if (success) {
        // Keep "Copied!" state for 2 seconds
        setTimeout(() => {
          copyingLink.value = false
        }, 2000)
      } else {
        copyingLink.value = false
      }
    } catch (error) {
      console.error('Failed to copy link:', error)
      copyingLink.value = false
    }
  }

  // Score calculations
  const totalAnswered = computed(() => {
    return Object.keys(answeredQuestions.value).length
  })

  const totalCorrect = computed(() => {
    return Object.values(correctAnswers.value).filter(Boolean).length
  })

  const scorePercentage = computed(() => {
    if (totalAnswered.value === 0) return 0
    return Math.round((totalCorrect.value / totalAnswered.value) * 100)
  })

  const getScoreColor = computed(() => {
    const percentage = scorePercentage.value
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  })

  // Get language display name with fallback
  const getLanguageDisplayName = (languageCode: string): string => {
    // Fallback language names
    const languageNames: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish', 
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'da': 'Danish',
      'no': 'Norwegian'
    }
    return languageNames[languageCode] || languageCode.toUpperCase()
  }

  return {
    // State
    showAnswers,
    selectedAnswers,
    copyingLink,
    answeredQuestions,
    correctAnswers,
    
    // Score computed properties
    totalAnswered,
    totalCorrect,
    scorePercentage,
    getScoreColor,
    
    // Methods
    resetInteractionState,
    toggleAnswer,
    selectAnswer,
    getOptionClass,
    getDifficultyClass,
    copyShareUrl,
    getLanguageDisplayName
  }
} 