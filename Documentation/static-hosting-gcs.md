# Google Cloud Storage Static Hosting Setup

## Overview
This document explains how the AI Quiz Maker is configured to use Google Cloud Storage for static site hosting without a load balancer, providing a cost-effective solution for serving the Nuxt SSG frontend.

## Architecture

### Components
1. **Google Cloud Storage Bucket** - Serves the static Nuxt.js site
2. **Cloud Run** - Hosts the API backend
3. **Cloudflare (optional)** - Provides HTTPS and CDN capabilities

### Why This Approach?
- **Cost-effective**: No load balancer costs (~$20/month saved)
- **Simple**: Direct bucket hosting with minimal infrastructure
- **Scalable**: GCS handles traffic automatically
- **HTTPS Support**: Via Cloudflare proxy (free tier)

## Configuration Details

### Storage Bucket Settings
- **Website Configuration**: Configured with index.html and 404.html
- **Public Access**: Bucket is publicly readable via IAM
- **CORS**: Configured for the domain and localhost
- **Location**: Same region as Cloud Run for low latency

### Domain Setup Options

#### Option 1: Cloudflare (Recommended for HTTPS)
1. Add domain to Cloudflare
2. Create CNAME record pointing to: `bucketname.storage.googleapis.com`
3. Enable Cloudflare proxy (orange cloud)
4. Set SSL/TLS to "Full" mode
5. Configure caching rules

#### Option 2: Direct DNS (HTTP only)
1. Create CNAME record: `yourdomain.com` → `bucketname.storage.googleapis.com`
2. Note: This only supports HTTP, not HTTPS

## Deployment Process

### 1. Deploy API to Cloud Run
```bash
cd api
docker build -t [REGISTRY_URL]/api:latest .
docker push [REGISTRY_URL]/api:latest
```

### 2. Build and Deploy Frontend
```bash
cd web
export NUXT_PUBLIC_API_URL=[CLOUD_RUN_URL]
npm run generate
gsutil -m rsync -r -d .output/public/ gs://[BUCKET_NAME]/
```

### 3. Verify Deployment
- Direct bucket: `http://[BUCKET_NAME].storage.googleapis.com`
- Via Cloudflare: `https://yourdomain.com`

## Important Considerations

### CORS Configuration
The API (Cloud Run) must include CORS headers for:
- `https://yourdomain.com` (production)
- `http://localhost:3000` (development)

### Caching Strategy
When using Cloudflare:
- Static assets: Cache for 1 year
- HTML files: Cache for 1 hour or use cache busting
- API responses: No caching

### Limitations
1. GCS custom domains only support HTTP (not HTTPS) natively
2. No server-side rendering (SSR) - pure static site
3. No automatic SSL certificate management without CDN

### Cost Breakdown
- **Storage**: ~$0.02/GB/month
- **Bandwidth**: ~$0.12/GB (free with Cloudflare)
- **Cloud Run**: Pay per use (scales to zero)
- **Total**: Typically under $5/month for small-medium sites

## Troubleshooting

### Site Not Loading
1. Check bucket permissions (must be public)
2. Verify CNAME record propagation
3. Check website configuration in bucket settings

### CORS Issues
1. Verify CORS settings in storage bucket
2. Check API CORS headers
3. Ensure protocols match (http vs https)

### 404 Errors on Routes
1. Ensure Nuxt is generating all routes
2. Check 404.html fallback page exists
3. Configure Cloudflare page rules for SPA routing

## Security Notes
- API keys should never be in frontend code
- Use environment variables for sensitive data
- Consider implementing rate limiting on API
- Enable Cloudflare DDoS protection 