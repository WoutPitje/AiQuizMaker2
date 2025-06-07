// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxtjs/tailwindcss', '@pinia/nuxt'],
  
  // Development server configuration
  devServer: {
    port: 3000 // Frontend uses port 3000
  },
  
  runtimeConfig: {
    public: {
      apiUrl: process.env.API_URL || 'http://localhost:3001' // Backend API on port 3001
    }
  }
})