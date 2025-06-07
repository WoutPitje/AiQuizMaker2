# Homepage File Upload Feature

## Overview
The homepage has been transformed into a simple, clean file upload interface featuring a centered dropbox where users can upload files.

## Technical Implementation

### Framework & Dependencies
- **Framework**: Nuxt.js 3 with Vue 3
- **Styling**: Tailwind CSS via @nuxtjs/tailwindcss module
- **File**: `web/app.vue`

### Features
1. **Drag and Drop Upload**: Users can drag files onto the dropbox
2. **Click to Browse**: Users can click the dropbox to open file browser
3. **Visual Feedback**: 
   - Hover effects on the dropbox
   - Visual changes when dragging files over the area
   - Selected file information display (name and size)
4. **Responsive Design**: Works on different screen sizes

### Key Components

#### Vue Composition API Setup
- `isDragOver`: Reactive boolean for drag state
- `selectedFile`: Reactive reference to the selected file
- `fileInput`: Template reference to hidden file input

#### Event Handlers
- `handleDragOver/Enter/Leave`: Manage drag states and prevent default behavior
- `handleDrop`: Process dropped files
- `handleFileSelect`: Process files selected via file browser
- `triggerFileInput`: Programmatically trigger file input click

#### Utility Functions
- `formatFileSize`: Converts bytes to human-readable format (Bytes, KB, MB, GB)

### Styling
- Uses Tailwind CSS for modern, responsive design
- Gray color scheme with blue accents for interaction states
- Clean, minimal interface with proper spacing and typography
- Dashed border dropbox with hover and drag states

### File Processing
Currently, the component:
- Accepts any file type
- Logs selected files to console
- Displays file name and formatted size
- Stores file reference in reactive state

## Usage
1. Users can either drag and drop a file onto the dropbox
2. Or click the dropbox to open the system file browser
3. Selected file information is displayed below the dropbox
4. File reference is available in the component's state for further processing

## Future Enhancements
- File type restrictions
- Multiple file upload support
- Progress indicators for large files
- File preview capabilities
- Integration with backend API for file processing 