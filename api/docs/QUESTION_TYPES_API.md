# Question Types API Reference

Technical documentation for implementing and working with different question types in the AiQuizMaker API.

## API Endpoints

All question types are generated through the same endpoints:

### Generate Quiz (Streaming)
```
POST /api/quiz/generate-stream
```

Request body:
```json
{
  "fileId": "uploaded-file-id",
  "options": {
    "questionsPerPage": 3,
    "difficulty": "medium",
    "includeExplanations": true,
    "language": "en",
    "questionTypes": ["multiple-choice", "true-false", "matching"]
  }
}
```

### Generate Quiz (Standard)
```
POST /api/quiz/generate
```

## Question Type Options

### Available Types
- `multiple-choice` - Traditional 4-option questions
- `flashcard` - Two-sided study cards
- `true-false` - Binary true/false statements
- `fill-in-blank` - Text with blanks to complete
- `short-answer` - Open-ended text responses
- `matching` - Connect items from two columns
- `mixed` - Random mix of all types

### Specifying Question Types

#### Single Type
```json
{
  "questionTypes": ["multiple-choice"]
}
```

#### Multiple Specific Types
```json
{
  "questionTypes": ["multiple-choice", "true-false", "matching"]
}
```

#### Mixed Types
```json
{
  "questionTypes": ["mixed"]
}
// OR
{
  "quizType": "mixed"
}
```

## AI Prompt Templates

The AI receives specific formatting instructions for each question type:

### Multiple Choice
```json
{
  "type": "multiple-choice",
  "question": "Clear question text",
  "options": {
    "A": "First option",
    "B": "Second option",
    "C": "Third option",
    "D": "Fourth option"
  },
  "correctAnswer": "B",
  "difficulty": "medium",
  "explanation": "Why B is correct"
}
```

### Flashcard
```json
{
  "type": "flashcard",
  "front": "Question or concept",
  "back": "Answer or explanation",
  "difficulty": "easy",
  "explanation": "Additional context"
}
```

### True/False
```json
{
  "type": "true-false",
  "statement": "Statement to evaluate",
  "correctAnswer": true,
  "difficulty": "easy",
  "explanation": "Why this is true/false"
}
```

### Fill in the Blank
```json
{
  "type": "fill-in-blank",
  "text": "The capital of {{blank}} is {{blank}}",
  "blanks": ["France", "Paris"],
  "difficulty": "easy",
  "explanation": "Explanation of the answer"
}
```

### Short Answer
```json
{
  "type": "short-answer",
  "question": "Explain photosynthesis",
  "expectedAnswer": "Full expected answer",
  "keywords": ["light", "energy", "glucose"],
  "difficulty": "medium",
  "explanation": "Answer explanation"
}
```

### Matching
```json
{
  "type": "matching",
  "leftItems": [
    {"id": "L1", "text": "Item 1"},
    {"id": "L2", "text": "Item 2"}
  ],
  "rightItems": [
    {"id": "R1", "text": "Match 1"},
    {"id": "R2", "text": "Match 2"}
  ],
  "correctPairs": [
    {"leftId": "L1", "rightId": "R1"},
    {"leftId": "L2", "rightId": "R2"}
  ],
  "difficulty": "medium",
  "explanation": "Explanation of matches"
}
```

## Response Parsing

The AI service parses responses based on the question type:

```typescript
switch (questionType) {
  case 'multiple-choice':
    // Parse standard format or legacy format
    break;
  case 'flashcard':
    // Extract front/back content
    break;
  case 'true-false':
    // Parse statement and boolean answer
    break;
  case 'fill-in-blank':
    // Extract text with {{blank}} markers
    break;
  case 'short-answer':
    // Parse question, answer, and keywords
    break;
  case 'matching':
    // Parse items and pairs
    break;
  default:
    // Fallback to multiple-choice
}
```

## Database Storage

All question types are stored in the `quizzes` table:

```sql
CREATE TABLE quizzes (
  id SERIAL PRIMARY KEY,
  quiz_id VARCHAR(255) UNIQUE NOT NULL,
  quiz_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER REFERENCES users(id)
);
```

The `quiz_data` JSONB column stores the complete quiz structure with all question types.

## Frontend Integration

### Type Definitions
```typescript
// Union type for all questions
export type QuizQuestion = 
  | MultipleChoiceQuestion
  | FlashcardQuestion
  | TrueFalseQuestion
  | FillInTheBlankQuestion
  | ShortAnswerQuestion
  | MatchingQuestion;
```

### Component Routing
The `QuizQuestion.vue` component routes to the appropriate component based on type guards:

```vue
<MultipleChoiceQuestion v-if="isMultipleChoice(question)" />
<FlashcardQuestion v-else-if="isFlashcard(question)" />
<TrueFalseQuestion v-else-if="isTrueFalse(question)" />
<!-- etc... -->
```

## Scoring Algorithms

### Binary Scoring (Multiple Choice, True/False)
- Correct: 100%
- Incorrect: 0%

### Self-Assessment (Flashcards)
- Rating 3-4: Counted as correct
- Rating 1-2: Counted as incorrect

### Partial Credit (Fill in the Blank)
- Score = (Correct Blanks / Total Blanks) × 100%

### Keyword-Based (Short Answer)
- Good: ≥60% keywords found + minimum length
- Tracks keywords found vs total

### Match-Based (Matching)
- Score = (Correct Pairs / Total Pairs) × 100%
- Overall correct if ≥60% matches are right

## Best Practices

### AI Prompt Engineering
1. Always include explicit type field
2. Provide clear examples in system prompt
3. Add validation rules for each type
4. Include fallback handling

### Error Handling
1. Validate question structure before saving
2. Provide defaults for missing fields
3. Log malformed questions for debugging
4. Gracefully fallback to multiple-choice

### Performance Considerations
1. Limit question generation per request
2. Use streaming for real-time feedback
3. Cache generated questions when possible
4. Batch database operations

## Extending Question Types

To add a new question type:

1. **Define the TypeScript interface** in `quiz.model.ts`
2. **Add AI prompt template** in `ai.service.ts`
3. **Add parsing logic** in `parseAiResponse()`
4. **Create Vue component** in `/web/components/`
5. **Add type guard** in `questionTypes.ts`
6. **Update QuizQuestion union type**
7. **Add to FileList options**
8. **Update scoring logic** in `useQuizInteractions`
9. **Document the new type**

## Common Issues and Solutions

### Issue: AI not generating correct format
**Solution**: Add more explicit instructions and examples to the system prompt

### Issue: Question type defaulting to multiple-choice
**Solution**: Ensure the AI response includes the correct "type" field

### Issue: Scoring not working for new type
**Solution**: Update the scoring logic in `useQuizInteractions.ts`

### Issue: Type not appearing in dropdown
**Solution**: Add to FileList component and questionTypes array