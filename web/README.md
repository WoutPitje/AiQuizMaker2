# AI Quiz Maker Frontend

Modern web application built with Nuxt 3 for generating AI-powered quizzes from PDF documents.

## 🚀 Features

- **Drag & Drop PDF Upload**: Intuitive file upload interface
- **Real-time Quiz Generation**: Watch as AI generates questions in real-time
- **Multi-language Support**: Generate quizzes in multiple languages
- **Responsive Design**: Works on desktop and mobile devices
- **Magic Links**: Share quizzes with unique URLs
- **SSG Deployment**: Static site generation for optimal performance
- **PWA Ready**: Progressive Web App capabilities

## 🛠️ Tech Stack

- **Framework**: Nuxt 3 (Vue 3)
- **Styling**: Tailwind CSS
- **UI Components**: Custom Vue components
- **State Management**: Pinia
- **Deployment**: Google Cloud Storage + Cloudflare
- **Build**: Vite

## 📁 Project Structure

```
web/
├── pages/              # Application routes
│   ├── index.vue      # Home page
│   ├── quiz/          # Quiz pages
│   └── about.vue      # About page
├── components/        # Reusable Vue components
├── composables/       # Vue composables
├── stores/           # Pinia stores
├── assets/           # Static assets
├── public/           # Public files
└── nuxt.config.ts    # Nuxt configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   NUXT_PUBLIC_API_URL=http://localhost:3000
   NUXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

   Open `http://localhost:3000` to view the application.

### Building for Production

```bash
# Generate static site
npm run generate

# Preview the build locally
npm run preview
```

## 🚢 Deployment

### Deploy to Google Cloud Storage

1. **Set environment variables**:
   ```bash
   export CLOUD_RUN_URL=https://your-api-url.run.app
   export GCP_PROJECT_ID=your-project-id
   export DOMAIN_NAME=yourdomain.com
   ```

2. **Run deployment script**:
   ```bash
   ./deploy-web.sh
   ```

### Manual Deployment

```bash
# Generate static site
NUXT_PUBLIC_API_URL=https://your-api-url.run.app npm run generate

# Upload to GCS bucket
gsutil -m rsync -r -d .output/public/ gs://your-bucket-name/
```

## 🎨 Customization

### Theme Configuration

Edit `tailwind.config.js` to customize colors, fonts, and other design tokens.

### Environment Variables

- `NUXT_PUBLIC_API_URL` - Backend API URL
- `NUXT_PUBLIC_SITE_URL` - Frontend site URL
- `NUXT_PUBLIC_GA_ID` - Google Analytics ID (optional)

## 📱 Progressive Web App

The application includes PWA capabilities:

- Offline support
- Install to home screen
- Push notifications (coming soon)

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
