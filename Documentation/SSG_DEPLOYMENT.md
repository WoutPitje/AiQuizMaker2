# Static Site Generation (SSG) Deployment

## Overview
The Nuxt frontend is configured for Static Site Generation (SSG) to provide:
- ⚡ Instant loading times
- 💰 Cost-effective hosting (free on many platforms)
- 🔒 Enhanced security (no server-side vulnerabilities)
- 📈 Better SEO performance
- 🌐 Global CDN distribution

## Build Process
1. `npm run generate` creates static HTML files
2. All pages are pre-rendered at build time
3. Output is placed in `.output/public` directory
4. Files can be deployed to any static hosting service

## Deployment Options
- **Netlify**: Automatic deployments from Git
- **Vercel**: Optimized for frontend frameworks
- **GitHub Pages**: Free hosting for public repos
- **Cloudflare Pages**: Fast global CDN
- **AWS S3 + CloudFront**: Enterprise-grade hosting

## API Integration
The static site communicates with the backend API via:
- Environment variable: `NUXT_PUBLIC_API_URL`
- Client-side API calls using fetch/axios
- No server-side rendering dependencies

## Benefits vs Cloud Run
- **Cost**: Free tier on most platforms vs $0.40+ per million requests
- **Performance**: Instant loading vs cold starts
- **Scalability**: Automatic CDN scaling vs manual scaling
- **Maintenance**: Zero server maintenance vs container management 