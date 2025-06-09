# Component Refactoring: Eliminating Quiz Display Duplication

## Overview

This document describes the refactoring implemented to eliminate duplicate code between `QuizDisplay.vue` and `StreamingQuizDisplay.vue` components. The refactoring introduces shared components and composables to improve code maintainability and reduce redundancy.

## Problem Statement

The original `QuizDisplay.vue` and `StreamingQuizDisplay.vue` components contained significant duplicate code:

- **Question rendering logic** - Individual question cards with options, answers, and explanations
- **Answer interaction logic** - Show/hide answers, select answers, option styling
- **Share functionality** - Copy quiz share URLs to clipboard
- **Utility functions** - `getDifficultyClass`, `getOptionClass`, `selectAnswer`, `toggleAnswer`
- **State management** - Managing selected answers and answer visibility

This duplication made the codebase harder to maintain and increased the risk of inconsistencies between the two components.

## Solution Architecture

### 1. Shared Composable: `useQuizInteractions`

**Location**: `web/composables/useQuizInteractions.ts`

This composable centralizes all quiz interaction logic:

```typescript
export const useQuizInteractions = () => {
  // State management
  const showAnswers = ref<Record<string, boolean>>({})
  const selectedAnswers = ref<Record<string, string>>({})
  const copyingLink = ref(false)

  // Interaction methods
  const resetInteractionState = () => { /* ... */ }
  const toggleAnswer = (questionId: string) => { /* ... */ }
  const selectAnswer = (questionId: string, optionKey: string) => { /* ... */ }
  
  // Styling utilities
  const getOptionClass = (question: any, optionKey: string) => { /* ... */ }
  const getDifficultyClass = (difficulty: string) => { /* ... */ }
  
  // Share functionality
  const copyShareUrl = async () => { /* ... */ }
  const getLanguageDisplayName = (languageCode: string) => { /* ... */ }

  return { /* all state and methods */ }
}
```

**Benefits**:
- Centralized state management for quiz interactions
- Consistent behavior across all quiz components
- Easy to test and maintain
- Reusable across different quiz display modes

### 2. Reusable Components

#### `QuizQuestion.vue`

**Location**: `web/components/QuizQuestion.vue`

A reusable component for rendering individual quiz questions:

```vue
<template>
  <div :class="containerClass" class="border border-gray-200 rounded-lg p-4">
    <!-- Question Header -->
    <!-- Question Text -->
    <!-- Options -->
    <!-- Show/Hide Answer Button -->
    <!-- Answer Explanation -->
  </div>
</template>
```

**Props**:
- `question`: The question data object
- `index`: Question number for display
- `containerClass`: Optional CSS classes for the container
- `showAnswers`: Reactive state for answer visibility
- `selectedAnswers`: Reactive state for selected answers
- Function props for interactions: `selectAnswer`, `toggleAnswer`, `getOptionClass`, `getDifficultyClass`

#### `QuizShareSection.vue`

**Location**: `web/components/QuizShareSection.vue`

A reusable component for quiz sharing functionality:

```vue
<template>
  <div v-if="shareUrl" class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
    <!-- Share link display and copy button -->
  </div>
</template>
```

**Props**:
- `shareUrl`: The share URL to display
- `isCopying`: Loading state for copy operation
- `onCopyClick`: Callback for copy button click

## Refactored Components

### QuizDisplay.vue (After Refactoring)

```vue
<script setup lang="ts">
import { useQuizInteractions } from '~/composables/useQuizInteractions'
import QuizQuestion from '~/components/QuizQuestion.vue'
import QuizShareSection from '~/components/QuizShareSection.vue'

// Use shared composable
const {
  showAnswers,
  selectedAnswers,
  copyingLink,
  resetInteractionState,
  toggleAnswer,
  selectAnswer,
  getOptionClass,
  getDifficultyClass,
  copyShareUrl,
  getLanguageDisplayName
} = useQuizInteractions()
</script>
```

### StreamingQuizDisplay.vue (After Refactoring)

```vue
<script setup lang="ts">
import { useQuizInteractions } from '~/composables/useQuizInteractions'
import QuizQuestion from '~/components/QuizQuestion.vue'

// Same shared composable usage
const {
  showAnswers,
  selectedAnswers,
  // ... other shared functionality
} = useQuizInteractions()
</script>
```

## Benefits of Refactoring

### 1. **Reduced Code Duplication**
- Eliminated ~200 lines of duplicate code
- Single source of truth for quiz interaction logic
- Consistent behavior across components

### 2. **Improved Maintainability**
- Changes to quiz interaction logic only need to be made in one place
- Easier to add new features or fix bugs
- Better separation of concerns

### 3. **Enhanced Testability**
- Composable can be tested independently
- Components are simpler and more focused
- Easier to write unit tests for specific functionality

### 4. **Better Developer Experience**
- Clear component hierarchy and responsibilities
- Reusable components can be used in future quiz-related features
- Self-documenting code structure

### 5. **Type Safety**
- Fixed TypeScript linter errors related to event handling
- Proper type definitions for all props and methods
- Better IDE support and autocomplete

## Usage Examples

### Using the Shared Composable

```typescript
// In any Vue component
import { useQuizInteractions } from '~/composables/useQuizInteractions'

export default defineComponent({
  setup() {
    const {
      showAnswers,
      selectedAnswers,
      selectAnswer,
      toggleAnswer,
      resetInteractionState
    } = useQuizInteractions()

    // Use the functionality
    return {
      showAnswers,
      selectedAnswers,
      selectAnswer,
      toggleAnswer,
      resetInteractionState
    }
  }
})
```

### Using the QuizQuestion Component

```vue
<template>
  <QuizQuestion
    :question="question"
    :index="0"
    :show-answers="showAnswers"
    :selected-answers="selectedAnswers"
    :select-answer="selectAnswer"
    :toggle-answer="toggleAnswer"
    :get-option-class="getOptionClass"
    :get-difficulty-class="getDifficultyClass"
    container-class="custom-styling"
  />
</template>
```

## Migration Guide

If you need to create new quiz-related components:

1. **Import the composable**: `import { useQuizInteractions } from '~/composables/useQuizInteractions'`
2. **Use the QuizQuestion component**: Import and use `QuizQuestion.vue` for individual questions
3. **Use the QuizShareSection component**: Import and use `QuizShareSection.vue` for share functionality
4. **Follow the established patterns**: Use the same prop passing patterns as in the refactored components

## Performance Considerations

- **Composable Reusability**: Each component instance gets its own state, preventing conflicts
- **Component Props**: Passing functions as props is efficient in Vue 3's reactivity system
- **Memory Management**: State is properly scoped and cleaned up when components unmount

## Future Enhancements

The refactoring enables several future improvements:

1. **Additional Question Types**: Easy to extend `QuizQuestion` component for new question formats
2. **Custom Themes**: Container classes can be used for different styling themes
3. **Analytics Integration**: Centralized interaction logic makes it easy to add tracking
4. **Accessibility Features**: Improvements can be made once in the shared components
5. **Animation Enhancements**: Shared components can have consistent animations

## Files Changed

- **Created**: `web/composables/useQuizInteractions.ts`
- **Created**: `web/components/QuizQuestion.vue`
- **Created**: `web/components/QuizShareSection.vue`
- **Created**: `web/components/QuizScoreCard.vue`
- **Modified**: `web/components/QuizDisplay.vue`
- **Modified**: `web/components/StreamingQuizDisplay.vue`

## Recent Updates - Score Tracking

### Score Functionality Added
The refactored architecture has been extended to include real-time score tracking:

- **Score State Management**: Added `answeredQuestions` and `correctAnswers` tracking in the composable
- **Score Calculations**: Real-time percentage calculation, correct answer counting, and progress tracking
- **Visual Score Display**: Created `QuizScoreCard.vue` component with progress bars, score categories, and motivational messages
- **Answer Validation**: Automatic scoring when users select answers with immediate feedback
- **Performance Categories**: Score ranges from "Poor" to "Excellent" with color-coded feedback

### QuizScoreCard Component Features
- **Real-time Updates**: Score updates immediately when answers are selected
- **Progress Tracking**: Shows progress through the quiz with visual progress bar
- **Score Categories**: Contextual feedback based on performance level
- **Motivational Messages**: Encouraging messages based on current score
- **Responsive Design**: Clean, accessible design that fits the existing UI

## Testing Recommendations

1. **Unit Tests for Composable**: Test all functions in `useQuizInteractions`
2. **Component Tests**: Test `QuizQuestion` and `QuizShareSection` in isolation
3. **Integration Tests**: Test the refactored `QuizDisplay` and `StreamingQuizDisplay` components
4. **Visual Regression Tests**: Ensure UI appearance is unchanged after refactoring 