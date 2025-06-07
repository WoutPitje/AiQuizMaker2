# PDF File Upload API Endpoint

## Overview
A RESTful API endpoint for handling PDF file uploads, built with NestJS and Multer. This endpoint only accepts PDF files for processing.

## Technical Implementation

### Framework & Dependencies
- **Framework**: NestJS with Express
- **File Handling**: Multer with disk storage
- **Storage**: Local filesystem in `/uploads` directory
- **File**: `api/src/app.controller.ts`
- **Port**: 3001 (Backend API server)
- **File Restriction**: PDF files only

### Endpoint Details

#### POST /upload
Accepts PDF file uploads via multipart/form-data

**Request:**
- Method: `POST`
- URL: `http://localhost:3001/upload`
- Content-Type: `multipart/form-data`
- Field name: `file`
- **File Type**: PDF only (`application/pdf`)

**Response Format:**
```json
{
  "success": true,
  "message": "PDF file uploaded successfully",
  "file": {
    "filename": "file-1703123456789-123456789.pdf",
    "originalname": "document.pdf",
    "mimetype": "application/pdf",
    "size": 1024,
    "path": "uploads/file-1703123456789-123456789.pdf"
  }
}
```

**Error Responses:**
```json
// No file provided
{
  "success": false,
  "message": "No PDF file uploaded",
  "error": "FILE_NOT_PROVIDED"
}

// Invalid file type
{
  "success": false,
  "message": "Only PDF files are allowed",
  "error": "INVALID_FILE_TYPE"
}
```

### Configuration

#### File Storage
- **Location**: `./uploads` directory
- **Naming**: `{fieldname}-{timestamp}-{random}.pdf`
- **Size Limit**: 10MB per PDF file
- **Allowed Types**: PDF files only (`application/pdf`)

#### File Validation
- **MIME Type Check**: Server validates `application/pdf`
- **File Extension**: Accepts `.pdf` files
- **Double Validation**: Both multer filter and controller validation
- **Size Validation**: 10MB maximum file size

#### CORS Configuration
- **Allowed Origins**: `http://localhost:3000` (Frontend)
- **Allowed Methods**: `GET`, `POST`, `PUT`, `DELETE`
- **Allowed Headers**: `Content-Type`, `Authorization`

#### Port Configuration
- **Backend API**: Port 3001
- **Frontend**: Port 3000
- **Environment Variable**: `PORT` (defaults to 3001 if not set)

### Security Features
- PDF file type validation (both client and server-side)
- File size limit (10MB)
- Unique filename generation to prevent conflicts
- Files stored outside web root
- CORS protection for cross-origin requests

### File Processing
The endpoint:
- **Only accepts PDF files** (application/pdf)
- Rejects non-PDF files with descriptive error messages
- Generates unique filenames to prevent collisions
- Stores files in local `uploads` directory
- Returns file metadata including path and size
- Validates file presence and type before processing

## Usage Examples

### Using curl
```bash
curl -X POST \
  http://localhost:3001/upload \
  -F "file=@/path/to/your/document.pdf"
```

### Using JavaScript Fetch
```javascript
const formData = new FormData();
formData.append('file', pdfFile); // Must be a PDF file

fetch('http://localhost:3001/upload', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

### Using Postman
1. Set method to POST
2. Set URL to `http://localhost:3001/upload`
3. Go to Body tab
4. Select "form-data"
5. Add key "file" with type "File"
6. **Select a PDF file only**

## Directory Structure
```
api/
├── src/
│   └── app.controller.ts    # Contains PDF upload endpoint
├── uploads/                 # PDF file storage directory (gitignored)
│   └── *.pdf               # Uploaded PDF files
└── .gitignore              # Excludes uploads from version control
```

## Server Configuration

### Development
- Start backend: `npm run start:dev` (runs on port 3001)
- Start frontend: `npm run dev` (runs on port 3000)

### Environment Variables
- `PORT`: Backend port (defaults to 3001)
- `API_URL`: Frontend API URL (defaults to http://localhost:3001)

## Error Handling

### File Type Validation Errors
- **400 Bad Request**: Non-PDF files are rejected
- **413 Payload Too Large**: Files larger than 10MB
- **FILE_NOT_PROVIDED**: No file in request
- **INVALID_FILE_TYPE**: Server-side type validation failure

### Validation Process
1. **Multer Filter**: Checks MIME type during upload
2. **Controller Validation**: Double-checks file type
3. **Error Response**: Returns descriptive error messages

## Testing

### Valid Test Cases
```bash
# Valid PDF upload
curl -X POST http://localhost:3001/upload -F "file=@document.pdf"

# Expected: Success response with file details
```

### Invalid Test Cases
```bash
# Non-PDF file (should fail)
curl -X POST http://localhost:3001/upload -F "file=@image.jpg"

# Expected: 400 error with "Only PDF files are allowed"
```

## Future Enhancements
- PDF content validation and parsing
- PDF metadata extraction (author, creation date, etc.)
- PDF page count and text content analysis
- PDF thumbnail generation
- Cloud storage integration for PDF files
- PDF virus scanning
- PDF password protection handling 