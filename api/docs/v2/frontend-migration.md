# Frontend Migration Guide

## Overview

This document outlines the changes made to the frontend to work with the v2 modular API structure.

## API Endpoint Changes

### Updated Endpoints

**Quiz Retrieval:**
```typescript
// Before (v1)
fetch(`${baseURL}/quiz/magic/${magicLink}`)

// After (v2)
fetch(`${baseURL}/quizzes/${magicLink}`)
```

**Other endpoints remain unchanged:**
- `POST /upload` - File upload
- `GET /config` - Configuration
- `GET /languages` - Supported languages
- WebSocket `/quiz` namespace - Real-time generation

## Files Updated

### `/web/composables/useApi.ts`
**Changes made:**
- Updated `getQuizByMagicLink()` endpoint URL
- No other changes required

**Before:**
```typescript
const response = await fetch(`${baseURL}/quiz/magic/${magicLink}`)
```

**After:**
```typescript
const response = await fetch(`${baseURL}/quizzes/${magicLink}`)
```

## WebSocket Integration

WebSocket functionality remains unchanged as it was already the primary method for quiz generation:

**Connection:**
```typescript
const socket = io(`${socketURL}/quiz`, {
  transports: ['websocket', 'polling'],
  timeout: 10000,
  reconnection: true
});
```

**Quiz Generation:**
```typescript
socket.emit('generate-quiz', {
  filename,
  options: {
    questionsPerPage: 2,
    difficulty: 'mixed',
    includeExplanations: true,
    language: 'en'
  }
});
```

## Backward Compatibility

The v2 API maintains full backward compatibility for:
- File upload endpoints
- Configuration endpoints
- WebSocket events and responses
- Error handling and response formats

## Benefits of v2 Frontend Changes

1. **Cleaner URLs**: More RESTful endpoint structure
2. **Simplified Logic**: Reduced complexity in API calls
3. **Better Organization**: Matches backend modular structure
4. **Future-Proof**: Easier to extend with new features

## Testing

All frontend functionality has been tested to ensure:
- File uploads work correctly
- Quiz retrieval by magic link functions
- Real-time quiz generation via WebSocket
- Configuration loading
- Language selection
- Error handling

## Migration Steps Completed

1. ✅ Updated quiz retrieval endpoint
2. ✅ Verified WebSocket functionality
3. ✅ Tested file upload process
4. ✅ Confirmed configuration loading
5. ✅ Validated error handling

## No Breaking Changes

The migration maintains 100% functional compatibility. Users will not notice any differences in:
- Upload experience
- Quiz generation process
- Real-time progress updates
- Quiz viewing and interaction
- Error messages and handling

## Development Workflow

**Local Development:**
```bash
# Backend (API v2)
cd api
npm run start:dev

# Frontend (unchanged)
cd web  
npm run dev
```

**Testing:**
- All existing tests continue to pass
- New modular structure tested independently
- Integration tests verify frontend-backend communication