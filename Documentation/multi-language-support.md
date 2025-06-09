# Multi-Language Quiz Generation

## Overview
🧠 QuizAi now supports generating quizzes in 16 different languages, providing localized questions, answers, and explanations based on your PDF content.

## Supported Languages

### Fully Supported Languages (16)
| Language | Code | AI Prompts | Localized Titles | Fallback Questions |
|----------|------|------------|------------------|-------------------|
| English | `en` | ✅ | ✅ | ✅ |
| Spanish | `es` | ✅ | ✅ | ✅ |
| French | `fr` | ✅ | ✅ | ✅ |
| German | `de` | ✅ | ✅ | ✅ |
| Italian | `it` | ✅ | ✅ | ✅ |
| Portuguese | `pt` | ✅ | ✅ | ✅ |
| Russian | `ru` | ✅ | ✅ | ✅ |
| Chinese | `zh` | ✅ | ✅ | ✅ |
| Japanese | `ja` | ✅ | ✅ | ✅ |
| Korean | `ko` | ✅ | ✅ | ✅ |
| Arabic | `ar` | ✅ | ✅ | ✅ |
| Hindi | `hi` | ✅ | ✅ | ✅ |
| Dutch | `nl` | ✅ | ✅ | ✅ |
| Swedish | `sv` | ✅ | ✅ | ✅ |
| Danish | `da` | ✅ | ✅ | ✅ |
| Norwegian | `no` | ✅ | ✅ | ✅ |

## How It Works

### 1. Language Selection
Users can select their preferred language from a dropdown in the frontend interface before generating a quiz.

### 2. AI Processing
- **System Prompts**: Each language has customized system prompts in the target language
- **Instructions**: AI receives language-specific instructions for question generation
- **Quality Control**: Language-specific validation ensures proper question format

### 3. Localized Output
- **Questions**: Generated in the selected language
- **Answer Options**: All options (A, B, C, D) in target language
- **Explanations**: Detailed explanations in the selected language
- **Quiz Metadata**: Titles and descriptions localized

## API Usage

### Get Supported Languages
```bash
curl http://localhost:3001/languages
```

**Response:**
```json
{
  "success": true,
  "languages": [
    {"code": "en", "name": "English"},
    {"code": "es", "name": "Spanish"},
    {"code": "fr", "name": "French"},
    {"code": "de", "name": "German"},
    {"code": "it", "name": "Italian"},
    {"code": "pt", "name": "Portuguese"},
    {"code": "ru", "name": "Russian"},
    {"code": "zh", "name": "Chinese"},
    {"code": "ja", "name": "Japanese"},
    {"code": "ko", "name": "Korean"},
    {"code": "ar", "name": "Arabic"},
    {"code": "hi", "name": "Hindi"},
    {"code": "nl", "name": "Dutch"},
    {"code": "sv", "name": "Swedish"},
    {"code": "da", "name": "Danish"},
    {"code": "no", "name": "Norwegian"}
  ],
  "count": 16
}
```

### Generate Quiz with Language (Streaming)
```bash
curl -X POST http://localhost:3001/generate-quiz-stream/[filename] \
  -H "Content-Type: application/json" \
  -d '{
    "language": "es",
    "questionsPerPage": 2,
    "difficulty": "mixed",
    "includeExplanations": true
  }'
```

## Frontend Integration

### Language Selector Component
The FileList component includes a language selector that:
- Loads supported languages on initialization
- Stores user's language preference
- Passes language to quiz generation API

### Store Integration
```typescript
// Access supported languages
const { supportedLanguages, selectedLanguage } = storeToRefs(fileUploadStore)

// Change language
fileUploadStore.setLanguage('es')

// Generate quiz with language
await fileUploadStore.generateQuiz(filename, {
  language: 'es',
  questionsPerPage: 2,
  difficulty: 'mixed',
  includeExplanations: true
})
```

## Language-Specific Features

### System Prompts
Each language has tailored system prompts:

**English:**
```
You are an expert quiz creator that generates high-quality multiple-choice questions from educational content.
```

**Spanish:**
```
Eres un creador experto de cuestionarios que genera preguntas de opción múltiple de alta calidad a partir de contenido educativo.
```

**French:**
```
Vous êtes un créateur expert de quiz qui génère des questions à choix multiples de haute qualité à partir de contenu éducatif.
```

### Difficulty Labels
Difficulty levels are translated for each language:

| Language | Easy | Medium | Hard |
|----------|------|--------|------|
| English | easy | medium | hard |
| Spanish | fácil | intermedio | difícil |
| French | facile | moyen | difficile |
| German | einfach | mittel | schwer |

### Quiz Titles
Quiz titles are localized based on the selected language:

| Language | Format |
|----------|---------|
| English | `Quiz: [filename]` |
| Spanish | `Cuestionario: [filename]` |
| French | `Quiz: [filename]` |
| German | `Quiz: [filename]` |
| Portuguese | `Questionário: [filename]` |
| Russian | `Викторина: [filename]` |
| Chinese | `测验: [filename]` |
| Japanese | `クイズ: [filename]` |

### Descriptions
Quiz descriptions include page count and question count in the target language:

**English:**
```
Generated from a 5-page document with 10 questions covering key concepts and important information.
```

**Spanish:**
```
Generado a partir de un documento de 5 páginas con 10 preguntas que cubren conceptos clave e información importante.
```

**French:**
```
Généré à partir d'un document de 5 pages avec 10 questions couvrant les concepts clés et les informations importantes.
```

## Error Handling & Fallbacks

### Fallback Questions
When AI parsing fails, the system generates fallback questions in the selected language:

**English:**
```json
{
  "question": "Based on the content from page 1, which statement is most accurate?",
  "options": {
    "A": "The content provides valuable information",
    "B": "The content is not relevant", 
    "C": "The content is incomplete",
    "D": "The content needs revision"
  },
  "explanation": "This is a fallback question generated when AI parsing failed."
}
```

**Spanish:**
```json
{
  "question": "Basándose en el contenido de la página 1, ¿qué afirmación es más precisa?",
  "options": {
    "A": "El contenido proporciona información valiosa",
    "B": "El contenido no es relevante",
    "C": "El contenido está incompleto", 
    "D": "El contenido necesita revisión"
  },
  "explanation": "Esta es una pregunta de respaldo generada cuando falló el análisis de IA."
}
```

### Language Detection
- Default language is English (`en`) if not specified
- Invalid language codes fall back to English
- Frontend provides language selection before quiz generation

## Best Practices

### Content Considerations
- **Source Language**: PDFs can be in any language; AI will generate questions in the target language
- **Translation Quality**: Better results when PDF language matches target language
- **Mixed Content**: Works with multilingual PDFs

### Performance Tips
- Language selection doesn't significantly impact generation time
- Some languages may require more tokens for equivalent content
- Non-Latin scripts (Arabic, Chinese, etc.) may take slightly longer

### Quality Optimization
- **Native Speakers**: Encourage native speaker review for languages you're not fluent in
- **Context**: Provide clear context in PDFs for better question generation
- **Cultural Sensitivity**: AI considers cultural context for different languages

## Adding New Languages

### Backend (AiService)
1. Add language configuration to `LANGUAGE_CONFIGS`:
```typescript
'new_code': {
  name: 'New Language',
  prompt: 'Generate quiz questions in New Language',
  difficultyLabels: { easy: 'easy_translation', medium: 'medium_translation', hard: 'hard_translation' }
}
```

2. Add system prompt instructions in the `baseInstructions` object
3. Add user prompt template in the `prompts` object
4. Add fallback questions in the `fallbackTexts` object

### Frontend Updates
The frontend automatically loads supported languages from the backend, so no frontend changes are needed when adding new languages.

## Monitoring & Analytics

### Logging
Language selection is logged throughout the generation process:
```
🤖 Generating 2 questions for page 1 in ES
🔤 Language: Spanish (es)
✅ Quiz generated successfully in Spanish
```

### Usage Tracking
Track which languages are most popular:
```bash
# Check language usage in logs
grep -E "Language.*:" logs/ | awk '{print $NF}' | sort | uniq -c
```

### Performance Monitoring
Monitor generation times by language:
```bash
# Filter by language in logs
grep "Spanish.*questions.*ms" logs/
```

## Troubleshooting

### Common Issues

#### Language Not Loading
**Issue**: Language dropdown is empty
**Solution**: Check backend `/languages` endpoint and network connectivity

#### Wrong Language Output
**Issue**: Questions generated in wrong language
**Solution**: Verify language parameter is passed correctly in API request

#### Missing Translations
**Issue**: Some text remains in English
**Solution**: Check if all components (titles, descriptions, fallbacks) are implemented

#### Character Encoding
**Issue**: Special characters not displaying correctly
**Solution**: Ensure UTF-8 encoding throughout the pipeline

### Debug Mode
Enable debug logging to troubleshoot language issues:
```bash
LOG_LEVEL=debug npm run start:dev
```

Look for language-related log entries:
- Language configuration loading
- AI prompt construction
- Language-specific response parsing

## Future Enhancements

### Planned Features
- **RTL Support**: Right-to-left layout for Arabic and Hebrew
- **Language Auto-Detection**: Detect PDF language and suggest target language
- **Translation Mode**: Generate questions in different language than source
- **Cultural Adaptation**: Region-specific question styles

### Contributing Languages
To contribute new language support:
1. Fork the repository
2. Add language configuration to `LANGUAGE_CONFIGS`
3. Test with sample PDFs
4. Submit pull request with documentation updates

The multi-language feature makes QuizAi accessible to a global audience while maintaining high-quality, culturally appropriate quiz generation across all supported languages. 