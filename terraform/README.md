# AI Quiz Maker - Terraform Infrastructure

This Terraform configuration sets up the infrastructure for AI Quiz Maker on Google Cloud Platform using a cost-effective static hosting approach.

## Architecture Overview

The infrastructure consists of:
- **Google Cloud Storage**: Static website hosting for the Nuxt.js frontend (SSG)
- **Cloud Run**: Serverless API backend (scales to zero)
- **Artifact Registry**: Docker image storage
- **Cloud Storage Buckets**: File uploads and quiz data storage
- **Cloudflare**: HTTPS and CDN for custom domain (free tier)

### Why This Architecture?
- **Cost-effective**: No load balancer (~$20/month saved)
- **Scalable**: Both GCS and Cloud Run scale automatically
- **Simple**: Minimal infrastructure to manage
- **Secure**: HTTPS via Cloudflare, API on secure Cloud Run

## Prerequisites

1. **Google Cloud Project**: Create a new GCP project or use an existing one
2. **Google Cloud SDK**: Install [gcloud CLI](https://cloud.google.com/sdk/docs/install)
3. **Terraform**: Install [Terraform](https://www.terraform.io/downloads) (v1.0+)
4. **Docker**: Install [Docker](https://docs.docker.com/get-docker/) for building images
5. **Domain**: Have a domain ready to point to the load balancer

## Initial Setup

1. **Authenticate with Google Cloud**:
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

2. **Set your project**:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Enable billing** on your GCP project

## Quick Start

### 1. Configure Terraform Variables

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:
- `project_id`: Your GCP project ID
- `openai_api_key`: Your OpenAI API key
- `domain_name`: Your domain (default: quizai.nl)

### 2. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Review the deployment plan
terraform plan

# Apply the configuration
terraform apply
```

This will create:
- Cloud Storage buckets for static site, uploads, and quiz storage
- Artifact Registry for Docker images
- Cloud Run service for the API
- Service accounts and IAM permissions

### 3. Note the Outputs

After deployment, Terraform will output:
- Static site bucket name and URL
- Cloud Run API URL
- Deployment instructions

### 4. Deploy the API

```bash
cd ..
export GCP_PROJECT_ID=aiquizmaker-1750103493
export GCP_REGION=europe-west4  # or your chosen region
chmod +x deploy-api.sh
./deploy-api.sh
```

### 5. Deploy the Frontend

```bash
export GCP_PROJECT_ID=aiquizmaker-1750103493
export CLOUD_RUN_URL=https://aiquizmaker-api-681188945390.europe-west4.run.app  # From step 3
export DOMAIN_NAME=quizai.nl
chmod +x deploy-web.sh
./deploy-web.sh
```

### 6. Configure Domain

Follow the domain configuration instructions in the "Domain Configuration" section below.

## Infrastructure Components

### Static Website Hosting
- Frontend served directly from Google Cloud Storage
- Configured with index.html and 404.html fallbacks
- Public read access enabled
- CORS configured for API communication

### API Backend
- Cloud Run service with auto-scaling
- Scales to zero when not in use
- Handles file uploads and quiz generation
- Secure HTTPS endpoint

### Storage Buckets
1. **Static Site Bucket**: Public website files
2. **Uploads Bucket**: Temporary PDF storage (auto-deleted after 1 day)
3. **Quiz Storage Bucket**: Persistent quiz data with versioning



## Domain Configuration

### Option 1: Cloudflare (Recommended for HTTPS)
1. Add your domain to Cloudflare
2. Create a CNAME record:
   - Name: `@` or subdomain
   - Target: `[bucket-name].storage.googleapis.com`
   - Proxy: Enabled (orange cloud)
3. Set SSL/TLS encryption mode to "Full"
4. Configure page rules for caching

### Option 2: Direct DNS (HTTP only)
1. Create a CNAME record pointing to `[bucket-name].storage.googleapis.com`
2. Note: This only supports HTTP, not HTTPS

## Outputs

After applying the Terraform configuration, you'll get:
- Static site bucket URL for direct access
- Cloud Run API service URL
- Deployment instructions
- Important configuration notes

## Cost Estimation

- **Storage**: ~$0.02/GB/month for static files
- **Cloud Run**: ~$0.00/month when idle (scales to zero)
- **Bandwidth**: ~$0.12/GB (free with Cloudflare)
- **Total**: Typically under $5/month for small-medium sites

## Updating the Application

### Update API
```bash
./deploy-api.sh
```

### Update Frontend
```bash
./deploy-web.sh
```

## Monitoring

- **Cloud Run Metrics**: View in Cloud Console > Cloud Run
- **Storage Metrics**: View in Cloud Console > Storage
- **Logs**: View in Cloud Console > Logging
- **Errors**: Set up alerting in Cloud Console > Monitoring

## Cleanup

To remove all resources and avoid charges:

```bash
cd terraform
terraform destroy
```

**Warning**: This will delete all resources including stored data.

## Troubleshooting

### HTTPS Not Working
- Ensure Cloudflare proxy is enabled (orange cloud)
- Check SSL/TLS mode is set to "Full" in Cloudflare
- Verify CNAME record points to correct bucket URL

### API Not Accessible
- Check Cloud Run logs
- Verify environment variables
- Ensure Cloud Run service is running
- Check CORS configuration

### Static Site Not Loading
- Check bucket permissions (must be public)
- Verify files were uploaded correctly
- Check bucket website configuration
- Clear browser cache

### Domain Not Resolving
- Verify CNAME record is correct
- Wait for DNS propagation (up to 48 hours)
- Test direct bucket URL first

### High Costs
- Check Cloud Run scaling settings
- Review storage usage and bandwidth
- Consider using Cloudflare to reduce bandwidth costs 