# Quiz Persistence & Magic Links

## Overview
🧠 QuizAi now automatically saves all generated quizzes with secure magic links, enabling easy sharing and long-term access to created quizzes.

## Features

### 🔗 Magic Links
- **Automatic Generation**: Every quiz gets a unique, cryptographically secure magic link
- **Shareable URLs**: Full URLs for easy sharing (e.g., `http://localhost:3000/quiz/ABC123XYZ`)
- **Permanent Access**: Magic links never expire and provide permanent access to quizzes
- **Security**: Uses 32-byte cryptographically secure random tokens (base64url encoded)

### 💾 Persistent Storage
- **File-Based Storage**: Quizzes stored as JSON files in `quiz-storage/` directory
- **Automatic Saving**: All generated quizzes are automatically saved with metadata
- **Backwards Compatibility**: Supports both new magic links and legacy quiz IDs
- **Metadata Tracking**: Tracks creation time, save time, and quiz parameters

## API Endpoints

### Generate Quiz with Magic Link (Streaming)
```bash
POST /generate-quiz-stream/[filename]
Content-Type: application/json

{
  "questionsPerPage": 2,
  "difficulty": "mixed",
  "includeExplanations": true,
  "language": "en"
}
```

**Response (Server-Sent Events):**
```
data: {"type":"start","data":{"quizId":"quiz_123","message":"Starting quiz generation..."}}

data: {"type":"question-generated","data":{"question":{...},"totalQuestions":1}}

data: {"type":"completed","data":{"quiz":{...},"magicLink":"ABC123XYZ...","shareUrl":"http://localhost:3000/quiz/ABC123XYZ..."}}
```

### Access Quiz by Magic Link
```bash
GET /quiz/magic/[magicLink]
```

**Response:**
```json
{
  "success": true,
  "quiz": {
    "id": "quiz_123_abc",
    "title": "Quiz: Document Name",
    "description": "Generated from a 5-page document...",
    "magicLink": "ABC123XYZ...",
    "questions": [ /* questions array */ ],
    "metadata": {
      "sourceFile": "document.pdf",
      "createdAt": "2024-01-01T10:00:00Z",
      "savedAt": "2024-01-01T10:00:05Z",
      "magicLink": "ABC123XYZ...",
      "language": "en"
    }
  }
}
```

### List All Quizzes
```bash
GET /quizzes
```

**Response:**
```json
{
  "success": true,
  "quizzes": [ /* array of quiz objects */ ],
  "total": 25,
  "count": 20
}
```

## Storage System

### File Structure
```
api/
├── quiz-storage/           # Quiz storage directory
│   ├── ABC123XYZ.json     # Quiz file (magic link as filename)
│   ├── DEF456UVW.json     # Another quiz file
│   └── ...
└── src/
    └── quizmaker.service.ts
```

### Quiz File Format
```json
{
  "id": "quiz_1704110400000_abc123def",
  "title": "Quiz: Research Paper",
  "description": "Generated from a 8-page document with 16 questions...",
  "magicLink": "ABC123XYZ789...",
  "questions": [
    {
      "id": "q1_1_1704110401000",
      "question": "What is the main topic?",
      "options": {
        "A": "Option A",
        "B": "Option B", 
        "C": "Option C",
        "D": "Option D"
      },
      "correctAnswer": "A",
      "difficulty": "medium",
      "explanation": "The answer is A because...",
      "pageNumber": 1,
      "language": "en"
    }
  ],
  "metadata": {
    "sourceFile": "research-paper.pdf",
    "totalPages": 8,
    "createdAt": "2024-01-01T10:00:00.000Z",
    "savedAt": "2024-01-01T10:00:05.000Z",
    "estimatedDuration": 24,
    "language": "en",
    "questionsPerPage": 2,
    "difficulty": "mixed",
    "magicLink": "ABC123XYZ789..."
  }
}
```

### Security Features
- **Cryptographically Secure**: Uses Node.js `crypto.randomBytes(32)`
- **URL-Safe Encoding**: Base64url encoding prevents special characters
- **Unpredictable**: 2^256 possible combinations make guessing impossible
- **No Expiration**: Links remain valid indefinitely

## Frontend Integration

### Magic Link Display
The `QuizDisplay` component automatically shows magic links when available:

```vue
<!-- Magic Link Sharing Section -->
<div v-if="currentShareUrl" class="magic-link-sharing">
  <div class="share-info">
    <p>Share this quiz</p>
    <p>Anyone with this link can access the quiz</p>
  </div>
  <input :value="currentShareUrl" readonly />
  <button @click="copyShareUrl">Copy Link</button>
</div>
```

### Quiz Access Page
Dedicated page at `/quiz/[magicLink]` for accessing shared quizzes:

```vue
<!-- pages/quiz/[magicLink].vue -->
<template>
  <div>
    <div v-if="isLoading">Loading quiz...</div>
    <div v-else-if="error">Quiz not found</div>
    <QuizDisplay v-else-if="currentQuiz" />
  </div>
</template>
```

### Store Integration
```typescript
// Load quiz by magic link
await fileUploadStore.loadQuizByMagicLink('ABC123XYZ')

// Copy magic link to clipboard
const success = await fileUploadStore.copyMagicLink()

// Access current magic link
const { currentMagicLink, currentShareUrl } = storeToRefs(fileUploadStore)
```

## User Experience

### Quiz Generation Flow
1. **Upload PDF** → User uploads PDF file
2. **Generate Quiz** → System processes PDF and generates questions
3. **Auto-Save** → Quiz automatically saved with magic link
4. **Share Link** → User receives shareable URL immediately
5. **Copy & Share** → One-click copy to clipboard for sharing

### Quiz Access Flow
1. **Click Link** → Recipient clicks shared magic link
2. **Load Quiz** → System loads quiz from storage
3. **Display Quiz** → Full quiz interface with questions and answers
4. **Create Own** → Option to create their own quiz

### Sharing Options
- **Direct URL Copy**: Copy full URL to clipboard
- **Magic Link Only**: Copy just the magic link portion
- **Social Sharing**: Ready for WhatsApp, email, Slack, etc.
- **QR Code**: (Future enhancement) Generate QR codes for links

## Performance & Scalability

### Current Implementation
- **File-Based Storage**: Simple JSON files for each quiz
- **In-Memory Loading**: Quizzes loaded into memory when accessed
- **Linear Search**: Quiz listing searches through all files
- **No Indexing**: Simple filename-based access

### Performance Characteristics
- **Storage**: ~1-5KB per quiz (depends on question count)
- **Load Time**: <50ms for typical quiz loading
- **Scaling**: Suitable for hundreds to low thousands of quizzes
- **Memory**: Minimal impact, quizzes loaded on-demand

### Future Enhancements
- **Database Migration**: Move to PostgreSQL/MongoDB for better performance
- **Caching**: Redis cache for frequently accessed quizzes
- **Indexing**: Search by title, language, creation date
- **Compression**: Gzip compression for larger quizzes
- **CDN**: Static file serving for images/assets

## Monitoring & Analytics

### Logging
```bash
# Quiz creation
💾 Quiz saved successfully with magic link: ABC123XYZ
📂 Quiz file: ABC123XYZ.json

# Quiz access
🔗 Loading quiz from magic link: ABC123XYZ
✅ Quiz loaded successfully: Quiz Title

# Error handling
❌ Quiz not found for magic link: INVALID123
```

### Metrics to Track
- **Quiz Generation Rate**: Number of quizzes created per day
- **Access Patterns**: Which quizzes are accessed most frequently
- **Share Success**: How often magic links are successfully shared
- **Error Rates**: Failed quiz loads, invalid magic links
- **Popular Languages**: Most requested quiz languages

### Health Checks
```bash
# Check storage directory
ls -la quiz-storage/ | wc -l  # Count of saved quizzes

# Check disk usage
du -sh quiz-storage/  # Total storage used

# Validate quiz files
find quiz-storage/ -name "*.json" -exec jq . {} \; >/dev/null  # JSON validation
```

## Troubleshooting

### Common Issues

#### Quiz Not Found
**Symptoms**: 404 error when accessing magic link
**Causes**: 
- Invalid or corrupted magic link
- Quiz file deleted or moved
- Storage directory permission issues

**Solutions**:
```bash
# Check if quiz file exists
ls -la quiz-storage/ABC123XYZ.json

# Verify file permissions
chmod 644 quiz-storage/*.json

# Check JSON validity
jq . quiz-storage/ABC123XYZ.json
```

#### Magic Link Not Generated
**Symptoms**: Quiz created but no magic link returned
**Causes**:
- Storage directory doesn't exist
- Insufficient disk space
- File permission issues

**Solutions**:
```bash
# Create storage directory
mkdir -p quiz-storage/

# Check disk space
df -h .

# Fix permissions
chmod 755 quiz-storage/
```

#### Sharing URL Issues
**Symptoms**: Shared links don't work
**Causes**:
- Incorrect WEB_URL environment variable
- CORS issues
- Network connectivity problems

**Solutions**:
```bash
# Set correct frontend URL
export WEB_URL=http://localhost:3000

# Test API endpoint
curl http://localhost:3001/quiz/magic/ABC123XYZ
```

### Debug Mode
Enable detailed logging:
```bash
# Backend debug
LOG_LEVEL=debug npm run start:dev

# Frontend debug
NUXT_DEBUG=true npm run dev
```

### File System Issues
```bash
# Check storage directory permissions
ls -la quiz-storage/

# Monitor file system operations
# macOS:
sudo fs_usage -f filesys | grep quiz-storage

# Linux:
sudo inotifywait -m quiz-storage/
```

## Security Considerations

### Magic Link Security
- **Entropy**: 256-bit cryptographic randomness
- **URL Safe**: No special characters that break in URLs/messages
- **No Personal Info**: Links contain no user or content information
- **Immutable**: Links never change once generated

### Access Control
- **Public Access**: Anyone with link can view (by design)
- **No Authentication**: Links work without login
- **No Authorization**: No user-based permissions
- **Read Only**: Viewers cannot modify quizzes

### Privacy & Data
- **No Tracking**: No analytics on who accesses quizzes
- **Anonymous**: No user identification required
- **GDPR Compliant**: No personal data stored
- **Content Based**: Only quiz content and metadata stored

### Future Security Enhancements
- **Link Expiration**: Optional expiry dates for links
- **Password Protection**: Optional password-protected quizzes
- **Access Logging**: Track quiz access for analytics
- **Rate Limiting**: Prevent abuse of quiz generation

## Best Practices

### For Developers
- **Error Handling**: Always handle file system errors gracefully
- **Validation**: Validate magic links before processing
- **Logging**: Log all quiz operations for debugging
- **Testing**: Test with invalid/corrupted magic links

### For Users
- **Share Responsibly**: Only share quiz links with intended recipients
- **Copy Accurately**: Ensure full magic link is copied when sharing
- **Save Important Links**: Bookmark important quiz links
- **Test Links**: Verify links work before sharing widely

### For Deployment
- **Backup Storage**: Regular backups of quiz-storage directory
- **Monitor Disk Space**: Alert when storage approaches limits
- **Health Checks**: Automated testing of quiz generation/access
- **Performance Monitoring**: Track quiz load times and error rates

The quiz persistence system provides a robust foundation for sharing and accessing AI-generated quizzes while maintaining simplicity and security. 