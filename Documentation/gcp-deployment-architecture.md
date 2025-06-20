# GCP Deployment Architecture

## Overview
This document describes the Google Cloud Platform deployment architecture for AiQuizMaker, optimized for cost-effectiveness while maintaining scalability and performance.

## Architecture Components

### 1. Frontend (Nuxt SSG)
- **Service**: Cloud Storage Bucket
- **Cost**: ~$0.02/GB/month for storage + minimal egress costs
- **CDN**: Cloud CDN for global distribution
- **Build**: Static site generation via `nuxt generate`

### 2. Backend API (NestJS)
- **Service**: Cloud Run
- **Cost**: Pay-per-use (no cost when idle)
- **Container**: Dockerized NestJS application
- **Scaling**: Automatic scaling from 0 to N instances

### 3. File Storage
- **Uploads Bucket**: For temporary PDF uploads
- **Quiz Storage Bucket**: For persistent quiz data
- **Cost**: ~$0.02/GB/month for standard storage

### 4. Load Balancing
- **Service**: Cloud Load Balancing with URL Map
- **Routes**:
  - `/api/*` → Cloud Run (NestJS API)
  - `/*` → Cloud Storage (Nuxt static site)

### 5. Security
- **IAM**: Service accounts with minimal permissions
- **CORS**: Configured on both Cloud Storage and Cloud Run
- **SSL**: Managed certificates via Google

## Cost Optimization Strategies

1. **Static Site Generation**: Nuxt SSG eliminates compute costs for frontend
2. **Cloud Run**: Scales to zero when not in use
3. **Standard Storage**: Uses cheaper storage class for files
4. **Regional Resources**: Single region deployment to minimize costs

## Environment Variables

### API (Cloud Run)
- `OPENAI_API_KEY`: OpenAI API key for quiz generation
- `MAX_PDF_SIZE`: Maximum PDF file size (default: 104857600)
- `MAX_PAGES_PER_PDF`: Maximum pages per PDF (default: 200)
- `DEFAULT_QUESTIONS_PER_PAGE`: Questions per page (default: 2)
- `WEB_URL`: Frontend URL for CORS
- `NODE_ENV`: production
- `PORT`: 8080

### Build Time (Nuxt)
- `API_URL`: Cloud Run service URL
- `SITE_URL`: Frontend domain
- `GOOGLE_ANALYTICS_ID`: GA tracking ID

## Deployment Process

1. **Infrastructure**: Deploy Terraform to create GCP resources
2. **API**: Build and push Docker image to Artifact Registry, deploy to Cloud Run
3. **Frontend**: Run `nuxt generate` and upload to Cloud Storage bucket
4. **DNS**: Point domain to Load Balancer IP

## Monitoring

- Cloud Run metrics for API performance
- Cloud Storage metrics for bandwidth usage
- Cloud Logging for error tracking
- Budget alerts for cost control 