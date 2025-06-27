# Quiz Module

## Overview

The Quiz Module handles all quiz-related functionality including quiz retrieval, listing, and management. It no longer handles quiz generation via HTTP (moved to WebSocket-only).

## Files

```
src/modules/quiz/
├── quiz.module.ts      # Module definition
├── quiz.controller.ts  # HTTP endpoints
└── quiz.service.ts     # Business logic
```

## Dependencies

- **Storage Module**: For quiz data persistence
- **AI Module**: For AI-powered quiz generation
- **FileServerService**: For PDF processing

## Controller Endpoints

### GET /quizzes
List all generated quizzes with metadata.

**Response:**
```json
{
  "success": true,
  "quizzes": [...],
  "total": 42,
  "count": 42
}
```

### GET /quizzes/:magicLink
Retrieve a specific quiz by its magic link.

**Parameters:**
- `magicLink`: Unique identifier for the quiz

**Response:**
```json
{
  "success": true,
  "quiz": {
    "id": "quiz_123",
    "title": "Generated Quiz Title",
    "description": "AI-generated description",
    "questions": [...],
    "metadata": {...}
  }
}
```

## Service Methods

### Core Methods
- `getQuizByMagicLink(magicLink: string)` - Retrieve quiz by magic link
- `getQuizById(quizId: string)` - Retrieve quiz by ID (backward compatibility)
- `listQuizzes()` - Get all quizzes with pagination support
- `saveQuiz(quiz: Quiz)` - Save quiz to storage
- `deleteQuizByMagicLink(magicLink: string)` - Delete quiz

### Quiz Generation (WebSocket-only)
- `pdfToQuizStream(filename: string, options: PdfToQuizOptions)` - Generate quiz from PDF with streaming updates

## Features

1. **Magic Link System**: Secure, URL-safe quiz identifiers
2. **Streaming Generation**: Real-time quiz generation progress
3. **AI Integration**: AI-powered title and description generation
4. **Storage Abstraction**: Works with both local and cloud storage
5. **Error Handling**: Comprehensive error management

## Dependencies Injected

- `FileServerService`: PDF processing and page extraction
- `AiService`: Question generation and metadata creation
- `StorageService`: Data persistence layer

## Migration Notes

- Removed SSE (Server-Sent Events) HTTP endpoint
- Quiz generation now exclusively via WebSocket
- Simplified controller with focus on data retrieval
- Enhanced error handling and logging