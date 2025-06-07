# QuizMaker Service Documentation

## Overview
The QuizMaker Service is the core component responsible for converting PDF documents into interactive quizzes using AI-powered question generation. It has been optimized for performance and includes comprehensive logging for monitoring and debugging.

## Architecture

### Service Structure
```
QuizmakerService
├── FileServerService (PDF processing)
├── AiService (ChatGPT integration)
└── Models (Quiz and PDF interfaces)
```

## Performance Optimizations

### Speed Improvements (Latest Update)
- **Text-Only Processing**: Image generation is now optional and disabled by default for 10-50x faster processing
- **Intelligent Page Filtering**: Skips pages with insufficient content (< 50 characters)
- **Error Resilience**: Failed pages don't break entire quiz generation
- **Parallel Processing**: Optimized for concurrent page processing

### Expected Performance
- **Before Optimization**: 60+ seconds (PDF conversion + AI processing)
- **After Optimization**: 10-30 seconds (text extraction + AI processing only)

## Detailed Logging System

### Log Levels and Information
- **Request Tracking**: Full request lifecycle with timing
- **PDF Processing**: Step-by-step progress indicators
- **AI API Monitoring**: Token usage and response times
- **Error Tracking**: Stack traces and context
- **Performance Metrics**: Processing times per component

### Sample Log Output
```
[QuizmakerService] Starting PDF to quiz conversion for: ./uploads/document.pdf
[FileServerService] Starting PDF processing for: ./uploads/document.pdf
[FileServerService] PDF parsed successfully. Pages: 5, Text length: 12847
[QuizmakerService] Processing page 1/5 (2145 characters)
[AiService] OpenAI API response received in 3421ms
[QuizmakerService] Generated 2 questions for page 1
```

## Quiz Generation Process

### 1. PDF Processing
```typescript
// Text-only processing (optimized)
const pdfResult = await this.fileServerService.splitPdfToPages(filePath, false);
```

**Features:**
- Fast text extraction using `pdf-parse`
- Optional image generation for special use cases
- Intelligent text splitting per page
- Metadata extraction (title, author, creation date)

### 2. AI Question Generation
Each page with substantial content (>50 characters) is processed by ChatGPT to generate questions.

**AI Prompt Structure:**
```
Based on the following text content, create exactly 2 multiple-choice questions.

Requirements:
- Create questions of varying difficulty levels (easy, medium, hard)
- Each question must have exactly 4 answer options (A, B, C, D)
- Only one answer should be correct
- Include a brief explanation for why each correct answer is right
- Questions should test understanding, not just memorization
- Focus on key concepts and important information

Format your response as valid JSON array:
[
  {
    "question": "Your question text here?",
    "options": {
      "A": "First option",
      "B": "Second option", 
      "C": "Third option",
      "D": "Fourth option"
    },
    "correctAnswer": "A",
    "difficulty": "easy|medium|hard",
    "explanation": "Brief explanation (if requested)"
  }
]
```

### 3. Error Handling & Fallbacks
- **Page-Level Errors**: Individual page failures don't stop quiz generation
- **AI Parsing Failures**: Automatic fallback questions generated
- **API Rate Limits**: Graceful error handling with retry logic
- **Invalid Content**: Content validation before AI processing

## Quiz Format (Updated)

### QuizQuestion Interface
```typescript
interface QuizQuestion {
  id: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D'; // String-based format
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
  pageNumber: number;
}
```

### Quiz Interface
```typescript
interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  metadata: {
    sourceFile: string;
    totalPages: number;
    createdAt: Date;
    estimatedDuration: number; // in minutes
  };
}
```

## API Endpoints

### Generate Quiz from PDF
```http
POST /api/quiz/generate
Content-Type: multipart/form-data

file: [PDF file]
questionsPerPage: 2 (optional)
difficulty: "mixed" (optional: easy|medium|hard|mixed)
includeExplanations: true (optional)
```

**Response:**
```json
{
  "success": true,
  "quiz": {
    "id": "quiz_1749294685195_abc123def",
    "title": "Quiz from Document Name",
    "description": "AI-generated quiz from PDF content with 8 questions",
    "questions": [...],
    "metadata": {
      "sourceFile": "./uploads/document.pdf",
      "totalPages": 4,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "estimatedDuration": 12
    }
  }
}
```

## Configuration Options

### PdfToQuizOptions
```typescript
interface PdfToQuizOptions {
  questionsPerPage?: number;        // Default: 2
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed'; // Default: 'mixed'
  includeExplanations?: boolean;    // Default: true
}
```

### Service Configuration
```typescript
// In QuizmakerService constructor
const defaultOptions: Required<PdfToQuizOptions> = {
  questionsPerPage: 2,
  difficulty: 'mixed',
  includeExplanations: true,
};
```

## Performance Monitoring

### Key Metrics to Monitor
1. **PDF Processing Time**: Text extraction duration
2. **AI Response Time**: ChatGPT API call duration
3. **Total Generation Time**: End-to-end quiz creation
4. **Token Usage**: OpenAI API consumption
5. **Error Rates**: Failed page processing percentage

### Optimization Tips
1. **Enable Image Generation Only When Needed**: Set `generateImages: true` only for special use cases
2. **Adjust Questions Per Page**: Lower numbers for faster processing
3. **Filter Content Quality**: Ensure PDFs have sufficient text content
4. **Monitor Token Usage**: Track OpenAI costs and usage patterns

## Error Scenarios & Solutions

### Common Issues

#### 1. Slow Performance
**Symptoms**: Quiz generation takes >60 seconds
**Solution**: Ensure image generation is disabled (`generateImages: false`)

#### 2. AI Parsing Failures
**Symptoms**: Fallback questions generated
**Solution**: Check prompt format and content quality

#### 3. Insufficient Content
**Symptoms**: Pages skipped during processing
**Solution**: Verify PDF has extractable text content

#### 4. OpenAI API Errors
**Symptoms**: Empty question arrays returned
**Solution**: Check API key, rate limits, and account status

### Debugging with Logs
Enable debug logging to see detailed processing information:
```bash
# Set log level to debug
LOG_LEVEL=debug npm run start:dev
```

## Dependencies

### Required Packages
```json
{
  "pdf-parse": "^1.1.1",
  "pdf-poppler": "^0.2.1", 
  "openai": "^4.20.1",
  "@nestjs/config": "^3.1.1"
}
```

### System Dependencies
- **poppler-utils**: `brew install poppler` (macOS)
- **jpeg libraries**: `brew install jpeg jpeg-turbo` (macOS)

### Environment Variables
```bash
OPENAI_API_KEY=your_openai_api_key_here
LOG_LEVEL=info  # optional: debug, info, warn, error
```

## Usage Examples

### Basic Usage
```typescript
const quizmakerService = new QuizmakerService(fileServerService, aiService);

// Generate quiz with default options
const quiz = await quizmakerService.pdfToQuiz('./uploads/document.pdf');

// Generate quiz with custom options
const customQuiz = await quizmakerService.pdfToQuiz('./uploads/document.pdf', {
  questionsPerPage: 3,
  difficulty: 'hard',
  includeExplanations: true
});
```

### Advanced Usage with Image Generation
```typescript
// Enable image generation for special use cases
const pdfResult = await fileServerService.splitPdfToPages(filePath, true);
```

## Future Enhancements

### Planned Features
- **Quiz Storage**: Persistent quiz saving and retrieval
- **Question Banks**: Reusable question libraries
- **Advanced Analytics**: Detailed performance metrics
- **Batch Processing**: Multiple PDF processing
- **Custom AI Models**: Support for different AI providers

### Performance Roadmap
- **Caching Layer**: Redis-based response caching
- **Parallel Processing**: Multi-threaded PDF processing
- **Smart Content Analysis**: Better page content evaluation
- **Progressive Generation**: Real-time question streaming

## Troubleshooting

### Performance Issues
1. Check if image generation is enabled unnecessarily
2. Monitor OpenAI API response times
3. Verify PDF content quality and size
4. Review log output for bottlenecks

### Quality Issues
1. Adjust difficulty settings
2. Increase questions per page for better coverage
3. Review source PDF content quality
4. Check AI prompt effectiveness

### Integration Issues
1. Verify environment variables are set
2. Check service dependencies injection
3. Ensure proper error handling in calling code
4. Monitor log output for service startup issues

For additional support, check the logs for detailed error information and timing metrics. 