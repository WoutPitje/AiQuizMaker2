# Single File Upload Workflow

## Overview
AiQuizMaker has been updated to support only one PDF file upload and one quiz generation at a time, providing a simplified and focused user experience.

## Key Changes

### 🎯 **Single File Focus**
- **One File at a Time**: Only one PDF can be uploaded and processed
- **Automatic Replacement**: Uploading a new file automatically replaces the previous one
- **Clear State Management**: Cleaner interface with single file tracking
- **Prevent Multiple Operations**: Only one quiz generation can run at a time

### 📁 **File Upload Behavior**
- **Replace on Upload**: New uploads automatically clear previous files and quizzes
- **Single File Display**: Interface shows only the current uploaded file
- **Immediate Feedback**: Clear visual indicators for current file status
- **Simplified Validation**: Streamlined error handling for single file operations

## User Experience

### Upload Workflow
1. **Upload PDF** → User drops or selects a single PDF file
2. **Replace Previous** → Any existing file is automatically replaced
3. **Clear Quiz** → Any existing quiz is cleared when new file is uploaded
4. **Ready to Generate** → User can configure options and generate quiz

### Quiz Generation Workflow
1. **Single Generation** → Only one quiz can be generated at a time
2. **Prevention of Conflicts** → Interface prevents multiple simultaneous generations
3. **Clear Progress** → Visual indicators show generation status
4. **Options Disabled** → Form controls disabled during generation

## Frontend Implementation

### Store State Changes
```typescript
// Before: Multiple files
const uploadedFiles = ref<UploadedFile[]>([])
const hasUploadedFiles = computed(() => uploadedFiles.value.length > 0)

// After: Single file
const uploadedFile = ref<UploadedFile | null>(null)
const hasUploadedFile = computed(() => !!uploadedFile.value)
```

### File Upload Logic
```typescript
// Automatic replacement on new upload
const uploadFile = async (file: File) => {
  // Clear existing file and quiz
  uploadedFile.value = null
  clearQuiz()
  
  // Upload new file
  const result = await apiUploadFile(file)
  if (result.success) {
    uploadedFile.value = newUploadedFile
  }
}
```

### Quiz Generation Prevention
```typescript
const generateQuiz = async (filename: string, options?: QuizGenerationOptions) => {
  // Prevent multiple generations
  if (isGeneratingQuiz.value) {
    console.warn('⚠️ Quiz generation already in progress')
    return
  }
  
  // Continue with generation...
}
```

## UI Components

### FileDropbox Component
- **Single File Input**: Removed `multiple` attribute from file input
- **Updated Text**: Changed from "files" to "file" in all messaging
- **First File Only**: Only processes the first file when multiple are dropped

### FileList Component
- **Single File Display**: Shows single file instead of array
- **Disabled States**: All controls disabled during quiz generation
- **Simplified Actions**: Single remove action instead of multiple file management
- **Warning Messages**: Clear feedback during quiz generation

### Form Controls
```vue
<!-- All form controls disabled during generation -->
<select 
  v-model="selectedLanguage"
  :disabled="isGeneratingQuiz"
  class="... disabled:opacity-50 disabled:cursor-not-allowed"
>

<button
  @click="handleGenerateQuiz"
  :disabled="isGeneratingQuiz"
  class="... disabled:cursor-not-allowed"
>
```

## Benefits

### 🎯 **Simplified UX**
- **Less Confusion**: Users focus on one file at a time
- **Clear State**: Always obvious what file is being processed
- **Reduced Errors**: Fewer opportunities for user mistakes
- **Faster Decisions**: Streamlined workflow reduces cognitive load

### 🔒 **Improved Reliability**
- **No Race Conditions**: Single quiz generation prevents conflicts
- **Cleaner State**: Easier to manage and debug application state
- **Predictable Behavior**: Users know exactly what will happen
- **Resource Management**: Better control over server resources

### ⚡ **Better Performance**
- **Reduced Memory**: Single file in memory instead of multiple
- **Focused Processing**: All resources dedicated to one operation
- **Simpler Logic**: Less complex state management code
- **Faster UI Updates**: Fewer DOM updates and reactive dependencies

## Migration from Multiple Files

### What Changed
- `uploadedFiles: UploadedFile[]` → `uploadedFile: UploadedFile | null`
- `hasUploadedFiles` → `hasUploadedFile`
- `removeFile(id)` → `removeFile()`
- `clearAllFiles()` → `removeFile()`
- File input no longer has `multiple` attribute
- UI shows single file instead of list

### Backward Compatibility
- **API Unchanged**: Backend API still works the same way
- **Quiz Format**: Quiz generation and storage unchanged
- **Magic Links**: All existing magic links continue to work
- **Data Preservation**: No impact on saved quizzes

## Error Handling

### Upload Errors
```typescript
// Clear and focused error messages
if (file.type !== 'application/pdf') {
  error = `"${file.name}" is not a PDF file. Only PDF files are allowed.`
  return // Stop processing immediately
}
```

### Generation Prevention
```typescript
// Prevent multiple operations
if (isGeneratingQuiz.value) {
  // Silently prevent instead of showing error
  console.warn('⚠️ Quiz generation already in progress')
  return
}
```

### State Consistency
```typescript
// Always clear related state when uploading new file
const uploadFile = async (file: File) => {
  uploadedFile.value = null
  clearQuiz() // Clear quiz when new file uploaded
  // ... continue with upload
}
```

## User Interface States

### Empty State
- Show file dropbox
- No uploaded file
- No quiz generation options

### File Uploaded State
- Show uploaded file details
- Show quiz generation options
- Enable "Generate Quiz" button

### Generating State
- Show progress indicators
- Disable all form controls
- Show warning message
- Prevent file removal

### Quiz Generated State
- Show generated quiz
- Show magic link sharing
- Allow file removal (clears quiz too)
- Allow new file upload (replaces everything)

## Best Practices

### For Users
- **One at a Time**: Focus on generating the best quiz from one PDF
- **Wait for Completion**: Let quiz generation finish before uploading new files
- **Save Magic Links**: Copy and save important quiz links before uploading new files
- **Check Results**: Review generated quiz before creating a new one

### For Developers
- **State Cleanup**: Always clear related state when uploading new files
- **Disable Controls**: Prevent user actions during processing
- **Clear Feedback**: Show progress and status at all times
- **Error Recovery**: Provide clear recovery paths from error states

## Future Enhancements

### Potential Improvements
- **Draft Saving**: Save partial configurations as drafts
- **File Queue**: Allow queuing files for sequential processing
- **Batch Operations**: Process multiple files in sequence
- **Progress Tracking**: Detailed progress for each processing stage

### Advanced Features
- **File Comparison**: Compare multiple PDF files side by side
- **Quiz Merging**: Combine quizzes from multiple files
- **Template Saving**: Save quiz generation configurations as templates
- **History Tracking**: Track recently processed files and configurations

The single file approach provides a cleaner, more focused experience while maintaining all the powerful quiz generation capabilities of AiQuizMaker. 