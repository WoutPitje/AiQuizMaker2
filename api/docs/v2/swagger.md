# Swagger API Documentation

## Overview

The AiQuizMaker API v2 now includes comprehensive Swagger/OpenAPI documentation for easy API exploration and testing.

## Access Swagger UI

**Development:** http://localhost:3001/api/docs
**Production:** https://api.quizai.nl/api/docs

## Features

### 🔐 **Authentication Support**
- JWT Bearer token authentication
- Try out protected endpoints directly in Swagger UI
- Persistent authorization across browser sessions

### 📚 **Comprehensive Documentation**
- **Auth Module**: Registration, login, profile management
- **Upload Module**: File upload with validation
- **Config Module**: System configuration and language support
- **Quiz Module**: Quiz retrieval and management

### 🎯 **Interactive Testing**
- Test all endpoints directly from the browser
- Real-time response examples
- Input validation and error handling
- Auto-generated request/response schemas

## API Categories

### Authentication (`/auth`)
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - Logout current session
- `POST /auth/logout-all` - Logout all sessions
- `GET /auth/profile` - Get user profile
- `GET /auth/me` - Get current user
- `POST /auth/refresh` - Refresh access token
- `GET /auth/sessions` - List user sessions

### File Upload (`/upload`)
- `POST /upload` - Upload PDF files (max 100MB)

### Configuration (`/config`, `/languages`)
- `GET /config` - Application configuration
- `GET /languages` - Supported languages

### Quiz Management (`/quizzes`)
- `GET /quizzes` - List all quizzes
- `GET /quizzes/:magicLink` - Get quiz by magic link

## How to Use Swagger

### 1. **Open Swagger UI**
Navigate to http://localhost:3001/api/docs in your browser

### 2. **Authenticate**
1. Register a new user via `POST /auth/register`
2. Copy the `accessToken` from the response
3. Click the "Authorize" button in Swagger UI
4. Enter: `Bearer YOUR_ACCESS_TOKEN`
5. Click "Authorize"

### 3. **Test Endpoints**
- Click on any endpoint to expand it
- Fill in required parameters
- Click "Try it out"
- View the response

### 4. **Upload Files**
For file uploads:
1. Go to `POST /upload`
2. Click "Try it out"
3. Click "Choose File" and select a PDF
4. Execute to test the upload

## Schema Documentation

All request/response schemas are automatically documented with:
- Field types and constraints
- Required vs optional fields
- Example values
- Validation rules

## Error Responses

Standard error responses are documented:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resources)
- `413` - Payload Too Large (file size)
- `500` - Internal Server Error

## Development Tips

### **Testing Authentication Flow**
1. Register → Get access token
2. Login → Get new access token
3. Use token for protected endpoints
4. Test logout to invalidate tokens

### **File Upload Testing**
- Use small PDF files for testing
- Check file size limits in `/config`
- Test with non-PDF files to see validation

### **Real-time Features**
Note: WebSocket quiz generation is not directly testable in Swagger UI. Use a WebSocket client for those features.

## Configuration

The Swagger configuration includes:
- **Title**: AiQuizMaker API
- **Version**: 2.0.0
- **Servers**: Development and Production
- **Security**: JWT Bearer Authentication
- **Tags**: Organized by feature modules

## Benefits

1. **Developer Experience**: Easy API exploration
2. **Testing**: No need for external tools
3. **Documentation**: Always up-to-date with code
4. **Validation**: See request/response formats
5. **Authentication**: Test protected endpoints easily

Access the docs at: **http://localhost:3001/api/docs**