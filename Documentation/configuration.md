# Configuration Guide

## Overview
🧠 QuizAi supports various configuration options through environment variables, allowing you to customize the application behavior without modifying code.

## Environment Variables

### Required Configuration

#### OpenAI API Key
```bash
OPENAI_API_KEY=sk-your-openai-key-here
```
- **Required**: Yes
- **Description**: Your OpenAI API key for ChatGPT integration
- **How to get**: Visit [OpenAI Platform](https://platform.openai.com/api-keys)

### File Upload Configuration

#### Maximum PDF File Size
```bash
MAX_PDF_SIZE=104857600  # 100MB in bytes
```
- **Default**: 104,857,600 bytes (100MB)
- **Description**: Maximum size for uploaded PDF files
- **Format**: Bytes (integer)
- **Examples**:
  ```bash
  MAX_PDF_SIZE=52428800   # 50MB
  MAX_PDF_SIZE=104857600  # 100MB (default)
  MAX_PDF_SIZE=209715200  # 200MB
  MAX_PDF_SIZE=524288000  # 500MB
  ```

#### Maximum Pages Per PDF
```bash
MAX_PAGES_PER_PDF=50
```
- **Default**: 50
- **Description**: Maximum number of pages to process per PDF
- **Note**: Higher values increase processing time and costs

#### Default Questions Per Page
```bash
DEFAULT_QUESTIONS_PER_PAGE=2
```
- **Default**: 2
- **Description**: Default number of questions generated per PDF page
- **Range**: 1-5 recommended

### Server Configuration

#### Server Port
```bash
PORT=3001
```
- **Default**: 3001
- **Description**: Port for the backend API server

#### Node Environment
```bash
NODE_ENV=development
```
- **Default**: development
- **Options**: development, production, test
- **Description**: Determines application behavior and optimizations

### Logging Configuration

#### Log Level
```bash
LOG_LEVEL=info
```
- **Default**: info
- **Options**: debug, info, warn, error
- **Description**: Controls logging verbosity
- **Recommendations**:
  - `debug`: Development and troubleshooting
  - `info`: Production monitoring
  - `warn`: Production minimal logging
  - `error`: Critical issues only

### Performance Configuration

#### Node.js Memory Limit
```bash
NODE_OPTIONS="--max-old-space-size=4096"
```
- **Default**: Node.js default (~1.4GB)
- **Description**: Maximum memory allocation for Node.js
- **Format**: Megabytes
- **Recommendations**:
  - Small deployments: 2048 (2GB)
  - Medium deployments: 4096 (4GB)
  - Large deployments: 8192 (8GB)

## Configuration API Endpoint

### GET /config
Retrieve current server configuration dynamically.

**Response:**
```json
{
  "success": true,
  "config": {
    "maxPdfSize": 104857600,
    "maxPdfSizeMB": 100,
    "maxPagesPerPdf": 50,
    "defaultQuestionsPerPage": 2
  }
}
```

**Frontend Usage:**
```typescript
const { getConfig } = useApi()
const config = await getConfig()
console.log(`Max file size: ${config.config.maxPdfSizeMB}MB`)
```

## Environment File Examples

### Development Environment
```bash
# api/.env
OPENAI_API_KEY=sk-your-development-key
PORT=3001
LOG_LEVEL=debug
NODE_ENV=development
MAX_PDF_SIZE=104857600
MAX_PAGES_PER_PDF=20
DEFAULT_QUESTIONS_PER_PAGE=2
```

### Production Environment
```bash
# api/.env
OPENAI_API_KEY=sk-your-production-key
PORT=3001
LOG_LEVEL=warn
NODE_ENV=production
MAX_PDF_SIZE=209715200  # 200MB for production
MAX_PAGES_PER_PDF=100
DEFAULT_QUESTIONS_PER_PAGE=3
```

### High-Performance Environment
```bash
# api/.env
OPENAI_API_KEY=sk-your-key
PORT=3001
LOG_LEVEL=info
NODE_ENV=production
MAX_PDF_SIZE=524288000  # 500MB
MAX_PAGES_PER_PDF=200
DEFAULT_QUESTIONS_PER_PAGE=2
NODE_OPTIONS="--max-old-space-size=8192"
```

## File Size Calculator

Use this calculator to set appropriate file size limits:

| Size | Bytes | Environment Variable |
|------|-------|---------------------|
| 10MB | 10,485,760 | `MAX_PDF_SIZE=10485760` |
| 25MB | 26,214,400 | `MAX_PDF_SIZE=26214400` |
| 50MB | 52,428,800 | `MAX_PDF_SIZE=52428800` |
| 100MB | 104,857,600 | `MAX_PDF_SIZE=104857600` |
| 200MB | 209,715,200 | `MAX_PDF_SIZE=209715200` |
| 500MB | 524,288,000 | `MAX_PDF_SIZE=524288000` |
| 1GB | 1,073,741,824 | `MAX_PDF_SIZE=1073741824` |

## Configuration Best Practices

### Development
- Use smaller file size limits for faster testing
- Enable debug logging for troubleshooting
- Keep page limits moderate to save API costs

### Production
- Set appropriate file size limits based on your use case
- Use warn or info logging for performance
- Monitor memory usage and adjust Node.js limits accordingly
- Consider API costs when setting page and question limits

### Security Considerations
- Never commit `.env` files to version control
- Use different API keys for development and production
- Regularly rotate API keys
- Monitor API usage and costs

## Monitoring Configuration

### Check Current Configuration
```bash
# Via API
curl http://localhost:3001/config

# Via environment variables
echo "Max PDF Size: $MAX_PDF_SIZE bytes"
echo "Log Level: $LOG_LEVEL"
```

### Validate Configuration
```bash
# Test file upload with large file
curl -X POST http://localhost:3001/upload \
  -F "file=@large-test-file.pdf"

# Check server logs for configuration values
grep -E "(Max file size|Configuration)" logs/
```

## Troubleshooting Configuration

### Common Issues

#### File Upload Rejected
- **Issue**: "File too large" errors
- **Solution**: Increase `MAX_PDF_SIZE` or check actual file size
- **Check**: `curl http://localhost:3001/config`

#### Memory Issues
- **Issue**: Out of memory errors during processing
- **Solution**: Increase `NODE_OPTIONS="--max-old-space-size=XXXX"`
- **Monitor**: `ps aux | grep node`

#### API Key Issues
- **Issue**: "OPENAI_API_KEY not found"
- **Solution**: Verify `.env` file exists and contains valid key
- **Test**: `echo $OPENAI_API_KEY`

#### Port Conflicts
- **Issue**: "EADDRINUSE" errors
- **Solution**: Change `PORT` or kill existing process
- **Check**: `lsof -i :3001`

## Advanced Configuration

### Docker Environment Variables
```dockerfile
ENV OPENAI_API_KEY=sk-your-key
ENV MAX_PDF_SIZE=209715200
ENV LOG_LEVEL=info
ENV NODE_OPTIONS="--max-old-space-size=4096"
```

### Process Manager (PM2)
```json
{
  "name": "quiz-maker-api",
  "script": "dist/main.js",
  "env": {
    "NODE_ENV": "production",
    "PORT": "3001",
    "LOG_LEVEL": "warn",
    "MAX_PDF_SIZE": "209715200"
  }
}
```

### Environment Variable Validation
The application validates configuration on startup:
- Checks for required `OPENAI_API_KEY`
- Validates numeric values for size limits
- Logs current configuration values
- Provides defaults for optional values

For additional configuration support, check the application logs during startup for detailed configuration information. 