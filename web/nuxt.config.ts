// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/eslint', 
    '@nuxtjs/tailwindcss', 
    '@pinia/nuxt'
  ],
  
  // Development server configuration
  devServer: {
    port: 3000 // Frontend uses port 3000
  },

  // App configuration for SEO
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: '🧠 QuizAi - Transform PDFs into Interactive Quizzes',
      meta: [
        { name: 'description', content: 'Transform any PDF into an interactive AI-powered quiz instantly. Upload documents and generate personalized quizzes using advanced AI technology.' },
        { name: 'keywords', content: 'QuizAi, AI quiz maker, PDF quiz generator, interactive quiz, educational technology, AI learning tools, quiz creation, document processing' },
        { name: 'author', content: 'QuizAi' },
        { name: 'robots', content: 'index, follow' },
        // Open Graph
        { property: 'og:title', content: '🧠 QuizAi - Transform PDFs into Interactive Quizzes' },
        { property: 'og:description', content: 'Transform any PDF into an interactive AI-powered quiz instantly. Upload documents and generate personalized quizzes using advanced AI technology.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://quizai.nl' },
        { property: 'og:image', content: 'https://quizai.nl/og-image.jpg' },
        { property: 'og:site_name', content: 'QuizAi' },
        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: '🧠 QuizAi - Transform PDFs into Interactive Quizzes' },
        { name: 'twitter:description', content: 'Transform any PDF into an interactive AI-powered quiz instantly. Upload documents and generate personalized quizzes using advanced AI technology.' },
        { name: 'twitter:image', content: 'https://quizai.nl/og-image.jpg' },
        // Additional SEO
        { name: 'theme-color', content: '#3B82F6' },
        { name: 'msapplication-TileColor', content: '#3B82F6' }
      ],
      link: [
        { rel: 'canonical', href: 'https://quizai.nl' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }
      ],
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            'name': 'QuizAi',
            'description': 'Transform any PDF into an interactive AI-powered quiz instantly.',
            'url': 'https://quizai.nl',
            'applicationCategory': 'EducationalApplication',
            'operatingSystem': 'Any',
            'offers': {
              '@type': 'Offer',
              'price': '0',
              'priceCurrency': 'USD'
            }
          })
        }
      ]
    }
  },
  
  runtimeConfig: {
    public: {
      apiUrl: process.env.API_URL || 'http://localhost:8000/api', // Production API URL with nginx proxy
      apiBase: process.env.API_URL || 'http://localhost:8000/api', // For tracking API calls
      siteUrl: process.env.SITE_URL || 'https://quizai.nl',
      googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID || 'G-XXXXXXXXXX'
    }
  }
})