# Local GCP Development Setup

This guide shows how to use your GCP buckets locally for development and testing.

## 🛠️ Prerequisites

- Google Cloud SDK installed
- GCP project with storage buckets created
- Node.js 18+ and npm

## 📋 Setup Steps

### 1. Install Google Cloud SDK

```bash
# macOS
brew install --cask google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Windows
# Download from: https://cloud.google.com/sdk/docs/install
```

### 2. Authenticate with Google Cloud

```bash
# Login to your Google account
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Setup application default credentials for local development
gcloud auth application-default login
```

### 3. Verify Your Buckets Exist

```bash
# List your buckets
gsutil ls

# Check specific buckets
gsutil ls gs://aiquizmaker-prod-uploads
gsutil ls gs://aiquizmaker-prod-quiz-storage
```

### 4. Configure Local Environment

Create or update your `api/.env` file:

```bash
# Required for GCP authentication
GCP_PROJECT_ID=your-project-id

# Bucket names (these should match your Terraform output)
UPLOADS_BUCKET=aiquizmaker-prod-uploads
QUIZ_STORAGE_BUCKET=aiquizmaker-prod-quiz-storage

# Your OpenAI key
OPENAI_API_KEY=your-openai-api-key

# Local development settings
NODE_ENV=development
PORT=3001
WEB_URL=http://localhost:3000
```

### 5. Test the Configuration

Start your API locally:

```bash
cd api
npm install
npm run start:dev
```

Visit: http://localhost:3001/config

You should see:
```json
{
  "config": {
    "storage": {
      "gcsEnabled": true,
      "uploadsBucket": "✓ Configured",
      "quizStorageBucket": "✓ Configured",
      "gcpProjectId": "✓ Configured"
    }
  }
}
```

## 🧪 Testing Storage

### Test File Upload

```bash
# Upload a test file
curl -X POST http://localhost:3001/upload \
  -F "file=@/path/to/test.pdf" \
  -F "filename=test.pdf"
```

### Verify in GCS

```bash
# Check if file was uploaded
gsutil ls gs://aiquizmaker-prod-uploads/

# Download and verify
gsutil cp gs://aiquizmaker-prod-uploads/test.pdf ./downloaded-test.pdf
```

## 🔧 Troubleshooting

### Authentication Issues

**Error**: `Could not load the default credentials`

**Solution**:
```bash
# Re-authenticate
gcloud auth application-default login

# Check credentials
gcloud auth list
```

### Permission Issues

**Error**: `User does not have permission to access bucket`

**Solution**:
```bash
# Check your IAM permissions
gcloud projects get-iam-policy YOUR_PROJECT_ID

# Or grant yourself storage admin role
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="user:your-email@gmail.com" \
  --role="roles/storage.admin"
```

### Bucket Not Found

**Error**: `The specified bucket does not exist`

**Solution**:
1. Check if buckets exist: `gsutil ls`
2. Verify bucket names in your `.env` file
3. Create buckets if needed:
   ```bash
   gsutil mb gs://aiquizmaker-prod-uploads
   gsutil mb gs://aiquizmaker-prod-quiz-storage
   ```

## 🔄 Switching Between Local and GCS

The application automatically detects the environment:

- **GCS Mode**: When `UPLOADS_BUCKET` and `QUIZ_STORAGE_BUCKET` are set
- **Local Mode**: When bucket environment variables are missing

### Force Local Mode
```bash
# Comment out or remove bucket variables
# UPLOADS_BUCKET=aiquizmaker-prod-uploads
# QUIZ_STORAGE_BUCKET=aiquizmaker-prod-quiz-storage
```

### Force GCS Mode
```bash
# Set bucket variables
UPLOADS_BUCKET=aiquizmaker-prod-uploads
QUIZ_STORAGE_BUCKET=aiquizmaker-prod-quiz-storage
```

## 🚀 Best Practices

### Development Environment
- Use separate buckets for dev: `aiquizmaker-dev-uploads`
- Keep local fallback for offline development
- Use environment-specific prefixes

### Testing
- Test file uploads, downloads, and deletions
- Verify quiz persistence across restarts
- Check CORS settings work with your frontend

### Security
- Use service accounts for production
- Keep personal credentials for local development only
- Never commit `.env` files to version control

## 📊 Monitoring Usage

```bash
# Check storage usage
gcloud storage buckets describe gs://aiquizmaker-prod-uploads

# Monitor costs
gcloud billing budgets list

# View access logs
gcloud logging read "resource.type=gcs_bucket"
```

## 🔗 Related Documentation

- [GCP Deployment Guide](./gcp-deployment-summary.md)
- [Terraform GCP Setup](./Terraform-GCP-Deployment.md)
- [Storage Service Documentation](./storage-service-usage.md) 