# Config Module

## Overview

The Config Module provides application configuration endpoints and system information to the frontend and external services.

## Files

```
src/modules/config/
├── config.module.ts      # Module definition
└── config.controller.ts  # Configuration endpoints
```

## Dependencies

- **AI Module**: For supported languages information

## Controller Endpoints

### GET /config
Get comprehensive application configuration.

**Response:**
```json
{
  "success": true,
  "config": {
    "maxPdfSize": 104857600,
    "maxPdfSizeMB": 100,
    "maxPagesPerPdf": 50,
    "defaultQuestionsPerPage": 2,
    "supportedLanguages": [
      { "code": "en", "name": "English" },
      { "code": "es", "name": "Spanish" }
      // ... more languages
    ],
    "storage": {
      "gcsEnabled": true,
      "uploadsBucket": "✓ Configured",
      "quizStorageBucket": "✓ Configured", 
      "gcpProjectId": "✓ Configured"
    }
  }
}
```

### GET /languages
Get list of supported languages for quiz generation.

**Response:**
```json
{
  "success": true,
  "languages": [
    { "code": "en", "name": "English" },
    { "code": "es", "name": "Spanish" },
    { "code": "fr", "name": "French" },
    { "code": "de", "name": "German" },
    { "code": "it", "name": "Italian" },
    { "code": "pt", "name": "Portuguese" },
    { "code": "nl", "name": "Dutch" },
    { "code": "ru", "name": "Russian" },
    { "code": "ja", "name": "Japanese" },
    { "code": "ko", "name": "Korean" },
    { "code": "zh", "name": "Chinese" },
    { "code": "ar", "name": "Arabic" }
  ],
  "count": 12
}
```

## Configuration Details

### File Upload Limits
- **Max PDF Size**: Configurable via `MAX_PDF_SIZE` env var (default: 100MB)
- **Max Pages**: Configurable via `MAX_PAGES_PER_PDF` env var (default: 50 pages)

### Quiz Generation
- **Questions Per Page**: Configurable via `DEFAULT_QUESTIONS_PER_PAGE` env var (default: 2)
- **Language Support**: 12 languages supported via AI module

### Storage Status
Provides real-time status of storage configuration:
- **GCS Enabled**: Whether Google Cloud Storage is properly configured
- **Bucket Status**: Configuration status of required buckets
- **Project ID**: GCP project configuration status

## Environment Variables

### File Processing
- `MAX_PDF_SIZE` - Maximum PDF file size in bytes
- `MAX_PAGES_PER_PDF` - Maximum pages to process per PDF
- `DEFAULT_QUESTIONS_PER_PAGE` - Default questions generated per page

### Storage Configuration
- `UPLOADS_BUCKET` - GCS bucket for uploaded files
- `QUIZ_STORAGE_BUCKET` - GCS bucket for quiz data
- `GCP_PROJECT_ID` - Google Cloud Project ID

## Usage

### Frontend Integration
The frontend uses these endpoints to:
1. **Configure Upload UI**: Set file size limits and validation
2. **Language Selection**: Populate language dropdown menus
3. **Storage Monitoring**: Display storage backend information
4. **System Health**: Monitor application configuration status

### Example Frontend Usage
```typescript
// Get configuration on app initialization
const { data: config } = await useApi().getConfig();

// Set upload limits
const maxSize = config.config.maxPdfSizeMB; // 100 MB

// Get available languages
const { data: languages } = await useApi().getSupportedLanguages();
```

## Features

1. **Dynamic Configuration**: Real-time configuration values
2. **Storage Visibility**: Clear storage backend status
3. **Environment Flexibility**: Adapts to different deployment environments
4. **Client Optimization**: Helps frontend optimize user experience
5. **Health Monitoring**: Provides system configuration health checks

## Error Handling

Both endpoints include comprehensive error handling:
- AI service unavailable
- Configuration access errors
- Environment variable parsing errors

Returns standardized error format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```