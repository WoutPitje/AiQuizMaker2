interface User {
  id: number
  email: string
  name?: string
  firstName?: string
  lastName?: string
  createdAt: string
}

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterCredentials {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

interface AuthResponse {
  success: boolean
  message: string
  user: User
  accessToken: string
  refreshToken?: string
  expiresIn: number
}

export const useAuth = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase || 'http://localhost:3001'

  // Helper to get current auth token
  const getAuthToken = (): string | null => {
    if (import.meta.client) {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  // Helper to create authenticated headers
  const getAuthHeaders = (): Record<string, string> => {
    const token = getAuthToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    
    return headers
  }

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await $fetch<AuthResponse>(`${baseURL}/auth/login`, {
        method: 'POST',
        body: credentials,
      })
      
      return response
    } catch (error: any) {
      const message = error.data?.message || 'Login failed'
      throw new Error(message)
    }
  }

  const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      const response = await $fetch<AuthResponse>(`${baseURL}/auth/register`, {
        method: 'POST',
        body: credentials,
      })
      
      return response
    } catch (error: any) {
      const message = error.data?.message || 'Registration failed'
      throw new Error(message)
    }
  }

  const verifyToken = async (token: string): Promise<{ user: User }> => {
    try {
      const response = await $fetch<{ user: User }>(`${baseURL}/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      return response
    } catch (error: any) {
      const message = error.data?.message || 'Token verification failed'
      throw new Error(message)
    }
  }

  const logout = async (token: string): Promise<void> => {
    try {
      await $fetch(`${baseURL}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch (error: any) {
      // Don't throw on logout errors, just log them
      console.error('Logout API call failed:', error)
    }
  }

  // Get user's quizzes
  const getUserQuizzes = async (): Promise<any> => {
    try {
      const response = await $fetch<any>(`${baseURL}/quizzes/my`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      
      return response
    } catch (error: any) {
      const message = error.data?.message || 'Failed to fetch user quizzes'
      throw new Error(message)
    }
  }

  // Delete a quiz
  const deleteQuiz = async (quizId: string): Promise<void> => {
    try {
      await $fetch(`${baseURL}/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
    } catch (error: any) {
      const message = error.data?.message || 'Failed to delete quiz'
      throw new Error(message)
    }
  }

  // Update quiz metadata
  const updateQuiz = async (quizId: string, updateData: { title?: string; description?: string }): Promise<any> => {
    try {
      const response = await $fetch<any>(`${baseURL}/quizzes/${quizId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: updateData,
      })
      
      return response
    } catch (error: any) {
      const message = error.data?.message || 'Failed to update quiz'
      throw new Error(message)
    }
  }

  // Toggle quiz visibility
  const toggleQuizVisibility = async (quizId: string, isPublic: boolean): Promise<any> => {
    try {
      const response = await $fetch<any>(`${baseURL}/quizzes/${quizId}/visibility`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: { isPublic },
      })
      
      return response
    } catch (error: any) {
      const message = error.data?.message || 'Failed to update quiz visibility'
      throw new Error(message)
    }
  }

  const checkQuizLimit = async () => {
    try {
      const response = await $fetch<any>(`${baseURL}/quizzes/limit-check`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      return response
    } catch (error: any) {
      const message = error.data?.message || 'Failed to check quiz limits'
      throw new Error(message)
    }
  }

  return {
    login,
    register,
    verifyToken,
    logout,
    getUserQuizzes,
    deleteQuiz,
    updateQuiz,
    toggleQuizVisibility,
    checkQuizLimit,
    getAuthToken,
    getAuthHeaders,
    baseURL
  }
}