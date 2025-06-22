import { ref, onUnmounted } from 'vue'
import { io, Socket } from 'socket.io-client'

interface QuizGenerationOptions {
  questionsPerPage?: number
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed'
  includeExplanations?: boolean
  generateImages?: boolean
  language?: string
}

export const useWebSocket = () => {
  const socket = ref<Socket | null>(null)
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const connectionError = ref<string | null>(null)

  const connect = async (baseURL: string): Promise<Socket> => {
    if (socket.value?.connected) {
      return socket.value
    }

    return new Promise((resolve, reject) => {
      isConnecting.value = true
      connectionError.value = null

      // Extract the base URL without /api if present
      const socketURL = baseURL.replace('/api', '')
      
      console.log('🔌 Connecting to WebSocket:', `${socketURL}/quiz`)

      const newSocket = io(`${socketURL}/quiz`, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: true,
      })

      newSocket.on('connect', () => {
        console.log('✅ WebSocket connected:', newSocket.id)
        socket.value = newSocket
        isConnected.value = true
        isConnecting.value = false
        connectionError.value = null
        resolve(newSocket)
      })

      newSocket.on('connection', (data) => {
        console.log('🔗 Connection confirmed:', data)
      })

      newSocket.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnected:', reason)
        isConnected.value = false
        isConnecting.value = false
      })

      newSocket.on('connect_error', (error) => {
        console.error('💥 WebSocket connection error:', error)
        connectionError.value = error.message
        isConnecting.value = false
        reject(error)
      })

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts')
        isConnected.value = true
      })

      newSocket.on('reconnect_error', (error) => {
        console.error('🔄❌ WebSocket reconnection error:', error)
      })

      // Set a timeout for initial connection
      setTimeout(() => {
        if (!isConnected.value && isConnecting.value) {
          isConnecting.value = false
          connectionError.value = 'Connection timeout'
          newSocket.close()
          reject(new Error('Connection timeout'))
        }
      }, 15000)
    })
  }

  const disconnect = () => {
    if (socket.value) {
      console.log('🔌 Disconnecting WebSocket')
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
      isConnecting.value = false
    }
  }

  const generateQuizStream = async (
    baseURL: string,
    filename: string,
    options?: QuizGenerationOptions,
    onEvent?: (event: any) => void,
    onError?: (error: any) => void,
    onComplete?: () => void
  ) => {
    try {
      console.log('🌊 Starting WebSocket quiz generation for:', filename)
      console.log('🌐 Options:', options)

      // Connect if not already connected
      const activeSocket = socket.value?.connected ? socket.value : await connect(baseURL)

      // Set up event listeners
      const handleQuizEvent = (eventData: any) => {
        console.log('📡 Quiz event received:', eventData.type, eventData.data?.message)
        if (onEvent) {
          onEvent(eventData)
        }
      }

      const handleQuizError = (errorData: any) => {
        console.error('❌ Quiz error:', errorData)
        if (onError) {
          onError(errorData)
        }
      }

      const handleQuizComplete = (completeData: any) => {
        console.log('🎉 Quiz generation completed:', completeData)
        if (onComplete) {
          onComplete()
        }
        // Clean up listeners
        activeSocket.off('quiz-event', handleQuizEvent)
        activeSocket.off('quiz-error', handleQuizError)
        activeSocket.off('quiz-complete', handleQuizComplete)
      }

      // Register event listeners
      activeSocket.on('quiz-event', handleQuizEvent)
      activeSocket.on('quiz-error', handleQuizError)
      activeSocket.on('quiz-complete', handleQuizComplete)

      // Start quiz generation
      activeSocket.emit('generate-quiz', {
        filename,
        options: options || {}
      })

      console.log('📡 Quiz generation request sent via WebSocket')

      // Return cleanup function
      return () => {
        activeSocket.off('quiz-event', handleQuizEvent)
        activeSocket.off('quiz-error', handleQuizError)
        activeSocket.off('quiz-complete', handleQuizComplete)
        console.log('🧹 WebSocket event listeners cleaned up')
      }

    } catch (error: any) {
      console.error('❌ WebSocket quiz generation error:', error)
      if (onError) {
        onError(error)
      }
      throw error
    }
  }

  const ping = () => {
    if (socket.value?.connected) {
      socket.value.emit('ping')
      socket.value.once('pong', (data) => {
        console.log('🏓 Pong received:', data)
      })
    }
  }

  // Cleanup on component unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    socket: readonly(socket),
    isConnected: readonly(isConnected),
    isConnecting: readonly(isConnecting),
    connectionError: readonly(connectionError),
    connect,
    disconnect,
    generateQuizStream,
    ping,
  }
} 