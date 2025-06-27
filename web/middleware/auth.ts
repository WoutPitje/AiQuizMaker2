export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore()
  
  // Initialize auth state if not already done
  if (!authStore.user && !authStore.isLoading) {
    await authStore.initAuth()
  }
  
  // If not authenticated, redirect to login
  if (!authStore.isLoggedIn) {
    return navigateTo('/login')
  }
})