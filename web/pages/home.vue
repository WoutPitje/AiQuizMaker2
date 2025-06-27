<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-semibold text-gray-900">
              AiQuizMaker
            </h1>
          </div>
          
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-700">
              Welcome, {{ authStore.userName }}
            </span>
            <button
              @click="handleLogout"
              :disabled="authStore.isLoading"
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {{ authStore.isLoading ? 'Signing out...' : 'Sign out' }}
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- Welcome Section -->
        <div class="mb-8">
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h2 class="text-lg font-medium text-gray-900 mb-2">
                Welcome to AiQuizMaker!
              </h2>
              <p class="text-gray-600">
                You are successfully authenticated. Here you can manage your account and access all quiz features.
              </p>
            </div>
          </div>
        </div>

        <!-- User Information -->
        <div class="mb-8">
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">
                Account Information
              </h3>
              <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt class="text-sm font-medium text-gray-500">Name</dt>
                  <dd class="mt-1 text-sm text-gray-900">
                    {{ authStore.user?.name || 'Not provided' }}
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">Email</dt>
                  <dd class="mt-1 text-sm text-gray-900">
                    {{ authStore.user?.email }}
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">User ID</dt>
                  <dd class="mt-1 text-sm text-gray-900">
                    #{{ authStore.user?.id }}
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">Member since</dt>
                  <dd class="mt-1 text-sm text-gray-900">
                    {{ formatDate(authStore.user?.createdAt) }}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="mb-8">
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <NuxtLink
                  to="/"
                  class="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div>
                    <span class="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                      <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                  </div>
                  <div class="mt-8">
                    <h4 class="text-lg font-medium text-gray-900">
                      Create Quiz
                    </h4>
                    <p class="mt-2 text-sm text-gray-500">
                      Upload a PDF and generate interactive quizzes
                    </p>
                  </div>
                </NuxtLink>

                <button
                  @click="refreshProfile"
                  :disabled="isRefreshing"
                  class="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-500 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors disabled:opacity-50"
                >
                  <div>
                    <span class="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                      <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </span>
                  </div>
                  <div class="mt-8">
                    <h4 class="text-lg font-medium text-gray-900">
                      {{ isRefreshing ? 'Refreshing...' : 'Refresh Profile' }}
                    </h4>
                    <p class="mt-2 text-sm text-gray-500">
                      Update your account information
                    </p>
                  </div>
                </button>

                <button
                  @click="clearAuthData"
                  class="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-red-500 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div>
                    <span class="rounded-lg inline-flex p-3 bg-red-50 text-red-700 ring-4 ring-white">
                      <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </span>
                  </div>
                  <div class="mt-8">
                    <h4 class="text-lg font-medium text-gray-900">
                      Clear Local Data
                    </h4>
                    <p class="mt-2 text-sm text-gray-500">
                      Clear cached authentication data
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Authentication Status -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              Authentication Status
            </h3>
            <div class="space-y-3">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="h-2 w-2 bg-green-400 rounded-full"></div>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-gray-700">
                    <span class="font-medium">Status:</span> Authenticated
                  </p>
                </div>
              </div>
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="h-2 w-2 bg-blue-400 rounded-full"></div>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-gray-700">
                    <span class="font-medium">Token:</span> {{ tokenStatus }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const isRefreshing = ref(false)

// Computed
const tokenStatus = computed(() => {
  if (!authStore.token) return 'No token'
  const truncated = authStore.token.substring(0, 20) + '...'
  return `Present (${truncated})`
})

// Methods
const handleLogout = async () => {
  await authStore.logout()
}

const refreshProfile = async () => {
  isRefreshing.value = true
  try {
    await authStore.verifyToken()
  } catch (error) {
    console.error('Failed to refresh profile:', error)
  } finally {
    isRefreshing.value = false
  }
}

const clearAuthData = () => {
  authStore.clearAuth()
  navigateTo('/login')
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Initialize auth and redirect if not authenticated
onMounted(async () => {
  await authStore.initAuth()
  if (!authStore.isLoggedIn) {
    await navigateTo('/login')
  }
})

// Page meta
definePageMeta({
  middleware: 'auth',
})</script>