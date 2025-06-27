import { defineStore } from 'pinia'

interface User {
  id: number
  email: string
  name?: string
  firstName?: string
  lastName?: string
  createdAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
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

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  }),

  getters: {
    isLoggedIn: (state) => state.isAuthenticated && !!state.user,
    userName: (state) => {
      if (state.user?.firstName && state.user?.lastName) {
        return `${state.user.firstName} ${state.user.lastName}`
      }
      return state.user?.name || state.user?.email || 'User'
    },
  },

  actions: {

    // Initialize auth state from localStorage
    async initAuth() {
      if (import.meta.client) {
        const token = localStorage.getItem('auth_token')
        const user = localStorage.getItem('auth_user')
        
        if (token && user) {
          try {
            this.token = token
            this.user = JSON.parse(user)
            this.isAuthenticated = true
            
            // Verify token is still valid
            await this.verifyToken()
          } catch (error) {
            console.error('Failed to initialize auth:', error)
            this.clearAuth()
          }
        }
      }
    },

    // Verify token with API
    async verifyToken() {
      if (!this.token) return false

      try {
        const { verifyToken } = useAuth()
        const response = await verifyToken(this.token)
        
        this.user = response.user
        return true
      } catch (error) {
        console.error('Token verification failed:', error)
        this.clearAuth()
        return false
      }
    },

    // Login user
    async login(credentials: LoginCredentials) {
      this.isLoading = true
      this.error = null

      try {
        const { login } = useAuth()
        const response = await login(credentials)

        this.setAuthData(response)
        await navigateTo('/')
        
        return { success: true }
      } catch (error: any) {
        this.error = error.message
        return { success: false, error: error.message }
      } finally {
        this.isLoading = false
      }
    },

    // Register user
    async register(credentials: RegisterCredentials) {
      this.isLoading = true
      this.error = null

      try {
        const { register } = useAuth()
        const response = await register(credentials)

        this.setAuthData(response)
        await navigateTo('/')
        
        return { success: true }
      } catch (error: any) {
        this.error = error.message
        return { success: false, error: error.message }
      } finally {
        this.isLoading = false
      }
    },

    // Logout user
    async logout() {
      try {
        if (this.token) {
          const { logout } = useAuth()
          await logout(this.token)
        }
      } catch (error) {
        console.error('Logout API call failed:', error)
      } finally {
        this.clearAuth()
        await navigateTo('/login')
      }
    },

    // Set authentication data
    setAuthData(authResponse: AuthResponse) {
      this.user = authResponse.user
      this.token = authResponse.accessToken
      this.isAuthenticated = true
      
      // Store in localStorage (client-side only)
      if (import.meta.client) {
        localStorage.setItem('auth_token', authResponse.accessToken)
        localStorage.setItem('auth_user', JSON.stringify(authResponse.user))
      }
    },

    // Clear authentication data
    clearAuth() {
      this.user = null
      this.token = null
      this.isAuthenticated = false
      this.error = null
      
      // Clear localStorage (client-side only)
      if (import.meta.client) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    },

    // Clear error
    clearError() {
      this.error = null
    },
  },
})