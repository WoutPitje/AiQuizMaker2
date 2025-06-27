<template>
  <div class="min-h-screen bg-gray-50">
    <ClientOnly>
      <!-- Header -->
      <header class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <h1 class="text-xl font-semibold text-gray-900">
                🧠 QuizAi Dashboard
              </h1>
            </div>
            <div class="flex items-center space-x-4">
              <span class="text-sm text-gray-500">
                {{ authStore.userName }}
              </span>
              <button
                @click="handleLogout"
                class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-4xl mx-auto py-12 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <!-- Welcome Section -->
          <div class="text-center mb-12">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">
              Welcome back, {{ authStore.userName }}!
            </h2>
            <p class="text-lg text-gray-600">
              Ready to create your next interactive quiz?
            </p>
          </div>

        <!-- Create New Quiz Button -->
        <div class="flex justify-center">
          <NuxtLink
            to="/"
            class="group relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <div class="flex items-center space-x-3">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Create New Quiz</span>
            </div>
          </NuxtLink>
        </div>

        <!-- My Quizzes -->
        <div class="mt-16">
          <div class="text-center mb-8">
            <h3 class="text-xl font-semibold text-gray-900">My Quizzes</h3>
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p class="mt-2 text-sm text-gray-600">Loading your quizzes...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="text-center py-8">
            <p class="text-gray-600 mb-4">{{ error }}</p>
            <button
              @click="loadUserQuizzes"
              class="text-blue-600 hover:text-blue-700 font-medium"
            >
              Try Again
            </button>
          </div>

          <!-- Empty State -->
          <div v-else-if="userQuizzes.length === 0" class="text-center py-8">
            <div class="text-gray-400 mb-4">
              <svg class="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p class="text-gray-600">No quizzes yet. Create your first one!</p>
          </div>

          <!-- Quiz List -->
          <div v-else class="max-w-2xl mx-auto space-y-3">
            <div
              v-for="quiz in userQuizzes.slice(0, 5)"
              :key="quiz.id"
              class="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-medium text-gray-900 truncate">{{ quiz.title }}</h4>
                  <div class="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                    <span>{{ quiz.metadata?.totalQuestions || 0 }} questions</span>
                    <span>{{ formatDate(quiz.createdAt) }}</span>
                    <span 
                      :class="quiz.isPublic ? 'text-green-600' : 'text-gray-500'"
                      class="inline-flex items-center"
                    >
                      {{ quiz.isPublic ? '🌍 Public' : '🔒 Private' }}
                    </span>
                  </div>
                </div>
                <NuxtLink
                  :to="`/quiz/${quiz.magicLink || quiz.id}`"
                  class="ml-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Take Quiz
                </NuxtLink>
              </div>
            </div>

            <!-- View All Link -->
            <div v-if="userQuizzes.length > 5" class="text-center pt-4">
              <button
                @click="showAllQuizzes = !showAllQuizzes"
                class="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {{ showAllQuizzes ? 'Show Less' : `View All (${userQuizzes.length})` }}
              </button>
            </div>

            <!-- Expanded List -->
            <div v-if="showAllQuizzes && userQuizzes.length > 5" class="space-y-3 pt-3">
              <div
                v-for="quiz in userQuizzes.slice(5)"
                :key="quiz.id"
                class="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-medium text-gray-900 truncate">{{ quiz.title }}</h4>
                    <div class="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                      <span>{{ quiz.metadata?.totalQuestions || 0 }} questions</span>
                      <span>{{ formatDate(quiz.createdAt) }}</span>
                      <span 
                        :class="quiz.isPublic ? 'text-green-600' : 'text-gray-500'"
                        class="inline-flex items-center"
                      >
                        {{ quiz.isPublic ? '🌍 Public' : '🔒 Private' }}
                      </span>
                    </div>
                  </div>
                  <NuxtLink
                    :to="`/quiz/${quiz.magicLink || quiz.id}`"
                    class="ml-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Take Quiz
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <template #fallback>
      <div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const { getUserQuizzes } = useAuth()

// State
const userQuizzes = ref<any[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const showAllQuizzes = ref(false)

// Methods
const handleLogout = async () => {
  await authStore.logout()
}

const loadUserQuizzes = async () => {
  isLoading.value = true
  error.value = null

  try {
    const response = await getUserQuizzes()
    if (response.success) {
      userQuizzes.value = response.quizzes
      console.log('📋 Loaded quizzes:', response.quizzes)
    } else {
      error.value = response.message || 'Failed to load quizzes'
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load quizzes'
    console.error('Failed to load user quizzes:', err)
  } finally {
    isLoading.value = false
  }
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

// Initialize auth and redirect if not authenticated
onMounted(async () => {
  await authStore.initAuth()
  if (!authStore.isLoggedIn) {
    await navigateTo('/login')
    return
  }
  
  // Load user quizzes
  await loadUserQuizzes()
})

// Page meta
definePageMeta({
  middleware: 'auth',
})
</script>