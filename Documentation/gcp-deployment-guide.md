# GCP Deployment Guide

## Overview

This comprehensive guide covers deploying AI Quiz Maker to Google Cloud Platform using a cost-optimized hybrid architecture. The setup uses static hosting for the frontend (~$1.25/month) and Cloud Run for the API (~$5-20/month), providing 85% cost savings compared to running both services on Cloud Run.

## Architecture

### Hybrid Static + Serverless Architecture
```
Internet → Load Balancer → ┬→ /api/* → Cloud Run (NestJS API)
                          └→ /* → Cloud Storage (Nuxt SSG)
```

### Components

#### 1. Frontend (Nuxt SSG)
- **Service**: Cloud Storage Bucket
- **Cost**: ~$1.25/month (storage + egress)
- **Features**: Pre-rendered HTML, instant loading, global distribution
- **Build**: Static site generation via `nuxt generate`

#### 2. Backend API (NestJS)
- **Service**: Cloud Run
- **Cost**: ~$5-20/month (pay-per-use, scales to zero)
- **Features**: Automatic scaling, managed SSL, health checks
- **Container**: Dockerized NestJS application

#### 3. File Storage
- **Uploads Bucket**: Temporary PDF uploads
- **Quiz Storage Bucket**: Persistent quiz data
- **Cost**: ~$0.02/GB/month for standard storage
- **Features**: Lifecycle policies, CORS configuration

#### 4. Load Balancing
- **Service**: Cloud Load Balancing with URL Map
- **SSL**: Managed certificates via Google
- **Security**: IAM, CORS, minimal permissions

## Quick Start

### 1. Prerequisites
- Google Cloud Account with billing enabled
- Google Cloud SDK installed and authenticated
- Docker installed for image builds
- Domain name (optional but recommended)

### 2. Setup Terraform
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your configuration
terraform init
terraform apply
```

### 3. Deploy API
```bash
export GCP_PROJECT_ID=your-project-id
./deploy-api.sh
```

### 4. Deploy Frontend
```bash
export GCP_PROJECT_ID=your-project-id
export DOMAIN_NAME=your-domain.com
./deploy-web.sh
```

### 5. Point Domain
- Note the load balancer IP from Terraform output
- Update your domain's A record to point to this IP

## Detailed Setup

### Environment Variables

#### API (Cloud Run)
```env
OPENAI_API_KEY=your_openai_api_key
MAX_PDF_SIZE=104857600
MAX_PAGES_PER_PDF=200
DEFAULT_QUESTIONS_PER_PAGE=2
WEB_URL=https://your-domain.com
NODE_ENV=production
PORT=8080
```

#### Build Time (Nuxt)
```env
API_URL=https://api.your-domain.com
SITE_URL=https://your-domain.com
GOOGLE_ANALYTICS_ID=GA_TRACKING_ID
```

### Terraform Configuration

#### Main Variables (terraform.tfvars)
```hcl
project_id = "your-project-id"
billing_account = "your-billing-account"
org_id = "your-org-id"
openai_api_key = "your-openai-key"
environment = "prod"
region = "europe-west1"
domain_name = "your-domain.com"
api_domain_name = "api.your-domain.com"
```

#### Optional Configuration
```hcl
# Cost optimization
create_project = true
enable_cdn = false  # Save ~$18/month
min_instances = 0   # Scale to zero

# Resource allocation
api_cpu = "1"
api_memory = "512Mi"
api_max_instances = 10
```

## Cost Analysis

### Previous Architecture (Both on Cloud Run)
- API: ~$20/month
- Frontend: ~$20/month
- **Total: ~$40+/month**

### New Hybrid Architecture
- API (Cloud Run): ~$5-20/month
- Frontend (Static): ~$1.25/month
- Load Balancer: ~$18/month
- **Total: ~$24-39/month**

### Cost Optimization Options
- **Without Load Balancer**: ~$6-21/month (85% savings)
- **With CDN**: +$18/month (optional)
- **Regional deployment**: Minimize cross-region costs

## Deployment Process

### 1. Infrastructure Setup
```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform
terraform init

# Review planned changes
terraform plan

# Apply infrastructure
terraform apply
```

### 2. Build and Deploy API
```bash
# Build API Docker image
docker build -t gcr.io/${GCP_PROJECT_ID}/aiquizmaker-api ./api

# Push to Container Registry
docker push gcr.io/${GCP_PROJECT_ID}/aiquizmaker-api

# Deploy to Cloud Run
gcloud run deploy aiquizmaker-api \
  --image gcr.io/${GCP_PROJECT_ID}/aiquizmaker-api \
  --region europe-west1 \
  --allow-unauthenticated
```

### 3. Build and Deploy Frontend
```bash
# Navigate to web directory
cd web

# Install dependencies
npm install

# Generate static site
npm run generate

# Upload to Cloud Storage
gsutil -m rsync -r -d dist/ gs://your-static-bucket/
```

### 4. Domain Configuration
```bash
# Map custom domains (if configured)
gcloud run domain-mappings create \
  --service aiquizmaker-api \
  --domain api.your-domain.com \
  --region europe-west1
```

## File Storage Configuration

### Automatic Storage Detection
The API automatically uses:
- **Local storage** when GCS environment variables are not set (development)
- **Google Cloud Storage** when deployed to GCP (production)

### Storage Buckets
- **Upload Bucket**: Temporary file storage with 24-hour lifecycle
- **Quiz Bucket**: Persistent quiz data with versioning
- **CORS Configuration**: Enabled for web uploads

## Performance Optimizations

### Static Site Benefits
- **Instant Loading**: Pre-rendered HTML eliminates cold starts
- **Global Distribution**: Content served from Google's edge locations
- **Aggressive Caching**: Static assets cached for 1 year
- **Compressed Transfer**: Automatic gzip compression

### API Optimizations
- **Auto-scaling**: Scales from 0 to N instances based on traffic
- **Health Checks**: Startup and liveness probes for reliability
- **Connection Pooling**: Efficient database connections
- **Memory Management**: Optimized container resource allocation

## Monitoring and Logging

### Available Metrics
- **API Performance**: Response times, error rates, throughput
- **Storage Usage**: Bandwidth consumption, file counts
- **Cost Tracking**: Real-time billing alerts and budgets

### Logging Commands
```bash
# View API logs
gcloud logging read "resource.type=cloud_run_revision"

# Monitor specific service
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=aiquizmaker-api"

# Storage access logs
gsutil logging get gs://your-bucket-name
```

### Dashboard Access
- **Cloud Console**: Navigate to Cloud Run → your-service
- **Monitoring**: Cloud Console → Monitoring → Dashboards
- **Logs**: Cloud Console → Logging → Logs Explorer

## Security Considerations

### Service Accounts
- **Minimal Permissions**: Each service has only required permissions
- **Service-to-Service**: Secure internal communication
- **Secret Management**: OpenAI API key stored in Secret Manager

### Network Security
- **HTTPS-Only**: Enforced SSL/TLS for all traffic
- **CORS Configuration**: Restricted to allowed origins
- **IAM Policies**: Role-based access control

### Storage Security
- **Bucket Permissions**: Public read for static content only
- **File Lifecycle**: Automatic cleanup of temporary files
- **Access Logging**: Track all bucket access for auditing

## Updates and Maintenance

### API Updates
```bash
# Build new image
docker build -t gcr.io/${GCP_PROJECT_ID}/aiquizmaker-api:latest ./api

# Push to registry
docker push gcr.io/${GCP_PROJECT_ID}/aiquizmaker-api:latest

# Deploy update
gcloud run deploy aiquizmaker-api \
  --image gcr.io/${GCP_PROJECT_ID}/aiquizmaker-api:latest \
  --region europe-west1
```

### Frontend Updates
```bash
cd web
npm run generate
gsutil -m rsync -r -d dist/ gs://your-static-bucket/
```

### Infrastructure Updates
```bash
cd terraform
terraform plan
terraform apply
```

## Troubleshooting

For detailed troubleshooting information, see [GCP Troubleshooting Guide](./gcp-troubleshooting.md).

### Quick Fixes

#### API Not Responding
1. Check Cloud Run service status
2. Verify environment variables
3. Review application logs
4. Test health endpoint

#### Static Site Issues
1. Verify bucket permissions
2. Check CORS configuration
3. Test direct bucket access
4. Review load balancer configuration

#### Domain Mapping Issues
1. Verify DNS configuration
2. Check SSL certificate status
3. Test domain mapping
4. Review load balancer settings

## Next Steps

After successful deployment:

1. **Set up monitoring alerts** for uptime and performance
2. **Configure backup strategies** for critical data
3. **Implement CI/CD pipelines** for automated deployments
4. **Review cost optimization** settings monthly
5. **Test disaster recovery** procedures

## Related Documentation

- [GCP Troubleshooting Guide](./gcp-troubleshooting.md)
- [Infrastructure Guide](./infrastructure-guide.md)
- [Production Environment Setup](./production-environment-variables.md) 