# AiQuizMaker Question Types Documentation

This document describes all supported question types in the AiQuizMaker system, including their data structures, UI components, and scoring mechanisms.

## Table of Contents

1. [Multiple Choice](#multiple-choice)
2. [Flashcards](#flashcards)
3. [True/False](#truefalse)
4. [Fill in the Blank](#fill-in-the-blank)
5. [Short Answer](#short-answer)
6. [Matching](#matching)
7. [Mixed Types](#mixed-types)

---

## Multiple Choice

### Description
Traditional multiple-choice questions with 4 options (A, B, C, D) where users select one correct answer.

### Data Structure
```typescript
interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice'
  question: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  correctAnswer: 'A' | 'B' | 'C' | 'D'
}
```

### Example
```json
{
  "type": "multiple-choice",
  "question": "What is the capital of France?",
  "options": {
    "A": "London",
    "B": "Paris",
    "C": "Berlin",
    "D": "Madrid"
  },
  "correctAnswer": "B",
  "difficulty": "easy",
  "explanation": "Paris has been the capital of France since 987 AD."
}
```

### UI Features
- Radio button-style selection
- Color-coded feedback (green for correct, red for incorrect)
- Show/hide answer toggle
- Explanation display

### Scoring
- Binary scoring: 100% for correct answer, 0% for incorrect

---

## Flashcards

### Description
Two-sided cards with a question/concept on the front and answer/explanation on the back. Users self-assess their knowledge.

### Data Structure
```typescript
interface FlashcardQuestion extends BaseQuestion {
  type: 'flashcard'
  front: string  // Question or concept
  back: string   // Answer or explanation
}
```

### Example
```json
{
  "type": "flashcard",
  "front": "What is photosynthesis?",
  "back": "The process by which plants use sunlight, water, and CO2 to create oxygen and energy in the form of sugar.",
  "difficulty": "medium",
  "explanation": "This is a fundamental biological process essential for life on Earth."
}
```

### UI Features
- 3D flip animation
- Self-assessment buttons (1-4 rating)
- Visual card metaphor

### Scoring
- Self-assessment based:
  - Ratings 3-4: Considered "correct" (well-known)
  - Ratings 1-2: Considered "incorrect" (needs review)

---

## True/False

### Description
Binary choice questions where users determine if a statement is true or false.

### Data Structure
```typescript
interface TrueFalseQuestion extends BaseQuestion {
  type: 'true-false'
  statement: string
  correctAnswer: boolean
}
```

### Example
```json
{
  "type": "true-false",
  "statement": "The Earth revolves around the Sun",
  "correctAnswer": true,
  "difficulty": "easy",
  "explanation": "The Earth completes one revolution around the Sun in approximately 365.25 days."
}
```

### UI Features
- Two large buttons (True ✅ / False ❌)
- Clear visual distinction between options
- Immediate feedback on selection

### Scoring
- Binary scoring: 100% for correct answer, 0% for incorrect

---

## Fill in the Blank

### Description
Questions with one or more blanks that users must fill in with the correct text.

### Data Structure
```typescript
interface FillInTheBlankQuestion extends BaseQuestion {
  type: 'fill-in-blank'
  text: string        // Text with {{blank}} markers
  blanks: string[]    // Correct answers for each blank
}
```

### Example
```json
{
  "type": "fill-in-blank",
  "text": "The capital of {{blank}} is {{blank}}",
  "blanks": ["France", "Paris"],
  "difficulty": "easy",
  "explanation": "France is a European country and Paris has been its capital since 987 AD."
}
```

### UI Features
- Inline text input fields
- Multiple blanks support
- Real-time validation
- Case-insensitive matching

### Scoring
- Partial credit: Score based on percentage of blanks filled correctly
- Each blank is evaluated independently

### Important Notes
- Text must contain `{{blank}}` markers where answers should go
- Number of `{{blank}}` markers must match the length of the `blanks` array
- Answers are matched case-insensitively with trimmed whitespace

---

## Short Answer

### Description
Open-ended questions requiring detailed text responses. Evaluated based on keyword presence.

### Data Structure
```typescript
interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short-answer'
  question: string
  expectedAnswer: string
  keywords: string[]  // Key terms that should appear in the answer
}
```

### Example
```json
{
  "type": "short-answer",
  "question": "Explain the process of photosynthesis",
  "expectedAnswer": "Photosynthesis is the process by which plants convert light energy into chemical energy, using carbon dioxide and water to produce glucose and oxygen.",
  "keywords": ["light", "energy", "carbon dioxide", "water", "glucose", "oxygen"],
  "difficulty": "medium",
  "explanation": "A complete answer should mention all key components of the photosynthesis process."
}
```

### UI Features
- Multi-line textarea
- Character counter
- Keyword highlighting in review
- Ctrl/Cmd + Enter to submit

### Scoring
- Keyword-based evaluation:
  - Tracks how many keywords appear in the answer
  - "Good" answer: ≥60% keywords + minimum 20 characters
  - Shows X/Y keywords found

---

## Matching

### Description
Connect related items from two columns by creating pairs.

### Data Structure
```typescript
interface MatchingQuestion extends BaseQuestion {
  type: 'matching'
  leftItems: { id: string; text: string }[]
  rightItems: { id: string; text: string }[]
  correctPairs: { leftId: string; rightId: string }[]
}
```

### Example
```json
{
  "type": "matching",
  "leftItems": [
    {"id": "L1", "text": "Photosynthesis"},
    {"id": "L2", "text": "Respiration"},
    {"id": "L3", "text": "Transpiration"}
  ],
  "rightItems": [
    {"id": "R1", "text": "Converts light to chemical energy"},
    {"id": "R2", "text": "Breaks down glucose for energy"},
    {"id": "R3", "text": "Water movement through plants"}
  ],
  "correctPairs": [
    {"leftId": "L1", "rightId": "R1"},
    {"leftId": "L2", "rightId": "R2"},
    {"leftId": "L3", "rightId": "R3"}
  ],
  "difficulty": "medium",
  "explanation": "These are fundamental plant processes."
}
```

### UI Features
- Two-column layout
- Click to select left item, then right item to match
- Visual connections between matched pairs
- Clear all matches button
- Shuffled right column for added challenge

### Scoring
- Partial credit based on correct matches
- Overall "correct" if ≥60% of pairs are matched correctly
- Shows X/Y correct matches

---

## Mixed Types

### Description
A quiz containing a random mix of all available question types.

### Selection
When "Mixed Types" is selected, the system randomly includes questions from all implemented types:
- Multiple Choice
- Flashcards
- True/False
- Fill in the Blank
- Short Answer
- Matching

### Benefits
- Variety keeps learners engaged
- Tests different types of knowledge
- Prevents pattern recognition
- More comprehensive assessment

---

## Common Features Across All Types

### Base Properties
All question types share these common properties:
```typescript
interface BaseQuestion {
  id: string
  type: string
  difficulty: 'easy' | 'medium' | 'hard'
  explanation: string
  pageNumber: number
  language?: string
}
```

### Shared UI Elements
- Question number and type indicator
- Difficulty badge
- Page number reference
- Show/Hide answer toggle
- Explanation section
- Consistent card-based layout

### Scoring System Integration
- All question types integrate with the central scoring system
- Progress tracking works across all types
- Magic link sharing preserves answers for all types
- Score calculation adapts to each question type's characteristics

---

## Implementation Notes

### Frontend Components
Each question type has a dedicated Vue component:
- `MultipleChoiceQuestion.vue`
- `FlashcardQuestion.vue`
- `TrueFalseQuestion.vue`
- `FillInTheBlankQuestion.vue`
- `ShortAnswerQuestion.vue`
- `MatchingQuestion.vue`

### Type Guards
TypeScript type guards ensure type safety:
```typescript
isMultipleChoice(question)
isFlashcard(question)
isTrueFalse(question)
isFillInTheBlank(question)
isShortAnswer(question)
isMatching(question)
```

### AI Generation
The AI service includes specific prompts and templates for each question type to ensure proper formatting and variety.