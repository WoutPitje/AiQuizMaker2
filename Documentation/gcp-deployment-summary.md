# GCP Deployment Summary

## Quick Start

1. **Setup Terraform**
   ```bash
   cd terraform
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your project ID and OpenAI key
   terraform init
   terraform apply
   ```

2. **Point Domain**
   - Note the load balancer IP from Terraform output
   - Update your domain's A record to point to this IP

3. **Deploy API**
   ```bash
   export GCP_PROJECT_ID=your-project-id
   ./deploy-api.sh
   ```

4. **Deploy Frontend**
   ```bash
   export GCP_PROJECT_ID=your-project-id
   export DOMAIN_NAME=your-domain.com
   ./deploy-web.sh
   ```

## Architecture

```
Internet → Load Balancer → ┬→ /api/* → Cloud Run (API)
                          └→ /* → Cloud Storage (Static Site)
```

## Services Used

| Service | Purpose | Cost |
|---------|---------|------|
| Cloud Storage | Static site hosting + file storage | ~$1/month |
| Cloud Run | Serverless API hosting | $0 when idle |
| Load Balancer | HTTPS + routing | ~$18/month |
| Cloud CDN | Global content delivery | Usage-based |

## Key Features

- **Auto-scaling**: API scales from 0 to N instances
- **SSL**: Automatic certificate management
- **Storage**: Automatic switch between local (dev) and GCS (prod)
- **Cost**: ~$20-25/month for low traffic

## File Storage

The API automatically uses:
- **Local storage** when GCS environment variables are not set (development)
- **Google Cloud Storage** when deployed to GCP (production)

No code changes needed - just deploy!

## Monitoring

- API logs: `gcloud logging read "resource.type=cloud_run_revision"`
- API metrics: Cloud Console → Cloud Run → aiquizmaker-api
- Storage usage: Cloud Console → Storage → Buckets

## Updates

- **API**: Run `./deploy-api.sh` after code changes
- **Frontend**: Run `./deploy-web.sh` after code changes
- **Infrastructure**: Run `terraform apply` after Terraform changes 