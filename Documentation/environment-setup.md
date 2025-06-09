# Environment Setup Guide

## Overview
This guide covers the complete environment setup for the 🧠 QuizAi application, including system dependencies, environment variables, and performance optimization configurations.

## Prerequisites

### System Requirements
- **Node.js**: Version 18+ 
- **npm**: Version 8+
- **Operating System**: macOS, Linux, or Windows with WSL

### System Dependencies

#### 1. Poppler Utils (Required)
Needed for PDF processing and conversion.

**macOS:**
```bash
brew install poppler
```

**Ubuntu/Debian:**
```bash
sudo apt-get install poppler-utils
```

**Windows (WSL):**
```bash
sudo apt-get update
sudo apt-get install poppler-utils
```

#### 2. JPEG Libraries (macOS Only)
Required for PDF to image conversion on macOS.

```bash
# Install JPEG libraries
brew install jpeg jpeg-turbo

# Create required symlink (if needed)
sudo ln -sf /usr/local/opt/jpeg-turbo/lib/libjpeg.8.dylib /usr/local/opt/jpeg/lib/libjpeg.9.dylib
```

**Note**: This symlink fixes the common macOS error: `Library not loaded: /usr/local/opt/jpeg/lib/libjpeg.9.dylib`

## Environment Variables

### Required Variables

#### 1. OpenAI API Key (Required)
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

**How to get your API key:**
1. Visit [OpenAI Platform](https://platform.openai.com)
2. Sign in to your account
3. Navigate to API Keys section
4. Create a new secret key
5. Copy the key immediately (it won't be shown again)

#### 2. Optional Configuration Variables
```bash
# Application port (default: 3001)
PORT=3001

# Log level for debugging (default: info)
LOG_LEVEL=info  # Options: debug, info, warn, error

# Node environment
NODE_ENV=development  # or production
```

### Environment File Setup

#### 1. Backend (.env)
Create `api/.env` file:
```bash
# Required
OPENAI_API_KEY=sk-your-openai-key-here

# Optional
PORT=3001
LOG_LEVEL=info
NODE_ENV=development

# File Upload Settings (Optional)
MAX_PDF_SIZE=104857600  # 100MB in bytes (100 * 1024 * 1024)
MAX_PAGES_PER_PDF=50
DEFAULT_QUESTIONS_PER_PAGE=2

# Alternative file size examples:
# MAX_PDF_SIZE=52428800   # 50MB
# MAX_PDF_SIZE=209715200  # 200MB
# MAX_PDF_SIZE=524288000  # 500MB
```

#### 2. Frontend (.env)
Create `web/.env` file:
```bash
# API Configuration
NUXT_PUBLIC_API_URL=http://localhost:3001
```

## Performance Configuration

### Optimization Settings

#### 1. PDF Processing Options
```typescript
// In your application code
const pdfOptions = {
  generateImages: false,  // Disable for 10-50x speed improvement
  questionsPerPage: 2,    // Lower = faster processing
  maxPages: 50,          // Limit for large PDFs
  contentThreshold: 50   // Minimum characters per page
};
```

#### 2. Logging Configuration
```bash
# For development (detailed logs)
LOG_LEVEL=debug

# For production (minimal logs)
LOG_LEVEL=warn

# For performance monitoring
LOG_LEVEL=info
```

### Memory and Resource Settings
```bash
# Node.js memory settings (for large PDFs)
NODE_OPTIONS="--max-old-space-size=4096"  # 4GB RAM limit

# Increase stack size for complex PDFs
NODE_OPTIONS="--stack-size=2048"
```

## Installation Steps

### 1. Clone Repository
```bash
git clone <repository-url>
cd QuizAi
```

### 2. Install Dependencies

#### Backend Setup
```bash
cd api
npm install

# Verify system dependencies
npx pdf-poppler --version  # Should not error
node -e "console.log('PDF Parse:', require('pdf-parse'))"  # Should load
```

#### Frontend Setup
```bash
cd ../web
npm install
```

### 3. Environment Configuration
```bash
# Copy example environment files
cp api/.env.example api/.env
cp web/.env.example web/.env

# Edit with your values
nano api/.env  # Add your OPENAI_API_KEY
nano web/.env  # Configure API URL if needed
```

### 4. Verify Setup
```bash
# Test backend startup
cd api
npm run start:dev

# Should see:
# [Nest] INFO [AiService] OpenAI client initialized successfully
# [Nest] INFO [NestApplication] Nest application successfully started
# 🚀 API Server running on http://localhost:3001

# Test frontend startup (new terminal)
cd web
npm run dev

# Should see:
# Nuxt 3.8.0 with Nitro 2.7.0
# Local:    http://localhost:3000
```

## Performance Testing

### 1. PDF Processing Test
```bash
# Create test upload
curl -X POST http://localhost:3001/upload \
  -F "file=@test-document.pdf"

# Test quiz generation with timing
time curl -X POST http://localhost:3001/api/quiz/generate/[filename]
```

### 2. Memory Usage Monitoring
```bash
# Monitor Node.js memory usage
node --inspect api/dist/main.js

# Or use built-in process monitoring
npm run start:dev -- --inspect
```

### 3. Log Analysis
```bash
# Enable debug logging
LOG_LEVEL=debug npm run start:dev

# Filter performance logs
npm run start:dev 2>&1 | grep -E "(ms|seconds|Processing|Generated)"
```

## Troubleshooting

### Common Setup Issues

#### 1. OpenAI API Key Issues
**Error**: `OPENAI_API_KEY not found in environment variables`
```bash
# Check if variable is set
echo $OPENAI_API_KEY

# Verify .env file exists and is readable
cat api/.env | grep OPENAI_API_KEY

# Restart application after setting
npm run start:dev
```

#### 2. Poppler Utils Missing
**Error**: `pdf-poppler: Command failed: pdftoppm`
```bash
# Verify installation
which pdftoppm
pdftoppm -h

# Reinstall if needed
brew reinstall poppler  # macOS
sudo apt-get reinstall poppler-utils  # Linux
```

#### 3. JPEG Library Error (macOS)
**Error**: `Library not loaded: /usr/local/opt/jpeg/lib/libjpeg.9.dylib`
```bash
# Check current symlinks
ls -la /usr/local/opt/jpeg/lib/

# Recreate symlink
sudo ln -sf /usr/local/opt/jpeg-turbo/lib/libjpeg.8.dylib /usr/local/opt/jpeg/lib/libjpeg.9.dylib

# Verify fix
npm run start:dev
```

#### 4. Port Conflicts
**Error**: `EADDRINUSE: address already in use :::3001`
```bash
# Find process using port
lsof -i :3001

# Kill process or change port
PORT=3002 npm run start:dev
```

### Performance Issues

#### 1. Slow Quiz Generation
**Issue**: Takes >60 seconds to generate quiz
**Solution**:
```bash
# Check if image generation is enabled
grep -r "generateImages.*true" api/src/

# Verify optimization settings
LOG_LEVEL=debug npm run start:dev
# Look for: "Skipping image generation, creating text-only pages..."
```

#### 2. High Memory Usage
**Issue**: Node.js process consuming too much memory
**Solution**:
```bash
# Increase memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run start:dev

# Monitor memory usage
ps aux | grep node
```

#### 3. OpenAI API Rate Limits
**Issue**: API calls failing with rate limit errors
**Solution**:
```bash
# Check API usage at https://platform.openai.com/usage
# Implement retry logic or reduce questions per page
```

## Production Deployment

### Environment Variables for Production
```bash
# Production environment
NODE_ENV=production
LOG_LEVEL=warn

# Security
OPENAI_API_KEY=sk-prod-key-here

# Performance
NODE_OPTIONS="--max-old-space-size=2048"
```

### Docker Configuration (Optional)
```dockerfile
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache poppler-utils

# Install JPEG libraries
RUN apk add --no-cache jpeg-dev

# Application setup
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3001

CMD ["npm", "run", "start:prod"]
```

## Development Tips

### 1. Debugging Performance
```bash
# Enable detailed timing logs
LOG_LEVEL=debug npm run start:dev

# Monitor specific operations
grep -E "(PDF processing|AI question generation|OpenAI API)" logs/
```

### 2. Testing Different PDF Types
```bash
# Create test directory
mkdir test-pdfs

# Test with different PDF sizes and types
# - Text-heavy documents
# - Image-heavy documents  
# - Multi-page documents
# - Scanned documents
```

### 3. Monitoring API Costs
```bash
# Log token usage
grep "Token usage" logs/ | awk '{sum+=$NF} END {print "Total tokens:", sum}'

# Estimate costs (rough calculation)
# GPT-3.5-turbo: ~$0.002 per 1K tokens
```

For additional support, refer to the detailed documentation in the `/Documentation` folder or check the application logs for specific error messages. 