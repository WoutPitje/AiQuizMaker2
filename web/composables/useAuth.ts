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

  return {
    login,
    register,
    verifyToken,
    logout,
    baseURL
  }
}