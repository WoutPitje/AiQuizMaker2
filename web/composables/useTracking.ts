import { v4 as uuidv4 } from 'uuid'

export interface TrackingData {
  url: string
  referer?: string
  sessionId?: string
  userId?: string
}

export const useTracking = () => {
  const config = useRuntimeConfig()
  
  // Generate or retrieve session ID
  const getSessionId = (): string => {
    if (process.client) {
      let sessionId = localStorage.getItem('session_id')
      if (!sessionId) {
        sessionId = uuidv4()
        localStorage.setItem('session_id', sessionId)
      }
      return sessionId
    }
    return 'server-side'
  }

  // Track page view
  const trackPageView = async (additionalData?: Partial<TrackingData>) => {
    try {
      const sessionId = getSessionId()
      const route = useRoute()
      
      const trackingData: TrackingData = {
        url: window.location.href,
        referer: document.referrer || undefined,
        sessionId,
        ...additionalData
      }

      // Don't track in development unless explicitly enabled
      if (process.dev && !process.env.ENABLE_TRACKING) {
        console.log('🔍 Would track (dev mode):', trackingData)
        return
      }

      await $fetch('/track-page-view', {
        method: 'POST',
        baseURL: config.public.apiUrl || '/api',
        body: trackingData
      })

      if (process.dev) {
        console.log('📊 Page view tracked:', trackingData)
      }
    } catch (error) {
      console.error('Failed to track page view:', error)
    }
  }

  // Track custom events
  const trackEvent = async (eventName: string, eventData?: any) => {
    try {
      const sessionId = getSessionId()
      
      const trackingData = {
        url: window.location.href,
        referer: document.referrer || undefined,
        sessionId,
        eventName,
        eventData
      }

      // In a real app, you might want a separate endpoint for custom events
      // For now, we'll use the same endpoint with additional data
      await $fetch('/track-page-view', {
        method: 'POST',
        baseURL: config.public.apiUrl || '/api',
        body: {
          ...trackingData,
          url: `${trackingData.url}#event:${eventName}`
        }
      })

      if (process.dev) {
        console.log('📊 Event tracked:', eventName, eventData)
      }
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }

  return {
    trackPageView,
    trackEvent,
    getSessionId
  }
} 