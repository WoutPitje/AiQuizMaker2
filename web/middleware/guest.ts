export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore()
  
  // Initialize auth state if not already done
  if (!authStore.user && !authStore.isLoading) {
    await authStore.initAuth()
  }
  
  // If already authenticated, redirect to home
  if (authStore.isLoggedIn) {
    return navigateTo('/home')
  }
})