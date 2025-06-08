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
      const response = await fetch(`${baseURL}/quiz/magic/${magicLink}`)
      
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
    console.log('🌊 Starting streaming quiz generation for:', filename)
    console.log('🌐 Options:', options)
    console.log('🔗 Full URL:', `${baseURL}/generate-quiz-stream/${filename}`)
    
    try {
      console.log('📡 Making POST request to streaming endpoint...')
      const response = await fetch(`${baseURL}/generate-quiz-stream/${filename}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options || {}),
      })
      
      console.log('📊 Response status:', response.status)
      console.log('📊 Response headers:', [...response.headers.entries()])
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Response error:', errorText)
        throw new Error(`Streaming failed: ${response.statusText} - ${errorText}`)
      }
      
      if (!response.body) {
        throw new Error('No response body available for streaming')
      }
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      let buffer = ''
      
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              if (onComplete) {
                onComplete()
              }
              break
            }
            
            buffer += decoder.decode(value, { stream: true })
            
            // Process complete messages
            const lines = buffer.split('\n')
            buffer = lines.pop() || '' // Keep incomplete line in buffer
            
            for (const line of lines) {
              if (line.trim().startsWith('data: ')) {
                try {
                  const jsonStr = line.trim().substring(6) // Remove 'data: '
                  if (jsonStr) {
                    const data = JSON.parse(jsonStr)
                    console.log('📡 Streaming event received:', data.type, data.data?.message)
                    
                    if (onEvent) {
                      onEvent(data)
                    }
                  }
                } catch (parseError) {
                  console.error('❌ Failed to parse streaming event:', parseError)
                }
              }
            }
          }
        } catch (streamError) {
          console.error('❌ Stream processing error:', streamError)
          if (onError) {
            onError(streamError)
          }
        }
      }
      
      // Start processing the stream
      processStream()
      
      // Return cleanup function
      return () => {
        reader.cancel()
      }
      
    } catch (error: any) {
      console.error('❌ Streaming connection error:', error)
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