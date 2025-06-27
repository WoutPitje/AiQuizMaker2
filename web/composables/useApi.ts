import type { UploadResponse, QuizResponse, ConfigResponse, LanguagesResponse, QuizGenerationOptions } from '~/types/api'

export const useApi = () => {
  const config = useRuntimeConfig()
  
  // Base API URL - production setup with nginx proxy
  const baseURL = config.public.apiUrl || 'http://localhost:3001'
  
  console.log('🔧 API baseURL configured as:', baseURL)
  
  const getConfig = async (): Promise<ConfigResponse> => {
    try {
      const response = await fetch(`${baseURL}/config`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.statusText}`)
      }
      
      const result: ConfigResponse = await response.json()
      return result
    } catch (error: any) {
      console.error('Config fetch error:', error)
      throw new Error(error.message || 'Failed to fetch server configuration')
    }
  }

  const getSupportedLanguages = async (): Promise<LanguagesResponse> => {
    try {
      const response = await fetch(`${baseURL}/languages`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch languages: ${response.statusText}`)
      }
      
      const result: LanguagesResponse = await response.json()
      return result
    } catch (error: any) {
      console.error('Languages fetch error:', error)
      throw new Error(error.message || 'Failed to fetch supported languages')
    }
  }
  
  const uploadFile = async (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await fetch(`${baseURL}/upload`, {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        if (response.status === 413) {
          throw new Error('PDF file is too large. Maximum size is 100MB.')
        }
        if (response.status === 400) {
          throw new Error('Only PDF files are allowed. Please select a valid PDF file.')
        }
        if (response.status >= 500) {
          throw new Error('Server error. Please try again later.')
        }
        throw new Error(`Upload failed: ${response.statusText}`)
      }
      
      const result: UploadResponse = await response.json()
      return result
    } catch (error: any) {
      console.error('PDF upload error:', error)
      throw new Error(error.message || 'PDF upload failed. Please try again.')
    }
  }

  const getQuizByMagicLink = async (magicLink: string): Promise<QuizResponse> => {
    try {
      const response = await fetch(`${baseURL}/quizzes/${magicLink}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Quiz not found. The magic link may be invalid or expired.')
        }
        throw new Error(`Failed to fetch quiz: ${response.statusText}`)
      }
      
      const result: QuizResponse = await response.json()
      return result
    } catch (error: any) {
      console.error('Quiz fetch error:', error)
      throw new Error(error.message || 'Failed to load quiz')
    }
  }

  const generateQuizStream = async (
    filename: string, 
    options?: QuizGenerationOptions,
    onEvent?: (event: any) => void,
    onError?: (error: any) => void,
    onComplete?: () => void
  ) => {
    // Import WebSocket composable dynamically to avoid circular imports
    const { useWebSocket } = await import('./useWebSocket')
    const { generateQuizStream: wsGenerateQuizStream } = useWebSocket()
    
    console.log('🌊 Starting WebSocket quiz generation for:', filename)
    console.log('🌐 Options:', options)
    
    try {
      return await wsGenerateQuizStream(
        baseURL,
        filename,
        options,
        onEvent,
        onError,
        onComplete
      )
    } catch (error: any) {
      console.error('❌ WebSocket quiz generation error:', error)
      if (onError) {
        onError(error)
      }
      throw error
    }
  }
  
  return {
    getConfig,
    getSupportedLanguages,
    uploadFile,
    getQuizByMagicLink,
    generateQuizStream,
    baseURL
  }
} 