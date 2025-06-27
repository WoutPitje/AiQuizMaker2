# Upload Module

## Overview

The Upload Module handles PDF file uploads with validation, size checking, and storage management.

## Files

```
src/modules/upload/
├── upload.module.ts      # Module definition
└── upload.controller.ts  # HTTP endpoint
```

## Dependencies

- **Storage Module**: For file persistence to local or cloud storage

## Controller Endpoints

### POST /upload
Upload a PDF file for quiz generation.

**Content-Type:** `multipart/form-data`
**Field:** `file` (PDF file)

**Validation:**
- File type: `application/pdf` only
- Max size: 100MB (configurable via `MAX_PDF_SIZE` env var)

**Response:**
```json
{
  "success": true,
  "message": "PDF file uploaded successfully",
  "file": {
    "filename": "file-1234567890-123.pdf",
    "originalname": "document.pdf",
    "mimetype": "application/pdf",
    "size": 1048576
  },
  "storage": "Google Cloud Storage"
}
```

**Error Responses:**
- `400`: Invalid file type
- `413`: File too large
- `500+`: Server errors

## Features

1. **File Validation**: Strict PDF-only validation
2. **Size Limits**: Configurable file size limits
3. **Unique Naming**: Timestamp-based unique filenames
4. **Storage Abstraction**: Automatic local/cloud storage selection
5. **Detailed Logging**: File upload tracking and debugging

## File Naming Convention

Uploaded files are renamed using the pattern:
```
{fieldname}-{timestamp}-{random}.{extension}
```

Example: `file-1640995200000-123456789.pdf`

## Environment Variables

- `MAX_PDF_SIZE`: Maximum file size in bytes (default: 104857600 = 100MB)
- Storage configuration inherited from Storage Module

## Security Features

- Double file type validation (MIME type check)
- File size enforcement
- Memory-based upload (no temporary disk files)
- Secure filename generation

## Integration

The uploaded filename is used by:
- Quiz Module for quiz generation
- WebSocket Module for real-time processing
- Storage Module for file management