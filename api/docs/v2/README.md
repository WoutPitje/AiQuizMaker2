# AiQuizMaker API v2 - Modular Architecture

This document describes the v2 refactor of the AiQuizMaker API, which introduces a modular architecture for better maintainability and organization.

## Overview

The v2 refactor transforms the monolithic structure into a clean, modular architecture using NestJS modules. This improves code organization, maintainability, and follows best practices for scalable applications.

## Key Changes

### 1. Modular Architecture
- Organized code into feature-based modules
- Each module encapsulates related functionality
- Clear separation of concerns
- Improved dependency injection

### 2. API Endpoint Changes
- Simplified and more RESTful endpoint structure
- Removed SSE (Server-Sent Events) implementation in favor of WebSocket-only
- Cleaner URL patterns

### 3. Code Organization
- Moved services to appropriate modules
- Centralized file management
- Better test organization

## Migration Guide

### Before v2 (Monolithic)
```
src/
├── app.controller.ts      # All endpoints
├── app.service.ts
├── ai.service.ts          # AI functionality
├── quizmaker.service.ts   # Quiz logic
├── storage.service.ts     # Storage abstraction
├── gcs.service.ts         # Google Cloud Storage
└── quiz-websocket.gateway.ts
```

### After v2 (Modular)
```
src/
├── app.controller.ts      # Basic app endpoints only
├── app.service.ts
├── modules/
│   ├── ai/
│   │   ├── ai.module.ts
│   │   └── ai.service.ts
│   ├── quiz/
│   │   ├── quiz.module.ts
│   │   ├── quiz.controller.ts
│   │   └── quiz.service.ts
│   ├── upload/
│   │   ├── upload.module.ts
│   │   └── upload.controller.ts
│   ├── config/
│   │   ├── config.module.ts
│   │   └── config.controller.ts
│   ├── storage/
│   │   ├── storage.module.ts
│   │   ├── storage.service.ts
│   │   └── gcs.service.ts
│   └── websocket/
│       ├── websocket.module.ts
│       └── quiz-websocket.gateway.ts
└── models/
    ├── quiz.model.ts
    └── pdf.model.ts
```

## API Documentation

See [API Endpoints](./api-endpoints.md) for detailed endpoint documentation.

## Module Documentation

- [Quiz Module](./modules/quiz.md)
- [Upload Module](./modules/upload.md)
- [Config Module](./modules/config.md)
- [Storage Module](./modules/storage.md)
- [AI Module](./modules/ai.md)
- [WebSocket Module](./modules/websocket.md)

## Frontend Changes

The frontend has been updated to use the new endpoint structure. See [Frontend Migration](./frontend-migration.md) for details.

## Benefits of v2

1. **Better Organization**: Code is organized by feature/domain
2. **Improved Maintainability**: Easier to locate and modify specific functionality
3. **Better Testing**: Tests are co-located with their modules
4. **Scalability**: Easy to add new features as separate modules
5. **Dependency Management**: Clear module dependencies
6. **Code Reuse**: Modules can be easily imported where needed