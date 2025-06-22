import { defineStore } from 'pinia'
import type { UploadedFile, Quiz, QuizGenerationOptions, Language } from '~/types/api'

export const useFileUploadStore = defineStore('fileUpload', () => {
  // File upload state - single file only
  const isUploading = ref(false)
  const uploadProgress = ref(0)
  const error = ref<string | null>(null)
  const uploadedFile = ref<UploadedFile | null>(null)

  // Quiz state
  const isGeneratingQuiz = ref(false)
  const currentQuiz = ref<Quiz | null>(null)
  const quizError = ref<string | null>(null)
  const currentMagicLink = ref<string | null>(null)
  const currentShareUrl = ref<string | null>(null)

  // Streaming quiz generation state
  const isStreamingQuiz = ref(false)
  const streamingProgress = ref<string>('')
  const streamingQuestions = ref<any[]>([])
  const streamingStats = ref<any>(null)
  const currentPage = ref<number>(0)
  const totalPages = ref<number>(0)

  // Language state
  const supportedLanguages = ref<Language[]>([])
  const selectedLanguage = ref<string>('en')

  // Computed
  const hasUploadedFile = computed(() => !!uploadedFile.value)
  const hasGeneratedQuiz = computed(() => !!currentQuiz.value)

  // Load supported languages on store initialization
  const loadSupportedLanguages = async () => {
    try {
      const { getSupportedLanguages } = useApi()
      const response = await getSupportedLanguages()
      
      if (response.success) {
        supportedLanguages.value = response.languages
        console.log('🌐 Loaded supported languages:', response.languages.length)
      }
    } catch (error) {
      console.warn('⚠️ Failed to load supported languages:', error)
      // Provide fallback languages
      supportedLanguages.value = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' }
      ]
    }
  }

  // File upload actions
  const uploadFile = async (file: File) => {
    const { uploadFile: apiUploadFile } = useApi()
    
    try {
      isUploading.value = true
      uploadProgress.value = 0
      error.value = null

      // Clear any existing file and quiz when uploading a new file
      uploadedFile.value = null
      clearQuiz()

      // Simulate progress
      const progressInterval = setInterval(() => {
        if (uploadProgress.value < 90) {
          uploadProgress.value += Math.random() * 10
        }
      }, 200)

      const result = await apiUploadFile(file)

      clearInterval(progressInterval)
      uploadProgress.value = 100

      if (result.success && result.file) {
        const newUploadedFile: UploadedFile = {
          id: `file_${Date.now()}`,
          filename: result.file.filename,
          originalname: result.file.originalname,
          size: result.file.size,
          uploadedAt: new Date()
        }
        uploadedFile.value = newUploadedFile
        console.log('📁 File uploaded successfully:', newUploadedFile.originalname)
      }

      setTimeout(() => {
        uploadProgress.value = 0
      }, 1000)

    } catch (err: any) {
      error.value = err.message
      uploadProgress.value = 0
    } finally {
      isUploading.value = false
    }
  }

  // Streaming quiz generation actions
  const generateQuizStream = async (filename: string, options?: QuizGenerationOptions) => {
    const { generateQuizStream: apiGenerateQuizStream } = useApi()
    
    // Prevent multiple quiz generations
    if (isGeneratingQuiz.value || isStreamingQuiz.value) {
      console.warn('⚠️ Quiz generation already in progress')
      return
    }
    
    try {
      console.log('🌊 Starting streaming quiz generation for:', filename)
      
      // Reset streaming state
      isStreamingQuiz.value = true
      isGeneratingQuiz.value = true
      quizError.value = null
      currentQuiz.value = null
      currentMagicLink.value = null
      currentShareUrl.value = null
      streamingProgress.value = 'Initializing...'
      streamingQuestions.value = []
      streamingStats.value = null
      currentPage.value = 0
      totalPages.value = 0

      // Include selected language in options
      const quizOptions: QuizGenerationOptions = {
        language: selectedLanguage.value,
        ...options
      }

      // Start WebSocket connection
      const closeConnection = apiGenerateQuizStream(
        filename,
        quizOptions,
        (event) => handleStreamEvent(event),
        (error) => handleStreamError(error),
        () => handleStreamComplete()
      )

      // Store close function for cleanup if needed
      // You could store this in a ref if you need to cancel generation
      
    } catch (err: any) {
      console.error('💥 Streaming quiz generation error:', err)
      quizError.value = err.message
      isStreamingQuiz.value = false
      isGeneratingQuiz.value = false
    }
  }

  const handleStreamEvent = (event: any) => {
    console.log('📡 Handling stream event:', event.type)
    
    switch (event.type) {
      case 'connection':
        console.log('🔗 Stream connection established')
        streamingProgress.value = 'Connected to quiz generation stream...'
        break
        
      case 'start':
        streamingProgress.value = event.data.message
        break
        
      case 'progress':
        streamingProgress.value = event.data.message
        break
        
      case 'pdf-processed':
        streamingProgress.value = event.data.message
        totalPages.value = event.data.pagesToProcess
        break
        
      case 'page-processing':
        currentPage.value = event.data.currentPage
        streamingProgress.value = `Page ${event.data.currentPage}/${event.data.totalPages}: ${event.data.message}`
        break
        
      case 'question-generated':
        streamingQuestions.value.push(event.data.question)
        streamingProgress.value = `Generated ${event.data.totalQuestions} questions so far...`
        break
        
      case 'page-skipped':
        streamingProgress.value = event.data.message
        break
        
      case 'page-warning':
        console.warn('⚠️ Page warning:', event.data.message)
        streamingProgress.value = event.data.message
        break
        
      case 'page-error':
        console.error('❌ Page error:', event.data.error)
        streamingProgress.value = `Error on page ${event.data.pageNumber}: ${event.data.error}`
        break
        
      case 'finalizing':
        streamingProgress.value = event.data.message
        break
        
      case 'completed':
        console.log('🎉 Quiz generation completed!')
        currentQuiz.value = event.data.quiz
        currentMagicLink.value = event.data.magicLink
        currentShareUrl.value = event.data.shareUrl
        streamingStats.value = event.data.stats
        streamingProgress.value = 'Quiz completed successfully!'
        
        // Transfer streaming questions to final quiz
        if (event.data.quiz) {
          streamingQuestions.value = event.data.quiz.questions
        }
        break
        
      case 'heartbeat':
        // Ignore heartbeat messages, they're just to keep connection alive
        console.log('💓 Heartbeat received')
        break
        
      case 'error':
        console.error('❌ Stream error:', event.data.error)
        quizError.value = event.data.error
        break
    }
  }

  const handleStreamError = (error: any) => {
    console.error('💥 Stream connection error:', error)
    quizError.value = 'Connection error during quiz generation'
    isStreamingQuiz.value = false
    isGeneratingQuiz.value = false
  }

  const handleStreamComplete = () => {
    console.log('🏁 Streaming quiz generation completed')
    isStreamingQuiz.value = false
    isGeneratingQuiz.value = false
  }

  // Magic link actions
  const loadQuizByMagicLink = async (magicLink: string) => {
    const { getQuizByMagicLink } = useApi()
    
    try {
      console.log('🔗 Loading quiz by magic link:', magicLink)
      
      isGeneratingQuiz.value = true
      quizError.value = null
      currentQuiz.value = null

      const result = await getQuizByMagicLink(magicLink)
      console.log('✅ Quiz loaded successfully:', result)

      if (result.success && result.quiz) {
        currentQuiz.value = result.quiz
        currentMagicLink.value = magicLink
        console.log('🎉 Quiz loaded from magic link:', result.quiz.title)
      } else {
        console.error('❌ Failed to load quiz:', result.error)
        throw new Error(result.error || 'Failed to load quiz')
      }

    } catch (err: any) {
      console.error('💥 Quiz loading error:', err)
      quizError.value = err.message
    } finally {
      isGeneratingQuiz.value = false
    }
  }

  const copyMagicLink = async () => {
    if (!currentShareUrl.value) {
      return false
    }

    try {
      // First, try the modern Clipboard API (requires HTTPS and user interaction)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(currentShareUrl.value)
        console.log('📋 Share URL copied to clipboard (Clipboard API)')
        return true
      }
      
      // Fallback to document.execCommand (deprecated but more widely supported)
      const textArea = document.createElement('textarea')
      textArea.value = currentShareUrl.value
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (successful) {
        console.log('📋 Share URL copied to clipboard (execCommand)')
        return true
      } else {
        throw new Error('execCommand failed')
      }
      
    } catch (error) {
      console.error('❌ Failed to copy to clipboard:', error)
      
      // Final fallback: provide the URL for manual copying
      if (window.prompt) {
        window.prompt('Copy this URL manually:', currentShareUrl.value)
        console.log('📋 Share URL provided for manual copy')
        return true
      }
      
      return false
    }
  }

  // Language actions
  const setLanguage = (languageCode: string) => {
    selectedLanguage.value = languageCode
    console.log('🌐 Language changed to:', languageCode)
  }

  const getLanguageName = (languageCode: string): string => {
    const language = supportedLanguages.value.find(lang => lang.code === languageCode)
    return language?.name || languageCode.toUpperCase()
  }

  // Utility actions
  const clearError = () => {
    error.value = null
  }

  const clearQuizError = () => {
    quizError.value = null
  }

  const removeFile = () => {
    uploadedFile.value = null
    clearQuiz() // Also clear any associated quiz
    console.log('🗑️ File removed')
  }

  const clearQuiz = () => {
    currentQuiz.value = null
    quizError.value = null
    currentMagicLink.value = null
    currentShareUrl.value = null
    // Reset streaming state when clearing quiz
    streamingQuestions.value = []
    streamingStats.value = null
    streamingProgress.value = ''
    currentPage.value = 0
    totalPages.value = 0
  }

  const startNewQuiz = () => {
    // Clear the current quiz but keep the uploaded file
    clearQuiz()
    console.log('🔄 Starting new quiz - quiz data cleared, file retained')
  }

  // Initialize languages when store is created
  loadSupportedLanguages()

  return {
    // File upload state
    isUploading: readonly(isUploading),
    uploadProgress: readonly(uploadProgress),
    error: readonly(error),
    uploadedFile: readonly(uploadedFile),
    hasUploadedFile: readonly(hasUploadedFile),
    hasGeneratedQuiz: readonly(hasGeneratedQuiz),

    // Quiz state
    isGeneratingQuiz: readonly(isGeneratingQuiz),
    currentQuiz: readonly(currentQuiz),
    quizError: readonly(quizError),
    currentMagicLink: readonly(currentMagicLink),
    currentShareUrl: readonly(currentShareUrl),

    // Streaming state
    isStreamingQuiz: readonly(isStreamingQuiz),
    streamingProgress: readonly(streamingProgress),
    streamingQuestions: readonly(streamingQuestions),
    streamingStats: readonly(streamingStats),
    currentPage: readonly(currentPage),
    totalPages: readonly(totalPages),

    // Language state
    supportedLanguages: readonly(supportedLanguages),
    selectedLanguage: readonly(selectedLanguage),

    // Actions
    loadSupportedLanguages,
    uploadFile,
    generateQuizStream,
    loadQuizByMagicLink,
    copyMagicLink,
    setLanguage,
    removeFile,
    clearError,
    clearQuizError,
    clearQuiz,
    startNewQuiz
  }
}) 