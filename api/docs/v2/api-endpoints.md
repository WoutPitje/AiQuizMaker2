# API Endpoints v2

## Overview

The v2 API maintains backward compatibility while providing cleaner, more RESTful endpoints. All quiz generation now uses WebSocket connections for real-time streaming.

## Base URL

```
Production: https://api.quizai.nl
Development: http://localhost:3001
```

## Endpoints

### Health Check
- **GET** `/` - Returns application status

### Configuration
- **GET** `/config` - Get application configuration
- **GET** `/languages` - Get supported languages for quiz generation

### File Upload
- **POST** `/upload` - Upload PDF file for quiz generation
  - Accepts: `multipart/form-data` with `file` field
  - Max size: 100MB
  - Supported: PDF files only

### Quiz Management
- **GET** `/quizzes` - List all generated quizzes
- **GET** `/quizzes/:magicLink` - Get quiz by magic link

### WebSocket Events

Quiz generation is handled via WebSocket connection to `/quiz` namespace.

#### Events to Emit
- `generate-quiz` - Start quiz generation
  ```json
  {
    "filename": "uploaded-file.pdf",
    "options": {
      "questionsPerPage": 2,
      "difficulty": "mixed",
      "includeExplanations": true,
      "language": "en"
    }
  }
  ```

#### Events to Listen
- `connection` - Connection established
- `quiz-event` - Quiz generation progress updates
- `quiz-error` - Generation errors
- `quiz-complete` - Generation completed

## Changes from v1

### Removed Endpoints
- **POST** `/quiz/generate-stream/:filename` - Replaced with WebSocket-only approach

### Updated Endpoints
- `/quiz/magic/:magicLink` → `/quizzes/:magicLink`
- Quiz generation now exclusively uses WebSocket for better real-time experience

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

Common error codes:
- `FILE_NOT_PROVIDED` - No file uploaded
- `INVALID_FILE_TYPE` - Non-PDF file uploaded
- `FILE_NOT_FOUND` - Referenced file doesn't exist
- `QUIZ_NOT_FOUND` - Quiz not found by magic link