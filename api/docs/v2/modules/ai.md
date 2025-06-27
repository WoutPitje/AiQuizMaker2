# AI Module

## Overview

The AI Module encapsulates all artificial intelligence functionality, including question generation, quiz metadata creation, and language support.

## Files

```
src/modules/ai/
├── ai.module.ts      # Module definition
└── ai.service.ts     # AI service implementation
```

## AI Service

### Core Methods

**Question Generation:**
- `generateQuestionsFromPageContent(content, pageNumber, options)` - Generate questions from PDF page content
- `generateQuizTitle(documentContent, filename, language)` - Create AI-powered quiz title
- `generateQuizDescription(content, totalPages, totalQuestions, language)` - Generate quiz description

**Configuration:**
- `getSupportedLanguages()` - List available languages for quiz generation

### Supported Languages

```typescript
const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' }
];
```

### Question Generation Options

```typescript
interface GenerateQuestionsOptions {
  questionsPerPage?: number;      // Default: 2
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';  // Default: 'mixed'
  includeExplanations?: boolean;  // Default: true
  generateImages?: boolean;       // Default: false
  language?: string;              // Default: 'en'
}
```

### Question Types Generated

1. **Multiple Choice**: 4 options with one correct answer
2. **True/False**: Boolean questions with explanations
3. **Fill in the Blank**: Text completion questions
4. **Short Answer**: Brief response questions

### AI Provider Integration

**OpenAI GPT Integration:**
- Uses OpenAI API for natural language processing
- Configurable model selection
- Token usage optimization
- Rate limiting support

**Environment Variables:**
- `OPENAI_API_KEY` - OpenAI API key
- `OPENAI_MODEL` - Model to use (default: gpt-3.5-turbo)

### Example Generated Content

**Quiz Title Generation:**
```
Input: Finance document about investments
Output: "Investment Fundamentals and Portfolio Management Quiz"
```

**Quiz Description Generation:**
```
Input: 15-page document, 30 questions
Output: "Test your knowledge of investment principles, portfolio diversification, and risk management strategies covered in this comprehensive 15-page guide. This quiz contains 30 carefully crafted questions designed to assess your understanding of key financial concepts."
```

## Features

1. **Multi-language Support**: Generate quizzes in 12+ languages
2. **Adaptive Difficulty**: Mix easy, medium, and hard questions
3. **Content Analysis**: Intelligent extraction of key concepts
4. **Explanation Generation**: Detailed explanations for answers
5. **Context Awareness**: Questions based on document context

## Quality Assurance

- **Content Filtering**: Ensures appropriate question content
- **Duplicate Detection**: Prevents repetitive questions
- **Difficulty Balancing**: Maintains appropriate challenge level
- **Language Consistency**: Questions match selected language

## Performance Optimization

- **Batched Processing**: Efficient API usage
- **Caching**: Reduced redundant API calls
- **Error Recovery**: Fallback strategies for API failures
- **Token Management**: Optimized prompt engineering

## Integration Points

- **Quiz Module**: Primary consumer for question generation
- **WebSocket Module**: Real-time generation progress updates
- **Config Module**: Language configuration exposure