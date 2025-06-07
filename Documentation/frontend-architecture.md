# Frontend Architecture

## Overview
The frontend has been refactored to use proper Nuxt.js architecture with composables, stores, components, and file-based routing for better maintainability and scalability.

## Architecture Components

### Directory Structure
```
web/
├── components/
│   ├── FileDropbox.vue      # File upload dropbox component
│   └── FileList.vue         # Uploaded files display component
├── composables/
│   ├── useApi.ts           # API communication composable
│   └── useUtils.ts         # Utility functions composable
├── pages/
│   └── index.vue           # Main homepage (file-based routing)
├── stores/
│   └── fileUpload.ts       # Pinia store for file upload state
├── types/
│   └── api.ts              # TypeScript type definitions
├── app.vue                 # Root application component
└── nuxt.config.ts          # Nuxt configuration
```

## Port Configuration

### Development Servers
- **Frontend (Nuxt.js)**: Port 3000 - `http://localhost:3000`
- **Backend (NestJS API)**: Port 3001 - `http://localhost:3001`

### Environment Variables
- `API_URL`: Frontend API configuration (defaults to `http://localhost:3001`)
- `PORT`: Backend port configuration (defaults to 3001)

## Core Components

### 1. FileDropbox.vue
**Purpose**: Reusable file upload dropbox with drag-and-drop functionality

**Features**:
- Drag and drop file upload
- Click to browse functionality
- Upload progress indicator
- Error handling and display
- Visual feedback during upload
- Integration with Pinia store

**Props**: None (uses global store)

**Usage**:
```vue
<FileDropbox />
```

### 2. FileList.vue
**Purpose**: Display list of uploaded files with management actions

**Features**:
- List all uploaded files
- File details (name, size, type, upload date)
- Remove individual files
- Clear all files
- Responsive design
- File type icons

**Props**: None (uses global store)

**Usage**:
```vue
<FileList />
```

## State Management (Pinia Store)

### fileUpload.ts Store

**State**:
- `isUploading`: Boolean indicating upload in progress
- `uploadProgress`: Number (0-100) for progress tracking
- `uploadedFiles`: Array of uploaded file objects
- `error`: String for error messages

**Getters**:
- `hasUploadedFiles`: Boolean if any files uploaded
- `latestFile`: Most recently uploaded file
- `totalFilesUploaded`: Count of uploaded files

**Actions**:
- `uploadFile(file)`: Upload a file to the backend
- `clearError()`: Clear error state
- `removeFile(id)`: Remove file from list
- `clearAllFiles()`: Remove all files from list

## Composables

### 1. useApi.ts
**Purpose**: Handle all API communications with the backend

**Functions**:
- `uploadFile(file)`: Upload file to backend API
- `baseURL`: Get configured API base URL

**Features**:
- Error handling for different HTTP status codes
- FormData handling for file uploads
- TypeScript integration
- Runtime configuration support

### 2. useUtils.ts
**Purpose**: Provide utility functions used across components

**Functions**:
- `formatFileSize(bytes)`: Convert bytes to human-readable format
- `formatDate(date)`: Format dates for display
- `getMimeTypeIcon(mimeType)`: Get emoji icon for file types

## TypeScript Integration

### api.ts Types
- `UploadResponse`: API response structure
- `FileUploadState`: Store state interface
- `UploadedFile`: Uploaded file object structure

## Routing

### File-Based Routing
- **Path**: `/` 
- **File**: `pages/index.vue`
- **Description**: Main file upload page

The application uses Nuxt.js file-based routing system where files in the `pages/` directory automatically become routes.

## Configuration

### Nuxt Config Additions
- **Pinia**: Added for state management
- **Tailwind CSS**: For styling
- **Runtime Config**: API URL configuration
- **Dev Server**: Port configuration

```typescript
modules: ['@nuxt/eslint', '@nuxtjs/tailwindcss', '@pinia/nuxt']

// Development server configuration
devServer: {
  port: 3000 // Frontend uses port 3000
},

runtimeConfig: {
  public: {
    apiUrl: process.env.API_URL || 'http://localhost:3001' // Backend API on port 3001
  }
}
```

## Data Flow

1. **User Interaction**: User drags/drops or selects file in `FileDropbox`
2. **Store Action**: Component calls `fileUploadStore.uploadFile()`
3. **API Call**: Store uses `useApi()` composable to upload file to port 3001
4. **State Update**: Store updates state with upload progress and results
5. **UI Update**: Components reactively update based on store state
6. **File Display**: `FileList` component shows uploaded files

## Error Handling

### Levels of Error Handling
1. **API Level**: HTTP errors, network issues
2. **Store Level**: Business logic errors, validation
3. **Component Level**: UI error display and user feedback

### Error Types
- File too large (413 status)
- Server errors (5xx status)
- Network connectivity issues
- Invalid file formats (future enhancement)

## Development Workflow

### Starting the Application
1. **Backend**: `cd api && npm run start:dev` (Port 3001)
2. **Frontend**: `cd web && npm run dev` (Port 3000)

### URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Upload Endpoint**: http://localhost:3001/upload

## Key Features

### Reactive State Management
- Real-time upload progress
- Automatic UI updates
- Persistent file list

### User Experience
- Drag and drop functionality
- Visual feedback during operations
- Progress indicators
- Error messages
- File management actions

### Developer Experience
- TypeScript for type safety
- Modular component architecture
- Reusable composables
- Clear separation of concerns
- Comprehensive error handling
- Separate development servers

## Future Enhancements

### Planned Features
- Multiple file upload support
- File type restrictions
- Upload resume capability
- File preview functionality
- Cloud storage integration
- Advanced file management (rename, organize)

### Performance Optimizations
- Virtual scrolling for large file lists
- Lazy loading of file previews
- Chunked file uploads for large files
- Caching of uploaded file metadata 