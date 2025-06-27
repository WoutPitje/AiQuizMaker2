# WebSocket Module

## Overview

The WebSocket Module handles real-time quiz generation with live progress updates. This is the primary method for quiz generation in v2, replacing the HTTP SSE approach.

## Files

```
src/modules/websocket/
├── websocket.module.ts        # Module definition
└── quiz-websocket.gateway.ts  # WebSocket gateway
```

## Dependencies

- **Quiz Module**: For quiz generation logic
- **Storage Module**: For file validation and storage

## WebSocket Gateway

### Connection Details

**Namespace:** `/quiz`
**URL:** `ws://localhost:3001/quiz` (development)

**CORS Configuration:**
```typescript
cors: {
  origin: [
    'http://localhost:3000',
    'https://localhost:3000',
    'https://quizai.nl',
    'https://www.quizai.nl',
    'https://api.quizai.nl',
    'https://www.api.quizai.nl',
  ],
  credentials: true
}
```

### Events

#### Client → Server

**`generate-quiz`** - Start quiz generation
```typescript
{
  filename: string;           // Uploaded file name
  options?: {
    questionsPerPage?: number;
    difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
    includeExplanations?: boolean;
    generateImages?: boolean;
    language?: string;
  }
}
```

#### Server → Client

**`connection`** - Connection established
```typescript
{
  type: 'connection',
  message: 'WebSocket connected successfully',
  timestamp: string,
  clientId: string
}
```

**`quiz-event`** - Generation progress updates
```typescript
{
  type: 'start' | 'progress' | 'pdf-processed' | 'page-processing' | 
        'question-generated' | 'page-skipped' | 'page-warning' | 
        'page-error' | 'generating-metadata' | 'metadata-generated' | 
        'finalizing' | 'heartbeat',
  data: {
    message?: string;
    stage?: string;
    currentPage?: number;
    totalPages?: number;
    totalQuestions?: number;
    question?: QuizQuestion;
    // ... other type-specific data
  }
}
```

**`quiz-error`** - Generation errors
```typescript
{
  type: 'error',
  message: string,
  error?: string,
  stage?: string
}
```

**`quiz-complete`** - Generation completed
```typescript
{
  type: 'completed',
  data: {
    quiz: Quiz;
    quizId: string;
    magicLink: string;
    shareUrl: string;
    totalQuestions: number;
    title: string;
    stats: {
      totalPages: number;
      pagesProcessed: number;
      totalQuestions: number;
      generatedAt: string;
    }
  }
}
```

### Generation Process Flow

1. **Client connects** → `connection` event
2. **Client emits `generate-quiz`** → Validation begins
3. **File validation** → `progress` events
4. **PDF processing** → `pdf-processed` event
5. **Page-by-page processing:**
   - `page-processing` for each page
   - `question-generated` for each question
   - `page-skipped` for insufficient content
   - `page-error` for processing failures
6. **Metadata generation** → `generating-metadata`, `metadata-generated`
7. **Finalization** → `finalizing`, `completed`

### Connection Management

**Features:**
- Automatic reconnection
- Connection tracking
- Heartbeat monitoring (30-second intervals)
- Graceful error handling
- Client identification

**Active Connections:**
```typescript
private activeConnections = new Map<string, { 
  socket: Socket; 
  quizId?: string 
}>();
```

### Error Handling

**Common Errors:**
- File not found
- PDF processing failures
- AI service errors
- Storage errors
- Network timeouts

**Error Recovery:**
- Automatic retries for transient failures
- Graceful degradation
- Client notification of all errors
- Connection cleanup on errors

### Performance Features

1. **Streaming Updates**: Real-time progress without blocking
2. **Heartbeat System**: Connection health monitoring
3. **Memory Management**: Automatic cleanup of completed connections
4. **Error Isolation**: Individual connection error handling
5. **Concurrent Processing**: Multiple quiz generation sessions

### Integration Benefits

- **Real-time Feedback**: Users see immediate progress
- **Better UX**: No need to poll for status
- **Scalability**: Handles multiple concurrent generations
- **Reliability**: Robust error handling and recovery
- **Monitoring**: Detailed connection and generation tracking