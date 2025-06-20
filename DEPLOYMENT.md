# AI Quiz Maker - Deployment Guide

This guide provides a clean, step-by-step deployment process using the two main deployment scripts.

## 🚀 Quick Deployment

### Prerequisites

1. **Google Cloud Platform**: Project with billing enabled
2. **gcloud CLI**: Installed and authenticated
3. **Docker**: Installed for API deployment
4. **Environment Variables**: Set your OpenAI API key

### Step 1: Deploy the API

```bash
# Set required environment variables
export GCP_PROJECT_ID=your-project-id
export GCP_REGION=europe-west4  # optional, defaults to europe-west4

# Deploy API to Cloud Run
./deploy-api.sh
```

This script will:
- Build the Docker image for the correct platform (linux/amd64)
- Push to Google Artifact Registry
- Deploy to Cloud Run
- Output the API service URL

### Step 2: Deploy the Frontend

```bash
# Set required environment variables
export GCP_PROJECT_ID=your-project-id
export CLOUD_RUN_URL=https://your-api-url.run.app  # from Step 1
export DOMAIN_NAME=yourdomain.com  # optional, defaults to quizai.nl

# Deploy frontend to Google Cloud Storage
./deploy-web.sh
```

This script will:
- Build the Nuxt.js static site
- Upload to Google Cloud Storage bucket
- Set proper cache headers
- Output access URLs

## 🔧 Configuration

### Environment Setup

1. **Copy the example environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your values**:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

### Infrastructure Setup

Before deploying, ensure your GCP infrastructure is ready:

```bash
cd terraform
terraform init
terraform apply
```

See [terraform/README.md](terraform/README.md) for detailed infrastructure setup.

## 🌐 Access Your Application

After deployment, you can access your application at:

- **Direct (HTTP)**: `http://yourdomain.com.storage.googleapis.com`
- **Custom Domain (HTTPS)**: `https://yourdomain.com` (requires Cloudflare setup)
- **API Health Check**: `https://your-api-url.run.app/health`

## 🔄 Updates

To update your deployment:

```bash
# Update API
./deploy-api.sh

# Update Frontend
./deploy-web.sh
```

## 📋 Troubleshooting

### Common Issues

1. **Docker build fails**: Ensure Docker is running and you're authenticated to gcloud
2. **API deployment fails**: Check your GCP project permissions and billing
3. **Frontend deployment fails**: Verify your bucket exists and you have write permissions
4. **CORS errors**: Ensure your API URL is correctly set in the frontend build

### Useful Commands

```bash
# Check API logs
gcloud run services logs read aiquizmaker-api --region=europe-west4

# Check bucket contents
gsutil ls gs://your-bucket-name

# Test API health
curl https://your-api-url.run.app/health
```

## 📚 Additional Resources

- [API Documentation](api/README.md)
- [Frontend Documentation](web/README.md)
- [Infrastructure Documentation](terraform/README.md)
- [Main Project README](README.md) 