export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const gtag = config.public.googleAnalyticsId
  
  if (!gtag || gtag === 'G-XXXXXXXXXX') {
    console.warn('Google Analytics ID not configured')
    return
  }

  // Load gtag script
  useHead({
    script: [
      {
        src: `https://www.googletagmanager.com/gtag/js?id=${gtag}`,
        async: true
      },
      {
        innerHTML: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gtag}', {
            page_title: document.title,
            page_location: window.location.href
          });
        `
      }
    ]
  })

  // Provide gtag globally for tracking events
  return {
    provide: {
      gtag: (command: string, ...args: any[]) => {
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag(command, ...args)
        }
      }
    }
  }
}) 