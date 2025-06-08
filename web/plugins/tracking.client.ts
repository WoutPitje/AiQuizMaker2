export default defineNuxtPlugin(() => {
  const { trackPageView, trackEvent } = useTracking()
  const router = useRouter()

  // Track initial page view
  if (process.client) {
    trackPageView()
  }

  // Track page views on route changes
  router.afterEach((to, from) => {
    if (process.client) {
      // Small delay to ensure the page has loaded
      setTimeout(() => {
        trackPageView({
          url: window.location.href,
          referer: from.fullPath ? window.location.origin + from.fullPath : undefined
        })
      }, 100)
    }
  })

  // Provide global access to tracking functions
  return {
    provide: {
      trackEvent,
      trackPageView
    }
  }
}) 