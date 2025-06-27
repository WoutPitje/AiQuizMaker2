# Storage Module

## Overview

The Storage Module provides a unified abstraction layer for file storage operations, supporting both local filesystem and Google Cloud Storage backends.

## Files

```
src/modules/storage/
├── storage.module.ts      # Module definition
├── storage.service.ts     # Storage abstraction
├── gcs.service.ts         # Google Cloud Storage implementation
├── storage.service.spec.ts # Storage tests
└── gcs.service.spec.ts     # GCS tests
```

## Services

### StorageService
Main abstraction layer that automatically selects between local and cloud storage.

**Methods:**
- `uploadFile(filename, buffer, directory)` - Upload file to storage
- `downloadFile(filename, directory)` - Download file from storage
- `deleteFile(filename, directory)` - Delete file from storage
- `fileExists(filename, directory)` - Check if file exists
- `listFiles(directory)` - List files in directory
- `getFileMetadata(filename, directory)` - Get file metadata
- `saveQuizData(quizId, quizData)` - Save quiz data as JSON
- `loadQuizData(quizId)` - Load quiz data from JSON

### GcsService
Google Cloud Storage implementation.

**Methods:**
- `isEnabled()` - Check if GCS is configured
- `uploadFile()` - Upload to GCS bucket
- `downloadFile()` - Download from GCS bucket
- `deleteFile()` - Delete from GCS bucket
- `fileExists()` - Check file existence in GCS
- `listFiles()` - List GCS bucket files
- `getFileMetadata()` - Get GCS object metadata

## Configuration

### Environment Variables

**Local Storage:**
- Files stored in `./uploads/` and `./quiz-storage/` directories

**Google Cloud Storage:**
- `UPLOADS_BUCKET` - Bucket for uploaded PDF files
- `QUIZ_STORAGE_BUCKET` - Bucket for generated quiz data
- `GCP_PROJECT_ID` - Google Cloud Project ID
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account key

## Storage Selection Logic

```typescript
if (UPLOADS_BUCKET && QUIZ_STORAGE_BUCKET) {
  // Use Google Cloud Storage
} else {
  // Fallback to local filesystem
}
```

## Directory Structure

### Local Storage
```
./uploads/          # Uploaded PDF files
./quiz-storage/     # Generated quiz JSON files
```

### Cloud Storage
```
uploads/            # GCS bucket for PDF files
quiz-storage/       # GCS bucket for quiz data
```

## Features

1. **Automatic Backend Selection**: Seamlessly switches between local and cloud
2. **Error Handling**: Comprehensive error management for both backends
3. **Metadata Support**: File size, creation date, modification date
4. **Quiz Data Management**: Specialized methods for quiz JSON storage
5. **Testing Support**: Integrated test utilities

## Usage Example

```typescript
// Upload a file
await storageService.uploadFile('test.pdf', buffer, 'uploads');

// Save quiz data
await storageService.saveQuizData('quiz123', quizObject);

// Check if running on GCS or local
const gcsEnabled = gcsService.isEnabled();
```

## Migration Benefits

- **Centralized Storage Logic**: All storage operations in one place
- **Environment Flexibility**: Same code works in development and production
- **Testing Isolation**: Easy to mock storage operations
- **Error Consistency**: Standardized error handling across storage types