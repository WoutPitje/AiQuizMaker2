# Quick Start Guide - AiQuizMaker

## What's New (Performance Update)
🚀 **10-50x Faster Processing**: Image generation is now optional and disabled by default  
📊 **Detailed Logging**: Comprehensive monitoring and debugging information  
🎯 **Improved Quiz Format**: String-based options (A, B, C, D) for better UX  
🛡️ **Better Error Handling**: Resilient processing with automatic fallbacks  

## Overview
AiQuizMaker is an AI-powered application that converts PDF documents into interactive quizzes using ChatGPT. The application consists of a NestJS backend for AI processing and a Nuxt.js frontend for the user interface.

## Prerequisites
- **Node.js 18+** and **npm 8+**
- **OpenAI API Key** (required for quiz generation)
- **System Dependencies**: poppler-utils, JPEG libraries (macOS)

## Quick Setup (5 Minutes)

### 1. Install System Dependencies
```bash
# macOS
brew install poppler jpeg jpeg-turbo

# Ubuntu/Debian
sudo apt-get install poppler-utils

# Windows (WSL)
sudo apt-get install poppler-utils
```

### 2. Environment Configuration
```bash
# Create environment file
echo "OPENAI_API_KEY=your_openai_key_here" > api/.env
echo "LOG_LEVEL=info" >> api/.env
```

### 3. Install & Start
```bash
# Install dependencies
cd api && npm install
cd ../web && npm install

# Start backend (Terminal 1)
cd api && npm run start:dev

# Start frontend (Terminal 2) 
cd web && npm run dev
```

### 4. Access Application
- **Frontend**: http://localhost:3000 (Upload PDFs and generate quizzes)
- **Backend**: http://localhost:3001 (API endpoints)

## Expected Performance

### Generation Times
- **Small PDFs** (1-5 pages): 10-20 seconds
- **Medium PDFs** (5-15 pages): 20-45 seconds  
- **Large PDFs** (15+ pages): 45-90 seconds

### Performance Optimizations Applied
- ✅ Text-only processing (no image generation)
- ✅ Intelligent page filtering (skips pages < 50 characters)
- ✅ Error resilience (failed pages don't break generation)
- ✅ Detailed progress logging

## Usage Workflow

### 1. Upload Single PDF File
- Visit http://localhost:3000
- Drag & drop or click to upload **one PDF file**
- **Single File Only**: Only one PDF can be uploaded at a time
- **Automatic Replacement**: Uploading a new file replaces the previous one
- Only PDF files are accepted (validated client and server-side)

### 2. Configure Quiz Options
- **Language Selection**: Choose from 16 supported languages for quiz generation
- **Questions per Page**: 1-5 questions (default: 2)
- **Difficulty Level**: Easy, medium, hard, or mixed (default: mixed)
- **Include Explanations**: Toggle detailed answer explanations (default: enabled)

### 3. Generate Quiz
- Click "Generate Quiz" button on uploaded file
- **Single Generation**: Only one quiz can be generated at a time
- **UI Disabled**: All controls disabled during generation to prevent conflicts
- **Progress Indicators**: Visual feedback and warning messages during processing
- Monitor progress in browser console or backend logs
- Generation time: 1-3 minutes depending on PDF size

### 4. View & Share Quiz
- **Quiz Interface**: Modern card-based layout with individual question cards
- **Answer Options**: A, B, C, D format with clickable buttons
- **Show/Hide Answers**: Individual toggle per question with green highlighting
- **Magic Link Sharing**: Automatic generation of shareable quiz links
- **Copy to Clipboard**: One-click sharing via clipboard
- **Persistent Access**: Shared quizzes remain accessible permanently

### 5. Single File Management
- **One at a Time**: Focus on generating the best quiz from one PDF
- **Clear State**: Uploading new file clears previous quiz and file
- **Remove File**: Delete current file and associated quiz
- **Start Over**: Upload new file to begin fresh workflow

## Monitoring & Debugging

### Real-Time Logs
The application provides detailed logging throughout the quiz generation process:

```bash
# Backend logs show progress
[QuizmakerService] Starting PDF to quiz conversion for: ./uploads/document.pdf
[FileServerService] PDF parsed successfully. Pages: 5, Text length: 12847
[QuizmakerService] Processing page 1/5 (2145 characters)
[AiService] OpenAI API response received in 3421ms
[QuizmakerService] Generated 2 questions for page 1
```

### Debug Mode
For detailed debugging information:
```bash
cd api
LOG_LEVEL=debug npm run start:dev
```

This will show:
- Token usage per API call
- Content length per page
- Processing times for each step
- AI response parsing details

### Performance Monitoring
```bash
# Time quiz generation
time curl -X POST http://localhost:3001/api/quiz/generate/[filename]

# Monitor memory usage
ps aux | grep node
```

## Configuration Options

### PDF Processing Settings
```bash
# In api/.env
MAX_PDF_SIZE=104857600     # 100MB limit (configurable)
MAX_PAGES_PER_PDF=50      # Page limit for large PDFs
DEFAULT_QUESTIONS_PER_PAGE=2
LOG_LEVEL=info            # debug, info, warn, error
```

### Quiz Generation Options
When generating quizzes, you can customize:
- **Questions per page**: 1-5 questions (default: 2)
- **Difficulty**: easy, medium, hard, or mixed (default: mixed)
- **Explanations**: Include/exclude answer explanations (default: true)

## API Usage

### Upload PDF
```bash
curl -X POST http://localhost:3001/upload \
  -F "file=@document.pdf"
```

### Generate Quiz
```bash
curl -X POST http://localhost:3001/api/quiz/generate/[filename] \
  -H "Content-Type: application/json" \
  -d '{
    "questionsPerPage": 2,
    "difficulty": "mixed",
    "includeExplanations": true
  }'
```

## Troubleshooting

### Common Issues

#### 1. "OPENAI_API_KEY not found"
```bash
# Check your .env file
cat api/.env | grep OPENAI_API_KEY

# Ensure no extra spaces
echo "OPENAI_API_KEY=sk-your-key-here" > api/.env
```

#### 2. "pdf-poppler: Command failed"
```bash
# Verify poppler installation
which pdftoppm

# Reinstall if needed
brew install poppler  # macOS
sudo apt-get install poppler-utils  # Linux
```

#### 3. Slow Performance (>60 seconds)
```bash
# Check if image generation is accidentally enabled
grep -r "generateImages.*true" api/src/

# Should see: "Skipping image generation, creating text-only pages..."
```

#### 4. JPEG Library Error (macOS)
```bash
# Create symlink
sudo ln -sf /usr/local/opt/jpeg-turbo/lib/libjpeg.8.dylib /usr/local/opt/jpeg/lib/libjpeg.9.dylib
```

### Getting Help
1. **Check Logs**: Backend logs show detailed error information
2. **Enable Debug**: Set `LOG_LEVEL=debug` for verbose output  
3. **Monitor Performance**: Use timing logs to identify bottlenecks
4. **Verify Environment**: Ensure all dependencies and env vars are set

## Architecture Overview

### Backend (NestJS - Port 3001)
- **AiService**: OpenAI ChatGPT integration for question generation
- **FileServerService**: PDF processing and text extraction
- **QuizmakerService**: Orchestrates PDF-to-quiz conversion
- **Controllers**: REST API endpoints for file upload and quiz generation

### Frontend (Nuxt.js - Port 3000)
- **Components**: FileDropbox, FileList, QuizDisplay
- **Stores**: Pinia store for state management
- **Composables**: API communication and utility functions
- **Pages**: File-based routing with index page

### Data Flow
```
PDF Upload → Text Extraction → AI Processing → Quiz Generation → Frontend Display
```

## Development Tips

### 1. Performance Optimization
- Keep image generation disabled unless specifically needed
- Monitor token usage for OpenAI costs
- Use debug logging to identify bottlenecks
- Test with various PDF types and sizes

### 2. Content Quality
- PDFs with more text content generate better questions
- Pages with <50 characters are automatically skipped
- Scanned PDFs may have poor text extraction

### 3. Cost Management
- Monitor OpenAI API usage at https://platform.openai.com/usage
- Adjust questions per page to control token consumption
- Use debug logs to track token usage per request

## Next Steps

### Advanced Features
- **Quiz Storage**: Implement persistent quiz saving
- **Question Banks**: Create reusable question libraries  
- **Batch Processing**: Process multiple PDFs simultaneously
- **Analytics**: Track quiz performance and usage metrics

### Production Deployment
- Set up proper environment variables
- Configure logging for production
- Implement rate limiting for API endpoints
- Add proper error monitoring and alerting

## Support Resources
- **Documentation**: See `/Documentation` folder for detailed guides
- **Logs**: Check backend console for detailed error information
- **Performance**: Use debug mode for timing and optimization data
- **API Reference**: Backend logs show all available endpoints and responses

Start with a small PDF (1-3 pages) to test the system, then gradually work with larger documents as you become familiar with the performance characteristics. 